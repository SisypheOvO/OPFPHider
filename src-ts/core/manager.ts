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
        DomUtils.injectStyles();
        this.addSettingsButton()
        this.pageHandler.processRemoveStates()
        TARGET_PAGE_IDS.forEach((pageId) => {
            this.pageHandler.insertButtonForPage(pageId)
        })
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

    private observePageChanges(): void {
        const observer = new MutationObserver(() => {
            const url = location.href
            if (url !== this.lastUrl) {
                this.lastUrl = url
                setTimeout(() => {
                    this.pageHandler.processRemoveStates()
                    this.addSettingsButton()
                    TARGET_PAGE_IDS.forEach((pageId) => {
                        this.pageHandler.insertButtonForPage(pageId)
                    })
                }, 1000)
            }
        })

        observer.observe(document, { subtree: true, childList: true })

        const pageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            const element = node as Element
                            if (element.classList && (element.classList.contains("js-sortable--page") || element.querySelector(".js-sortable--page") || element.classList.contains("me-expander") || element.querySelector(".me-expander"))) {
                                setTimeout(() => {
                                    this.pageHandler.processRemoveStates()
                                    this.addSettingsButton()
                                    TARGET_PAGE_IDS.forEach((pageId) => {
                                        this.pageHandler.insertButtonForPage(pageId)
                                    })
                                }, 500)
                            }
                        }
                    })
                }
            })
        })

        pageObserver.observe(document.body, {
            childList: true,
            subtree: true,
        })
    }
}
