// process.removeAllListeners('warning');
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 30;

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
import { makeMetadata } from './parseUa.js';

// let { __filename, __dirname } = getFileInfo(import.meta.url);

const setupProxy = (proxy) => {
    const match = proxy?.match(/http:\/\/(?<username>[^:]+):(?<password>[^@]+)@(?<ip>[\d.]+):(?<port>\d+)/);
    return match ? match.groups : {};
};



export const runChrome = async ({
    userProfileIndex = 0,
    UA_LIST = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"],
    proxy = null,
    args = [],
    url = "https://google.com/",

    clearCookies = false,
    closeTabs = false,
} = {}) => {
    const userDataDir = path.join('C:', 'Users', 'huy', 'AppData', 'Local', 'Google', 'Chrome', 'User Data', `Profile ${userProfileIndex + 100}`);

    fs.ensureDirSync(userDataDir);

    let { username, password, ip, port } = setupProxy(proxy);


    const UA_FAKE = UA_LIST[Math.floor(Math.random() * UA_LIST.length)];
    console.log(UA_FAKE);

    const isFirefoxUA = UA_FAKE?.includes('Firefox');


    const chrome = await launch({
        // chromePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        // startingUrl: 'https://www.google.com',
        // logLevel: "verbose"
        ignoreDefaultFlags: true,
        userDataDir,
        chromeFlags: [
            ...chromeFlags,
            ...args,
            ...(proxy ? [`--proxy-server=${ip}:${port}`] : []),
            ...(isFirefoxUA ? ['--disable-features=UserAgentClientHint'] : [])
        ],
    });

    const main = await CDP({ port: chrome.port });
    await main.Page.enable()
    await main.Page.navigate({ url: 'https://google.com' });
    await checkPageLoad({ client: main });
    await sleep(2000);

    const client = await CDP({ port: chrome.port });
    const { Page, Runtime, Input, DOM, Target, Network, Emulation, Storage } = client;
    await Promise.all([Page.enable(), Network.enable(), Runtime.enable()]);


    // truy cập website không được cả mobile lẫn web thì dùng cái này , new data
    if (clearCookies) {
        await Network.clearBrowserCookies();
        await Network.clearBrowserCache();
        await Storage.clearDataForOrigin({
            origin: clearCookies,
            storageTypes: 'all' // all hoặc: 'cookies,local_storage,indexeddb,websql,cache_storage,service_workers'
        });
    }

    if (isFirefoxUA) {
        await Network.setUserAgentOverride({ userAgent: UA_FAKE });
    } else {
        await Network.setUserAgentOverride({
            userAgent: UA_FAKE,
            userAgentMetadata: makeMetadata(UA_FAKE)
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
            // console.error("Error processing intercepted request:", error);
        }
    });




    ///////////////////////////////////////////////////////////////////////////
    //                              Watch this                               //
    ///////////////////////////////////////////////////////////////////////////

    // đây là chuột
    const cursor = createCursor(Input);
    // tạo đối tượng thao tác với chuột ở trang đích main_frame
    const cursorActionClient = new CursorActions(client, cursor, false, Input);


    let workers = [];
    let iframes = [];

    await Target.setDiscoverTargets({ discover: true });
    Target.targetCreated(async ({ targetInfo }) => {
        const { type, targetId } = targetInfo;

        if (type === 'page') {
            if (closeTabs) {
                console.log('New tab detected:', targetId);
                //await sleep(200);
                await client.Target.closeTarget({ targetId });
            }
        } else if (type === 'iframe') {
            // console.log('iframe:', targetInfo);
            iframes.push(targetInfo);
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

    await Page.navigate({ url });
    await checkPageLoad({ client });
    await Page.reload();
    await checkPageLoad({ client });

    return { chrome, cursor, client, cursorActionClient, iframes, workers };
}

