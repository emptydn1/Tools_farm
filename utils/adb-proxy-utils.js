import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

// Dùng: import { installApp, runProxyFromFile, stopVpn } from './proxyTools.js';
// Ba hàm độc lập nhau. Cắt hàm nào ra dùng thì lấy kèm import của hàm đó:
//   installApp và runProxyFromFile cần spawnSync và fs;  stopVpn chỉ cần spawnSync.

/**
 * Cài app lên các giả lập, lần lượt từng máy.
 * Mặc định máy nào đã có app thì bỏ qua. force = true thì cài thẳng (adb install -r),
 * không cần biết máy đã có app hay chưa.
 *
 * Dùng: installApp('adbProxy.apk', [16448, 16480, 16512]);          // chưa có app mới cài
 *       installApp('adbProxy.apk', [16448, 16480, 16512], true);    // cài thẳng
 *
 * @param apk   đường dẫn file APK
 * @param ports cổng adb của các giả lập
 * @param force true = cài thẳng, không kiểm tra
 */
export function installApp(apk, ports, force = false) {
    const ADB = 'adb';                      // nếu adb không nằm trong PATH: 'C:\\...\\platform-tools\\adb.exe'
    const PKG = 'com.example.adbproxy';
    const QUICK = { encoding: 'utf8', windowsHide: true, timeout: 30000 };
    const SLOW = { encoding: 'utf8', windowsHide: true, timeout: 240000 };   // cài APK có thể lâu

    if (!fs.existsSync(apk)) throw new Error(`Không thấy file APK: ${apk}`);

    for (let i = 0; i < ports.length; i++) {
        const serial = `127.0.0.1:${ports[i]}`;
        const tag = `[${i + 1}] ${serial}`;
        spawnSync(ADB, ['connect', serial], QUICK);

        // 1) máy đã có app chưa? (bỏ qua bước này nếu force)
        if (!force) {
            const c = spawnSync(ADB, ['-s', serial, 'shell', 'pm', 'list', 'packages', PKG], QUICK);
            const cOut = c.error ? c.error.message : `${c.stdout}\n${c.stderr}`.trim();
            if (c.error || c.status !== 0) {
                console.log(`${tag}: lỗi - ${cOut.split('\n').pop() || 'không có phản hồi'}`);
                continue;
            }
            if (cOut.split(/\s+/).includes(`package:${PKG}`)) {
                console.log(`${tag}: đã có app, bỏ qua`);
                continue;
            }
        }

        // 2) cài
        const r = spawnSync(ADB, ['-s', serial, 'install', '-r', apk], SLOW);
        const out = r.error ? r.error.message : `${r.stdout}\n${r.stderr}`.trim();
        if (!r.error && r.status === 0 && out.includes('Success')) {
            console.log(`${tag}: đã cài app`);
        } else {
            console.log(`${tag}: lỗi - ${out.split('\n').pop() || 'không có phản hồi'}`);
        }
    }
}

/**
 * Chạy proxy theo file proxy.txt:
 *   giả lập 1 - dòng 1, giả lập 2 - dòng 2, giả lập 3 - dòng 1 (hết dòng thì quay lại dòng 1), ...
 * Mỗi dòng: ip:port@user:pass hoặc user:pass@ip:port, có thể có http:// hoặc socks5:// ở đầu.
 * Dòng null hoặc trống: giả lập đó không chạy proxy.
 *
 * Dùng: runProxyFromFile('proxy.txt', [16448, 16480, 16512]);
 *
 * @param file  đường dẫn file proxy
 * @param ports cổng adb của các giả lập, theo thứ tự giả lập 1, 2, 3, ...
 */
