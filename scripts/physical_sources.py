"""Small, dated physical datasets from public institutional publications."""
from __future__ import annotations

import csv
from datetime import date
from html import unescape
from io import BytesIO, StringIO
import json
import re
from urllib.parse import urlencode
from zipfile import ZipFile

from scripts.update_data import fetch, measured, metric

CEREOBS_BASE = 'https://cereobs.franceagrimer.fr/cereobs-sp/api/public/'
CEREOBS_REPORT = 'https://cereobs.franceagrimer.fr/'
COFFEE_URL = 'https://apps.fas.usda.gov/psdonline/downloads/psd_coffee_csv.zip'
COFFEE_REPORT = 'https://www.fas.usda.gov/data/commodities/coffee'
COCOA_REPORT = 'https://www.icco.org/quarterly-bulletin-of-cocoa-statistics-2/'


def parse_cereobs_table(rows: list[list], publication: dict) -> list[dict]:
    name = publication['libellePublication']
    observed = publication['semaineObservation']['dateFin'][:10]
    published = publication['datePublication'][:10]
    crop = 'wheat' if '_BT_' in name else 'corn' if '_MG' in name else None
    if crop is None:
        return []
    national = next((row for row in rows if str(row[0]).startswith('Moyenne France')), None)
    if national is None:
        raise ValueError('CereObs national row missing')
    campaign_match = re.search(r'récolte\s+(20\d{2})', ' '.join(str(v) for row in rows[:3] for v in row), re.I)
    if not campaign_match:
        raise ValueError('CereObs harvest campaign missing')
    campaign = campaign_match.group(1)
    country_label = 'Blé tendre France' if crop == 'wheat' else 'Maïs grain France'
    source = "FranceAgriMer Céré’Obs"
    if '_Conditions_' in name:
        values = [measured(v) for v in national[1:6]]
        if any(v is None or not 0 <= v <= 100 for v in values) or not 98 <= sum(values) <= 102:
            raise ValueError('CereObs condition percentages invalid')
        value = values[-2] + values[-1]
        prior = next((row for row in rows if re.match(rf'{int(campaign)-1}-S\d+', str(row[0]))), None)
        old = sum(float(v) for v in prior[4:6]) if prior and all(measured(v) is not None for v in prior[4:6]) else None
        items = [metric('ag_fr_'+crop+'_condition','agri',country_label+' · bonnes/très bonnes',value,'%',
                        value-old if old is not None else None,'vs même semaine N−1' if old is not None else 'N−1 non publié',
                        observed,source,CEREOBS_REPORT,'Récolte '+campaign+' · surfaces pondérées ; arrondis de la source')]
    else:
        stage = 'harvest' if '_REC.' in name else 'sown' if '_SEM.' in name else None
        if stage is None:
            return []
        current, previous, last_year, average = [measured(v) for v in national[1:5]]
        if current is None or not 0 <= current <= 100 or (average is not None and not 0 <= average <= 100):
            raise ValueError('CereObs stage percentage invalid')
        detail = 'Récolte '+campaign
        if previous is not None:
            detail += f' · {previous:g} % semaine précédente'
        if last_year is not None:
            detail += f' · {last_year:g} % N−1'
        items = [metric('ag_fr_'+crop+'_'+stage,'agri',country_label+(' · récolté' if stage=='harvest' else ' · semé'),
                        current,'%',current-average if average is not None else None,
                        'vs moyenne 5 ans' if average is not None else 'moyenne non publiée',observed,source,CEREOBS_REPORT,detail)]
    for item in items:
        item.update(published_at=published,campaign=campaign,max_age_days=12)
    return items


def fetch_cereobs(today: date) -> dict:
    import xlrd
    # Keep only national publication metadata. Regional contact information
    # present in the public index is neither stored nor used.
    index = json.loads(fetch(CEREOBS_BASE+'publications/getPublicationParDerniereSemaine'))
    selected = [dict(libellePublication=p['libellePublication'],id=p['id'],
                     semaineObservation={'dateFin':p['semaineObservation']['dateFin']},datePublication=p['datePublication'])
                for p in index if not p.get('region') and not p.get('zpc') and p.get('boVisible')
                and p['libellePublication'].endswith('.xls')
                and (re.search(r'_BT_(SEM|REC)\.xls$',p['libellePublication'])
                     or re.search(r'_MG_REC\.xls$',p['libellePublication'])
                     or re.search(r'_Conditions_France_.*_MG\.xls$',p['libellePublication']))]
    items = []
    for publication in selected:
        observed = date.fromisoformat(publication['semaineObservation']['dateFin'][:10])
        if not 0 <= (today-observed).days <= 21:
            continue
        raw = fetch(CEREOBS_BASE+'publications/rapportExcel?'+urlencode({'idPublication':publication['id']}))
        if not raw.startswith(b'\xd0\xcf\x11\xe0'):
            raise ValueError('CereObs XLS response missing')
        sheet = xlrd.open_workbook(file_contents=raw).sheet_by_index(0)
        items.extend(parse_cereobs_table([sheet.row_values(i) for i in range(sheet.nrows)],publication))
    if not items:
        raise ValueError('CereObs current national publication unavailable')
    return {'metrics':items,'as_of':max(i['as_of'] for i in items),
            'published':max(i['published_at'] for i in items),'url':CEREOBS_REPORT,
            'licence':'FranceAgriMer : reproduction avec mention de la source',
            'provenance':'Céré’Obs · tableaux nationaux publiés, attribution conservée'}


