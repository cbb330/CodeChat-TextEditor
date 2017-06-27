'use babel';

const fs = require('fs');

export default class LogViewerView {

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('log-viewer');

    // Create message element
    const message = document.createElement('div');
    message.textContent = 'BASE';
    message.classList.add('message');
    this.element.appendChild(message);

    //atom.workspace.open('C:/Users/Christian/Documents/University/Dr. Jones Research/SmartGit Repo/AtomZMQ/log-viewer/LOG.txt');
    //event to record insertedtext and save to lOG.txt file, pane, and console
    this.subscriptions = atom.workspace.getActiveTextEditor().onDidInsertText(event => {
      fs.appendFile('C:/Users/Christian/Documents/University/Dr. Jones Research/SmartGit Repo/AtomZMQ/log-viewer/LOG.txt', event.text + '\r\n')
      message.textContent = event.text
      console.log("Character Typed")
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
