import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';
import { checkPageLoad } from '../../utils/cdp.js';

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
            url: "https://web.telegram.org/k/#@XyroPortalBot",
            isMobile: true,
        });

        await cursorActionIframe.moveToSelector({ selector: "body", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#root > div:nth-child(5) > div > div > div > button", maxWaitTime: 2000, iframe: client });
        await sleep(2000);
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div._bottomContainer_9cc1k_185 > div > div > button", maxWaitTime: 2000, iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div._bottomContainer_9cc1k_185 > div > div > button", maxWaitTime: 2000, iframe: client });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div._bottomContainer_9cc1k_185 > div > div > button", maxWaitTime: 2000, iframe: client });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div._bottomContainer_9cc1k_185 > div > div > button", maxWaitTime: 2000, iframe: client });
        // await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div._bottomContainer_9cc1k_185 > div > div > button", maxWaitTime: 2000, iframe: client });
        await sleep(2000);

        // await cursorActionIframe.moveToSelector({ selector: "#root > div._pageContainer_1sajq_1 > div._container_1tn4l_1 > div._backdrop_1tn4l_35", iframe: true });
        // await sleep(2000);

        // await sessionIframe.Runtime.evaluate({
        //     expression: `(async ()=>{
        //         const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        //         let a = document.querySelector('#root > div > div > div > div._footer_nkalv_341 > div._shadowBackdrop_u0hnr_1 > div > button');

        //         a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //         await sleep(1000)
        //         a?.scrollIntoView({ behavior: "smooth", block: "start" });
        //         await sleep(1000)
        //     })()`,
        //     awaitPromise: true,
        // });

        // const getPoints = async () => {
        //     let { result } = await sessionIframe.Runtime.evaluate({
        //         expression: `+document.querySelector("#root > div > div > div > div > div > div:nth-child(2)").textContent.replace(/\\s/g, '');`,
        //     });
        //     return result.value;
        // }

        // let points = await getPoints();
        // while (points >= 3000) {
        //     await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div > div > div > button", iframe: client });
        //     points = await getPoints();
        //     await sleep(2000);
        // }

        // await sleep(5000);
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
        // stop: 6,
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
