import keyboard
import pyautogui
import time


def trigger_switch(direction):
    # Bước 1: Gửi Ctrl + Alt + Home để gọi thanh Connection Bar của RDP
    # Nhấn giữ và nhả chuẩn xác để RDP nhả quyền điều khiển
    pyautogui.keyDown("ctrl")
    pyautogui.keyDown("alt")
    pyautogui.press("home")
    pyautogui.keyUp("alt")
    pyautogui.keyUp("ctrl")

    # Đợi 0.15 giây để máy A chắc chắn đã giành lại quyền Focus
    time.sleep(0.15)

    # Bước 2: Gửi lệnh chuyển Desktop tương ứng
    if direction == "left":
        pyautogui.hotkey("ctrl", "win", "left")
    elif direction == "right":
        pyautogui.hotkey("ctrl", "win", "right")


def go_left(e):
    if e.event_type == keyboard.KEY_DOWN:
        trigger_switch("left")


def go_right(e):
    if e.event_type == keyboard.KEY_DOWN:
        trigger_switch("right")


print("Script đang chạy ngầm...")
print("-> Bấm [Num Lock] để chuyển sang Desktop BÊN TRÁI")
print("-> Bấm [Page Down] để chuyển sang Desktop BÊN PHẢI")

# Đăng ký chính xác mỗi phím một chức năng riêng biệt
keyboard.hook_key("num lock", go_left)
keyboard.hook_key("/", go_right)

keyboard.wait()
