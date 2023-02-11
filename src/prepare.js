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
import { getSKMSClient } from './utils.js';
import { SKMSClient } from './api/SKMSClient.js';

/**
 * Prepare the release by creating a CMR
 * @see https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#prepare
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SKMSPluginEnv} env
 * @param logger
 */
export async function prepare(pluginConfig, { env, logger, ...rest }) {
  const client = getSKMSClient(pluginConfig, { env });

  console.log(pluginConfig, rest);

  const startDate = new Date();
  startDate.setSeconds(startDate.getSeconds() + (pluginConfig.maintStart ?? 10));

  const endDate = new Date();
  endDate.getSeconds(endDate.getSeconds() + (pluginConfig.maintDuration ?? 600));

  logger.log(`creating pre approved CMR with maintenance window from ${SKMSClient.serializeDate(startDate)} to ${SKMSClient.serializeDate(startDate)} ${dry}`);

  // const data = await dao.createPreApprovedCmr({
  //   startDate,
  //   endDate,
  //   modelId: 654955,
  //   summary: 'Automated CI/CD release of helix-pipeline',
  //   additionalNotes: 'https://app.circleci.com/pipelines/github/adobe/helix-pipeline-service/2544',
  // });
  // const {
  //   cmr_id: cmrId,
  // } = data;
  // console.log(`CMR Created: ${cmrId}\nhttps://${client.apiUrl.host}/sst.cm.cmr/view/?cmr_id=${cmrId}`);
}
