#
#   Hello World client in Python
#   Connects REQ socket to tcp://localhost:5555
#   Sends "Hello" to server, expects "World" back
#

import zmq
import os

context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect("tcp://192.168.0.105:51816")

props = os.stat('test.txt')
this = props.st_mtime
last = this

while 1:
    file = open('test.txt')
    if this > last:
        last = this
         
        last_line = file.readlines()[-1]
        last_line = last_line.strip('\n').strip(' ')
        
        socket.send_string(last_line)
        print(last_line)
        message = socket.recv()
        print("Got it: %s" % message.decode())

    props = os.stat('test.txt')      
    this = props.st_mtime
    file.close()
    
