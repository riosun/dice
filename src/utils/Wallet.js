import ScatterJS, { Network } from 'scatterjs-core'
import ScatterTron from 'scatterjs-plugin-tron'
import TronWeb from 'tronweb'
import Common from './Common'
import ABI_ADDR from '../abiAddr'
import Config from '../config'

const $ = window.$
const ourMoney = 10000000

let tronUrl = Config.fullNodeOwn
function setTronUrl() {
  tronUrl = Config.fullNodeTron
}

const Wallet = {
  init,
  loginScatter,
  checkLogin, //检测钱包是否登录
  getWalletAddress, //获取钱包地址
  getUserMoeny, //获取用户的钱
  getSeed, //获取随机种子
  getRefCode, //获取推荐码
  getUserAnte, //获取用户的ante
  getUserAnte2, //获取用户的ante
  getAnteInfo, //获取ante相关数据
  getAllBlance, //获取奖池所有资金
  getOrderDataFromString, //格式化订单
  handleLastOrder, //处理最后一个订单是否完成
  userHasBet, //判断用户是否一定玩过游戏
  userHasRefer,
  getBetInfoFromOrder, // 根据订单生成投注列表
  setSeed, //设置随机种子
  setRefCode, //设置推荐码
  goodLuck, //下注
  goodLuck20, //下注
  goodLuck10, //下注

  collectAnte, //领取ante到钱包
  frozenAnte, //冻结ante
  unFrozenAnte, //解冻ante
  cancelUnfreeze, //取消解冻请求
  withdrawUnfreeze, //提取
  canFrozen, //判断是否可以操作
  checkTxID,
  //moon
  goToMoon,
  //ring
  ring,
  //pk
  createSolo,
  joinSolo,
  isTxSuccess,
  getSign,
  getburnData,

  coins: {
    trx: { address: '', type: 'trx' },
    ante: { address: ABI_ADDR.DiceToken, type: 'trc20' },
    win: { address: ABI_ADDR.WinToken, type: 'trc20' },
    btt: { type: 'trc10', tokenID: Config.bttTokenID },
    mainChain: ['trx'],
    trc20: ['ante', 'win'],
    trc10: ['btt'],
  },
  minMoneyObj: { trx: 10, ante: 1, btt: 500, win: 1000 },
  getWalletToken,
  getWinToken,
  getTRC10Token,
  getOriginalAmount,
}

//tron钱包相关对象
let tronWeb = false
let tronWeb2 = false
let scatter = false
let network = {}
let walletAddress = false

let nowWallet = 'tronLink'

let tmpTimer1 = null
let tmpTimer2 = null

function getOriginalAmount(tokenId, cb) {
  viewTransaction2(ABI_ADDR.DiceBetPool10, 'tokenOriginalAmount(uint256)', 0, [{ type: 'uint256', value: tokenId }], (err, ret) => {
    cb(Common.numFloor(Common.hexStringToInt(ret[0]) / 1e6, 100))
  })
}

function getburnData(obj, cb) {
  viewTransaction2(ABI_ADDR.WinToken, 'balanceOf(address)', 0, [{ type: 'address', value: ABI_ADDR.DiceBetPool20 }], (err, ret) => {
    obj.waiteBurn = Common.numFloor(Common.hexStringToInt(ret[0]) / 1e6 - 3e8, 100)
    window.burn = obj.waiteBurn
    cb(obj)
  })

  viewTransaction2(ABI_ADDR.WinToken, 'totalSupply()', 0, [], (err, ret) => {
    obj.hasBurn = Common.numFloor(9990e8 - Common.hexStringToInt(ret[0]) / 1e6, 100)
    cb(obj)
  })
}

function getSign(cb) {
  if (window.$(window).width() < 1100) {
    cb(Common.sha256(Wallet.getWalletAddress() + 'tronbet'))
    return
  }
  let sign = window.localStorage.getItem('sign-' + walletAddress)
  if (sign != null) {
    cb(sign)
    return
  }
  tronWeb.trx.sign(TronWeb.toHex('tronbet').substring(2), (err, msg) => {
    if (err) {
      console.log(err)
      return
    }
    window.localStorage.setItem('sign-' + walletAddress, msg)
    cb(msg)
  })
}

