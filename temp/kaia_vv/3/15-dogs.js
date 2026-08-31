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
                '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@dogshouse_bot",
            isMobile: true,
        });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div._view_sf2n5_1 > div > div._content_fnqzn_91 > div > div._cell_8c2n5_1._current_8c2n5_29", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#root > div > div._view_sf2n5_1 > div > div._content_fnqzn_91 > div > div._cell_8c2n5_1._current_8c2n5_29", maxWaitTime: 2000, iframe: true });

        await cursorActionIframe.moveToSelector({ selector: '#root > div > div._inner_cwn4g_1 > div._root_l1gqr_1._fixedBottom_l1gqr_155', maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: '#root > div > div._inner_cwn4g_1 > div._root_l1gqr_1._fixedBottom_l1gqr_155', maxWaitTime: 2000, iframe: true });

        // await sleep(4000);
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
        columns: 5,
        delayDuration: 2000,
    })
    process.exit(0);
})();
