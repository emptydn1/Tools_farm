import sys
import json
import numpy as np
import cv2
from paddleocr import PaddleOCR

# khác ocr_worker.py ở chỗ là nó tạo tiến trình xử lý ảnh theo loop, con orc_worker.py thì nó tạo OCR call bao nhiêu ảnh gửi qua nó đều chạy lại file này và task vụ nó nặng lên

ocr = PaddleOCR(
    use_angle_cls=False,
    lang="en",
    use_gpu=True,
    show_log=False,
)

dummy = np.ones((30, 550, 3), dtype=np.uint8) * 255
ocr.ocr(dummy, cls=False)
sys.stdout.write("ready\n")
sys.stdout.flush()


def decode_image(raw_bytes):
    np_arr = np.frombuffer(raw_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)


def process_batch(images):
    batch_texts = []
    for img in images:
        result = ocr.ocr(img, cls=False)  # gọi từng ảnh, KHÔNG dùng list
        texts = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0].replace("\n", " ").replace("\r", "").strip()
                score = round(line[1][1], 2)
                texts.append({"text": text, "score": score})
        batch_texts.append(texts)
    return batch_texts


while True:
    try:
        count_bytes = sys.stdin.buffer.read(4)
        if not count_bytes or len(count_bytes) < 4:
            break
        count = int.from_bytes(count_bytes, byteorder="big")

        images = []
        for _ in range(count):
            size_bytes = sys.stdin.buffer.read(4)
            if not size_bytes or len(size_bytes) < 4:
                break
            size = int.from_bytes(size_bytes, byteorder="big")
            img_bytes = sys.stdin.buffer.read(size)
            img = decode_image(img_bytes)
            if img is not None:
                images.append(img)

        if not images:
            sys.stdout.write(json.dumps([]) + "\n")
            sys.stdout.flush()
            continue

        results = process_batch(images)

        # double-check JSON hợp lệ trước khi gửi
        output = json.dumps(results, ensure_ascii=True) + "\n"
        sys.stdout.write(output)
        sys.stdout.flush()

    except Exception as e:
        # trả về array rỗng thay vì crash
        sys.stdout.write(json.dumps([]) + "\n")
        sys.stdout.flush()
