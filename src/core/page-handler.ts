import { TARGET_PAGE_IDS } from "@/constants"
import { StorageManager } from "@/utils/storage"
import { DomUtils } from "@/utils/dom"
import { DomWaiter } from "@/utils/dom-waiter"

export class PageHandler {
    private pageStates: Map<string, boolean> = new Map()
    private isInitializing: boolean = true
    private initTimer: number | null = null

    constructor() {
        this.initTimer = window.setTimeout(() => {
            this.isInitializing = false
            this.initTimer = null
        }, 1000)
    }

    public async processRemoveStates(): Promise<void> {
        const removeStates = StorageManager.loadRemoveStates()

        for (const pageId of TARGET_PAGE_IDS) {
            if (removeStates[pageId]) {
                await DomWaiter.waitForPageElement(pageId, 3000)
                DomUtils.removePageElement(pageId)
            }
        }
    }

    public async insertButtonForPage(pageId: string): Promise<void> {
        const removeStates = StorageManager.loadRemoveStates()
        if (removeStates[pageId]) {
            return
        }

        const selector = `.js-sortable--page[data-page-id="${pageId}"] .page-extra`

        const targetElement = await DomWaiter.waitForElement(selector, 3000)

        if (!targetElement) {
            console.warn(`[OPFP Hider] Element not found for page: ${pageId}`)
            return
        }

        if (targetElement.querySelector(".custom-inserted-button")) {
            console.log(`[OPFP Hider] Button already exists for: ${pageId}`)
            return
        }

        const button = DomUtils.createCollapseButton()
        button.addEventListener("click", (e) => {
            e.stopPropagation()
            e.preventDefault()
            this.handleButtonClick(pageId, button)
        })

        targetElement.appendChild(button)
        await this.initializePageState(pageId, button)
        console.log(`[OPFP Hider] Button inserted for: ${pageId}`)
    }

    private async initializePageState(pageId: string, button: HTMLButtonElement): Promise<void> {
        const storedStates = StorageManager.loadCollapsedStates()
        const isCollapsed = storedStates.hasOwnProperty(pageId) ? storedStates[pageId] : false
        this.pageStates.set(pageId, isCollapsed)

        // 等待下一帧确保 DOM 更新
        await new Promise((resolve) => requestAnimationFrame(resolve))

        DomUtils.updateButtonIcon(button, isCollapsed)
        if (isCollapsed) {
            this.collapsePage(pageId, true)
        }
    }

    public handleButtonClick(pageId: string, button: HTMLButtonElement): void {
        if (this.isInitializing) {
            console.log("[OPFP Hider] Still initializing, skip button click")
            return
        }

        const isCurrentlyCollapsed = this.pageStates.get(pageId) || false
        const newState = !isCurrentlyCollapsed

        this.pageStates.set(pageId, newState)
        DomUtils.updateButtonIcon(button, newState)

        newState ? this.collapsePage(pageId) : this.expandPage(pageId)
    }

    public collapsePage(pageId: string, immediate: boolean = false): void {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`)
        if (!pageContainer) return

        const pageExtra = pageContainer.querySelector(".page-extra") as HTMLElement
        if (!pageExtra) return

        const uRelative = pageContainer.querySelector(".u-relative") as HTMLElement
        if (!uRelative) return

        const totalHeaderHeight = DomUtils.calculateHeaderHeight(pageId, uRelative)

        if (!pageExtra.dataset.originalHeight) {
            pageExtra.dataset.originalHeight = pageExtra.offsetHeight + "px"
        }

        if (immediate) {
            pageExtra.style.height = totalHeaderHeight + "px"
            pageExtra.style.overflow = "hidden"
            pageExtra.style.transition = "none"
            return
        }

        pageExtra.style.overflow = "hidden"
        const currentHeight = pageExtra.offsetHeight
        pageExtra.style.height = currentHeight + "px"
        pageExtra.style.transition = "height 0.3s ease"

        pageExtra.offsetHeight // Force reflow

        setTimeout(() => {
            pageExtra.style.height = totalHeaderHeight + "px"
        }, 10)
    }

    public expandPage(pageId: string): void {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`)
        if (!pageContainer) return

        const pageExtra = pageContainer.querySelector(".page-extra") as HTMLElement
        if (!pageExtra) return

        const targetHeight = pageExtra.dataset.originalHeight ? parseInt(pageExtra.dataset.originalHeight) : pageExtra.scrollHeight

        pageExtra.style.transition = "height 0.3s ease"
        pageExtra.style.height = targetHeight + "px"

        setTimeout(() => {
            pageExtra.style.height = ""
            pageExtra.style.overflow = ""
            pageExtra.style.transition = ""
        }, 300)
    }
}
