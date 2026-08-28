import cv from '@u4/opencv4nodejs';
import fs from 'fs';

function groupRectangles(rects, threshold = 0.5) {
    // Tính diện tích giao nhau trên tổng hợp nhất
    function computeIoU(rect1, rect2) {
        const x1 = Math.max(rect1.x, rect2.x);
        const y1 = Math.max(rect1.y, rect2.y);
        const x2 = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
        const y2 = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

        const interWidth = Math.max(0, x2 - x1);
        const interHeight = Math.max(0, y2 - y1);
        const intersection = interWidth * interHeight;

        const area1 = rect1.width * rect1.height;
        const area2 = rect2.width * rect2.height;

        const union = area1 + area2 - intersection;

        if (union <= 0 || intersection <= 0) {
            return 0;
        }

        return intersection / union;
    }

    // Union-Find (Disjoint Set)
    const parent = Array.from(rects, (_, i) => i);

    function find(x) {
        if (parent[x] !== x) parent[x] = find(parent[x]);
        return parent[x];
    }

    function union(x, y) {
        const rootX = find(x);
        const rootY = find(y);
        if (rootX !== rootY) parent[rootY] = rootX;
    }

    // So sánh tất cả các hình chữ nhật
    for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
            if (computeIoU(rects[i], rects[j]) > threshold) {
                union(i, j);
            }
        }
    }

    // Nhóm các hình chữ nhật
    const groups = {};
    for (let i = 0; i < rects.length; i++) {
        const root = find(i);
        if (!groups[root]) groups[root] = [];
        groups[root].push(rects[i]);
    }

    // Hợp nhất các nhóm
    const groupedRects = Object.values(groups).map((group) => {
        const merged = group.reduce(
            (acc, rect) => ({
                x: acc.x + rect.x,
                y: acc.y + rect.y,
                width: acc.width + rect.width,
                height: acc.height + rect.height,
            }),
            { x: 0, y: 0, width: 0, height: 0 }
        );

        const count = group.length;
        return {
            x: Math.round(merged.x / count),
            y: Math.round(merged.y / count),
            width: Math.round(merged.width / count),
            height: Math.round(merged.height / count),
        };
    });

    return groupedRects;
}

export const findMatchingRegions = async ({
    client,
    templateImages = [],
    matchThreshold = 0.8,
    imageOptions = { format: 'jpeg', imageQuality: 80 },
    scale = 1,
    drawType = null,
}) => {
    const screenshot = await client.Page.captureScreenshot(imageOptions);
    const screenshotBuffer = Buffer.from(screenshot.data, 'base64');
    const screenshotMat = cv.imdecode(screenshotBuffer).bgrToGray();

    let matchedPoints = [];

    for (const e of templateImages) {
        // phải lấy ảnh mẫu k bị scale
        let templateMat = cv.imread(e).bgrToGray();

        // scale ảnh mẫu
        if (scale !== 1) {
            templateMat = templateMat.resize(new cv.Size(
                Math.round(templateMat.cols * scale),
                Math.round(templateMat.rows * scale)
            ));
        }

        const { cols: templateWidth, rows: templateHeight } = templateMat;
        const matchResult = screenshotMat.matchTemplate(templateMat, cv.TM_CCOEFF_NORMED);
        const thresholdedResult = matchResult.threshold(matchThreshold, 1, cv.THRESH_BINARY).findNonZero();

        if (thresholdedResult.length === 0) {
            // console.log(`Không tìm thấy ảnh mẫu: ${e}`);
            continue;
        }

        const rectangles = thresholdedResult.map(point => new cv.Rect(point.x, point.y, templateWidth, templateHeight));
        const groupedRectangles = groupRectangles(rectangles);

        if (drawType === 'drawLine') {
            groupedRectangles.forEach(rect => {
                const centerX = rect.x + (rect.width / 2);
                const centerY = rect.y + (rect.height / 2);

                let size = 10;
                screenshotMat.drawLine(
                    new cv.Point(centerX - size, centerY - size), // Điểm đầu của đường chéo thứ nhất
                    new cv.Point(centerX + size, centerY + size), // Điểm cuối của đường chéo thứ nhất
                    new cv.Vec(0, 0, 0), // Màu đen
                    2, // Độ dày của đường
                );

                screenshotMat.drawLine(
                    new cv.Point(centerX - size, centerY + size), // Điểm đầu của đường chéo thứ hai
                    new cv.Point(centerX + size, centerY - size), // Điểm cuối của đường chéo thứ hai
                    new cv.Vec(0, 0, 0), // Màu đen
                    2, // Độ dày của đường
                );
            });

            cv.imshow('Matched Result', screenshotMat);
            cv.waitKey();
        } else if (drawType === 'rectangle') {
            groupedRectangles.forEach(rect => {
                screenshotMat.drawRectangle(
                    new cv.Point(rect.x, rect.y),
                    new cv.Point(rect.x + rect.width, rect.y + rect.height),
                    new cv.Vec(0, 0, 0), // Màu đỏ
                    2, // Độ dày đường viền
                );
            });

            cv.imshow('Matched Result', screenshotMat);
            cv.waitKey();
        }
        // convert to center points
        const centerPoints = groupedRectangles.map(rect => ({
            x: (rect.x + (rect.width / 2)) / scale,
            y: (rect.y + (rect.height / 2)) / scale,
            mathImagePath: e,
        }));

        matchedPoints.push(...centerPoints);
    }

    return { screenshotMat, matchedPoints, screenshotBuffer };
}



