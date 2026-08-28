"""
=====================================================================
 CHUONG TRINH DONG BO CHUOT + BAN PHIM TUYET DOI CHO 4 PC (1 MASTER - 3 SLAVE)
=====================================================================

Y TUONG:
- 1 may MASTER co chuot/ban phim vat ly that.
- 3 may SLAVE khong dung input vat ly, chi nhan lenh tu Master va
  mo phong lai y het (chuot di den dung ti le x,y, phim bam/nha dung luc).
- Toa do chuot duoc gui theo TY LE (0.0 -> 1.0) chu khong phai pixel
  tuyet doi, vi 4 man hinh co the khac do phan giai.

YEU CAU:
  pip install pywin32
  Chi chay duoc tren Windows (dung win32api / win32con).

CACH DUNG:
  1) Tren may MASTER:
       - Sua ROLE = "MASTER"
       - Khong can sua MASTER_IP (Master tu lang nghe tren moi IP)
       - Chay: python mouse_kvm_sync.py
  2) Tren moi may SLAVE (lam voi ca 3 may con lai):
       - Sua ROLE = "SLAVE"
       - Sua MASTER_IP = "<IP LAN cua may Master>", vi du "192.168.1.10"
       - Chay: python mouse_kvm_sync.py

  Luu y: nen chay Master TRUOC, roi moi chay cac Slave.
  Neu mat ket noi, Slave se tu dong thu ket noi lai moi 2 giay.

GIOI HAN (co the nang cap sau neu can):
  - Ban phim/chuot vat ly tren cac may Slave van hoat dong song song
    (chuong trinh nay khong khoa input local cua Slave).
  - Mot so ung dung chay quyen Administrator tren Slave co the khong
    nhan duoc input mo phong tu mot script chay quyen thuong (do UAC).
    Neu gap truong hop nay, chay script Slave voi quyen Administrator.
=====================================================================
"""

import socket
import threading
import time
import sys

import win32api
import win32con

# ========================= CAU HINH =========================
ROLE = "MASTER"  # "MASTER" hoac "SLAVE" -> DOI O DAY
PORT = 5555

MASTER_BIND_IP = "0.0.0.0"  # Master: lang nghe tren tat ca network interface
MASTER_IP = "192.168.1.35"  # Slave: dien IP LAN cua may Master vao day

MOUSE_POLL_INTERVAL = 0.005  # ~200 Hz - do chuot muot
KEY_POLL_INTERVAL = 0.01  # ~100 Hz - quet trang thai phim
# ==============================================================

# Cac ma VK (virtual key) cua nut chuot -> Slave se xu ly bang mouse_event
# thay vi keybd_event
VK_MOUSE_BUTTONS = {
    0x01: "LEFT",
    0x02: "RIGHT",
    0x04: "MIDDLE",
}


def get_screen_size():
    w = win32api.GetSystemMetrics(0)
    h = win32api.GetSystemMetrics(1)
    return w, h


