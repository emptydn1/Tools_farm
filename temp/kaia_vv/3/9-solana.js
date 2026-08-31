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
            ],
            url: "https://web.telegram.org/k/#@chillguyxmas_bot",
            isMobile: true,
        });
        // const jsContent = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        await sleep(1000);
        await sessionIframe.Runtime.evaluate({
            expression: `(async ()=>{
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
window.scrollBy(0, 500); 
})()`,
            awaitPromise: true,
        });

        await sleep(1000);
        // claim
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", maxWaitTime: 2000, iframe: client });

        await sessionIframe.Runtime.evaluate({
            expression: `(async ()=>{
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
window.scrollBy(0, 500); 
})()`,
            awaitPromise: true,
        });

        await sleep(1000);
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", maxWaitTime: 2000, iframe: client });

        await sleep(1000);
        // claim
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", maxWaitTime: 2000, iframe: client });

        await sessionIframe.Runtime.evaluate({
            expression: `(async ()=>{
const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
window.scrollBy(0, 500); 
})()`,
            awaitPromise: true,
        });

        await sleep(1000);
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#__next > div > main > section > div.flex-1.flex.flex-col > div.mt-4 > div > button", maxWaitTime: 2000, iframe: client });

        await sleep(3000);
       
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
        columns: 5,
        delayDuration: 2000,
    })
    process.exit(0);
})();