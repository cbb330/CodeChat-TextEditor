#
#   Hello World server in Python
#   Binds REP socket via IPaddress:port to be assigned
#   Expects message from log.txt file and returns a codechat preview command
#

import time
import zmq

#configure ZMQ
context = zmq.Context()
socket = context.socket(zmq.REP)
socket.bind("tcp://192.168.0.105:50701")

#Process
while True:
    #  Wait for next request from client
    message = socket.recv()
    print("Received request: %s" % message.decode())

    #  Do some 'work'
    message.decode()
    message += '<-SERVER RETURNED'.encode()

    #  Send reply back to client
    socket.send(message)
