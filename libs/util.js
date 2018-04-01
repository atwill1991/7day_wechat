'use strict'

const fs = require('fs')
const Promise = require('bluebird')

exports.readFileAsync = (fpath, encodning) => {
  return new Promise((resolve, reject) => {
    fs.readFile(fpath, encodning, (err, content) => {
      if (err) reject(err)
      resolve(content)
    })
  })
}

exports.writeFileAsync = (fpath, content) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fpath, content, err => {
      if (err) reject(err)
      resolve()
    })
  })
}
