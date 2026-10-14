import csv
import json
from datetime import date
from io import StringIO
from pathlib import Path
import unittest

from scripts.physical_sources import parse_cereobs_table, parse_coffee, parse_cocoa


class PhysicalPublicationTests(unittest.TestCase):
    def test_french_crop_uses_national_row_and_correct_harvest_campaign(self):
        publication={'libellePublication':'CO_Stades_France_2026-S40_BT_SEM.xls',
                     'semaineObservation':{'dateFin':'2026-10-05T00:00:00+02:00'},'datePublication':'2026-10-09T08:56:33+02:00'}
        rows=[['Blé tendre-Semis-France'],['% de surface- récolte 2027'],[''],
              ['Region',0,0,0,0],['Moyenne France',4,0,5,6]]
        item=parse_cereobs_table(rows,publication)[0]
        self.assertEqual(item['value'],4)
        self.assertEqual(item['change'],-2)
        self.assertEqual(item['campaign'],'2027')
        self.assertEqual(item['as_of'],'2026-10-05')
        self.assertEqual(item['published_at'],'2026-10-09')
        with self.assertRaisesRegex(ValueError,'national'):
            parse_cereobs_table(rows[:-1],publication)

    def test_condition_rounding_does_not_turn_region_into_france(self):
        p={'libellePublication':'CO_Conditions_France_2026-S40_MG.xls',
           'semaineObservation':{'dateFin':'2026-10-05'},'datePublication':'2026-10-09'}
        rows=[['Conditions culture'],['% de surface - récolte 2026'],[''],
              ['Moyenne France (1)',21,31,27,21,1],['2025-S40 (3)',5,10,24,58,4]]
        item=parse_cereobs_table(rows,p)[0]
        self.assertEqual(item['value'],22)
        self.assertEqual(item['change'],-40)
        rows[3][1]=200
        with self.assertRaisesRegex(ValueError,'invalid'):
            parse_cereobs_table(rows,p)

    def test_coffee_unit_campaign_and_previous_season_are_not_live_prices(self):
        fields=['Commodity_Code','Country_Name','Market_Year','Calendar_Year','Month','Attribute_Description','Unit_Description','Value']
        out=StringIO();writer=csv.DictWriter(out,fieldnames=fields);writer.writeheader()
        for country,current,old,stock,old_stock in [('Brazil',71900,63000,4425,3895),('Vietnam',32500,31700,489,689)]:
            for year,production,stocks in [(2026,current,stock),(2025,old,old_stock)]:
                for attribute,value in [('Production',production),('Ending Stocks',stocks)]:
                    writer.writerow(dict(Commodity_Code='0711100',Country_Name=country,Market_Year=year,
                        Calendar_Year=2026,Month='07',Attribute_Description=attribute,Unit_Description='(1000 60 KG BAGS)',Value=value))
        result=parse_coffee(out.getvalue().encode(),date(2026,10,14));items={m['id']:m for m in result['metrics']}
        self.assertEqual(items['ag_coffee_br_production']['value'],71.9)
        self.assertEqual(items['ag_coffee_vn_stocks']['change'],-0.2)
        self.assertEqual(items['ag_coffee_br_stocks']['campaign'],'2026/27')
        self.assertEqual(items['ag_coffee_br_stocks']['as_of'],'2026-07')
        with self.assertRaisesRegex(ValueError,'future'):
            parse_coffee(out.getvalue().encode(),date(2026,6,1))

    def test_cocoa_publication_date_is_distinct_from_estimated_season(self):
        sample=b'''<script>{"datePublished":"2026-08-31T17:47:05+00:00"}</script>
        data for the 2024/25 season are estimated.
        World Gross Production: 4.733 million tonnes.
        World Grindings: 4.649 million tonnes.
        End-of-season stocks: 1.309 million tonnes.'''
        result=parse_cocoa(sample,'https://www.icco.org/public-release/',date(2026,10,14))
        self.assertEqual(result['metrics'][2]['value'],1.309)
        self.assertEqual(result['metrics'][2]['campaign'],'2024/25')
        self.assertIsNone(result['metrics'][2]['change'])
        self.assertEqual(result['as_of'],'2026-08-31')
        with self.assertRaisesRegex(ValueError,'stale'):
            parse_cocoa(sample,'https://www.icco.org/public-release/',date(2026,8,1))
