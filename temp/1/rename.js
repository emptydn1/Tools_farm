import fs from 'fs-extra';
// import path from 'path';
// import CDP from 'chrome-remote-interface';

import { runChrome } from '../../core/runChrome.mjs';

import { processTasks } from '../../utils/constant.js';
import { waitForInput, sleep } from '../../utils/utils.js';

function generateUniqueVietnameseName() {
    const lastNames = ["Nguyen", "Tran", "Le", "Pham", "Huynh", "Phan", "Vu", "Dang", "Bui", "Do"];
    const middleNames = ["Van", "Thi", "Huu", "Minh", "Quoc", "Gia", "Bao", "Hai", "Dinh", "Hong"];
    const firstNames = ["Anh", "Binh", "Cuong", "Duy", "Ha", "Lan", "Minh", "Ngoc", "Phuong", "Trang"];

    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];

    const timestamp = Date.now(); // Get the current timestamp in milliseconds

    return [lastName, `${middleName} ${firstName}`];
}
function generateUniqueUSName() {
    const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
    const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];

    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    const timestamp = Date.now(); // Get the current timestamp in milliseconds

    return [lastName, firstName];
}


const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                '--force-device-scale-factor=0.7',
            ],
            url: "https://web.telegram.org/k/",
            disableGpu: false,
            accessIframe: false,
            waitIframe: false,
        });
        const { Page, Runtime, Input, DOM, Target, Network, Emulation } = client;

        await Page.navigate({ url: "https://web.telegram.org/k/" });
        // const jsContent = fs.readFileSync('./utils/injection/JS_injection.js', 'utf8');
        // await Runtime.evaluate({ expression: jsContent });
        // await checkPageLoad({ client });

        // open menu
        await sleep(2000);
        await cursorActionClient.moveToSelector({ selector: "#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button" });

        // find and click settings
        await sleep(1000);
        let { result: settingsPosition } = await Runtime.evaluate({
            expression: `(()=>{
                const main = document.querySelectorAll("#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div");
                const a = Array.from(main).findIndex(element => element.textContent.includes('Settings'));
                return a;
            })()`
        });
        await cursorActionClient.moveToSelector({ selector: `#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div:nth-child(${settingsPosition.value + 1})` });

        // click edit
        await cursorActionClient.moveToSelector({ selector: "#column-left > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.settings-container.profile-container.is-collapsed.active > div.sidebar-header > button.btn-icon.rp:not(.btn-menu-toggle)" });
        await cursorActionClient.moveToSelector({ selector: "#column-left > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.settings-container.profile-container.is-collapsed.active > div.sidebar-header > button.btn-icon.rp:not(.btn-menu-toggle)", maxWaitTime: 2000 });

        // remove keyword in input
        // await Input.dispatchKeyEvent({ 
        //     type: 'keyUp', 
        //     key: 'Backspace', 
        //     code: 'Backspace', 
        //     windowsVirtualKeyCode: 8 
        // });

        // click input and rename
        // name
        let [lastName, name] = generateUniqueVietnameseName();
        let [lastNameUS, nameUS] = generateUniqueUSName();
        // // h 🛒🌱SEED▪️🐦 SUI🐾Bao Ha n🐦 SUI🍅🍅Huynh
        await cursorActionClient.moveToSelector({ selector: "#column-left > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrollable-y-bordered.edit-profile-container.active > div.sidebar-content > div > div:nth-child(2) > div.sidebar-left-section > div > div.input-wrapper > div:nth-child(1) > div.input-field-input" });
        await Input.insertText({ text: '🆙 UXUY' });

        // //lastName
        // await cursorActionClient.moveToSelector({ selector: "#column-left > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrollable-y-bordered.edit-profile-container.active > div.sidebar-content > div > div:nth-child(2) > div.sidebar-left-section > div > div.input-wrapper > div:nth-child(2)" });
        // await Input.insertText({ text: lastNameUS });

        // confirm
        await sleep(2000)
        await cursorActionClient.moveToSelector({ selector: "#column-left > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrollable-y-bordered.edit-profile-container.active > div.sidebar-content > button" });

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