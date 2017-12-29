'use babel';
/*
live-code-runner
================

(C) Copyright 2016-2017 Lablup Inc.
Licensed under MIT

*/
/*jshint esnext: true */
import { TextEditorElement, TextEditor } from 'atom';

export default class LiveCodeRunnerView {
  constructor(serializedState, caller) {
    this.closeView = this.closeView.bind(this);
    this.refreshKernel = this.refreshKernel.bind(this);
    this.caller = caller;
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('live-code-runner');

    // Create message element
    let consoleMessage = document.createElement('div');
    consoleMessage.classList.add('live-code-runner-console-message');
    this.element.appendChild(consoleMessage);

    let errorMessage = document.createElement('div');
    errorMessage.classList.add('live-code-runner-error-message');
    this.element.appendChild(errorMessage);

    this.message = document.createElement('div');
    this.message.classList.add('live-code-runner-result');
    this.element.appendChild(this.message);

    let buttonArea = document.createElement('div');
    buttonArea.classList.add('live-code-runner-buttons');
    let closeButton = document.createElement('span');
    closeButton.addEventListener('click', this.closeView.bind(this));
    closeButton.classList.add('icon');
    closeButton.classList.add('icon-x');
    let refreshButton = document.createElement('span');
    refreshButton.addEventListener('click', this.refreshKernel.bind(this));
    refreshButton.classList.add('icon');
    refreshButton.classList.add('icon-repo-sync');
    this.kernelIndicator = document.createElement('span');
    this.kernelIndicator.classList.add('live-code-runner-kernel-indicator');
    buttonArea.appendChild(this.kernelIndicator);
    buttonArea.appendChild(refreshButton);
    buttonArea.appendChild(closeButton);
    this.element.appendChild(buttonArea);
    this.currentInputWidget = null;
  }

  readKey(e) {
    var key = e.which || e.keyCode;
    if (key == 13) {
      this.caller.code = this.currentInputWidget.getText();
      e.currentTarget.removeEventListener('keypress', this.readKey.bind(this));
      this.caller.sendCode();
      e.stopPropagation();
    }
  }

  addInputWidget() {
    let inputWidget = new TextEditor({mini: true});
    this.currentInputWidget = inputWidget;
    let el = atom.views.getView(inputWidget);
    el.addEventListener('keydown', this.readKey.bind(this));
    this.element.children[2].appendChild(el);
  }

  closeView() {
    this.clearView();
    return this.caller.resultPanel.hide();
  }

  refreshKernel() {
    this.clearView();
    return this.caller.refreshKernel();
  }

  setKernelIndicator(kernelName) {
    this.kernelIndicator.textContent = kernelName;
  }

  // Clear all views
  clearView() {
     this.element.children[2].innerHTML = '';
     this.element.children[1].textContent = '';
     this.element.children[0].innerHTML = '';
     return true;
  }

  // Set content
  setContent(content) {
    return this.element.children[2].innerHTML = content;
  }

  // Append content
  appendContent(content) {
    this.element.children[2].innerHTML = this.element.children[2].innerHTML + content;
  }

  // Clear content
  clearContent() {
    this.element.children[2].innerHTML = '';
  }

  // Set error message
  setErrorMessage(content) {
    this.element.children[1].textContent = content;
  }

  // Adds console message
  addConsoleMessage(content) {
    this.element.children[0].innerHTML = this.element.children[0].innerHTML + '<br />' +  content;
  }

  // Adds console message
  addLogMessage(content) {
    this.element.children[0].innerHTML = this.element.children[0].innerHTML + '<br />' +  content;
  }


  // Clears console message
  clearConsoleMessage() {
    this.element.children[0].innerHTML = '';
  }

  // Clears error message
  clearErrorMessage() {
    this.element.children[1].textContent = '';
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    return this.element.remove();
  }

  getElement() {
    return this.element;
  }
}
