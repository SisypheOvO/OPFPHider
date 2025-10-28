// src/utils/dom.ts
import { TARGET_PAGE_IDS, CHEVRON_ICONS } from "../constants"

export class DomUtils {
    static getPageName(pageId: string): string {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`)
        if (!pageContainer) return pageId

        const titleElement = pageContainer.querySelector(".u-relative .title.title--page-extra h2") as HTMLElement
        if (titleElement) {
            return titleElement.textContent?.trim() || pageId
        }

        const fallbackTitle = pageContainer.querySelector(".u-relative h2") as HTMLElement
        if (fallbackTitle) {
            return fallbackTitle.textContent?.trim() || pageId
        }

        return pageId
    }

    static getAllPageNames(): Record<string, string> {
        const pageNames: Record<string, string> = {}
        TARGET_PAGE_IDS.forEach((pageId) => {
            pageNames[pageId] = this.getPageName(pageId)
        })
        return pageNames
    }

    static createCollapseButton(): HTMLButtonElement {
        const button = document.createElement("button")
        button.className = "custom-inserted-button"
        button.innerHTML = `
            <svg class="chevron-icon" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${CHEVRON_ICONS.DOWN}
            </svg>
        `
        return button
    }

    static updateButtonIcon(button: HTMLButtonElement, isCollapsed: boolean): void {
        const chevronIcon = button.querySelector(".chevron-icon")
        if (chevronIcon) {
            chevronIcon.innerHTML = isCollapsed ? CHEVRON_ICONS.DOWN : CHEVRON_ICONS.UP
        }
    }

    static calculateHeaderHeight(pageId: string, uRelative: HTMLElement): number {
        const uRelativeHeight = uRelative.offsetHeight
        const computedStyle = window.getComputedStyle(uRelative)
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0
        const extraBuffer = 14

        let totalHeaderHeight = uRelativeHeight + paddingTop + paddingBottom + extraBuffer

        if (pageId === "me") {
            const meExpander = document.querySelector('.js-sortable--page[data-page-id="me"] .me-expander') as HTMLElement
            if (meExpander) {
                const meExpanderHeight = meExpander.offsetHeight
                const meExpanderComputedStyle = window.getComputedStyle(meExpander)
                const meExpanderMarginTop = parseFloat(meExpanderComputedStyle.marginTop) || 0
                const meExpanderMarginBottom = parseFloat(meExpanderComputedStyle.marginBottom) || 0

                totalHeaderHeight += meExpanderHeight + meExpanderMarginTop + meExpanderMarginBottom
            }
        }

        return totalHeaderHeight
    }

    static removePageElement(pageId: string): void {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`) as HTMLElement | null;
        if (pageContainer) {
            pageContainer.style.display = 'none';
        }

        // 删除标签页导航
        const tabLink = document.querySelector(`.page-mode--profile-page-extra a.page-mode__item.js-sortable--tab.ui-sortable-handle[data-page-id="${pageId}"]`) as HTMLElement | null;
        if (tabLink) {
            tabLink.style.display = 'none';
        }
    }

    public static injectStyles(): void {
        if (document.querySelector("#opfphider-styles")) return

        const style = document.createElement("style")
        style.id = "opfphider-styles"
        style.textContent = this.getStyles()
        document.head.appendChild(style)
    }

    private static getStyles(): string {
        return `
            /* 设置按钮 */
        #opfphider-settings-btn {
            position: fixed;
            bottom: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        }

        #opfphider-settings-btn:hover {
            transform: scale(1.1) rotate(90deg);
        }

        /* 折叠按钮 */
        .custom-inserted-button {
            width: 30px;
            height: 30px;
            padding: 0;
            background: hsl(var(--hsl-h2));
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            z-index: 10;
            position: absolute;
            right: 14px;
            top: 14px;
        }

        .custom-inserted-button:hover {
            background: hsl(var(--hsl-h1));
        }

        /* 设置面板 */
        #opfphider-settings-panel {
            position: fixed;
            bottom: 70px;
            right: 16px;
            width: 280px;
            background: #2e3038;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 20px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            max-height: 80vh;
            overflow-y: auto;
        }

        /* 设置面板滚动条样式 */
        #opfphider-settings-panel::-webkit-scrollbar {
            width: 6px;
        }

        #opfphider-settings-panel::-webkit-scrollbar-thumb {
            background: hsl(var(--hsl-h2));
            border-radius: 4px;
        }

        #opfphider-settings-panel::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--hsl-h1));
        }

        /* 其他现有样式保持不变 */
        .page-extra {
            position: relative !important;
        }

        .sortable-handle--profile-page-extra {
            margin-right: 14px !important;
            margin-top: -3px !important;
        }

        .page-extra--userpage .sortable-handle--profile-page-extra {
            margin-right: 54px !important;
            margin-top: -3px !important;
        }

        .page-extra__actions {
            right: 74px !important;
            top: 14px !important;
        }

        .chevron-icon {
            transition: transform 0.3s ease;
        }

        #opfphider-save, #opfphider-cancel {
            width: 80px;
            padding: 8px;
            color: white;
            border: none;
            border-radius: 9999px;
            cursor: pointer;
            font-size: 12px;
            flex: 1;
        }

        #opfphider-save {
            background: hsl(var(--hsl-h2));
        }

        #opfphider-cancel {
            background: hsl(var(--hsl-b2));
        }

        #opfphider-save:hover {
            background: hsl(var(--hsl-h1));
            transition: background-color .2s;
            text-transform: none;
        }

        #opfphider-cancel:hover {
            background: hsl(var(--hsl-b1));
            transition: background-color .2s;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        `
    }
}
