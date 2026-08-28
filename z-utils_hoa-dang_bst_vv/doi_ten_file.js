import fs from "fs";
import { spawn } from "child_process";
import sharp from "sharp";
import path from "path";
// import { sleep } from './utils/utils.js';
// import { findMatchingRegionsAndroids } from './utils/opencvNodejs.js';


// ========== CẤU HÌNH ==========
const FOLDER_PATH = `C:\\Users\\huy\\Desktop\\Tools_farm\\file11`;        // Thư mục chứa file (thay đổi nếu cần)
const EXTENSION = '.png';        // Đuôi file cần đổi tên
const START_NUMBER = 1;          // Bắt đầu từ số mấy
const PADDING = 0;               // Số chữ số tối thiểu (0 = không padding, 3 = 001, 002...)
// ==============================

function padNumber(num, padding) {
    if (padding <= 0) return String(num);
    return String(num).padStart(padding, '0');
}

function renameFiles() {
    // Đọc tất cả file trong folder
    const allFiles = fs.readdirSync(FOLDER_PATH);

    // Lọc file theo đuôi mở rộng và sắp xếp
    const targetFiles = allFiles
        .filter(file => file.toLowerCase().endsWith(EXTENSION.toLowerCase()))
        .sort(); // Sắp xếp theo tên gốc (thứ tự thời gian vì tên có timestamp)

    if (targetFiles.length === 0) {
        console.log(`Không tìm thấy file nào với đuôi "${EXTENSION}" trong "${FOLDER_PATH}"`);
        return;
    }

    console.log(`Tìm thấy ${targetFiles.length} file. Bắt đầu đổi tên...\n`);

    // Preview trước khi đổi tên
    const renameMap = targetFiles.map((file, index) => {
        const newName = padNumber(START_NUMBER + index, PADDING) + EXTENSION;
        return { oldName: file, newName };
    });

    // Hiển thị preview
    console.log('PREVIEW:');
    renameMap.forEach(({ oldName, newName }) => {
        console.log(`  ${oldName}  →  ${newName}`);
    });

    // Kiểm tra trùng tên
    const newNames = renameMap.map(r => r.newName);
    const duplicates = newNames.filter((name, i) => newNames.indexOf(name) !== i);
    if (duplicates.length > 0) {
        console.error('\nLỗi: Tên mới bị trùng:', duplicates);
        return;
    }

    // Thực hiện đổi tên
    console.log('\nĐang đổi tên...');
    let successCount = 0;
    let errorCount = 0;

    renameMap.forEach(({ oldName, newName }) => {
        const oldPath = path.join(FOLDER_PATH, oldName);
        const newPath = path.join(FOLDER_PATH, newName);

        try {
            fs.renameSync(oldPath, newPath);
            console.log(`  ✓ ${oldName} → ${newName}`);
            successCount++;
        } catch (err) {
            console.error(`  ✗ Lỗi đổi tên "${oldName}": ${err.message}`);
            errorCount++;
        }
    });

    console.log(`\nHoàn tất! Thành công: ${successCount}, Lỗi: ${errorCount}`);
}

renameFiles(); 