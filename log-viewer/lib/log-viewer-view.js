'use babel';

const fs = require('fs');

const { spawn } = require('child_process');

//const { exec } = require('child_process');


export default class LogViewerView {

  constructor(serializedState) {
    fs.writeFile(__dirname + '/../LOG.txt', "");
    const pythonScript = spawn('python.exe', [__dirname + '/../ZMQ-Client.py']);

    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('log-viewer');

    // Create message element
    const message = document.createElement('div');
    message.textContent = '';
    message.classList.add('message');
    this.element.appendChild(message);


    //event to record insertedtext and save to lOG.txt file, pane, and console
    this.subscriptions = atom.workspace.getActiveTextEditor().onDidInsertText(event => {
      fs.appendFile(__dirname + '/../LOG.txt', 'Char Typed: ' + event.text + '\r\n');
      message.textContent = event.text;
      console.log("Character Typed");
      return;
    });
  }


  // Returns an object that can be retrieved when package is activated
  serialize() {
    return {
      // This is used to look up the deserializer function. It can be any string, but it needs to be
      // unique across all packages!
      deserializer: 'log-viewer/LogViewerView'
    };
  }

  // Tear down any state and detach
  destroy() {
    //  Possible alternative methods to killing pythonScript
    //const killer = exec('kill -9 ' + pythonScript.pid);
    //pythonScript.kill('SIGINT');

    fs.appendFile(__dirname + '/../LOG.txt', '~!@#$%^&*(())(*&^%$#@!#$%^&*(&^%$#@!#$%^))' + '\r\n');
    this.element.remove();
    this.subscriptions.dispose();
  }

  getElement() {
    return this.element;
  }

  getTitle() {
    // Used by Atom for tab text
    return 'Log Viewer';
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return 'atom://log-viewer';
  }

  getDefaultLocation() {
    // This location will be used if the user hasn't overridden it by dragging the item elsewhere.
    // Valid values are "left", "right", "bottom", and "center" (the default).
    return 'right';
  }

  getAllowedLocations() {
    // The locations into which the item can be moved.
    return ['left', 'right', 'bottom'];
  }

}
