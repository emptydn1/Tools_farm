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
            // url: "https://web.telegram.org/k/#@XyroPortalBot",
            // url: "https://mail.google.com/mail/u/0/#inbox",
            // url: "chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn/home.html#onboarding/welcome",
            // accessIframe: false,
            isMobile: true,
        });

        // await cursorActionClient.moveToSelector({ selector: "#onboarding__terms-checkbox" });
        // await cursorActionClient.moveToSelector({ selector: "#app-content > div > div.mm-box.main-container-wrapper > div > div > div > ul > li:nth-child(2) > button" });
        // await cursorActionClient.moveToSelector({ selector: "#app-content > div > div.mm-box.main-container-wrapper > div > div > div > div.mm-box.onboarding-metametrics__buttons.mm-box--display-flex.mm-box--gap-4.mm-box--flex-direction-row.mm-box--width-full > button.mm-box.mm-text.mm-button-base.mm-button-base--size-lg.mm-button-secondary.mm-text--body-md-medium.mm-box--padding-0.mm-box--padding-right-4.mm-box--padding-left-4.mm-box--display-inline-flex.mm-box--justify-content-center.mm-box--align-items-center.mm-box--color-primary-default.mm-box--background-color-transparent.mm-box--rounded-pill.mm-box--border-color-primary-default.box--border-style-solid.box--border-width-1" });
        // await sleep(2000)

        // await cursorActionClient.moveToSelector({ selector: "#app-content > div > div.mm-box.main-container-wrapper > div > div > div > div.mm-box.mm-box--margin-top-3.mm-box--justify-content-center > form > div:nth-child(1) > label > input" });
        // await client.Input.insertText({ text: 'Hoang123@' });
        // await cursorActionClient.moveToSelector({ selector: "#app-content > div > div.mm-box.main-container-wrapper > div > div > div > div.mm-box.mm-box--margin-top-3.mm-box--justify-content-center > form > div:nth-child(2) > label > input" });
        // await client.Input.insertText({ text: 'Hoang123@' });
        // await cursorActionClient.moveToSelector({ selector: "#app-content > div > div.mm-box.main-container-wrapper > div > div > div > div.mm-box.mm-box--margin-top-3.mm-box--justify-content-center > form > div.mm-box.mm-box--margin-top-4.mm-box--margin-bottom-4.mm-box--justify-content-space-between.mm-box--align-items-center > label > span.mm-checkbox__input-wrapper > input" });
        // await cursorActionClient.moveToSelector({ selector: "#app-content > div > div.mm-box.main-container-wrapper > div > div > div > div.mm-box.mm-box--margin-top-3.mm-box--justify-content-center > form > button" });




        // await client.Target.createTarget({ url: 'https://discord.com/channels/@me' });
        // await client.Target.createTarget({ url: 'https://discord.com/invite/xyro' });
        // await client.Target.createTarget({ url: 'https://xyro.io/' });



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
        stop: 20,
        // numTasksPerRun: 3,
        // columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();
