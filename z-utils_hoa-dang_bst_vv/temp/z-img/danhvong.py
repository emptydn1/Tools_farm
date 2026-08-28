import subprocess
import keyboard
import pyautogui
import threading
import time
import win32gui

devices1 = {
    "clone-1": 16448,
    # "clone-2": 16480,
    # "clone-3": 16512,
    # "clone-4": 16544,
    # "clone-5": 16576,
    # "clone-6": 16608,
    # "clone-7": 16640,
    # "clone-8": 16672,
}

devices2 = {
    # "clone-9": 16704,
    # "clone-10": 16736,
    # "clone-11": 16768,
    # "clone-12": 16800,
    # "clone-13": 16832,
    # "clone-14": 16864,
    # "clone-15": 16896,
    # "clone-16": 16928,
}


# mặc định dùng group 1
devices = devices1

merge_devices = {**devices1, **devices2}

clicking = False
shells = {}
active_title = ""

# connect adb
for port in list(devices1.values()) + list(devices2.values()):
    subprocess.run(["adb", "connect", f"127.0.0.1:{port}"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# open persistent adb shell
for name, port in {**devices1, **devices2}.items():
    shells[port] = subprocess.Popen(["adb", "-s", f"127.0.0.1:{port}", "shell"], stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, text=True, bufsize=1)


def tap(port, x, y):
    shells[port].stdin.write(f"input tap {x} {y}\n")
    shells[port].stdin.flush()


def input_text(port, text):
    try:
        shells[port].stdin.write(f'input text "{text}"\n')
        shells[port].stdin.flush()
    except:
        pass


######################################################################
######################################################################
######################################################################


def tap_all_devices(x, y):
    for port in devices.values():
        threading.Thread(target=tap, args=(port, x, y), daemon=True).start()


def tap_all():
    tap_all_devices(826, 459)


def tap_ask():
    tap_all_devices(305, 290)


def tap_go_task():
    tap_all_devices(102, 198)


def cancel_task():
    tap_all_devices(323, 100)


def tap_points(points, delay=0.3, devices_dict=None):
    if devices_dict is None:
        devices_dict = devices

    for x, y in points:
        threads = []

        for port in devices_dict.values():
            t = threading.Thread(target=tap, args=(port, x, y))
            t.start()
            threads.append(t)

        for t in threads:
            t.join()

        time.sleep(delay)


def tap_taysonthon():
    pointsTaySonThon = [(801, 300), (157, 335), (175, 380), (175, 380)]
    tap_points(pointsTaySonThon)


def tap_tuongduongtay():
    pointsTuongDuongTay = [(801, 300), (157, 335), (157, 335), (162, 420), (162, 380)]
    tap_points(pointsTuongDuongTay)


def tap_blh():
    pointsBlh = [(801, 300), (157, 335), (175, 380), (175, 287)]
    tap_points(pointsBlh)


def hangngay():
    pointsHn = [(43, 155), (185, 103), (185, 328), (185, 254)]
    tap_points(pointsHn)


def addTeam():
    pointsTeam = [(146, 157), (146, 157), (412, 458), (694, 116)]
    tap_points(pointsTeam)


def logOut():
    pointsLogOut = [(946, 257), (946, 337), (153, 115), (800, 250)]
    tap_points(pointsLogOut, 0.5, merge_devices)


def tangDiem():
    points = [(60, 60), (455, 440), (683, 172)]

    tap_points(points, 0.3, merge_devices)

    def tang_diem_device(port):
        input_text(port, "9999")
        time.sleep(0.3)
        tap(port, 710, 420)
        time.sleep(0.3)
        tap(port, 870, 95)

    threads = []

    for port in merge_devices.values():
        t = threading.Thread(target=tang_diem_device, args=(port,))
        t.start()
        threads.append(t)

    for t in threads:
        t.join()


def phimtat_phu():
    points = [(890, 263), (670, 143), (698, 439), (680, 236), (924, 209), (924, 209), (869, 95)]
    tap_points(points, 0.3, merge_devices)


def sudung_banh():
    points = [(890, 263), (721, 140), (696, 345), (869, 95)]
    tap_points(points, 0.3, merge_devices)


######################################################################
######################################################################
######################################################################


def switch_devices():
    global devices

    if devices == devices1:
        devices = devices2
        print("Switched to clone 9-16")
        print(" 2222 ")
        print("2    2")
        print("     2")
        print("   22 ")
        print("  2   ")
        print(" 2    ")
        print("222222")
    else:
        devices = devices1
        print("Switched to clone 1-8")
        print("  *  ")
        print(" **  ")
        print("  *  ")
        print("  *  ")
        print("  *  ")
        print("  *  ")
        print("*****")


keyboard.add_hotkey("z", tap_taysonthon)
keyboard.add_hotkey("q", tap_blh)
keyboard.add_hotkey("d", tap_tuongduongtay)

keyboard.add_hotkey("e", cancel_task)

keyboard.add_hotkey("a", tap_ask)
keyboard.add_hotkey("s", tap_go_task)

keyboard.add_hotkey("v", hangngay)
keyboard.add_hotkey("c", tap_all)

keyboard.add_hotkey("w", addTeam)

keyboard.add_hotkey("n", tangDiem)
keyboard.add_hotkey("m", phimtat_phu)
keyboard.add_hotkey(",", sudung_banh)

keyboard.add_hotkey("o", logOut)

# chuyển nhóm clone
keyboard.add_hotkey("g", switch_devices)

print("z - tay son thon")
print("q - ba lang huyen")
print("d - tuong duong tay")

print("e - huy nhiem vu cau ca")

print("v - mo nhiem vu hang ngay")
print("c - chay nhiem vu hang ngay")
print("w - them dong doi vao team")
print("n - tang diem suc manh")
print("o - thoat acc")

keyboard.wait()