# ===================================================================
#                              MASTER
# ===================================================================
class MasterServer:
    def __init__(self):
        self.clients = []
        self.clients_lock = threading.Lock()
        self.running = True
        self.screen_w, self.screen_h = get_screen_size()
        self.last_pos = None
        self.key_states = {}

    def start(self):
        server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_sock.bind((MASTER_BIND_IP, PORT))
        server_sock.listen(8)
        print(f"[MASTER] Dang lang nghe tren cong {PORT}. " f"Do phan giai man hinh Master: {self.screen_w}x{self.screen_h}")

        threading.Thread(target=self.accept_loop, args=(server_sock,), daemon=True).start()
        threading.Thread(target=self.mouse_loop, daemon=True).start()
        threading.Thread(target=self.key_loop, daemon=True).start()

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("[MASTER] Dang dung chuong trinh...")
            self.running = False
            server_sock.close()

    def accept_loop(self, server_sock):
        while self.running:
            try:
                conn, addr = server_sock.accept()
                conn.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                with self.clients_lock:
                    self.clients.append(conn)
                print(f"[MASTER] Slave da ket noi: {addr}")
            except OSError:
                break

    def broadcast(self, message: str):
        """Gui song song toi tat ca Slave dang ket noi."""
        data = (message + "\n").encode("utf-8")
        dead = []
        with self.clients_lock:
            for c in self.clients:
                try:
                    c.sendall(data)
                except OSError:
                    dead.append(c)
            for d in dead:
                self.clients.remove(d)
                try:
                    d.close()
                except OSError:
                    pass

    def mouse_loop(self):
        while self.running:
            x, y = win32api.GetCursorPos()
            if (x, y) != self.last_pos:
                self.last_pos = (x, y)
                rx = x / self.screen_w
                ry = y / self.screen_h
                self.broadcast(f"MOVE {rx:.6f} {ry:.6f}")
            time.sleep(MOUSE_POLL_INTERVAL)

    def key_loop(self):
        # Quet toan bo ma phim ao 1..254 (bao gom ca nut chuot trai/phai/giua)
        vk_codes = list(range(1, 255))
        for vk in vk_codes:
            self.key_states[vk] = False

        while self.running:
            for vk in vk_codes:
                state = win32api.GetAsyncKeyState(vk)
                is_down = bool(state & 0x8000)
                was_down = self.key_states[vk]
                if is_down and not was_down:
                    self.key_states[vk] = True
                    self.broadcast(f"KEYDOWN {vk}")
                elif not is_down and was_down:
                    self.key_states[vk] = False
                    self.broadcast(f"KEYUP {vk}")
            time.sleep(KEY_POLL_INTERVAL)


# ===================================================================
#                              SLAVE
# ===================================================================
class SlaveClient:
    def __init__(self):
        self.screen_w, self.screen_h = get_screen_size()

    def start(self):
        while True:
            try:
                self.connect_and_run()
            except (ConnectionRefusedError, ConnectionResetError, OSError) as e:
                print(f"[SLAVE] Mat ket noi ({e}). Thu lai sau 2 giay...")
                time.sleep(2)

    def connect_and_run(self):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.connect((MASTER_IP, PORT))
        sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        print(f"[SLAVE] Da ket noi toi Master {MASTER_IP}:{PORT}. " f"Do phan giai man hinh: {self.screen_w}x{self.screen_h}")

        buffer = ""
        while True:
            data = sock.recv(4096)
            if not data:
                raise ConnectionResetError("Master da dong ket noi")
            buffer += data.decode("utf-8", errors="ignore")
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                self.handle_line(line.strip())

    def handle_line(self, line: str):
        if not line:
            return
        parts = line.split(" ")
        cmd = parts[0]

        if cmd == "MOVE":
            rx, ry = float(parts[1]), float(parts[2])
            x = int(rx * self.screen_w)
            y = int(ry * self.screen_h)
            win32api.SetCursorPos((x, y))

        elif cmd == "KEYDOWN":
            self.apply_key(int(parts[1]), down=True)

        elif cmd == "KEYUP":
            self.apply_key(int(parts[1]), down=False)

    def apply_key(self, vk: int, down: bool):
        if vk in VK_MOUSE_BUTTONS:
            self.apply_mouse_button(vk, down)
        else:
            flags = 0 if down else win32con.KEYEVENTF_KEYUP
            win32api.keybd_event(vk, 0, flags, 0)

    def apply_mouse_button(self, vk: int, down: bool):
        if vk == 0x01:  # LEFT
            flag = win32con.MOUSEEVENTF_LEFTDOWN if down else win32con.MOUSEEVENTF_LEFTUP
        elif vk == 0x02:  # RIGHT
            flag = win32con.MOUSEEVENTF_RIGHTDOWN if down else win32con.MOUSEEVENTF_RIGHTUP
        elif vk == 0x04:  # MIDDLE
            flag = win32con.MOUSEEVENTF_MIDDLEDOWN if down else win32con.MOUSEEVENTF_MIDDLEUP
        else:
            return
        win32api.mouse_event(flag, 0, 0, 0, 0)


# ===================================================================
#                               MAIN
# ===================================================================
if __name__ == "__main__":
    if ROLE == "MASTER":
        MasterServer().start()
    elif ROLE == "SLAVE":
        SlaveClient().start()
    else:
        print("ROLE khong hop le. Dat ROLE = 'MASTER' hoac 'SLAVE' o dau file.")
        sys.exit(1)
