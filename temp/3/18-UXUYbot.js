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
            url: "https://web.telegram.org/k/#@UXUYbot",
        });

        // const jsInjection = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsInjection });

        await cursorActionIframe.moveToSelector({ selector: "#home-content > div.pb-8 > div:nth-child(1) > span", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#refUpAssetItem > h6 > div > div.flex.items-center.justify-center.bg-Orange", maxWaitTime: 2000, iframe: true });
        await sleep(2000);
        await cursorActionIframe.moveToSelector({ selector: "body > div.adm-popup > div.adm-popup-body.bg-bg_0.adm-popup-body-position-bottom > div > div.flex.justify-center.items-center.w-full.text-white.text-h6.font-Semibold.bg-Orange.cursor-pointer", maxWaitTime: 2000, iframe: true });

        await sleep(3000);

        // await waitForInput();
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
        // stop: 25,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
