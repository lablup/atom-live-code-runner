'use babel';
/*jshint esnext: true */
export default class SornaCodeRunnerView {
  constructor(serializedState, caller) {
    this.closeView = this.closeView.bind(this);
    this.refreshKernel = this.refreshKernel.bind(this);
    this.caller = caller;
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('atom-live-code-runner');

    // Create message element
    let consoleMessage = document.createElement('div');
    consoleMessage.classList.add('atom-live-code-runner-console-message');
    this.element.appendChild(consoleMessage);

    let errorMessage = document.createElement('div');
    errorMessage.classList.add('atom-live-code-runner-error-message');
    this.element.appendChild(errorMessage);

    let message = document.createElement('div');
    message.classList.add('atom-live-code-runner-result');
    this.element.appendChild(message);


    let buttonArea = document.createElement('div');
    buttonArea.classList.add('atom-live-code-runner-buttons');
    let closeButton = document.createElement('span');
    closeButton.addEventListener('click', this.closeView.bind(this));
    closeButton.classList.add('icon');
    closeButton.classList.add('icon-x');
    let refreshButton = document.createElement('span');
    refreshButton.addEventListener('click', this.refreshKernel.bind(this));
    refreshButton.classList.add('icon');
    refreshButton.classList.add('icon-repo-sync');
    this.kernelIndicator = document.createElement('span');
    this.kernelIndicator.classList.add('atom-live-code-runner-kernel-indicator');
    buttonArea.appendChild(this.kernelIndicator);
    buttonArea.appendChild(refreshButton);
    buttonArea.appendChild(closeButton);

    this.element.appendChild(buttonArea);
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
     return this.element.children[0].innerHTML = '';
  }

  // Set content
  setContent(content) {
     return this.element.children[2].innerHTML = content;
  }

  // Set error message
  setErrorMessage(content) {
     return this.element.children[1].textContent = content;
   }

  // Adds console message
  addConsoleMessage(content) {
     return this.element.children[0].innerHTML = this.element.children[0].innerHTML + '<br />' +  content;
  }

  // Clears console message
  clearConsoleMessage() {
     return this.element.children[0].innerHTML = '';
  }

  // Clears error message
  clearErrorMessage() {
    return this.element.children[1].textContent = '';
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
