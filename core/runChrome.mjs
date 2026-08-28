// process.removeAllListeners('warning');

import { EventEmitter } from 'events';
EventEmitter.setMaxListeners(20);

import fs from 'fs-extra';
import path from 'path';
import CDP from 'chrome-remote-interface';
import { launch } from 'chrome-launcher';
import axios from 'axios';

import { createCursor } from './custom-module/ghost-cursor/spoof.cjs';
import { chromeFlags } from './../utils/constant.js';
import { sleep, getFileInfo } from './../utils/utils.js';
import { checkPageLoad } from './../utils/cdp.js';
import { CursorActions } from './../utils/ghost-cursor.js';

import { MouseSyncController } from './../utils/mouseSync.js';

let { __filename, __dirname } = getFileInfo(import.meta.url);

const bypassMobile = path.join(__dirname, 'extensions', 'BypassTelegram');
const telegramWeb = path.join(__dirname, 'extensions', 'new_telegram-web-app');

const setupProxy = (proxy) => {
    // const match = proxy?.match(/http:\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<ip>[\d.]+):(?<port>\d+)/);
    const match = proxy?.match(/http:\/\/(?:(?<username>[^:]+):(?<password>[^@]+)@)?(?<ip>[\d.]+):(?<port>\d+)/);
    return match ? match.groups : {};
};

