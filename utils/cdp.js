import { sleep } from './utils.js';

//cach 1        dùng chung profile nhưng logic nhiều cần sửa lại
// const targets = await fetchData(`http://localhost:${chrome.port}/json`, "GET");
// const pages = targets.filter(t => t.type === 'page' && t.url.startsWith('http'));
// let { webSocketDebuggerUrl } = pages[pages.length - 1];
// const client = await CDP({ target: webSocketDebuggerUrl });
// const { Page, Runtime, Input, DOM, Target } = client;

// // Tạo wrapper cho `client` để tự động gửi `sessionId`
export function createSessionClient(client, sessionId) {
    const send = async (method, params = {}) => {
        const response = await client.send(method, params, sessionId);
        return response;
    };

    return {
        // send,
        Runtime: {
            enable: async () => await send('Runtime.enable'),
            evaluate: async (params) => await send('Runtime.evaluate', params),
            getProperties: async (params) => await send('Runtime.getProperties', params),
        },
        Network: {
            enable: async () => await send('Network.enable'),
            setUserAgentOverride: async (params) => await send('Network.setUserAgentOverride', params),
        },
        Page: {
            enable: async () => await send('Page.enable'),
            navigate: async (params) => await send('Page.navigate', params),
        },
        Emulation: {
            setUserAgentOverride: async (params) => await send('Emulation.setUserAgentOverride', params),
            setDeviceMetricsOverride: async (params) => await send('Emulation.setDeviceMetricsOverride', params),
            setNavigatorOverrides: async (params) => await send('Emulation.setNavigatorOverrides', params),
            setTouchEmulationEnabled: async (params) => await send('Emulation.setTouchEmulationEnabled', params),
        },
        // DOM: {
        //     enable: async () => await send('DOM.enable'),
        //     getDocument: async () => await send('DOM.getDocument'),
        //     querySelector: async (nodeId, selector) => await send('DOM.querySelector', { nodeId, selector }),
        //     querySelectorAll: async (nodeId, selector) => await send('DOM.querySelectorAll', { nodeId, selector }),
        // },
        Input: {
            dispatchMouseEvent: async (params) => await send('Input.dispatchMouseEvent', params),
            dispatchKeyEvent: async (params) => await send('Input.dispatchKeyEvent', params),
            dispatchTouchEvent: async (params) => await send('Input.dispatchTouchEvent', params),
        },
    };
}

export const checkPageLoad = async ({ client }) => {
    // lệnh này để trưng biêt đâu lại dùng đc cú pháp
    // await client.send('Runtime.enable', {}, sessionId).then((s) => console.log('Runtime.enable() with sessionId: ', sessionId));
    // const result = await client.send('Runtime.evaluate', { expression: `document.readyState === 'complete' ? document.body.innerText : null`, returnByValue: true }, sessionId)
    //     .then(response => response.result.value)
    try {
        let pageLoaded = false;
        while (!pageLoaded) {
            const { result } = await client.Runtime.evaluate({ expression: 'document.readyState' });
            if (result.value === 'complete') pageLoaded = true;
            await sleep(500);
        }
        await sleep(1000);
    } catch (error) {
        console.log("error document.readyState rdp file");
    }
};

export const checkSelectorExists = async ({ client, selector, callback, maxWaitTime = null }) => {
    let startTime = Date.now();
    while (true) {
        if (maxWaitTime !== null && (Date.now() - startTime) >= maxWaitTime) {
            console.log("Max wait time reached, stopping check.");
            break;
        }

        const { result } = await client.Runtime.evaluate({ expression: `document.querySelectorAll("${selector}").length > 0` });
        if (result.value) {
            await callback();
            break;
        }
        await sleep(500);
    }
}


export const findTasks = async ({
    client,
    parentSelector,
    depth = 1,
    childIndex = 1,
    ignores = [],
    isTaskCompleted,
}) => {
    const checkTaskCompleted = isTaskCompleted ?? ((task) => false);

    const params = JSON.stringify({ parentSelector, depth, childIndex, ignores });

    const { result: tasks } = await client.Runtime.evaluate({
        expression: `(() => {
            const { parentSelector, depth, childIndex, ignores } = ${params};

            const isTaskCompleted = ${checkTaskCompleted.toString()};

            const findTasks = ({ parentSelector, depth, childIndex, ignores }) => {
                const rootChildren = document.querySelector(parentSelector)?.children;
                if (!rootChildren) return [];

                const results = [];
                for (let i = 0; i < rootChildren.length; i++) {
                    let current = rootChildren[i];

                    for (let j = 0; j < depth; j++) {
                        current = current?.children[childIndex];
                        if (!current) break;
                    }

                    const tasks = current?.children || [];
                    for (let k = 0; k < tasks.length; k++) {
                        const task = tasks[k];
                        const isIgnore = ignores.some(str =>
                            task.textContent.toLowerCase().includes(str.toLowerCase())
                        );
                        const isDone = isTaskCompleted(task);
                        if (!isIgnore && !isDone) {
                            results.push({ rootIndex: i, taskIndex: k });
                        }
                    }
                }
                return results;
            };

            return findTasks({ parentSelector, depth, childIndex, ignores });
        })()`,
        returnByValue: true,
    });

    return tasks.value;
};