async function isTxSuccess(tx_id) {
  let result = await tronWeb.trx.getTransaction(tx_id)
  if (result != null && result.ret != null && result.ret[0].contractRet != null && result.ret[0].contractRet === 'SUCCESS') {
    return true
  }
  return false
}

function canFrozen(cb) {
  viewTransaction(ABI_ADDR.DiceStaker, 'isStakePaused()', 0, [], (err, bool) => {
    cb(!Number(Common.hexStringToInt(bool[0])))
  })
}

function withdrawUnfreeze(cb) {
  commitTransaction(ABI_ADDR.DiceStaker, 'WithdrawUnfreeze()', 0, [], 500000000, cb)
}

function cancelUnfreeze(cb) {
  commitTransaction(ABI_ADDR.DiceStaker, 'CancelUnfreeze()', 0, [], 500000000, cb)
}

function unFrozenAnte(anteNum, cb) {
  commitTransaction(ABI_ADDR.DiceStaker, 'Unfreeze(uint256)', 0, [{ type: 'uint256', value: Number((anteNum * 1e6).toFixed(0)) }], 500000000, cb)
}

function frozenAnte(anteNum, cb) {
  commitTransaction(
    ABI_ADDR.DiceToken,
    'approveAndCall(address,uint256,bytes)',
    0,
    [
      { type: 'address', value: ABI_ADDR.DiceStaker },
      { type: 'uint256', value: Number((anteNum * 1e6).toFixed(0)) },
      { type: 'bytes', value: '0x00' },
    ],
    500000000,
    cb
  )
}

function collectAnte(cb) {
  if (!checkLogin()) return

  commitTransaction(ABI_ADDR.DicePool, 'releaseDiceSelf()', 0, [], 500000000, () => {
    let t = setTimeout(() => {
      clearTimeout(t)
      cb()
    }, 1000)
  })
}

function createSolo(obj, cb) {
  let { lv, playerAmount, seat, trxVal } = obj
  console.log(obj)

  commitTransaction(
    ABI_ADDR.DiceDual,
    'CreateRingRoom(uint256,uint256,uint256)',
    trxVal,
    [
      { type: 'uint256', value: lv },
      { type: 'uint256', value: playerAmount },
      { type: 'uint256', value: seat },
    ],
    6000000,
    cb
  )
}

function joinSolo(obj, cb) {
  let { roomId, seat, tableIndex, trxVal } = obj
  console.log(obj)

  commitTransaction(
    ABI_ADDR.DiceDual,
    'JoinRingRoom(uint256,uint256,uint256)',
    trxVal,
    [
      { type: 'uint256', value: roomId },
      { type: 'uint256', value: tableIndex },
      { type: 'uint256', value: seat },
    ],
    6000000,
    cb
  )
}

function ring(obj, cb) {
  let { refer, trxVal, multiplier, suggest, userHasBet, userHasRefer } = obj
  console.log(obj)
  if (!refer || userHasBet || userHasRefer) {
    commitTransaction(
      ABI_ADDR.DiceRing,
      'JustRing(uint256,uint256)',
      trxVal,
      [
        { type: 'uint256', value: multiplier },
        { type: 'uint256', value: Number(suggest) },
      ],
      6000000,
      cb
    )
  } else {
    commitTransaction(
      ABI_ADDR.DiceMoon,
      'WelcomeToTronBetRing(uint256,uint256,string)',
      trxVal,
      [
        { type: 'uint256', value: multiplier },
        { type: 'uint256', value: Number(suggest) },
        { type: 'string', value: refer },
      ],
      6000000,
      cb
    )
  }
}