export const runChrome = async ({
    userProfileIndex = 0,
    proxy = null,
    args = [],
    url = "https://web.telegram.org/k/",
    disableGpu = false,
    accessIframe = true,
    isMobile = false,
    closeTabs = true,
    clearCache = false,
    clearCookies = false,
    clearDataForOrigin = false,
    test = false,
    okx = false,
} = {}) => {
    const userDataDir = path.join('C:', 'Users', 'huy', 'AppData', 'Local', 'Google', 'Chrome', 'User Data', `Profile ${userProfileIndex + 100}`);
    fs.ensureDirSync(userDataDir);

    let { username, password, ip, port } = setupProxy(proxy);

    let disableGpuFlags = [
        '--disable-3d-apis',
        '--disable-video',
        '--disable-accelerated-2d-canvas',
        '--disable-gl-drawing-for-tests',

        // '--disable-images', // cân nhắc
        '--disable-gpu',
        '--disable-software-rasterizer',
    ];

    const bypassMobile = path.join(__dirname, 'extensions', 'BypassTelegram');
    const okxPath = path.join(__dirname, 'extensions', 'okx', '3.67.8_0');
    const telegramWeb = path.join(__dirname, 'extensions', 'new_telegram-web-app');

    let mobileFlags = [
        `--disable-extensions-except=${bypassMobile}`,
        `--load-extension=${bypassMobile}`,

        // `--disable-extensions-except=${bypassMobile},${telegramWeb}`,
        // `--load-extension=${bypassMobile},${telegramWeb}`,
    ]

    let okxFlags = [
        `--disable-extensions-except=${okxPath}`,
        `--load-extension=${okxPath}`,
    ]
    console.log(userDataDir);

    const chrome = await launch({
        // chromePath: "C:\\GoogleChromePortable\\App\\Chrome-bin\\chrome.exe",
        // chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        ignoreDefaultFlags: true,
        userDataDir: "C:\\Users\\huy\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 3",
        chromeFlags: [
            ...chromeFlags,
            ...(disableGpu ? disableGpuFlags : []),
            ...args,
            ...(proxy ? [`--proxy-server=${ip}:${port}`] : []),
            ...(isMobile ? mobileFlags : []),
            ...(okx ? okxFlags : []),
        ],
        logLevel: "verbose"
    });
    // handle authentication popup
    const main = await CDP({ port: chrome.port });
    await main.Page.enable();
    await main.Page.navigate({ url: 'https://google.com' });
    await checkPageLoad({ client: main });
    await sleep(2000);


    if (okx) {
        let checkPopupOkxExist = false;
        while (!checkPopupOkxExist) {
            const response = await axios.get(`http://localhost:${chrome.port}/json`);
            const tabs = response.data;
            for (const tab of tabs) {
                if (tab.url.includes('chrome-extension://mcohilncbfahbmgdjkbpemcciiolgcge/notification.html#')) checkPopupOkxExist = true;
            }
            await sleep(1000);
        }
    }


    const client = await CDP({ port: chrome.port });
    const { Page, Runtime, Input, DOM, Target, Network, Emulation, Storage } = client;
    await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);

    // await Network.setCacheDisabled({ cacheDisabled: true });
    // await Network.setBypassServiceWorker({ bypass: true });

    if (clearCookies) await Network.clearBrowserCookies();
    if (clearCache) await Network.clearBrowserCache();
    if (clearDataForOrigin) {
        await Storage.clearDataForOrigin({
            origin: clearDataForOrigin,
            storageTypes: 'all' // 'all' hoặc: 'cookies,local_storage,indexeddb,websql,cache_storage,service_workers'
        });
    }

    await Network.setRequestInterception({ patterns: [{ urlPattern: '*' }] });
    Network.requestIntercepted(async ({ interceptionId, authChallenge }) => {
        if (!interceptionId) {
            console.error("Invalid interceptionId received.");
            return;
        }
        try {
            if (authChallenge) {
                await Network.continueInterceptedRequest({
                    interceptionId,
                    authChallengeResponse: { response: "ProvideCredentials", username, password },
                });
            } else {
                await Network.continueInterceptedRequest({ interceptionId });
            }
        } catch (error) {
            console.error("Error processing intercepted request:", error);
        }
    });

    ///////////////////////////////////////////////////////////////////////////
    //                              Watch this                               //
    ///////////////////////////////////////////////////////////////////////////
    let mouseControler = new MouseSyncController({ client, userProfileIndex });
    // đây là chuột
    const cursor = createCursor(Input);
    // tạo đối tượng thao tác với chuột ở trang đích main_frame
    const cursorActionClient = new CursorActions(client, cursor, false, Input);

    let cursorSession;
    let cursorActionIframe;

    let targetInfoIframe;
    let sessionIframe;

    let workers = [];
    let iframes = [];

    await Target.setDiscoverTargets({ discover: true });
    Target.targetCreated(async ({ targetInfo }) => {
        const { type, targetId } = targetInfo;

        if (type === 'page') {
            if (closeTabs) {
                console.log('New tab detected:', targetId);
                //await sleep(3000);
                await client.Target.closeTarget({ targetId });
            }
        } else if (type === 'iframe') {
            iframes.push(targetInfo);
            targetInfoIframe ||= targetInfo;
            await mouseControler.addNewIframes(targetId, chrome);
        } else if (type === 'worker') {
            workers.push(targetInfo);
        }
        // đây la dev tool
        // else if (type === 'other') {
        //     targetInfoIframe ||= targetInfo;
        // }
    });
    ///////////////////////////////////////////////////////////////////////////
    //                              Watch this ⇡                             //
    ///////////////////////////////////////////////////////////////////////////

    if (test) {
        await Page.navigate({ url });
        await checkPageLoad({ client });

        await mouseControler.init(client);
    } else {
        await Page.navigate({ url });
        await checkPageLoad({ client });

        await Page.reload();
        await checkPageLoad({ client });
    }

    if (accessIframe) {
        let checkIframe = false;
        let pageLoadCount = 0;

        while (!checkIframe) {
            await sleep(2000);
            await cursorActionClient.moveToSelector({ selector: '#column-center .new-message-bot-commands.is-view', maxWaitTime: 2000 })
            await cursorActionClient.moveToSelector({ selector: "body > div.popup.popup-peer.popup-confirmation.active > div > div > button:nth-child(1) > div", maxWaitTime: 2000 })
            await sleep(2000);

            const { result } = await client.Runtime.evaluate({ expression: `document.querySelectorAll("iframe").length > 0` });
            if (result.value) checkIframe = true;

            if (pageLoadCount > 10) {
                await Page.reload();
                targetInfoIframe = null;
                pageLoadCount = 0;
            }
            pageLoadCount++;
            console.log(pageLoadCount);
        }

        ///////////////////////////////////////////////////////////////////////////
        //                              Open iframe ⇡                            //
        ///////////////////////////////////////////////////////////////////////////
        while (!targetInfoIframe) { await sleep(1000); }

        // tạo session thao tác với sub_frame
        sessionIframe = await CDP({ target: targetInfoIframe.targetId, port: chrome.port });
        const { Runtime, Input, Network, Emulation } = sessionIframe;
        await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);

        if (isMobile) {
            // tạo chuột ở trang sub_frame
            cursorSession = createCursor(Input);
            // tạo đối tượng thao tác với chuột ở trang sub_frame
            cursorActionIframe = new CursorActions(sessionIframe, cursorSession, isMobile, client.Input);

            await Network.setUserAgentOverride({
                userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
                acceptLanguage: 'en-US,en;q=0.9',
                platform: 'Android'
            });
            await Emulation.setNavigatorOverrides({ platform: 'Android' });
            await Emulation.setUserAgentOverride({
                userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
                acceptLanguage: 'en-US,en;q=0.9',
                platform: 'Android',
                userAgentMetadata: {
                    brands: [{ brand: "Google Chrome", version: "112.0.0.0" }],
                    fullVersion: "112.0.0.0",
                    platform: "Android",
                    platformVersion: "13",
                    architecture: "arm64",
                    model: "SM-S908B",
                    mobile: true
                }
            });
            await sessionIframe.Emulation.setTouchEmulationEnabled({
                enabled: true,
                maxTouchPoints: 5,
            });
        } else {
            cursorActionIframe = new CursorActions(sessionIframe, cursor, isMobile, client.Input);
        }

        if (test) {
            await mouseControler.init(sessionIframe, false, isMobile);
        }
        await checkPageLoad({ client: sessionIframe })
    }

    return { chrome, cursor, cursorSession, client, cursorActionClient, sessionIframe, cursorActionIframe, iframes, workers };
}

