import { PageStates } from "@/types"

export class StorageManager {
    static loadStates(key: string): PageStates {
        try {
            const stored = localStorage.getItem(key)
            return stored ? JSON.parse(stored) : {}
        } catch (e) {
            console.error("Failed to load storage states:", e)
            return {}
        }
    }

    static saveStates(key: string, states: PageStates): void {
        try {
            localStorage.setItem(key, JSON.stringify(states))
        } catch (e) {
            console.error("Failed to save states:", e)
        }
    }

    static loadCollapsedStates(): PageStates {
        return this.loadStates("opfphider-collapsed-states")
    }

    static loadRemoveStates(): PageStates {
        return this.loadStates("opfphider-remove-states")
    }

    static saveCollapsedStates(states: PageStates): void {
        this.saveStates("opfphider-collapsed-states", states)
    }

    static saveRemoveStates(states: PageStates): void {
        this.saveStates("opfphider-remove-states", states)
    }

    static getLanguage(): string {
        try {
            return localStorage.getItem("opfphider-language") || "en"
        } catch (e) {
            console.error("Failed to load language:", e)
            return "en"
        }
    }

    static setLanguage(lang: string): void {
        try {
            localStorage.setItem("opfphider-language", lang)
        } catch (e) {
            console.error("Failed to save language:", e)
        }
    }
}