//moon下单
function goToMoon(moonObj, cb) {
  let { refer, autoRate, suggest, trxVal, userHasBet, userHasRefer } = moonObj
  autoRate = Number(Math.floor(autoRate * 100 + 0.5))
  if (!refer || userHasBet || userHasRefer) {
    commitTransaction(
      ABI_ADDR.DiceMoon,
      'ToTheMoon(uint256,uint256)',
      trxVal,
      [
        { type: 'uint256', value: autoRate },
        { type: 'uint256', value: Number(suggest) },
      ],
      6000000,
      cb
    )
  } else {
    commitTransaction(
      ABI_ADDR.DiceMoon,
      'WelcomeToTronBetMoon(uint256,uint256,string)',
      trxVal,
      [
        { type: 'uint256', value: autoRate },
        { type: 'uint256', value: Number(suggest) },
        { type: 'string', value: refer },
      ],
      6000000,
      cb
    )
  }
}

//dice下单
function goodLuck(betObj, cb) {
  let { refer, value, rollType, trxVal, userHasBet, userHasRefer } = betObj
  if (!refer || userHasBet || userHasRefer) {
    commitTransaction(
      ABI_ADDR.DiceBet,
      'GoodLuck(uint256,uint256)',
      trxVal,
      [
        { type: 'uint256', value: value },
        { type: 'uint256', value: rollType - 1 },
      ],
      6000000,
      cb
    )
  } else {
    commitTransaction(
      ABI_ADDR.DiceBet,
      'WelcomeToTronBet(uint256,uint256,string)',
      trxVal,
      [
        { type: 'uint256', value: value },
        { type: 'uint256', value: rollType - 1 },
        { type: 'string', value: refer },
      ],
      6000000,
      cb
    )
  }
}

function goodLuck20(betObj, cb) {
  let { value, rollType, tokenNum } = betObj

  console.log({ betObj })

  commitTransaction(
    ABI_ADDR.WinToken,
    'approve(address,uint256)',
    0,
    [
      { type: 'address', value: ABI_ADDR.DiceBet20 },
      { type: 'uint256', value: tokenNum * 1e6 },
    ],
    1000000,
    (err, txID) => {
      if (err) {
        cb(err)
        return
      }
      //检查approve是否成功
      viewTransaction(
        ABI_ADDR.WinToken,
        'allowance(address,address)',
        0,
        [
          { type: 'address', value: tronWeb.defaultAddress.hex },
          { type: 'address', value: ABI_ADDR.DiceBet20 },
        ],
        (err, txID) => {
          if (err) {
            cb(err)
            return
          }
          commitTransaction(
            ABI_ADDR.DiceBet20,
            'GoodLuckWin(uint256,uint16,uint16)',
            0,
            [
              { type: 'uint256', value: tokenNum * 1e6 },
              { type: 'uint16', value: value },
              { type: 'uint16', value: rollType - 1 },
            ],
            6000000,
            cb
          )
        }
      )
    }
  )
}

//dice10币下单
function goodLuck10(betObj, cb) {
  let { value, rollType, tokenNum, tokenID } = betObj
  console.log({ betObj })

  commitTransactionWith10(
    ABI_ADDR.DiceBet10,
    'GoodLuck10(uint16,uint8)',
    tokenID,
    tokenNum * 1e6,
    [
      { type: 'uint16', value: value },
      { type: 'uint8', value: rollType - 1 },
    ],
    6000000,
    cb
  )
}

function userHasBet(cb) {
  viewTransaction(ABI_ADDR.DiceBet, 'bettorMap(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, betted) => {
    if (betted) {
      let bRet = Common.hexStringToInt(betted[0])
      if (bRet > 0) {
        cb(true)
      }
    }
  })
}

function userHasRefer(cb) {
  viewTransaction(ABI_ADDR.Referralship, 'getReferralShip(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, hasRefer) => {
    if (err) return
    if (hasRefer[0] != '0000000000000000000000000000000000000000000000000000000000000000') {
      cb(true)
    }
  })
}