def parse_coffee(raw: bytes, today: date) -> dict:
    rows = list(csv.DictReader(StringIO(raw.decode('utf-8-sig'))))
    required = {'Commodity_Code','Country_Name','Market_Year','Calendar_Year','Month','Attribute_Description','Unit_Description','Value'}
    if not rows or not required <= rows[0].keys():
        raise ValueError('USDA coffee CSV columns missing')
    selected = [r for r in rows if r['Commodity_Code']=='0711100' and r['Country_Name'] in ('Brazil','Vietnam')
                and r['Attribute_Description'] in ('Production','Ending Stocks')
                and int(r['Market_Year']) <= today.year and r['Unit_Description']=='(1000 60 KG BAGS)']
    year = max(int(r['Market_Year']) for r in selected)
    current = [r for r in selected if int(r['Market_Year'])==year]
    if year < today.year-1:
        raise ValueError('USDA coffee campaign stale')
    items = []
    for country,code,label in [('Brazil','br','Brésil'),('Vietnam','vn','Vietnam')]:
        for attribute,suffix,description in [('Production','production','production prévue'),('Ending Stocks','stocks','stocks finaux prévus')]:
            matches = [r for r in current if r['Country_Name']==country and r['Attribute_Description']==attribute]
            if len(matches)!=1:
                raise ValueError('USDA coffee country/campaign ambiguous')
            row = matches[0]
            value = measured(row['Value'])
            if value is None or not 0 <= value <= 200000:
                raise ValueError('USDA coffee figure invalid')
            as_of = f"{int(row['Calendar_Year'])}-{int(row['Month']):02d}"
            if as_of > today.strftime('%Y-%m'):
                raise ValueError('USDA coffee update in future')
            old = next((measured(r['Value']) for r in selected if r['Country_Name']==country
                        and r['Attribute_Description']==attribute and int(r['Market_Year'])==year-1),None)
            item = metric('ag_coffee_'+code+'_'+suffix,'agri','Café '+label+' · '+description,value/1000,
                          'M sacs 60 kg',(value-old)/1000 if old is not None else None,'vs campagne précédente',
                          as_of,'USDA FAS PS&D',COFFEE_REPORT,f'Campagne {year}/{str(year+1)[-2:]} · prévision révisable, café vert toutes variétés')
            item.update(campaign=f'{year}/{str(year+1)[-2:]}',max_age_days=220)
            items.append(item)
    return {'metrics':items,'as_of':max(i['as_of'] for i in items),'url':COFFEE_REPORT,
            'provenance':'USDA FAS PS&D · fichier public café · données de campagne',
            'licence':'USDA FAS · données publiques, attribution conservée'}


def fetch_coffee(today: date) -> dict:
    with ZipFile(BytesIO(fetch(COFFEE_URL))) as archive:
        member = next((i for i in archive.infolist() if i.filename=='psd_coffee.csv'),None)
        if member is None or member.file_size > 30000000:
            raise ValueError('USDA coffee archive invalid')
        return parse_coffee(archive.read(member),today)


def parse_cocoa(raw: bytes, url: str, today: date) -> dict:
    html = raw.decode('utf-8','replace')
    stamp = re.search(r'"datePublished"\s*:\s*"(20\d{2}-\d{2}-\d{2})',html)
    if not stamp or not 0 <= (today-date.fromisoformat(stamp[1])).days <= 200:
        raise ValueError('ICCO publication date missing or stale')
    text = ' '.join(unescape(re.sub('<[^>]+>',' ',html)).split())
    campaign = re.search(r'data for the (20\d{2}/\d{2}) season are estimated',text,re.I)
    if not campaign:
        raise ValueError('ICCO published season unclear')
    specs = [('production','production estimée',r'World Gross Production.*?([\d.]+) million tonnes'),
             ('grindings','broyages estimés',r'World Grindings.*?([\d.]+) million tonnes'),
             ('stocks','stocks de fin de saison',r'End-of-season stocks.*?([\d.]+) million tonnes')]
    items = []
    for suffix,label,pattern in specs:
        match = re.search(pattern,text,re.I)
        value = measured(match[1]) if match else None
        if value is None or not 0.1 <= value <= 10:
            raise ValueError('ICCO public summary figure missing')
        item = metric('ag_cocoa_'+suffix,'agri','Cacao monde · '+label,value,'Mt',None,'estimation de campagne',
                      stamp[1],'ICCO · communiqué public',url,'Campagne '+campaign[1]+' · estimation publiée ; ce n’est pas un stock ICE')
        item.update(campaign=campaign[1],max_age_days=200)
        items.append(item)
    return {'metrics':items,'as_of':stamp[1],'published':stamp[1],'url':url,
            'provenance':'ICCO · trois faits du communiqué public ; bulletin payant non téléchargé'}


def fetch_cocoa(today: date) -> dict:
    # The overview links to the public quarterly press releases; paid bulletins
    # are not downloaded. Evaluate publication dates instead of trusting order.
    landing = fetch(COCOA_REPORT).decode('utf-8','replace')
    links = list(dict.fromkeys(re.findall(r'https://www\.icco\.org/[a-z]+-20\d{2}-quarterly-bulletin-of-cocoa-statistics/',landing)))
    reports = []
    for link in links[:4]:
        try:
            reports.append(parse_cocoa(fetch(link),link,today))
        except (ValueError,OSError):
            continue
    if not reports:
        raise ValueError('ICCO dated public summary unavailable')
    return max(reports,key=lambda r:r['published'])
