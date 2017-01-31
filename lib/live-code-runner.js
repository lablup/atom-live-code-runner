'use babel';
/*
live-code-runner
(C) Copyright 2016-2017 Lablup Inc.
Licensed under MIT
*/
/*jshint esnext: true */
let AtomLiveCodeRunner;
import AtomLiveCodeRunnerView from './live-code-runner-view';
import { CompositeDisposable } from 'atom';
import crypto from 'crypto';
import SornaAPILib from './sorna-api-lib-v1';

export default AtomLiveCodeRunner = {
  config: require('./config.js'),
  AtomLiveCodeRunnerView: null,
  resultPanel: null,
  subscriptions: null,
  code: null,
  accessKey: null,
  secretKey: null,
  signKey: null,
  apiVersion: 'v1.20160915',
  hash_type: 'sha256',
  baseURL: 'https://api.sorna.io',
  kernelId: null,
  kernelType: null,
  SornaAPILib: null,

  // dev mode for autoreload-package-service
  consumeAutoreload(reloader) {
    return reloader({pkg:"live-code-runner",files:["package.json"],folders:["lib/"]});
  },

  activate(state) {
    if (atom.inDevMode()) {
      try {
        return this.realActivate(state);
      } catch (e) {
        return console.log(e);
      }
    } else {
      return this.realActivate(state);
    }
  },

  deactivate() {
    this.resultPanel.destroy();
    return this.subscriptions.dispose();
  },

  realActivate(state) {
    this.AtomLiveCodeRunnerView = new AtomLiveCodeRunnerView(state.AtomLiveCodeRunnerViewState, this);
    this.resultPanel = atom.workspace.addBottomPanel({item: this.AtomLiveCodeRunnerView.getElement(), visible: false});
    this.SornaAPILib = new SornaAPILib();

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.checkMandatorySettings();

    // Register command
    return this.subscriptions.add(atom.commands.add('atom-text-editor',
      {'live-code-runner:run': () => this.runcode()})
    );
  },

  serialize() {
    return {AtomLiveCodeRunnerViewState: this.AtomLiveCodeRunnerView.serialize()};
  },

  getAccessKey() {
    let accessKey = atom.config.get('live-code-runner.accessKey');
    if (accessKey) {
      accessKey = accessKey.trim();
    }
    return accessKey;
  },

  getSecretKey() {
    let secretKey = atom.config.get('live-code-runner.secretKey');
    if (secretKey) {
      secretKey = secretKey.trim();
    }
    return secretKey;
  },

  checkMandatorySettings() {
    let missingSettings = [];
    if (!this.getAccessKey()) {
      missingSettings.push("Access Key");
    }
    if (!this.getSecretKey()) {
      missingSettings.push("Secret Key");
    }
    if (missingSettings.length) {
      this.notifyMissingMandatorySettings(missingSettings);
    }
    this.SornaAPILib.accessKey = this.getAccessKey();
    this.SornaAPILib.secretKey = this.getSecretKey();
    return missingSettings.length === 0;
  },

  notifyMissingMandatorySettings(missingSettings) {
    let notification;
    let context = this;
    let errorMsg = `live-code-runner: Please input following settings: ${missingSettings.join(', ')}`;

    notification = atom.notifications.addInfo(errorMsg, {
      dismissable: true,
      buttons: [{
        text: "Package settings",
        onDidClick() {
          context.goToPackageSettings();
          return notification.dismiss();
        }
      }]
    });
    return true;
  },

  goToPackageSettings() {
    return atom.workspace.open("atom://config/packages/live-code-runner");
  },

  runcode() {
    this.AtomLiveCodeRunnerView.clearConsoleMessage();
    return this.sendCode();
  },

  getAPIversion() {
    return this.SornaAPILib.getAPIversion();
  },

  createKernel(kernelType) {
    let parentObj = this;
    let msg = "Preparing kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    return this.SornaAPILib.createKernel(kernelType)
      .then( function(response) {
        let notification;
        if (response.ok === false) {
          let errorMsg = `live-code-runner: ${response.statusText}`;
          notification = atom.notifications.addError(errorMsg, {dismissable: true});
          return false;
        } else if (response.status === 201) {
          return response.json().then( function(json) {
            console.debug(`Kernel ID: ${json.kernelId}`);
            parentObj.kernelId = json.kernelId;
            msg = "Kernel prepared.";
            parentObj.AtomLiveCodeRunnerView.addConsoleMessage(msg);
            //notification = atom.notifications.addSuccess(msg);
            //setTimeout(() => notification.dismiss(), 1000);
            parentObj.AtomLiveCodeRunnerView.setKernelIndicator(kernelType);
            return true;
          });
        }
      }, function(e) {}
      );
  },

  destroyKernel(kernelId) {
    let msg = "Destroying kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    return this.SornaAPILib.destroyKernel(kernelId)
      .then( function(response) {
        if (response.ok === false) {
          if (response.status !== 404) {
            let errorMsg = `live-code-runner: kernel destroy failed - ${response.statusText}`;
            let notification = atom.notifications.addError(errorMsg,
              {dismissable: true});
            return false;
          } else {
            return true;
          }
        }
        return true;
      }, e => false);
  },

  refreshKernel() {
    let msg = "Refreshing kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    return this.SornaAPILib.refreshKernel(this.kernelId)
      .then( function(response) {
        let notification;
        if (response.ok === false) {
          let errorMsg = `live-code-runner: ${response.statusText}`;
          notification = atom.notifications.addError(errorMsg,
            {dismissable: true});
        } else {
          if (response.status !== 404) {
            msg = "live-code-runner: kernel refreshed";
            notification = atom.notifications.addSuccess(msg);
          }
        }
        return true;
      }, e => false);
  },

  chooseKernelType() {
    let grammar;
    let editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      grammar = editor.getGrammar();
    } else {
      grammar = null;
    }
    if (grammar) {
      let kernelName;
      let grammarName = (grammar.name || grammar.scopeName).toLowerCase();
      switch (grammarName) {
        case "python":
          let code = editor.getText();
          if (code.search("tensorflow") > 0) {
            kernelName = "tensorflow-python3-gpu";
          } else {
            kernelName = "python3";
          }
          break;
        case "r": kernelName = "r3"; break;
        case "julia": kernelName = "julia"; break;
        case "lua": kernelName = "lua5"; break;
        case "php": kernelName = "php7"; break;
        case "haskell": kernelName = "haskell"; break;
        case "nodejs": case "javascript": kernelName = "nodejs4"; break;
        default: kernelName = null;
      }
      console.log(`Kernel Language: ${kernelName}`);
      return kernelName;
    }
  },

  sendCode() {
    let errorMsg, notification;
    let kernelType = this.chooseKernelType();
    if (kernelType === null) {
      errorMsg = "live-code-runner: language is not specified by Atom.";
      notification = atom.notifications.addError(errorMsg, { dismissable: true,
      description: 'Check the grammar indicator at bottom bar and make sure that it is correctly recoginzed (NOT `Plain Text`).\nTry one of the followings:\n * Save current editor with proper file extension.\n * Install extra lauguage support package. (e.g. `language-r`, `language-haskell`)'
    }
      );
      return false;
    }
    if ((kernelType !== this.kernelType) || (this.kernelId === null)) {
      if (this.kernelId !== null) {
        let destroyAndCreateAndRun = this.destroyKernel(this.kernelId)
        .then( result => {
          if (result === true) {
            return this.createKernel(kernelType);
          } else {
            return false;
          }
        }
        )
        .then( result => {
          if (result === true) {
            this.kernelType = kernelType;
            return this.sendCode();
          }
        }
        );
        return true;
      } else {
        let createAndRun = this.createKernel(kernelType).then( result => {
          if (result === true) {
            this.kernelType = kernelType;
            return this.sendCode();
          }
        }
        );
        return true;
      }
    }
    this.resultPanel.show();
    let msg = "Running...";
    this.AtomLiveCodeRunnerView.clearContent();
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    let editor = atom.workspace.getActiveTextEditor();
    this.code = editor.getText();
    return this.SornaAPILib.runCode(this.code, this.kernelId)
      .then( response => {
        if (response.ok === false) {
          errorMsg = `live-code-runner: ${response.statusText}`;
          notification = atom.notifications.addError(errorMsg, {dismissable: false});
          if (response.status === 404) {
            this.createKernel(this.kernelType);
          }
        } else {
          msg = "live-code-runner: completed.";
          notification = atom.notifications.addSuccess(msg, {dismissable: false});
          response.json().then( json => {
            let buffer = '';
            if (json.result.media) {
              for (let m of Array.from(json.result.media)) {
                if (m[0] === "image/svg+xml") {
                  buffer = buffer + m[1];
                }
              }
            }
            if (json.result.stdout) {
              buffer = buffer + '<br /><pre>'+json.result.stdout+'</pre>';
            }
            if (json.result.exceptions && (json.result.exceptions.length > 0)) {
              let errBuffer = '';
              for (let exception of Array.from(json.result.exceptions)) {
                errBuffer = errBuffer + exception[0] + '(' + exception[1].join(', ') + ')';
              }
              this.AtomLiveCodeRunnerView.setErrorMessage(errBuffer);
            }
            this.AtomLiveCodeRunnerView.clearErrorMessage();
            return this.AtomLiveCodeRunnerView.setContent(buffer);
          }
          );
        }
        setTimeout(() => notification.dismiss(), 1000);
        return true;
      }
      );
  }
};
