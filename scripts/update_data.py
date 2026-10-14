#!/usr/bin/env python3
"""Build a sourced, dated snapshot from public commodity publications.

Run with: python scripts/update_data.py
Only official, published values are included. A failed feed preserves its last
valid figures and records the error status; no values are estimated.
"""

from __future__ import annotations

import csv
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, datetime, time, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from io import BytesIO, StringIO
import json
import math
import os
from pathlib import Path
import re
import sys
from threading import Lock
from time import monotonic, sleep
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urljoin
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "data" / "snapshot.json"
POWER_HISTORY = ROOT / "data" / "power_fr.json"
POWER_PRICES = ROOT / "data" / "power_prices.json"
HTML = ROOT / "index.html"
README = ROOT / "README.md"

OIL_URL = "https://ir.eia.gov/wpsr/table4.csv"
OIL_FLOW_URL = "https://ir.eia.gov/wpsr/table1.csv"
OIL_HISTORY_URL = "https://ir.eia.gov/wpsr/psw00.json"
OIL_REPORT_URL = "https://www.eia.gov/petroleum/supply/weekly/"
GAS_URL = "https://ir.eia.gov/ngs/wngsr.json"
GAS_REPORT_URL = "https://ir.eia.gov/ngs/ngs.html"
NEWS_URL = "https://www.eia.gov/rss/todayinenergy.xml"
CROP_PROGRESS_URL = "https://esmis.nal.usda.gov/publication/crop-progress"
SODIR_URL = "https://www.sodir.no/en/whats-new/news/production-figures/"
EIA_OIL_SPOT_URL = "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm"
EIA_GAS_SPOT_URL = "https://www.eia.gov/dnav/ng/NG_PRI_FUT_S1_D.htm"
GIE_URL = "https://agsi.gie.eu/api?type=eu&size=300"
GIE_REPORT_URL = "https://agsi.gie.eu/"
GIE_FR_URL = "https://agsi.gie.eu/api?country=fr&size=300"
ALSI_URL = "https://alsi.gie.eu/api?type=eu&size=14"
ALSI_FR_URL = "https://alsi.gie.eu/api?country=fr&size=14"
ALSI_REPORT_URL = "https://alsi.gie.eu/"
FRED_URL = "https://fred.stlouisfed.org/graph/fredgraph.csv"
OIL_PRICE_HISTORY_URL = FRED_URL + "?id=DCOILBRENTEU,DCOILWTICO&cosd=2025-09-01"
OIL_MIRROR_BASE = "https://raw.githubusercontent.com/datasets/oil-prices/main/data/"
RTE_REPORT_URL = "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/"
RTE_URL = ("https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/"
           "eco2mix-national-tr/records?limit=100&where=date_heure%20%3C%3D%20now%28%29"
           "&order_by=date_heure%20desc")
RTE_BACKFILL_PAGES = 8  # About eight days at the source's 15-minute resolution.
ENTSOE_URL = "https://web-api.tp.entsoe.eu/api"
ENTSOE_REPORT_URL = "https://transparency.entsoe.eu/"
POWER_ZONES = {"fr": "10YFR-RTE------C", "de": "10Y1001A1001A82H"}
POWER_PRICE_ZONES = {"fr": "FR", "de": "DE-LU", "be": "BE", "it_north": "IT-North"}
POWER_PRICE_SOURCE = "https://api.energy-charts.info/price"
TTF_NGP_URL = "https://gasandregistry.eex.com/Gas/NGP/TTF_NGP_15_Mins.csv"
TTF_NGP_HISTORY_URL = "https://gasandregistry.eex.com/Gas/NGP/TTF_NGP_60_Days.csv"
TTF_REPORT_URL = "https://www.eex.com/en/markets/natural-gas/gas-market-transparency"
WB_REPORT_URL = "https://www.worldbank.org/en/research/commodity-markets"
WB_MONTHLY_URL = ("https://thedocs.worldbank.org/en/doc/"
                  "74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Historical-Data-Monthly.xlsx")
ECB_FX_URL = "https://data-api.ecb.europa.eu/service/data/EXR/M.USD.EUR.SP00.A"
PARIS = ZoneInfo("Europe/Paris")
POWER_API_LOCK = Lock()
POWER_API_LAST_REQUEST = 0.0


def comparison_start(today: date) -> date:
    """Three complete prior calendar years plus the current year."""
    return date(today.year - 3, 1, 1)


def fetch_power_url(url: str) -> bytes:
    """Serialize this provider's calls, including concurrent recent/annual tasks."""
    global POWER_API_LAST_REQUEST
    for attempt in range(3):
        with POWER_API_LOCK:
            pause = 3 - (monotonic() - POWER_API_LAST_REQUEST)
            if pause > 0:
                sleep(pause)
            POWER_API_LAST_REQUEST = monotonic()
            try:
                return fetch(url)
            except HTTPError as error:
                if error.code != 429 or attempt == 2:
                    raise
                # Keep the shared source quiet while its rate limit clears.
                sleep(10 * (attempt + 1))
    raise ValueError("Power API unavailable")


def fetch(url: str, headers: dict[str, str] | None = None) -> bytes:
    req = Request(url, headers={"User-Agent": "CommodityCockpit/1.0 (personal research)", **(headers or {})})
    with urlopen(req, timeout=36) as response:
        data = response.read(5_000_000)
        if not data or len(data) >= 5_000_000:
            raise ValueError("response empty or unexpectedly large")
        return data


def metric(id: str, sector: str, label: str, value: float, unit: str,
           change: float | None, comparison: str, as_of: str,
           source: str, url: str, detail: str = "") -> dict:
    return dict(id=id, sector=sector, label=label, value=round(value, 3),
                unit=unit, change=round(change, 3) if change is not None else None,
                comparison=comparison, as_of=as_of, source=source, url=url,
                detail=detail)


def measured(value: object) -> float | None:
    """Keep missing/invalid telemetry out of published values."""
    if isinstance(value, bool) or value is None:
        return None
    try:
        result = float(value)
    except (ValueError, TypeError):
        return None
    return result if math.isfinite(result) else None


def fetch_rte_history() -> bytes:
    """Page official RTE records; latest page is mandatory, older pages best effort."""
    first = json.loads(fetch(RTE_URL))
    if not isinstance(first.get("results"), list):
        raise ValueError("RTE latest page missing")
    rows = list(first["results"])
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = [pool.submit(fetch, RTE_URL + "&offset=" + str(page * 100))
                   for page in range(1, RTE_BACKFILL_PAGES)]
        for future in futures:
            try:
                page = json.loads(future.result()).get("results", [])
                if isinstance(page, list):
                    rows.extend(page)
            except Exception as error:
                print("RTE history page unavailable: " + type(error).__name__, file=sys.stderr)
    return json.dumps({"results": rows}).encode("utf-8")


def parse_rte_power(raw: bytes, now: datetime) -> dict:
    document = json.loads(raw)
    rows = document.get("results") if isinstance(document, dict) else None
    if not isinstance(rows, list):
        raise ValueError("RTE records missing")
    points = []
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("date_heure"), str):
            continue
        try:
            stamp = datetime.fromisoformat(row["date_heure"].replace("Z", "+00:00"))
        except ValueError:
            continue
        if stamp.tzinfo is None or not now - timedelta(days=9) <= stamp <= now:
            continue
        demand = measured(row.get("consommation"))
        if demand is None or not 5000 <= demand <= 120000:
            continue
        point = {"at": stamp.astimezone(timezone.utc).isoformat(), "load": round(demand)}
        for field in ("prevision_j", "prevision_j1", "nucleaire", "eolien", "solaire",
                      "hydraulique", "gaz", "bioenergies", "charbon", "fioul",
                      "ech_physiques", "pompage", "taux_co2"):
            value = measured(row.get(field))
            if value is not None and -35000 <= value <= 120000:
                point[field] = round(value)
        points.append(point)
    points.sort(key=lambda row: row["at"])
    points = list({point["at"]: point for point in points}.values())
    if not points or datetime.fromisoformat(points[-1]["at"]) < now - timedelta(hours=30):
        sample = [row.get("date_heure") for row in (rows[:1] + rows[-1:]) if isinstance(row, dict)]
        raise ValueError("RTE observations unavailable or too old; sample times " + repr(sample))
    latest = points[-1]
    as_of = latest["at"][:10]
    time_label = "Observation " + latest["at"] + " UTC"
    values = [metric("power_load", "power", "Demande France", latest["load"], "MW",
                     latest["load"] - points[-5]["load"] if len(points) >= 5 else None,
                     "vs ~1 h", as_of, "RTE éCO2mix", RTE_REPORT_URL, time_label)]
    if "prevision_j" in latest and 5000 <= latest["prevision_j"] <= 120000:
        values.append(metric("power_load_gap", "power", "Écart à prévision de demande J",
                             latest["load"] - latest["prevision_j"], "MW", None,
                             "réalisé − prévision réactualisée le jour même", as_of,
                             "Calcul sur RTE éCO2mix", RTE_REPORT_URL, time_label))
    if "ech_physiques" in latest:
        values.append(metric("power_exchange", "power", "Solde des échanges physiques",
                             latest["ech_physiques"], "MW", None,
                             "export si négatif · import si positif", as_of,
                             "RTE éCO2mix", RTE_REPORT_URL, time_label))
    for field, label in (("nucleaire", "Nucléaire"), ("gaz", "Gaz électrique"),
                         ("eolien", "Éolien"), ("solaire", "Solaire"),
                         ("hydraulique", "Hydraulique"), ("bioenergies", "Bioénergies")):
        if field in latest and latest[field] >= 0:
            values.append(metric("power_" + field, "power", label, latest[field], "MW",
                                 None, "production observée", as_of, "RTE éCO2mix",
                                 RTE_REPORT_URL, time_label))
    if "eolien" in latest and "solaire" in latest:
        values.append(metric("power_residual", "power", "Demande résiduelle indicative",
                             latest["load"] - latest["eolien"] - latest["solaire"], "MW",
                             None, "demande − éolien − solaire", as_of,
                             "Calcul sur RTE éCO2mix", RTE_REPORT_URL,
                             "Calcul indicatif, sans jugement sur le prix ni l'appel au gaz. " + time_label))
    if "taux_co2" in latest:
        values.append(metric("power_carbon", "power", "Intensité CO₂ estimée",
                             latest["taux_co2"], "g/kWh", None,
                             "production française", as_of,
                             "RTE éCO2mix", RTE_REPORT_URL, time_label))
    return {"metrics": values, "points": points[-96:], "historic_points": points,
            "as_of": latest["at"],
            "url": RTE_REPORT_URL}


