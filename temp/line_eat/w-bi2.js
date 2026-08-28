import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';

import { processTasks, processTasks2 } from './utils/constant.js';
import { waitForInput, sleep, writeTimeToFile } from './utils/utils.js';
import { resetAll } from './utils/mouseSync.js';

import { MouseSyncController, get_start_click, set_start_click, get_click_fish, get_start_click2 } from './utils/mouseSync.js';
import { findMatchingRegions, monitorFPSAndCapture } from './utils/opencvNodejs.js';

import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});


let rootEmpty = [];

const MainBrowser = async ({ userProfileIndex, proxy, positionX, positionY, index }) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers, mouseControler } = await runChrome({
            userProfileIndex,
            proxy,
            // proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=400,780',
                `--force-device-scale-factor=${scale}`,
            ],
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            accessIframe: false,

            clearCookies: true,
            clearCache: true,
            clearDataForOrigin: 'https://lineh5.mobirix.com/',

            // closeTabs: false,
            okx: true,
        });

        // await sleep(3000);
        let checkExist = false;
        while (!checkExist) {
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input" });
            await client.Input.insertText({ text: "Hoang123@" });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div._affix_oe51y_42._footer_11p2x_17 > button" });

            const { result } = await client.Runtime.evaluate({ expression: `document.querySelector("#app > div > div.main-container-wrapper > div > div._content_1ttdc_26 > form > div.okui-form-item-md.okui-form-item.okui-form-item-no-label._password_11p2x_1 > div > div > div > div > div > input")?.value !== ''` });
            if (result?.value) checkExist = true;
        }

        let pageLoaded = false;
        while (!pageLoaded) {
            const { result } = await client.Runtime.evaluate({ expression: 'document.readyState' });
            if (result.value === 'complete') pageLoaded = true;
            await sleep(500);
        }

        // vi con
        async function checkNameAccount(client) {
            const { result } = await client.Runtime.evaluate({ expression: 'document.querySelector("#home-page-root-element-id > div").textContent' });
            return result.value;
        }

        let nameWallet = await checkNameAccount(client);
        // console.log(nameWallet)
        while (!nameWallet?.includes(walletAccount)) {
            await cursorActionClient.moveToSelector({ selector: "#home-page-root-element-id > div > div > div > img", maxWaitTime: 500 });
            await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div > div._root_1k0l3_1 > div > div > div > i", maxWaitTime: 500 });
            await cursorActionClient.moveToSelector({ selector: `[data-testid="okd-input"]`, maxWaitTime: 500 });
            await client.Input.insertText({ text: walletAccount });
            await sleep(2000);
            await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._walletList_qch1e_7 > div > div > div > div:nth-child(2)", maxWaitTime: 500 });
            nameWallet = await checkNameAccount(client);
            // console.log(nameWallet)
        }



        const response = await axios.get(`http://localhost:${chrome.port}/json`);
        const tabs = response.data;

        const port = chrome.port;
        let targetTab = null;
        let targetTabPopup = null;

        const validUrls = [
            'https://www.okx.com/web3/extension/welcome',
            'https://web3.okx.com/extension/welcome',
            'https://web3.okx.com/'
        ];
        for (const tab of tabs) {
            if (tab.url.includes('google.com')) {
                // const tabRemove = await CDP({ target: tab.webSocketDebuggerUrl, port });
                // await tabRemove.Target.closeTarget({ targetId: tab.id });
                targetTab = tab;
            }
            // if (validUrls.includes(tab.url)) {
            //     targetTab = tab;
            // }
            if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html')) targetTabPopup = tab;
        }

        const tab = await CDP({ target: targetTab.webSocketDebuggerUrl, port });
        const { Page, Network, Target, Runtime, Input } = tab;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);
        rootEmpty.push(tab);

        // const cursorTab = createCursor(Input);
        // const cursorActionTab = new CursorActions(tab, cursorTab, false, Input);


        if (removeTab == 1) {
            await Target.setDiscoverTargets({ discover: true });
            Target.targetCreated(async ({ targetInfo }) => {
                const { type, targetId } = targetInfo;

                if (type === 'page') {
                    console.log('New tab detected:', targetId);
                    await tab.Target.closeTarget({ targetId });
                }
            });
        }

        await Page.navigate({ url: "https://lineh5.mobirix.com/bbcrush/index.html" });
        await sleep(index * 1000);
        let mouseControler2 = new MouseSyncController({ client: tab, userProfileIndex, index });
        await mouseControler2.init(tab);
        await tab.Page.bringToFront();


        // await Target.setDiscoverTargets({ discover: true });
        // Target.targetCreated(async ({ targetInfo }) => {
        //     const { type, targetId } = targetInfo;
        //     if (type === 'iframe') {
        //         await sleep(5000)
        //         sessionIframe = await CDP({ target: targetInfo.targetId, port: chrome.port });
        //         const { Runtime, Network } = sessionIframe;
        //         await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);
        //         await sessionIframe.Runtime.evaluate({
        //             expression: `(()=>{
        //                 let a = document.querySelectorAll("#root > div > div > div > div > button")
        //                 for (const btn of a){
        //                     if (btn.textContent.includes('Connect with OKX Wal')) {
        //                         btn.click()
        //                         break; // Dừng nếu chỉ cần log 1 lần
        //                     }
        //                 }
        //             })()`
        //         });
        //     }
        // });


        let isClick = false;
        tab.on('Runtime.consoleAPICalled', async ({ args }) => {
            const message = args[0]?.value;
            if (!message) return;
            if (message === 'start_fish') {
                isClick = true;
            } else if (message === 'stop_fish') {
                isClick = false;
            }
        });

        // await monitorFPSAndCapture({ client: tab, captureImg: true, sleep: 3000 });

        let endRunLogin = false;
        let exclude = [];
        setInterval(async () => {
            try {
                const { matchedPoints } = await findMatchingRegions({
                    client: tab,
                    templateImages: [
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\okx_new.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\bida1.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\bida2.jpeg',
                        'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\bida3.jpeg',
                    ].filter(item => !exclude.includes(item)),
                    matchThreshold: 0.8,
                    scale,
                });

                if (matchedPoints.length > 0) {
                    for (const { x, y, mathImagePath } of matchedPoints) {
                        if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\okx_new.jpeg') {
                            // exclude.push(mathImagePath);
                            // exclude.push('C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\connect.jpeg');
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\bida1.jpeg') {
                            // exclude.push(mathImagePath);
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\bida2.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: 250, y: 565 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }
                        else if (mathImagePath == 'C:\\Users\\huy\\Desktop\\Tools_Farm\\match-img\\yuru\\bida3.jpeg') {
                            await tab.Input.dispatchTouchEvent({ type: 'touchStart', touchPoints: [{ x: x - 70, y: y - 10 }] });
                            await sleep(50);
                            await tab.Input.dispatchTouchEvent({ type: 'touchEnd', touchPoints: [] });
                        }

                    }
                }
            } catch (error) {
            }
        }, 2000);



        // let ix = 0;
        // while (ix == 0) {
        //     await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });
        // }

        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div > div._affix_oe51y_42._borderTop_oe51y_48 > div._action-buttons_j3bvq_1 > button.okui-btn.btn-lg.btn-fill-highlight.mobile._action-button_j3bvq_1" });

        await sleep(10000);
        // xu ly xoa popup
        if (targetTabPopup) {
            const tabPopup = await CDP({ target: targetTabPopup?.webSocketDebuggerUrl, port });
            await tabPopup.Target.closeTarget({ targetId: targetTabPopup?.id });
        }






        await waitForInput("v");
        await client.close();
        await chrome.kill();
    } catch (error) {
        console.log(error);
        console.error("Error:", error.message);
        await waitForInput();
    }
}

