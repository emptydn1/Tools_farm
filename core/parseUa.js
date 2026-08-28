function parseUA(ua) {
    const result = {
        browser: null,
        versionMajor: null,
        versionFull: null,
        platform: null,
        mobile: false
    };

    if (/Firefox\/(\d+\.\d+)/.test(ua)) {
        result.browser = 'firefox';
        result.versionFull = RegExp.$1;
        result.versionMajor = result.versionFull.split('.')[0];
    } else if (/Chrome\/([\d.]+)/.test(ua)) {
        result.browser = 'chrome';
        result.versionFull = RegExp.$1;          // ví dụ: 116.0.6382.0
        result.versionMajor = result.versionFull.split('.')[0]; // 116
    }

    // detect platform
    if (/Windows NT 10/.test(ua)) result.platform = 'Windows';
    else if (/Windows NT 11/.test(ua)) result.platform = 'Windows';
    else if (/Android/.test(ua)) { result.platform = 'Android'; result.mobile = true; }
    else if (/Mac OS X/.test(ua)) result.platform = 'macOS';
    else if (/Linux/.test(ua)) result.platform = 'Linux';
    else result.platform = 'Unknown';

    return result;
}

// Tạo metadata khớp cho Chrome UA
export function makeMetadata(UA) {
    const info = parseUA(UA);
    // console.log(info);

    if (info.browser !== 'chrome') return undefined;
    return {
        brands: [
            { brand: 'Chromium', version: info.versionMajor },
            { brand: 'Google Chrome', version: info.versionMajor },
            { brand: 'Not=A?Brand', version: '99' }
        ],
        fullVersion: info.versionFull,
        platform: info.platform,
        platformVersion: '0.1.0',  // tuỳ chỉnh nếu cần chi tiết hơn
        architecture: 'x86',
        model: '',
        mobile: info.mobile
    };
}

// Ví dụ dùng
// const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.5911.0 Safari/537.36 OPR/103.0.0.0';
// console.log(makeMetadata(UA));