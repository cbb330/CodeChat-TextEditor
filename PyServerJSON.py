# ..
#     Python Server for recieving JSON objects
#     Created by Christian Bush on 7/12/2017, including functions by Enki and Dr. Bryan A. Jones
#     Server to handle Atom/Sublime text edits to Markdown, ReST, CodeChat files
#
# ***************************************************************
# PyServerJson.py - invokes CodeChat after recieiving JSON object
# ***************************************************************
#
#
# Local imports
# -------------
import socket
import json
import threading
import os.path
import io
import re
import shutil
import html
import sys
import shlex
import codecs
from queue import Queue
#
# Third-party imports
# -------------------
# `PyQt <http://pyqt.sourceforge.net/Docs/PyQt4/classes.html>`_ is the GUI used by legacy software Enki, still tied to CodeChat
from PyQt5.QtCore import (pyqtSignal, Qt, QThread, QTimer, QUrl,
                          QEventLoop, QObject)
from PyQt5.QtWidgets import QFileDialog, QMessageBox, QWidget
from PyQt5.QtGui import QDesktopServices, QIcon, QPalette, QWheelEvent
from PyQt5.QtWebEngineWidgets import QWebEnginePage, QWebEngineView
from PyQt5 import uic
import sip
#
# Attempt importing CodeChat; failing that, disable the CodeChat
# feature.
try:
    # Needed to access CodeChat.__file__; not importing this, but using the
    # other CodeChat.* imports below, doesn't define this.
    import CodeChat
except ImportError:
    CodeChat = None
    CodeToRest = None
else:
    import CodeChat.CodeToRest as CodeToRest

