const env = process.env.REACT_APP_ENV
let configData = {}
switch (env) {
  case 'dev':
    configData = {
      // //排行榜，倒计时，通知等...HTTP
      rankUrl: 'https://pro-backend.wink.org',
      //个人中心HTTP
      profileUrl: 'https://pro-profile.wink.org',

      //后台管理HTTP
      back02Url: 'https://pro-backend02.wink.org',

      //diceSocket
      diceSocketUrl: 'https://pro-dice.wink.org',
      //ringSocket
      ringSocketUrl: 'https://pro-ring.wink.org',
      //moonSocket
      moonSocketUrl: 'https://pro-moon.wink.org',

      fullNodeOwn: 'https://testhttpapi.tronex.io',
      fullNodeTron: 'https://testhttpapi.tronex.io',
      host: 'testhttpapi.tronex.io', // scatter钱包初始化，线上需要更改为 'api.trongrid.io'
      port: 443,
      protocol: 'https',
      bttTokenID: 1000024,
    }
    break
  case 'local':
    configData = {
      // //排行榜，倒计时，通知等...HTTP
      rankUrl: 'http://3.15.85.91:18050',
      // //个人中心HTTP
      profileUrl: 'http://3.15.85.91:18055', // tronbet_profile

      //后台管理HTTP
      back02Url: 'http://3.15.85.91:18056',

      // //diceSocket
      diceSocketUrl: 'http://3.15.85.91:18051',
      // //ringSocket
      ringSocketUrl: 'http://3.15.85.91:18053',
      // //moonSocket
      moonSocketUrl: 'http://3.15.85.91:18052',

      fullNodeOwn: 'https://testhttpapi.tronex.io',
      fullNodeTron: 'https://testhttpapi.tronex.io',
      host: 'testhttpapi.tronex.io', // scatter钱包初始化，线上需要更改为 'api.trongrid.io'
      port: 443,
      protocol: 'https',
      bttTokenID: 1000024,
    }
    break
  default:
    configData = {
      //排行榜，倒计时，通知等...HTTP
      rankUrl: 'https://pro-backend.wink.org',
      //个人中心HTTP
      profileUrl: 'https://pro-profile.wink.org',

      //后台管理HTTP
      back02Url: 'https://pro-backend02.wink.org',

      //diceSocket
      diceSocketUrl: 'https://pro-dice.wink.org',
      //ringSocket
      ringSocketUrl: 'https://pro-ring.wink.org',
      //moonSocket
      moonSocketUrl: 'https://pro-moon.wink.org',

      fullNodeOwn: 'https://httpapi.tronex.io',
      fullNodeTron: 'https://httpapi.tronex.io',
      host: 'api.trongirid.io', // scatter钱包初始化，线上需要更改为 'api.trongrid.io'
      port: 443,
      protocol: 'https',
      bttTokenID: 1002000,
    }
}

module.exports = Object.assign(configData)
