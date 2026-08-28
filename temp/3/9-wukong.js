import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';
import { fetchData } from "./utils/axios.js";

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep } from './utils/utils.js';

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
            url: 'https://web.telegram.org/k/#@wukobot',
            // accessIframe: false,
            isMobile: true,
        });

        await cursorActionIframe.moveToSelector({ selector: "body", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div > button", iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div.Home_container__MjOfV > div.Home_content__ipDjc > div.MiningProgress_container__KZi-X", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div.Home_container__MjOfV > div.Home_content__ipDjc > div.MiningProgress_container__KZi-X", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div.Home_container__MjOfV > div.Home_content__ipDjc > div.MiningProgress_container__KZi-X", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div.Home_container__MjOfV > div.Home_content__ipDjc > div.MiningProgress_container__KZi-X", maxWaitTime: 2000, iframe: true });

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
