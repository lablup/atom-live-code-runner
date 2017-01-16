'use babel';
/*
atom-live-code-runner
(C) Copyright 2016-2017 Lablup Inc.
Licensed under MIT
*/
/*jshint esnext: true */
let AtomLiveCodeRunner;
import AtomLiveCodeRunnerView from './atom-live-code-runner-view';
import { CompositeDisposable } from 'atom';
import crypto from 'crypto';
import util from 'util';

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

  // dev mode for autoreload-package-service
  consumeAutoreload(reloader) {
    return reloader({pkg:"atom-live-code-runner",files:["package.json"],folders:["lib/"]});
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

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();
    this.checkMandatorySettings();

    // Register command
    return this.subscriptions.add(atom.commands.add('atom-text-editor',
      {'atom-live-code-runner:run': () => this.runcode()})
    );
  },

  serialize() {
    return {AtomLiveCodeRunnerViewState: this.AtomLiveCodeRunnerView.serialize()};
  },

  getAccessKey() {
    let accessKey = atom.config.get('atom-live-code-runner.accessKey');
    if (accessKey) {
      accessKey = accessKey.trim();
    }
    return accessKey;
  },

  getSecretKey() {
    let secretKey = atom.config.get('atom-live-code-runner.secretKey');
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
    return missingSettings.length === 0;
  },

  notifyMissingMandatorySettings(missingSettings) {
    let notification;
    let context = this;
    let errorMsg = `atom-live-code-runner: Please input following settings: ${missingSettings.join(', ')}`;

    return notification = atom.notifications.addInfo(errorMsg, {
      dismissable: true,
      buttons: [{
        text: "Package settings",
        onDidClick() {
          context.goToPackageSettings();
          return notification.dismiss();
        }
      }]
    });
  },

  goToPackageSettings() {
    return atom.workspace.open("atom://config/packages/atom-live-code-runner");
  },

  runcode() {
    return this.sendCode();
  },

  getAPIversion() {
    let d = new Date();
    let requestHeaders = new Headers({
      "Content-Type": "application/json",
      "X-Sorna-Date": d.toISOString()
    });

    let requestInfo = {
      method: 'GET',
      headers: requestHeaders,
      mode: 'cors',
      cache: 'default'
    };

    return fetch(this.baseURL+'/v1', requestInfo)
      .then( function(response) {
        if (response.version) {
          console.log(`API version: ${response.version}`);
          return response.version;
        }
        return true;
      });
  },

  createKernel(kernelType) {
    let parentObj = this;
    let msg = "Preparing kernel...";
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    //notification = atom.notifications.addInfo msg
    let requestBody = {
      "lang": kernelType,
      "clientSessionToken": "test-atom-live-code-runner",
      "resourceLimits": {
        "maxMem": 0,
        "timeout": 0
      }
    };
    let requestInfo = this.newRequest('POST', '/v1/kernel/create', requestBody);
    return fetch(this.baseURL + '/v1/kernel/create', requestInfo)
      .then( function(response) {
        let notification;
        if (response.ok === false) {
          let errorMsg = `atom-live-code-runner: ${response.statusText}`;
          notification = atom.notifications.addError(errorMsg, {dismissable: true});
          return false;
        } else if (response.status === 201) {
          return response.json().then( function(json) {
            console.debug(`Kernel ID: ${json.kernelId}`);
            parentObj.kernelId = json.kernelId;
            msg = "atom-live-code-runner: kernel prepared.";
            notification = atom.notifications.addSuccess(msg);
            setTimeout(() => notification.dismiss(), 1000);
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
    let requestInfo = this.newRequest('DELETE', `/v1/kernel/${kernelId}`, null);
    return fetch(this.baseURL + '/v1/kernel/'+kernelId, requestInfo)
      .then( function(response) {
        if (response.ok === false) {
          if (response.status !== 404) {
            let errorMsg = `atom-live-code-runner: destroy failed - ${response.statusText}`;
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
    let requestInfo = this.newRequest('PATCH', `/v1/kernel/${this.kernelId}`, null);
    return fetch(this.baseURL + '/v1/kernel/'+this.kernelId, requestInfo)
      .then( function(response) {
        let notification;
        if (response.ok === false) {
          let errorMsg = `atom-live-code-runner: ${response.statusText}`;
          notification = atom.notifications.addError(errorMsg,
            {dismissable: true});
        } else {
          if (response.status !== 404) {
            msg = "atom-live-code-runner: kernel refreshed";
            notification = atom.notifications.addSuccess(msg);
          }
        }
        return true;
      }, e => false);
  },

  newRequest(method, queryString, body) {
    let requestBody;
    let d = new Date();
    let t = this.getCurrentDate(d);
    this.signKey = this.getSignKey(this.getSecretKey(), d);
    if (body === null) {
      requestBody = '';
    } else {
      requestBody = JSON.stringify(body);
    }
    let aStr = this.getAuthenticationString(method, queryString, d.toISOString(), requestBody);
    let sig = this.sign(this.signKey, 'binary', aStr, 'hex');

    let requestHeaders = new Headers({
      "Content-Type": "application/json",
      "Content-Length": requestBody.length.toString(),
      'X-Sorna-Version': this.apiVersion,
      "X-Sorna-Date": d.toISOString(),
      "Authorization": `Sorna signMethod=HMAC-SHA256, credential=${this.getAccessKey()}:${sig}`
      });

    let requestInfo = {
      method,
      headers: requestHeaders,
      cache: 'default',
      body: requestBody
    };
    return requestInfo;
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
      errorMsg = "atom-live-code-runner: language is not specified by Atom.";
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
    this.AtomLiveCodeRunnerView.addConsoleMessage(msg);
    let editor = atom.workspace.getActiveTextEditor();
    this.code = editor.getText();
    let requestBody = {
      "codeId": crypto.createHash('md5').update(this.code).digest("hex"),
      "code": this.code
    };
    let requestInfo = this.newRequest('POST', `/v1/kernel/${this.kernelId}`, requestBody);
    return fetch(this.baseURL + '/v1/kernel/' + this.kernelId, requestInfo)
      .then( response => {
        if (response.ok === false) {
          errorMsg = `atom-live-code-runner: ${response.statusText}`;
          notification = atom.notifications.addError(errorMsg, {dismissable: false});
          if (response.status === 404) {
            this.createKernel(this.kernelType);
          }
        } else {
          msg = "atom-live-code-runner: completed.";
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
            return this.AtomLiveCodeRunnerView.setContent(buffer);
          }
          );
        }
        setTimeout(() => notification.dismiss(), 1000);
        return true;
      }
      );
  },

  getAuthenticationString(method, queryString, dateValue, bodyValue) {
    return ( method + '\n' + queryString + '\n' + dateValue + '\n' + 'host:api.sorna.io'+ '\n'+'content-type:application/json' + '\n' + 'x-sorna-version:'+this.apiVersion + '\n' + crypto.createHash(this.hash_type).update(bodyValue).digest('hex'));
  },

  getCurrentDate(now) {
    let year = (`0000${now.getUTCFullYear()}`).slice(-4);
    let month = (`0${now.getUTCMonth() + 1}`).slice(-2);
    let day = (`0${now.getUTCDate()}`).slice(-2);
    let t = year + month + day;
    return t;
  },

  sign(key, key_encoding, msg, digest_type) {
    let kbuf = new Buffer(key, key_encoding);
    let hmac = crypto.createHmac(this.hash_type, kbuf);
    hmac.update(msg, 'utf8');
    return hmac.digest(digest_type);
  },

  getSignKey(secret_key, now) {
    let k1 = this.sign(secret_key, 'utf8', this.getCurrentDate(now), 'binary');
    let k2 = this.sign(k1, 'binary', 'api.sorna.io', 'binary');
    return k2;
  }
};
