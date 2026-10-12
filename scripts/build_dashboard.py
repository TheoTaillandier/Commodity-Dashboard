#!/usr/bin/env python3
"""Compile maintained sources and published JSON into one portable HTML file."""
from __future__ import annotations

import json
from pathlib import Path
import tempfile

ROOT = Path(__file__).resolve().parents[1]


def encode_json(data: dict) -> str:
    # Escape HTML delimiters even in titles supplied by an external source.
    return json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False).replace(
        "<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def load_snapshot(root: Path = ROOT) -> dict:
    snapshot = json.loads((root / "data/snapshot.json").read_text(encoding="utf-8"))
    archive_path = root / "data/long_history.json"
    if archive_path.exists():
        archive = json.loads(archive_path.read_text(encoding="utf-8"))
        history = snapshot.setdefault("history", {})
        for name, previous in archive.get("history", {}).items():
            current = history.get(name, {} if isinstance(previous, dict) else [])
            def combine(old, new):
                points = {p["date"]: p for p in [*old, *new]}
                return sorted(points.values(), key=lambda p: p["date"])
            history[name] = {key: combine(value, current.get(key, []))
                             for key, value in previous.items()} if isinstance(previous, dict) else combine(previous, current)
        for name, source in archive.get("sources", {}).items():
            snapshot.setdefault("sources", {}).setdefault(name, source)
    return snapshot


def build_dashboard(root: Path = ROOT) -> Path:
    template = (root / "app/template.html").read_text(encoding="utf-8")
    inputs = {
        "/*__STYLES__*/": (root / "app/styles.css").read_text(encoding="utf-8"),
        "/*__APP__*/": (root / "app/power_metrics.js").read_text(encoding="utf-8") + "\n" + (root / "app/cockpit.js").read_text(encoding="utf-8"),
        "__SNAPSHOT__": encode_json(load_snapshot(root)),
        "__POWER_HISTORY__": encode_json(json.loads((root / "data/power_fr.json").read_text(encoding="utf-8"))),
        "__POWER_PRICES__": encode_json(json.loads((root / "data/power_prices.json").read_text(encoding="utf-8"))),
    }
    # Check all tokens before replacement: an article could itself contain a token.
    if any(template.count(token) != 1 for token in inputs):
        raise ValueError("Dashboard template has missing or duplicate placeholders")
    import re
    html = re.sub("|".join(re.escape(token) for token in inputs),
                  lambda match: inputs[match.group()], template)
    if "</script" in inputs["/*__APP__*/"].lower() or "</style" in inputs["/*__STYLES__*/"].lower():
        raise ValueError("Source contains an unsafe inline closing tag")
    output = root / "index.html"
    # Never leave a half-written dashboard if the build is interrupted.
    with tempfile.NamedTemporaryFile("w", dir=root, suffix=".html", delete=False,
                                     encoding="utf-8") as handle:
        handle.write(html)
        temporary = Path(handle.name)
    temporary.replace(output)
    return output


if __name__ == "__main__":
    print(build_dashboard())
