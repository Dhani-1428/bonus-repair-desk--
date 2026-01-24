// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Workaround for Windows node:sea directory issue
config.resolver = {
  ...config.resolver,
  unstable_enablePackageExports: false,
};

module.exports = config;