function handleLastOrder(cb, type = 'trx') {
  if (type == 'trc20') {
    viewTransaction(ABI_ADDR.DiceBet20, 'getOrder(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, order) => {
      let curOrder = getOrderDataFromString(order[0], type)
      cb(curOrder)
    })
    return
  }

  if (type == 'trc10') {
    viewTransaction(ABI_ADDR.DiceBet10, 'getOrder(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, order) => {
      let curOrder = getOrderDataFromString(order[0], type)
      cb(curOrder)
    })
    return
  }

  viewTransaction(ABI_ADDR.DiceBet, 'getOrder(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, order) => {
    console.log('trx')
    let curOrder = getOrderDataFromString(order[0], type)
    cb(curOrder)
  })
}

function getAnteInfo(anteObj, timerCnt, cb) {
  getAllBlance((balance) => {
    let actualBalance = balance - ourMoney
    anteObj.totalTRX = actualBalance.toFixed(2)

    let trxArr = anteObj.totalTRX.split('.')
    let xiaoshu = trxArr[1]
    let nowShowTrx = Common.numToQian(trxArr[0])
    if (xiaoshu != undefined) {
      nowShowTrx = nowShowTrx + '.' + xiaoshu
    }
    anteObj.totalTRX = nowShowTrx
    cb(anteObj)
    //获取所有ante
    viewTransaction2(ABI_ADDR.DicePool, 'getPoolDiceBalance()', 0, [], (err, ret1) => {
      let poolANTE = Common.hexStringToBigNumber(ret1[0]) / 1e6

      let mineANTE = 10e8 - poolANTE

      anteObj.nowAnte = Number(mineANTE.toFixed(3))
      anteObj.stage = Math.ceil(anteObj.nowAnte / 5000000)
      anteObj.needTrx = (anteObj.stage - 1) * 4 + 200
      cb(anteObj)
    })

    if (!(timerCnt == -1 || timerCnt % 30 == 0)) return

    //获取总共质押的ante
    viewTransaction2(ABI_ADDR.DiceStaker, 'getTotalStakeDice()', 0, [], (err, anteArr) => {
      if (err) {
        console.log(err)
        return
      }
      let hexStr = anteArr[0]
      let obj2 = {
        devAmount: Common.numFloor(Common.hexStringToInt(hexStr.substr(0, 64)) / 1e6, 100),
        totalAmount: Common.numFloor(Common.hexStringToInt(hexStr.substr(64, 64)) / 1e6, 100),
      }
      anteObj.totalPledgeAnte = obj2.totalAmount
      anteObj.devPledgeAnte = 0
      cb(anteObj)

      //获取用户质押的ante
      viewTransaction(ABI_ADDR.DiceStaker, 'getStakeInfoByAddress(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, anteArr) => {
        if (err) {
          console.log(err)
          return
        }
        let hexStr = anteArr[0]
        let obj1 = {
          address: tronWeb.address.fromHex(Common.hexStringToAddress(hexStr.substr(0, 64))),
          anteAmount: Math.floor((Common.hexStringToInt(hexStr.substr(64, 64)) / 1e6) * 1000) / 1000,
          tmUnfreeze: Common.hexStringToInt(hexStr.substr(128, 64)),
          unfreezingAmount: Common.hexStringToInt(hexStr.substr(192, 64)) / 1e6,
        }
        anteObj.canGetTrx = Common.numFloor((actualBalance / obj2.totalAmount) * obj1.anteAmount, 100)
        if (anteObj.canGetTrx < 0) anteObj.canGetTrx = 0
        cb(anteObj)
      })
    })
  })
}

function getAllBlance(cb) {
  getBalance(ABI_ADDR.DicePool, (error, allBlance) => {
    console.log(ABI_ADDR.DicePool)
    if (error) {
      console.log(error)
      return
    }
    if (cb) {
      // console.log((allBlance / 1e6).toFixed(4), 'cb((allBlance / 1e6).toFixed(4))cb((allBlance / 1e6).toFixed(4))cb((allBlance / 1e6).toFixed(4))')
      cb((allBlance / 1e6).toFixed(4))
    }
  })
}

