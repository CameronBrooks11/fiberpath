from fiberpath.geometry import CylindricalSurface


def test_circumference_mm() -> None:
    surface = CylindricalSurface(diameter_mm=100.0, length_mm=500.0)
    assert surface.circumference_mm == 314.1592653589793
