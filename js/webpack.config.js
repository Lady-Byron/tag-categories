'use strict';

/**
 * Flarum Extension Bundler
 * - Uses flarum-webpack-config to set externals, output format, loaders for TS/TSX, etc.
 * - Produces js/dist/{forum,admin}.js
 */
const flarumWebpack = require('flarum-webpack-config');

module.exports = flarumWebpack({
  useExtensions: ['flarum/tags'], // 让打包器识别 flarum/tags 的前端模块
  entries: {
    forum: './js/src/forum/index.ts',
    admin: './js/src/admin/index.ts',
  },
});
