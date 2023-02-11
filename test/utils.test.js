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
import { getConfig, replaceParams } from '../src/utils.js';

describe('getConfig and replaceParams tests', () => {
  const CWD = resolve(__testdir, 'dev', 'example');

  it('replaces the config and env parameters', async () => {
    assert.strictEqual(await replaceParams('this is model ${modelId} on ${env.CI_URL}', {
      modelId: 1234,
    }, {
      cwd: CWD,
      env: {
        CI_URL: 'https://localhost:1234/',
      },
    }), 'this is model 1234 on https://localhost:1234/');
  });

  it('replaces the next release parameter', async () => {
    assert.strictEqual(await replaceParams('released version ${nextRelease.name}', {
    }, {
      cwd: CWD,
      nextRelease: {
        name: 'v1.2.3',
      },
    }), 'released version v1.2.3');
  });

  it('replaces the a package json parameter', async () => {
    assert.strictEqual(await replaceParams('release package ${pkg.name}', {
    }, {
      cwd: CWD,
    }), 'release package test-service');
  });

  it('return the config value', async () => {
    assert.strictEqual(await getConfig('summary', 'default summary', {
      summary: 'hello release.',
    }, {
      cwd: CWD,
    }), 'hello release.');
  });

  it('return the default value', async () => {
    assert.strictEqual(await getConfig('notes', 'released ${pkg.name}', {
      summary: 'hello release.',
    }, {
      cwd: CWD,
    }), 'released test-service');
  });
});
