const config = require('./contractAddr')

const env = process.env.REACT_APP_ENV

// 正式环境
let abiAddrObj = {
  //上线合约
  Referralship: '41af16843d1b471364576015e4062cdc3f2628eb62', //邀请推荐
  DicePool: '411d0f4031f9e3eeeb727b10e462ab0e59ee06a2a6', //dice奖池
  DiceToken: '416ce0632a762689a207b9cce915e93aa9596816ca', //dice币
  WinToken: '4174472e7d35395a6b5add427eecb7f4b62ad2b071', //dice币
  DiceStaker: '41aef3746e20c2a49b70c2c32b4f343548f428e7f1', //dice币质押
  DiceFestival: '41e4d7994f46df4322db5e170f25cc7f8f19d230db', //节日活动购买宝箱合约
  //游戏下单合约
  DiceBet: '41e42d76d15b7ecd27a92cc9551738c2635c63b71c', //骰子下单合约
  DiceMoon: '41bdd85750b6774910ca5d12b0620ba318eb00154b', //Moon下单合约
  DiceRing: '41106841eb00cad39b90bf410fc52af8f73f2bbe2b', //Ring下单合约
  DiceDual: '4125fcfd3729801561b37f73189c98ab50341310c5', //Ring PVP下单合约
  //多币种下单合约
  DiceBet20: '41f44697c352fc12b15718147f625b97720b21c41e', //骰子下单erc20合约
  DiceBetPool20: '41a319aae271b031fba91cf489b709616e837a1a56', //erc20币奖池
  DiceBet10: '411fee56b32884a49155b7b6137ec0f1ee657455d5', //骰子下单erc10合约
  DiceBetPool10: '41049909a380d589b9af76846280d3fcbeb67826f0', //erc10币奖池
}
// 测试和本地开发
if (env === 'local' || env === 'dev') {
  abiAddrObj = {
    // 测试合约
    Referralship: config.Referralship, //邀请推荐
    DicePool: config.TronBetPool, //dice奖池  // TronBetPool
    DiceToken: config.TronbetDiceToken, //dice币  // TronbetDiceToken
    WinToken: config.WinToken, //骰子下单erc20合约 // NOTE: Wink token合约地址，这里是自己发的普通trc20合约地址用来测试
    DiceStaker: config.TronBetDiceStaker, //dice币质押  // TronBetDiceStaker
    DiceFestival: '41e4d7994f46df4322db5e170f25cc7f8f19d230db', //节日活动购买宝箱合约
    // 游戏下单合约
    DiceBet: config.TronBetDice, //骰子下单合约 // TronbetDice
    DiceMoon: config.TronBetMoon, //Moon下单合约  // TronbetMoon
    DiceRing: config.TronBetRing, //Ring下单合约  // TronbetRing
    DiceDual: config.TronBetRingPvp, //Ring PVP下单合约 // TronBetRingPvp
    // 多币种下单合约
    DiceBet20: config.TronBetDice20, //骰子下单erc20合约 // TronBetDice20
    DiceBetPool20: config.TronBetPool20, //erc20币奖池  // TronBetPool20
    DiceBet10: config.TronBetDice10, //骰子下单erc10合约 // TronBetDice10
    DiceBetPool10: config.TronBetPool10, //erc10币奖池 // TronBetPool10
  }
}
module.exports = Object.assign(abiAddrObj)
