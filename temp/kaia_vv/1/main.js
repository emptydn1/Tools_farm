import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { log } from './utils/utils.js';

const runTasks = async (tasks, mode) => {
    for (let x of tasks) {
        await new Promise((resolve, reject) => {
            const child = spawn('node', [x.path, mode]);

            // Lắng nghe luồng stdout và log ra theo thời gian thực
            child.stdout.on('data', (data) => {
                log(`[processing - ${x.name}]: ${data.toString()}`, 'blue');
            });

            // Lắng nghe luồng stderr và log ra lỗi nếu có
            child.stderr.on('data', (data) => {
                log(`[stderr - ${x.name}]: ${data.toString()}`);
            });

            // Xử lý khi tiến trình kết thúc
            child.on('close', (code) => {
                if (code === 0) {
                    log(`[File ${x.name} đã chạy thành công.]`, 'yellow');
                    resolve();
                } else {
                    console.error(`Lỗi khi chạy file ${x.name}, mã lỗi: ${code}`);
                    reject(new Error(`Process exited with code ${code}`));
                }
            });

            // Xử lý lỗi khi khởi động tiến trình
            child.on('error', (error) => {
                console.error(`Không thể chạy file ${x.name}:`, error.message);
                reject(error);
            });
        });
    }
};


(async () => {
    let exclude = ['13-tverse.js', '6-firecoin.js', '18-UXUYbot.js', '20-Snakeshouselive_bot.js', '11-codexfieldbot.js', '10-fomo.js', '9-wukong.js', '8-bums.js',
        '1-birth.js', '1.js', '2.js', '3-seed.js', '2-blum.js', '7-paws.js', '5-runBlum.js', 'main.js', 'r-check-proxy.js', 'rename.js', 'receive_ref.js'];

    const absoluteDir = path.resolve('./');
    const jsFiles = fs.readdirSync(absoluteDir)
        .filter(file => path.extname(file) === '.js' && !exclude.includes(file) && !file.startsWith('w'))
        .map(file => ({ path: path.join(absoluteDir, file), name: file }));
    jsFiles.push({ name: 'All' });

    const choices = jsFiles.map(({ name }) => ({ name: name, value: name, checked: name === 'All' }));

    try {
        const modeAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'mode',
                message: 'Bạn muốn chạy tự động hay thủ công?',
                choices: [
                    { name: 'Chạy tự động', value: 'auto' },
                    { name: 'Chạy thủ công', value: 'manual' },
                    { name: 'Chạy liên tục', value: 'loop' },
                ],
            },
        ]);

        const itemAnswer = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selection',
                message: 'Di chuyển bằng phím mũi tên và chọn YES với phím cách:',
                choices: choices,
                pageSize: 40,
                filter: (selected) => {
                    if (selected.includes('All')) {
                        if (selected.length > 1) {
                            return jsFiles.filter(item => item.name !== 'All' && selected.some(sel => item.name.includes(sel)));
                        } else {
                            return jsFiles.filter(file => file.name !== 'All');
                        }
                    }
                    return jsFiles.filter(item => selected.some(sel => item.name.includes(sel)));
                },
                when: () => ['manual', 'auto', 'loop'].includes(modeAnswer.mode),
            },
        ]);

        await runTasks(itemAnswer.selection, modeAnswer.mode)
    } catch (error) {
        console.error('Đã xảy ra lỗi:', error);
    }
})();


