import sharp from 'sharp';
import Tesseract from 'tesseract.js';


const positions = [
    { x: 80, y: 450 }, { x: 120, y: 450 }, { x: 160, y: 450 }, { x: 200, y: 450 }, { x: 240, y: 450 },
    { x: 80, y: 485 }, { x: 120, y: 485 }, { x: 160, y: 485 }, { x: 200, y: 485 }, { x: 240, y: 485 },
    { x: 80, y: 515 }, { x: 120, y: 515 }, { x: 160, y: 515 }, { x: 200, y: 515 }, { x: 240, y: 515 },
    { x: 80, y: 555 }, { x: 120, y: 555 }, { x: 160, y: 555 }, { x: 200, y: 555 }, { x: 240, y: 555 },
    { x: 80, y: 595 }, { x: 120, y: 595 }, { x: 160, y: 595 }, { x: 200, y: 595 }, { x: 240, y: 595 },
];
const positions2 = [
    { x: 270, y: 450 }, { x: 305, y: 450 }, { x: 345, y: 450 }, { x: 380, y: 450 }, { x: 420, y: 450 },
    { x: 270, y: 485 }, { x: 305, y: 485 }, { x: 345, y: 485 }, { x: 380, y: 485 }, { x: 420, y: 485 },
    { x: 270, y: 515 }, { x: 305, y: 515 }, { x: 345, y: 515 }, { x: 380, y: 515 }, { x: 420, y: 515 },
    { x: 270, y: 555 }, { x: 305, y: 555 }, { x: 345, y: 555 }, { x: 380, y: 555 }, { x: 420, y: 555 },
    { x: 270, y: 595 }, { x: 305, y: 595 }, { x: 345, y: 595 }, { x: 380, y: 595 }, { x: 420, y: 595 },
];

const COLS = 5;
const ROWS = 5;
const GAP = 0;
const SKIP_CELL = { row: 2, col: 2 };

// (async () => {
//     //trai
//     // 0.5 scale
//     // sharp('1.jpeg').extract({ left: 32, top: 212, width: 95, height: 95 }).toFile('xx.jpeg');

//     // phai
//     // sharp('1.jpeg').extract({ left: 124, top: 212, width: 95, height: 95 }).toFile('xx.jpeg');
//     // sharp('1.jpeg')
//     //     // .grayscale()
//     //     .threshold(200).toFile('xx.jpeg');

//     // await extractGridText('xx.jpeg')
// })()

// lam mo
// .blur(1.5)

// làm lộ nền che lấp số
// số càng cao nền càng che lấp số
// .threshold(180)

// xóa nền
// .grayscale() // Bỏ màu – giúp dễ xử lý nền
// .modulate({ brightness: 1.4 }) // Làm sáng tổng thể
// .linear(2, -100) // Tăng tương phản: pixel = 2x - 100
// .toFile('output.jpeg');


export async function extractGridText(buffer, imageOptions, captureImg = false, left = true) {
    let baseImage = sharp(buffer);

    if (imageOptions) {
        baseImage = baseImage.extract(imageOptions);
        if (captureImg) await baseImage.toFile('1.jpeg');
    }

    const baseImageBuffer = await baseImage.toBuffer();
    const { width, height } = await sharp(baseImageBuffer).metadata();

    // console.log(`📏 Kích thước ảnh: ${width} x ${height}`);
    const cellWidth = Math.floor((width - (COLS - 1) * GAP) / COLS);
    const cellHeight = Math.floor((height - (ROWS - 1) * GAP) / ROWS);
    // console.log(`📦 Kích thước mỗi ô: ${cellWidth} x ${cellHeight}`);

    const results = [];

    for (let row = 0; row < ROWS; row++) {
        const rowTasks = [];

        for (let col = 0; col < COLS; col++) {
            if (row === SKIP_CELL.row && col === SKIP_CELL.col) {
                rowTasks.push(Promise.resolve('✔'));
                continue;
            }

            const left = col * (cellWidth + GAP);
            const top = row * (cellHeight + GAP);

            if (left + cellWidth > width || top + cellHeight > height) {
                console.warn(`⚠️ Bỏ ô (${row}, ${col}) vì vượt ảnh.`);
                rowTasks.push(Promise.resolve('?'));
                continue;
            }

            const task = (async () => {
                try {
                    const cellImageBuffer = await sharp(baseImageBuffer)
                        .extract({ left, top, width: cellWidth, height: cellHeight })
                        .resize(80, 80)
                        .blur(0.8)
                        .grayscale()
                        .threshold(231)
                        // .threshold()
                        .toBuffer();
                    const { data: { text } } = await Tesseract.recognize(cellImageBuffer, 'eng', {
                        tessedit_char_whitelist: '0123456789'
                    });

                    return (text.match(/\d+/) || ['?'])[0];
                } catch (err) {
                    console.error(`❌ Lỗi xử lý ô (${row}, ${col}):`, err.message);
                    return '?';
                }
            })();

            rowTasks.push(task);
        }

        const rowData = await Promise.all(rowTasks);
        results.push(rowData);
    }

    // console.log('\n📋 Kết quả nhận diện dạng bảng:');
    // results.forEach(row => console.log(row.map(x => x.toString().padStart(2, ' ')).join(' ')));

    const flatResults = results.flat();

    const mappedResults = flatResults.map((num, index) => ({
        number: num,
        pos: left ? positions[index] || null : positions2[index] || null
    }));

    // console.log('\n📦 Mảng đối tượng (number + pos):');
    // console.log(mappedResults);

    return mappedResults;
}



export async function extractNumbersFromImage(buffer, imageOptions, captureImg = false) {
    try {
        let baseImage = sharp(buffer)
            .grayscale()
            .threshold(150)
            .sharpen();

        if (imageOptions) {
            baseImage = baseImage.extract(imageOptions).resize(110, 90);
            if (captureImg) await baseImage.toFile('processed.jpeg');
        }

        const baseImageBuffer = await baseImage.toBuffer();

        const { data: { text } } = await Tesseract.recognize(baseImageBuffer, 'eng');

        const match = text.match(/\d+/g);
        return match ? match[0] : null;
    } catch (error) {
        console.error('OCR lỗi:', error);
        return null;
    }
}

// (async () => {
//     let a = await extractNumbersFromImage('1.jpeg',
//         { left: 230, top: 240, width: 40, height: 30 },
//     )
//     console.log(a);
// })()







