import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';
import { resetAll, get_start_click, get_start_click2 } from "./utils/mouseSync.js";

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep } from './utils/utils.js';


const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=1400,800',
                // '--auto-open-devtools-for-tabs',
                // '--force-device-scale-factor=0.9',
                '--window-size=400,780',
                // '--force-device-scale-factor=0.67',
                '--force-device-scale-factor=0.9',
            ],
            url: "https://web.telegram.org/k/",
            url: "https://cdn.bombie.xyz/games/bombie/index.html",
            url: "https://liff.line.me/2006702774-bDDnYDqe",
            accessIframe: false,
            // isMobile: true,
            // closeTabs: false,
            test: true,
        });

        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);

        console.error("Error:", error.message);
        await waitForInput();
    }
}

// 900 - 1000
(async () => {
    await processTasks(MainBrowser, {
        totalElements: 1000,
        stop: 900,
        // stop: 950,
        // numTasksPerRun: 1,
        // columns: 5,
        xStep: 400,
        yStep: 400,
        delayDuration: 1000,
        callback: async () => {
            resetAll()
        },
    })
    process.exit(0);
})();
