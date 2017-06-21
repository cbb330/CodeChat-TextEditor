'use babel';

export default class LogViewerView {

  constructor(serializedState) {

    //Root DOM element
    this.element = document.createElement('div');
    this.element.classList.add('log-viewer');

    //DOM node that is visible in dock
    const message = document.createElement('div');
    //Formatting to allow new lines
    message.textContent = 'Event Log' + '\r\n' + '-----------' + '\r\n';
    message.setAttribute('style', 'white-space: pre;');
    message.classList.add('message');
    this.element.appendChild(message);



    //Our attempt at handling subscriptions, we've so far attempted to implement insertText
    this.subscriptions = atom.workspace.getCenter().observeActivePaneItem(item => {

      //event to record insertedtext
      item.onDidInsertText(event => {
        message.textContent += ('Text Inserted: ' + event.text + '\r\n')
        console.log("Character Typed")
        return;
      })


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
