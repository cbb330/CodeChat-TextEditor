import socket
TCP_IP = '172.17.153.75'
TCP_PORT = 50646
BUFFER_SIZE = 20  # Normally 1024, but we want fast response

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.bind((TCP_IP, TCP_PORT))
s.listen(1)



def main():
    conn, addr = s.accept()
    print('Connection address:', addr)
    while 1:
        data = conn.recv(BUFFER_SIZE)
        if not data:
            print("user exited")
            break
        print(data.decode('utf-8'))
        conn.send("Goodbye World!".encode())  # echo
    conn.close()
    


while 1:
    main()
