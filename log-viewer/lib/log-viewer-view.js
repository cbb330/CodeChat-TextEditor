'use babel';

var net = require('net');
var path = require('path');


export default class LogViewerView {

  constructor(serializedState) {
    this.client = new net.Socket();

    this.client.connect(50646, '192.168.0.102', function() {
       console.log('Connected');

     });

    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('log-viewer');

    // Create message element
    const message = document.createElement('div');
    message.textContent = '';
    message.classList.add('message');
    this.element.appendChild(message);

    //this.client.on('close', function() {
      //message.textContent = 'Lost connection to the server!';
      //this.client.destroy();
    //});

     this.client.on('data', function(data) {
       message.innerHTML = data;
       console.log('Recv');
     });

     this.currView = atom.workspace.getActivePaneItem();

     this.onViewChange = atom.workspace.observeActivePaneItem(item => {
       if (item != this.currView) {
         this.currView = item;
         this.onFileMod.dispose();

       }

       console.log('init');
       this.client.write('{"cmd": "init", "data": ["' + atom.workspace.getActiveTextEditor().getPath().replace(/\\/g, "/") + '", "' + path.extname(atom.workspace.getActiveTextEditor().getPath()) + '", "content"]}' + '!@#$%^&*()' + atom.workspace.getActiveTextEditor().getText());

       this.onFileMod = atom.workspace.getActiveTextEditor().onDidStopChanging(jibberish => {
         console.log('modif');
         this.client.write('{"cmd": "modif", "data": ["' + atom.workspace.getActiveTextEditor().getPath().replace(/\\/g, "/") + '", "' + path.extname(atom.workspace.getActiveTextEditor().getPath()) + '", "content"]}' + '!@#$%^&*()' + atom.workspace.getActiveTextEditor().getText());

         return;
        });
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
    this.client.destroy();
    this.element.remove();
    this.onViewChange.dispose();
    this.onFileMod.dispose();
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
