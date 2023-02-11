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
import assert from 'node:assert';
import { fail } from '../src/index.js';
import { Nock } from './utils.js';
import { clearContext, PLUGIN_CONTEXT } from '../src/utils.js';

const DEFAULT_CONTEXT = (env = {}) => ({
  cwd: resolve(__testdir, 'dev', 'example'),
  nextRelease: {
    version: '4.1.2',
    name: 'v4.1.2',
  },
  env: {
    ...env,
  },
  logger: console,
});

describe('fail tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
    clearContext();
  });

  it('cancels a cmr', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        // eslint-disable-next-line no-underscore-dangle
        assert.strictEqual(payload._method, 'cancelCmr');
        assert.strictEqual(payload.cmr_id, 1234);
        assert.strictEqual(payload.cancellation_notes, 'semantic release failed');
        return [200, {
          data: {
            cmr_id: 1234,
          },
        }];
      });
    PLUGIN_CONTEXT.cmrId = 1234;
    await fail({
      modelId: 123,
    }, DEFAULT_CONTEXT({
      CIRCLE_BUILD_URL: 'https://circleci.com/foo/bar',
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    }));
  });

  it('completes a cmr after cancel has failed', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply(200, {
        status: 'error',
        messages: [
          {
            type: 'error',
            message: 'This CMR cannot be canceled.',
            error_code: 'CMR_CANNOT_CANCEL',
            error_data: [],
          },
        ],
      })
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        // eslint-disable-next-line no-underscore-dangle
        assert.strictEqual(payload._method, 'completeCmr');
        assert.strictEqual(payload.cmr_id, 1234);
        assert.strictEqual(payload.completion_status, 'Canceled - Resources not available');
        assert.strictEqual(payload.explanation, 'semantic release failed');
        assert.strictEqual(payload.notes, 'https://circleci.com/foo/bar');
        return [200, {
          data: {
            cmr_id: 1234,
          },
        }];
      });
    PLUGIN_CONTEXT.cmrId = 1234;
    await fail({
      modelId: 123,
    }, DEFAULT_CONTEXT({
      CIRCLE_BUILD_URL: 'https://circleci.com/foo/bar',
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    }));
  });
});
