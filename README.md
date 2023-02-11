# Semantic Release SKMS CMR

> Semantic release plugin that integrates with SKMS Change Management System

| Step               | Description                                                                                                                  |
|--------------------|------------------------------------------------------------------------------------------------------------------------------|
| `verifyConditions` | Verify that the `SKMS_USERNAME` and `SKMS_PASSKEY` environment variable has been set and that it is able to access the SKMS API |
| `prepare`          | Create a pre approved SKMS CMR                                                                                               |
| `success`          | Complete the CMR                                                                                                             |
| `fail`             | Cancel the CMR                                                                                                               |

## Status
[![codecov](https://img.shields.io/codecov/c/github/adobe/semantic-release-skms-cmr.svg)](https://codecov.io/gh/adobe/semantic-release-skms-cmr)
[![CircleCI](https://img.shields.io/circleci/project/github/adobe/semantic-release-skms-cmr.svg)](https://circleci.com/gh/adobe/semantic-release-skms-cmr)
[![GitHub license](https://img.shields.io/github/license/adobe/semantic-release-skms-cmr.svg)](https://github.com/adobe/semantic-release-skms-cmr/blob/master/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues/adobe/semantic-release-skms-cmr.svg)](https://github.com/adobe/semantic-release-skms-cmr/issues)
[![LGTM Code Quality Grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/adobe/semantic-release-skms-cmr.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/adobe/semantic-release-skms-cmr)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

## Installation

```bash
$ npm install @adobe/semantic-release-skms-cmr
```


## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```js
{
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ['@semantic-release/exec', {
      prepareCmd: 'npm run deploy && npm run test-postdeploy',
      publishCmd: 'npm run deploy-routes',
      successCmd: 'echo "${nextRelease.version}" > released.txt',
    }],
    // note that the skms plugins needs to be defined after the exec plugin, so that the CMR can
    // is not opened if the post-deploy steps fail during the prepare step.
    ["@adobe/semantic-release-skms-cmr", {
      modelId: 1234,
      summary: "CircleCI release of ${pkg.name} ${nextRelease.name}"
    }],
  ]
}
```

## Configuration

### Environment Variables

| Variable        | Description                               |
|-----------------|-------------------------------------------|
| `SKMS_USERNAME` | The username for authenticating with SKMS |
| `SKMS_PASSKEY`  | The passkey for authenticating with SKMS  |
| `SKMS_MODEL_ID` | The ID of the pre approved model          |

### Options

| Parameter          | Type     | Required | Description                                      | default                                                      |
|--------------------|----------|----------|--------------------------------------------------|--------------------------------------------------------------|
| `modelId`          | `string` | yes      | ID of the pre approved model to use              |                                                              |
| `apihost`          | `string` | no       | Optional hostname of the SKMS api to use         | `api.skms.adobe.com`                                         |
| `summary`          | `string` | no       | Summary of the CMR                               | `Automated CI/CD release of ${pkg.name} ${nextRelease.name}` |
| `notes`            | `string` | no       | Additional notes of the CMR                      | `${env.CIRCLE_BUILD_URL}`                                    |
| `explanation`      | `string` | no       | Explanation added to a completed CMR             | `released ${pkg.name}@${nextRelease.version}`                |
| `cancelationNotes` | `string` | no       | Explanation added to a canceled CMR              | `semantic released failed.`                                  |
| `maintStart`       | `number` | no       | num seconds before the maintenance window starts | `15`                                                         |
| `maintDuration`    | `number` | no       | num seconds of the maintenance window            | `600`                                                        |


## Development

### Build

```bash
$ npm install
```

### Test

```bash
$ npm test
```

### Lint

```bash
$ npm run lint
```
