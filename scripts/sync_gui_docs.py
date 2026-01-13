#!/usr/bin/env python3
"""
Sync GUI Documentation to Main Docs

Copies all documentation from fiberpath_gui/docs/ to docs/gui/ for inclusion
in the main MkDocs build. This allows GUI docs to be developed independently
in the GUI project but served as part of the unified documentation site.

Usage:
    python scripts/sync_gui_docs.py

This script should be run before building documentation:
    python scripts/sync_gui_docs.py && mkdocs build

The script:
- Cleans the docs/gui/ directory (removes stale files)
- Copies all .md files from fiberpath_gui/docs/ to docs/gui/
- Preserves directory structure
- Reports what was copied

Note: docs/gui/ is in .gitignore as it's generated content.
"""

import shutil
from pathlib import Path


def sync_gui_docs() -> bool:
    """Sync GUI documentation to main docs directory."""

    # Define paths
    repo_root = Path(__file__).parent.parent
    gui_docs_src = repo_root / "fiberpath_gui" / "docs"
    gui_docs_dest = repo_root / "docs" / "gui"

    # Validate source exists
    if not gui_docs_src.exists():
        print(f"❌ Error: GUI docs source not found: {gui_docs_src}")
        return False

    # Clean destination directory (remove old generated files)
    if gui_docs_dest.exists():
        print(f"🧹 Cleaning destination: {gui_docs_dest}")
        shutil.rmtree(gui_docs_dest)

    # Create destination directory
    gui_docs_dest.mkdir(parents=True, exist_ok=True)
    print(f"📁 Created destination: {gui_docs_dest}")

    # Copy all files and directories
    copied_files: list[Path] = []
    for item in gui_docs_src.rglob("*"):
        if item.is_file() and item.suffix == ".md":
            # Calculate relative path and destination
            rel_path = item.relative_to(gui_docs_src)
            dest_file = gui_docs_dest / rel_path

            # Create parent directories if needed
            dest_file.parent.mkdir(parents=True, exist_ok=True)

            # Copy file
            shutil.copy2(item, dest_file)
            copied_files.append(rel_path)

    # Report results
    print(f"\n✅ Successfully synced {len(copied_files)} files:\n")

    # Group by directory for organized output
    by_directory: dict[str, list[str]] = {}
    for file_path in sorted(copied_files):
        directory = str(file_path.parent) if file_path.parent != Path(".") else "root"
        if directory not in by_directory:
            by_directory[directory] = []
        by_directory[directory].append(file_path.name)

    for directory, files in sorted(by_directory.items()):
        print(f"  {directory}/")
        for file in sorted(files):
            print(f"    - {file}")

    print(f"\n📚 GUI docs ready at: {gui_docs_dest}")
    print("💡 Run 'mkdocs build' or 'mkdocs serve' to build documentation")

    return True


if __name__ == "__main__":
    import sys

    success = sync_gui_docs()
    sys.exit(0 if success else 1)
