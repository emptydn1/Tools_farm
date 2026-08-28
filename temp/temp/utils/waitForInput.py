import keyboard
import sys
# import subprocess


if len(sys.argv) > 1:
    key_to_wait = sys.argv[1]
else:
    key_to_wait = "\\"  # Mặc định nếu không có tham số

keyboard.wait(key_to_wait)

# subprocess.run(["taskkill", "/im", "chrome.exe", "/f"], shell=True)
