import { PageStates } from "@/types"
import { STORAGE_KEYS } from "@/constants"

export class StorageManager {
    private static get<T>(key: string, fallback: T): T {
        try {
            const value = localStorage.getItem(key)
            if (!value) return fallback
            return typeof fallback === "object" ? (JSON.parse(value) as T) : (value as unknown as T)
        } catch {
            return fallback
        }
    }

    private static set(key: string, value: any): void {
        try {
            const data = typeof value === "object" ? JSON.stringify(value) : value
            localStorage.setItem(key, data)
        } catch (e) {
            console.error("[Storage] Failed to save:", e)
        }
    }

    static collapsed = {
        get: (): PageStates => StorageManager.get(STORAGE_KEYS.COLLAPSED, {}),
        set: (states: PageStates) => StorageManager.set(STORAGE_KEYS.COLLAPSED, states),
    }

    static removed = {
        get: (): PageStates => StorageManager.get(STORAGE_KEYS.REMOVED, {}),
        set: (states: PageStates) => StorageManager.set(STORAGE_KEYS.REMOVED, states),
    }

    static language = {
        get: (): string => StorageManager.get(STORAGE_KEYS.LANGUAGE, "en"),
        set: (lang: string) => StorageManager.set(STORAGE_KEYS.LANGUAGE, lang),
    }
}