export function runProxyFromFile(file, ports) {
    const ADB = 'adb';                      // nếu adb không nằm trong PATH: 'C:\\...\\platform-tools\\adb.exe'
    const PKG = 'com.example.adbproxy';
    const DEFAULT_TYPE = 'socks5';          // loại cho dòng không có http:// hoặc socks5://
    const OPT = { encoding: 'utf8', windowsHide: true, timeout: 30000 };

    // đọc file, bỏ các dòng trống ở cuối file
    const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/);
    while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
    if (!lines.length) throw new Error(`File ${file} đang trống`);

    for (let i = 0; i < ports.length; i++) {
        const serial = `127.0.0.1:${ports[i]}`;
        const n = i % lines.length;           // quay vòng khi giả lập nhiều hơn số dòng
        const tag = `[${i + 1}] ${serial}`;
        let s = lines[n].trim();

        // 1) đọc dòng proxy -> ipport + userpass (dòng null thì để trống)
        let type = DEFAULT_TYPE;
        let ipport = '';
        let userpass = '';
        if (s !== '' && s.toLowerCase() !== 'null') {
            const scheme = s.match(/^(\w+):\/\/(.*)$/);
            if (scheme) {
                type = scheme[1].toLowerCase().startsWith('socks') ? 'socks5' : 'http';
                s = scheme[2].trim();
            }
            const a = s.match(/^(\d{1,3}(?:\.\d{1,3}){3}:\d{1,5})@([^:]+:.+)$/);   // ip:port@user:pass
            const b = s.match(/^([^:]+:.+)@(\d{1,3}(?:\.\d{1,3}){3}:\d{1,5})$/);   // user:pass@ip:port
            if (a) { ipport = a[1]; userpass = a[2]; }
            else if (b) { ipport = b[2]; userpass = b[1]; }
            else { console.log(`${tag}: dòng ${n + 1} sai định dạng, bỏ qua`); continue; }
        }

        // 2) gửi lệnh adb
        spawnSync(ADB, ['connect', serial], OPT);
        let r;
        if (ipport === '') {                  // null: tắt proxy nếu đang chạy
            r = spawnSync(ADB, ['-s', serial, 'shell', 'am', 'force-stop', PKG], OPT);
        } else {
            spawnSync(ADB, ['-s', serial, 'shell', 'appops', 'set', PKG, 'ACTIVATE_VPN', 'allow'], OPT);  // thử cấp sẵn quyền VPN, không được cũng không sao
            spawnSync(ADB, ['-s', serial, 'shell', 'am', 'force-stop', PKG], OPT);
            const value = `${ipport}@${userpass}`.replace(/'/g, `'"'"'`);   // an toàn khi mật khẩu có dấu '
            r = spawnSync(ADB, ['-s', serial, 'shell', `am start -n ${PKG}/.MainActivity --es type ${type} --es proxy '${value}'`], OPT);
        }

        // 3) báo kết quả (không in mật khẩu)
        const out = r.error ? r.error.message : `${r.stdout}${r.stderr}`.trim();
        if (r.error || r.status !== 0 || /Error|Exception/.test(out)) {
            console.log(`${tag}: lỗi - ${out.split('\n').pop() || 'không có phản hồi'}`);
        } else if (ipport === '') {
            console.log(`${tag}: không chạy proxy (dòng ${n + 1} là null/trống)`);
        } else {
            console.log(`${tag}: đã bật ${type} ${ipport} (dòng ${n + 1})`);
        }
    }
}

/**
 * Tắt VPN / proxy trên các giả lập: dừng app adbproxy bằng am force-stop.
 * Máy nào app đang không chạy thì lệnh này cũng không sao.
 *
 * Dùng: stopVpn([16448, 16480, 16512]);
 *
 * @param ports cổng adb của các giả lập
 */
export function stopVpn(ports) {
    const ADB = 'adb';                      // nếu adb không nằm trong PATH: 'C:\\...\\platform-tools\\adb.exe'
    const PKG = 'com.example.adbproxy';
    const OPT = { encoding: 'utf8', windowsHide: true, timeout: 30000 };

    for (let i = 0; i < ports.length; i++) {
        const serial = `127.0.0.1:${ports[i]}`;
        const tag = `[${i + 1}] ${serial}`;
        spawnSync(ADB, ['connect', serial], OPT);
        const r = spawnSync(ADB, ['-s', serial, 'shell', 'am', 'force-stop', PKG], OPT);

        // báo kết quả
        const out = r.error ? r.error.message : `${r.stdout}${r.stderr}`.trim();
        if (r.error || r.status !== 0 || /Error|Exception/.test(out)) {
            console.log(`${tag}: lỗi - ${out.split('\n').pop() || 'không có phản hồi'}`);
        } else {
            console.log(`${tag}: đã tắt VPN`);
        }
    }
}