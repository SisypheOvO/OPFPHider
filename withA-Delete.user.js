// ==UserScript==
// @name         OPFPHider
// @name:zh-CN   OPFP隐藏器
// @namespace    URL
// @version      0.7
// @description  Hide Osu! Profile sections optionally
// @description:zh-CN  可选地隐藏Osu!个人资料的各个不同部分
// @author       Sisyphus
// @license      MIT
// @homepage     https://github.com/SisypheOvO
// @match        https://osu.ppy.sh/users/*
// @run-at       document-end
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 目标页面的 data-page-id 值
    const targetPageIds = ['me', 'beatmaps', 'recent_activity', 'top_ranks', 'medals', 'historical', 'kudosu'];
    const CHEVRON_ICONS = {
        DOWN: '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 1)"/>',
        UP: '<path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, -1)"/>'
    };

    const pageStates = new Map();
    const STORAGE_KEY = 'opfphider-collapsed-states';
    const REMOVE_STORAGE_KEY = 'opfphider-remove-states';
    let isInitializing = true; // 标记初始化阶段

    function loadStates(key) {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('加载存储状态失败:', e);
            return {};
        }
    }

    function saveStates(key, states) {
        try {
            localStorage.setItem(key, JSON.stringify(states));
        } catch (e) {
            console.error('保存状态失败:', e);
        }
    }

    function loadCollapsedStates() {
        return loadStates(STORAGE_KEY);
    }

    function loadRemoveStates() {
        return loadStates(REMOVE_STORAGE_KEY);
    }

    function saveCollapsedStates(states) {
        saveStates(STORAGE_KEY, states);
    }

    function saveRemoveStates(states) {
        saveStates(REMOVE_STORAGE_KEY, states);
    }

    // 获取页面名称的函数
    function getPageName(pageId) {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
        if (!pageContainer) return pageId;

        const titleElement = pageContainer.querySelector('.u-relative .title.title--page-extra h2');
        if (titleElement) {
            return titleElement.textContent.trim();
        }

        // 备用方案：尝试其他选择器
        const fallbackTitle = pageContainer.querySelector('.u-relative h2');
        if (fallbackTitle) {
            return fallbackTitle.textContent.trim();
        }

        return pageId; // 如果都找不到，返回pageId作为后备
    }

    // 获取所有页面名称
    function getAllPageNames() {
        const pageNames = {};
        targetPageIds.forEach(pageId => {
            pageNames[pageId] = getPageName(pageId);
        });
        return pageNames;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        addSettingsButton();

        // 先处理删除逻辑
        processRemoveStates();

        // 然后处理折叠逻辑
        targetPageIds.forEach(pageId => {
            insertButtonForPage(pageId);
        });

        observePageChanges();

        setTimeout(() => {
            isInitializing = false;
        }, 2000);
    }

    function addSettingsButton() {
        if (document.querySelector('#opfphider-settings-btn')) return;

        const settingsBtn = document.createElement('button');
        settingsBtn.id = 'opfphider-settings-btn';
        settingsBtn.innerHTML = '⚙️';

        settingsBtn.addEventListener('click', toggleSettingsPanel);
        document.body.appendChild(settingsBtn);
    }

    function toggleSettingsPanel() {
        const existingPanel = document.querySelector('#opfphider-settings-panel');
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const storedStates = loadCollapsedStates();
        const removeStates = loadRemoveStates();
        const pageNames = getAllPageNames(); // 动态获取页面名称
        const panel = document.createElement('div');
        panel.id = 'opfphider-settings-panel';

        panel.innerHTML = `
            <div style="width: fit-content; margin-bottom: 15px; font-weight: bold; color: #fff; border-bottom: 2px solid hsl(var(--hsl-h1)); padding-bottom: 10px;">
                OPFP Hider Settings
            </div>

            <div style="font-size: 12px; color: #fff; margin-bottom: 10px; font-weight: bold;">
                折叠设置：
                <span style="font-size: 11px; color: #ccc; font-weight: normal; margin-left: 3px;">
                    默认收起的模块
                </span>
            </div>
            ${targetPageIds.map(pageId => `
                <label style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
                    <input
                        type="checkbox" ${storedStates[pageId] ? 'checked' : ''}
                        data-page="${pageId}"
                        data-type="collapse"
                        style="margin-right: 8px;"
                    >
                    ${pageNames[pageId]}
                </label>
            `).join('')}

            <div style="margin-top: 20px; font-size: 12px; color: #fff; margin-bottom: 10px; font-weight: bold;">
                删除设置：
                <span style="font-size: 11px; color: #ccc; font-weight: normal; margin-left: 3px;">
                    直接隐藏的模块
                </span>
            </div>
            ${targetPageIds.map(pageId => `
                <label style="display: flex; align-items: center; margin-bottom: 8px; font-size: 13px; cursor: pointer;">
                    <input
                        type="checkbox" ${removeStates[pageId] ? 'checked' : ''}
                        data-page="${pageId}"
                        data-type="remove"
                        style="margin-right: 8px;"
                    >
                    ${pageNames[pageId]}
                </label>
            `).join('')}

            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button id="opfphider-save">
                    保存
                </button>
                <button id="opfphider-cancel">
                    取消
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        // 事件处理
        document.getElementById('opfphider-save').addEventListener('click', saveSettings);
        document.getElementById('opfphider-cancel').addEventListener('click', () => panel.remove());
    }

    function saveSettings() {
        const collapseCheckboxes = document.querySelectorAll('#opfphider-settings-panel input[data-type="collapse"]');
        const removeCheckboxes = document.querySelectorAll('#opfphider-settings-panel input[data-type="remove"]');

        const newCollapseStates = {};
        collapseCheckboxes.forEach(checkbox => {
            newCollapseStates[checkbox.dataset.page] = checkbox.checked;
        });
        saveCollapsedStates(newCollapseStates);

        const newRemoveStates = {};
        removeCheckboxes.forEach(checkbox => {
            newRemoveStates[checkbox.dataset.page] = checkbox.checked;
        });
        saveRemoveStates(newRemoveStates);

        document.querySelector('#opfphider-settings-panel').remove();

        // 显示刷新提示
        showRefreshNotification();
    }

    function showRefreshNotification() {
        const existingNotification = document.querySelector('#opfphider-refresh-notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.id = 'opfphider-refresh-notification';
        notification.innerHTML = `
            <div style="padding: 10px; background: #4CAF50; color: white; border-radius: 5px; margin-top: 10px; font-size: 12px;">
                设置已保存！删除页面的更改需要刷新页面才能生效。
            </div>
        `;

        const panel = document.querySelector('#opfphider-settings-panel');
        if (panel) {
            panel.appendChild(notification);

            // 3秒后自动消失
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    function processRemoveStates() {
        const removeStates = loadRemoveStates();

        targetPageIds.forEach(pageId => {
            if (removeStates[pageId]) {
                removePageElement(pageId);
            }
        });
    }

    function removePageElement(pageId) {
        // 删除主内容区域
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
        if (pageContainer) {
            pageContainer.remove();
            console.log(`🗑️ 已删除页面内容: ${pageId}`);
        }

        // 删除标签页导航
        const tabLink = document.querySelector(`.page-mode--profile-page-extra a[data-page-id="${pageId}"]`);
        if (tabLink) {
            tabLink.remove();
            console.log(`🗑️ 已删除页面标签: ${pageId}`);
        }
    }

    function insertButtonForPage(pageId) {
        // 如果该页面被设置为删除，则不插入按钮
        const removeStates = loadRemoveStates();
        if (removeStates[pageId]) {
            return;
        }

        const selector = `.osu-layout.osu-layout--full .osu-page.osu-page--generic-compact .user-profile-pages.ui-sortable .js-sortable--page[data-page-id="${pageId}"] .page-extra`;

        const targetElement = document.querySelector(selector);

        if (targetElement) {
            if (targetElement.querySelector('.custom-inserted-button')) {
                return;
            }

            const button = createButton(pageId);
            targetElement.appendChild(button);

            initializePageState(pageId);

            console.log(`✅ 按钮已插入到 ${pageId} 页面`);
        }
    }

    function createButton(pageId) {
        const button = document.createElement('button');
        button.className = 'custom-inserted-button';
        button.innerHTML = `
            <svg class="chevron-icon" width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                ${CHEVRON_ICONS.DOWN}
            </svg>
        `;

        button.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            handleButtonClick(pageId, button);
        });

        return button;
    }

    function updateButtonIcon(button, isCollapsed) {
        const chevronIcon = button.querySelector('.chevron-icon');
        if (chevronIcon) {
            chevronIcon.innerHTML = isCollapsed ? CHEVRON_ICONS.DOWN : CHEVRON_ICONS.UP;
        }
    }

    function initializePageState(pageId) {
        const storedStates = loadCollapsedStates();
        const isCollapsed = storedStates.hasOwnProperty(pageId) ? storedStates[pageId] : false;
        pageStates.set(pageId, isCollapsed);

        // 根据存储状态设置初始显示
        setTimeout(() => {
            const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
            if (pageContainer) {
                const button = pageContainer.querySelector('.custom-inserted-button');
                if (button) {
                    updateButtonIcon(button, isCollapsed);
                    if (isCollapsed) {
                        collapsePage(pageId, true); // 立即收起
                    }
                }
            }
        }, 500); // 增加延迟确保DOM完全加载
    }

    function handleButtonClick(pageId, button) {
        if (isInitializing) return;

        const isCurrentlyCollapsed = pageStates.get(pageId);
        const newState = !isCurrentlyCollapsed;

        pageStates.set(pageId, newState);
        updateButtonIcon(button, newState);

        newState ? collapsePage(pageId) : expandPage(pageId);
    }

    function calculateHeaderHeight(pageId, uRelative) {
        const uRelativeHeight = uRelative.offsetHeight;
        const computedStyle = window.getComputedStyle(uRelative);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const extraBuffer = 14;

        let totalHeaderHeight = uRelativeHeight + paddingTop + paddingBottom + extraBuffer;

        // 特殊处理 me 模块可能包含的me-expander
        if (pageId === 'me') {
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

    function collapsePage(pageId, immediate = false) {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
        if (!pageContainer) return;

        const pageExtra = pageContainer.querySelector('.page-extra');
        if (!pageExtra) return;

        const uRelative = pageContainer.querySelector('.u-relative');
        if (!uRelative) return;

        const totalHeaderHeight = calculateHeaderHeight(pageId, uRelative);

        if (!pageExtra.dataset.originalHeight) {
            pageExtra.dataset.originalHeight = pageExtra.offsetHeight + 'px';
        }

        if (immediate) {
            pageExtra.style.height = totalHeaderHeight + 'px';
            pageExtra.style.overflow = 'hidden';
            pageExtra.style.transition = 'none'; // 立即操作时禁用过渡
            return;
        }

        pageExtra.style.overflow = 'hidden';
        const currentHeight = pageExtra.offsetHeight;
        pageExtra.style.height = currentHeight + 'px';
        pageExtra.style.transition = 'height 0.3s ease';

        pageExtra.offsetHeight; // 强制重绘

        setTimeout(() => {
            pageExtra.style.height = totalHeaderHeight + 'px';
        }, 10);
    }

    function expandPage(pageId) {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
        if (!pageContainer) return;

        const pageExtra = pageContainer.querySelector('.page-extra');
        if (!pageExtra) return;

        // const currentHeight = pageExtra.offsetHeight;
        const targetHeight = pageExtra.dataset.originalHeight ?
            parseInt(pageExtra.dataset.originalHeight) :
            pageExtra.scrollHeight;

        pageExtra.style.transition = 'height 0.3s ease';
        pageExtra.style.height = targetHeight + 'px';

        setTimeout(() => {
            pageExtra.style.height = '';
            pageExtra.style.overflow = '';
            pageExtra.style.transition = '';
        }, 300);
    }

    function observePageChanges() { // osu use SPA navigation
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(() => {
                    // 先处理删除逻辑
                    processRemoveStates();

                    // 然后处理折叠逻辑
                    targetPageIds.forEach(pageId => {
                        insertButtonForPage(pageId);
                    });
                }, 1000);
            }
        });

        observer.observe(document, { subtree: true, childList: true });

        const pageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.classList && (
                                node.classList.contains('js-sortable--page') ||
                                node.querySelector('.js-sortable--page') ||
                                node.classList.contains('me-expander') ||
                                node.querySelector('.me-expander')
                            )) {
                                setTimeout(() => {
                                    // 先处理删除逻辑
                                    processRemoveStates();

                                    // 然后处理折叠逻辑
                                    targetPageIds.forEach(pageId => {
                                        insertButtonForPage(pageId);
                                    });
                                }, 500);
                            }
                        }
                    });
                }
            });
        });

        pageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    const style = document.createElement('style');
    style.textContent = `
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

        /* 其他现有样式保持不变 */
        .page-extra {
            position: relative !important;
        }

        .sortable-handle--profile-page-extra {
            margin-right: 14px !important;
            margin-top: -3px !important;
        }

        .page-extra--userpage {
            padding-right: 40px !important;
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

        #opfphider-refresh-notification {
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();