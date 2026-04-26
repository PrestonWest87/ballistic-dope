const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@ballistic-dope/theme': path.resolve(__dirname, 'packages/theme/src'),
  '@ballistic-dope/core': path.resolve(__dirname, 'packages/core/src'),
  '@ballistic-dope/ui': path.resolve(__dirname, 'packages/ui/src'),
};

module.exports = config;