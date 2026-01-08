const RECENT_FILES_KEY = 'fiberpath_recent_files';
const MAX_RECENT_FILES = 10;

export interface RecentFile {
  path: string;
  lastOpened: number; // timestamp
}

export function getRecentFiles(): RecentFile[] {
  try {
    const stored = localStorage.getItem(RECENT_FILES_KEY);
    if (!stored) return [];
    
    const files = JSON.parse(stored) as RecentFile[];
    // Sort by most recent
    return files.sort((a, b) => b.lastOpened - a.lastOpened);
  } catch {
    return [];
  }
}

export function addRecentFile(path: string): void {
  try {
    const recent = getRecentFiles();
    
    // Remove if already exists
    const filtered = recent.filter(f => f.path !== path);
    
    // Add to front
    const updated: RecentFile[] = [
      { path, lastOpened: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT_FILES);
    
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail - localStorage may be unavailable
  }
}

export function removeRecentFile(path: string): void {
  try {
    const recent = getRecentFiles();
    const updated = recent.filter(f => f.path !== path);
    localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
  } catch (error) {
    // Silently fail - localStorage may be unavailable
  }
}

export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_FILES_KEY);
  } catch (error) {
    // Silently fail - localStorage may be unavailable
  }
}

export function formatRecentFileName(path: string): string {
  // Extract filename from path
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function formatRecentFilePath(path: string): string {
  // Show directory path without filename
  const parts = path.split(/[\\/]/);
  return parts.slice(0, -1).join('/') || '/';
}
