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

import assert from 'node:assert';
import { verifyConditions } from '../src/index.js';
import { Nock } from './utils.js';
import { clearContext } from '../src/utils.js';

const DEFAULT_CONTEXT = (env = {}) => ({
  env: { ...env },
  logger: console,
});

describe('verify-conditions tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
    clearContext();
  });

  it('fails if no modelId is defined', async () => {
    await assert.rejects(verifyConditions({}, DEFAULT_CONTEXT()), new Error('Environment variable SKMS_MODEL_ID or `modelId` config is not set, unable to create CMRs in SKMS'));
  });

  it('fails if no SKMS_USERNAME is defined', async () => {
    await assert.rejects(verifyConditions({
      modelId: 1234,
    }, DEFAULT_CONTEXT()), new Error('Environment variable(s) SKMS_USERNAME,SKMS_PASSKEY not set, unable to create CMRs in SKMS'));
  });

  it('fails if no SKMS_PASSKEY is defined', async () => {
    await assert.rejects(verifyConditions({
      modelId: 1234,
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
    })), new Error('Environment variable(s) SKMS_PASSKEY not set, unable to create CMRs in SKMS'));
  });

  it('fails if no SKMS_PASSKEY is defined', async () => {
    await assert.rejects(verifyConditions({
      modelId: 1234,
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
    })), new Error('Environment variable(s) SKMS_PASSKEY not set, unable to create CMRs in SKMS'));
  });

  it('fails if user is not authorized', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(200, {
        status: 'error',
        messages: [
          {
            type: 'error',
            message: 'Your Username or Password is incorrect.',
            error_code: '',
            error_data: [],
          },
        ],
      });
    await assert.rejects(verifyConditions({
      modelId: 1234,
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-user',
    })), new Error('Your Username or Password is incorrect.'));
  });

  it('fails if model is not auto approved', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(200, {
        data: {
          can_current_user_submit: false,
          reasons_for_inability_to_submit: [
            'The specified CMR (Test CMR) is not a Change Model.',
          ],
        },
      });
    await assert.rejects(verifyConditions({
      modelId: 1234,
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    })), new Error('CMR Model is not valid.'));
  });

  it('succeeds if model is auto approved', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        assert.strictEqual(payload.cmr_key, 123);
        return [200, {
          data: {
            can_current_user_submit: true,
          },
        }];
      });
    await verifyConditions({
      modelId: 123,
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    }));
  });

  it('succeeds if model is auto approved (different api host)', async () => {
    nock('https://localhost:8000')
      .post('/web_api/')
      .reply(200, {
        data: {
          can_current_user_submit: true,
        },
      });
    await verifyConditions({
      modelId: 123,
      apihost: 'localhost:8000',
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    }));
  });

  it('succeeds if model is auto approved (via env var)', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        assert.strictEqual(payload.cmr_key, '123');
        return [200, {
          data: {
            can_current_user_submit: true,
          },
        }];
      });
    await verifyConditions({
    }, DEFAULT_CONTEXT({
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
      SKMS_MODEL_ID: '123',
    }));
  });
});
