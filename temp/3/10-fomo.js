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
            url: "https://web.telegram.org/k/#@fomo",
            isMobile: true,
        });
        const jsContent = fs.readFileSync('./utils/injection/disable_animation.js', 'utf8');
        await sessionIframe.Runtime.evaluate({ expression: jsContent });

        // checkDaily
        await cursorActionIframe.moveToSelector({ selector: "div > div > div > div.w-full.flex.flex-col.justify-end.items-stretch.gap-y-4 > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "div > div > div > div.w-full.flex.flex-col.justify-end.items-stretch.gap-y-4 > button", maxWaitTime: 2000, iframe: true });

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
        delayDuration: 2000,
    })
    process.exit(0);
})();
