'use babel';

import LogViewerView from './log-viewer-view';
import { CompositeDisposable } from 'atom';

export default {

  logViewerView: null,
  logDock: null,
  subscriptions: null,

  activate(state) {
    this.logViewerView = new LogViewerView(state.logViewerViewState);
    this.logDock = atom.workspace.getRightDock({
      item: this.logViewerView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'log-viewer:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.logDock.destroy();
    this.subscriptions.dispose();
    this.logViewerView.destroy();
  },

  serialize() {
    return {
      logViewerViewState: this.logViewerView.serialize()
    };
  },

  toggle() {
    console.log('LogViewer was toggled!');
    return (
      this.logDock.isVisible() ?
      this.logDock.hide() :
      this.logDock.show()
    );
  }

};
