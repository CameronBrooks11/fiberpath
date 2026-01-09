from fiberpath_cli.main import app
from typer.testing import CliRunner


def test_cli_help_succeeds() -> None:
    runner = CliRunner()
    result = runner.invoke(app, ["--help"])
    assert result.exit_code == 0
    assert "FiberPath" in result.output
