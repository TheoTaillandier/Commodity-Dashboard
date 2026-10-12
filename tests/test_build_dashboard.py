import json
from pathlib import Path
import tempfile
import unittest

from scripts.build_dashboard import build_dashboard


class PortableDashboardTest(unittest.TestCase):
    def make_project(self, root):
        (root / 'app').mkdir()
        (root / 'data').mkdir()
        (root / 'app/template.html').write_text(
            '<style>/*__STYLES__*/</style>'
            '<script id="snapshot-data" type="application/json">__SNAPSHOT__</script>'
            '<script id="power-history-data" type="application/json">__POWER_HISTORY__</script>'
            '<script id="power-price-data" type="application/json">__POWER_PRICES__</script>'
            '<script>/*__APP__*/</script>')
        (root / 'app/styles.css').write_text('body{color:white}')
        (root / 'app/cockpit.js').write_text('console.log("portable");')
        for filename in ('snapshot', 'power_fr', 'power_prices'):
            (root / f'data/{filename}.json').write_text(json.dumps({
                'generated_at': '2026-10-12T05:59:01Z',
                'title': '</script><script>untrusted</script> __SNAPSHOT__ & < >'}))

    def test_build_preserves_dated_data_and_escapes_external_text(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_project(root)
            html = build_dashboard(root).read_text()
            self.assertIn('2026-10-12T05:59:01Z', html)
            self.assertNotIn('<script>untrusted', html)
            self.assertIn('\\u003c/script\\u003e', html)
            self.assertEqual(html.count('</script>'), 4)
            self.assertIn('console.log("portable");', html)

    def test_invalid_template_does_not_replace_previous_dashboard(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            self.make_project(root)
            (root / 'index.html').write_text('previous valid dashboard')
            (root / 'app/template.html').write_text('__SNAPSHOT__')
            with self.assertRaises(ValueError):
                build_dashboard(root)
            self.assertEqual((root / 'index.html').read_text(), 'previous valid dashboard')


if __name__ == '__main__':
    unittest.main()