def merge_power_history(previous: dict, points: list[dict], now: datetime) -> dict:
    """Append hourly observations; retain up to 365 days without filling gaps."""
    cutoff = now - timedelta(days=365)
    combined = {}
    for point in [*previous.get("points", []), *points]:
        try:
            stamp = datetime.fromisoformat(point["at"].replace("Z", "+00:00"))
        except (KeyError, TypeError, ValueError):
            continue
        if stamp.tzinfo is None or not cutoff <= stamp <= now or not 5000 <= (measured(point.get("load")) or 0) <= 120000:
            continue
        # Last measured quarter within the UTC hour; no synthetic hourly averages.
        hour = stamp.astimezone(timezone.utc).strftime("%Y-%m-%dT%H")
        old = combined.get(hour)
        if old is None or point["at"] > old["at"]:
            combined[hour] = {key: point[key] for key in
                ("at", "load", "nucleaire", "gaz", "eolien", "solaire", "hydraulique",
                 "bioenergies", "charbon", "fioul", "ech_physiques") if key in point}
    ordered = sorted(combined.values(), key=lambda row: row["at"])
    return {"schema": 1, "source": "RTE éCO2mix national temps réel",
            "url": RTE_REPORT_URL, "quality": "observé provisoire · un relevé par heure UTC",
            "generated_at": now.isoformat(), "first_at": ordered[0]["at"] if ordered else None,
            "last_at": ordered[-1]["at"] if ordered else None, "points": ordered}


def save_power_history(previous: dict, result: dict, now: datetime) -> None:
    history = merge_power_history(previous, result.get("historic_points", []), now)
    if not history["points"]:
        raise ValueError("RTE power history empty")
    POWER_HISTORY.parent.mkdir(parents=True, exist_ok=True)
    POWER_HISTORY.write_text(json.dumps(history, ensure_ascii=False, separators=(",", ":")) + "\n",
                             encoding="utf-8")


def fetch_power_price(zone: str, now: datetime) -> bytes:
    """The provider declares the licence per response; parsing enforces it."""
    params = {"bzn": POWER_PRICE_ZONES[zone],
              "start": (now.date() - timedelta(days=9)).isoformat(),
              "end": (now.date() + timedelta(days=2)).isoformat()}
    return fetch_power_url(POWER_PRICE_SOURCE + "?" + urlencode(params))


def parse_power_price(raw: bytes, zone: str, now: datetime) -> dict:
    if zone not in POWER_PRICE_ZONES:
        raise ValueError("Unknown bidding zone")
    data = json.loads(raw)
    licence = data.get("license_info", "")
    if "CC BY 4.0" not in licence or "EUR" not in data.get("unit", "").upper():
        raise ValueError("Power price licence or currency not suitable for publication")
    stamps, prices = data.get("unix_seconds"), data.get("price")
    if not isinstance(stamps, list) or not isinstance(prices, list) or len(stamps) != len(prices):
        raise ValueError("Power price arrays invalid")
    points = []
    for stamp, value in zip(stamps, prices):
        price = measured(value)
        if not isinstance(stamp, int) or price is None or not -5000 <= price <= 5000:
            continue
        observed = datetime.fromtimestamp(stamp, timezone.utc)
        if now - timedelta(days=12) <= observed <= now + timedelta(days=3):
            points.append({"at": observed.isoformat(), "value": round(price, 2)})
    points = sorted({point["at"]: point for point in points}.values(), key=lambda point: point["at"])
    if len(points) < 20 or datetime.fromisoformat(points[-1]["at"]) < now - timedelta(days=3):
        raise ValueError("Power price publication incomplete or stale")
    return {"points": points, "as_of": points[-1]["at"],
            "url": "https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=" +
                   {"fr": "FR", "de": "DE", "be": "BE", "it_north": "IT"}[zone],
            "licence": licence, "provenance": "Fraunhofer ISE Energy-Charts · day-ahead"}


def merge_power_prices(previous: dict, results: dict, now: datetime) -> dict:
    cutoff = now - timedelta(days=365)
    series = {}
    licences = {}
    for zone in POWER_PRICE_ZONES:
        old = previous.get("series", {}).get(zone, [])
        incoming = results.get("power_price_" + zone)
        added = incoming.get("points", []) if isinstance(incoming, dict) else []
        licence = incoming.get("licence") if isinstance(incoming, dict) else None
        licence = licence or previous.get("licence", {}).get(zone)
        if licence:
            licences[zone] = licence
        by_time = {}
        for point in [*old, *added]:
            try:
                stamp = datetime.fromisoformat(point["at"])
            except (KeyError, TypeError, ValueError):
                continue
            value = measured(point.get("value"))
            if stamp.tzinfo and cutoff <= stamp <= now + timedelta(days=3) and value is not None and -5000 <= value <= 5000:
                by_time[point["at"]] = {"at": point["at"], "value": round(value, 2)}
        series[zone] = sorted(by_time.values(), key=lambda point: point["at"])
    return {"schema": 1, "source": "Fraunhofer ISE Energy-Charts",
            "market": "day-ahead auction · France, DE-LU, Belgium, Italy North",
            "unit": "EUR/MWh", "generated_at": now.isoformat(), "series": series,
            "licence": licences}


def save_power_prices(previous: dict, results: dict, now: datetime) -> None:
    prices = merge_power_prices(previous, results, now)
    if not prices["series"]["fr"] and not prices["series"]["de"]:
        raise ValueError("No licensed power prices to publish")
    POWER_PRICES.write_text(json.dumps(prices, ensure_ascii=False, separators=(",", ":")) + "\n",
                            encoding="utf-8")