# Multi-Thread Server class
# -------------------------
#
class ThreadedServer(object):
    def __init__(self, host, port, mode):
        self.host = host
        self.port = port
        self.saveMode = mode
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind((self.host, self.port))
        self.count = 0
        self.address = None
    # function to listen for new clients to start a thread
    def listen(self):
        self.sock.listen(5)
        while True:
            print("Client connecting...")
            client, self.address = self.sock.accept()
            self.count = 0
            #client.settimeout(120)
            threading.Thread(target=self.listenToClient, args=(client, self.address)).start()
    # function that recieves client input
    def listenToClient(self, client, address):
        # All common markdownExts to be used later
        markdownExts = ['.md', '.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn','.mdtxt', '.mdtext', '.Rmd']
        while 1:
            try:
                # recieve data up to 100000000 bytes, decode and split dictionary and content into the JSON Object
                dataCommand = client.recv(1000000)
                print("Message recieved from: ", self.address)
                dataCommand = dataCommand.decode('utf-8')
                # catch if client exits code or assorted error
                if (dataCommand == ''):
                    print("Client closed")
                    break
                if(self.saveMode):
                    client.send(('0000000001T').encode())
                else:
                    client.send(('0000000001F').encode())
                # create JSON object and then send back to client
                # .. note::
                #     Format for JSON Objects: ['{"cmd": "init", "data": ["C:/Users/jbetb/.atom/packages/log-viewer/CHANGELOG.md", "content", "project folder path"], "cursor": {row:x,column:y}}'
                thisDict = json.loads(dataCommand)
                print("\nClient cursor position: ", thisDict['cursor'])
                print("Client project folder path: ", thisDict['data'][2])
                # in later versions below will be the branch to either send sphinx output or restructured text output
                # 
                # if (boolsphinx == True):
                    # work with thisDict['data'][2] to find project folder path and then call on sphinx to do the rest, allow for changes of buildmode, cursor position, etc.
                # else just send html output...
                actvExt = os.path.splitext(thisDict['data'][0])[1]
                if (actvExt in markdownExts):
                    thisDict['data'][1] = self._convertMarkdown(thisDict['data'][1])
                    client.send(self.htmlMsg(thisDict['data'][1]))
                elif (actvExt == '.rst'):
                    thisDict['data'][1] = self._convertReST(thisDict['data'][1])
                    client.send(self.htmlMsg(thisDict['data'][1][0]))
                    if (thisDict['data'][1][1]):
                        client.send(self.errorMsg(thisDict['data'][1][1]))
                else:
                    thisDict['data'][1] = self._convertCodeChat(thisDict['data'][1], thisDict['data'][0])
                    client.send((self.htmlMsg(thisDict['data'][1][1])))
                    if (thisDict['data'][1][2]):
                        client.send(self.errorMsg(thisDict['data'][1][2]))
                self.count += 1
                print("Client request #", self.count)
                print('--------------------------------------------------\n\n\n\n\n\n\n')
            # catch when client exits code
            except ConnectionResetError or ConnectionAbortedError:
                print("Client closed")
                client.close()
                break

    # Security Function
    #
    def htmlMsg(self, htmlString):
        # I am using `iframe <https://www.w3schools.com/tags/att_iframe_src.asp>`_ tag to secure the html string in a
        # non executable sandbox
        htmlString = htmlString.replace('"', '&quot;')
        htmlString = '<!DOCTYPE html><html><body style="margin:0px;padding:0px;overflow:hidden"><iframe srcdoc="' + htmlString
        htmlString += '" frameborder="0" style="overflow:hidden;overflow-x:hidden;overflow-y:hidden;height:100%;width:100%;position:absolute;top:0px;left:0px;right:0px;bottom:0px" height="100%" width="100%"><p>Your browser does not support iframes.</p></iframe></body></html>'
        # Below I am prepending the message length so the client can recieve correct
        # length of HTML string. Then I am sending the output to the client
        msgLen = len(htmlString)
        msgLen = str(msgLen).join('0000000000'.rsplit(len(str(msgLen))*'0', 1))
        print('HTML conversion secured. Total length: ', msgLen)
        return (msgLen + htmlString).encode()
    # Error string Function
    def errorMsg(self, errorStr):
        msgLen = len(errorStr)
        msgLen = str(msgLen+5).join('0000000000'.rsplit(len(str(msgLen+5))*'0', 1))
        print('Error message sent. Total length: ', msgLen)
        return (msgLen + 'ERROR' + errorStr).encode()

    #
    # Conversion functions - spliced from Enki and Dr. Bryan A. Jones
    # ---------------------------------------------------------------
    #
    def _convertMarkdown(self, text):
        """Convert Markdown to HTML
        """
        try:
            import markdown
        except ImportError:
            return 'Markdown preview requires <i>python-markdown</i> package<br/>' \
                   'Install it with your package manager or see ' \
                   '<a href="http://packages.python.org/Markdown/install.html">installation instructions</a>'

        # version 2.0 supports only extension names, not instances
        #if markdown.version_info[0] > 2 or \
        #   (markdown.version_info[0] == 2 and markdown.version_info[1] > 0):
        #
    ##        DEL_RE = r'(--)(.*?)--'
    ##        INS_RE = r'(__)(.*?)__'
    ##        STRONG_RE = r'(\*\*)(.*?)\*\*'
    ##        EMPH_RE = r'(\/\/)(.*?)\/\/'
    ##
    ##        class MyExtension(markdown.Extension):
    ##            def extendMarkdown(self, md, md_globals):
    ##                del_tag = markdown.inlinepatterns.SimpleTagPattern(DEL_RE, 'del')
    ##                md.inlinepatterns.add('del', del_tag, '>not_strong')
    ##                ins_tag = markdown.inlinepatterns.SimpleTagPattern(INS_RE, 'ins')
    ##                md.inlinepatterns.add('ins', ins_tag, '>del')
    ##                strong_tag = markdown.inlinepatterns.SimpleTagPattern(STRONG_RE, 'strong')
    ##                md.inlinepatterns['strong'] = strong_tag
    ##                emph_tag = markdown.inlinepatterns.SimpleTagPattern(EMPH_RE, 'emphasis')
    ##                md.inlinepatterns['emphasis'] = emph_tag
    ##                del md.inlinepatterns['strong_em']
    ##                del md.inlinepatterns['emphasis2']
    ##
    ##        def makeExtension(configs=None):
    ##            return MyExtension(configs=configs)
    ##
    ##        extensions = makeExtension()

        return markdown.markdown(text) #(text, extensions)


    def _convertReST(self, text):
        try:
            import docutils.core
            import docutils.writers.html4css1
        except ImportError:
            return 'Restructured Text preview requires the <i>python-docutils</i> package.<br/>' \
                   'Install it with your package manager or see ' \
                   '<a href="http://pypi.python.org/pypi/docutils"/>this page.</a>', None

        errStream = io.StringIO()
        docutilsHtmlWriterPath = os.path.abspath(os.path.dirname(
          docutils.writers.html4css1.__file__))
        settingsDict = {
          # Make sure to use Unicode everywhere. This name comes from
          # ``docutils.core.publish_string`` version 0.12, lines 392 and following.
          'output_encoding': 'unicode',
          # While ``unicode`` **should** work for ``input_encoding``, it doesn't if
          # there's an ``.. include`` directive, since this encoding gets passed to
          # ``docutils.io.FileInput.__init__``, in which line 236 of version 0.12
          # tries to pass the ``unicode`` encoding to ``open``, producing:
          #
          # .. code:: python3
          #    :number-lines:
          #
          #    File "...\python-3.4.4\lib\site-packages\docutils\io.py", line 236, in __init__
          #      self.source = open(source_path, mode, **kwargs)
          #    LookupError: unknown encoding: unicode
          #
          # So, use UTF-8 and encode the string first. Ugh.
          'input_encoding': 'utf-8',
          # Don't stop processing, no matter what.
          'halt_level': 5,
          # Capture errors to a string and return it.
          'warning_stream': errStream,
          # On some Windows PC, docutils will complain that it can't find its
          # template or stylesheet. On other Windows PCs with the same setup, it
          # works fine. ??? So, specify a path to both here.
          'template': (
            os.path.join(docutilsHtmlWriterPath,
                         docutils.writers.html4css1.Writer.default_template) ),
          'stylesheet_dirs': (
            docutilsHtmlWriterPath,
            os.path.join(os.path.abspath(os.path.dirname(
              os.path.realpath(__file__))), 'rst_templates')),
          'stylesheet_path': 'default.css',
          }
        htmlString = docutils.core.publish_string(bytes(text, encoding='utf-8'),
            writer_name='html', settings_overrides=settingsDict)
        errString = errStream.getvalue()
        errStream.close()
        return htmlString, errString

    def _convertCodeChat(self, text, filePath):
        # Use StringIO to pass CodeChat compilation information back to
        # the UI.
        errStream = io.StringIO()
        try:
            htmlString = CodeToRest.code_to_html_string(text, errStream,
                                                        filename=filePath)
        except KeyError:
            # Although the file extension may be in the list of supported
            # extensions, CodeChat may not support the lexer chosen by Pygments
            # For example, a ``.v`` file may be Verilog (supported by CodeChat)
            # or Coq (not supported). In this case, provide an error messsage
            errStream.write('Error: this file is not supported by CodeChat.')
            htmlString = ''
        errString = errStream.getvalue()
        errStream.close()
        return filePath, htmlString, errString, QUrl()

# Main - user input for Port
# ^^^^^^^^^^^^^^^^^^^^^^^^^^
def main():
    while True:
        # .. note::
        #     This variable will be replaced in later versions to indicate wether to send
        #     restructed text or to analyze the given project folder for sphinx
        saveMode = input("True for build on Save, False for build on Modif: \n").lower()
        if(saveMode == 'true'):
           saveMode = True
           break
        elif(saveMode == 'false'):
            saveMode = False
            break
        else:
            print("Error, please enter yes or no.\n")
            
        
    ThreadedServer('', 50646, saveMode).listen()


while 1:
    main()
