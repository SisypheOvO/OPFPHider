import { TARGET_PAGE_IDS } from "../constants"
import { PageHandler } from "./page-handler"
import { SettingsPanel } from "./settings"
import { I18nManager } from "../utils/i18n"
import { DomUtils } from "../utils/dom"

export class OPFPHiderManager {
    private pageHandler: PageHandler
    private settingsPanel: SettingsPanel
    private i18n: I18nManager
    private lastUrl: string

    constructor() {
        this.i18n = new I18nManager()
        this.pageHandler = new PageHandler()
        this.settingsPanel = new SettingsPanel(this.i18n)
        this.lastUrl = location.href
    }

    public init(): void {
        DomUtils.injectStyles()
        this.handlePageUpdate()
        this.observePageChanges()
    }

    private addSettingsButton(): void {
        if (document.querySelector("#opfphider-settings-btn")) return

        const settingsBtn = document.createElement("button")
        settingsBtn.id = "opfphider-settings-btn"
        settingsBtn.innerHTML = "⚙️"

        settingsBtn.addEventListener("click", () => this.settingsPanel.toggle())
        document.body.appendChild(settingsBtn)
    }

    private handlePageUpdate(): void {
        this.addSettingsButton()
        this.pageHandler.processRemoveStates()
        TARGET_PAGE_IDS.forEach((pageId) => {
            this.pageHandler.insertButtonForPage(pageId)
        })
    }

    private observePageChanges(): void {
        document.addEventListener(
            "click",
            (e) => {
                const target = e.target as HTMLElement
                const link = target.closest("a")

                if (link && link.href === location.href) {
                    setTimeout(() => {
                        this.handlePageUpdate()
                    }, 1000)
                }
            },
            true
        )

        const observer = new MutationObserver(() => {
            const url = location.href
            if (url !== this.lastUrl && url.startsWith("https://osu.ppy.sh/users/")) {
                this.lastUrl = url
                setTimeout(() => {
                    this.handlePageUpdate()
                }, 1000)
            }
        })

        observer.observe(document, { subtree: true, childList: true })
    }
}
