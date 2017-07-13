'use babel';

// *********** CodeChat Preview Plugin *********************************
//
// *********** Created by Jack Betbeze and Christian Bush **************
// *********** https://github.com/cbb330/CodeChat-TextEditor ***********
//
//
// *********** log-viewer-view.js **************************************
//
// *** Handles preview pane functionality
// *** Initializes connection and exchanges information with server
//
// *********************************************************************


var net = require('net');
var path = require('path');


export default class LogViewerView {

  constructor(serializedState) {
    this.client = new net.Socket();

    this.client.connect(50646, '192.168.0.104', function() {
       console.log('Connected');
       console.log('init');
       this.client.write('{"cmd": "init", "data": ["' + atom.workspace.getActiveTextEditor().getPath().replace(/\\/g, "/") + '", "' + path.extname(atom.workspace.getActiveTextEditor().getPath()) + '", "content"]}' + '!@#$%^&*()' + atom.workspace.getActiveTextEditor().getText());

     }.bind(this));

    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('log-viewer');

    // Create message element
    const message = document.createElement('div');
    message.textContent = '';
    message.classList.add('message');
    this.element.appendChild(message);

	// Lost Connection Handler
    this.client.on('close', function() {
      message.textContent = 'Lost connection to the server!';
      this.client.destroy();
      this.onViewChange.dispose();
      this.onFileMod.dispose();
    }.bind(this));

	// Recieving Data
     var completeData = '';
     var contentLength = 0;

     this.client.on('data', function(data) {
       console.log('recv');
       if (completeData == '') {
         contentLength = Number(data.slice(0, 10));
         console.log(contentLength.toString());
         completeData += data.toString().replace(data.slice(0, 10), "");
       } else {
         completeData += data;
       }

       if (completeData.length == contentLength) {
         console.log('complete msg');
         message.innerHTML = completeData;
         completeData = '';
       }

     });

	// Text Editor Switching Handling
     this.currView = atom.workspace.getActiveTextEditor();

     this.onViewChange = atom.workspace.observeActiveTextEditor(editor => {
       if (editor != this.currView) {
         this.currView = editor;
         this.onFileMod.dispose();
         console.log('init');
         this.client.write('{"cmd": "init", "data": ["' + atom.workspace.getActiveTextEditor().getPath().replace(/\\/g, "/") + '", "' + path.extname(atom.workspace.getActiveTextEditor().getPath()) + '", "content"]}' + '!@#$%^&*()' + atom.workspace.getActiveTextEditor().getText());

       }


		// Text Editor Modification Handler
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
    if (!this.client.destroyed) {
      this.client.destroy();
      this.onViewChange.dispose();
      this.onFileMod.dispose();
    }

    console.log('destroyed');
    this.element.remove();

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
