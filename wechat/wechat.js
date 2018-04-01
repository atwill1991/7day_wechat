'use strict'

const Promise = require('bluebird')
const request = Promise.promisify(require('request'))
const util = require('./util')
const fs = require('fs')

const prefix = 'https://api.weixin.qq.com/cgi-bin/'
const api = {
  accessToken: `${prefix}token?grant_type=client_credential`,
  // upload: 'https://api.weixin.qq.com/cgi-bin/media/upload?access_token=ACCESS_TOKEN&type=TYPE'
  upload: `${prefix}meida/upload?`
}

class Wechat {
  constructor (opts) {
    let that = this
    this.appID = opts.appID
    this.appSecret = opts.appSecret
    this.getAccessToken = opts.getAccessToken
    this.saveAccessToken = opts.saveAccessToken
    console.log(">>>>this", this.appID, this.appSecret)
    this.fetchAccessToken()
  }

  isValidAccessToken(data) {
    if (!data || !data.access_token || !data.expires_in) return false
    const {access_token, expires_in} = data
    const now = new Date().getTime()
    if (now < expires_in) return true
    return false
  }
  
  updateAccessToken() {
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

  uploadMaterial(type, filePath) {
    let that = this
    let form = {
      media: fs.createReadStream(filePath)
    }
    return new Promise((resolve, reject) => {
      let p = that.fetchAccessToken()
      console.log(">>>P: ", p)
      p.then(data => {
        let url = `${api.upload}access_token=${data.access_token}&type=${type}`
        request({method: 'POST', url, formData: form, json: true}).then(response => {
          let _data = response[1]
          if (_data) {
            resolve(_data)
          } else {
            throw new Error('Upload material fails')
          }
        }).catch(err => {
          reject(err)
        })
      })
    })
  }

  fetchAccessToken(d) {
    let that = this
    if (this.access_token && this.expires_in) {
      if (this.isValidAccessToken(this)) {
        console.log(">>>return 1")
        return Promise.resolve(this)
      }
    }
    this.getAccessToken().then(data => {
      try {
        data = JSON.parse(data)
        console.log(">>>red: ", data)
      } catch (e) {
        return that.updateAccessToken()
      }

      if (that.isValidAccessToken(data)) {
        return Promise.resolve(data)
      } else {
        return that.updateAccessToken()
      }
    }).then(data => {
      console.log(">>data: ", data)
      that.accessToken = data.access_token
      that.expires_in = data.expires_in
      that.saveAccessToken(data)
      return Promise.resolve(data)
    })
  }

  reply() {
    const content = this.body
    let message = this.weixin
    let xml = util.tpl(content, message)
    console.log('>>xml: ', xml)
    this.status = 200
    this.type = 'application/xml'
    this.body = xml
  }
}

module.exports = Wechat
