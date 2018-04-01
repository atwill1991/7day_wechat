'use strict'

let config = require('./config')
let Wechat = require('./wechat/wechat')
let wechatApi = new Wechat(config.wechat)

exports.replay = function* (next) {
  let message = this.weixin
  if (message.MsgType === 'event') {
    if (message.Event === 'subscribe') {
      if (message.EventKey) {
        console.log("扫二维码进来： ", message.EventKey, message.ticket)
      }
      this.body = '哈哈，你订阅了\r\n' + '消息ID：' + message.MsgId
      console.log(">>>body: ", this.body)
    } else if (message.Event === 'unsubscribe') {
      console.log('无情取关')
      this.body = ''
    } else if (message.Event === 'LOCATION') {
      this.body = `您上报的位置是：${message.Latitude} / ${message.Longitude} - ${message.Precision}`
    } else if (message.Event === 'CLICK') {
      this.body = `您点击了菜单：${message.EventKey}`
    } else if (message.Event === 'SCAN') {
      this.body = `看到你扫了一下哦`
    } else if (message.Event === 'VIEW') {
      this.body = `您点击了菜单中的链接： ${message.EventKey}`
    }
  } else if (message.MsgType === 'text') {
    let content = message.Content
    let reply = `问题[ ${message.Content} ] ，太复杂了`
    if (content === '1') {
      reply = '11111'
    } else if (content === '2') {
      reply = '22222'
    } else if (content === '3') {
      reply = [{
        title: '百度搜索',
        description: '描述信息',
        picUrl: 'https://www.baidu.com/img/bd_logo1.png?qua=high&where=super',
        url: 'www.baidu.com'
      }, {
        title: 'github',
        description: 'github描述信息',
        picUrl: 'https://gold-cdn.xitu.io/v3/static/img/logo.a7995ad.svg',
        picUrl: 'https://juejin.im/timeline'
      }]
    } else if (content === '4') {
      let data = yield wechatApi.uploadMaterial('image', __dirname + '/images/img.jpeg')
      reply = {
        type: 'image',
        mediaId: data.media_id
      }
    } else if (content === '5') {
      let data = yield wechatApi.uploadMaterial('video', __dirname + '/images/img.jpeg')
      reply = {
        title: '视频',
        description: 'this is video',
        type: 'video',
        mediaId: data.media_id
      }
    } else if (content === '6') {
      let data = yield wechatApi.uploadMaterial('image', __dirname + '/images/img.jpeg')
      reply = {
        type: 'music',
        title: '音乐',
        description: 'this is music',
        musicUrl: 'http://mpge.5nd.com/2015/2015-9-12/66325/1.mp3',
        thumbMediaId: data.media_id
      }
    }
    console.log(">>>reply: ", reply)
    this.body = reply
  }
  yield next
}