//获取钱包里面的Win
function getWinToken(cb) {
  let myAddress = tronWeb.defaultAddress.hex

  viewTransaction(ABI_ADDR.WinToken, 'balanceOf(address)', 0, [{ type: 'address', value: myAddress }], (err, tokenArr) => {
    if (err) {
      console.log(err)
      return
    }
    let win = Number((Common.hexStringToBigNumber(tokenArr[0]) / 1e6).toString())
    win = Math.floor(win * 1000) / 1000
    console.log({ win })
    cb(win)
  })
}

//获取钱包里面的token
function getWalletToken(cb) {
  window.axios
    .post(tronUrl + '/wallet/getaccount', { address: tronWeb.defaultAddress.hex })
    .then((transaction) => {
      cb(null, transaction.data)
    })
    .catch((err) => {
      setTronUrl()
      cb(err)
    })
}

//获取钱包里面的token
function getTRC10Token(cb) {
  window.axios
    .post(tronUrl + '/wallet/getaccount', { address: ABI_ADDR.DiceBetPool10 })
    .then((transaction) => {
      cb(null, transaction.data)
    })
    .catch((err) => {
      setTronUrl()
      cb(err)
    })
}

//dice的空投抵押
function getUserAnte(cb1, cb2, cb3) {
  let myAddress = tronWeb.defaultAddress.hex

  //获取链上的ante、
  viewTransaction(ABI_ADDR.DicePool, 'playerDiceCache(address)', 0, [{ type: 'address', value: myAddress }], (err, anteArr) => {
    if (err) {
      console.log(err)
      return
    }
    let anteLock = Number((Common.hexStringToBigNumber(anteArr[0]) / 1e6).toString())
    anteLock = Math.floor(anteLock * 1000) / 1000
    cb1(anteLock)
    console.log(anteLock, 'anteLock____')
  })

  //获取钱包里面的ante
  viewTransaction(ABI_ADDR.DiceToken, 'balanceOf(address)', 0, [{ type: 'address', value: myAddress }], (err, anteArr) => {
    if (err) {
      console.log(err)
      return
    }

    let anteFree = Number((Common.hexStringToBigNumber(anteArr[0]) / 1e6).toString())
    anteFree = Math.floor(anteFree * 1000) / 1000
    cb2(anteFree)
    console.log(anteFree, 'anteFree__+')
  })

  //获取质押的ante
  viewTransaction(ABI_ADDR.DiceStaker, 'getStakeInfoByAddress(address)', 0, [{ type: 'address', value: myAddress }], (err, anteArr) => {
    if (err) {
      console.log(err)
      return
    }

    let hexStr = anteArr[0]
    let obj = {
      address: tronWeb.address.fromHex(Common.hexStringToAddress(hexStr.substr(0, 64))),
      anteAmount: Math.floor((Common.hexStringToInt(hexStr.substr(64, 64)) / 1e6) * 1000) / 1000,
      tmUnfreeze: Common.hexStringToInt(hexStr.substr(128, 64)),
      unfreezingAmount: Common.numFloor(Common.hexStringToInt(hexStr.substr(192, 64)) / 1e6, 1000),
    }
    console.log(obj, 'obj______+')
    cb3(obj)
  })
}

