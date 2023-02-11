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
import { success } from '../src/index.js';
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

describe('success tests', () => {
  let nock;
  beforeEach(() => {
    nock = new Nock();
  });

  afterEach(() => {
    nock.done();
    clearContext();
  });

  it('completes a cmr', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        assert.strictEqual(payload.cmr_id, 1234);
        assert.strictEqual(payload.completion_status, 'Completed - According to implementation plan');
        assert.strictEqual(payload.explanation, 'released test-service@4.1.2');
        assert.strictEqual(payload.notes, 'https://circleci.com/foo/bar');
        return [200, {
          data: {
            cmr_id: 1234,
          },
        }];
      });
    PLUGIN_CONTEXT.cmrId = 1234;
    PLUGIN_CONTEXT.startDate = new Date();
    await success({
      modelId: 123,
    }, DEFAULT_CONTEXT({
      CIRCLE_BUILD_URL: 'https://circleci.com/foo/bar',
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    }));
    assert.strictEqual(PLUGIN_CONTEXT.cmrId, 1234);
  });

  it('completes a cmr after waiting for maintenance window', async () => {
    nock('https://api.skms.adobe.com')
      .post('/web_api/')
      .reply((_, body) => {
        const payload = JSON.parse(new URLSearchParams(body).get('_parameters'));
        assert.strictEqual(payload.cmr_id, 1234);
        assert.strictEqual(payload.completion_status, 'Completed - According to implementation plan');
        assert.strictEqual(payload.explanation, 'released test-service@4.1.2');
        assert.strictEqual(payload.notes, 'https://circleci.com/foo/bar');
        return [200, {
          data: {
            cmr_id: 1234,
          },
        }];
      });
    PLUGIN_CONTEXT.cmrId = 1234;
    PLUGIN_CONTEXT.startDate = new Date(Date.now() + 1000);
    await success({
      modelId: 123,
    }, DEFAULT_CONTEXT({
      CIRCLE_BUILD_URL: 'https://circleci.com/foo/bar',
      SKMS_USERNAME: 'test-user',
      SKMS_PASSKEY: 'test-key',
    }));
    assert.strictEqual(PLUGIN_CONTEXT.cmrId, 1234);
    assert.ok(PLUGIN_CONTEXT.waitTime);
  });
});
