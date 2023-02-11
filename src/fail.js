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
import { CmrDao, COMPLETE_STATUS_CANCEL_NA } from './api/CmrDao.js';
import {
  DEFAULT_CANCELATION_NOTES,
  DEFAULT_NOTES,
  getConfig,
  getSKMSClient,
  PLUGIN_CONTEXT,
} from './utils.js';

/**
 * Release hs failed performed. Cancel or Complete the CMR as canceled
 * @see https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#fail
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SemanticReleaseContext} ctx
 */
export async function fail(pluginConfig, ctx) {
  const { logger } = ctx;
  const client = getSKMSClient(pluginConfig, ctx);
  // this is set during the prepare step
  const { cmrId } = PLUGIN_CONTEXT;

  // try to cancel the cmr
  const dao = new CmrDao(client);
  try {
    await dao.cancelCmr({
      cmrId,
      cancelationNotes: await getConfig('cancelationNotes', DEFAULT_CANCELATION_NOTES, pluginConfig, ctx),
    });
    logger.log(`Cancelled CMR: ${cmrId}`);
    logger.log(`https://${client.apiUrl.host}/sst.cm.cmr/view/?cmr_id=${cmrId}`);
    return;
  } catch (e) {
    // ignore
  }

  logger.log('unable to cancel CMR. trying to mark as completed.');

  await dao.completeCmr({
    cmrId,
    status: COMPLETE_STATUS_CANCEL_NA,
    explanation: await getConfig('cancelationNotes', DEFAULT_CANCELATION_NOTES, pluginConfig, ctx),
    notes: await getConfig('notes', DEFAULT_NOTES, pluginConfig, ctx),
  });
  logger.log(`Completed CMR (cancelled): ${cmrId}`);
  logger.log(`https://${client.apiUrl.host}/sst.cm.cmr/view/?cmr_id=${cmrId}`);
}
