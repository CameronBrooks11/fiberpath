"""Bundled machine profiles (the compatibility contracts winders must satisfy).

Profiles are JSON documents validated against
:class:`fiberpath.config.machine_profile.MachineProfile`. They ship inside the
package so the planner can load the default without a working directory; access
them via :func:`importlib.resources.files`.
"""
