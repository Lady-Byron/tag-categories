'use strict';

const flarumWebpack = require('flarum-webpack-config');
const path = require('path');

const base = flarumWebpack({
  entries: {
    forum: './src/forum/index.ts',
    admin: './src/admin/index.ts',
  },
  useExtensions: ['flarum/tags'],
});

// flarum-webpack-config 在多入口时通常返回数组；这里统一成数组处理
const configs = Array.isArray(base) ? base : [base];

// 显式把所有配置的输出目录设置为 js/dist
for (const cfg of configs) {
  cfg.output = cfg.output || {};
  cfg.output.path = path.resolve(__dirname, 'dist');
  // 保守起见也明确文件名
  cfg.output.filename = '[name].js';
}

module.exports = configs;


