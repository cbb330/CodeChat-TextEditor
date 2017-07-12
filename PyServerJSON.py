#Python Server for recieving JSON objects
#Created by Christian Bush on 7/12/2017



import socket
import json
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
from PyQt5.QtCore import (pyqtSignal, Qt, QThread, QTimer, QUrl,
                          QEventLoop, QObject)
from PyQt5.QtWidgets import QFileDialog, QMessageBox, QWidget
from PyQt5.QtGui import QDesktopServices, QIcon, QPalette, QWheelEvent
from PyQt5.QtWebEngineWidgets import QWebEnginePage, QWebEngineView
from PyQt5 import uic
import sip


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



##----------------------------format------------------------
#['{"cmd": "init", "data": ["C:/Users/jbetb/.atom/packages/log-viewer/CHANGELOG.md", ".md", "content"]}',
#'## 0.1.0 - First Release\r\n* Every feature added\r\n* Every bug fixed\r\n']

markdownExts = ['.md', '.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn','.mdtxt', '.mdtext', '.Rmd']

def main():
    #initialize TCP connection
    TCP_IP = '192.168.0.104'
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
            dataCommand = conn.recv(10000)
            dataCommand = dataCommand.decode()
            if (dataCommand == ''):
                break
            #using client specified split point
            dataCommand = dataCommand.split('!@#$%^&*()')
            print(dataCommand)
            print('\n\nSending client message:\n')
            #create JSON object and then send back to client
            thisDict = json.loads(dataCommand[0])
            if (thisDict['data'][1] in markdownExts):
                dataCommand[1] = _convertMarkdown(dataCommand[1])
                conn.send(dataCommand[1].encode())
            elif (thisDict['data'][1] == '.rst'):
                dataCommand[1] = _convertReST(dataCommand[1])
                conn.send(dataCommand[1][0].encode())
                print(dataCommand[1][0])
                #conn.send(dataCommand[1][1].encode())
            else:
                dataCommand[1] = _convertCodeChat(dataCommand[1], thisDict['data'][0])
                conn.send(dataCommand[1][1].encode())
            
            print(thisDict)
            #conn.send(json.dumps(thisDict).encode())
            print(count)
            print('--------------------------------------------------\n\n\n\n\n\n\n')
            count += 1
        #catch when client exits code 
        except ConnectionAbortedError or ConnectionResetError:
            print("client closed")
            conn.close()
            break


# Global functions taken from Enki, not written by Christian Bush
# ================
def copyTemplateFile(errors, source, templateFileName, dest, newName=None):
    """For each sphinx project, two files are needed: ``index.rst`` as master
    document, and ``conf.py`` as sphinx configuration file. Given a file with
    ``templateFileName``, it will be copied to destination directory ``dest``.
    If any error occurs during copy operation, error information will
    be appended to ``errors``.
    """
    if not source or not dest:
        raise OSError(2, "Input or output directory cannot be None", None)
    if not newName:
        newName = templateFileName
    if not os.path.exists(os.path.join(dest, newName)):
        sourcePath = os.path.join(source, templateFileName)
        try:
            shutil.copy(sourcePath, os.path.join(dest, newName))
        except (IOError, OSError) as why:
            errors.append((sourcePath, dest, str(why)))

            
def _convertMarkdown(text):
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


def _convertReST(text):
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
      'input_encoding' : 'utf-8',
      # Don't stop processing, no matter what.
      'halt_level'     : 5,
      # Capture errors to a string and return it.
      'warning_stream' : errStream,
      # On some Windows PC, docutils will complain that it can't find its
      # template or stylesheet. On other Windows PCs with the same setup, it
      # works fine. ??? So, specify a path to both here.
      'template': (
        os.path.join(docutilsHtmlWriterPath,
                     docutils.writers.html4css1.Writer.default_template) ),
      'stylesheet_dirs' : (
        docutilsHtmlWriterPath,
        os.path.join(os.path.abspath(os.path.dirname(
          os.path.realpath(__file__))), 'rst_templates')),
      'stylesheet_path' : 'default.css',
      }
    htmlString = docutils.core.publish_string(bytes(text, encoding='utf-8'),
      writer_name='html', settings_overrides=settingsDict)
    errString = errStream.getvalue()
    errStream.close()
    return htmlString, errString


def _convertCodeChat(text, filePath):
    # Use StringIO to pass CodeChat compilation information back to
    # the UI.
    errStream = io.StringIO()
    try:
        htmlString = CodeToRest.code_to_html_string(text, errStream,
                                                    filename=filePath)
    except KeyError:
        # Although the file extension may be in the list of supported
        # extensions, CodeChat may not support the lexer chosen by Pygments.
        # For example, a ``.v`` file may be Verilog (supported by CodeChat)
        # or Coq (not supported). In this case, provide an error messsage
        errStream.write('Error: this file is not supported by CodeChat.')
        htmlString = ''
    errString = errStream.getvalue()
    errStream.close()
    return filePath, htmlString, errString, QUrl()

while 1:
    print("Program beginning")
    main()