def parse_power_daily(raw: bytes, start: date, end: date) -> dict:
    """Duration-weighted delivery-day averages, including 23/25-hour Paris days."""
    data = json.loads(raw)
    licence = data.get("license_info", "")
    if "CC BY 4.0" not in licence or "EUR" not in str(data.get("unit", "")).upper():
        raise ValueError("Historical power licence or currency invalid")
    stamps, prices = data.get("unix_seconds"), data.get("price")
    if not isinstance(stamps, list) or not isinstance(prices, list) or len(stamps) != len(prices):
        raise ValueError("Historical power arrays invalid")
    by_stamp = {stamp: measured(value) for stamp, value in zip(stamps, prices)
                if isinstance(stamp, int)}
    ordered = sorted(by_stamp)
    steps = [b - a for a, b in zip(ordered, ordered[1:]) if 0 < b - a <= 3600]
    if not steps:
        raise ValueError("Historical power delivery intervals missing")
    # Missing observations never get the whole gap attributed to one price.
    default_step = sorted(steps)[len(steps) // 2]
    days = {}
    for i, stamp in enumerate(ordered):
        value = by_stamp[stamp]
        day = datetime.fromtimestamp(stamp, PARIS).date()
        if value is None or not -5000 <= value <= 5000 or not start <= day <= end:
            continue
        nearby = [ordered[j + 1] - ordered[j] for j in range(max(0, i - 1), min(len(ordered) - 1, i + 2))
                  if 0 < ordered[j + 1] - ordered[j] <= 3600]
        step = sorted(nearby)[len(nearby) // 2] if nearby else default_step
        duration = min(ordered[i + 1] - stamp, step) if i + 1 < len(ordered) else step
        if duration <= 0:
            continue
        total, seconds = days.get(day, (0.0, 0))
        days[day] = (total + value * duration, seconds + duration)
    points = []
    for day, (total, seconds) in sorted(days.items()):
        midnight = datetime.combine(day, time.min, PARIS).astimezone(timezone.utc)
        following = datetime.combine(day + timedelta(days=1), time.min, PARIS).astimezone(timezone.utc)
        expected = int((following - midnight).total_seconds())
        if expected * .99 <= seconds <= expected:
            points.append({"date": day.isoformat(), "value": round(total / seconds, 2)})
    if not points:
        raise ValueError("No complete historical power delivery day")
    return {"points": points, "licence": licence}


def fetch_power_seasonal(previous: dict, now: datetime) -> dict:
    today = now.astimezone(PARIS).date()
    old = {p["date"]: p for p in previous.get("history", {}).get("power_prices_daily", [])
           if isinstance(p, dict) and isinstance(p.get("date"), str) and
           comparison_start(today).isoformat() <= p["date"] <= today.isoformat() and
           measured(p.get("value")) is not None}
    licence = previous.get("sources", {}).get("power_seasonal", {}).get("licence", "")
    requests = []
    for year in range(today.year - 3, today.year + 1):
        start, end = date(year, 1, 1), date(year, 12, 31)
        covered = sum(p.startswith(str(year)) for p in old)
        if year < today.year and covered >= (end - start).days:
            continue
        if year == today.year:
            end = today
            if covered >= (today - start).days - 3:
                start = max(start, today - timedelta(days=10))
        requests.append((start, end))
    def collect(bounds):
        start, end = bounds
        url = POWER_PRICE_SOURCE + "?" + urlencode({"bzn": "FR", "start": start.isoformat(),
                                                     "end": end.isoformat()})
        return parse_power_daily(fetch_power_url(url), start, end)
    for bounds in requests:
        result = collect(bounds)
        licence = result["licence"]
        old.update({p["date"]: p for p in result["points"]})
    points = sorted(old.values(), key=lambda p: p["date"])
    if not points or "CC BY 4.0" not in licence:
        raise ValueError("Seasonal power history unavailable")
    return {"points": points, "as_of": points[-1]["date"], "licence": licence,
            "url": "https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=FR",
            "provenance": "Moyenne quotidienne pondérée par durée · Fraunhofer / SMARD"}


def xlsx_rows(raw: bytes, sheet_name: str) -> list[dict[str, str]]:
    """Read a named official XLSX sheet using the Python standard library."""
    with ZipFile(BytesIO(raw)) as book:
        if sum(info.file_size for info in book.infolist()) > 30_000_000:
            raise ValueError("Spreadsheet unexpectedly large")
        shared = ET.fromstring(book.read("xl/sharedStrings.xml"))
        strings = ["".join(node.itertext()) for node in shared]
        workbook = ET.fromstring(book.read("xl/workbook.xml"))
        sheet = next((s for s in workbook.findall(".//{*}sheet")
                      if s.get("name") == sheet_name), None)
        if sheet is None:
            raise ValueError("Spreadsheet price sheet missing")
        rel_id = sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        rels = ET.fromstring(book.read("xl/_rels/workbook.xml.rels"))
        target = next((r.get("Target") for r in rels if r.get("Id") == rel_id), "")
        path = target.lstrip("/") if target.startswith("/") else "xl/" + target
        root = ET.fromstring(book.read(path))
        rows = []
        for row in root.findall(".//{*}row"):
            values = {}
            for cell in row:
                value = cell.findtext("{*}v")
                if cell.get("t") == "s" and value is not None:
                    value = strings[int(value)]
                elif cell.get("t") == "inlineStr":
                    value = "".join(cell.find("{*}is").itertext())
                if value is not None:
                    values[re.sub(r"\d", "", cell.get("r", ""))] = value
            rows.append(values)
        return rows


def parse_ttf_monthly(raw: bytes, fx_raw: bytes, today: date) -> dict:
    rows = xlsx_rows(raw, "Monthly Prices")
    header = next((r for r in rows if "Natural gas, Europe" in r.values()), None)
    if header is None:
        raise ValueError("World Bank TTF column missing")
    column = next(k for k, v in header.items() if v == "Natural gas, Europe")
    header_pos = rows.index(header)
    if not any("mmbtu" in str(r.get(column, "")).lower() for r in rows[header_pos + 1:header_pos + 4]):
        raise ValueError("World Bank TTF unit changed")
    fx = {}
    for row in csv.DictReader(StringIO(fx_raw.decode("utf-8-sig"))):
        value = measured(row.get("OBS_VALUE"))
        if (row.get("FREQ") == "M" and row.get("CURRENCY") == "USD" and
                row.get("CURRENCY_DENOM") == "EUR" and value is not None and .5 < value < 2):
            fx[row["TIME_PERIOD"]] = value
    points = []
    for row in rows[header_pos + 1:]:
        month = str(row.get("A", ""))
        if not re.fullmatch(r"20\d\dM\d\d", month):
            continue
        day = date(int(month[:4]), int(month[-2:]), 1)
        value, exchange = measured(row.get(column)), fx.get(day.strftime("%Y-%m"))
        if comparison_start(today) <= day <= today and value is not None and 0 < value < 150 and exchange:
            points.append({"date": day.isoformat(), "value": round(value * 3.412141633 / exchange, 2),
                           "usd_mmbtu": value, "usd_per_eur": exchange})
    points.sort(key=lambda p: p["date"])
    if len(points) < 12 or (today - date.fromisoformat(points[-1]["date"])).days > 100:
        raise ValueError("World Bank TTF history incomplete or stale")
    return {"points": points, "as_of": points[-1]["date"][:7], "url": WB_REPORT_URL,
            "provenance": "TTF · moyenne mensuelle Banque mondiale · conversion BCE EUR/MWh",
            "licence": "Banque mondiale · conditions des jeux de données ; attribution BCE pour le change"}


def fetch_ttf_monthly(today: date) -> dict:
    # Follow the current public workbook link: World Bank changes its folder each year.
    landing = fetch(WB_REPORT_URL).decode("utf-8", "replace")
    links = re.findall(r'href=["\']([^"\']*CMO-Historical-Data-Monthly\.xlsx)["\']', landing, re.I)
    url = unescape(links[0]) if links else WB_MONTHLY_URL
    if not url.startswith("https://thedocs.worldbank.org/"):
        raise ValueError("Unexpected World Bank workbook URL")
    return parse_ttf_monthly(fetch(url), fetch(ECB_FX_URL + "?" + urlencode({
        "startPeriod": comparison_start(today).strftime("%Y-%m"), "format": "csvdata"})), today)


def parse_ttf_ngp(raw: bytes, history_raw: bytes, now: datetime) -> dict:
    today = now.astimezone(PARIS).date()
    rows = csv.DictReader(StringIO(raw.decode("utf-8-sig")), delimiter=";")
    current = None
    for row in rows:
        day = datetime.strptime(row["Gasday"], "%d/%m/%Y").date()
        value = measured(row.get("IndexValue (€/MWh)"))
        stamp = datetime.strptime(row["Timestamp Let"], "%d/%m/%Y %H:%M").replace(tzinfo=PARIS)
        if day == today and value is not None and 0 < value < 2000 and now - timedelta(hours=30) <= stamp <= now + timedelta(hours=1):
            current = (day, value, stamp, row.get("Status", ""))
    if current is None:
        raise ValueError("TTF current gas day or timestamp missing")
    day, value, stamp, status = current
    points = []
    for row in csv.DictReader(StringIO(history_raw.decode("utf-8-sig")), delimiter=";"):
        dated = date.fromisoformat(row["Delivery date"])
        price = measured(row.get("Index Value (€/MWh)"))
        if dated <= today and price is not None and 0 < price < 2000:
            points.append({"date": dated.isoformat(), "value": price})
    points.sort(key=lambda p: p["date"])
    previous = next((p for p in reversed(points) if p["date"] < day.isoformat()), None)
    item = metric("price_ttf", "gas", "TTF · indice spot NGP", value, "€/MWh",
                  value - previous["value"] if previous else None, "vs dernier NGP final",
                  day.isoformat(), "EEX · TTF Neutral Gas Price", TTF_REPORT_URL,
                  "Indice pondéré de transactions spot ; provisoire pendant la journée gazière.")
    item.update(observed_at=stamp.astimezone(timezone.utc).isoformat(),
                quality="provisoire" if "Temporary" in status else "final")
    return {"metrics": [item], "points": points, "as_of": item["observed_at"],
            "url": TTF_REPORT_URL, "provenance": "EEX · TTF NGP · moyenne spot pondérée"}


def entsoe_query(zone: str, now: datetime, token: str) -> bytes:
    midnight = now.replace(hour=0, minute=0, second=0, microsecond=0)
    params = {"documentType": "A65", "processType": "A01", "businessType": "A04",
              "outBiddingZone_Domain": POWER_ZONES[zone],
              "periodStart": (midnight - timedelta(days=1)).strftime("%Y%m%d%H%M"),
              "periodEnd": (midnight + timedelta(days=3)).strftime("%Y%m%d%H%M"),
              "securityToken": token}
    # Never print the request URL or its HTTPError: it contains a personal token.
    return fetch(ENTSOE_URL + "?" + urlencode(params))


def parse_entsoe_forecast(raw: bytes, zone: str, now: datetime) -> dict:
    root = ET.fromstring(raw)
    if root.tag.split("}")[-1] != "GL_MarketDocument":
        raise ValueError("ENTSO-E forecast document unavailable")
    if root.findtext("{*}type") != "A65" or root.findtext("{*}process.processType") != "A01":
        raise ValueError("ENTSO-E returned a different data item")
    points = {}
    for series in root.findall("{*}TimeSeries"):
        if series.findtext("{*}businessType") not in (None, "A04"):
            continue
        unit = series.findtext("{*}quantity_Measure_Unit.name")
        if unit not in ("MAW", "MW"):
            continue
        for block in series.findall("{*}Period"):
            stamp_text = block.findtext("{*}timeInterval/{*}start")
            interval = {"PT15M": 15, "PT30M": 30, "PT60M": 60}.get(block.findtext("{*}resolution"))
            if not stamp_text or not interval:
                continue
            start = datetime.fromisoformat(stamp_text.replace("Z", "+00:00"))
            for item in block.findall("{*}Point"):
                position = measured(item.findtext("{*}position"))
                quantity = measured(item.findtext("{*}quantity"))
                if position is None or position < 1 or position != int(position) or quantity is None or not 5000 <= quantity <= 150000:
                    continue
                stamp = start + timedelta(minutes=(int(position) - 1) * interval)
                if now - timedelta(hours=2) <= stamp <= now + timedelta(days=2):
                    points[stamp.astimezone(timezone.utc).isoformat()] = round(quantity)
    upcoming = sorted((stamp, amount) for stamp, amount in points.items()
                      if now <= datetime.fromisoformat(stamp) < now + timedelta(hours=24))
    if len(upcoming) < 4:
        raise ValueError("ENTSO-E future forecast missing")
    peak_at, peak = max(upcoming, key=lambda point: point[1])
    label = "France" if zone == "fr" else "Allemagne/Luxembourg"
    m = metric("power_forecast_" + zone, "power", "Pic prévu 24 h · " + label,
               peak, "MW", None, "prévision J-1, 24 h glissantes", peak_at[:10],
               "ENTSO-E · prévision J-1", ENTSOE_REPORT_URL, "Pic prévu à " + peak_at + " UTC")
    return {"metrics": [m], "as_of": peak_at, "url": ENTSOE_REPORT_URL}


def parse_oil(raw: bytes) -> dict:
    text = raw.decode("utf-8-sig", "replace")
    rows = list(csv.reader(StringIO(text)))
    if len(rows) < 15 or len(rows[0]) < 4:
        raise ValueError("EIA oil CSV missing columns")
    period = datetime.strptime(rows[0][1].strip(), "%m/%d/%y").date().isoformat()
    previous = datetime.strptime(rows[0][2].strip(), "%m/%d/%y").date()
    if previous >= date.fromisoformat(period):
        raise ValueError("EIA oil dates out of order")
    by_name = {r[0].strip(): r for r in rows[1:] if len(r) >= 4}
    definitions = [
        ("oil_crude", "Stocks commerciaux de brut", "Commercial (Excluding SPR)", (100, 800)),
        ("oil_cushing", "Stocks de Cushing", "Cushing", (1, 100)),
        ("oil_gulf", "Stocks de brut Gulf Coast", "Gulf Coast (PADD 3)", (50, 500)),
        ("oil_gasoline", "Stocks d’essence", "Total Motor Gasoline", (80, 400)),
        ("oil_distillate", "Stocks de distillats", "Distillate Fuel Oil", (40, 350)),
        ("oil_jet", "Stocks de jet fuel", "Kerosene-Type Jet Fuel", (10, 100)),
        ("oil_spr", "Réserve stratégique US", "SPR", (100, 900)),
    ]
    result = []
    for id, label, name, (low, high) in definitions:
        row = by_name[name]
        value, prev, difference = (float(row[i].replace(",", "")) for i in (1, 2, 3))
        if not low <= value <= high or abs(value - prev - difference) > 0.02:
            raise ValueError("EIA oil unit or change mismatch: " + name)
        result.append(metric(id, "oil", label, value, "M bbl", difference,
                             "sur 1 semaine", period, "EIA WPSR", OIL_REPORT_URL))
    return {"metrics": result, "as_of": period, "url": OIL_REPORT_URL}


def parse_oil_flows(raw: bytes) -> dict:
    rows = list(csv.reader(StringIO(raw.decode("utf-8-sig", "replace"))))
    header = next((row for row in rows if len(row) > 5 and row[:2] == ["STUB_1", "STUB_2"]), None)
    if not header:
        raise ValueError("EIA oil flow table header missing")
    period = datetime.strptime(header[2].strip(), "%m/%d/%y").date().isoformat()
    definitions = [
        ("oil_production", "Production de brut US", "Crude Oil Supply", "Domestic Production", 5, 20),
        ("oil_imports", "Importations de brut US", "Crude Oil Supply", "Imports", 2, 20),
        ("oil_exports", "Exportations de brut US", "Crude Oil Supply", "Exports", 0.1, 12),
        ("oil_refinery", "Brut traité par les raffineries US", "Crude Oil Supply", "Crude Oil Input to Refineries", 5, 25),
    ]
    result = []
    for id, label, category, row_name, low, high in definitions:
        matches = [row for row in rows if len(row) > 5 and row[0].strip() == category and
                   re.sub(r"^\(\d+\)\s*", "", row[1].strip()) == row_name]
        if len(matches) != 1:
            raise ValueError("EIA oil flow missing or ambiguous: " + row_name)
        current, previous, reported_change = (float(matches[0][n].replace(",", "")) / 1000 for n in (2, 3, 4))
        if not low <= current <= high or abs(current - previous - reported_change) > 0.02:
            raise ValueError("EIA oil flow unit or change mismatch: " + row_name)
        result.append(metric(id, "oil", label, current, "M bbl/j", current - previous,
                             "sur 1 semaine", period, "EIA WPSR", OIL_REPORT_URL,
                             "Débit quotidien moyen de la semaine"))
    return {"metrics": result, "as_of": period, "url": OIL_REPORT_URL}


def parse_oil_history(raw: bytes, today: date | None = None) -> dict:
    report = json.loads(raw.decode("utf-8-sig"))
    series = report["data"]["U.S."]["time_series"]
    today = today or datetime.now(PARIS).date()
    start = comparison_start(today)
    points = {}
    for item in series:
        if item.get("suppression_flag") or item.get("value") is None:
            continue
        observed = date.fromisoformat(item["date"])
        value = measured(item["value"])
        if start <= observed <= today and value is not None and 100000 <= value <= 800000:
            points[observed.isoformat()] = {"date": observed.isoformat(), "value": round(value / 1000, 3)}
    points = sorted(points.values(), key=lambda x: x["date"])
    if len(points) < 12 or (today - date.fromisoformat(points[-1]["date"])).days > 21:
        raise ValueError("EIA historical crude series invalid")
    return {"points": points, "as_of": points[-1]["date"],
            "published": report["metadata"].get("release_date"), "url": OIL_REPORT_URL}


def parse_oil_price_history(raw: bytes, today: date) -> dict:
    """Official daily spot history for context only; never a live quote."""
    rows = csv.DictReader(StringIO(raw.decode("utf-8-sig", "replace")))
    fields = set(rows.fieldnames or [])
    day_field = "observation_date" if "observation_date" in fields else "DATE"
    if not {day_field, "DCOILBRENTEU", "DCOILWTICO"} <= fields:
        raise ValueError("FRED oil price columns missing")
    cutoff = comparison_start(today)
    series = {"brent": [], "wti": []}
    for row in rows:
        try:
            day = date.fromisoformat(row[day_field])
        except (ValueError, TypeError):
            continue
        if not cutoff <= day <= today:
            continue
        for name, column in (("brent", "DCOILBRENTEU"), ("wti", "DCOILWTICO")):
            value = measured(row[column])
            if value is not None and 5 <= value <= 300:
                series[name].append({"date": day.isoformat(), "value": round(value, 2)})
    if min(map(len, series.values())) < 100 or max(
            (today - date.fromisoformat(points[-1]["date"])).days for points in series.values()) > 15:
        raise ValueError("FRED oil history missing or stale")
    return {"series": series, "as_of": max(series["brent"][-1]["date"], series["wti"][-1]["date"]),
            "url": "https://fred.stlouisfed.org/"}


def parse_oil_price_mirror(brent_raw: bytes, wti_raw: bytes, today: date) -> dict:
    """Secondary, dated EIA mirror when FRED cannot be reached by Actions."""
    series = {}
    cutoff = comparison_start(today)
    for name, raw in (("brent", brent_raw), ("wti", wti_raw)):
        reader = csv.DictReader(StringIO(raw.decode("utf-8-sig", "replace")))
        if not {"Date", "Price"} <= set(reader.fieldnames or []):
            raise ValueError("EIA mirror columns missing")
        points = []
        for row in reader:
            try:
                day = date.fromisoformat(row["Date"])
            except (TypeError, ValueError):
                continue
            value = measured(row["Price"])
            if cutoff <= day <= today and value is not None and 5 <= value <= 300:
                points.append({"date": day.isoformat(), "value": round(value, 2)})
        points.sort(key=lambda point: point["date"])
        if len(points) < 100 or (today - date.fromisoformat(points[-1]["date"])).days > 15:
            raise ValueError("EIA mirror series incomplete or stale")
        series[name] = points
    return {"series": series, "as_of": max(series["brent"][-1]["date"], series["wti"][-1]["date"]),
            "url": "https://github.com/datasets/oil-prices",
            "provenance": "EIA · miroir datasets/oil-prices"}


def fetch_oil_price_history(today: date) -> dict:
    try:
        url = FRED_URL + "?" + urlencode({"id": "DCOILBRENTEU,DCOILWTICO",
                                         "cosd": comparison_start(today).isoformat()})
        return parse_oil_price_history(fetch(url), today)
    except Exception:
        return parse_oil_price_mirror(fetch(OIL_MIRROR_BASE + "brent-daily.csv"),
                                      fetch(OIL_MIRROR_BASE + "wti-daily.csv"), today)


def crop_progress_link(raw: bytes) -> str:
    html = raw.decode("utf-8", "replace")
    links = re.findall(r'href=["\']([^"\']+\.txt)["\']', html, re.I)
    match = next((link for link in links if "/sites/default/release-files/" in link), None)
    if not match:
        raise ValueError("USDA latest crop report link missing")
    url = urljoin(CROP_PROGRESS_URL, unescape(match))
    if not url.startswith("https://esmis.nal.usda.gov/sites/default/release-files/"):
        raise ValueError("USDA crop report URL unexpected")
    return url


def parse_crop_progress(raw: bytes, url: str, today: date) -> dict:
    text = raw.decode("utf-8-sig", "replace")
    release = re.search(r"Released ([A-Za-z]+ \d{1,2}, 20\d{2})", text)
    if not release:
        raise ValueError("USDA crop progress date missing")
    published = datetime.strptime(release.group(1), "%B %d, %Y").date()
    if not timedelta(0) <= today - published <= timedelta(days=20):
        raise ValueError("USDA crop progress report stale")
    week = re.search(r"Week Ending ([A-Za-z]+ \d{1,2}, 20\d{2})", text)
    if not week:
        raise ValueError("USDA observation week missing")
    observed = datetime.strptime(week.group(1), "%B %d, %Y").date()
    if not timedelta(0) <= published - observed <= timedelta(days=3):
        raise ValueError("USDA measurement/publication dates inconsistent")

    def fields(row):
        return [None if value == "(NA)" else 0 if value == "-" else int(value)
                for value in re.findall(r"\(NA\)|\d+|-", row)]

    result = []
    for crop, label, prefix in (("Corn", "Maïs US", "corn"), ("Soybean", "Soja US", "soy")):
        condition = re.search(rf"{crop} Condition - Selected States:.*?(?=\n\s*(?:Corn|Soybeans?|Cotton) [A-Z]|\Z)", text, re.S)
        if condition:
            current = re.search(r"18 States\s*\.{2,}:([^\n]+)", condition.group())
            previous = re.search(r"Previous year\s*\.{2,}:([^\n]+)", condition.group())
            current_parts = fields(current.group(1)) if current else []
            old_parts = fields(previous.group(1)) if previous else []
            if len(current_parts) == 5 and all(v is not None for v in current_parts) and sum(current_parts) == 100:
                value = sum(current_parts[-2:])
                known = len(old_parts) == 5 and all(v is not None for v in old_parts) and sum(old_parts) == 100
                difference = value - sum(old_parts[-2:]) if known else None
                result.append(metric("ag_"+prefix+"_condition", "agri", label+" · bon/excellent",
                                     value, "%", difference, "vs même date N−1" if known else "N−1 non publié",
                                     observed.isoformat(), "USDA NASS Crop Progress", url,
                                     "Part bonne/excellente · 18 États majeurs" + ("" if known else " · comparaison N−1 indisponible dans le rapport")))
        harvest = re.search(rf"{crop}s? Harvested - Selected States(.*?)(?=\n\s*(?:Corn|Soybean) Condition|\Z)", text, re.S)
        if harvest:
            row = re.search(r"18 States\s*\.{2,}:([^\n]+)", harvest.group(1))
            parts = fields(row.group(1)) if row else []
            if len(parts) == 4:
                old, previous, current, average = parts
                if current is not None and 0 <= current <= 100 and (average is None or 0 <= average <= 100):
                    detail = (f"{old} % à la même date N−1" if old is not None else "N−1 non publié")
                    if previous is not None:
                        detail += f" · {previous} % semaine précédente"
                    result.append(metric("ag_"+prefix+"_harvest", "agri", label+" · récolté",
                                         current, "%", current-average if average is not None else None,
                                         "vs moyenne 5 ans" if average is not None else "moyenne 5 ans non publiée",
                                         observed.isoformat(), "USDA NASS Crop Progress", url, detail))
    if len(result) < 2:
        raise ValueError("USDA crop report national tables missing")
    return {"metrics": result, "as_of": observed.isoformat(), "published": published.isoformat(), "url": url}


def fetch_crop_progress(today: date) -> dict:
    """Use dated official release pages if the publication index is stale/broken."""
    candidates = [CROP_PROGRESS_URL]
    monday = today - timedelta(days=today.weekday())
    # Holiday releases may be on Tuesday. An older index must not stop the
    # search before the actual dated publication of the current week.
    for offset in range(8):
        candidates.append(CROP_PROGRESS_URL + "/" + (today - timedelta(days=offset)).isoformat())
    candidates.append(CROP_PROGRESS_URL + "/" + (monday - timedelta(days=7)).isoformat())
    reports = []
    for page in candidates:
        try:
            url = crop_progress_link(fetch(page))
            report = parse_crop_progress(fetch(url), url, today)
            reports.append(report)
            if date.fromisoformat(report["published"]) >= monday:
                break
        except (OSError, ValueError):
            continue
    if not reports:
        raise ValueError("USDA Crop Progress official release unavailable; retain archive")
    return max(reports, key=lambda report: report["as_of"])


def parse_gas(raw: bytes) -> dict:
    report = json.loads(raw.decode("utf-8-sig"))
    period = report["current_week"]
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", period):
        raise ValueError("EIA gas date invalid")
    names = {
        "total lower 48 states": ("gas_us", "Stockage de gaz US · Lower 48", (500, 5000)),
        "east region": ("gas_east", "Stockage gaz · East US", (100, 1700)),
        "midwest region": ("gas_midwest", "Stockage gaz · Midwest US", (100, 1700)),
        "south central region": ("gas_south", "Stockage gaz · South Central US", (100, 2500)),
    }
    result = []
    for item in report["series"]:
        key = item["name"].strip().lower()
        if key not in names:
            continue
        id, label, (low, high) = names[key]
        current, previous = item["data"][:2]
        value, prev = float(current[1]), float(previous[1])
        if current[0] != period or not low <= value <= high or abs(value - prev) > 500:
            raise ValueError("EIA gas mismatch: " + key)
        five_year = item.get("calculated", {}).get("pct-chg_5yr-avg")
        detail = (f"{float(five_year):+.1f} % vs moyenne 5 ans" if five_year is not None else "")
        result.append(metric(id, "gas", label, value, "Bcf", value - prev,
                             "sur 1 semaine", period, "EIA WNGSR", GAS_REPORT_URL, detail))
    if not any(item["id"] == "gas_us" for item in result):
        raise ValueError("EIA gas Lower 48 series missing")
    return {"metrics": result, "as_of": period, "url": GAS_REPORT_URL}


def rows_between(text: str, start: str, end: str) -> str:
    match = re.search(start + r"([\s\S]*?)" + end, text, re.I | re.M)
    if not match:
        raise ValueError("WASDE section missing: " + start)
    return match.group(1)


def row_four(section: str, label: str) -> tuple[float, float]:
    match = re.search(r"^\s*" + re.escape(label) + r"\s+(-?[\d,.]+)\s+(-?[\d,.]+)\s+(-?[\d,.]+)\s+(-?[\d,.]+)\s*$", section, re.M)
    if not match:
        raise ValueError("WASDE row missing: " + label)
    return tuple(float(x.replace(",", "")) for x in match.groups()[-2:])


def parse_wasde(raw: bytes, url: str) -> dict:
    text = raw.decode("utf-8-sig", "replace").replace("\r\n", "\n")
    month_tag = re.search(r"WASDE\s+-\s+\d+\s+-\s+8\s+(\w+\s+20\d\d)", text)
    if not month_tag:
        raise ValueError("WASDE report month missing")
    month = datetime.strptime(month_tag.group(1), "%B %Y").strftime("%Y-%m")
    corn_page = rows_between(text, r"U\.S\. Feed Grain and Corn Supply and Use", r"U\.S\. Sorghum, Barley, and Oats Supply and Use")
    corn = rows_between(corn_page, r"^CORN\s*$", r"^Avg\.FarmPrice \(\$/bu\)")
    soy_page = rows_between(text, r"U\.S\. Soybeans and Products Supply and Use \(Domestic Measure\)", r"U\.S\. Sugar Supply and Use")
    soy = rows_between(soy_page, r"^SOYBEANS\s*$", r"^SOYBEAN OIL\s*$")
    corn_production_old, corn_production = row_four(corn, "Production")
    corn_stock_old, corn_stock = row_four(corn, "Ending Stocks")
    corn_exports_old, corn_exports = row_four(corn, "Exports")
    soy_production_old, soy_production = row_four(soy, "Production")
    soy_stock_old, soy_stock = row_four(soy, "Ending Stocks")
    soy_exports_old, soy_exports = row_four(soy, "Exports")

    # World wheat: the two projected rows in the first World wheat summary.
    summary = rows_between(text, r"World and U\.S\. Supply and Use for Grains\s+1/", r"^\s+United States\s*$")
    wheat = rows_between(summary, r"^Wheat\s*$", r"^Coarse Grains")
    projection = wheat.split("(Proj.)", 1)[-1]
    wheat_rows = [line for line in projection.splitlines() if re.match(r"^\s*[A-Z][a-z]{2}\s+\d", line)]
    if len(wheat_rows) < 2:
        raise ValueError("WASDE world wheat projections missing")
    wheat_old, wheat_stock = [float(line.split()[-1]) for line in wheat_rows[-2:]]
    wheat_trade_old, wheat_trade = [float(line.split()[-3]) for line in wheat_rows[-2:]]

    # World corn: continuation table, projected year, World row and monthly projections.
    world_corn = rows_between(text, r"World Corn Supply and Use\s+1/\s+\(Contd\.\)", r"WASDE\s+-\s+\d+\s+-\s+24")
    world_projection = rows_between(world_corn, r"20\d\d/\d\d\s+Proj\.\s*World\s+3/", r"World Less China")
    world_rows = [line for line in world_projection.splitlines() if re.match(r"^\s*[A-Z][a-z]{2}\s+\d", line)]
    if len(world_rows) < 2:
        raise ValueError("WASDE world corn projections missing")
    world_old, world_stock = [float(line.split()[-1]) for line in world_rows[-2:]]
    if not (5000 < corn_production < 20000 and 200 < corn_stock < 5000 and
            1000 < corn_exports < 6000 and 2000 < soy_production < 8000 and
            50 < soy_stock < 2000 and 500 < soy_exports < 4000 and
            100 < world_stock < 500 and 100 < wheat_stock < 500 and 50 < wheat_trade < 400):
        raise ValueError("WASDE figure outside expected range")

    specs = [
        ("ag_corn_output", "Production maïs US", corn_production, corn_production_old, "M bu"),
        ("ag_corn_stocks", "Stocks finaux maïs US", corn_stock, corn_stock_old, "M bu"),
        ("ag_corn_exports", "Exportations prévues maïs US", corn_exports, corn_exports_old, "M bu"),
        ("ag_soy_output", "Production soja US", soy_production, soy_production_old, "M bu"),
        ("ag_soy_stocks", "Stocks finaux soja US", soy_stock, soy_stock_old, "M bu"),
        ("ag_soy_exports", "Exportations prévues soja US", soy_exports, soy_exports_old, "M bu"),
        ("ag_world_corn", "Stocks mondiaux de maïs", world_stock, world_old, "Mt"),
        ("ag_world_wheat", "Stocks mondiaux de blé", wheat_stock, wheat_old, "Mt"),
        ("ag_world_wheat_trade", "Commerce mondial de blé prévu", wheat_trade, wheat_trade_old, "Mt"),
    ]
    metrics = [metric(id, "agri", label, value, unit, value - old,
                      "vs rapport précédent", month, "USDA WASDE", url,
                      "Prévision de campagne, révisable")
               for id, label, value, old, unit in specs]
    return {"metrics": metrics, "as_of": month, "url": url}


def fetch_wasde(today: date) -> dict:
    archive_page = None
    for month_delta in range(3):
        year = today.year
        month = today.month - month_delta
        while month <= 0:
            month += 12
            year -= 1
        url = f"https://www.usda.gov/oce/commodity/wasde/wasde{month:02d}{year % 100:02d}.txt"
        try:
            for attempt in range(2):
                try:
                    return parse_wasde(fetch(url), url)
                except URLError as error:
                    if isinstance(error, HTTPError) or attempt == 1:
                        raise
                    sleep(1)
        except (HTTPError, URLError, ValueError):
            # NAL ESMIS is the USDA's official archive, not a third-party price.
            # Some runners receive 403/5xx from the legacy USDA endpoint.
            root = "https://esmis.nal.usda.gov/publication/world-agricultural-supply-and-demand-estimates"
            try:
                if archive_page is None:
                    archive_page = fetch(root).decode("utf-8", "replace")
                filename = f"wasde{month:02d}{year % 100:02d}.txt"
                links = re.findall(r'href=["\']([^"\']+\.txt)["\']', archive_page, re.I)
                link = next((u for u in links if u.endswith('/'+filename) and '/sites/default/release-files/' in u), None)
                if link:
                    mirror = urljoin(root, unescape(link))
                    if mirror.startswith("https://esmis.nal.usda.gov/sites/default/release-files/"):
                        report = parse_wasde(fetch(mirror), mirror)
                        if report['as_of'] == f'{year}-{month:02d}':
                            return report
            except (HTTPError, URLError, ValueError):
                pass
            continue
    raise ValueError("No WASDE report found for the last three months")


def parse_news(raw: bytes) -> list[dict]:
    root = ET.fromstring(raw)
    stories = []
    for item in root.findall("./channel/item"):
        title = unescape(item.findtext("title") or "").strip()
        url = (item.findtext("link") or "").strip()
        desc = re.sub(r"<[^>]+>", " ", item.findtext("description") or "")
        desc = " ".join(unescape(desc).split())
        if not (title and url.startswith("https://www.eia.gov/")):
            continue
        try:
            published = parsedate_to_datetime(item.findtext("pubDate") or "").date().isoformat()
        except (ValueError, TypeError):
            continue
        stories.append(dict(title=title, summary=desc[:260], date=published,
                            url=url, source="EIA · Today in Energy"))
    if not stories:
        raise ValueError("EIA RSS has no usable headlines")
    return stories[:8]


def news_result(raw: bytes) -> dict:
    stories = parse_news(raw)
    return {"stories": stories, "as_of": max(item["date"] for item in stories), "url": NEWS_URL}


def parse_fred(raw: bytes, series_id: str, today: date) -> dict:
    specs = {
        "DCOILBRENTEU": ("price_brent", "oil", "Brent Europe · spot EIA",
                         "$/bbl", 1, 350, "https://fred.stlouisfed.org/series/DCOILBRENTEU"),
        "DCOILWTICO": ("price_wti", "oil", "WTI Cushing · spot EIA",
                       "$/bbl", 1, 350, "https://fred.stlouisfed.org/series/DCOILWTICO"),
        "DHHNGSP": ("price_henry", "gas", "Henry Hub · spot EIA",
                   "$/MMBtu", 0.01, 50, "https://fred.stlouisfed.org/series/DHHNGSP"),
    }
    id, sector, label, unit, low, high, url = specs[series_id]
    reader = csv.DictReader(StringIO(raw.decode("utf-8-sig", "replace")))
    if not reader.fieldnames or series_id not in reader.fieldnames:
        raise ValueError("FRED series column missing: " + series_id)
    points = []
    for row in reader:
        value = (row.get(series_id) or "").strip()
        if value in ("", "."):
            continue
        observed = date.fromisoformat((row.get("DATE") or row.get("observation_date") or "").strip())
        price = float(value)
        if not low <= price <= high or observed > today:
            raise ValueError("FRED price or date out of bounds: " + series_id)
        points.append((observed, price))
    points.sort()
    if not points or today - points[-1][0] > timedelta(days=30):
        raise ValueError("FRED price data missing or more than 30 days old: " + series_id)
    observed, price = points[-1]
    previous = points[-2][1] if len(points) > 1 else None
    return {"metrics": [metric(id, sector, label, price, unit,
                               price - previous if previous is not None else None,
                               "vs séance précédente" if previous is not None else "prix observé",
                               observed.isoformat(), "EIA · via FRED", url,
                               "Prix spot quotidien ; publication différée, pas un future")],
            "as_of": observed.isoformat(), "url": url}


def parse_eia_spot(raw: bytes, commodity: str, today: date) -> dict:
    """Extract six dated closes from EIA's daily spot tables, with full row validation."""
    specs = {
        "brent": ("price_brent", "oil", "Brent Europe · spot EIA",
                  "$/bbl", "Brent - Europe", "Conventional Gasoline", 1, 350, EIA_OIL_SPOT_URL),
        "wti": ("price_wti", "oil", "WTI Cushing · spot EIA",
                "$/bbl", "WTI - Cushing, Oklahoma", "Brent - Europe", 1, 350, EIA_OIL_SPOT_URL),
        "henry": ("price_henry", "gas", "Henry Hub · spot EIA",
                  "$/MMBtu", "Henry Hub", "Futures Prices", 0.01, 50, EIA_GAS_SPOT_URL),
    }
    id, sector, label, unit, start, end, low, high, url = specs[commodity]
    html = raw.decode("utf-8-sig", "replace")
    html = re.sub(r"<(script|style)\b[^>]*>.*?</\1>", " ", html, flags=re.I | re.S)
    plain = " ".join(unescape(re.sub(r"<[^>]+>", " ", html)).split())
    first = plain.find(start)
    if first < 0:
        raise ValueError("EIA spot row missing: " + commodity)
    second = plain.find(end, first + len(start))
    if second < 0:
        raise ValueError("EIA spot following row missing: " + commodity)
    header = plain[max(0, first - 1400):first]
    dates = re.findall(r"\b\d{1,2}/\d{1,2}/\d{2}\b", header)[-6:]
    values = [float(v) for v in re.findall(r"(?<!\d)\d+(?:\.\d+)?(?!\d)", plain[first + len(start):second])
              if low <= float(v) <= high]
    if len(dates) != 6 or len(values) != len(dates):
        raise ValueError("EIA spot dates or columns mismatch: " + commodity)
    observations = [(datetime.strptime(d, "%m/%d/%y").date(), v)
                    for d, v in zip(dates, values)]
    if any(d > today for d, _ in observations) or today - observations[-1][0] > timedelta(days=30):
        raise ValueError("EIA spot observation stale or in future: " + commodity)
    observed, price = observations[-1]
    return {"metrics": [metric(id, sector, label, price, unit, price - observations[-2][1],
                               "vs séance précédente", observed.isoformat(), "EIA · prix spot", url,
                               "Clôture quotidienne publiée avec retard ; pas un future")],
            "as_of": observed.isoformat(), "url": url}


def parse_norway(raw: bytes, today: date) -> dict:
    html = raw.decode("utf-8", "replace")
    plain = " ".join(unescape(re.sub(r"<[^>]+>", " ", html)).split())
    pattern = (r"Production figures\s+([A-Za-z]+)\s+(20\d\d).{0,500}?"
               r"Preliminary production figures for\s+\1\s+\2\s+show an average daily production of"
               r"\s+([\d,\s]+?)\s+barrels of oil, NGL and condensate")
    found = []
    for match in re.finditer(pattern, plain, re.I):
        observed = datetime.strptime(match.group(1).title() + " " + match.group(2), "%B %Y").date()
        value = float(match.group(3).replace(" ", "").replace(",", "")) / 1_000_000
        if observed <= today and 0.5 <= value <= 5:
            found.append((observed, value))
    found = sorted(set(found), reverse=True)
    if not found or today - found[0][0] > timedelta(days=110):
        raise ValueError("Sodir production report missing or too old")
    observed, value = found[0]
    previous = found[1][1] if len(found) > 1 else None
    return {"metrics": [metric("oil_norway_liquids", "oil",
                               "Production Norvège · pétrole et liquides", value, "M bbl/j",
                               value - previous if previous is not None else None,
                               "vs mois précédent" if previous is not None else "provisoire",
                               observed.strftime("%Y-%m"), "Sodir · provisoire",
                               SODIR_URL, "Pétrole + LGN + condensats ; pas uniquement le Brent")],
            "as_of": observed.strftime("%Y-%m"), "url": SODIR_URL}


def gie_rows(raw: bytes, region: str) -> list[dict]:
    report = json.loads(raw.decode("utf-8-sig"))
    rows = report.get("data", [])
    if not isinstance(rows, list):
        raise ValueError("GIE returned unexpected data")
    valid_codes = ("EU", "EU27") if region == "eu" else ("FR",)
    rows = [row for row in rows if isinstance(row, dict) and
            str(row.get("code", "")).upper() in valid_codes and
            row.get("status", "C") in ("C", "E") and row.get("gasDayStart")]
    rows.sort(key=lambda item: item["gasDayStart"], reverse=True)
    if not rows:
        raise ValueError("GIE " + region.upper() + " aggregate missing")
    for row in rows[:2]:
        date.fromisoformat(row["gasDayStart"])
    return rows


def parse_gie(raw: bytes, region: str = "eu") -> dict:
    rows = gie_rows(raw, region)
    current = rows[0]
    suffix, location = ("eu", "UE") if region == "eu" else ("fr", "France")
    percent, stock = float(current["full"]), float(current["gasInStorage"])
    if not 0 <= percent <= 100 or not 0 <= stock <= 1600:
        raise ValueError("GIE storage unit or percent invalid")
    previous = rows[1] if len(rows) > 1 and rows[1]["gasDayStart"] != current["gasDayStart"] else None
    percent_change = percent - float(previous["full"]) if previous and previous.get("full") is not None else None
    stock_change = stock - float(previous["gasInStorage"]) if previous and previous.get("gasInStorage") is not None else None
    flag = "Estimé par les opérateurs" if current.get("status") == "E" else "Déclaré par les opérateurs"
    result = [
        metric("gas_" + suffix, "gas", "Stockage gaz " + location + " · remplissage",
               percent, "%", percent_change, "points vs veille", current["gasDayStart"],
               "GIE AGSI+", GIE_REPORT_URL, flag),
        metric("gas_" + suffix + "_twh", "gas", "Gaz stocké " + location,
               stock, "TWh", stock_change, "vs veille", current["gasDayStart"],
               "GIE AGSI+", GIE_REPORT_URL, flag),
    ]
    if current.get("netWithdrawal") is not None:
        flow = float(current["netWithdrawal"])
        if not -15000 <= flow <= 15000:
            raise ValueError("GIE net withdrawal unit invalid")
        result.append(metric("gas_" + suffix + "_net", "gas", "Soutirage net " + location,
                             flow, "GWh/j", None, "positif = soutirage ; négatif = injection",
                             current["gasDayStart"], "GIE AGSI+", GIE_REPORT_URL, flag))
    points = [{"date": row["gasDayStart"], "value": float(row["full"])}
              for row in reversed(rows) if row.get("full") is not None and
              0 <= float(row["full"]) <= 100]
    return {"metrics": result, "as_of": current["gasDayStart"],
            "url": GIE_REPORT_URL, "points": points}


def fetch_gie_history(url: str, key: str, today: date | None = None) -> bytes:
    """Fetch all requested calendar years; pagination is capped at 300 by GIE."""
    today = today or datetime.now(PARIS).date()
    url += "&from=" + comparison_start(today).isoformat() + "&to=" + today.isoformat()
    first = json.loads(fetch(url + "&page=1", {"x-key": key}))
    if not isinstance(first.get("data"), list):
        raise ValueError("GIE first page missing")
    pages = int(first.get("last_page", 1))
    if not 1 <= pages <= 6:
        raise ValueError("GIE historical pagination unexpected")
    for page in range(2, pages + 1):
        following = json.loads(fetch(url + "&page=" + str(page), {"x-key": key}))
        if not isinstance(following.get("data"), list):
            raise ValueError("GIE historical page missing")
        first["data"].extend(following["data"])
    return json.dumps(first).encode("utf-8")


def alsi_inventory(row: dict) -> float | None:
    inventory = row.get("inventory")
    # Current ALSI records provide both liquid volume (lng) and energy (gwh).
    # The dashboard's LNG tank inventory uses the liquid volume in 10³ m³.
    if isinstance(inventory, dict):
        inventory = inventory.get("lng")
    return measured(inventory)


def parse_alsi(raw: bytes, region: str, today: date | None = None) -> dict:
    rows = gie_rows(raw, region)
    # An ALSI aggregate may be published before both measurements arrive.
    # Use the most recent complete observation and retain its actual date.
    complete = [row for row in rows if alsi_inventory(row) is not None
                and measured(row.get("sendOut")) is not None]
    if not complete:
        raise ValueError("ALSI " + region.upper() + " has no complete inventory/send-out observation")
    current = complete[0]
    observed = date.fromisoformat(current["gasDayStart"])
    today = today or datetime.now(timezone.utc).date()
    if not timedelta(0) <= today - observed <= timedelta(days=7):
        raise ValueError("ALSI " + region.upper() + " latest complete observation is stale")
    suffix, location = ("eu", "UE") if region == "eu" else ("fr", "France")
    inventory, sendout = alsi_inventory(current), measured(current.get("sendOut"))
    if not 0 <= inventory <= 50000 or not 0 <= sendout <= 30000:
        raise ValueError("ALSI inventory or send-out out of bounds")
    previous = next((row for row in complete[1:] if row["gasDayStart"] != current["gasDayStart"]), None)
    old_inventory = alsi_inventory(previous) if previous else None
    old_sendout = measured(previous.get("sendOut")) if previous else None
    flag = "Estimé par les opérateurs" if current.get("status") == "E" else "Déclaré par les opérateurs"
    result = [
        metric("lng_" + suffix + "_inventory", "gas", "GNL en cuves " + location,
               inventory, "10³ m³ GNL", inventory - old_inventory if old_inventory is not None else None,
               "vs veille", current["gasDayStart"], "GIE ALSI", ALSI_REPORT_URL, flag),
        metric("lng_" + suffix + "_sendout", "gas", "Émission terminaux GNL " + location,
               sendout, "GWh/j", sendout - old_sendout if old_sendout is not None else None,
               "vs veille", current["gasDayStart"], "GIE ALSI", ALSI_REPORT_URL, flag),
    ]
    points = [{"date": row["gasDayStart"], "value": float(measured(row["sendOut"]))}
              for row in reversed(complete) if measured(row["sendOut"]) is not None and
              0 <= float(measured(row["sendOut"])) <= 30000]
    return {"metrics": result, "as_of": current["gasDayStart"],
            "url": ALSI_REPORT_URL, "points": points}


def verified_calendar(today: date) -> list[dict]:
    """2026 US agency schedule, including the published holiday exceptions."""
    eastern = ZoneInfo("America/New_York")
    rows = []
    def add(day: date, hour: int, minute: int, label: str, context: str, url: str,
            day_only: bool = False) -> None:
        when = datetime.combine(day, time(hour, minute), eastern).astimezone(timezone.utc)
        rows.append({"at": when.isoformat(), "title": label, "context": context,
                     "url": url, "day_only": day_only})

    first = max(date(2026, 9, 25), today)
    last = date(2026, 12, 31)
    if first > last:
        return []
    oil_exceptions = {date(2026, 10, 14): (date(2026, 10, 15), 12),
                      date(2026, 11, 11): (date(2026, 11, 12), 12)}
    gas_exceptions = {date(2026, 11, 12): (date(2026, 11, 13), 10),
                      date(2026, 11, 26): (date(2026, 11, 25), 12)}
    day = first
    while day <= last:
        if day.weekday() == 0 and day <= date(2026, 11, 30):
            release = day + timedelta(days=1) if day == date(2026,10,12) else day
            add(release,16,0,'USDA · Crop Progress','État et avancement des cultures US',
                'https://www.nass.usda.gov/Publications/Reports_by_Release_Day/index.php')
        if day.weekday() == 4 and day <= date(2026,11,27):
            add(day,0,0,'Céré’Obs · publication habituelle','Cultures françaises · date à confirmer, hors pause hivernale',
                'https://cereobs.franceagrimer.fr/',day_only=True)
        if day.weekday() == 2:  # Wednesday
            release, hour = oil_exceptions.get(day, (day, 10))
            if release >= today:
                add(release, hour, 30 if hour == 10 else 0, "EIA · stocks pétroliers WPSR",
                    "Brut, essence, distillats et raffineries US", "https://www.eia.gov/petroleum/supply/weekly/schedule.php")
        if day.weekday() == 3:  # Thursday
            release, hour = gas_exceptions.get(day, (day, 10))
            if release >= today:
                add(release, hour, 30 if hour == 10 else 0, "EIA · stockage gaz US",
                    "Variation et écart à la moyenne cinq ans", "https://ir.eia.gov/ngs/schedule.html")
        day += timedelta(days=1)
    for month, day_number in ((10, 9), (11, 10), (12, 10)):
        publication = date(2026, month, day_number)
        if publication >= today:
            add(publication, 12, 0, "USDA · WASDE",
                "Bilans mondiaux céréales et oléagineux",
                "https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report")
    if today <= date(2026, 10, 6):
        add(date(2026, 10, 6), 0, 0, "EIA · perspectives énergétiques STEO",
            "Date vérifiée ; horaire officiel non précisé",
            "https://www.eia.gov/outlooks/steo/release_schedule.php", day_only=True)
    return sorted(rows, key=lambda row: row["at"])


def get_previous() -> dict:
    if SNAPSHOT.exists():
        if str(ROOT) not in sys.path:
            sys.path.insert(0, str(ROOT))
        from scripts.build_dashboard import load_snapshot
        return load_snapshot(ROOT)
    return {"metrics": [], "sources": {}, "stories": [], "history": {}}


def build_snapshot(previous: dict, results: dict, now: datetime) -> dict:
    values = {item["id"]: item for item in previous.get("metrics", [])}
    sources = previous.get("sources", {}).copy()
    history = previous.get("history", {}).copy()
    stories = previous.get("stories", [])
    for key in ("oil", "oil_flows", "oil_history", "oil_price_history", "gas", "wasde", "crop_progress", "news", "norway",
                "brent", "wti", "henry", "gie", "gie_fr", "alsi", "alsi_fr",
                "rte_power", "entsoe_fr", "entsoe_de", "power_price_fr", "power_price_de", "power_price_be", "power_price_it_north",
                "power_seasonal", "ttf_monthly", "ttf_ngp", "cereobs", "coffee", "cocoa"):
        result = results.get(key)
        if isinstance(result, Exception):
            old = sources.get(key, {})
            sources[key] = {**old, "status": "error", "checked_at": now.isoformat(),
                            "message": "Dernière donnée conservée ; source indisponible."}
            continue
        if result is None:
            if key == "norway" and "oil_norway_liquids" in values:
                sources[key] = {"status": "manual", "as_of": values["oil_norway_liquids"]["as_of"],
                                "url": SODIR_URL,
                                "message": "Repère mensuel vérifié ; collecte automatique indisponible."}
            if key in ("gie", "gie_fr", "alsi", "alsi_fr"):
                sources[key] = {"status": "needs_key",
                                "url": GIE_REPORT_URL if key.startswith("gie") else ALSI_REPORT_URL,
                                "message": "Clé personnelle GIE requise."}
                prefix = {"gie": "gas_eu", "gie_fr": "gas_fr",
                          "alsi": "lng_eu", "alsi_fr": "lng_fr"}[key]
                for id in list(values):
                    if id == prefix or id.startswith(prefix + "_"):
                        del values[id]
                history.pop({"gie": "gas_eu", "gie_fr": "gas_fr",
                             "alsi": "lng_eu_sendout", "alsi_fr": "lng_fr_sendout"}[key], None)
            if key in ("entsoe_fr", "entsoe_de"):
                sources[key] = {"status": "needs_key", "url": ENTSOE_REPORT_URL,
                                "message": "Clé ENTSO-E requise pour la prévision J-1."}
                values.pop("power_forecast_" + key[-2:], None)
            continue
        old_period = sources.get(key, {}).get("as_of")
        new_period = result.get("as_of")
        if old_period and new_period and len(old_period) == len(new_period) and new_period < old_period:
            sources[key] = {**sources[key], "status": "error", "checked_at": now.isoformat(),
                            "message": "Réponse antérieure à la dernière publication ; valeur récente conservée."}
            continue
        sources[key] = {"status": "ok", "as_of": result.get("as_of"),
                        "url": result.get("url", NEWS_URL), "checked_at": now.isoformat()}
        if result.get("published"):
            sources[key]["published"] = result["published"]
        if result.get("provenance"):
            sources[key]["provenance"] = result["provenance"]
        if result.get("licence"):
            sources[key]["licence"] = result["licence"]
        for item in result.get("metrics", []):
            values[item["id"]] = item
        if key == "oil_history":
            history["oil_crude"] = result["points"]
        if key == "oil_price_history":
            history["oil_prices"] = result["series"]
        if key in ("power_seasonal", "ttf_monthly"):
            history["power_prices_daily" if key == "power_seasonal" else "ttf_monthly"] = result["points"]
        if key == "ttf_ngp":
            combined = {p["date"]: p for p in [*history.get("ttf_daily", []), *result["points"]]
                        if p["date"] >= comparison_start(now.astimezone(PARIS).date()).isoformat()}
            history["ttf_daily"] = sorted(combined.values(), key=lambda p: p["date"])
        if key in ("gie", "gie_fr", "alsi", "alsi_fr") and result.get("points"):
            history[{"gie": "gas_eu", "gie_fr": "gas_fr",
                     "alsi": "lng_eu_sendout", "alsi_fr": "lng_fr_sendout"}[key]] = result["points"]
        if key == "rte_power":
            history["power_fr"] = result["points"]
        if key == "news":
            stories = result["stories"]

    values["metal_copper"] = metric("metal_copper", "metals", "Production minière cuivre · monde",
                                     23, "Mt", None, "estimation annuelle", "2025",
                                     "USGS MCS 2026",
                                     "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-copper.pdf",
                                     "Repère structurel, pas un stock LME")
    values["metal_aluminum"] = metric("metal_aluminum", "metals", "Aluminium primaire · monde",
                                      74, "Mt", 1.2, "vs 2024", "2025", "USGS MCS 2026",
                                      "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-aluminum.pdf",
                                      "Production annuelle estimée ; 2024 : 72,8 Mt. Pas un stock LME")
    sources["metals"] = {"status": "structural", "as_of": "2025", "url":
                           "https://www.lme.com/Market-data/Reports-and-data/Warehouse-and-stocks-reports"}
    return {"schema": 3, "generated_at": now.isoformat(), "sources": sources,
            "metrics": list(values.values()), "history": history, "stories": stories,
            "calendar": verified_calendar(now.date())}


def save_snapshot(snapshot: dict) -> None:
    serialized = json.dumps(snapshot, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False) + "\n"
    SNAPSHOT.parent.mkdir(parents=True, exist_ok=True)
    SNAPSHOT.write_text(serialized, encoding="utf-8")
    # Compile the UI from its maintained sources; never rewrite README as code.
    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    from scripts.build_dashboard import build_dashboard
    build_dashboard(ROOT)


def eex_ngp_enabled() -> bool:
    """Public redistribution requires rights, separate from public file access."""
    return os.environ.get("EEX_NGP_REDISTRIBUTION_ALLOWED", "").strip().lower() == "true"


def main() -> None:
    now = datetime.now(timezone.utc).replace(microsecond=0)
    previous = get_previous()
    from scripts.physical_sources import fetch_cereobs, fetch_coffee, fetch_cocoa
    tasks = {
        "oil": lambda: parse_oil(fetch(OIL_URL)),
        "oil_flows": lambda: parse_oil_flows(fetch(OIL_FLOW_URL)),
        "oil_history": lambda: parse_oil_history(fetch(OIL_HISTORY_URL), now.astimezone(PARIS).date()),
        "oil_price_history": lambda: fetch_oil_price_history(now.date()),
        "power_seasonal": lambda: fetch_power_seasonal(previous, now),
        "ttf_monthly": lambda: fetch_ttf_monthly(now.astimezone(PARIS).date()),
        "gas": lambda: parse_gas(fetch(GAS_URL)),
        "wasde": lambda: fetch_wasde(now.date()),
        "crop_progress": lambda: fetch_crop_progress(now.date()),
        "news": lambda: news_result(fetch(NEWS_URL)),
        "cereobs": lambda: fetch_cereobs(now.astimezone(PARIS).date()),
        "coffee": lambda: fetch_coffee(now.astimezone(PARIS).date()),
        "cocoa": lambda: fetch_cocoa(now.astimezone(PARIS).date()),
    }
    if eex_ngp_enabled():
        tasks["ttf_ngp"] = lambda: parse_ttf_ngp(fetch(TTF_NGP_URL), fetch(TTF_NGP_HISTORY_URL), now)
    else:
        # A downloadable CSV alone is not permission for systematic republication.
        previous["metrics"] = [m for m in previous.get("metrics", []) if m["id"] != "price_ttf"]
        previous.get("history", {}).pop("ttf_daily", None)
        previous.setdefault("sources", {})["ttf_ngp"] = {
            "status": "needs_licence", "checked_at": now.isoformat(),
            "url": "https://www.eex.com/en/market-data/licensing-policies",
            "message": "Cours spot sous licence non connecté ; aucun cours de substitution."}
    tasks["brent"] = lambda: parse_eia_spot(fetch(EIA_OIL_SPOT_URL), "brent", now.date())
    tasks["wti"] = lambda: parse_eia_spot(fetch(EIA_OIL_SPOT_URL), "wti", now.date())
    tasks["henry"] = lambda: parse_eia_spot(fetch(EIA_GAS_SPOT_URL), "henry", now.date())
    tasks["rte_power"] = lambda: parse_rte_power(fetch_rte_history(), now)
    for zone in POWER_PRICE_ZONES:
        tasks["power_price_" + zone] = lambda code=zone: parse_power_price(fetch_power_price(code, now), code, now)
    entsoe_token = os.environ.get("ENTSOE_API_TOKEN", "").strip()
    if entsoe_token:
        for zone in POWER_ZONES:
            tasks["entsoe_" + zone] = (lambda code=zone: parse_entsoe_forecast(
                entsoe_query(code, now, entsoe_token), code, now))
    gie_key = os.environ.get("GIE_API_KEY", "")
    if gie_key:
        tasks["gie"] = lambda: parse_gie(fetch_gie_history(GIE_URL, gie_key))
        tasks["gie_fr"] = lambda: parse_gie(fetch_gie_history(GIE_FR_URL, gie_key), "fr")
        tasks["alsi"] = lambda: parse_alsi(fetch(ALSI_URL, {"x-key": gie_key}), "eu", now.date())
        tasks["alsi_fr"] = lambda: parse_alsi(fetch(ALSI_FR_URL, {"x-key": gie_key}), "fr", now.date())
    results = {}
    with ThreadPoolExecutor(max_workers=len(tasks)) as pool:
        futures = {pool.submit(task): key for key, task in tasks.items()}
        for future in as_completed(futures):
            key = futures[future]
            try:
                results[key] = future.result()
                print(f"{key}: ok")
            except Exception as error:
                results[key] = error
                extra = ": " + str(error)[:100] if isinstance(error, ValueError) else ""
                print(f"{key}: unavailable ({type(error).__name__}{extra})", file=sys.stderr)
    snapshot = build_snapshot(previous, results, now)
    if not any(item.get("status") == "ok" for item in snapshot["sources"].values()):
        raise RuntimeError("No usable source: keeping published snapshot unchanged")
    rte_result = results.get("rte_power")
    if isinstance(rte_result, dict):
        try:
            previous_power = json.loads(POWER_HISTORY.read_text(encoding="utf-8")) if POWER_HISTORY.exists() else {}
            save_power_history(previous_power, rte_result, now)
        except (OSError, ValueError) as error:
            print("RTE accumulated history unavailable: " + str(error)[:100], file=sys.stderr)
    try:
        previous_prices = json.loads(POWER_PRICES.read_text(encoding="utf-8")) if POWER_PRICES.exists() else {}
        save_power_prices(previous_prices, results, now)
    except (OSError, ValueError) as error:
        print("Power prices unavailable: " + str(error)[:100], file=sys.stderr)
    save_snapshot(snapshot)
    print("Metrics:", len(snapshot["metrics"]), "| official headlines:", len(snapshot["stories"]))


if __name__ == "__main__":
    main()
