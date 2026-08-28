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
                '--force-device-scale-factor=0.4',
                // '--force-device-scale-factor=0.67',
            ],
            url: "https://web.telegram.org/k/#@BlumCryptoBot",
            disableGpu: true,
            isMobile: true,
        });
        const jsContent = fs.readFileSync('./utils/injection/emulator_touch.js', 'utf8');
        await sessionIframe.Runtime.evaluate({ expression: jsContent });
        const jsContent2 = fs.readFileSync('./utils/injection/disable_animation.js', 'utf8');
        await sessionIframe.Runtime.evaluate({ expression: jsContent2 });

        // take ticket
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-daily-reward.reward > div > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-daily-reward.reward > div > button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-daily-reward.reward > div > button", maxWaitTime: 2000, iframe: true });
        await sleep(2000);
        await sessionIframe.Runtime.evaluate({
            expression: `(async ()=>{
                const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
                let a = document.querySelector("#app > div.index-page.page > div.pages-index-points > div > div:nth-child(2) > div.right-slot > div button");

                a?.scrollIntoView({ behavior: "smooth", block: "start" });
                await sleep(1000)
                a?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    })()`,
            awaitPromise: true,
        });
        await sleep(2000);

        // claim
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-points > div > div:nth-child(2) > div.right-slot > div button", iframe: client });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-points > div > div:nth-child(2) > div.right-slot > div button", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-points > div > div:nth-child(2) > div.right-slot > div button", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-points > div > div:nth-child(2) > div.right-slot > div button", maxWaitTime: 2000, iframe: true });
        await cursorActionIframe.moveToSelector({ selector: "#app > div.index-page.page > div.pages-index-points > div > div:nth-child(2) > div.right-slot > div button", maxWaitTime: 2000, iframe: true });

        let run = false;
        if (run) {
            // click show tasks
            await cursorActionIframe.moveToSelector({ selector: '#app > div.layout-tabs.tabs > a:nth-child(2)', iframe: client });
            await cursorActionIframe.moveToSelector({ selector: '#app > div.layout-tabs.tabs > a:nth-child(2)', iframe: true });

            // click to view tasks 1
            await cursorActionIframe.moveToSelector({ selector: '#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.kit-tabs-inline.is-fully-left-scrolled > div.content > div > label:nth-child(4)', iframe: true });

            let { result: takeTasks1 } = await sessionIframe.Runtime.evaluate({
                expression: `(()=>{
        let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
        let arr = [];
        for (let i = 0; i < root.length; i++) {
            const buttonText = root[i].querySelector('button').textContent;
            if (buttonText.includes('Start')) {
                arr.push(i)
            }
        }
        return arr;
                    })()`,
                returnByValue: true,
            });

            for (let e of takeTasks1.value) {
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
        const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children[${e}];
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
        await sleep(1000)
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
                        })()`,
                    awaitPromise: true,
                });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(${e + 1}) button > div.label`, maxWaitTime: 2000, iframe: client });
                await client.Page.bringToFront()
                await sleep(2000);
            }

            let { result: claims1 } = await sessionIframe.Runtime.evaluate({
                expression: `(()=>{
        let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
        let arr = [];
        for (let i = 0; i < root.length; i++) {
            const buttonText = root[i].querySelector('button').textContent;
            if (buttonText.includes('Claim')) {
                arr.push(i)
            }
        }
        return arr;
                    })()`,
                returnByValue: true,
            });

            let tempClaim1 = claims1.value.length
            while (tempClaim1 > 0) {
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
        const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children[0];
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
        await sleep(1000);
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
                        })()`,
                    awaitPromise: true,
                });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(1) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(2) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(3) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(4) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(5) button > div.label`, maxWaitTime: 2000, iframe: client });
                let { result: claims11 } = await sessionIframe.Runtime.evaluate({
                    expression: `(()=>{
            let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
            let arr = [];
            for (let i = 0; i < root.length; i++) {
                const buttonText = root[i].querySelector('button').textContent;
                if (buttonText.includes('Claim')) {
                    arr.push(i)
                }
            }
            return arr;
                        })()`,
                    returnByValue: true,
                });
                tempClaim1 = claims11.value.length
            }
















            await sessionIframe.Runtime.evaluate({
                expression: `(async ()=>{
    const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(2) > div.pages-tasks-list.is-short-card > div:nth-child(1)");
    main?.scrollIntoView({ behavior: "smooth", block: "start" });
    await sleep(1000)
    main?.scrollIntoView({ behavior: "smooth", block: "start" });
                    })()`,
                awaitPromise: true,
            });


            // click to view tasks 2
            await cursorActionIframe.moveToSelector({ selector: '#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.kit-tabs-inline.is-fully-left-scrolled > div.content > div > label:nth-child(5)', iframe: client });

            let arrCode = [
                { question: "Navigating Crypto", code: "HEYBLUM" },
                { question: "How to Analyze Crypto?", code: "VALUE" },
                { question: "Forks Explained", code: "GO GET" },
                { question: "Secure your Crypt", code: "BEST PROJECT EVER" },
                { question: "What are Telegram Mini Apps?", code: "CRYPTOBLUM" },
                { question: "Say No to Rug Pull!", code: "SUPERBLUM" },
                { question: "What Are AMMs?", code: "CRYPTOSMART" },
                { question: "Liquidity Pools Guide", code: "BLUMERSSS" },
                { question: "$2.5M+ DOGS Airdrop", code: "HAPPYDOGS" },
                { question: "Doxxing", code: "NODOXXING" },
                { question: "Pre-Market Trading?", code: "WOWBLUM" },
                { question: "How to Memecoin?", code: "MEMEBLUM" },
                { question: "Token Burning: How & Why?", code: "ONFIRE" },
                { question: "Bitcoin Rainbow Chart?", code: "SOBLUM" },
                { question: "Crypto Terms. Part 1", code: "BLUMEXPLORER" },
                { question: "How To Trade Perp", code: "CRYPTOFAN" },
                { question: "Sharding Explain", code: "BLUMTASTIC" },
                { question: "DeFi Explained", code: "BLUMFORCE" },
                { question: "How To Find Altcoins?", code: "ULTRABLUM" },
                { question: "Crypto Slang. Part 1", code: "BLUMSTORM" },
                { question: "On-chain Analysis?", code: "Blumextra" },
                { question: "Pumptober Special", code: "Pumpit" },
                { question: "DeFi Risks: Key Insights", code: "BLUMHELPS" },
                { question: "Crypto Slang. Part 2", code: "FOMOOO" },
                { question: "Choosing a Crypto Exchange", code: "CRYPTOZONE" },
                { question: "Node Sales in Crypt", code: "Blumify" },
                { question: "Crypto DEX?", code: "DEXXX" },
                { question: "Understanding Gas Fee", code: "CRYPTOGAS" },
                { question: "What is Slippage", code: "Cryptobuzz" },
                { question: "Dec 6 Crypto News", code: "HUNDRED" },



                { question: "Crypto in Everyday Life", code: "BLUMANCE" },
                { question: "Blum CMO @ Blockchain Life", code: "BLUMISLIFE" },
                { question: "DEX History #3", code: "LOVEBLUM" },
                { question: "Memepad Tutoria", code: "MEMEPAD" },
                { question: "Crypto Slang. Part 4", code: "LAMBOBLUM" },
                { question: "DEX Evolutio", code: "BLUMSPARK" },
                { question: "Is Binance a DEX", code: "BLUMIES" },


                { question: "Crypto Communitie", code: "Blummunity" },
                { question: "P2P Trading Safety Ti", code: "BLUMTIPS" },
                { question: "Crypto Regulatio", code: "Blumrules" },
                { question: "DEX History", code: "Godex" },
                { question: "egulation: Yay or Nay", code: "BLUMSSS" },
                { question: "Crypto Slang. Part 3", code: "BOOBLUM" },
                { question: "Smart Contracts 101", code: "SMARTBLUM" },
                { question: " Next for DeFi?", code: "BLUMNOW" },
                { question: "What is Slippage?", code: "Cryptobuzz" },

                { question: "Dec 17 News", code: "KENDRICK" },
                { question: "Dec 18 News", code: "MARK" },
                { question: "Dec 16 News", code: "BITCOIN" },
                { question: "Dec 13 News", code: "BITCOINJESUS" },
                { question: "Dec 12 News", code: "RIPPLE" },

                // { question: "Doxxing", code: "NODOXXING" },
            ];

            //start button
            let { result: takeTasks } = await sessionIframe.Runtime.evaluate({
                expression: `(()=>{
        let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
        let arr = [];
        for (let i = 0; i < root.length; i++) {
            const buttonText = root[i].querySelector('button')?.textContent;
            if (buttonText?.includes('Start')) {
                arr.push({ indexTask: i, question: root[i].textContent })
            }
        }
        return arr;
                    })()`,
                returnByValue: true,
            });

            for (let e of takeTasks.value) {
                let index = arrCode.findIndex(str => e.question.toLowerCase().includes(str.question.toLowerCase()));
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
        const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children[${e.indexTask}];
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
        await sleep(1000)
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
                        })()`,
                    awaitPromise: true,
                });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(${e.indexTask + 1}) button > div.label`, maxWaitTime: 2000, iframe: client });
                await client.Page.bringToFront()
                await sleep(1000);
            }






            await sleep(5000)


            // verify button
            await sessionIframe.Runtime.evaluate({
                expression: `(async ()=>{
    const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(2) > div.pages-tasks-list.is-short-card > div:nth-child(1)");
    main?.scrollIntoView({ behavior: "smooth", block: "start" });
    await sleep(1000)
    main?.scrollIntoView({ behavior: "smooth", block: "start" });
                    })()`,
                awaitPromise: true,
            });


            let { result: takeTasksVerify } = await sessionIframe.Runtime.evaluate({
                expression: `(()=>{
        let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
        let arr = [];
        for (let i = 0; i < root.length; i++) {
            const buttonText = root[i].querySelector('button')?.textContent;
            if (buttonText?.includes('Verify')) {
                arr.push({ indexTask: i, question: root[i].textContent })
            }
        }
        return arr;
                    })()`,
                returnByValue: true,
            });

            for (let e of takeTasksVerify.value) {
                let index = arrCode.findIndex(str => e.question.toLowerCase().includes(str.question.toLowerCase()));
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
        const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children[${e.indexTask}];
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
        await sleep(1000)
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
                        })()`,
                    awaitPromise: true,
                });
                if (index !== -1) {
                    await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(${e.indexTask + 1}) button > div.label`, maxWaitTime: 2000, iframe: true });
                    await cursorActionIframe.moveToSelector({ selector: "#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list div.kit-overlay > div > div > div.kit-input.is-regular.is-large.input > div", maxWaitTime: 2000, iframe: true });
                    await client.Input.insertText({ text: arrCode[index].code });
                    await cursorActionIframe.moveToSelector({ selector: "#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list div.kit-overlay > div > div > div.kit-fixed-wrapper.no-layout-tabs > button", maxWaitTime: 2000, iframe: true });
                }
            }



            await sleep(2000);
            let { result: claims2 } = await sessionIframe.Runtime.evaluate({
                expression: `(()=>{
        let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
        let arr = [];
        for (let i = 0; i < root.length; i++) {
            const buttonText = root[i].querySelector('button').textContent;
            if (buttonText.includes('Claim')) {
                arr.push(i)
            }
        }
        return arr;
                    })()`,
                returnByValue: true,
            });

            let tempClaim2 = claims2.value.length;

            while (tempClaim2 > 0) {
                await sessionIframe.Runtime.evaluate({
                    expression: `(async ()=>{
        const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
        let main = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children[0];
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
        await sleep(1000)
        main?.scrollIntoView({ behavior: "smooth", block: "start" });
                        })()`,
                    awaitPromise: true,
                });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(1) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(2) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(3) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(4) button > div.label`, maxWaitTime: 2000, iframe: client });
                await cursorActionIframe.moveToSelector({ selector: `#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list > div:nth-child(5) button > div.label`, maxWaitTime: 2000, iframe: client });
                let { result: claims22 } = await sessionIframe.Runtime.evaluate({
                    expression: `(()=>{
            let root = document.querySelector("#app > div.tasks-page.page > div.sections > div:nth-child(3) > div > div.tasks-list").children;
            let arr = [];
            for (let i = 0; i < root.length; i++) {
                const buttonText = root[i].querySelector('button').textContent;
                if (buttonText.includes('Claim')) {
                    arr.push(i)
                }
            }
            return arr;
                        })()`,
                    returnByValue: true,
                });
                tempClaim2 = claims22.value.length;
            }
        }

        await sleep(2000);
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
        numTasksPerRun: 20,
        columns: 9,
        delayDuration: 2000,
    })
    process.exit(0);
})();





