import { beforeEach, describe, expect, it } from "vitest";
import {
  getRecentFiles,
  addRecentFile,
  removeRecentFile,
  clearRecentFiles,
  formatRecentFileName,
  formatRecentFilePath,
} from "./recentFiles";

const RECENT_FILES_KEY = "fiberpath_recent_files";

describe("recentFiles", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("getRecentFiles()", () => {
    it("returns empty array when nothing is stored", () => {
      expect(getRecentFiles()).toEqual([]);
    });

    it("returns stored files sorted by most recent first", () => {
      const files = [
        { path: "/older.wind", lastOpened: 1000 },
        { path: "/newer.wind", lastOpened: 2000 },
      ];
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files));

      const result = getRecentFiles();
      expect(result[0].path).toBe("/newer.wind");
      expect(result[1].path).toBe("/older.wind");
    });

    it("returns empty array when localStorage contains invalid JSON", () => {
      localStorage.setItem(RECENT_FILES_KEY, "not-json");
      expect(getRecentFiles()).toEqual([]);
    });
  });

  describe("addRecentFile()", () => {
    it("adds a new file to the list", () => {
      addRecentFile("/path/to/file.wind");
      const files = getRecentFiles();
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("/path/to/file.wind");
    });

    it("moves an existing file to the front instead of duplicating", () => {
      addRecentFile("/first.wind");
      addRecentFile("/second.wind");
      addRecentFile("/first.wind"); // re-add first

      const files = getRecentFiles();
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe("/first.wind");
    });

    it("trims list to 10 entries maximum", () => {
      for (let i = 0; i < 12; i++) {
        addRecentFile(`/file${i}.wind`);
      }
      expect(getRecentFiles()).toHaveLength(10);
    });

    it("stores a timestamp on the added entry", () => {
      const before = Date.now();
      addRecentFile("/timestamped.wind");
      const after = Date.now();

      const file = getRecentFiles()[0];
      expect(file.lastOpened).toBeGreaterThanOrEqual(before);
      expect(file.lastOpened).toBeLessThanOrEqual(after);
    });
  });

  describe("removeRecentFile()", () => {
    it("removes a file by path", () => {
      addRecentFile("/a.wind");
      addRecentFile("/b.wind");
      removeRecentFile("/a.wind");

      const files = getRecentFiles();
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe("/b.wind");
    });

    it("does nothing when path is not in the list", () => {
      addRecentFile("/a.wind");
      removeRecentFile("/nonexistent.wind");
      expect(getRecentFiles()).toHaveLength(1);
    });
  });

  describe("clearRecentFiles()", () => {
    it("empties the list", () => {
      addRecentFile("/a.wind");
      addRecentFile("/b.wind");
      clearRecentFiles();
      expect(getRecentFiles()).toEqual([]);
    });

    it("is a no-op when list is already empty", () => {
      clearRecentFiles();
      expect(getRecentFiles()).toEqual([]);
    });
  });

  describe("formatRecentFileName()", () => {
    it("extracts the filename from a Unix path", () => {
      expect(formatRecentFileName("/home/user/project/my-part.wind")).toBe(
        "my-part.wind",
      );
    });

    it("extracts the filename from a Windows path", () => {
      expect(formatRecentFileName("C:\\Users\\user\\project\\my-part.wind")).toBe(
        "my-part.wind",
      );
    });

    it("returns the input when there is no separator", () => {
      expect(formatRecentFileName("nopath.wind")).toBe("nopath.wind");
    });

    it("returns input when path is empty string", () => {
      expect(formatRecentFileName("")).toBe("");
    });
  });

  describe("formatRecentFilePath()", () => {
    it("returns the directory portion of a Unix path", () => {
      expect(formatRecentFilePath("/home/user/project/my-part.wind")).toBe(
        "/home/user/project",
      );
    });

    it("returns / when only a filename is provided", () => {
      expect(formatRecentFilePath("file.wind")).toBe("/");
    });
  });
});
