'use strict';

// 官方推荐：使用 flarum-webpack-config 让它自动发现入口 forum.js / admin.js
const config = require('flarum-webpack-config');

module.exports = config({
  // 我们需要从 flarum/tags 导入前端模块，声明一下以便作为 externals 处理
  // NPM 说明文档示例也使用 'flarum/tags' 作为 useExtensions 值
  // 这样 @flarum/tags 或 flarum/tags/* 的导入会被正确映射到运行时提供的导出
  useExtensions: ['flarum/tags'],
});