function getUserAnte2(myAddress, cb1, cb2, cb3) {
  // let myAddress = "TYjBenDPCp1vtHGRMVWKvaQSrzEYrjn2rn";
  // myAddress = tronWeb.defaultAddress.hex;

  //获取链上的ante、
  viewTransaction(ABI_ADDR.DicePool, 'playerDiceCache(address)', 0, [{ type: 'address', value: myAddress }], (err, anteArr) => {
    if (err) {
      console.log(err)
      return
    }
    let anteLock = Number((Common.hexStringToBigNumber(anteArr[0]) / 1e6).toString())
    anteLock = Math.floor(anteLock * 1000) / 1000
    cb1(anteLock)
  })

  //获取钱包里面的ante
  viewTransaction(ABI_ADDR.DiceToken, 'balanceOf(address)', 0, [{ type: 'address', value: myAddress }], (err, anteArr) => {
    if (err) {
      console.log(err)
      return
    }
    let anteFree = Number((Common.hexStringToBigNumber(anteArr[0]) / 1e6).toString())
    anteFree = Math.floor(anteFree * 1000) / 1000
    cb2(anteFree)
  })

  //获取质押的ante
  viewTransaction(ABI_ADDR.DiceStaker, 'getStakeInfoByAddress(address)', 0, [{ type: 'address', value: myAddress }], (err, anteArr) => {
    if (err) {
      console.log(err)
      return
    }
    let hexStr = anteArr[0]
    let obj = {
      address: tronWeb.address.fromHex(Common.hexStringToAddress(hexStr.substr(0, 64))),
      anteAmount: Math.floor((Common.hexStringToInt(hexStr.substr(64, 64)) / 1e6) * 1000) / 1000,
      tmUnfreeze: Common.hexStringToInt(hexStr.substr(128, 64)),
      unfreezingAmount: Common.numFloor(Common.hexStringToInt(hexStr.substr(192, 64)) / 1e6, 1000),
    }
    cb3(obj)
  })
}

function getRefCode(cb) {
  viewTransaction(ABI_ADDR.Referralship, 'getReferralCodeByAddr(address)', 0, [{ type: 'address', value: tronWeb.defaultAddress.hex }], (err, refCodeArr) => {
    if (err) {
      console.log(err)
      return
    }
    let num = refCodeArr[0].substr(64, 64)
    if (num == '0000000000000000000000000000000000000000000000000000000000000000') {
      cb('')
      return
    }
    let refCode = Common.hexStr2string(refCodeArr[0].substr(128, Common.hexStringToInt(num) * 2))
    cb(refCode)
  })
}

function setRefCode(code, cb) {
  if (!checkLogin()) return
  viewTransaction(ABI_ADDR.Referralship, 'getAddrByReferralCode(string)', 0, [{ type: 'string', value: code }], (err, refCodeArr) => {
    if (refCodeArr[0] != '0000000000000000000000000000000000000000000000000000000000000000') {
      cb(false)
      return
    }
    commitTransaction(ABI_ADDR.Referralship, 'createReferralCode(string)', 0, [{ type: 'string', value: code }], 10000000, async () => {
      if (!err) {
        await Common.delay(1000)
        cb(true)
      }
    })
  })
}

function getSeed(cb) {
  viewTransaction(ABI_ADDR.Referralship, 'getMySeed()', 0, [], (err, seed) => {
    if (err) {
      console.log(err)
      return
    }
    cb(seed[0])
  })
}

function setSeed(bSeed, cb) {
  if (!checkLogin()) return
  commitTransaction(ABI_ADDR.Referralship, 'setCustomerSeed(bytes32)', 0, [{ type: 'bytes32', value: '0x' + bSeed }], 10000000, cb)
}

function getUserMoeny(cb) {
  getBalance(walletAddress, (error, money) => {
    if (error) {
      console.log(error)
      return
    }
    if (!money) return
    cb((money / 1e6).toFixed(4))
  })
}

//获取钱包地址
function getWalletAddress() {
  return walletAddress
}

//判断是否有钱包和登录
function checkLogin() {
  if (nowWallet == 'scatter') {
    if (walletAddress) return true
    this.loginScatter()
    return
  }
  if (!tronWeb) {
    $('#loginTron-modal').modal('show')
    return false
  }
  if (!walletAddress) {
    $('#loginTron-modal').modal('show')
    return false
  }
  return true
}

