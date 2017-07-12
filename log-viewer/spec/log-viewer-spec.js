// *********** CodeChat Preview Plugin *********************************
// 
// *********** Created by Jack Betbeze and Christian Bush **************
// *********** https://github.com/cbb330/CodeChat-TextEditor ***********
//
// 
// *********** log-viewer-spec.js **************************************
//
// *********************************************************************

'use babel';

import LogViewer from '../lib/log-viewer';

// Use the command `window:run-package-specs` (cmd-alt-ctrl-p) to run specs.
//
// To run a specific `it` or `describe` block add an `f` to the front (e.g. `fit`
// or `fdescribe`). Remove the `f` to unfocus the block.

describe('LogViewer', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('log-viewer');
  });

  describe('when the log-viewer:toggle event is triggered', () => {
    it('hides and shows the modal panel', () => {
      // Before the activation event the view is not on the DOM, and no panel
      // has been created
      expect(workspaceElement.querySelector('.log-viewer')).not.toExist();

      // This is an activation event, triggering it will cause the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'log-viewer:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        expect(workspaceElement.querySelector('.log-viewer')).toExist();

        let logViewerElement = workspaceElement.querySelector('.log-viewer');
        expect(logViewerElement).toExist();

        let logViewerPanel = atom.workspace.panelForItem(logViewerElement);
        expect(logViewerPanel.isVisible()).toBe(true);
        atom.commands.dispatch(workspaceElement, 'log-viewer:toggle');
        expect(logViewerPanel.isVisible()).toBe(false);
      });
    });

    it('hides and shows the view', () => {
      // This test shows you an integration test testing at the view level.

      // Attaching the workspaceElement to the DOM is required to allow the
      // `toBeVisible()` matchers to work. Anything testing visibility or focus
      // requires that the workspaceElement is on the DOM. Tests that attach the
      // workspaceElement to the DOM are generally slower than those off DOM.
      jasmine.attachToDOM(workspaceElement);

      expect(workspaceElement.querySelector('.log-viewer')).not.toExist();

      // This is an activation event, triggering it causes the package to be
      // activated.
      atom.commands.dispatch(workspaceElement, 'log-viewer:toggle');

      waitsForPromise(() => {
        return activationPromise;
      });

      runs(() => {
        // Now we can test for view visibility
        let logViewerElement = workspaceElement.querySelector('.log-viewer');
        expect(logViewerElement).toBeVisible();
        atom.commands.dispatch(workspaceElement, 'log-viewer:toggle');
        expect(logViewerElement).not.toBeVisible();
      });
    });
  });
});
