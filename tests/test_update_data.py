import json
import unittest
from unittest.mock import patch
from datetime import date, datetime, timezone

from scripts.update_data import (build_snapshot, parse_alsi, parse_eia_spot, parse_fred, parse_norway,
                                 parse_gie, parse_oil_flows, parse_wasde, parse_rte_power,
                                 parse_entsoe_forecast, parse_oil_price_history, fetch_gie_history,
                                 parse_oil_price_mirror, merge_power_history, parse_power_price,
                                 merge_power_prices,
                                 parse_power_daily, parse_ttf_ngp, parse_ttf_monthly,
                                 parse_crop_progress, crop_progress_link, eex_ngp_enabled,
                                 verified_calendar)


FLOW_SAMPLE = b'''"STUB_1","STUB_2","9/18/26","9/11/26","Difference","9/19/25"
"Crude Oil Supply ","(1)     Domestic Production","13,939","13,944","-5","13,501"
"Crude Oil Supply ","(8)        Imports","5,877","7,058","-1,181","6,495"
"Crude Oil Supply ","(12)        Exports","3,281","4,831","-1,550","4,484"
"Crude Oil Supply ","(17)   Crude Oil Input to Refineries","16,811","17,330","-519","16,476"
'''

WASDE_SAMPLE = b'''WASDE - 675 - 8 September 2026
World and U.S. Supply and Use for Grains  1/
World
Wheat
 2024/25 799 1069 210 808 260
 2025/26 (Est.) 843 1104 227 823 280
 2026/27 (Proj.)
  Aug 819.30 1099.52 212.71 826.27 273.25
  Sep 822.43 1103.04 211.77 826.75 276.29
Coarse Grains
 United States
U.S. Feed Grain and Corn Supply and Use
FEED GRAINS
Production 391 447 418 412
CORN
Production 14892 17021 16013 15800
Exports 2873 3425 3275 3275
Ending Stocks 1551 1922 1653 1567
Avg.FarmPrice ($/bu) 4.24 4.15 4.50 4.80
U.S. Sorghum, Barley, and Oats Supply and Use
U.S. Soybeans and Products Supply and Use (Domestic Measure)
SOYBEANS
Production 4374 4262 4519 4535
Exports 1892 1520 1660 1685
Ending Stocks 325 325 320 310
SOYBEAN OIL
Ending Stocks 1551 1747 1837 1837
U.S. Sugar Supply and Use
World Corn Supply and Use  1/  (Contd.)
2026/27 Proj.
World 3/
 Aug 298.83 1298.88 203.73 832.46 1323.05 210.48 274.66
 Sep 301.38 1290.95 203.11 827.40 1320.23 210.08 272.10
World Less China
WASDE - 675 - 24
'''


