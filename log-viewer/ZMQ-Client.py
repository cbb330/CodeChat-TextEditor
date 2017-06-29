#
#   ZMQ client in Python
#   Connects REQ socket via IP address:port to be assigned
#   Sends last line appended to LOG.txt and recieves confirmation from server
#

import zmq
import os

#   ZMQ Configuration
context = zmq.Context()
socket = context.socket(zmq.REQ)
socket.connect("tcp://192.168.0.105:50701")

#   Opens file metadata to retrieve modified time
props = os.stat('C:/Users/jbetb/.atom/packages/log-viewer/LOG.txt')
this = props.st_mtime
last = this

#   Process
while 1:
    file = open('C:/Users/jbetb/.atom/packages/log-viewer/LOG.txt')

    #   If the new modified time is greater than the last modified time
    if this > last:
        last = this

        #   Get last line of file
        last_line = file.readlines()[-1]
        last_line = last_line.strip('\n').strip(' ')

        #   Checking for exit code to close program
        if last_line == '~!@#$%^&*(())(*&^%$#@!#$%^&*(&^%$#@!#$%^))':
            break

        #   Send last line to server via ZMQ
        socket.send_string(last_line)
        print(last_line)
        message = socket.recv()
        print("Got it: %s" % message.decode())

    #   Re-initialize metadata for next loop
    props = os.stat('C:/Users/jbetb/.atom/packages/log-viewer/LOG.txt')      
    this = props.st_mtime
    file.close()
    
