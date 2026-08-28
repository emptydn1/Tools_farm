(async () => {
    const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
    while (true) {
        document.querySelector("#app > div.tasks-page.page > div.sections div > div.tasks-list div.kit-overlay > div > div > div.heading > div.kit-icon.link-icon")?.remove()
        await sleep(500);
    }
})()