import { TARGET_PAGE_IDS } from "../constants"
import { StorageManager } from "../utils/storage"
import { DomUtils } from "../utils/dom"

export class PageHandler {
    private pageStates: Map<string, boolean> = new Map()
    private isInitializing: boolean = true

    constructor() {
        setTimeout(() => {
            this.isInitializing = false
        }, 2000)
    }

    public processRemoveStates(): void {
        const removeStates = StorageManager.loadRemoveStates()
        TARGET_PAGE_IDS.forEach((pageId) => {
            if (removeStates[pageId]) {
                DomUtils.removePageElement(pageId)
            }
        })
    }

    public insertButtonForPage(pageId: string): void {
        const removeStates = StorageManager.loadRemoveStates()
        if (removeStates[pageId]) {
            return
        }

        const selector = `.osu-layout.osu-layout--full .osu-page.osu-page--generic-compact .user-profile-pages.ui-sortable .js-sortable--page[data-page-id="${pageId}"] .page-extra`
        const targetElement = document.querySelector(selector)

        if (targetElement && !targetElement.querySelector(".custom-inserted-button")) {
            const button = DomUtils.createCollapseButton()

            button.addEventListener("click", (e) => {
                e.stopPropagation()
                e.preventDefault()
                this.handleButtonClick(pageId, button)
            })
            targetElement.appendChild(button)
            this.initializePageState(pageId, button)
        }
    }

    private initializePageState(pageId: string, button: HTMLButtonElement): void {
        const storedStates = StorageManager.loadCollapsedStates()
        const isCollapsed = storedStates.hasOwnProperty(pageId) ? storedStates[pageId] : false
        this.pageStates.set(pageId, isCollapsed)

        setTimeout(() => {
            DomUtils.updateButtonIcon(button, isCollapsed)
            if (isCollapsed) {
                this.collapsePage(pageId, true)
            }
        }, 500)
    }

    public handleButtonClick(pageId: string, button: HTMLButtonElement): void {
        console.log("Button clicked for page:", pageId)
        if (this.isInitializing) return

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

        // Force reflow
        pageExtra.offsetHeight

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
