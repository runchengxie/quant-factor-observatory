from pathlib import Path
import unittest


class PagesRouteSupportTests(unittest.TestCase):
    def test_every_nested_app_route_has_a_direct_load_entry(self):
        workflow = Path('.github/workflows/deploy-pages.yml').read_text()
        route_loop = next(line for line in workflow.splitlines() if 'for route in ' in line)
        routes = set(route_loop.split('in', 1)[1].replace('; do', '').split())
        self.assertTrue({'hermite', 'jumps', 'fundamentals', 'quality'} <= routes)


if __name__ == '__main__':
    unittest.main()
