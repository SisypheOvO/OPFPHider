import { OPFPHiderManager } from "./core/manager"

function init(): void {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            new OPFPHiderManager().init()
        })
    } else {
        new OPFPHiderManager().init()
    }
}

init()
