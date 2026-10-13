"""Tests for bin/stroppers-init. Run: python3 -m unittest discover tests"""

import importlib.machinery
import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
loader = importlib.machinery.SourceFileLoader("stroppers_init", str(ROOT / "bin" / "stroppers-init"))
spec = importlib.util.spec_from_loader("stroppers_init", loader)
init = importlib.util.module_from_spec(spec)
loader.exec_module(init)


class InitTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)
        subprocess.run(["git", "init", "-q", str(self.repo)], check=True)

    def tearDown(self):
        self.tmp.cleanup()

    def run_init(self, *extra):
        init.main(["--target", str(self.repo), "--workflow-ref", "abc123", *extra])

    def read(self, name):
        return (self.repo / name).read_text()

    def test_merges_settings_without_dropping_existing_keys(self):
        (self.repo / ".claude").mkdir()
        (self.repo / ".claude" / "settings.json").write_text(
            json.dumps({"permissions": {"allow": ["Bash(ls)"]}, "enabledPlugins": {"other@x": True}})
        )
        self.run_init("--with", "addy")
        settings = json.loads(self.read(".claude/settings.json"))
        self.assertEqual(settings["permissions"], {"allow": ["Bash(ls)"]})
        self.assertTrue(settings["enabledPlugins"]["other@x"])
        self.assertTrue(settings["enabledPlugins"]["sdlc@stroppers"])
        self.assertTrue(settings["enabledPlugins"]["agent-skills@stroppers"])
        self.assertEqual(settings["extraKnownMarketplaces"]["stroppers"]["source"]["repo"], "sogamoso/stroppers")

    def test_addy_is_off_by_default(self):
        self.run_init()
        settings = json.loads(self.read(".claude/settings.json"))
        self.assertNotIn("agent-skills@stroppers", settings["enabledPlugins"])

    def test_claude_md_block_is_replaced_not_duplicated(self):
        (self.repo / "CLAUDE.md").write_text("# App\n\nKeep this.\n")
        self.run_init()
        self.run_init()
        text = self.read("CLAUDE.md")
        self.assertTrue(text.startswith("# App\n\nKeep this.\n"))
        self.assertEqual(text.count(init.BEGIN), 1)
        self.assertIn("ponytail: <the limit>", text)

    def test_gitignore_appends_only_missing_lines(self):
        (self.repo / ".gitignore").write_text("node_modules/\n.claude/grumpy/\n")
        self.run_init()
        self.run_init()
        lines = self.read(".gitignore").splitlines()
        self.assertEqual(lines.count(".claude/grumpy/"), 1)
        self.assertEqual(lines.count(".sharpen/"), 1)

    def test_gitignore_respects_blanket_claude_ignore(self):
        (self.repo / ".gitignore").write_text(".claude/\n")
        self.run_init()
        self.assertEqual(self.read(".gitignore"), ".claude/\n")

    def test_workflows_get_ref_and_ci_name(self):
        self.run_init("--ci-workflow", "Test suite")
        text = self.read(".github/workflows/stroppers-respond.yml")
        self.assertIn("actions/agent@abc123", text)
        self.assertIn('workflows: ["Test suite"]', text)
        self.assertNotIn("__", text.replace("__init__", ""))

    def test_existing_workflows_are_kept_unless_forced(self):
        self.run_init()
        path = self.repo / ".github" / "workflows" / "stroppers-implement.yml"
        path.write_text("custom\n")
        self.run_init()
        self.assertEqual(path.read_text(), "custom\n")
        self.run_init("--force")
        self.assertIn("mode: implement", path.read_text())

    def test_refuses_non_git_target(self):
        with tempfile.TemporaryDirectory() as plain:
            with self.assertRaises(SystemExit):
                init.main(["--target", plain])


if __name__ == "__main__":
    unittest.main()