function init(name, cb) {
  tronWeb = false
  scatter = false
  walletAddress = false
  window.myAddress = ''
  initTronWeb2()

  switch (name) {
    case 'tronLink':
      nowWallet = 'tronLink'
      initTronLink(cb)
      break
    case 'scatter':
      nowWallet = 'scatter'
      initScatter(cb)
      break
    default:
      console.log('wallet error')
  }
}

function initTronLink(cb) {
  tmpTimer1 = setInterval(() => {
    if (!window.tronWeb) return
    clearInterval(tmpTimer1)
    tronWeb = window.tronWeb
    if (tmpTimer2) clearInterval(tmpTimer2)
    //1s检测钱包是否登录
    tmpTimer2 = setInterval(() => {
      if (tronWeb.defaultAddress.base58 == false) return
      clearInterval(tmpTimer2)
      walletAddress = tronWeb.defaultAddress.base58
      window.myAddress = walletAddress
      window.socket.emit('login', { addr: walletAddress })
      cb()
    }, 1000)
  }, 1000)
}

function initScatter(cb) {
  ScatterJS.plugins(new ScatterTron())
  network = Network.fromJson({
    blockchain: 'trx',
    host: Config.host,
    port: Config.port,
    protocol: Config.protocol,
    chainId: '1', // <-- this is the MAINNET
  })

  let httpProvider = new TronWeb.providers.HttpProvider(network.fullhost())
  tronWeb = new TronWeb(httpProvider, httpProvider, network.fullhost())
  tronWeb.setDefaultBlock('latest')
  let t = setInterval(() => {
    ScatterJS.scatter.connect('tronbet.io').then((connected) => {
      if (!connected) {
        console.log('Could not connect to Scatter.')
        return
      }
      clearInterval(t)
      scatter = ScatterJS.scatter
      tronWeb = scatter.trx(network, tronWeb)
      loginScatter(cb)
    })
  }, 2000)
}

function initTronWeb2() {
  let fullNodeUrl = Config.fullNodeOwn
  let fullNode = new TronWeb.providers.HttpProvider(fullNodeUrl)
  let solidityNode = new TronWeb.providers.HttpProvider(fullNodeUrl)
  tronWeb2 = new TronWeb(fullNode, solidityNode, fullNodeUrl, '0A000000000000000000000000000F00000000000000000000000000000000000')
}

function loginScatter(cb) {
  if (!scatter) {
    $('#loginScatter-modal').modal('show')
    return
  }
  let curAddr = getScatterAddress()
  if (curAddr == null) {
    scatter.getIdentity({ accounts: [network] })
    let t = setInterval(() => {
      curAddr = getScatterAddress()
      if (curAddr == null) return
      clearInterval(t)
      walletAddress = curAddr
      window.myAddress = walletAddress
      window.socket.emit('login', { addr: walletAddress })
      if (typeof cb == 'function') cb()
    }, 300)
  } else {
    walletAddress = curAddr
    window.myAddress = walletAddress
    window.socket.emit('login', { addr: walletAddress })
    if (typeof cb == 'function') cb()
  }
}

function getScatterAddress() {
  if (!scatter || !scatter.identity) return null
  return scatter.identity.accounts[0].address
}

function getOrderDataFromString(str, type = 'trx') {
  let tokenAddrCoin = ['trc20']

  let _bettor = Common.hexStringToAddress(str.substr(0, 64))
  let _trxAmount = Common.hexStringToBigNumber(str.substr(64, 64))
  let _orderId = Common.hexStringToInt(str.substr(128, 64))
  let _direction = Common.hexStringToInt(str.substr(192, 64))
  let _under = Common.hexStringToInt(str.substr(256, 64))
  let _roll = Common.hexStringToInt(str.substr(320, 64))
  let tokenAddr = ''
  if (type == 'trc20') {
    tokenAddr = Common.hexStringToAddress(str.substr(384, 64))
  }
  let tokenID = 0
  if (type == 'trc10') {
    tokenID = Common.hexStringToInt(str.substr(384, 64))
  }

  return {
    bettor: _bettor,
    under: _under,
    direction: _direction,
    trxAmount: _trxAmount,
    roll: _roll,
    orderId: _orderId,
    tokenAddr,
    tokenID,
  }
}

