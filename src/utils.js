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
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SKMSClient } from './api/SKMSClient.js';

/**
 * @typedef SKMSPluginConfig
 * @property {string} modelId
 * @property {string} apihost
 * @property {string} summary
 * @property {string} additionalNotes
 * @property {string} explanation
 * @property {string} cancelationNotes
 * @property {number} maintStart
 * @property {number} maintDuration
 *
 * @property {number} cmrId CMR ID once created
 * @property {SKMSClient} skmsClient cached client
 */

/**
 * @typedef SKMSPluginEnv
 * @property {string} SKMS_USERNAME
 * @property {string} SKMS_PASSKEY
 * @property {string} SKMS_MODEL_ID
 */

/**
 * @typedef SemanticReleaseContext
 * @property {SKMSPluginEnv} env
 * @property {object} nextRelease
 * @property {object} logger
 * @property {object} pkgJson
 */

/**
 * Gets or creates the skms client
 * @param {SKMSPluginConfig} pluginConfig
 * @param {object} env
 * @returns {SKMSClient}
 */
export function getSKMSClient(pluginConfig, { env }) {
  if (!pluginConfig.skmsClient) {
    const required = ['SKMS_USERNAME', 'SKMS_PASSKEY'];
    for (let i = 0; i < required.length; i += 1) {
      if (env[required[i]]) {
        required.splice(i, 1);
        i -= 1;
      }
    }
    if (required.length) {
      throw new Error(`Environment variable(s) ${required} not set, unable to create CMRs in SKMS`);
    }
    const options = /** @type SKMSClientOptions */ {
      username: env.SKMS_USERNAME,
      passkey: env.SKMS_PASSKEY,
    };
    if (pluginConfig.apihost) {
      options.skmsHost = pluginConfig.apihost;
    }
    // eslint-disable-next-line no-param-reassign
    pluginConfig.skmsClient = new SKMSClient(options);
  }
  return pluginConfig.skmsClient;
}

/**
 * Replaces the params in the given string
 * @param {string} string
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SemanticReleaseContext} ctx
 */
export async function replaceParams(string, pluginConfig, ctx) {
  if (!ctx.pkgJson) {
    ctx.pkgJson = JSON.parse(await readFile(resolve(ctx.cwd, 'package.json'), 'utf-8'));
  }
  return string.replaceAll(/\$\{([^}]+)\}/g, (_, pat) => {
    if (pat.startsWith('env.')) {
      return ctx.env[pat.substring(4)];
    }
    if (pat.startsWith('nextRelease.')) {
      return ctx.nextRelease[pat.substring(12)];
    }
    if (pat.startsWith('pkg.')) {
      return ctx.pkgJson[pat.substring(4)];
    }
    return pluginConfig[pat];
  });
}

/**
 * Returns the plugin config property respecting some parameter replacements
 * @param {string} name
 * @param {string} defaultValue
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SemanticReleaseContext} ctx
 */
export async function getConfig(name, defaultValue, pluginConfig, ctx) {
  return replaceParams(pluginConfig[name] ?? defaultValue, pluginConfig, ctx);
}
