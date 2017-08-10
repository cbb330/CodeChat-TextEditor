'use babel';

// codechat-plugin-view.js
// =======================
//
// This file is responsible for the majority of the plugin's functionality, including:
//
// * Connecting and communicating with the server
// * Recording the actions of the user
// * Programming how the viewing dock operates
//
// This file requires the use of `Net <https://nodejs.org/dist/latest-v8.x/docs/api/net.html>`_, in order to connect and interact with the server,
// and `Path <https://nodejs.org/dist/latest-v8.x/docs/api/path.html>`_, in order to access the file information associated with the project.
var net = require('net');
var path = require('path');
//
// This file contains the class CodechatPluginView. Whenever the plugin is started,
// the program initiates an instance of CodechatPluginView, so a constructor function
// and a destroy function are necessary to handle the lifespans of the CodechatPluginView instances.
//
export default class CodechatPluginView {

  constructor(serializedState) {
    //
    // Initializing socket and connecting to the server. Messages sent to the server
    // are in the `JSON <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON>`_ format.
    // The items sent through JSON are:
    // * File path
    // * File text content
    // * File project path
    // * Cursor position
    this.client = new net.Socket();

    this.client.connect(50646, '192.168.0.104', function() {
       console.log('Connected');
       console.log('init');
       msg = {
         data: [atom.workspace.getActiveTextEditor().getPath(), atom.workspace.getActiveTextEditor().getText(), atom.project.relativizePath(atom.workspace.getActiveTextEditor().getPath())[0]],
         cursor: atom.workspace.getActiveTextEditor().getCursorBufferPosition()
       };

       this.client.write(JSON.stringify(msg));

     }.bind(this));
    //
    // The way that Atom displays the HTML is by hosting a
    // `DOM Element <https://www.w3schools.com/js/js_htmldom_nodes.asp>`_
    // the item within the preview dock and changing the HTML content
    // whenever a new HTML is received.
    //
    // Initializes root DOM node and binds it to codechat-plugin
    this.element = document.createElement('div');
    this.element.classList.add('codechat-plugin');
    //
    // Initializes DOM node that will eventually hold the HTML content
    // and appends it to the root DOM node as its child
    const message = document.createElement('div');
    message.classList.add('message');
    this.element.appendChild(message);
    //
	  // This event function is called whenever the connection to the server is closed
    // unexpectedly. In this event, all subscriptions that the class may have activated
    // are destroyed. The user must restart the plugin to attempt to reconnect to the server.
    this.client.on('close', function() {
      message.textContent = 'Lost connection to the server! Please try again later.';
      this.client.destroy();
      this.onViewChange.dispose();
      this.onFileMod.dispose();
      this.onSave.dispose();
      this.onCursor.dispose();
    }.bind(this));
     //
	   // The following event function is called whenever the client receieves data
     // from the server. A lot of workarounds were required to make this work well.
     // The client will sometimes randomly split up the data it's received into chunks.
     // The function must anticipate how many characters its going to receive and append
     // each data chunk to each other until the entire message is received.
     //
     // Variables to be used in onData function
     var completeData = '';
     var contentLength = 0;
     this.updateOnSave = false;
     //
     // The onData function. The data received with allway be in the format
     // of (the length of content)(the content) i.e. "0000000005Hello!"
     this.client.on('data', function(data) {
       console.log('recv');
       if (completeData == '') {
         contentLength = Number(data.slice(0, 10));
         console.log(contentLength.toString());
         completeData += data.toString().replace(data.slice(0, 10), "");
       } else {
         completeData += data;
       }
       //
       // Once all of the data is completed, there's a chance that the next message
       // could have appended itself to the message before it. We can handle this issue
       // since we have the content length.
       if (completeData.length >= contentLength) {
         nextData = 'NULL'
         if (completeData.length > contentLength) {
           nextData = completeData.slice((contentLength), completeData.length + 1);
           console.log('concat');
           completeData = completeData.slice(0, contentLength);
         }
         //
         // Now the program determines what type of message it has received, the options being:
         // * HTML output => assigns HTML content to DOM Element
         // * An Error message => shows Error content as atom notification
         // * An Update on save/modified message => adjusts this.updateOnSave accordingly
         //
         console.log('complete msg');
         if (completeData.slice(0, 5) == 'ERROR') {
           atom.notifications.addError(completeData);
         } else if (completeData == 'T') {
           console.log(completeData);
           this.updateOnSave = true;
         } else if (completeData == 'F') {
           console.log(completeData);
           this.updateOnModif = false;
         } else {
           message.innerHTML = completeData;
         }
         if (nextData == 'NULL') {
           completeData = '';
         } else {
           contentLength = Number(nextData.slice(0, 10));
           console.log(contentLength.toString());
           completeData = nextData.toString().replace(nextData.slice(0, 10), "");
         }
         if (completeData.length == contentLength) {
           console.log('complete msg');
           if (completeData.slice(0, 5) == 'ERROR') {
             atom.notifications.addError(completeData);
           } else if (completeData == 'T') {
             this.updateOnSave = true;
           } else if (completeData == 'F') {
             this.updateOnSave = false;
           } else {
             message.innerHTML = completeData;
           }
           completeData = '';
         }

       }

      }.bind(this));
  //
  //
	// This is where the preview dock programming is handled.
  //
  // The following event classes are used from `Atom's API <https://atom.io/docs/api/v1.18.0/>`_
  //
  // Every time the user selects a new code file, the program deletes
  // the event listener of the old code file and initiates a new one
  // for the newly opened code file.
     this.currView = atom.workspace.getActiveTextEditor();

     this.onViewChange = atom.workspace.observeActiveTextEditor(editor => {
       if (editor != this.currView) {
         this.currView = editor;
         this.onFileMod.dispose();
         msg = {
           data: [atom.workspace.getActiveTextEditor().getPath(), atom.workspace.getActiveTextEditor().getText(), atom.project.relativizePath(atom.workspace.getActiveTextEditor().getPath())[0]],
           cursor: atom.workspace.getActiveTextEditor().getCursorBufferPosition()
         };

         this.client.write(JSON.stringify(msg));
       }

    //
		// This function waits for the contents of the active text file to stop changing.
    // Rather than waiting for whenever it changes, it waits till it stops changing in order
    // to reduce the amount of messages sent from the client. The variable this.updateOnSave
    // dictates whether the file gets reloaded every time the file is saved or every time
    // the file is modified.
       this.onFileMod = atom.workspace.getActiveTextEditor().onDidStopChanging(event => {
         console.log('modif');

         console.log(this.updateOnSave);

         if (!this.updateOnSave) {
           msg = {
             data: [atom.workspace.getActiveTextEditor().getPath(), atom.workspace.getActiveTextEditor().getText(), atom.project.relativizePath(atom.workspace.getActiveTextEditor().getPath())[0]],
             cursor: atom.workspace.getActiveTextEditor().getCursorBufferPosition()
           };

           this.client.write(JSON.stringify(msg));
         }
         return;
        });
     });
     //
     // This function waits for the file to be saved and reloads the file.
     this.onSave = atom.workspace.getActiveTextEditor().onDidSave(event => {
       console.log('saved');
       msg = {
         data: [atom.workspace.getActiveTextEditor().getPath(), atom.workspace.getActiveTextEditor().getText(), atom.project.relativizePath(atom.workspace.getActiveTextEditor().getPath())[0]],
         cursor: atom.workspace.getActiveTextEditor().getCursorBufferPosition()
       };

       this.client.write(JSON.stringify(msg));
       return;
     });
     //
     // This file waits for the cursor position to be changed and reloads the file.
     this.onCursor = atom.workspace.getActiveTextEditor().onDidChangeCursorPosition(event => {
       console.log('cursor changed');

       if (!this.updateOnSave) {
         msg = {
           cmd: 'init',
           data: [atom.workspace.getActiveTextEditor().getPath(), atom.workspace.getActiveTextEditor().getText(), atom.project.relativizePath(atom.workspace.getActiveTextEditor().getPath())[0]],
           cursor: atom.workspace.getActiveTextEditor().getCursorBufferPosition()
         };

         this.client.write(JSON.stringify(msg));
         return;
       }
     });


  }

  // The rest of these functions handles the lifespan of the CodechatPluginView instance.
  //
  serialize() {
    return {
      // This is used to look up the deserializer function. It can be any string, but it needs to be
      // unique across all packages!
      deserializer: 'codechat-plugin/CodechatPluginView'
    };
  }

  // Destroys the instance of CodechatPluginView and all other event subscriptions
  destroy() {
    if (!this.client.destroyed) {
      this.onCursor.dispose();
      this.onSave.dispose();
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
    return 'CodeChat Preview';
  }

  getURI() {
    // Used by Atom to identify the view when toggling.
    return 'atom://codechat-plugin';
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
