import { BigNumber } from 'bignumber.js'
import Config from '../config'
const hash = require('hash.js')
const CryptoJS = require('crypto-js')
const key = CryptoJS.enc.Utf8.parse("function Common('eAxDWwTCWbwQYqbhWNEJkJLa9dm36w3O')")
const $ = window.$

const Common = {
  hexStringToAddress,
  hexStringToBigNumber,
  hexStringToInt,
  hexStr2string,
  getbSeed,
  numFloor,
  getLeftTimes,
  numToQian,
  strTo7,
  randomNum,
  dateFtt,
  getDevicePixelRatio,
  parseTxId,
  encrypt,
  decrypt,
  sha256,
  parseName,
  getLevelStage,
  getNewStage,
  getHash,
  delay,
  getServerTs,
  getUrlParms,
  getUserAvatar,
}

function getUserAvatar(id) {
  return `https://cdn1.wink.org/avatar/${id}.png`
}

function getUrlParms(name) {
  var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)')
  var r = window.location.search.substr(1).match(reg)
  if (r != null) return unescape(r[2])
  return null
}

function getServerTs() {
  return new Promise((resolve) => {
    $.get(Config.rankUrl + '/update/getActEndTime', (res) => {
      if (res.errno != 0) return
      resolve(res.data.now)
    })
  })
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getHash(hash) {
  if (document.body.clientWidth < 991) {
    hash = Common.strTo7(hash)
  }
  return hash
}

function sha256(data) {
  return hash
    .sha256()
    .update('this.promise(i++)' + data)
    .digest('hex')
}

function encrypt(message) {
  var encrypted = CryptoJS.DES.encrypt(message, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  })
  return encrypted.toString()
}

function decrypt(message) {
  try {
    var plaintext = CryptoJS.DES.decrypt(message, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    })
    return plaintext.toString(CryptoJS.enc.Utf8)
  } catch (e) {
    // console.log(e);
    return ''
  }
}

function parseTxId(txId) {
  return txId.substr(0, 10) + '....'
}

function getDevicePixelRatio() {
  return window.devicePixelRatio || 1
}

function dateFtt(fmt, date) {
  //author: meizz
  var o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  }
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  for (var k in o)
    if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
  return fmt
}

function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10)
      break
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
      break
    default:
      return 0
      break
  }
}

function parseName(name) {
  if (name == undefined) return ''
  if (name.length == 34) return parseAddress(name)
  return strTo7(name)
}

function parseAddress(address) {
  if (!address) return ''
  var length = address.length
  if (length < 20) return address
  return address.substring(0, 5) + '....' + address.substring(length - 5, length)
}

function strTo7(name) {
  if (name == undefined) return ''
  let strLen = name.length
  let realLen = getStrLen(name)
  if (realLen > 14) {
    if (strLen * 2 <= realLen) {
      return name.substring(0, 8).concat('...')
    } else {
      return name.substring(0, 10).concat('...')
    }
  }
  return name
}

function getStrLen(str) {
  var slength = 0
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) >= 0 && str.charCodeAt(i) <= 255) slength = slength + 1
    else slength = slength + 2
  }
  return slength
}

function numToQian(num) {
  num = num + ''
  let numArr = num.split('.')
  let newNum = numArr[0].toString().replace(/(\d{1,3})(?=(\d{3})+$)/g, '$1,')
  let xiaoshu = numArr[1]
  if (xiaoshu != undefined) {
    newNum = newNum + '.' + xiaoshu
  }
  return newNum
}

function getLeftTimes(times) {
  var d = 0,
    h = 0,
    m = 0,
    s = 0
  if (times > 0) {
    // d = Math.floor(times / (60 * 60)/24);
    h = Math.floor(times / 3600)
    m = Math.floor(times / 60) - d * 24 * 60 - h * 60
    s = Math.floor(times) - d * 24 * 60 * 60 - h * 60 * 60 - m * 60
  }
  if (d <= 9) d = '0' + d
  if (h <= 9) h = '0' + h
  if (m <= 9) m = '0' + m
  if (s <= 9) s = '0' + s
  // console.log(h + ':' + m + ':' + s, 'df____shijian')
  return h + ':' + m + ':' + s
}

function numFloor(num, xiaoshu) {
  return Number(Math.floor(num * xiaoshu + 0.0000002) / xiaoshu)
}

