import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

const args = process.argv.slice(2);

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@tapps_bot",
            // disableGpu: true,
            // accessIframe: false,
            // waitIframe: false,
            isMobile: true,
        });
        // const jsContent2 = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent2 });
        await sleep(2000);

        await cursorActionIframe.moveToSelector({
            selector: "#root > main > div:nth-child(7) > div > section > div > div",
            iframe: client
        });
        await cursorActionIframe.moveToSelector({
            selector: "#root > main > div:nth-child(7) > div > section > div > div",
            maxWaitTime: 2000,
            iframe: true
        });
        await sessionIframe.Runtime.evaluate({
            expression: `(async ()=>{
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let a = document.querySelector("#root > div > div > section.Section_root__xyz9f.PocketPanels_root__Y6PUi");

a?.scrollIntoView({ behavior: "smooth", block: "start" });
await sleep(1000)
a?.scrollIntoView({ behavior: "smooth", block: "start" });
await sleep(1000)
                    })()`,
            awaitPromise: true,
        });

        await cursorActionIframe.moveToSelector({
            selector: "#root > div > div > div > section > div > div > div > div.styles_body__4MWgQ > div.styles_controls__pOITs > button",
            iframe: true
        });

        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}
// 0
(async () => {
    await processTasks(MainBrowser, {
        // stop: 1,
        // numTasksPerRun: 1,
        columns: 5,
        delayDuration: 2000,
    })
    process.exit(0);
})();
