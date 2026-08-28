import keyboard
import sys

if len(sys.argv) > 1:
    key_to_wait = sys.argv[1]
else:
    key_to_wait = "\\"  # Mặc định nếu không có tham số

keyboard.wait(key_to_wait)
