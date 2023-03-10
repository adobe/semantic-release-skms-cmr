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
  if (process.argv.length < 3) {
    console.log('usage: validate-model <modelId>');
    process.exit(1);
  }
  const client = new SKMSClient({
    username: process.env.SKMS_USERNAME,
    passkey: process.env.SKMS_PASSKEY,
    skmsHost: '10.27.9.191',
    verifySSL: false,
  });
  const dao = new CmrDao(client);
  const data = await dao.canPreApprovedChangeModelBeSubmitted(process.argv[2]);
  console.log(data);
}

run().catch(console.error);
