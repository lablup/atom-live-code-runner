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
import * as ai from 'backend.ai-client';

export default AtomLiveCodeRunner = {
  resultPanel: null,
  subscriptions: null,
  code: null,
  accessKey: null,
  secretKey: null,
  signKey: null,
  runId: null,
  apiVersion: 'v2.20170315',
  hash_type: 'sha256',
  baseURL: 'https://api.backend.ai',
  kernelId: null,
  kernelType: null,
  clientConfig: null,
  client: null,
  AtomLiveCodeRunnerView: null,
  _exec_starts: null,
  _config: null,
  config: require('./config.js'),
  continuation: null,
  waiting_input: null,

  // dev mode for autoreload-package-service
  consumeAutoreload(reloader) {
    return reloader({ pkg: "live-code-runner", files: ["package.json"], folders: ["lib/"] });
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
    this.resultPanel = atom.workspace.addBottomPanel({ item: this.AtomLiveCodeRunnerView.getElement(), visible: false });
    this.continuation = false;
    this.waiting_input = false;

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.ensureClient();
    this.checkMandatorySettings();
    atom.config.onDidChange('live-code-runner.accessKey', ({newValue, oldValue}) => {
        this.clientConfig = null;
    });
    atom.config.onDidChange('live-code-runner.secretKey', ({newValue, oldValue}) => {
        this.clientConfig = null;
    });
    atom.config.onDidChange('live-code-runner.endpoint', ({newValue, oldValue}) => {
        this.clientConfig = null;
    });

    // Register command
    return this.subscriptions.add(atom.commands.add('atom-text-editor',
      { 'live-code-runner:run': () => this.runcode() })
    );
  },

  serialize() {
    return { AtomLiveCodeRunnerViewState: this.AtomLiveCodeRunnerView.serialize() };
  },

  getAccessKey() {
    this.ensureClient();
    return this.clientConfig.accessKey;
  },

  getSecretKey() {
    this.ensureClient();
    return this.clientConfig.secretKey;
  },

  getEndpoint() {
    this.ensureClient();
    return this.clientConfig.endpoint;
  },

  ensureClient() {
    if (this.clientConfig === null) {
      this.clientConfig = new ai.backend.ClientConfig(
        atom.config.get('live-code-runner.accessKey'),
        atom.config.get('live-code-runner.secretKey'),
        atom.config.get('live-code-runner.endpoint'),
      );
      let pkgVersion = '4.0.0';  // TODO: read from package.json
      this.client = new ai.backend.Client(
        this.clientConfig,
        `Live Code Runner ${pkgVersion}; ATOM ${atom.version}`,
      );
    }
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
    //this.client.accessKey = this.getAccessKey();
    //this.client.secretKey = this.getSecretKey();
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
    this.ensureClient();
    this.AtomLiveCodeRunnerView.clearConsoleMessage();
    let kernelType = this.chooseKernelType();
    if (kernelType === null) {
      let errorMsg = "live-code-runner: Could not detect the code language.";
      let notification = atom.notifications.addError(errorMsg, { dismissable: true });
      return false;
    }
    if ((kernelType !== this.kernelType) || (this.kernelId === null)) {
      if (this.kernelId !== null) {
        console.log('runcode: destroyKernel');
        let destroyAndCreateAndRun = this.destroyKernel(this.kernelId)
          .then(result => {
            if (result === true) {
              return this.createKernel(kernelType);
            } else {
              return false;
            }
          })
          .then(result => {
            if (result === true) {
              this.kernelType = kernelType;
              this.runId = this.generateRunId();
              return this.sendCode();
            }
          });
        return true;
      } else {
        let createAndRun = this.createKernel(kernelType).then((result) => {
          if (result === true) {
            this.kernelType = kernelType;
            this.runId = this.generateRunId();
            return this.sendCode();
          } else {
            console.log("[ERROR] Tried to spawn kernel but error found.");
          }
        }).catch(e => {
          console.log("[ERROR] Kernel creation request failed.", e);
        });
        return true;
      }
    } else {
      return this.sendCode();
    }
  },

  getServerVersion() {
    this.ensureClient();
    return this.client.getServerVersion()
      .then(response => {
        return response.version;
      }).catch(err => {
        let notification = atom.notifications.addError(`live-code-runner: ${err.message}`, { dismissable: true });
        return false;
      });
  },

  createKernel(kernelType) {
    this.ensureClient();
    this.continuation = false;
    this.waiting_input = false;
    let parentObj = this;
    let msg = "Preparing kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    return this.client.createKernel(kernelType)
      .then(response => {
        this.kernelId = response.kernelId;
        let msg = "Kernel prepared.";
        this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
        //notification = atom.notifications.addSuccess(msg);
        //setTimeout(() => notification.dismiss(), 1000);
        this.AtomLiveCodeRunnerView.setKernelIndicator(kernelType);
        return true;
      }).catch(err => {
        let errorMsg = `live-code-runner: ${response.statusText}`;
        let notification = atom.notifications.addError(errorMsg, { dismissable: true });
        return false;
      });
},

  destroyKernel(kernelId) {
    this.ensureClient();
    this.continuation = false;
    this.waiting_input = false;
    let msg = "Destroying kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    return this.client.destroyKernel(kernelId)
      .then(response => {
        return true;
      }).catch(err => {
        let errorMsg = `live-code-runner: kernel destroy failed - ${response.statusText}`;
        let notification = atom.notifications.addError(errorMsg,
          { dismissable: true });
        return false;
      });
  },

  refreshKernel() {
    this.ensureClient();
    this.continuation = false;
    this.waiting_input = false;
    let msg = "Refreshing kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    return this.client.refreshKernel(this.kernelId)
      .then(response => {
        let msg = "live-code-runner: kernel refreshed";
        notification = atom.notifications.addSuccess(msg);
        return true;
      }).catch(err => {
        let errorMsg = `live-code-runner: ${response.statusText}`;
        notification = atom.notifications.addError(errorMsg,
          { dismissable: true });
        return false;
      });
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
          if (code.search("import tensorflow") > 0) {
            kernelName = "python-tensorflow:latest-gpu";
          } else if (code.search("import keras") > 0) {
            kernelName = "python-tensorflow:latest-gpu";
          } else if (code.search("import theano") > 0) {
            kernelName = "python3-theano";
          } else if (code.search("import caffe") > 0) {
            kernelName = "python-caffe:latest";
          } else {
            kernelName = "python:latest";
          }
          break;
        case "r": kernelName = "r:latest"; break;
        case "julia": kernelName = "julia:latest"; break;
        case "lua": kernelName = "lua:latest"; break;
        case "php": kernelName = "php:latest"; break;
        case "haskell": kernelName = "haskell:latest"; break;
        case "matlab": case "octave": kernelName = "octave:latest"; break;
        case "nodejs": case "javascript": kernelName = "nodejs:latest"; break;
        default: kernelName = null;
      }
      console.log(`Kernel Language: ${kernelName}`);
      return kernelName;
    }
  },

  sendCode() {
    this.resultPanel.show();
    let mode = "query";
    if (this.waiting_input === true) {
      mode = "input";
      this.waiting_input = false;
    } else if (this.continuation === true) {
      this.code = '';
      mode = "continue";
    } else {
      this.AtomLiveCodeRunnerView.clearContent();
      this.AtomLiveCodeRunnerView.addConsoleMessage('[LOG] Running...');
      let editor = atom.workspace.getActiveTextEditor();
      this.code = editor.getText();
      this._exec_starts = new Date().getTime();
    }
    return this.client.runCode(this.code, this.kernelId, this.runId, mode)
      .then(response => {
        let hasOutput = false;
        let msg = '';
        let buffer = '';
        // state machine
        switch (response.result.status) {
          case 'continued':
            this.continuation = true;
            this.waiting_input = false;
            msg = "live-code-runner: executing...";
            setTimeout(() => this.sendCode(), 1);
            break;
          case 'waiting-input':
            this.continuation = true;
            this.waiting_input = true;
            break;
          case 'build-finished':
            this.continuation = true;
            this.waiting_input = false;
            break;
          case 'finished':
            this.continuation = false;
            this.waiting_input = false;
            let elapsed = (new Date().getTime() - this._exec_starts) / 1000;
            msg = `live-code-runner: Finished. (${elapsed} sec.)`;
            notification = atom.notifications.addSuccess(msg, { dismissable: false });
            setTimeout(() => notification.dismiss(), 1000);
            msg = `[LOG] Finished. (${elapsed} sec.)`;
            this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
            break;
          default:
            this.continuation = false;
            this.waiting_input = false;
        }
        // handle results
        if (response.result.console) {
          for (let c of Array.from(response.result.console)) {
            if (c[0] == 'stdout') {
              buffer = buffer + '<pre>' + this.escapeHtml(c[1]) + '</pre>';
            }
            if (c[0] == 'stderr') {
              buffer = buffer + '<pre class="live-code-runner-error-message">' + this.escapeHtml(c[1]) + '</pre>';
            }
            if (c[0] == 'media') {
              if (c[1][0] === "image/svg+xml") {
                buffer = buffer + c[1][1];
              }
            }
          }
        }

        this.AtomLiveCodeRunnerView.clearErrorMessage();
        if (response.result.exceptions && (response.result.exceptions.length > 0)) {
          let errBuffer = '';
          for (let exception of Array.from(response.result.exceptions)) {
            errBuffer = errBuffer + exception[0] + '(' + exception[1].join(', ') + ')';
          }
          this.AtomLiveCodeRunnerView.setErrorMessage(errBuffer);
        }
        this.AtomLiveCodeRunnerView.appendContent(buffer);
        if (this.waiting_input === true) {
          this.AtomLiveCodeRunnerView.addInputWidget();
        }
        return true;
      }).catch(err => {
        this.AtomLiveCodeRunnerView.setErrorMessage(`live-code-runner: ${err.message}`);
        switch (err.type) {
          case ai.backend.Client.ERR_SERVER:
            this.continuation = false;
            break;
          case ai.backend.Client.ERR_RESPONSE:
            break;
          case ai.backend.Client.ERR_REQUEST:
            break;
        }
        return false;
      });
  },
  escapeHtml(text) {
    return text.replace(/[\"&<>]/g, function (a) {
      return { '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[a];
    });
  },
  generateRunId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 8; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }
};
