'use strict';

const flarumWebpack = require('flarum-webpack-config');
const path = require('path');

const config = flarumWebpack({
  // 关键：入口应相对当前文件（位于 js/）
  entries: {
    forum: './src/forum/index.ts',
    admin: './src/admin/index.ts',
  },
  // 声明会使用到 flarum/tags 的前端模块（作为外部依赖，不打进包）
  useExtensions: ['flarum/tags'],
});

// 显式把输出目录定到 js/dist
config.output = config.output || {};
config.output.path = path.resolve(__dirname, 'dist');

module.exports = config;

