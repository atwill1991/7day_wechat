'use strict'

let Koa = require('koa')
const config = require('./config.js')
const wechat = require('./wechat/g')
const weixin = require('./weixin.js')

let app = new Koa()

app.use(wechat(config.wechat, weixin.replay))

app.listen(1234)
console.log('Listening: 1234')
