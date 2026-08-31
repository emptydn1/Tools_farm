import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';
import { fetchData } from "../../utils/axios.js";

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                '--force-device-scale-factor=0.4',
                // '--force-device-scale-factor=0.67',
            ],
            url: 'https://web.telegram.org/k/#@Nordom_Gates_Bot',
            // accessIframe: false,
            isMobile: true,
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

        await sessionIframe.Runtime.evaluate({
            expression: `(()=>{
                    setInterval(() => {
                        document.querySelector("#root > div._globalLayout_megcf_1 > canvas")?.remove()
                    }, 1000);
            })()`
        });

        await cursorActionIframe.moveToSelector({ selector: "body", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#portal > div > div > button", maxWaitTime: 2000, iframe: client });

        await sleep(5000);

        // await waitForInput();
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
        // stop: 22,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