export const findMatchingRegionsAndroids = async ({
    buffer,
    templateImages = [],
    matchThreshold = 0.8,
    drawType = null,
}) => {
    const screenshotMat = cv.imdecode(buffer).bgrToGray();
    let matchedPoints = [];

    for (const e of templateImages) {
        // phải lấy ảnh mẫu k bị scale
        let templateMat = cv.imread(e).bgrToGray();



        const { cols: templateWidth, rows: templateHeight } = templateMat;
        const matchResult = screenshotMat.matchTemplate(templateMat, cv.TM_CCOEFF_NORMED);
        const thresholdedResult = matchResult.threshold(matchThreshold, 1, cv.THRESH_BINARY).findNonZero();

        if (thresholdedResult.length === 0) {
            // console.log(`Không tìm thấy ảnh mẫu: ${e}`);
            continue;
        }

        const rectangles = thresholdedResult.map(point => new cv.Rect(point.x, point.y, templateWidth, templateHeight));
        const groupedRectangles = groupRectangles(rectangles);

        if (drawType === 'drawLine') {
            groupedRectangles.forEach(rect => {
                const centerX = rect.x + (rect.width / 2);
                const centerY = rect.y + (rect.height / 2);

                let size = 10;
                screenshotMat.drawLine(
                    new cv.Point(centerX - size, centerY - size), // Điểm đầu của đường chéo thứ nhất
                    new cv.Point(centerX + size, centerY + size), // Điểm cuối của đường chéo thứ nhất
                    new cv.Vec(0, 0, 0), // Màu đen
                    2, // Độ dày của đường
                );

                screenshotMat.drawLine(
                    new cv.Point(centerX - size, centerY + size), // Điểm đầu của đường chéo thứ hai
                    new cv.Point(centerX + size, centerY - size), // Điểm cuối của đường chéo thứ hai
                    new cv.Vec(0, 0, 0), // Màu đen
                    2, // Độ dày của đường
                );
            });

            cv.imshow('Matched Result', screenshotMat);
            cv.waitKey();
        } else if (drawType === 'rectangle') {
            groupedRectangles.forEach(rect => {
                screenshotMat.drawRectangle(
                    new cv.Point(rect.x, rect.y),
                    new cv.Point(rect.x + rect.width, rect.y + rect.height),
                    new cv.Vec(0, 0, 0), // Màu đỏ
                    2, // Độ dày đường viền
                );
            });

            cv.imshow('Matched Result', screenshotMat);
            cv.waitKey();
        }
        // convert to center points
        const centerPoints = groupedRectangles.map(rect => ({
            x: (rect.x + (rect.width / 2)),
            y: (rect.y + (rect.height / 2)),
            mathImagePath: e,
        }));

        matchedPoints.push(...centerPoints);
    }

    return { screenshotMat, matchedPoints, buffer };
}


export const monitorFPSAndCapture = async ({
    client,
    imageOptions = { format: 'jpeg', quality: 80 },
    captureImg = false,
    sleep = 0,
}) => {
    let lastTime = Date.now();

    async function captureLoop() {
        while (true) {
            const currentTime = Date.now();
            const screenshot = await client.Page.captureScreenshot(imageOptions);

            if (captureImg) {
                const buffer = Buffer.from(screenshot.data, 'base64');
                fs.writeFileSync(`./1.jpeg`, buffer, 'utf-8');
            }

            const elapsedTime = currentTime - lastTime;
            const fps = (1000 / elapsedTime).toFixed(2); // FPS = 1000ms / thời gian 1 frame

            console.log(`FPS: ${fps}`);

            lastTime = currentTime;
            await new Promise((resolve) => setTimeout(resolve, sleep));
        }
    }

    await captureLoop();
}