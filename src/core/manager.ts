import { TARGET_PAGE_IDS } from "@/constants"
import { PageHandler } from "./page-handler"
import { SettingsPanel } from "./settings"
import { I18nManager } from "@/utils/i18n"
import { DomUtils } from "@/utils/dom"

export class OPFPHiderManager {
    private pageHandler: PageHandler
    private settingsPanel: SettingsPanel
    private i18n: I18nManager
    private isProcessing: boolean = false

    constructor() {
        this.i18n = new I18nManager()
        this.pageHandler = new PageHandler()
        this.settingsPanel = new SettingsPanel(this.i18n)
    }

    public init(): void {
        DomUtils.injectStyles()
        this.setupTurboListeners()
        this.handlePageUpdate()
    }

    private setupTurboListeners(): void {
        // Turbo 渲染完成后触发
        document.addEventListener("turbo:render", () => {
            console.log("[OPFP Hider] Turbo render event")
            this.handlePageUpdate()
        })

        // Turbo 加载完成后触发（包含异步内容）
        document.addEventListener("turbo:load", () => {
            console.log("[OPFP Hider] Turbo load event")
            this.handlePageUpdate()
        })

        // 备用：监听 turbo:frame-render（如果使用了 Turbo Frames）
        document.addEventListener("turbo:frame-render", () => {
            console.log("[OPFP Hider] Turbo frame render event")
            this.handlePageUpdate()
        })
    }

    private addSettingsButton(): void {
        if (document.querySelector("#opfphider-settings-btn")) return

        const settingsBtn = document.createElement("button")
        settingsBtn.id = "opfphider-settings-btn"
        settingsBtn.innerHTML = "⚙️"

        settingsBtn.addEventListener("click", () => this.settingsPanel.toggle())
        document.body.appendChild(settingsBtn)
    }

    private async handlePageUpdate(): Promise<void> {
        // 防止重复处理
        if (this.isProcessing) {
            console.log("[OPFP Hider] Already processing, skip")
            return
        }

        // 只在用户个人页面执行
        if (!location.pathname.startsWith("/users/")) {
            console.log("[OPFP Hider] Not on user profile page")
            return
        }

        this.isProcessing = true
        console.log("[OPFP Hider] Start processing page")

        try {
            this.addSettingsButton()

            await this.pageHandler.processRemoveStates()

            // 并发插入
            await Promise.all(TARGET_PAGE_IDS.map((pageId) => this.pageHandler.insertButtonForPage(pageId)))

            console.log("[OPFP Hider] Page processing complete")
        } catch (error) {
            console.error("[OPFP Hider] Error updating page:", error)
        } finally {
            this.isProcessing = false
        }
    }
}
