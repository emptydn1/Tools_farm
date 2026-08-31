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
                // '--force-device-scale-factor=0.4',
                '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@MidasRWA_bot",
            // isMobile: true,
        });

        await cursorActionIframe.moveToSelector({ selector: "#root > div.grid > div > div.z-10.flex.flex-1.flex-col.justify-between.gap-2 > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#root > div.grid > div > div.z-10.flex.flex-1.flex-col.justify-between.gap-2 > button", maxWaitTime: 2000, iframe: true });




        // await cursorActionIframe.moveToSelector({ selector: "#root > div.grid > div > div > div.fixed.flex.flex-col.items-center.justify-center.bg-white > div > button", iframe: client });


        // let i = 0;
        // let x = 0;
        // while (i == 0) {
        //     await client.Input.dispatchTouchEvent({
        //         type: 'touchStart',
        //         touchPoints: [{
        //             x: 300,
        //             y: 350,
        //             radiusX: 6,
        //             radiusY: 6,
        //         }],
        //     });
        //     await sleep(100);
        //     await client.Input.dispatchTouchEvent({
        //         type: 'touchEnd',
        //         touchPoints: [],
        //     });
        //     x++;
        //     if (x >= 10) {
        //         await sleep(5000);
        //         await sleep(5000);
        //         await sleep(5000);
        //         await sleep(5000);
        //         await cursorActionIframe.moveToSelector({ selector: "#root > div > div > div > div > div > div > div.absolute > div.flex.flex-col.gap-3 > button.text-white", maxWaitTime: 100, iframe: true });
        //         x = 0;
        //     }
        // }



        await waitForInput();
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.error("Error:", error.message);
        await waitForInput();
    }
}

(async () => {
    await processTasks(MainBrowser, {
        // stop: 22,
        // numTasksPerRun: 1,
        // columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