async function clickPoint(x, y, delay = 50) {
    for (const xx of rootEmpty) {
        try {
            await sleep(delay);
            await xx.Input.dispatchMouseEvent({ type: 'mouseMoved', x, y });
            await xx.Input.dispatchMouseEvent({ type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
            await xx.Input.dispatchMouseEvent({ type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
        } catch (error) {
            // console.error('Lỗi khi click tab:', error); // Có thể bỏ log nếu bạn không cần
            continue;
        }
    }
}


let checkClick = false;
rl.on('line', async (input) => {
    if (checkClick) return;
    checkClick = true;

    // huy
    // if (input === '1') {
    //     await clickPoint(310, 339);
    // } else if (input === '2') {
    //     await clickPoint(435, 565);
    // }
    // else if (input === '3') {
    //     await clickPoint(99, 410);
    // }
    // else if (input === '4') {
    //     await clickPoint(417, 448);
    // }
    // else if (input === '5') {
    //     await clickPoint(237, 374);
    // }
    // else if (input === '6') {
    //     await clickPoint(72, 494);
    // }
    // else if (input === '7') {
    //     await clickPoint(411, 504);
    // }
    // else if (input === '8') {
    //     await clickPoint(64, 289);
    // }
    // else if (input === '9') {
    //     await clickPoint(411, 467);
    // }
    // else if (input === '11') {
    //     await clickPoint(250, 414);
    // }
    // else if (input === '12') {
    //     await clickPoint(427, 425);
    // }
    // else if (input === '13') {
    //     await clickPoint(257, 377);
    // }
    // else if (input === '14') {
    //     await clickPoint(390, 366);
    // }
    // else if (input === '15') {
    //     await clickPoint(433, 454);
    // }
    // else if (input === '16') {
    //     await clickPoint(413, 537);
    // }
    // else if (input === '17') {
    //     await clickPoint(391, 347);
    // }
    // else if (input === '18') {
    //     await clickPoint(409, 395);
    // }
    // else if (input === '19') {
    //     await clickPoint(425, 495);
    // }
    // else if (input === '20') {
    //     await clickPoint(430, 447);
    // }
    // else if (input === '21') {
    //     await clickPoint(72, 518);
    // }
    // else if (input === '22') {
    //     await clickPoint(102, 402);
    // }
    // else if (input === '23') {
    //     await clickPoint(89, 438);
    // }
    // else if (input === '24') {
    //     await clickPoint(149, 364);
    // }
    // else if (input === '25') {
    //     await clickPoint(105, 419);
    // }
    // else if (input === '26') {
    //     await clickPoint(379, 389);
    // }
    // else if (input === '27') {
    //     await clickPoint(375, 477);
    // }
    // else if (input === '28') {
    //     await clickPoint(260, 398);
    // }
    // else if (input === '29') {
    //     await clickPoint(65, 487);
    // }
    // else if (input === '30') {
    //     await clickPoint(250, 377);
    // }
    // else if (input === '31') {
    //     await clickPoint(435, 565);
    // }
    // else if (input === '32') {
    //     await clickPoint(432, 449);
    // }
    // else if (input === '33') {
    //     await clickPoint(85, 472);
    // }
    // else if (input === '34') {
    //     await clickPoint(185, 384);
    // }
    // else if (input === '35') {
    //     console.log("dung skill xong chay no nhanh hon")
    // }
    // else if (input === '36') {
    //     await clickPoint(148, 381);
    // }
    // else if (input === '37') {
    //     console.log("rat lag , choi tay tung acc")
    // }
    // else if (input === '38') {
    //     await clickPoint(122, 423);
    // }
    // else if (input === '39') {
    //     await clickPoint(380, 409);
    // }
    // else if (input === '40') {
    //     await clickPoint(392, 213);
    // }
    // else if (input === '41') {
    //     await clickPoint(286, 403);
    // }
    // else if (input === '42') {
    //     await clickPoint(308, 389);
    // }
    // else if (input === '43') {
    //     await clickPoint(77, 458);
    // }
    // else if (input === '44') {
    //     await clickPoint(388, 401);
    // }
    // else if (input === '45') {
    //     await clickPoint(66, 451);
    // }
    // else if (input === '46') {
    //     await clickPoint(68, 479);
    // }
    // else if (input === '47') {
    //     await clickPoint(352, 357);
    // }
    // else if (input === '48') {
    //     await clickPoint(268, 379);
    // }
    // else if (input === '49') {
    //     await clickPoint(426, 496);
    // }
    // else if (input === '50') {
    //     await clickPoint(432, 443);
    // }
    // else {
    //     console.log(`Không hiểu lệnh: ${input}`);
    // }




    //hoang
    if (input === 'i') {
        await clickPoint(406, 113);
    }
    else if (input === 'o') {
        await clickPoint(262, 587);
    }
    else if (input === 'j') {
        await clickPoint(74, 121);
    }
    else if (input === 'k') {
        await clickPoint(156, 535);
    }
    else if (input === 'z') {
        await clickPoint(250, 307);
    }
    else if (input === 'bi') {
        await clickPoint(160, 650);
    }
    else if (input === 'ngang') {
        await clickPoint(280, 650);
    }


    else if (input === '1') {
        await clickPoint(370, 469);
    }
    else if (input === '2') {
        await clickPoint(438, 600);
    }
    else if (input === '3') {
        await clickPoint(94, 425);
    }
    else if (input === '4') {
        await clickPoint(400, 463);
    }
    else if (input === '5') {
        await clickPoint(258, 347);
    }
    else if (input === '6') {
        await clickPoint(138, 399);
    }
    else if (input === '7') {
        await clickPoint(382, 517);
    }
    else if (input === '8') {
        await clickPoint(60, 295);
    }
    else if (input === '9') {
        await clickPoint(438, 461);
    }
    else if (input === '10') {
        await clickPoint(112, 517);
    }
    else if (input === '11') {
        await clickPoint(418, 537);
    }
    else if (input === '12') {
        await clickPoint(426, 439);
    }
    else if (input === '13') {
        await clickPoint(248, 319);
    }
    else if (input === '14') {
        await clickPoint(376, 371);
    }



    ///////////////////
    else if (input === '15') {
        console.log("lan 2 nhap 151")
        await clickPoint(398, 445);
    }
    else if (input === '151') {
        await clickPoint(374, 343);
    }
    ///////// end //////////


    else if (input === '16') {
        await clickPoint(418, 537);
    }
    else if (input === '17') {
        await clickPoint(410, 429);
    }


    ///////////////////
    else if (input === '18') {
        console.log("lan 2 nhap 181")
        await clickPoint(416, 445);
    }
    else if (input === '181') {
        await clickPoint(434, 325);
    }
    ///////// end //////////



    else if (input === '19') {
        await clickPoint(332, 421);
    }
    else if (input === '20') {
        await clickPoint(410, 429);
    }
    else if (input === '21') {
        await clickPoint(98, 525);
    }
    else if (input === '22') {
        await clickPoint(112, 409);
    }



    ///////////////////
    else if (input === '23') {
        console.log("lan 2 nhap 231")
        await clickPoint(76, 455);
    }
    else if (input === '231') {
        await clickPoint(76, 499);
    }
    ///////// end //////////



    else if (input === '24') {
        await clickPoint(142, 411);
    }
    else if (input === '25') {
        await clickPoint(118, 427);
    }
    else if (input === '26') {
        await clickPoint(364, 415);
    }
    else if (input === '27') {
        await clickPoint(370, 485, 5000);
    }



    ///////////////////
    else if (input === '28') {
        console.log("lan 2 nhap 281")
        await clickPoint(240, 421);
    }
    else if (input === '281') {
        await clickPoint(170, 369);
    }
    else if (input === '29') {
        console.log("lan 2 nhap 291")
        await clickPoint(76, 491);
    }
    else if (input === '291') {
        await clickPoint(236, 423);
    }
    ///////// end //////////






    else if (input === '30') {
        await clickPoint(248, 393);
    }
    else if (input === '31') {
        await clickPoint(94, 531);
    }
    else if (input === '32') {
        await clickPoint(416, 459);
    }
    else if (input === '33') {
        await clickPoint(68, 455);
    }
    else if (input === '34') {
        await clickPoint(222, 425);
    }


    ///////////////////
    else if (input === '35') {
        console.log("lan 2 nhap 351")
        await clickPoint(110, 421);
    }
    else if (input === '351') {
        await clickPoint(60, 301);
    }
    ///////// end //////////




    else if (input === '36') {
        await clickPoint(130, 247);
    }
    else if (input === '37') {
        await clickPoint(418, 443, 1500);
    }

    ///////////////////
    else if (input === '38') {
        console.log("lan 2 nhap 381")
        await clickPoint(122, 423);
    }
    else if (input === '381') {
        await clickPoint(162, 301);
    }
    ///////// end //////////


    else if (input === '39') {
        await clickPoint(380, 409);
    }
    else if (input === '40') {
        await clickPoint(392, 213);
    }



    ///////////////////
    else if (input === '41') {
        console.log("lan 2 nhap 411")
        await clickPoint(286, 403);
    }
    else if (input === '411') {
        await clickPoint(70, 511);
    }
    ///////// end //////////





    else if (input === '42') {
        await clickPoint(308, 389);
    }
    else if (input === '43') {
        await clickPoint(66, 447);
    }
    else if (input === '44') {
        await clickPoint(388, 401);
    }
    else if (input === '45') {
        await clickPoint(66, 451);
    }
    else if (input === '46') {
        await clickPoint(68, 479);
    }
    else if (input === '47') {
        await clickPoint(352, 357);
    }
    else if (input === '48') {
        await clickPoint(248, 393);
    }
    else if (input === '49') {
        await clickPoint(420, 493);
    }
    else if (input === '50') {
        await clickPoint(432, 443);
    }
    else {
        console.log(`Không hiểu lệnh: ${input}`);
    }

    checkClick = false;
});

let scale = 0.5;
// scale = 1;

let removeTab = 1;

let walletAccount = `Account 05`;

// 2142
(async () => {
    await processTasks(MainBrowser, {
        totalElements: 2180,
        stop: 2000,
        numTasksPerRun: 20,
        exclude: [],
        columns: 8,
        delayDuration: 1000,
        xStep: 480,
        // xStep: 370,
        yStep: 700,
        // yStep: 300,
        callback: async () => {
            rootEmpty = []

            resetAll();
        },
    })
})();


// https://lineh5.mobirix.com/bbcrush/index.html