"""Allow running fiberpath_cli as a module with `python -m fiberpath_cli`."""

from .main import app

if __name__ == "__main__":
    app()