function stringToUtf8ByteArray(str) {
  // TODO(user): Use native implementations if/when available
  var out = [],
    p = 0
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i)
    if (c < 128) {
      out[p++] = c
    } else if (c < 2048) {
      out[p++] = (c >> 6) | 192
      out[p++] = (c & 63) | 128
    } else if ((c & 0xfc00) == 0xd800 && i + 1 < str.length && (str.charCodeAt(i + 1) & 0xfc00) == 0xdc00) {
      // Surrogate Pair
      c = 0x10000 + ((c & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff)
      out[p++] = (c >> 18) | 240
      out[p++] = ((c >> 12) & 63) | 128
      out[p++] = ((c >> 6) & 63) | 128
      out[p++] = (c & 63) | 128
    } else {
      out[p++] = (c >> 12) | 224
      out[p++] = ((c >> 6) & 63) | 128
      out[p++] = (c & 63) | 128
    }
  }
  return out
}

function utf8ByteArrayToString(bytes) {
  // TODO(user): Use native implementations if/when available
  var out = [],
    pos = 0,
    c = 0
  while (pos < bytes.length) {
    var c1 = bytes[pos++]
    if (c1 < 128) {
      out[c++] = String.fromCharCode(c1)
    } else if (c1 > 191 && c1 < 224) {
      var c2 = bytes[pos++]
      out[c++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63))
    } else if (c1 > 239 && c1 < 365) {
      // Surrogate Pair
      var c2 = bytes[pos++]
      var c3 = bytes[pos++]
      var c4 = bytes[pos++]
      var u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000
      out[c++] = String.fromCharCode(0xd800 + (u >> 10))
      out[c++] = String.fromCharCode(0xdc00 + (u & 1023))
    } else {
      var c2 = bytes[pos++]
      var c3 = bytes[pos++]
      out[c++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))
    }
  }
  return out.join('')
}

function bytesArray2hexStr(bytesArray) {
  const hexByteMap = '0123456789abcdef'
  let retStr = ''
  let length = bytesArray.length
  var charCode
  for (let i = 0; i < length; ++i) {
    charCode = bytesArray[i]
    retStr += hexByteMap.charAt(charCode >> 4)
    retStr += hexByteMap.charAt(charCode & 0x0f)
  }
  return retStr
}

function hexStr2bytesArray(hesStr) {
  let outArray = []
  let halfLength = hesStr.length / 2
  for (let i = 0; i < halfLength; ++i) {
    let tmp = `0x${hesStr[i * 2]}${hesStr[i * 2 + 1]}`
    outArray[i] = tmp
  }
  return outArray
}

function string2hexStr(str) {
  return bytesArray2hexStr(stringToUtf8ByteArray(str))
}

function hexStr2string(hexStr) {
  return utf8ByteArrayToString(hexStr2bytesArray(hexStr))
}

function hexStringToBigNumber(hexStr) {
  return new BigNumber('0x' + hexStr)
}

function hexStringToInt(hexStr) {
  return parseInt(hexStringToBigNumber(hexStr).toString())
}

function hexStringToAddress(hexStr) {
  if (hexStr.length == 64) {
    return '41' + hexStr.substr(24, 40)
  } else {
    return hexStr
  }
}

function getbSeed(newSeed) {
  let bSeed = hash.sha256().update(newSeed.toString()).digest('hex')
  if (newSeed == '') {
    bSeed = ''
  }
  return bSeed
}

function getNewStage(lv) {
  let res = ''

  if (lv > 0 && lv <= 9) {
    res = 12
  } else if (lv > 9 && lv <= 24) {
    res = 24
  } else if (lv > 24 && lv <= 49) {
    res = 36
  } else if (lv > 49 && lv <= 74) {
    res = 48
  } else if (lv > 74) {
    res = 60
  }

  return res
}

function getLevelStage(lv) {
  let res = ''

  if (lv > 0 && lv <= 9) {
    res = 10
  } else if (lv > 9 && lv <= 24) {
    res = 20
  } else if (lv > 24 && lv <= 49) {
    res = 30
  } else if (lv > 49 && lv <= 74) {
    res = 40
  } else if (lv > 74) {
    res = 50
  }

  return res
}

export default Common
