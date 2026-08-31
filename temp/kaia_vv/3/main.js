import { exec, execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { sleep, waitForInput } from './utils/utils.js';

const runFile = (fileName) => new Promise((resolve, reject) => {
    exec(`node ./${fileName}`, (error, stdout, stderr) => {
        console.log(stdout);
        if (error) {
            console.error(`Lỗi khi chạy file ${fileName}:`, error.message);
            reject(error);
        } else {
            console.log(`File ${fileName} đã chạy thành công.`);
            resolve();
        }
    });
});




const filePath = './data/time.json';
const runTasks = async () => {
    try {
        const checkExist = await fs.pathExists(filePath);
        if (checkExist) {
            while (true) {
                let data = await fs.readJson(filePath);
                let arrTask = [];
                for (let x of data) {
                    if (Date.now() > x.time) {
                        arrTask.push(x)
                        console.log(x.name)
                        try {
                            fetch("https://664aa391a300e8795d427b86.mockapi.io/temp/1", {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ on: true })
                            }).then(v => v.json()).then(v => console.log(v))
                            await waitForInput();
                            fetch("https://664aa391a300e8795d427b86.mockapi.io/temp/1", {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ on: false })
                            }).then(v => v.json()).then(v => console.log(v))
                            await runFile(x.name);
                        } catch (error) {
                            console.error(`Không thể chạy file ${x.name}:`, error.message);
                        }
                    }
                }
                console.log("khong co task")
                await sleep(5 * 60 * 1000);
            }
        }
        console.error('File time.json không tồn tại.');
    } catch (error) {
        console.error('Đã có lỗi xảy ra trong runTasks:', error.message);
    }
};

(async () => {
    await runTasks();
})()
