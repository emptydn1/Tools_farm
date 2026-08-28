import sys
import json
import numpy as np
import cv2
from paddleocr import PaddleOCR

ocr = PaddleOCR(
    use_angle_cls=False,
    lang="en",
    use_gpu=True,
    show_log=False,
)


# Warmup model trước khi nhận ảnh thật
dummy = np.ones((30, 550, 3), dtype=np.uint8) * 255
ocr.ocr(dummy, cls=False)
sys.stdout.write("ready\n")
sys.stdout.flush()


def process_image(raw_bytes):
    np_arr = np.frombuffer(raw_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    result = ocr.ocr(img, cls=False)
    texts = []
    if result and result[0]:
        for line in result[0]:
            texts.append({"text": line[1][0], "score": round(line[1][1], 2)})
    return texts


while True:
    try:
        size_bytes = sys.stdin.buffer.read(4)
        if not size_bytes:
            break
        size = int.from_bytes(size_bytes, byteorder="big")
        img_bytes = sys.stdin.buffer.read(size)
        texts = process_image(img_bytes)
        output = json.dumps(texts, ensure_ascii=False) + "\n"
        sys.stdout.write(output)
        sys.stdout.flush()
    except Exception as e:
        error = json.dumps({"error": str(e)}) + "\n"
        sys.stdout.write(error)
        sys.stdout.flush()