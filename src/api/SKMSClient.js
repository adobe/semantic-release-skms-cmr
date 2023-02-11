/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-underscore-dangle */
import os from 'os';
import fs from 'fs/promises';
import { h1NoCache, timeoutSignal } from '@adobe/fetch';
import { parse } from 'cookie';
import { StatusError } from './StatusError.js';
import { SKMSResponseError } from './SKMSResponseError.js';

const CLIENT_TYPE = 'node.https';
const CLIENT_VERSION = '1.0';

const PROD_API_HOST = 'api.skms.adobe.com';

/**
 * @typedef SKMSClientOptions
 * @property {string} username
 * @property {string} passkey
 * @property {string} [skmsHost = 'api.skms.adobe.com']
 * @property {boolean} [debug = false]
 * @property {boolean} [verifySSL = true]
 * @property {number} [requestTimeout = 25000]
 */

/**
 * Class to allow easy access to the SKMS Web API.
 */
export class SKMSClient {
  /**
   * Serializes a date to the SKMS format: `2023-02-09 10:34:24`
   * @param {Date} date
   * @return {string}
   */
  static serializeDate(date) {
    const p = date.toISOString().split(/[T.]/);
    return `${p[0]} ${p[1]} UTC`;
  }

  /**
   * @param {SKMSClientOptions} options
   */
  constructor(options) {
    const {
      username,
      passkey,
      skmsHost = PROD_API_HOST,
      debug = false,
      verifySSL,
      requestTimeout = 25000,
    } = options;
    this.username = username;
    this.passkey = passkey;
    this.apiUrl = new URL(`https://${skmsHost}/web_api/`);
    this.sessionCookieName = skmsHost === PROD_API_HOST ? 'SkmsSID' : 'dev_SkmsSID';
    this.debug = debug;
    this.verifySSL = verifySSL;
    if (this.verifySSL === undefined) {
      this.verifySSL = skmsHost === PROD_API_HOST;
    }
    this.requestTimeout = requestTimeout;
  }

  /**
   * Enables Skms Session Optimization by storing session information in a local file that will be
   * reused in future requests.
   * @param {string} sessionStorageFile The path to the file where session information should be
   *                                    stored.
   */
  async withSKMSSessionStorage(sessionStorageFile) {
    try {
      const data = JSON.parse(await fs.readFile(sessionStorageFile, 'utf-8'));
      if (data.skms_session_id) {
        this.setSkmsSessionId(data.skms_session_id);
      }
      if (data.skms_csrf_token) {
        this.setSkmsCsrfToken(data.skms_csrf_token);
      }
    } catch (e) {
      // ignore
    }
    this.sessionStorageFile = sessionStorageFile;
    return this;
  }

  /**
   * Sends a request based on the passed in object_name, method_name, and method_params
   * @param {string} objectName The name of the object to access via the API.
   * @param {string} methodName The name of the method to access via the API.
   * @param {object} params An associative array of key/value pairs that represent parameters that
   * will be passed to the method
   * @return {object} response
   */
  async sendRequest(objectName, methodName, params) {
    const data = { ...params };
    // Debug
    if (this.debug) {
      data._debug = true;
    }
    // console.log(params);

    // Tracking Data
    data._client_type = CLIENT_TYPE;
    data._client_ver = CLIENT_VERSION;
    data._client_hostname = os.hostname();
    data._client_username = os.userInfo().username;

    // Username and Passkey
    if (this.username && this.passkey) {
      data._username = this.username;
      data._passkey = this.passkey;
    }

    // CSRF
    if (this.csrfToken) {
      data.csrf_token = this.csrfToken;
    }

    data._object = objectName;
    data._method = methodName;

    const body = new URLSearchParams({ _parameters: JSON.stringify(data) }).toString();
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body.length,
    };

    // Add Session Cookie (if applicable)
    if (this.sessionId) {
      headers.Cookie = `${this.sessionCookieName}=${encodeURIComponent(this.sessionId)}`;
    }

    const context = h1NoCache({
      rejectUnauthorized: this.verifySSL,
    });
    const signal = timeoutSignal(this.requestTimeout);
    try {
      const res = await context.fetch(this.apiUrl, {
        signal,
        method: 'POST',
        body,
        headers,
      });

      if (!res.ok) {
        throw new StatusError(`Error invoking api ${this.apiUrl}: ${await res.text()}`, res.status);
      }

      const cookies = parse(res.headers.get('set-cookie') || '');
      if (cookies[this.sessionCookieName]) {
        this.sessionId = cookies[this.sessionCookieName];
      }
      if (cookies.csrf_token) {
        this.csrfToken = cookies.csrf_token;
      }

      // Check for session storage
      if (this.sessionStorageFile) {
        await fs.writeFile(this.sessionStorageFile, JSON.stringify({
          skms_session_id: this.sessionId,
          skms_csrf_token: this.csrfToken,
        }));
      }

      // read response
      const resp = await res.json();
      if (resp.status && resp.status !== 'success') {
        const errors = resp.messages.filter((msg) => msg.type === 'error');
        throw new SKMSResponseError(resp.status, errors);
      }
      return resp.data;
    } finally {
      await context.reset();
      signal.clear();
    }
  }
}
