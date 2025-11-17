import { I18N } from "@/constants"
import { StorageManager } from "./storage"

export class I18nManager {
    private currentLanguage: string

    constructor() {
        this.currentLanguage = this.detectLanguage()
    }

    private detectLanguage(): string {
        const storedLang = StorageManager.getLanguage()
        if (storedLang && I18N[storedLang as keyof typeof I18N]) {
            return storedLang
        }

        const htmlLang = document.documentElement.lang
        if (htmlLang) {
            const primaryLang = htmlLang.split("-")[0]
            const fullLang = htmlLang

            if (I18N[fullLang as keyof typeof I18N]) return fullLang
            if (I18N[primaryLang as keyof typeof I18N]) return primaryLang
        }

        const browserLang = navigator.language || (navigator as any).userLanguage
        if (browserLang) {
            const primaryBrowserLang = browserLang.split("-")[0]
            const fullBrowserLang = browserLang

            if (I18N[fullBrowserLang as keyof typeof I18N]) return fullBrowserLang
            if (I18N[primaryBrowserLang as keyof typeof I18N]) return primaryBrowserLang
        }

        return "en"
    }

    public getTranslation(key: string): string {
        const strings = I18N[this.currentLanguage as keyof typeof I18N] || I18N.en
        return strings[key as keyof typeof strings] || key
    }

    public setLanguage(lang: string): void {
        if (I18N[lang as keyof typeof I18N]) {
            this.currentLanguage = lang
            StorageManager.setLanguage(lang)
        }
    }

    public getCurrentLanguage(): string {
        return this.currentLanguage
    }
}
