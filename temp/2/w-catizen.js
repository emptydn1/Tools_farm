import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';
import { resetAll } from "./utils/mouseSync.js";

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
                // '--force-device-scale-factor=0.4',
                '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@catizenbot",
            // accessIframe: false,
            // isMobile: true,
            closeTabs: false,
            test: true,
        });

        await client.Runtime.evaluate({
            expression: `
            setInterval(() => {
                // tu dong dang ky kenh
                document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
                document.querySelector("#column-center > div > div.chat.tabs-tab.can-click-date.active > div.sidebar-header.topbar.has-avatar.is-pinned-message-shown > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
                document.querySelector("#column-center > div > div > div.sidebar-header.topbar.has-avatar > div.chat-info-container > div.chat-utils > button.btn-primary.btn-color-primary.chat-join.rp")?.click()
            
                // tu dong like
                let main = document.querySelectorAll("section");
                for(let x of main){
                    x.querySelector('div > div > div.bubble-content > div.message.spoilers-container.mt-shorter > reactions-element > reaction-element:nth-child(1):not(.is-chosen)')?.click()
                }    
            }, 1000);`
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


(async () => {
    await processTasks(MainBrowser, {
        stop: 12,
        // exclude: [],
        // numTasksPerRun: 5,
        // columns: 9,
        // xStep: 380,
        delayDuration: 1500,
        callback: async () => {
            resetAll()
        },
    })
    process.exit(0);
})();
