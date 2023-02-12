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

/* eslint-env mocha */
/* eslint-disable no-template-curly-in-string */

import { resolve } from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { parse, serialize } from 'cookie';

import assert from 'node:assert';
import { createRequire } from 'node:module';
import { Nock } from '../utils.js';
import { SKMSClient } from '../../src/api/SKMSClient.js';
import { CmrDao } from '../../src/api/CmrDao.js';
import { StatusError } from '../../src/api/StatusError.js';

const require = createRequire(import.meta.url);
const pkgJson = require('../../package.json');

describe('SKMS Client Tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
  });

  it('creates a client with default params', async () => {
    const client = new SKMSClient({});
    assert.deepStrictEqual(Object.fromEntries(Object.entries(client)), {
      apiUrl: new URL('https://api.skms.adobe.com/web_api/'),
      debug: false,
      passkey: undefined,
      requestTimeout: 25000,
      sessionCookieName: 'SkmsSID',
      username: undefined,
      verifySSL: true,
    });
  });

  it('can set username, passkey and host', async () => {
    const client = new SKMSClient({
      skmsHost: 'localhost:8000',
      username: 'test-user',
      passkey: 'test-key',
    });
    assert.deepStrictEqual(Object.fromEntries(Object.entries(client)), {
      apiUrl: new URL('https://localhost:8000/web_api/'),
      debug: false,
      passkey: 'test-key',
      requestTimeout: 25000,
      sessionCookieName: 'dev_SkmsSID',
      username: 'test-user',
      verifySSL: false,
    });
  });

  it('can send a request', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        // eslint-disable-next-line no-underscore-dangle
        assert.deepStrictEqual(payload, {
          _client_hostname: os.hostname(),
          _client_username: os.userInfo().username,
          _client_type: pkgJson.name,
          _client_ver: pkgJson.version,
          _method: 'search',
          _object: 'CmrDao',
          _passkey: 'test-key',
          _username: 'test-user',
          _debug: true,
          query: 'SELECT * WHERE cmr_id=1234',
        });
        return [200, {
          data: {
            results: [{ cmr_id: '654977' }],
          },
        }];
      });
    const client = new SKMSClient({ username: 'test-user', passkey: 'test-key', debug: true });
    const dao = new CmrDao(client);
    const data = await dao.searchCMR(1234);
    assert.deepStrictEqual(data, {
      results: [{ cmr_id: '654977' }],
    });
  });

  it('stores and reuses session information', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(
        200,
        { data: { results: [{ cmr_id: '654977' }] } },
        {
          'set-cookie': [
            serialize('SkmsSID', 'sid'),
            serialize('csrf_token', 'csrf-token'),
          ].join(';'),
        },
      )
      .post('/web_api/')
      .reply(function fn(_, body) {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        const cookies = parse(this.req.headers.cookie);
        assert.strictEqual(payload.csrf_token, 'csrf-token');
        assert.deepStrictEqual(cookies, {
          SkmsSID: 'sid',
        });
        return [200, {
          data: {
            results: [{ cmr_id: '654977' }],
          },
        }];
      });
    const client = new SKMSClient({ username: 'test-user', passkey: 'test-key' });
    const dao = new CmrDao(client);
    const data1 = await dao.searchCMR(1234);
    assert.deepStrictEqual(data1, {
      results: [{ cmr_id: '654977' }],
    });
    const data2 = await dao.searchCMR(1234);
    assert.deepStrictEqual(data2, {
      results: [{ cmr_id: '654977' }],
    });
  });

  it('stores and reuses session information via a session file', async () => {
    const sessionFile = resolve(__testdir, 'tmp', `skms_session-${Date.now()}.json`);
    try {
      await fs.mkdir(resolve(__testdir, 'tmp'));
    } catch (e) {
      // ignore
    }

    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(
        200,
        { data: { results: [{ cmr_id: '654977' }] } },
        {
          'set-cookie': [
            serialize('SkmsSID', 'sid'),
            serialize('csrf_token', 'csrf-token'),
          ].join(';'),
        },
      )
      .post('/web_api/')
      .reply(function fn(_, body) {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        const cookies = parse(this.req.headers.cookie);
        assert.strictEqual(payload.csrf_token, 'csrf-token');
        assert.deepStrictEqual(cookies, {
          SkmsSID: 'sid',
        });
        return [200, {
          data: {
            results: [{ cmr_id: '654977' }],
          },
        }];
      });
    const client1 = await new SKMSClient({ username: 'test-user', passkey: 'test-key' })
      .withSKMSSessionStorage(sessionFile);
    const dao1 = new CmrDao(client1);
    const data1 = await dao1.searchCMR(1234);
    assert.deepStrictEqual(data1, {
      results: [{ cmr_id: '654977' }],
    });

    const client2 = await new SKMSClient({ username: 'test-user', passkey: 'test-key' })
      .withSKMSSessionStorage(sessionFile);
    const dao2 = new CmrDao(client2);
    const data2 = await dao2.searchCMR(1234);
    assert.deepStrictEqual(data2, {
      results: [{ cmr_id: '654977' }],
    });

    await fs.unlink(sessionFile);
  });

  it('handles http error from api', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(400, 'wrong payload.');
    const client = new SKMSClient({ username: 'test-user', passkey: 'test-key' });
    const dao = new CmrDao(client);
    await assert.rejects(dao.searchCMR(1234), new StatusError('Error invoking api https://api.skms.adobe.com/web_api/: 400 wrong payload.', 400));
  });

  it('handles skms error from api', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(200, {
        status: 'error',
        messages: [{ type: 'error', message: 'no good' }],
      });
    const client = new SKMSClient({ username: 'test-user', passkey: 'test-key' });
    const dao = new CmrDao(client);
    await assert.rejects(dao.searchCMR(1234), new Error('no good'));
  });

  it('handles multiple skms error from api', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(200, {
        status: 'error',
        messages: [
          { type: 'error', message: 'no good' },
          { type: 'error', message: 'and other problems' },
        ],
      });
    const client = new SKMSClient({ username: 'test-user', passkey: 'test-key' });
    const dao = new CmrDao(client);
    await assert.rejects(dao.searchCMR(1234), new Error('The API returned 2 error messages:\n1. no good\n2. and other problems'));
  });

  it('handles skms error from api with no error message', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(200, {
        status: 'error',
        messages: [
          { type: 'info', message: 'not so good' },
        ],
      });
    const client = new SKMSClient({ username: 'test-user', passkey: 'test-key' });
    const dao = new CmrDao(client);
    await assert.rejects(dao.searchCMR(1234), new Error('The status was returned as "error" but no errors were in the messages array.'));
  });
});
