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
import { SKMSClient } from './SKMSClient.js';

export class CmrDao {
  constructor(client) {
    this.client = client;
  }

  async searchCMR(cmrId) {
    return this.client.sendRequest('CmrDao', 'search', {
      query: `SELECT * WHERE cmr_id=${cmrId}`,
    });
  }

  async createPreApprovecCmr({
    startDate,
    endDate,
    modelId,
    summary,
    additionalNotes,
  }) {
    return this.client.sendRequest('CmrDao', 'createCmrFromPreapprovedChangeModel', {
      change_executor: process.env.SKMS_USERNAME,
      maintenance_window_start_time: SKMSClient.serializeDate(startDate),
      maintenance_window_end_time: SKMSClient.serializeDate(endDate),
      preapproved_change_model_id: modelId,
      summary,
      additional_notes: additionalNotes,
    });
  }

  async completeCmr({
    cmrId,
    explanation,
  }) {
    return this.client.sendRequest('CmrDao', 'completeCmr', {
      cmr_id: cmrId,
      completion_status: 'Completed - According to implementation plan',
      explanation,
    });
  }

  async cancelCmr({
    cmrId,
    cancelationNotes,
  }) {
    return this.client.sendRequest('CmrDao', 'cancelCmr', {
      cmr_id: cmrId,
      cancellation_notes: cancelationNotes,
    });
  }
}