function getBetInfoFromOrder(order) {
  let { bettor, under, direction, trxAmount, roll, orderId } = order
  let isWin = false
  let payout = 0
  let multiplier = 0
  let winMoney = 0
  let trxA = trxAmount / 1000000

  if (direction == 0) {
    isWin = roll < under
    multiplier = Common.numFloor(98.5 / under, 10000)
  } else {
    isWin = roll > under
    multiplier = Common.numFloor(98.5 / (99 - under), 10000)
  }
  if (isWin) {
    winMoney = Common.numFloor(trxA * multiplier, 10000)
  } else {
    winMoney = 0
  }

  return {
    orderId,
    bettor: tronWeb.address.fromHex(bettor), //tron地址（唯一）
    name: '', //昵称（唯一）
    number: under, //所猜数字
    direction, //命中数字
    roll, //命中数字
    trx_amount: trxA, //下注额
    payout: winMoney, //赔付额
    multiplier: 1,
    isWin, //是否胜利
    isHighRoller: false, //是否是高额赔付
    isRareWins: false, //是否是低胜率赔付
    ante: 0,
  }
}

//获取合约资金
function getBalance(address, callback) {
  if (typeof address === 'function') {
    callback = address
    address = tronWeb.defaultAddress.hex
  }
  // if(!tronWeb) return;
  if (!TronWeb.isAddress(address)) {
    return callback('Invalid address provided')
  }
  address = TronWeb.address.toHex(address)
  window.axios
    .post(tronUrl + '/wallet/getaccount', { address })
    .then((transaction) => {
      callback(null, transaction.data.balance)
    })
    .catch((err) => {
      setTronUrl()
      callback(err)
    })
}

function checkTxID(transactionID, callback) {
  tronWeb.trx.getTransaction(transactionID, callback)
}

//需要玩家的地址查询
async function viewTransaction(contractAddr, functionSelector, callVal, pamarmArray, cb) {
  tronWeb.transactionBuilder.triggerSmartContract(contractAddr, functionSelector, 1000000, callVal, pamarmArray, async (err, transaction) => {
    if (err) {
      cb(err)
      return
    }
    cb(null, transaction.constant_result)
  })
}

//不需要玩家地址的查询
async function viewTransaction2(contractAddr, functionSelector, callVal, pamarmArray, cb) {
  tronWeb2.transactionBuilder.triggerSmartContract(contractAddr, functionSelector, 1000000, callVal, pamarmArray, async (err, transaction) => {
    if (err) {
      console.log(err, functionSelector)
      cb(err)
      return
    }
    cb(null, transaction.constant_result)
  })
}

//调起钱包
async function commitTransaction(contractAddr, functionSelector, callVal, pamarmArray, feeLimit, cb) {
  tronWeb.transactionBuilder.triggerSmartContract(contractAddr, functionSelector, feeLimit || 100000000, callVal, pamarmArray, async (err, transaction) => {
    if (err) {
      cb(err, '')
      return
    }
    let signData = await tronWeb.trx.sign(transaction.transaction)
    let data = await tronWeb.trx.sendRawTransaction(signData)
    cb(err, data.transaction.txID)
  })
}

//10币调起钱包
async function commitTransactionWith10(contractAddr, functionSelector, token_id, token_value, pamarmArray, fee_limit, cb) {
  let options = {
    feeLimit: fee_limit || 100000000,
    callValue: 0,
    tokenId: token_id,
    tokenValue: token_value,
  }

  tronWeb.transactionBuilder.triggerSmartContract(contractAddr, functionSelector, options, pamarmArray, async (err, transaction) => {
    if (err) {
      cb(err, '')
      return
    }
    let signData = await tronWeb.trx.sign(transaction.transaction)
    let data = await tronWeb.trx.sendRawTransaction(signData)
    cb(err, data.txID)
  })
}

export default Wallet
