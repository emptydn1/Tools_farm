import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';

import { runChrome } from './core/runChrome.mjs';
import { resetAll, get_start_click, get_start_click2 } from "./utils/mouseSync.js";

import { processTasks } from './utils/constant.js';
import { waitForInput, sleep } from './utils/utils.js';

const MainBrowser = async (userProfileIndex, proxy, positionX, positionY) => {
    try {
        let { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers } = await runChrome({
            userProfileIndex,
            proxy: null,
            args: [
                `--window-position=${positionX},${positionY}`,
                '--window-size=1400,800',
                // '--auto-open-devtools-for-tabs',
                '--force-device-scale-factor=0.4',
                '--window-size=400,780',
                // '--force-device-scale-factor=0.67',
                // '--force-device-scale-factor=0.9',
            ],
            url: "https://google.com/",
            url: "chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/popup.html#/initialize",
            accessIframe: false,
            // isMobile: true,
            // closeTabs: false,
            // test: true,
            okx: true,
        });


        // button  create wallet
        // document.querySelector("#app > div > div > div > div._affix_oe51y_42 > div > div:nth-child(1) > button")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._affix_oe51y_42 > div > div:nth-child(1) > button" });




        // seed phase
        // document.querySelector("#app > div > div > div > div._wallet-spin_1px67_19._wallet-list_1kyzd_1 > div > div:nth-child(1)")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-spin_1px67_19._wallet-list_1kyzd_1 > div > div:nth-child(1)" });




        // next
        // document.querySelector("#app > div > div > div > div._wallet-spin_1px67_19._wallet-container_1px67_1._content_mpzi1_4 > div._affix_oe51y_42 > div > button")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-spin_1px67_19._wallet-container_1px67_1._content_mpzi1_4 > div._affix_oe51y_42 > div > button" });



        // input pass 1
        // document.querySelector("#app > div > div.main-container-wrapper > div > div._container_11fv0_11 > form > div:nth-child(1) > div.okui-form-item-control > div > div > div > div > input")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._container_11fv0_11 > form > div:nth-child(1) > div.okui-form-item-control > div > div > div > div > input" });
        await client.Input.insertText({ text: "Hoang123@" });



        // input pass 2
        // document.querySelector("#app > div > div.main-container-wrapper > div > div._container_11fv0_11 > form > div:nth-child(3) > div.okui-form-item-control > div > div > div > div > input")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div.main-container-wrapper > div > div._container_11fv0_11 > form > div:nth-child(3) > div.okui-form-item-control > div > div > div > div > input" });
        await client.Input.insertText({ text: "Hoang123@" });




        // conffirm
        // document.querySelector("#app > div > div._affix_oe51y_42 > div > button")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div._affix_oe51y_42 > div > button" });


        // not down seed
        // document.querySelector("#app > div > div > div > div._affix_oe51y_42 > div > button.okui-btn.btn-lg.btn-fill-highlight.block.mobile.bold")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._affix_oe51y_42 > div > button.okui-btn.btn-lg.btn-fill-highlight.block.mobile.bold" });



        // di chuyen chuot va click de hien thi seed
        // document.querySelector("#app > div > div > div > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._wrapper_phril_1 > div.seed-panel.border")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._wrapper_phril_1 > div.seed-panel.border" });



        // click try again đẻ hiển thị text thay vi canvas
        //document.querySelector("#app > div > div > div > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._wrapper_phril_1 > div.seed-panel > div._switchMode_1wzc3_1 > div._typography-text_1os1p_1._typography-text-left_1os1p_8._typography-text-xs_1os1p_33._typography-text-secondary_1os1p_49 > div")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._wrapper_phril_1 > div.seed-panel > div._switchMode_1wzc3_1 > div._typography-text_1os1p_1._typography-text-left_1os1p_8._typography-text-xs_1os1p_33._typography-text-secondary_1os1p_49 > div" });


        // lay data seed
        // let a = document.querySelectorAll("#app > div > div > div > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._wrapper_phril_1 > div.seed-panel > div.seed-panel__background > div")
        // let arr = [];
        // for(let x of a ){
        //         console.log(x.textContent)
        // }
        let { result: secretWordsArr } = await client.Runtime.evaluate({
            expression: `
                (() => {
        let a = document.querySelectorAll("#app > div > div > div > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._wrapper_phril_1 > div.seed-panel > div.seed-panel__background > div")
        let arr = [];
        for(let x of a ){
            arr.push(x.textContent);
        }
        return arr;
                })()    
            `,
            returnByValue: true,
        })
        let secretWords = secretWordsArr.value.join(' ');

        // let filePath = 'okxWallet.json'
        // let dataBirds = (await fs.pathExists(filePath)) ? await fs.readJson(filePath) : [];
        // dataBirds.push({ userProfileIndex, secretWords });
        // await fs.writeJson(filePath, dataBirds, { spaces: 2 });


        // click da xem seed 
        //document.querySelector("#app > div > div > div > div:nth-child(4) > div > button")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div:nth-child(4) > div > button" });


        // lay so thu tu
        let { result: stt } = await client.Runtime.evaluate({
            expression: `
                (() => {
        let arr = document.querySelector("#app > div > div._wallet-spin_1px67_19._wallet-container_1px67_1._wallet-portal_1px67_22._root_phril_32 > div._content_phril_35 > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._backup_phril_38").textContent.match(/\\d+/g)
        return arr;
                })()    
            `,
            returnByValue: true,
        })

        for (let i = 0; i < stt.value.length; i++) {
            let sttOfword = stt.value[i];
            const element = secretWordsArr.value[sttOfword - 1];
            console.log(element);

            let { result: chooseWord } = await client.Runtime.evaluate({
                expression: `
                    (() => {
        for (let i = 1; i <= 3; i++) {
            let a = document.querySelector(\`#app > div > div._wallet-spin_1px67_19._wallet-container_1px67_1._wallet-portal_1px67_22._root_phril_32 > div._content_phril_35 > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._backup_phril_38 > div:nth-child(${i + 1}) > div > div:nth-child(2) > div > div:nth-child(\${i})\`)
            let text = a.textContent;
            if(text == '${element}'){
                return i;
            }
        }
                    })()    
                `,
            })

            await cursorActionClient.moveToSelector({ selector: `#app > div > div._wallet-spin_1px67_19._wallet-container_1px67_1._wallet-portal_1px67_22._root_phril_32 > div._content_phril_35 > div._wallet-space_1px67_6._wallet-space-vertical_1px67_16._backup_phril_38 > div:nth-child(${i + 1}) > div > div:nth-child(2) > div > div:nth-child(${chooseWord.value})` });
        }

        // click ok 
        // document.querySelector("#app > div > div > div > div._affix_oe51y_42 > div > button")
        await cursorActionClient.moveToSelector({ selector: "#app > div > div > div > div._affix_oe51y_42 > div > button" });






        // await waitForInput();
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
        // totalElements: 1000,
        // stop: 900,
        totalElements: 4000,
        // stop: 2000,
        stop: 2600,
        // stop: 2199,
        numTasksPerRun: 20,
        columns: 9,
        // xStep: 370,
        // yStep: 350,
        delayDuration: 2000,
        callback: async () => {
            resetAll()
        },
    })
    process.exit(0);
})();
