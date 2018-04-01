'use strict'

const sha1 = require('sha1')
const Promise = require('bluebird')
const request = Promise.promisify(require('request'))

const prefix = 'https://api.weixin.qq.com/cgi-bin/'
const api = {
  accessToken: `${prefix}token?grant_type=client_credential`
}

function Wechat (opts) {
  let that = this
  this.appID = opts.appID
  this.appSecret = opts.appSecret
  this.getAccessToken = opts.getAccessToken
  this.saveAccessToken = opts.saveAccessToken
  console.log(">>>>this", this.appID, this.appSecret)
  this.getAccessToken().then(data => {
    try {
      data = JSON.parse(data)
      console.log(">>>red: ", data)
    } catch (e) {
      return that.updateAccessToken()
    }

    if (that.isValidAccessToken(data)) {
      Promise.resolve(data)
    } else {
      return that.updateAccessToken()
    }
  }).then(data => {
    that.accessToken = data.access_token
    that.expires_in = data.expires_in
    that.saveAccessToken(data)
  })
}

Wechat.prototype.isValidAccessToken = data => {
  if (!data || !data.access_token || !data.expires_in) return false
  const {access_token, expires_in} = data
  const now = new Date().getTime()
  if (now < expires_in) return true
  return false
}
Wechat.prototype.updateAccessToken = () => {
  console.log(">>this appid", this.appID)
  const appID = this.appID
  const appSecret = this.appSecret
  const url = `${api.accessToken}&appid=${appID}&secret=${appSecret}`
  console.log(">>>url: ", url)
  return new Promise((resolve, reject) => {
    request({
      url,
      json: true,
    }).then(function (response) {
      console.log('>>response: ', response.body)
      let data = response.body
      let now = new Date().getTime()
      let expires_in = now + (data.expires_in - 20) * 1000
      data.expires_in = expires_in
      resolve(data)
    })
  })
}

module.exports = function (opts) {
  let wechat = new Wechat(opts)
  return function *(next) {
    console.log(this.query)
    // { signature: '44be10d512c7e975cf41f495344837b19f8b3abc',
    // echostr: '16362066769159356832',
    // timestamp: '1521958889',
    // nonce: '1393538823' }
    const { token } = opts
    const { signature, nonce, echostr, timestamp } = this.query
    const str = [token, timestamp, nonce].sort().join('')
    const sha = sha1(str)
    console.log(">>>", sha === signature)
    if (sha === signature) {
      this.body = echostr + ''
    } else {
      this.body = 'wrong'
    }
  }
}
