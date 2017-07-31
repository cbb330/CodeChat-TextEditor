import os
import socket
import sys
import json
import sublime
import sublime_plugin


class MyEventListener(sublime_plugin.ViewEventListener):
	def __init__(self, view):
		super().__init__(view)

		self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		self.sock.connect(('192.168.0.105', 50646))

		self.msg = {
			"cmd": "init",
			"data": [self.view.file_name(), self.view.substr(sublime.Region(0, self.view.size()))] 
		}

		self.sock.send(json.dumps(self.msg).encode())
		#recv = sock.recv(100000)

	def on_activated(self):

		print('switched')
		self.msg = {
			"cmd": "init",
			"data": [self.view.file_name(), self.view.substr(sublime.Region(0, self.view.size()))] 
		}

		self.sock.send(json.dumps(self.msg).encode())
		#recv = sock.recv(100000)
