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
export class SKMSResponseError extends Error {
  constructor(status, errors) {
    super();
    this.status = status;
    this.messages = errors;
    if (errors.length > 1) {
      this.message = [
        `The API returned ${errors.length} error messages:`,
        ...errors.map((msg, i) => `${i + 1}. ${msg.message}`),
      ].join('\n');
    } else if (errors.length === 1) {
      // eslint-disable-next-line prefer-destructuring
      this.message = errors[0].message;
    } else {
      this.message = `The status was returned as "${status}" but no errors were in the messages array.`;
    }
  }
}
