import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep } from './utils/utils.js';

const args = process.argv.slice(2);

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
            url: "https://web.telegram.org/k/#@MemeX_prelaunch_airdrop_bot",
            isMobile: true,
        });

        await cursorActionIframe.moveToSelector({ selector: "body > div > main > div > div.page_inner__Apq_E > div.page_section__w2Ojd.page_missionBoard__UH5h_ > div:nth-child(1)", iframe: client });
        await sleep(2000);
        await cursorActionIframe.moveToSelector({ selector: "body > div > main > div.page_container__KAKr7.modal > div > div > div.page_buttonWrapper__gUAKS > button", iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "body > div > main > div.page_container__KAKr7.modal > div > div > div.page_buttonWrapper__gUAKS > button", iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "body > div > main > div.page_container__KAKr7.modal > div > div > div.page_buttonWrapper__gUAKS > button", iframe: true });

        await sleep(4000);

        if (args[0] == 'manual') await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}

(async () => {
    await processTasks(MainBrowser, {
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 4000,
    })
    process.exit(0);
})();
