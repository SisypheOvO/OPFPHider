// ==UserScript==
// @name         OPFPHider
// @name:zh-CN   OPFP隐藏器
// @namespace    URL
// @version      2.3.0
// @description  Hide Osu! Profile sections optionally
// @description:zh-CN  可选地隐藏Osu!个人资料的各个不同部分
// @author       Sisyphus
// @license      MIT
// @homepage     https://github.com/SisypheOvO
// @match        https://osu.ppy.sh/users/*
// @run-at       document-end
// @grant        none
// @downloadURL https://raw.githubusercontent.com/SisypheOvO/OPFPHider/main/dist/opfphider.user.js
// @updateURL https://raw.githubusercontent.com/SisypheOvO/OPFPHider/main/dist/opfphider.user.js
// ==/UserScript==


(function () {
    'use strict';

    const TARGET_PAGE_IDS = ["me", "beatmaps", "recent_activity", "top_ranks", "medals", "historical", "kudosu"];
    const CHEVRON_ICONS = {
        DOWN: '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 1)"/>',
        UP: '<path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, -1)"/>',
    };
    const I18N = {
        en: {
            collapseDescription: "Pages collapsed by default",
            removeDescription: "Pages hidden completely",
            save: "Save",
            cancel: "Cancel",
            refreshNotification: "Settings saved! Changes to removed pages require a page refresh to take effect.",
        },
        "zh-CN": {
            collapseDescription: "默认收起的模块",
            removeDescription: "直接隐藏的模块",
            save: "保存",
            cancel: "取消",
            refreshNotification: "设置已保存！删除页面的更改需要刷新页面才能生效。",
        },
        ja: {
            collapseDescription: "デフォルトで折りたたむモジュール",
            removeDescription: "完全に非表示にするモジュール",
            save: "保存",
            cancel: "キャンセル",
            refreshNotification: "設定を保存しました！削除したページの変更を反映するにはページを更新してください。",
        },
        ko: {
            collapseDescription: "기본적으로 접힌 모듈",
            removeDescription: "완전히 숨기는 모듈",
            save: "저장",
            cancel: "취소",
            refreshNotification: "설정이 저장되었습니다! 삭제된 페이지 변경사항을 적용하려면 페이지를 새로고침해야 합니다.",
        },
        ru: {
            // cSpell:disable
            collapseDescription: "Модули, свёрнутые по умолчанию",
            removeDescription: "Модули, полностью скрытые",
            save: "Сохранить",
            cancel: "Отмена",
            refreshNotification: "Настройки сохранены! Для применения изменений к удалённым страницам требуется перезагрузка страницы.",
        }, // cSpell:enable
    };

    class StorageManager {
        static loadStates(key) {
            try {
                const stored = localStorage.getItem(key);
                return stored ? JSON.parse(stored) : {};
            }
            catch (e) {
                console.error("Failed to load storage states:", e);
                return {};
            }
        }
        static saveStates(key, states) {
            try {
                localStorage.setItem(key, JSON.stringify(states));
            }
            catch (e) {
                console.error("Failed to save states:", e);
            }
        }
        static loadCollapsedStates() {
            return this.loadStates("opfphider-collapsed-states");
        }
        static loadRemoveStates() {
            return this.loadStates("opfphider-remove-states");
        }
        static saveCollapsedStates(states) {
            this.saveStates("opfphider-collapsed-states", states);
        }
        static saveRemoveStates(states) {
            this.saveStates("opfphider-remove-states", states);
        }
        static getLanguage() {
            try {
                return localStorage.getItem("opfphider-language") || "en";
            }
            catch (e) {
                console.error("Failed to load language:", e);
                return "en";
            }
        }
        static setLanguage(lang) {
            try {
                localStorage.setItem("opfphider-language", lang);
            }
            catch (e) {
                console.error("Failed to save language:", e);
            }
        }
    }

    // src/utils/dom.ts
    class DomUtils {
        static getPageName(pageId) {
            const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
            if (!pageContainer)
                return pageId;
            const titleElement = pageContainer.querySelector(".u-relative .title.title--page-extra h2");
            if (titleElement) {
                return titleElement.textContent?.trim() || pageId;
            }
            const fallbackTitle = pageContainer.querySelector(".u-relative h2");
            if (fallbackTitle) {
                return fallbackTitle.textContent?.trim() || pageId;
            }
            return pageId;
        }
        static getAllPageNames() {
            const pageNames = {};
            TARGET_PAGE_IDS.forEach((pageId) => {
                pageNames[pageId] = this.getPageName(pageId);
            });
            return pageNames;
        }
        static createCollapseButton() {
            const button = document.createElement("button");
            button.className = "custom-inserted-button";
            button.innerHTML = `
            <svg class="chevron-icon" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${CHEVRON_ICONS.DOWN}
            </svg>
        `;
            return button;
        }
        static updateButtonIcon(button, isCollapsed) {
            const chevronIcon = button.querySelector(".chevron-icon");
            if (chevronIcon) {
                chevronIcon.innerHTML = isCollapsed ? CHEVRON_ICONS.DOWN : CHEVRON_ICONS.UP;
            }
        }
        static calculateHeaderHeight(pageId, uRelative) {
            const uRelativeHeight = uRelative.offsetHeight;
            const computedStyle = window.getComputedStyle(uRelative);
            const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
            const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
            const extraBuffer = 14;
            let totalHeaderHeight = uRelativeHeight + paddingTop + paddingBottom + extraBuffer;
            if (pageId === "me") {
                const meExpander = document.querySelector('.js-sortable--page[data-page-id="me"] .me-expander');
                if (meExpander) {
                    const meExpanderHeight = meExpander.offsetHeight;
                    const meExpanderComputedStyle = window.getComputedStyle(meExpander);
                    const meExpanderMarginTop = parseFloat(meExpanderComputedStyle.marginTop) || 0;
                    const meExpanderMarginBottom = parseFloat(meExpanderComputedStyle.marginBottom) || 0;
                    totalHeaderHeight += meExpanderHeight + meExpanderMarginTop + meExpanderMarginBottom;
                }
            }
            return totalHeaderHeight;
        }
        static removePageElement(pageId) {
            const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
            if (pageContainer) {
                pageContainer.style.display = 'none';
            }
            // 删除标签页导航
            const tabLink = document.querySelector(`.page-mode--profile-page-extra a.page-mode__item.js-sortable--tab.ui-sortable-handle[data-page-id="${pageId}"]`);
            if (tabLink) {
                tabLink.style.display = 'none';
            }
        }
        static injectStyles() {
            if (document.querySelector("#opfphider-styles"))
                return;
            const style = document.createElement("style");
            style.id = "opfphider-styles";
            style.textContent = this.getStyles();
            document.head.appendChild(style);
        }
        static getStyles() {
            return `
            /* 设置按钮 */
        #opfphider-settings-btn {
            position: fixed;
            bottom: 16px;
            right: 16px;
            width: 36px;
            height: 36px;
            background: hsl(var(--hsl-h2));
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
        }

        #opfphider-settings-btn:hover {
            background: hsl(var(--hsl-h1));
            filter: brightness(0.95);
            transform: scale(1.05) rotate(90deg);
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
        `;
        }
    }

    class DomWaiter {
        /**
         * 等待元素出现，针对 Turbo 优化
         */
        static waitForElement(selector, timeout = 5000) {
            return new Promise((resolve) => {
                // 先立即检查
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }
                let timer = null;
                const observer = new MutationObserver(() => {
                    const element = document.querySelector(selector);
                    if (element) {
                        observer.disconnect();
                        if (timer !== null)
                            clearTimeout(timer);
                        resolve(element);
                    }
                });
                // 只监听 body (Turbo 渲染主要在 body 内部进行)
                observer.observe(document.body, {
                    childList: true,
                    subtree: true,
                });
                timer = window.setTimeout(() => {
                    observer.disconnect();
                    console.warn(`[DomWaiter] Timeout waiting for: ${selector}`);
                    resolve(null);
                }, timeout);
            });
        }
        static waitForPageElement(pageId, timeout = 5000) {
            const selector = `.js-sortable--page[data-page-id="${pageId}"]`;
            return this.waitForElement(selector, timeout);
        }
    }

    class PageHandler {
        constructor() {
            this.pageStates = new Map();
            this.isInitializing = true;
            this.initTimer = null;
            this.initTimer = window.setTimeout(() => {
                this.isInitializing = false;
                this.initTimer = null;
            }, 1000);
        }
        async processRemoveStates() {
            const removeStates = StorageManager.loadRemoveStates();
            for (const pageId of TARGET_PAGE_IDS) {
                if (removeStates[pageId]) {
                    await DomWaiter.waitForPageElement(pageId, 3000);
                    DomUtils.removePageElement(pageId);
                }
            }
        }
        async insertButtonForPage(pageId) {
            const removeStates = StorageManager.loadRemoveStates();
            if (removeStates[pageId]) {
                return;
            }
            const selector = `.js-sortable--page[data-page-id="${pageId}"] .page-extra`;
            const targetElement = await DomWaiter.waitForElement(selector, 3000);
            if (!targetElement) {
                console.warn(`[OPFP Hider] Element not found for page: ${pageId}`);
                return;
            }
            if (targetElement.querySelector(".custom-inserted-button")) {
                console.log(`[OPFP Hider] Button already exists for: ${pageId}`);
                return;
            }
            const button = DomUtils.createCollapseButton();
            button.addEventListener("click", (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.handleButtonClick(pageId, button);
            });
            targetElement.appendChild(button);
            await this.initializePageState(pageId, button);
            console.log(`[OPFP Hider] Button inserted for: ${pageId}`);
        }
        async initializePageState(pageId, button) {
            const storedStates = StorageManager.loadCollapsedStates();
            const isCollapsed = storedStates.hasOwnProperty(pageId) ? storedStates[pageId] : false;
            this.pageStates.set(pageId, isCollapsed);
            // 等待下一帧确保 DOM 更新
            await new Promise((resolve) => requestAnimationFrame(resolve));
            DomUtils.updateButtonIcon(button, isCollapsed);
            if (isCollapsed) {
                this.collapsePage(pageId, true);
            }
        }
        handleButtonClick(pageId, button) {
            if (this.isInitializing) {
                console.log("[OPFP Hider] Still initializing, skip button click");
                return;
            }
            const isCurrentlyCollapsed = this.pageStates.get(pageId) || false;
            const newState = !isCurrentlyCollapsed;
            this.pageStates.set(pageId, newState);
            DomUtils.updateButtonIcon(button, newState);
            newState ? this.collapsePage(pageId) : this.expandPage(pageId);
        }
        collapsePage(pageId, immediate = false) {
            const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
            if (!pageContainer)
                return;
            const pageExtra = pageContainer.querySelector(".page-extra");
            if (!pageExtra)
                return;
            const uRelative = pageContainer.querySelector(".u-relative");
            if (!uRelative)
                return;
            const totalHeaderHeight = DomUtils.calculateHeaderHeight(pageId, uRelative);
            if (!pageExtra.dataset.originalHeight) {
                pageExtra.dataset.originalHeight = pageExtra.offsetHeight + "px";
            }
            if (immediate) {
                pageExtra.style.height = totalHeaderHeight + "px";
                pageExtra.style.overflow = "hidden";
                pageExtra.style.transition = "none";
                return;
            }
            pageExtra.style.overflow = "hidden";
            const currentHeight = pageExtra.offsetHeight;
            pageExtra.style.height = currentHeight + "px";
            pageExtra.style.transition = "height 0.3s ease";
            pageExtra.offsetHeight; // Force reflow
            setTimeout(() => {
                pageExtra.style.height = totalHeaderHeight + "px";
            }, 10);
        }
        expandPage(pageId) {
            const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
            if (!pageContainer)
                return;
            const pageExtra = pageContainer.querySelector(".page-extra");
            if (!pageExtra)
                return;
            const targetHeight = pageExtra.dataset.originalHeight ? parseInt(pageExtra.dataset.originalHeight) : pageExtra.scrollHeight;
            pageExtra.style.transition = "height 0.3s ease";
            pageExtra.style.height = targetHeight + "px";
            setTimeout(() => {
                pageExtra.style.height = "";
                pageExtra.style.overflow = "";
                pageExtra.style.transition = "";
            }, 300);
        }
    }

    class SettingsPanel {
        constructor(i18n) {
            this.i18n = i18n;
        }
        toggle() {
            const existingPanel = document.querySelector("#opfphider-settings-panel");
            if (existingPanel) {
                existingPanel.remove();
                return;
            }
            this.createPanel();
        }
        createPanel() {
            const storedStates = StorageManager.loadCollapsedStates();
            const removeStates = StorageManager.loadRemoveStates();
            const pageNames = DomUtils.getAllPageNames();
            const currentLang = this.i18n.getCurrentLanguage();
            const panel = document.createElement("div");
            panel.id = "opfphider-settings-panel";
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
      ${TARGET_PAGE_IDS.map((pageId) => `
        <label style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
          <input
            type="checkbox" ${storedStates[pageId] ? "checked" : ""}
            data-page="${pageId}"
            data-type="collapse"
            style="margin-right: 8px;"
          >
          ${pageNames[pageId]}
        </label>
      `).join("")}

      <div style="margin-top: 20px; font-size: 12px; color: #fff; margin-bottom: 10px; font-weight: bold;">
        ${this.i18n.getTranslation("removeDescription")}
      </div>
      ${TARGET_PAGE_IDS.map((pageId) => `
        <label style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
          <input
            type="checkbox" ${removeStates[pageId] ? "checked" : ""}
            data-page="${pageId}"
            data-type="remove"
            style="margin-right: 8px;"
          >
          ${pageNames[pageId]}
        </label>
      `).join("")}

      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button id="opfphider-save">
          ${this.i18n.getTranslation("save")}
        </button>
        <button id="opfphider-cancel">
          ${this.i18n.getTranslation("cancel")}
        </button>
      </div>
    `;
            document.body.appendChild(panel);
            this.attachEventListeners(panel);
        }
        getLanguageName(lang) {
            const names = {
                en: "English",
                "zh-CN": "中文",
                ja: "日本語",
                ko: "한국어",
                ru: "Русский",
            };
            return names[lang] || lang;
        }
        attachEventListeners(panel) {
            const languageSelect = panel.querySelector("#opfphider-language-select");
            const saveButton = panel.querySelector("#opfphider-save");
            const cancelButton = panel.querySelector("#opfphider-cancel");
            languageSelect?.addEventListener("change", (e) => {
                const target = e.target;
                this.i18n.setLanguage(target.value);
                panel.remove();
                this.toggle();
            });
            saveButton?.addEventListener("click", () => this.saveSettings(panel));
            cancelButton?.addEventListener("click", () => panel.remove());
        }
        saveSettings(panel) {
            const collapseCheckboxes = panel.querySelectorAll('input[data-type="collapse"]');
            const removeCheckboxes = panel.querySelectorAll('input[data-type="remove"]');
            const newCollapseStates = {};
            collapseCheckboxes.forEach((checkbox) => {
                const input = checkbox;
                newCollapseStates[input.dataset.page] = input.checked;
            });
            StorageManager.saveCollapsedStates(newCollapseStates);
            const newRemoveStates = {};
            removeCheckboxes.forEach((checkbox) => {
                const input = checkbox;
                newRemoveStates[input.dataset.page] = input.checked;
            });
            StorageManager.saveRemoveStates(newRemoveStates);
            panel.remove();
        }
    }

    class I18nManager {
        constructor() {
            this.currentLanguage = this.detectLanguage();
        }
        detectLanguage() {
            const storedLang = StorageManager.getLanguage();
            if (storedLang && I18N[storedLang]) {
                return storedLang;
            }
            const htmlLang = document.documentElement.lang;
            if (htmlLang) {
                const primaryLang = htmlLang.split("-")[0];
                const fullLang = htmlLang;
                if (I18N[fullLang])
                    return fullLang;
                if (I18N[primaryLang])
                    return primaryLang;
            }
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang) {
                const primaryBrowserLang = browserLang.split("-")[0];
                const fullBrowserLang = browserLang;
                if (I18N[fullBrowserLang])
                    return fullBrowserLang;
                if (I18N[primaryBrowserLang])
                    return primaryBrowserLang;
            }
            return "en";
        }
        getTranslation(key) {
            const strings = I18N[this.currentLanguage] || I18N.en;
            return strings[key] || key;
        }
        setLanguage(lang) {
            if (I18N[lang]) {
                this.currentLanguage = lang;
                StorageManager.setLanguage(lang);
            }
        }
        getCurrentLanguage() {
            return this.currentLanguage;
        }
    }

    class OPFPHiderManager {
        constructor() {
            this.isProcessing = false;
            this.i18n = new I18nManager();
            this.pageHandler = new PageHandler();
            this.settingsPanel = new SettingsPanel(this.i18n);
        }
        init() {
            DomUtils.injectStyles();
            this.setupTurboListeners();
            this.handlePageUpdate();
        }
        setupTurboListeners() {
            // Turbo 渲染完成后触发
            document.addEventListener("turbo:render", () => {
                console.log("[OPFP Hider] Turbo render event");
                this.handlePageUpdate();
            });
            // Turbo 加载完成后触发（包含异步内容）
            document.addEventListener("turbo:load", () => {
                console.log("[OPFP Hider] Turbo load event");
                this.handlePageUpdate();
            });
            // 备用：监听 turbo:frame-render（如果使用了 Turbo Frames）
            document.addEventListener("turbo:frame-render", () => {
                console.log("[OPFP Hider] Turbo frame render event");
                this.handlePageUpdate();
            });
        }
        addSettingsButton() {
            if (document.querySelector("#opfphider-settings-btn"))
                return;
            const settingsBtn = document.createElement("button");
            settingsBtn.id = "opfphider-settings-btn";
            settingsBtn.innerHTML = "⚙️";
            settingsBtn.addEventListener("click", () => this.settingsPanel.toggle());
            document.body.appendChild(settingsBtn);
        }
        async handlePageUpdate() {
            // 防止重复处理
            if (this.isProcessing) {
                console.log("[OPFP Hider] Already processing, skip");
                return;
            }
            // 只在用户个人页面执行
            if (!location.pathname.startsWith("/users/")) {
                console.log("[OPFP Hider] Not on user profile page");
                return;
            }
            this.isProcessing = true;
            console.log("[OPFP Hider] Start processing page");
            try {
                this.addSettingsButton();
                await this.pageHandler.processRemoveStates();
                // 并发插入
                await Promise.all(TARGET_PAGE_IDS.map((pageId) => this.pageHandler.insertButtonForPage(pageId)));
                console.log("[OPFP Hider] Page processing complete");
            }
            catch (error) {
                console.error("[OPFP Hider] Error updating page:", error);
            }
            finally {
                this.isProcessing = false;
            }
        }
    }

    function init() {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                new OPFPHiderManager().init();
            });
        }
        else {
            new OPFPHiderManager().init();
        }
    }
    init();

})();
