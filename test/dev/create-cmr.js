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
/* eslint-disable no-console */
import { config } from 'dotenv';
import { SKMSClient } from '../../src/api/SKMSClient.js';
import { CmrDao } from '../../src/api/CmrDao.js';

config();
async function run() {
  const client = new SKMSClient({
    username: process.env.SKMS_USERNAME,
    passkey: process.env.SKMS_PASSKEY,
    skmsHost: '10.27.9.191',
    verifySSL: false,
  });
  const dao = new CmrDao(client);

  const startDate = new Date();
  startDate.setSeconds(startDate.getSeconds() + 30);

  const endDate = new Date();
  endDate.setMinutes(endDate.getMinutes() + 5);

  const data = await dao.createPreApprovedCmr({
    startDate,
    endDate,
    modelId: 654955,
    summary: 'Automated CI/CD release of helix-pipeline',
    additionalNotes: 'https://app.circleci.com/pipelines/github/adobe/helix-pipeline-service/2544',
  });
  const {
    cmr_id: cmrId,
  } = data;
  console.log(`CMR Created: ${cmrId}\nhttps://${client.apiUrl.host}/sst.cm.cmr/view/?cmr_id=${cmrId}`);
}

run().catch(console.error);
