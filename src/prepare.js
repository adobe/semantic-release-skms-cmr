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
import { getConfig, getSKMSClient } from './utils.js';
import { SKMSClient } from './api/SKMSClient.js';

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_SUMMARY = 'Automated CI/CD release of ${pkg.name}';

// eslint-disable-next-line no-template-curly-in-string
const DEFAULT_NOTES = '${env.CIRCLE_BUILD_URL}';

/**
 * Prepare the release by creating a CMR
 * @see https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#prepare
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SemanticReleaseContext} ctx
 */
export async function prepare(pluginConfig, ctx) {
  const { logger } = ctx;
  const client = getSKMSClient(pluginConfig, ctx);

  const startDate = new Date();
  startDate.setSeconds(startDate.getSeconds() + (pluginConfig.maintStart ?? 20));

  const endDate = new Date();
  endDate.setSeconds(endDate.getSeconds() + (pluginConfig.maintDuration ?? 600));

  logger.log(`creating pre approved CMR with maintenance window from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const dao = new CmrDao(client);
  const data = await dao.createPreApprovedCmr({
    startDate,
    endDate,
    modelId: pluginConfig.modelId,
    summary: await getConfig('summary', DEFAULT_SUMMARY, pluginConfig, ctx),
    additionalNotes: await getConfig('additionalNotes', DEFAULT_NOTES, pluginConfig, ctx),
  });
  const {
    cmr_id: cmrId,
  } = data;
  logger.log(`CMR Created: ${cmrId}\nhttps://${client.apiUrl.host}/sst.cm.cmr/view/?cmr_id=${cmrId}`);
  // remember cmrId
  // eslint-disable-next-line no-param-reassign
  pluginConfig.cmrId = cmrId;
}
