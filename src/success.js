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
import { CmrDao } from './api/CmrDao.js';
import {
  DEFAULT_EXPLANATION,
  DEFAULT_NOTES,
  getConfig,
  getSKMSClient,
  PLUGIN_CONTEXT,
} from './utils.js';

/**
 * Release was successfully performed. Complete the CMR
 * @see https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#success
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SemanticReleaseContext} ctx
 */
export async function success(pluginConfig, ctx) {
  const { logger } = ctx;
  const client = getSKMSClient(pluginConfig, ctx);
  // this is set during the prepare step
  const { cmrId, startDate } = PLUGIN_CONTEXT;

  if (!cmrId) {
    logger.log('No CMR was created during prepare. Nothing to do.');
    return;
  }

  // if the maintenance window has not started, wait
  const waitTime = startDate.getTime() - Date.now();
  if (waitTime > 0) {
    logger.log(`Maintenance window not started yet. Waiting for ${Math.ceil(waitTime / 1000)} seconds...`);
    // eslint-disable-next-line no-promise-executor-return
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    // record wait time for tests
    PLUGIN_CONTEXT.waitTime = waitTime;
  }

  const dao = new CmrDao(client);
  await dao.completeCmr({
    cmrId,
    explanation: await getConfig('explanation', DEFAULT_EXPLANATION, pluginConfig, ctx),
    notes: await getConfig('notes', DEFAULT_NOTES, pluginConfig, ctx),
  });
  logger.log(`Completed CMR: ${cmrId}`);
  logger.log(`https://${client.apiUrl.host}/sst.cm.cmr/view/?cmr_id=${cmrId}`);
}
