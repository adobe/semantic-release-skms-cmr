module.exports = {
  plugins: [
    ['@adobe/semantic-release-skms-cmr', {
      modelId: 654955,
      apihost: '10.27.9.191',
    }],
    ['@semantic-release/exec', {
      prepareCmd: 'echo "prepare ${nextRelease.name}"',
      publishCmd: 'echo "publish ${nextRelease.name}"',
      successCmd: 'echo "success ${nextRelease.name}"',
    }],
  ],
  branches: ['*'],
};
