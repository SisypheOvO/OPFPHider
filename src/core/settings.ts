import { TARGET_PAGE_IDS, I18N } from "@/constants"
import { StorageManager } from "@/utils/storage"
import { DomUtils } from "@/utils/dom"
import { I18nManager } from "@/utils/i18n"
import { PageStates } from "@/types"

export class SettingsPanel {
    private i18n: I18nManager
    private languageChangeHandler?: (e: Event) => void
    private saveHandler?: () => void
    private cancelHandler?: () => void

    constructor(i18n: I18nManager) {
        this.i18n = i18n
    }

    public toggle(): void {
        const existingPanel = document.querySelector("#opfphider-settings-panel")
        if (existingPanel) {
            existingPanel.remove()
            return
        }

        this.createPanel()
    }

    public ensureEventListeners(): void {
        const existingPanel = document.querySelector("#opfphider-settings-panel") as HTMLElement
        if (existingPanel) {
            this.reattachEventListeners(existingPanel)
        }
    }

    private reattachEventListeners(panel: HTMLElement): void {
        const languageSelect = panel.querySelector("#opfphider-language-select") as HTMLSelectElement
        const saveButton = panel.querySelector("#opfphider-save") as HTMLButtonElement
        const cancelButton = panel.querySelector("#opfphider-cancel") as HTMLButtonElement

        if (this.languageChangeHandler) {
            languageSelect?.removeEventListener("change", this.languageChangeHandler)
        }
        if (this.saveHandler) {
            saveButton?.removeEventListener("click", this.saveHandler)
        }
        if (this.cancelHandler) {
            cancelButton?.removeEventListener("click", this.cancelHandler)
        }

        this.attachEventListeners(panel)
    }

    private createPanel(): void {
        const storedStates = StorageManager.collapsed.get()
        const removeStates = StorageManager.removed.get()
        const pageNames = DomUtils.getAllPageNames()
        const currentLang = this.i18n.getCurrentLanguage()

        const panel = document.createElement("div")
        panel.id = "opfphider-settings-panel"

        panel.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid hsl(var(--hsl-h1)); padding-bottom: 10px;">
        <div style="font-weight: bold; color: #fff;">
          OPFP Hider Settings
        </div>
        <select id="opfphider-language-select" style="background: #3a3c45; color: white; border: 1px solid #555; border-radius: 4px; padding: 2px 6px; font-size: 12px;">
          ${Object.keys(I18N)
              .map((lang) => `<option value="${lang}" ${currentLang === lang ? "selected" : ""}>${this.getLanguageName(lang)}</option>`)
              .join("")}
        </select>
      </div>

      <div style="font-size: 12px; color: #fff; margin-bottom: 10px; font-weight: bold;">
        ${this.i18n.getTranslation("collapseDescription")}
      </div>
      ${TARGET_PAGE_IDS.map(
          (pageId) => `
        <label style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
          <input
            type="checkbox" ${storedStates[pageId] ? "checked" : ""}
            data-page="${pageId}"
            data-type="collapse"
            style="margin-right: 8px;"
          >
          ${pageNames[pageId]}
        </label>
      `,
      ).join("")}

      <div style="margin-top: 20px; font-size: 12px; color: #fff; margin-bottom: 10px; font-weight: bold;">
        ${this.i18n.getTranslation("removeDescription")}
      </div>
      ${TARGET_PAGE_IDS.map(
          (pageId) => `
        <label style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
          <input
            type="checkbox" ${removeStates[pageId] ? "checked" : ""}
            data-page="${pageId}"
            data-type="remove"
            style="margin-right: 8px;"
          >
          ${pageNames[pageId]}
        </label>
      `,
      ).join("")}

      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button id="opfphider-save">
          ${this.i18n.getTranslation("save")}
        </button>
        <button id="opfphider-cancel">
          ${this.i18n.getTranslation("cancel")}
        </button>
      </div>
    `

        document.body.appendChild(panel)

        this.attachEventListeners(panel)
    }

    private getLanguageName(lang: string): string {
        const names: Record<string, string> = {
            en: "English",
            "zh-CN": "中文",
            ja: "日本語",
            ko: "한국어",
            ru: "Русский",
        }
        return names[lang] || lang
    }

    private attachEventListeners(panel: HTMLElement): void {
        const languageSelect = panel.querySelector("#opfphider-language-select") as HTMLSelectElement
        const saveButton = panel.querySelector("#opfphider-save") as HTMLButtonElement
        const cancelButton = panel.querySelector("#opfphider-cancel") as HTMLButtonElement

        // 创建命名函数并保存引用
        this.languageChangeHandler = (e: Event) => {
            const target = e.target as HTMLSelectElement
            this.i18n.setLanguage(target.value)
            panel.remove()
            this.toggle()
        }

        this.saveHandler = () => this.saveSettings(panel)
        this.cancelHandler = () => panel.remove()

        languageSelect?.addEventListener("change", this.languageChangeHandler)
        saveButton?.addEventListener("click", this.saveHandler)
        cancelButton?.addEventListener("click", this.cancelHandler)
    }

    private saveSettings(panel: HTMLElement): void {
        const collapseCheckboxes = panel.querySelectorAll('input[data-type="collapse"]')
        const removeCheckboxes = panel.querySelectorAll('input[data-type="remove"]')

        const newCollapseStates: PageStates = {}
        collapseCheckboxes.forEach((checkbox: Element) => {
            const input = checkbox as HTMLInputElement
            newCollapseStates[input.dataset.page!] = input.checked
        })

        const newRemoveStates: PageStates = {}
        removeCheckboxes.forEach((checkbox: Element) => {
            const input = checkbox as HTMLInputElement
            newRemoveStates[input.dataset.page!] = input.checked
        })

        StorageManager.collapsed.set(newCollapseStates)
        StorageManager.removed.set(newRemoveStates)

        panel.remove()
    }
}
