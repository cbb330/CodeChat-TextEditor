'use babel';

import LogViewerView from './log-viewer-view';
import { CompositeDisposable, Disposable } from 'atom';



export default {

  const { exec } = require('child_process');

  subscriptions: null,

  activate(state) {

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable(
      // Add an opener for our view.
      atom.workspace.addOpener(uri => {
        if (uri === 'atom://log-viewer') {
          return new LogViewerView();
        }
      }),

      //exec('python.exe' 'C:/Users/Christian/Documents/University/Dr. Jones Research/SmartGit Repo/AtomZMQ/log-viewer/LOGParse.py');

      // Register command that toggles this view
      atom.commands.add('atom-workspace', {
        'log-viewer:toggle': () => this.toggle()
      }),

      // Destroy any ActiveEditorInfoViews when the package is deactivated.
      new Disposable(() => {
        atom.workspace.getPaneItems().forEach(item => {
          if (item instanceof LogViewerView) {
            item.destroy();
          }
        });
      })
    );
  },

  deactivate() {
    this.subscriptions.dispose();
  },

  toggle() {
    atom.workspace.toggle('atom://log-viewer');
  },

  deserializeLogViewerView(serialized) {
    return new LogViewerView();
  }

};
