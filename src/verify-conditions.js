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

/**
 * Verified the release conditions
 * @see https://semantic-release.gitbook.io/semantic-release/developer-guide/plugin#verifyconditions
 * @param {SKMSPluginConfig} pluginConfig
 * @param {SKMSPluginEnv} env
 * @param logger
 */
export async function verifyConditions(pluginConfig, { env, logger }) {
  const modelId = env.SKMS_MODEL_ID ?? pluginConfig.modelId;
  if (!modelId) {
    throw new Error('Environment variable SKMS_MODEL_ID or `modelId` config is not set, unable to create CMRs in SKMS');
  }
  const client = getSKMSClient(pluginConfig, { env });

  // validate if change model exists and can be used for pre approved CMRs
  const dao = new CmrDao(client);
  logger.log(`validating change model ${modelId} on ${client.apiUrl}`);
  const data = await dao.canPreApprovedChangeModelBeSubmitted(modelId);
  if (data.can_current_user_submit) {
    logger.log('CMR model is valid. A CMR will be created.');
    return;
  }
  logger.error('CMR model is not valid:');
  for (const msg of data.reasons_for_inability_to_submit) {
    logger.error(`- ${msg}`);
  }
  throw new Error('CMR Model is not valid.');
}
