export class DomWaiter {
    /**
     * 等待元素出现，针对 Turbo 优化
     */
    static waitForElement(selector: string, timeout: number = 5000): Promise<Element | null> {
        return new Promise((resolve) => {
            // 先立即检查
            const element = document.querySelector(selector)
            if (element) {
                resolve(element)
                return
            }

            let timer: number | null = null

            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector)
                if (element) {
                    observer.disconnect()
                    if (timer !== null) clearTimeout(timer)
                    resolve(element)
                }
            })

            // 只监听 body (Turbo 渲染主要在 body 内部进行)
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            })

            timer = window.setTimeout(() => {
                observer.disconnect()
                console.warn(`[DomWaiter] Timeout waiting for: ${selector}`)
                resolve(null)
            }, timeout)
        })
    }

    static waitForPageElement(pageId: string, timeout: number = 5000): Promise<Element | null> {
        const selector = `.js-sortable--page[data-page-id="${pageId}"]`
        return this.waitForElement(selector, timeout)
    }
}
