import type { KeyValueStorage } from '../data/demoRepository'

/**
 * localStorage that never throws. In private windows or with blocked site
 * data the browser can refuse access; then the values live in memory until
 * the tab is closed.
 */
function createSafeStorage(): KeyValueStorage {
  const memory = new Map<string, string>()
  const native = (): Storage | null => {
    try {
      return window.localStorage
    } catch {
      return null
    }
  }
  return {
    getItem(key) {
      try {
        return native()?.getItem(key) ?? memory.get(key) ?? null
      } catch {
        return memory.get(key) ?? null
      }
    },
    setItem(key, value) {
      memory.set(key, value)
      try {
        native()?.setItem(key, value)
      } catch {
        // Quota exceeded or storage blocked: the in-memory copy still works.
      }
    },
    removeItem(key) {
      memory.delete(key)
      try {
        native()?.removeItem(key)
      } catch {
        // Ignore: nothing to remove.
      }
    },
  }
}

export const safeStorage = createSafeStorage()
