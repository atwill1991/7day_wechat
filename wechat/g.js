'use strict'

const sha1 = require('sha1')
const getRawBody = require('raw-body')
const Wechat = require('./wechat')
const util = require('./util')

module.exports = function (opts, handler) {
  let wechat = new Wechat(opts)
  return function* (next) {
    const that = this
    console.log('请求进入中间件g, query: ', this.query)
    // { signature: '44be10d512c7e975cf41f495344837b19f8b3ffd',
    // echostr: '16362066769159356395',
    // timestamp: '15219586832',
    // nonce: '1393538823' }
    const { token } = opts
    const { signature, nonce, echostr, timestamp } = this.query
    const str = [token, timestamp, nonce].sort().join('')
    const sha = sha1(str)
    console.log(">>>身份比对结果：", sha === signature)
    if (this.method === 'GET') {
      if (sha === signature) { // 判断请求是否合法
        this.body = echostr + ''
      } else {
        this.body = 'wrong'
      }
    } else if (this.method === 'POST') {
      if (sha !== signature) {
        this.body = 'wrong'
        return false
      }
      // console.log(">>>post req: ", this.req)
      const data = yield getRawBody(this.req, {
        length: this.length,
        limit: '1mb',
        encoding: this.charset
      })
      console.log(">>>raw data", data.toString())
      // <xml>
      // <ToUserName><![CDATA[gh_84fcbbace123]]></ToUserName>
      // <FromUserName><![CDATA[o-NjF1ZYTeKlrKFuwIiK2Afk8abc]]></FromUserName>
      // <CreateTime>1521969426</CreateTime>
      // <MsgType><![CDATA[event]]></MsgType>
      // <Event><![CDATA[unsubscribe]]></Event>
      // <EventKey><![CDATA[]]></EventKey>
      // </xml>
      console.log(">>>this.charset", this.charset, this.length)
      const content = yield util.parseXMLAsync(data)
      console.log(">>>content: ", content)
      // { xml:
      //   { ToUserName: [ 'gh_84fcbbace123' ],
      //     FromUserName: [ 'o-NjF1ZYTeKlrKFuwIiK2Afk8abc' ],
      //     CreateTime: [ '1521969426' ],
      //     MsgType: [ 'event' ],
      //     Event: [ 'unsubscribe' ],
      //     EventKey: [ '' ] 
      //    } 
      // }
      const message = util.formatMessage(content.xml)
      console.log(">>message", message)
      this.weixin = message
      console.log(">>>>weixin: ", this.weixin)
      yield handler.bind(this)(next)
      wechat.reply.call(this)
      yield next
      // if (message.MsgType === 'event') {
      //   if (message.Event === 'subscribe') {
      //     const now = new Date().getTime()
      //     that.status = 200
      //     that.type = 'application/xml'
      //     // that.body = `<xml><ToUserName>< ![CDATA[${message.FromUserName}] ]></ToUserName><FromUserName>< ![CDATA[${message.ToUserName}] ]></FromUserName><CreateTime>${now}</CreateTime><MsgType>< ![CDATA[event] ]></MsgType><Event>< ![CDATA[subscribe] ]></Event></xml>`
      //     that.body = xml
      //     console.log(">>>return body", that.body)
      //     console.log(">>>>next: ", next)
      //     return
      //   }
      // }
    }
  }
}
