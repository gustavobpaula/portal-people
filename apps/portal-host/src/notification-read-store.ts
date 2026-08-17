const STORAGE_KEY = 'portal.notifications.read.v1';

/** Reads opaque notification IDs from the current browser session. */
function readIds(): Set<string> {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = value ? JSON.parse(value) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

/** Persists only opaque notification IDs for the lifetime of the current session. */
function writeIds(ids: Set<string>) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    // Browser storage can be unavailable; the current in-memory state remains usable.
  }
}

/** Stores the local read overlay without persisting notification content. */
export const notificationReadStore = {
  read: readIds,
  /** Removes IDs that no longer exist in the current BFF response. */
  reconcile(validIds: Iterable<string>) {
    const valid = new Set(validIds);
    const ids = new Set([...readIds()].filter((id) => valid.has(id)));
    writeIds(ids);
    return ids;
  },
  /** Marks an existing opaque notification ID as read for this session. */
  markRead(id: string) {
    const ids = readIds();
    ids.add(id);
    writeIds(ids);
    return ids;
  }
};
