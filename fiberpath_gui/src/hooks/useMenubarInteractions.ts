import { useEffect, useRef } from "react";

/**
 * Centralized menubar open/close behavior.
 * - only one menu can stay open at a time
 * - clicking outside closes open menus
 */
export function useMenubarInteractions() {
  const menuRefs = useRef<(HTMLDetailsElement | null)[]>([]);

  useEffect(() => {
    const handleToggle = (event: Event) => {
      const target = event.target as HTMLDetailsElement;
      if (!target.open) {
        return;
      }

      menuRefs.current.forEach((menu) => {
        if (menu && menu !== target && menu.open) {
          menu.open = false;
        }
      });
    };

    menuRefs.current.forEach((menu) => {
      menu?.addEventListener("toggle", handleToggle);
    });

    return () => {
      menuRefs.current.forEach((menu) => {
        menu?.removeEventListener("toggle", handleToggle);
      });
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedInsideMenu = menuRefs.current.some(
        (menu) => menu && menu.contains(event.target as Node),
      );

      if (clickedInsideMenu) {
        return;
      }

      menuRefs.current.forEach((menu) => {
        if (menu?.open) {
          menu.open = false;
        }
      });
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const setMenuRef = (index: number) => (el: HTMLDetailsElement | null) => {
    menuRefs.current[index] = el;
  };

  return { setMenuRef };
}
