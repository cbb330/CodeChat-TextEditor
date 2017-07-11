#Python Server for recieving JSON objects
#Created by Christian Bush on 7/11/2017



import socket
import json


def main():
    #initialize TCP connection
    TCP_IP = '192.168.0.102'
    TCP_PORT = 50646
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind((TCP_IP, TCP_PORT))
    s.listen(1)
    print("listening") #Program waits here until client connects
    conn, addr = s.accept()
    print('Connection address:', addr)
    count = 0

    #lookp for multiple client entries
    while 1:
        try:
            #recieve data up to 5000 bytes, decode and split dictionary and content
            dataCommand = conn.recv(5000)
            dataCommand = dataCommand.decode()
            #using client specified split point
            dataCommand = dataCommand.split('!@#$%^&*()')
            print(dataCommand)
            print('\n\nSending client message:\n')
            #create JSON object and then send back to client
            thisDict = json.loads(dataCommand[0])
            print(thisDict)
            conn.send(json.dumps(thisDict).encode())
            print(count)
            print('--------------------------------------------------\n\n\n\n\n\n\n')
            count += 1
        #catch when client exits code 
        except ConnectionAbortedError:
            print("client closed")
            conn.close()
            break


while 1:
    print("Program beginning")
    main()
