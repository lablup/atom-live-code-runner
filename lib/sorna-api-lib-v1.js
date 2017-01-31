'use babel';
/*
Sorna Cloud Javascript API Library (v1)
=======================================

(C) Copyright 2016-2017 Lablup Inc.
Licensed under MIT
*/
/*jshint esnext: true */
import crypto from 'crypto';

export default class SornaAPILib {
  constructor() {
    this.code = null;
    this.accessKey = null;
    this.secretKey = null;
    this.signKey = null;
    this.apiVersion = 'v1.20160915';
    this.hash_type = 'sha256';
    this.baseURL = 'https://api.sorna.io';
    this.kernelId = null;
    this.kernelType = null;
  }

  getAccessKey() {
    if (this.accessKey == null) {
      console.debug('No access key is given');
    }
    return this.accessKey;
  }

  getSecretKey() {
    if (this.secretKey == null) {
      console.debug('No secret key is given');
    }
    return this.secretKey;
  }

  setAccessKey(key) {
    this.accessKey = key;
  }

  setSecretKey(key) {
    this.secretKey = key;
  }

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
  }

  createKernel(kernelType) {
    let parentObj = this;
    let requestBody = {
      "lang": kernelType,
      "clientSessionToken": "sorna-live-code-runner",
      "resourceLimits": {
        "maxMem": 0,
        "timeout": 0
      }
    };
    let requestInfo = this.newRequest('POST', '/v1/kernel/create', requestBody);
    return fetch(this.baseURL + '/v1/kernel/create', requestInfo);
  }

  destroyKernel(kernelId) {
    let requestInfo = this.newRequest('DELETE', `/v1/kernel/${kernelId}`, null);
    return fetch(this.baseURL + '/v1/kernel/'+kernelId, requestInfo);
  }

  refreshKernel(kernelId) {
    let requestInfo = this.newRequest('PATCH', `/v1/kernel/${kernelId}`, null);
    return fetch(this.baseURL + '/v1/kernel/'+kernelId, requestInfo)
  }

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
  }

  runCode(code, kernelId) {
    let requestBody = {
      "codeId": crypto.createHash('md5').update(code).digest("hex"),
      "code": code
    };
    let requestInfo = this.newRequest('POST', `/v1/kernel/${kernelId}`, requestBody);
    return fetch(this.baseURL + '/v1/kernel/' + kernelId, requestInfo);
  }

  getAuthenticationString(method, queryString, dateValue, bodyValue) {
    return ( method + '\n' + queryString + '\n' + dateValue + '\n' + 'host:api.sorna.io'+ '\n'+'content-type:application/json' + '\n' + 'x-sorna-version:'+this.apiVersion + '\n' + crypto.createHash(this.hash_type).update(bodyValue).digest('hex'));
  }

  getCurrentDate(now) {
    let year = (`0000${now.getUTCFullYear()}`).slice(-4);
    let month = (`0${now.getUTCMonth() + 1}`).slice(-2);
    let day = (`0${now.getUTCDate()}`).slice(-2);
    let t = year + month + day;
    return t;
  }

  sign(key, key_encoding, msg, digest_type) {
    let kbuf = new Buffer(key, key_encoding);
    let hmac = crypto.createHmac(this.hash_type, kbuf);
    hmac.update(msg, 'utf8');
    return hmac.digest(digest_type);
  }

  getSignKey(secret_key, now) {
    let k1 = this.sign(secret_key, 'utf8', this.getCurrentDate(now), 'binary');
    let k2 = this.sign(k1, 'binary', 'api.sorna.io', 'binary');
    return k2;
  }
}
