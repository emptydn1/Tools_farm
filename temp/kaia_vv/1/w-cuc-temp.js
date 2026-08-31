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
                // `--window-position=0,0`,
                // '--window-size=1400,800',
                // '--auto-open-devtools-for-tabs',
                // '--force-device-scale-factor=0.9',
                '--window-size=400,780',
                // '--force-device-scale-factor=0.67',
                '--force-device-scale-factor=0.9',
            ],
            url: "https://web.telegram.org/k/#@boinker_bot",
            // url: "https://www.iplocation.net/",
            // accessIframe: false,
            // isMobile: true,
        });

        // const jsContent = fs.readFileSync('C:\\Users\\huy\\Desktop\\Tools_Farm\\utils\\injection\\disable_animation.js', 'utf8');
        // await sessionIframe.Runtime.evaluate({ expression: jsContent });

        // await sessionIframe.Runtime.evaluate({
        //     expression: `(async ()=>{
        // setInterval(() => {
        //     // animation cuc move
        //     document.querySelector("body > app-root > div.app-container > app-upgrade-boinker-page > div > div > div.poop-container")?.remove()

        //     // set
        //     // document.querySelector("body > app-root > div.app-container > app-daily-wheel > div > div")?.remove()

        //     document.querySelector("#mat-mdc-dialog-2 > div > div > app-generic-poopup > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-air-drop-bonus > div > div > div.buttons-container.flex-row.align-center > button:nth-child(1)")?.click();
        //     document.querySelector("div > div > app-air-drop-bonus > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-air-drop-bonus > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > booster-upgrade > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-invite-friends-for-gold > div > button")?.click();
        //     document.querySelector("div > div > app-install-aac-offer > div > button")?.click();
        //     document.querySelector("div > div > app-buy-spins > div > button")?.click();
        //     document.querySelector("div > div > app-invite-friends-personal-offer > div > button")?.click();
        //     document.querySelector("div > div > app-invite-friends-personal-offer > div > button")?.click();
        //     document.querySelector("div > div > app-buy-spins > div > button")?.click();
        //     document.querySelector("div > div > app-event-milestones > div > div > div.top-close-button-container > button")?.click();
        //     document.querySelector("div > div > app-buy-gold > div > button")?.click();
        // }, 1000); 
        //             })()`,
        // });



        await sessionIframe.Runtime.evaluate({
            expression: `(()=>{

        let intervalId = null;

        function startAction() {
            if (!intervalId) {
                console.log("Action started!");
                intervalId = setInterval(() => {
                    document.querySelector("body > app-root > div > app-daily-wheel > div > button.spin-button.main-button.pink-button-horizontal.flex-column.scaleOne")?.click()
                }, 500); // Thực hiện mỗi giây
            }
        }

        function stopAction() {
            if (intervalId) {
                console.log("Action stopped!");
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        document.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "i") {
                startAction();
            } else if (event.key.toLowerCase() === "o") {
                stopAction();
            }
        });


                            })()`,
        });







        let i = 1
        while (i == 1) {
            await cursorActionIframe.moveToSelector({ selector: "#battleground > div.dig-x.x-1", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#battleground > div.dig-x.x-2", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#battleground > div.dig-x.x-3", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#battleground > div.dig-x.x-0", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#rug-container > div.banner-outer.position-absolute.bottom.left.right.z-index-1 > div button:last-child", maxWaitTime: 2000, iframe: true });
            await cursorActionIframe.moveToSelector({ selector: "#rug-container > div.banner-outer.position-absolute.bottom.left.right.z-index-1 > div button:last-child", maxWaitTime: 2000, iframe: true });
        }


        await waitForInput();
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
        // stop: 32,
        // exclude: [],
        // numTasksPerRun: 5,
        // columns: 4,
        xStep: 400,
        yStep: 400,
        delayDuration: 2000,
    })
    process.exit(0);
})();