class PublicationParsingTest(unittest.TestCase):
    def test_crude_history_preserves_four_years_excludes_suppression_and_future(self):
        from scripts.update_data import parse_oil_history
        from datetime import timedelta
        today=date(2026,10,13)
        rows=[{'date':(date(2022,12,30)+timedelta(weeks=i)).isoformat(),
               'value':400000+i,'suppression_flag':None} for i in range(205)]
        rows += [{'date':'2026-10-10','value':450000,'suppression_flag':'s'},
                 {'date':'2026-10-11','value':900000,'suppression_flag':None},
                 {'date':'2026-10-12','value':None,'suppression_flag':None}]
        raw=json.dumps({'data':{'U.S.':{'time_series':rows}},'metadata':{'release_date':'2026-10-07'}}).encode()
        result=parse_oil_history(raw,today)
        self.assertEqual({p['date'][:4] for p in result['points']},{'2023','2024','2025','2026'})
        self.assertGreater(len(result['points']),190)
        self.assertEqual(result['points'][0]['value'],400.001)
        self.assertNotIn('2026-10-10',[p['date'] for p in result['points']])
        self.assertTrue(all(p['date']<=today.isoformat() for p in result['points']))
        with self.assertRaisesRegex(ValueError,'invalid'):
            parse_oil_history(raw,date(2027,2,1))

    def test_comparator_failure_keeps_other_markets_and_licensed_archive(self):
        now=datetime(2026,10,13,tzinfo=timezone.utc)
        point={'at':'2026-10-13T00:00:00+00:00','value':77}
        previous={'series':{'fr':[point],'be':[point]},'licence':{'fr':'CC BY 4.0','be':'CC BY 4.0'}}
        merged=merge_power_prices(previous,{'power_price_be':OSError('offline'),
            'power_price_it_north':{'points':[{**point,'value':100}],'licence':'CC BY 4.0'}},now)
        self.assertEqual(merged['series']['be'],[point])
        self.assertEqual(merged['series']['fr'],[point])
        self.assertEqual(merged['series']['it_north'][0]['value'],100)
        self.assertEqual(merged['licence']['be'],'CC BY 4.0')

    def test_power_day_ahead_requires_explicit_licence_and_paired_delivery_times(self):
        from datetime import timedelta
        now = datetime(2026, 9, 28, 15, tzinfo=timezone.utc)
        stamps = [int((now-timedelta(hours=12)+timedelta(minutes=15*i)).timestamp())
                  for i in range(100)]
        raw = {'license_info':'CC BY 4.0 (creativecommons.org/licenses/by/4.0) attribution: energy-charts.info',
               'unit':'EUR / MWh','unix_seconds':stamps,'price':[80.0]*100}
        result = parse_power_price(json.dumps(raw).encode(), 'fr', now)
        self.assertEqual(len(result['points']), 100)
        combined = merge_power_prices({}, {'power_price_fr':result,'power_price_de':
            {**result,'points':[{'at':p['at'],'value':70.0} for p in result['points']]}}, now)
        self.assertEqual(combined['series']['fr'][0]['at'],combined['series']['de'][0]['at'])
        self.assertEqual(combined['series']['fr'][0]['value']-combined['series']['de'][0]['value'],10)
        raw['license_info']='Proprietary'
        with self.assertRaisesRegex(ValueError,'licence'):
            parse_power_price(json.dumps(raw).encode(), 'fr', now)

    def test_oil_mirror_keeps_dated_spot_history_separate_from_live_prices(self):
        from datetime import timedelta
        base = date(2026, 9, 25)
        dates = [(base - timedelta(days=n)).isoformat() for n in range(250)]
        brent = ('Date,Price\n' + ''.join(f'{day},108.2\n' for day in dates)).encode()
        wti = ('Date,Price\n' + ''.join(f'{day},102.1\n' for day in dates)).encode()
        result = parse_oil_price_mirror(brent, wti, date(2026, 9, 28))
        self.assertEqual(result['as_of'], '2026-09-25')
        self.assertEqual(len(result['series']['brent']), 250)
        self.assertIn('miroir', result['provenance'])
        with self.assertRaisesRegex(ValueError, 'stale'):
            parse_oil_price_mirror(brent, wti, date(2026, 10, 20))

    def test_usda_crop_condition_and_harvest_keep_comparisons_distinct(self):
        sample = b'''Released September 21, 2026, by NASS.
Corn Harvested - Selected States
18 States ......: 10 8 13 11
Corn Condition - Selected States: Week Ending September 20, 2026
18 States ......: 6 11 26 44 13
Previous year ..: 3 7 24 49 17
Soybeans Harvested - Selected States
18 States ......: 8 6 12 8
Soybean Condition - Selected States: Week Ending September 20, 2026
18 States ......: 4 10 28 46 12
Previous year ..: 4 8 27 48 13
Cotton Bolls Opening - Selected States'''
        result = parse_crop_progress(sample, 'https://esmis.nal.usda.gov/report.txt', date(2026,9,28))
        by_id = {item['id']:item for item in result['metrics']}
        self.assertEqual(by_id['ag_corn_condition']['value'],57)
        self.assertEqual(by_id['ag_corn_condition']['change'],-9)
        self.assertEqual(by_id['ag_corn_harvest']['change'],2)
        self.assertEqual(by_id['ag_soy_harvest']['value'],12)
        self.assertEqual(by_id['ag_soy_condition']['change'],-3)
        page = b'<a href="/sites/default/release-files/796068/prog3826_0.txt">txt</a>'
        self.assertEqual(crop_progress_link(page),
                         'https://esmis.nal.usda.gov/sites/default/release-files/796068/prog3826_0.txt')

    def test_gie_history_reads_all_calendar_year_pages_under_documented_limit(self):
        page1 = json.dumps({'last_page':3,'data':[{'gasDayStart':'2026-09-27'}]}).encode()
        page2 = json.dumps({'last_page':3,'data':[{'gasDayStart':'2025-09-27'}]}).encode()
        page3 = json.dumps({'last_page':3,'data':[{'gasDayStart':'2023-09-27'}]}).encode()
        with patch('scripts.update_data.fetch', side_effect=[page1,page2,page3]) as mocked:
            result = json.loads(fetch_gie_history('https://agsi.gie.eu/api?country=fr&size=300',
                                                 'test-key',date(2026,10,2)))
        self.assertEqual(len(result['data']), 3)
        self.assertIn('from=2023-01-01&to=2026-10-02', mocked.call_args_list[0].args[0])
        self.assertTrue(mocked.call_args_list[-1].args[0].endswith('page=3'))

    def test_power_daily_requires_complete_dst_days_and_handles_resolution_change(self):
        from datetime import timedelta
        from zoneinfo import ZoneInfo
        paris = ZoneInfo('Europe/Paris')
        for day, hours in [(date(2024,3,31),23),(date(2024,10,27),25)]:
            midnight = datetime.combine(day,datetime.min.time(),paris).astimezone(timezone.utc)
            stamps = [int((midnight+timedelta(hours=h)).timestamp()) for h in range(hours)]
            raw={'license_info':'CC BY 4.0 · SMARD','unit':'EUR/MWh',
                 'unix_seconds':stamps,'price':[float(h) for h in range(hours)]}
            result=parse_power_daily(json.dumps(raw).encode(),day,day)
            self.assertEqual(result['points'],[{'date':day.isoformat(),'value':(hours-1)/2}])
            raw['price'][10]=None
            with self.assertRaisesRegex(ValueError,'complete'):
                parse_power_daily(json.dumps(raw).encode(),day,day)
        day=date(2026,10,2);midnight=datetime(2026,10,1,22,tzinfo=timezone.utc)
        stamps=[int((midnight+timedelta(minutes=15*h)).timestamp()) for h in range(96)]
        raw={'license_info':'CC BY 4.0','unit':'EUR/MWh','unix_seconds':stamps,'price':[100.0]*96}
        self.assertEqual(parse_power_daily(json.dumps(raw).encode(),day,day)['points'][0]['value'],100)
        # Hourly delivery before the switch must not become 15-minute coverage.
        prior_midnight=midnight-timedelta(days=1)
        hourly=[int((prior_midnight+timedelta(hours=h)).timestamp()) for h in range(24)]
        raw['unix_seconds']=hourly+stamps;raw['price']=[80.0]*24+[100.0]*96
        self.assertEqual(parse_power_daily(json.dumps(raw).encode(),day-timedelta(days=1),day)['points'],
            [{'date':'2026-10-01','value':80.0},{'date':'2026-10-02','value':100.0}])
        raw['license_info']='Private use'
        with self.assertRaisesRegex(ValueError,'licence'):
            parse_power_daily(json.dumps(raw).encode(),day,day)

    def test_ttf_ngp_selects_current_gas_day_and_keeps_provisional_status(self):
        now=datetime(2026,10,2,11,5,tzinfo=timezone.utc)
        raw=('Gasday;IndexValue (€/MWh);Status;Timestamp Let\n'
             '01/10/2026;72.501;Final NGP;02/10/2026 13:00\n'
             '02/10/2026;74.080;Temporary NGP;02/10/2026 13:00\n'
             '03/10/2026;72.702;Temporary NGP;02/10/2026 13:00\n').encode()
        history=('Delivery date;Index Value (€/MWh)\n2026-10-01;72.501\n').encode()
        result=parse_ttf_ngp(raw,history,now);item=result['metrics'][0]
        self.assertEqual(item['value'],74.08)
        self.assertEqual(item['quality'],'provisoire')
        self.assertEqual(item['observed_at'],'2026-10-02T11:00:00+00:00')
        with self.assertRaisesRegex(ValueError,'timestamp'):
            parse_ttf_ngp(raw,history,datetime(2026,10,4,12,tzinfo=timezone.utc))

    def test_ttf_monthly_conversion_uses_the_same_months_ecb_exchange_rate(self):
        rows=[{'A':'Period','G':'Natural gas, Europe'},{'G':'($/mmbtu)'}]
        months=[f'2025M{m:02d}' for m in range(9,13)]+[f'2026M{m:02d}' for m in range(1,9)]
        rows += [{'A':m,'G':'10'} for m in months]
        rates='FREQ,CURRENCY,CURRENCY_DENOM,TIME_PERIOD,OBS_VALUE\n'+''.join(
            f'M,USD,EUR,{m[:4]}-{m[-2:]},1.25\n' for m in months)
        with patch('scripts.update_data.xlsx_rows',return_value=rows):
            result=parse_ttf_monthly(b'',rates.encode(),date(2026,10,2))
            self.assertEqual(result['points'][-1]['value'],27.3)
            self.assertEqual(result['points'][-1]['date'],'2026-08-01')
            self.assertEqual(result['points'][-1]['usd_per_eur'],1.25)
            with self.assertRaisesRegex(ValueError,'incomplete'):
                parse_ttf_monthly(b'',rates.replace('USD,EUR','EUR,USD').encode(),date(2026,10,2))

    def test_one_year_oil_prices_are_dated_spot_history_with_missing_days_skipped(self):
        from datetime import timedelta
        start = date(2026, 5, 1)
        rows = ['DATE,DCOILBRENTEU,DCOILWTICO']
        for n in range(151):
            day = start + timedelta(days=n)
            rows.append(f'{day},108.40,{"." if n == 40 else "101.10"}')
        result = parse_oil_price_history(('\n'.join(rows) + '\n').encode(), date(2026, 9, 28))
        self.assertEqual(result['series']['brent'][-1]['value'], 108.4)
        self.assertEqual(len(result['series']['wti']), 150)
        with self.assertRaisesRegex(ValueError, 'stale'):
            parse_oil_price_history(('\n'.join(rows[:20]) + '\n').encode(), date(2026, 9, 28))

    def test_eia_flow_rates_are_converted_from_thousand_barrels_per_day(self):
        result = parse_oil_flows(FLOW_SAMPLE)
        metrics = {row['id']: row for row in result['metrics']}
        self.assertEqual(metrics['oil_production']['value'], 13.939)
        self.assertEqual(metrics['oil_imports']['change'], -1.181)
        self.assertEqual(metrics['oil_refinery']['unit'], 'M bbl/j')
        self.assertEqual(metrics['oil_exports']['as_of'], '2026-09-18')

    def test_inconsistent_eia_change_rejected(self):
        bad = FLOW_SAMPLE.replace(b'"-1,181"', b'"-181"')
        with self.assertRaisesRegex(ValueError, 'mismatch'):
            parse_oil_flows(bad)

    def test_wasde_selects_corn_and_soybean_not_feed_grains_or_soy_oil(self):
        result = parse_wasde(WASDE_SAMPLE, 'https://www.usda.gov/example')
        metrics = {row['id']: row for row in result['metrics']}
        self.assertEqual(metrics['ag_corn_output']['value'], 15800)
        self.assertEqual(metrics['ag_soy_stocks']['value'], 310)
        self.assertEqual(metrics['ag_soy_exports']['change'], 25)
        self.assertEqual(metrics['ag_world_wheat']['value'], 276.29)
        self.assertEqual(metrics['ag_world_wheat_trade']['value'], 211.77)
        self.assertEqual(result['as_of'], '2026-09')

    def test_failed_feed_retains_dated_value_and_marks_error(self):
        previous = {'metrics': [{'id': 'oil_crude', 'value': 426.398, 'as_of': '2026-09-18'}],
                    'sources': {'oil': {'status': 'ok', 'as_of': '2026-09-18'}},
                    'stories': [], 'history': {}}
        snapshot = build_snapshot(previous, {'oil': ValueError('broken')},
                                  datetime(2026, 9, 24, tzinfo=timezone.utc))
        self.assertEqual(snapshot['sources']['oil']['status'], 'error')
        self.assertEqual(snapshot['metrics'][0]['value'], 426.398)
        self.assertEqual(snapshot['metrics'][0]['as_of'], '2026-09-18')

    def test_gie_does_not_confuse_country_with_european_aggregate(self):
        rows = [{'code': 'DE', 'name': 'Germany', 'gasDayStart': '2026-09-18',
                 'full': '90.1', 'gasInStorage': '200', 'status': 'C'}]
        with self.assertRaisesRegex(ValueError, 'EU aggregate'):
            parse_gie(json.dumps({'data': rows}).encode())

    def test_gie_country_aggregate_and_lng_units(self):
        storage = {'data': [
            {'code':'FR', 'gasDayStart':'2026-09-24', 'full':'82.5',
             'gasInStorage':'118.4', 'netWithdrawal':'-62.3', 'status':'C'},
            {'code':'FR', 'gasDayStart':'2026-09-23', 'full':'82.0',
             'gasInStorage':'117.8', 'status':'C'}]}
        result = parse_gie(json.dumps(storage).encode(), 'fr')
        by_id = {item['id']: item for item in result['metrics']}
        self.assertEqual(by_id['gas_fr']['change'], 0.5)
        self.assertEqual(by_id['gas_fr_twh']['unit'], 'TWh')
        self.assertEqual(by_id['gas_fr_net']['value'], -62.3)
        self.assertEqual(result['points'], [{'date':'2026-09-23','value':82.0},
                                            {'date':'2026-09-24','value':82.5}])
        lng = {'data':[{'code':'FR','gasDayStart':'2026-09-24','inventory':'465.2',
                         'sendOut':'245.7','status':'C'},
                       {'code':'FR','gasDayStart':'2026-09-23','inventory':'455.2',
                         'sendOut':'203.7','status':'C'}]}
        parsed_lng = parse_alsi(json.dumps(lng).encode(), 'fr', date(2026, 9, 25))
        gas = {item['id']: item for item in parsed_lng['metrics']}
        self.assertEqual(gas['lng_fr_inventory']['unit'], '10³ m³ GNL')
        self.assertEqual(gas['lng_fr_sendout']['change'], 42)
        self.assertEqual([p['value'] for p in parsed_lng['points']], [203.7,245.7])

    def test_alsi_skips_incomplete_publication_without_undating_it(self):
        lng = {'data': [
            {'code': 'FR', 'gasDayStart': '2026-09-25', 'inventory': {'lng': None, 'gwh': None},
             'sendOut': '246.2', 'status': 'C'},
            {'code': 'FR', 'gasDayStart': '2026-09-24', 'inventory': {'lng': '465.2', 'gwh': '2800'},
             'sendOut': '245.7', 'status': 'C'},
            {'code': 'FR', 'gasDayStart': '2026-09-23', 'inventory': {'lng': '455.2', 'gwh': '2600'},
             'sendOut': '203.7', 'status': 'C'}]}
        result = parse_alsi(json.dumps(lng).encode(), 'fr', date(2026, 9, 25))
        self.assertEqual(result['as_of'], '2026-09-24')
        self.assertEqual(result['metrics'][0]['value'], 465.2)
        self.assertEqual(result['metrics'][1]['change'], 42)
        with self.assertRaisesRegex(ValueError, 'stale'):
            parse_alsi(json.dumps(lng).encode(), 'fr', date(2026, 10, 3))

    def test_removed_gie_key_removes_previously_published_european_metrics(self):
        previous = {'metrics': [{'id':'gas_eu','value':80,'sector':'gas'},
                                {'id':'lng_fr_sendout','value':120,'sector':'gas'}],
                    'sources': {}, 'stories': [], 'history': {'gas_eu':[{'date':'2026-09-23','value':80}],
                                                              'lng_fr_sendout':[{'date':'2026-09-23','value':120}]}}
        result = build_snapshot(previous, {}, datetime(2026, 9, 25, tzinfo=timezone.utc))
        self.assertFalse(any(item['id'] in ('gas_eu','lng_fr_sendout')
                             for item in result['metrics']))
        self.assertEqual(result['sources']['alsi_fr']['status'], 'needs_key')
        self.assertNotIn('gas_eu', result['history'])
        self.assertNotIn('lng_fr_sendout', result['history'])

    def test_rte_power_uses_last_real_observation_and_correct_export_sign(self):
        rows = []
        for index in range(8):
            rows.append({'date_heure':f'2026-09-25T{9 + index // 4:02d}:{index % 4 * 15:02d}:00+00:00',
                         'consommation':52000 + index * 100,
                         'prevision_j':52000,
                         'gaz':2500, 'eolien':4600, 'solaire':3200,
                         'nucleaire':38000, 'ech_physiques':-4300})
        rows.append({'date_heure':'2026-09-25T12:45:00+00:00',
                     'consommation':99999, 'gaz':99999})  # future measurement
        result = parse_rte_power(json.dumps({'results':rows}).encode(),
                                 datetime(2026, 9, 25, 12, tzinfo=timezone.utc))
        by_id = {item['id']:item for item in result['metrics']}
        self.assertEqual(result['points'][-1]['at'], '2026-09-25T10:45:00+00:00')
        self.assertEqual(by_id['power_load']['value'], 52700)
        self.assertEqual(by_id['power_residual']['value'], 44900)
        self.assertEqual(by_id['power_load_gap']['value'], 700)
        self.assertEqual(by_id['power_exchange']['value'], -4300)
        self.assertFalse(any('price' in item['id'] for item in result['metrics']))
        with self.assertRaisesRegex(ValueError, 'too old'):
            parse_rte_power(json.dumps({'results':rows[:-1]}).encode(),
                            datetime(2026, 9, 28, tzinfo=timezone.utc))

    def test_rte_hourly_history_accumulates_without_inventing_missing_hours(self):
        now = datetime(2026, 9, 28, 12, tzinfo=timezone.utc)
        previous = {'points':[
            {'at':'2026-09-27T10:45:00+00:00','load':50000,'gaz':2000},
            {'at':'2026-09-28T10:00:00+00:00','load':51000,'gaz':2100}]}
        incoming = [
            {'at':'2026-09-28T10:45:00+00:00','load':52000,'gaz':2200},
            {'at':'2026-09-28T11:15:00+00:00','load':53000,'ech_physiques':-4000}]
        result = merge_power_history(previous, incoming, now)
        self.assertEqual(len(result['points']), 3)
        self.assertEqual(result['points'][1]['load'], 52000)
        self.assertEqual(result['points'][-1]['ech_physiques'], -4000)
        self.assertEqual(result['first_at'], '2026-09-27T10:45:00+00:00')
        self.assertEqual(result['quality'], 'observé provisoire · un relevé par heure UTC')

    def test_entsoe_forecast_only_publishes_actual_day_ahead_load(self):
        example = b'''<GL_MarketDocument xmlns="urn:iec:62325.351:tc57wg16:451-6:loadpublishdocument:3:0">
          <type>A65</type><process.processType>A01</process.processType>
          <TimeSeries><businessType>A04</businessType><quantity_Measure_Unit.name>MAW</quantity_Measure_Unit.name>
            <Period><timeInterval><start>2026-09-25T12:00Z</start><end>2026-09-25T13:00Z</end></timeInterval>
              <resolution>PT15M</resolution>
              <Point><position>1</position><quantity>51000</quantity></Point>
              <Point><position>2</position><quantity>52000</quantity></Point>
              <Point><position>3</position><quantity>54000</quantity></Point>
              <Point><position>4</position><quantity>53000</quantity></Point>
            </Period></TimeSeries></GL_MarketDocument>'''
        example = example.replace(b'</TimeSeries>',
            b'<Period><timeInterval><start>2026-09-26T13:00Z</start><end>2026-09-26T14:00Z</end>'
            b'</timeInterval><resolution>PT60M</resolution><Point><position>1</position>'
            b'<quantity>99999</quantity></Point></Period></TimeSeries>')
        result = parse_entsoe_forecast(example, 'fr',
                                       datetime(2026, 9, 25, 11, tzinfo=timezone.utc))
        self.assertEqual(result['metrics'][0]['value'], 54000)
        self.assertEqual(result['as_of'], '2026-09-25T12:30:00+00:00')
        with self.assertRaisesRegex(ValueError, 'different data item'):
            parse_entsoe_forecast(example.replace(b'<type>A65</type>', b'<type>A44</type>'), 'fr',
                                  datetime(2026, 9, 25, 11, tzinfo=timezone.utc))

    def test_missing_entsoe_token_clears_forecast_but_keeps_rte_power(self):
        previous = {'metrics':[{'id':'power_forecast_fr','sector':'power','value':58000},
                               {'id':'power_load','sector':'power','value':52000}],
                    'sources':{'entsoe_fr':{'status':'ok'}},'stories':[], 'history':{}}
        result = build_snapshot(previous, {}, datetime(2026, 9, 25, tzinfo=timezone.utc))
        self.assertEqual(result['sources']['entsoe_fr']['status'], 'needs_key')
        self.assertEqual([m['id'] for m in result['metrics'] if m['sector']=='power'], ['power_load'])

    def test_fred_ignores_missing_observation_and_rejects_stale_prices(self):
        raw = b'DATE,DCOILBRENTEU\n2026-09-21,116.15\n2026-09-22,.\n2026-09-23,114.89\n'
        result = parse_fred(raw, 'DCOILBRENTEU', date(2026, 9, 25))
        item = result['metrics'][0]
        self.assertEqual(item['value'], 114.89)
        self.assertEqual(item['change'], -1.26)
        self.assertEqual(item['as_of'], '2026-09-23')
        with self.assertRaisesRegex(ValueError, 'more than 30 days'):
            parse_fred(raw, 'DCOILBRENTEU', date(2026, 11, 1))

    def test_norwegian_production_includes_ngl_and_condensate(self):
        page = (b'<p>Production figures August 2026</p><p>9/22/2026 Preliminary production figures for '
                b'August 2026 show an average daily production of 2 073 000 barrels of oil, '
                b'NGL and condensate.</p><p>Production figures July 2026</p><p>8/20/2026 '
                b'Preliminary production figures for July 2026 show an average daily production '
                b'of 1 976 000 barrels of oil, NGL and condensate.</p>')
        row = parse_norway(page, date(2026, 9, 25))['metrics'][0]
        self.assertEqual(row['value'], 2.073)
        self.assertEqual(row['change'], 0.097)
        self.assertIn('LGN + condensats', row['detail'])

    def test_eia_spot_price_rows_match_each_header_date(self):
        page = (b'<table><tr><td>Product by Area</td><td>09/15/26</td><td>09/16/26</td>'
                b'<td>09/17/26</td><td>09/18/26</td><td>09/21/26</td><td>09/22/26</td></tr>'
                b'<tr><td>Crude Oil</td></tr><tr><td>WTI - Cushing, Oklahoma</td>'
                b'<td>107.02</td><td>103.620</td><td>103.21</td><td>101.44</td>'
                b'<td>96.97</td><td>96.41</td><td>1986-2026</td></tr>'
                b'<tr><td>Brent - Europe</td><td>130.80</td><td>127.840</td>'
                b'<td>121.18</td><td>119.66</td><td>116.15</td><td>114.89</td></tr>'
                b'<tr><td>Conventional Gasoline</td></tr></table>')
        brent = parse_eia_spot(page, 'brent', date(2026, 9, 25))['metrics'][0]
        wti = parse_eia_spot(page, 'wti', date(2026, 9, 25))['metrics'][0]
        self.assertEqual((brent['value'], brent['as_of']), (114.89, '2026-09-22'))
        self.assertEqual((wti['value'], wti['change']), (96.41, -0.56))
        with self.assertRaisesRegex(ValueError, 'columns mismatch'):
            parse_eia_spot(page.replace(b'<td>119.66</td>', b''), 'brent', date(2026, 9, 25))

    def test_agenda_uses_agency_holiday_exceptions_and_paris_dst(self):
        events = verified_calendar(date(2026, 9, 25))
        oil_sep = next(e for e in events if e['title'].startswith('EIA · stocks')
                       and e['at'].startswith('2026-09-30'))
        self.assertEqual(oil_sep['at'], '2026-09-30T14:30:00+00:00')
        oil_oct = [e for e in events if e['title'].startswith('EIA · stocks')
                   and e['at'].startswith('2026-10-15')]
        self.assertEqual(oil_oct[0]['at'], '2026-10-15T16:00:00+00:00')
        self.assertFalse(any(e['at'].startswith('2026-10-14') for e in events))
        self.assertTrue(any(e['title'].startswith('USDA') and
                            e['at'] == '2026-10-09T16:00:00+00:00' for e in events))

    def test_crop_report_keeps_current_values_when_prior_year_is_na(self):
        sample = b'''Released October 5, 2026, by NASS.
Corn Harvested - Selected States
18 States ......: (NA) 18 23 27
Corn Condition - Selected States: Week Ending October 4, 2026
18 States ......: 6 12 28 42 12
Previous year ..: (NA) (NA) (NA) (NA) (NA)
Soybeans Harvested - Selected States
18 States ......: (NA) 17 25 33
Soybean Condition - Selected States: Week Ending October 4, 2026
18 States ......: 4 10 29 46 11
Previous year ..: (NA) (NA) (NA) (NA) (NA)
Cotton Bolls Opening - Selected States'''
        parsed = parse_crop_progress(sample, 'https://esmis.nal.usda.gov/report.txt', date(2026,10,12))
        metrics = {item['id']:item for item in parsed['metrics']}
        self.assertEqual(parsed['as_of'], '2026-10-04')
        self.assertEqual(parsed['published'], '2026-10-05')
        self.assertEqual(metrics['ag_corn_condition']['value'], 54)
        self.assertIsNone(metrics['ag_corn_condition']['change'])
        self.assertEqual(metrics['ag_corn_harvest']['change'], -4)
        self.assertEqual(metrics['ag_soy_harvest']['change'], -8)
        self.assertIn('N−1 non publié', metrics['ag_soy_harvest']['detail'])

    def test_older_report_cannot_overwrite_the_latest_valid_commodity_value(self):
        previous = {'metrics': [{'id':'ag_corn_stocks','sector':'agri','value':1849,'as_of':'2026-10'}],
                    'sources': {'wasde': {'as_of':'2026-10','status':'ok'}}, 'history':{},'stories':[]}
        older = {'as_of':'2026-09','metrics':[{'id':'ag_corn_stocks','value':1567,'sector':'agri'}]}
        snapshot = build_snapshot(previous, {'wasde':older}, datetime(2026,10,12,tzinfo=timezone.utc))
        self.assertEqual(next(m for m in snapshot['metrics'] if m['id']=='ag_corn_stocks')['value'],1849)
        self.assertEqual(snapshot['sources']['wasde']['status'],'error')

    def test_ngp_republication_is_disabled_without_an_explicit_rights_flag(self):
        for value in ('', 'false', '1', 'yes'):
            with patch.dict('os.environ', {'EEX_NGP_REDISTRIBUTION_ALLOWED': value}):
                self.assertFalse(eex_ngp_enabled())
        with patch.dict('os.environ', {'EEX_NGP_REDISTRIBUTION_ALLOWED': 'true'}):
            self.assertTrue(eex_ngp_enabled())


if __name__ == '__main__':
    unittest.main()
