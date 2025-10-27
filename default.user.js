// ==UserScript==
// @name         OPFPHider
// @name:zh-CN   OPFP隐藏器
// @namespace    URL
// @version      0.4
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

// 本插件适配了 osu-web enhanced 插件导致的
// Me! pfp 多出的 me-expander 小组件

(function () {
    'use strict';

    // 目标页面的 data-page-id 值
    const targetPageIds = ['me', 'beatmaps', 'recent_activity', 'top_ranks', 'medals', 'historical', 'kudosu'];

    const pageStates = new Map();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        targetPageIds.forEach(pageId => {
            insertButtonForPage(pageId);
        });

        observePageChanges();
    }

    function insertButtonForPage(pageId) {
        // 构建选择器
        const selector = `.osu-layout.osu-layout--full .osu-page.osu-page--generic-compact .user-profile-pages.ui-sortable .js-sortable--page[data-page-id="${pageId}"] .page-extra`;

        const targetElement = document.querySelector(selector);

        if (targetElement) {
            // 检查是否已经插入过按钮
            if (targetElement.querySelector('.custom-inserted-button')) {
                return;
            }

            const button = createButton(pageId);
            targetElement.appendChild(button);

            initializePageState(pageId);

            console.log(`✅ 按钮已插入到 ${pageId} 页面`);
        } else {
            console.log(`❌ 未找到 ${pageId} 页面的目标元素`);
        }
    }

    function createButton(pageId) {
        const button = document.createElement('button');
        button.className = 'custom-inserted-button';
        button.innerHTML = `
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        button.style.cssText = `
            width: 30px;
            height: 30px;
            padding: 0;
            background: linear-gradient(135deg, #ff66aa, #ff3388);
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(255, 102, 170, 0.3);
            z-index: 10;
            position: absolute;
            right: 14px;
            top: 14px;
        `;

        // 添加悬停效果
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-1px) scale(1.1)';
            this.style.boxShadow = '0 4px 12px rgba(255, 102, 170, 0.5)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
            this.style.boxShadow = '0 2px 8px rgba(255, 102, 170, 0.3)';
        });

        // 添加点击事件
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
            if (isCollapsed) {
                // chevron down
                chevronIcon.innerHTML = '<path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            } else {
                // chevron up
                chevronIcon.innerHTML = '<path d="M4 10L8 6L12 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
            }
        }
    }

    function initializePageState(pageId) {
        // 默认状态为展开
        if (!pageStates.has(pageId)) {
            pageStates.set(pageId, false); // false 表示未收起
        }
    }

    function handleButtonClick(pageId, button) {
        const isCurrentlyCollapsed = pageStates.get(pageId);

        if (isCurrentlyCollapsed) {
            expandPage(pageId);
            pageStates.set(pageId, false);
            updateButtonIcon(button, false);
        } else {
            collapsePage(pageId);
            pageStates.set(pageId, true);
            updateButtonIcon(button, true);
        }
    }

    function collapsePage(pageId) {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
        if (!pageContainer) return;

        const pageExtra = pageContainer.querySelector('.page-extra');
        if (!pageExtra) return;

        const uRelative = pageContainer.querySelector('.u-relative');
        if (!uRelative) return;

        // 计算收起后头部的高度
        const uRelativeHeight = uRelative.offsetHeight;
        const computedStyle = window.getComputedStyle(uRelative);
        const paddingTop = parseFloat(computedStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(computedStyle.paddingBottom) || 0;
        const extraBuffer = 14; // 额外加14px作为缓冲,提高整洁度
        
        let totalHeaderHeight = uRelativeHeight + paddingTop + paddingBottom + extraBuffer;

        // 特殊处理：如果是me页面，检查是否有me-expander元素
        if (pageId === 'me') {
            const meExpander = pageContainer.querySelector('.me-expander');
            if (meExpander) {
                const meExpanderHeight = meExpander.offsetHeight;
                const meExpanderComputedStyle = window.getComputedStyle(meExpander);
                const meExpanderMarginTop = parseFloat(meExpanderComputedStyle.marginTop) || 0;
                const meExpanderMarginBottom = parseFloat(meExpanderComputedStyle.marginBottom) || 0;
                
                totalHeaderHeight += meExpanderHeight + meExpanderMarginTop + meExpanderMarginBottom;
                console.log(`📏 检测到 me-expander，高度: ${meExpanderHeight}px，总高度调整为: ${totalHeaderHeight}px`);
            }
        }

        // 保存原始高度以便恢复
        if (!pageExtra.dataset.originalHeight) {
            pageExtra.dataset.originalHeight = pageExtra.offsetHeight + 'px';
        }

        // 确保元素可见以便计算当前高度
        pageExtra.style.overflow = 'hidden';

        // 获取当前实际高度
        const currentHeight = pageExtra.offsetHeight;

        // 先设置当前高度，然后触发重绘
        pageExtra.style.height = currentHeight + 'px';

        // 强制重绘
        pageExtra.offsetHeight;

        // 现在设置目标高度并应用动画
        setTimeout(() => {
            pageExtra.style.height = totalHeaderHeight + 'px';
            pageExtra.style.transition = 'height 0.3s ease';
        }, 10);

        console.log(`📦 正在收起 ${pageId} 页面，从 ${currentHeight}px 到 ${totalHeaderHeight}px`);
    }

    function expandPage(pageId) {
        const pageContainer = document.querySelector(`.js-sortable--page[data-page-id="${pageId}"]`);
        if (!pageContainer) return;

        const pageExtra = pageContainer.querySelector('.page-extra');
        if (!pageExtra) return;

        // 获取当前高度和目标高度
        const currentHeight = pageExtra.offsetHeight;
        const targetHeight = pageExtra.dataset.originalHeight ?
            parseInt(pageExtra.dataset.originalHeight) :
            pageExtra.scrollHeight;

        // 设置过渡动画
        pageExtra.style.transition = 'height 0.3s ease';
        pageExtra.style.height = targetHeight + 'px';

        console.log(`📖 正在展开 ${pageId} 页面，从 ${currentHeight}px 到 ${targetHeight}px`);

        // 动画完成后清理样式
        setTimeout(() => {
            pageExtra.style.height = '';
            pageExtra.style.overflow = '';
            pageExtra.style.transition = '';
        }, 300);
    }

    // 检查页面中是否有me-expander元素
    function checkMeExpander() {
        const mePageContainer = document.querySelector('.js-sortable--page[data-page-id="me"]');
        if (mePageContainer) {
            const meExpander = mePageContainer.querySelector('.me-expander');
            if (meExpander) {
                const height = meExpander.offsetHeight;
                console.log(`🔍 检测到 me-expander 元素，高度: ${height}px`);
                return true;
            }
        }
        return false;
    }

    // 监听页面变化（osu! 使用 SPA 导航）
    function observePageChanges() {
        // planA: 监听URL变化
        let lastUrl = location.href;
        const observer = new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                setTimeout(() => {
                    targetPageIds.forEach(pageId => {
                        insertButtonForPage(pageId);
                    });
                    // 检查me-expander
                    checkMeExpander();
                }, 1000);
            }
        });

        observer.observe(document, { subtree: true, childList: true });

        // planB: 监听DOM变化，检测新的页面元素
        const pageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            if (node.classList && (
                                node.classList.contains('js-sortable--page') ||
                                node.querySelector('.js-sortable--page') ||
                                node.classList.contains('me-expander') ||
                                node.querySelector('.me-expander')
                            )) {
                                setTimeout(() => {
                                    targetPageIds.forEach(pageId => {
                                        insertButtonForPage(pageId);
                                    });
                                    // 检查me-expander
                                    checkMeExpander();
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

        .custom-inserted-button {
            transition: all 0.3s ease !important;
        }

        .chevron-icon {
            transition: transform 0.3s ease;
        }
    `;
    document.head.appendChild(style);

    // 初始化时检查me-expander
    setTimeout(() => {
        checkMeExpander();
    }, 2000);
})();