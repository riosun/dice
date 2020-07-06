import React, { Component } from 'react'
import { connect } from 'react-redux'
import io from 'socket.io-client'
import Wallet from '../../utils/Wallet'
import Common from '../../utils/Common'
import UI from '../../utils/UI'
import intl from 'react-intl-universal'
import Config from '../../config'

const $ = window.$
const minTargetMoney = 10

let refer = window.getUrlParms('r')
let missionList = {}
if (refer && (refer.length < 4 || refer.length > 16)) {
  refer = false
}

if (refer == null) {
  if (window.location.origin.indexOf('korea') != -1) {
    refer = 'dyeao'
  }
}

window.socket = io(Config.diceSocketUrl)

class App extends Component {
  addBetInfo = []
  //结果滚动
  rollTimer = -1
  app_infoCount = 0
  orderFindCounter = 0

  times = 0
  speed = 10

  componentWillMount() {
    window.cmd({ type: 'diceList', showBetHistory: this.showBetHistory.bind(this) })
    window.cmd({ type: 'dice', startRollNum: this.startRollNum.bind(this) })
  }

  componentDidMount() {
    this.listenSocket()

    //可控定时器
    let timerCnt = 0
    let repairCnt = 0
    setInterval(() => {
      timerCnt += 1
      //5s执行一次
      if (timerCnt % 5 == 0) {
        if ($('#BONUS').css('display') == 'block') {
          Wallet.getAnteInfo(this.props.anteObj, -1, (anteObj) => window.cmd({ type: 'wallet', anteObj }))
        }
        Wallet.getAllBlance((allBlance) => window.cmd({ type: 'wallet', allBlance }))
        this.props.setTRC10Jackpot()
      }

      if (this.orderFindCounter > 0) {
        this.orderFindCounter += 1
        if (this.orderFindCounter < 12) {
          repairCnt = 0
          return
        }

        let tokenType = Wallet.coins[this.props.dice.payType].type
        let tokenID = 0
        if (tokenType == 'trc10') {
          tokenID = Wallet.coins[this.props.dice.payType].tokenType
        }

        Wallet.handleLastOrder((curOrder) => {
          let { bettor, under, direction, trxAmount, roll, orderId, tokenAddr } = curOrder

          let { lastOrderId } = this.props.dice
          console.log('form chain')
          console.log({ lastOrderId, curOrder })
          if (orderId == lastOrderId[tokenType]) {
            console.log('same return')
            repairCnt++
            if (repairCnt > 10) {
              console.log('repairOrder')
              repairCnt++
              this.orderFindCounter = 0
              this.autoPlay()
            }
            return
          }

          if (!(orderId > lastOrderId[tokenType] && roll < 255)) {
            window.socket.emit('new_order', {
              tx: '',
              address: Wallet.getWalletAddress(),
              orderId,
              state: 1,
              tokenAddr,
              tokenType,
              tokenID,
            })
            this.orderFindCounter = 1
            return
          }

          this.orderFindCounter = 0

          let newLastOrderId = {}
          newLastOrderId[tokenType] = orderId
          // console.log("oldOrder", this.props.dice.lastOrderId);
          // console.log("updateOrderID", {...this.props.dice.lastOrderId, ...newLastOrderId});

          window.cmd({ type: 'dice', lastOrderId: { ...this.props.dice.lastOrderId, ...newLastOrderId } })

          let bet_info = Wallet.getBetInfoFromOrder(curOrder)
          Wallet.getUserMoeny((money) => {
            this.goResult(bet_info.roll, bet_info.number, bet_info.direction, money, () => {
              this.showBetHistory(bet_info)
              this.props.setUserAnte()
              this.props.setUserToken()
            })
          })
        }, tokenType)
      }

      // Wallet.getUserMoeny(userMoney=>window.cmd({type:"wallet", userMoney}))
    }, 1000)
  }

  sortByOrderId(myBets) {
    let arr = myBets.sort((a, b) => {
      return b.orderId - a.orderId
    })
    return arr
  }

  resortMission(task) {
    let taskListsTest = task
    let taskObj = []
    let taskArr = []
    let lv = window.lv || 1
    let shouldUnlock = false
    let shouldRedPoint = false

    taskListsTest.map((item) => {
      // a.order = a.status == 1 ? -1 : a.order
      // a.order = a.status == 2 ? 11 : a.order
      // a.order = a.id == 10 ? -2 : a.order

      item.order = item.id % 10
      item.order = item.status == 2 ? -1 : item.order
      item.order = item.status == 3 ? 11 : item.order
      item.order = item.id == 10 ? -2 : item.order
      if (item.now != 0) {
        shouldUnlock = true
      }
      if (item.status == 2) {
        shouldRedPoint = true
      }
      item.amount = item.amount == 0 && item.id == 10 ? 20 : item.amount
      item.amount = item.amount == 0 && item.id == 11 ? 30 : item.amount
      item.amount = item.amount == 0 && item.id == 12 ? 50 : item.amount

      switch (item.id % 3) {
        case 0:
          item.game = 'ring'
          break
        case 1:
          item.game = 'dice'
          break
        case 2:
          item.game = 'crash'
          break
        default:
          break
      }
    })

    taskListsTest.map((item) => {
      if (!shouldUnlock) {
        item.status = lv >= 15 ? item.status : 0
      }

      item.game = item.id >= 10 ? 'daily' : item.game
      item.id >= 10 ? taskObj.push(item) : taskArr.push(item)
    })

    taskArr.sort((a, b) => {
      return a.order - b.order
    })

    window.cmd({ type: 'common', taskLists: taskArr, taskDaily: taskObj, redPoint: shouldRedPoint ? true : false })
  }

  listenSocket() {
    window.socket.on('set_img_ret', (res) => {
      window.cmd({ type: 'common', currentImg: res.img })
    })

    window.socket.on('weekly_rank_info', (weekly_rank_info) => window.cmd({ type: 'wallet', weekly_rank_info }))

    window.socket.on('connect', (msg) => {
      console.log('connect..............')
    })

    window.socket.on('return_tasks', (taskLists) => {
      missionList = taskLists
      this.resortMission(taskLists)
      Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
    })

    window.socket.on('task_op_ret', (msg) => {
      UI.showAlert(msg.ret ? 'success' : 'failed', msg.ret ? 'success' : 'failed')
      if (msg.ret) {
        missionList.map((item) => {
          item.status = item.id == msg.id ? 3 : item.status
        })
        this.resortMission(missionList)
      }
      window.cmd({ type: 'common', loading: false })
    })

    window.socket.on('task_state_changed', (msg) => {
      window.cmd({ type: 'common', redPoint: true })
    })

    window.socket.on('task_reset', (msg) => {
      window.cmd({ type: 'common', redPoint: false })
    })

    window.socket.on('login_info', (login_info) => {
      let { lv, APP_INFO, PLAYER_INFO, LASTEST_BETS_QUEUE, HIGH_ROLLERS_QUEUE, RARE_WINS_QUEUE, MY_BETS, MENTOR_INFO } = login_info
      let { BETS_MADE, TOTAL_WON } = APP_INFO
      let allBets = LASTEST_BETS_QUEUE
      let myBets = MY_BETS || []
      let img = login_info.img == undefined ? 10000 : login_info.img
      lv = lv == undefined ? 1 : lv
      window.lv = lv
      img = img == 10000 ? 9999 + Common.getLevelStage(lv) / 10 : img
      window.cmd({
        type: 'wallet',
        betMoney: BETS_MADE,
        newTotalWon: TOTAL_WON,
        totalWon: TOTAL_WON,
        tjTrx: MENTOR_INFO.trx,
      })
      window.cmd({
        type: 'diceList',
        allBets,
        myBets: this.sortByOrderId(myBets),
        highBets: HIGH_ROLLERS_QUEUE,
        rareBets: RARE_WINS_QUEUE,
      })
      window.cmd({ type: 'common', currentImg: img, playerLevel: lv })
      window.socket.emit('get_tasks', { addr: Wallet.getWalletAddress() || '' })

      //获取自己对应币的记录
      let payType = window.localStorage.payType_dice || 'trx'
      let tokenType = Wallet.coins[payType].type
      window.socket.emit('get_dice_log', { address: Wallet.getWalletAddress() || '', tokenType })
    })

    window.socket.on('dice_logs', (result) => {
      window.cmd({ type: 'diceList', myBets: this.sortByOrderId(result.MY_BETS) })
    })

    window.socket.on('app_info', (app_info) => {
      let { BETS_MADE, TOTAL_WON } = app_info
      // this.app_infoCount++;
      // if(this.app_infoCount >= 100){
      // this.app_infoCount = 0;
      window.cmd({ type: 'wallet', betMoney: BETS_MADE, newTotalWon: TOTAL_WON })
      // } else {
      // window.cmd({type:"wallet", betMoney: BETS_MADE})
      // }
    })

    window.socket.on('activity_info', (activity_info) => {
      let { giftBoxNum } = this.props
      window.cmd({ type: 'common', giftBoxNum: giftBoxNum + 1 })
      $('#sdj-box-num').addClass('myshake')
      let t = setTimeout(() => {
        clearTimeout(t)
        $('#sdj-box-num').removeClass('myshake')
      }, 500)
    })

    window.socket.on('bet_info', (bet_info) => {
      if (bet_info.bettor != Wallet.getWalletAddress()) {
        if (bet_info.roll != 255) {
          this.times++
          this.addBetInfo.push(bet_info)
        }
      } else {
        console.log('from server')
        let { tokeType, orderId, roll, number, direction } = bet_info
        let { lastOrderId } = this.props.dice
        // return
        if (orderId > lastOrderId[tokeType]) {
          // window.cmd({type:"dice", lastOrderId:bet_info.orderId})
          lastOrderId[tokeType] = orderId
          window.cmd({ type: 'dice', lastOrderId })
        } else {
          return
        }

        if (!(roll < 255)) return

        this.orderFindCounter = 0
        console.log('showResult')
        //显示结果
        Wallet.getUserMoeny((money) => {
          this.goResult(roll, number, direction, money, () => {
            this.showBetHistory(bet_info)
            this.props.setUserAnte()
            this.props.setUserToken()
          })
        })
      }
    })

    setInterval(() => {
      this.speed = this.times / 10
      this.times = 0
      window.speed = this.speed
    }, 10000)

    setInterval(() => {
      if (this.addBetInfo.length == 0) return
      this.showBetHistory(this.addBetInfo.shift())
      if (this.addBetInfo.length > 30) this.showBetHistory(this.addBetInfo.shift())
      if (this.addBetInfo.length > 40) this.showBetHistory(this.addBetInfo.shift())
      if (this.addBetInfo.length > 50) this.showBetHistory(this.addBetInfo.shift())
      if (this.addBetInfo.length > 60) this.showBetHistory(this.addBetInfo.shift())
      if (this.addBetInfo.length > 70) this.showBetHistory(this.addBetInfo.shift())
    }, 300)
  }

  getMultiplier(selectNum, rollType) {
    selectNum = selectNum.toFixed(0)
    return rollType == 1 ? Common.numFloor(98.5 / selectNum, 10000) : Common.numFloor(98.5 / (99 - selectNum), 10000)
  }

  isHasRecored(bet_info) {
    let { allBets, highBets, rareBets, myBets } = this.props.diceList
    let hasRecored = false
    ;[this.addBetInfo, ...allBets, ...highBets, ...rareBets, myBets].map((item) => {
      if (item.bettor + item.orderId == bet_info.bettor + bet_info.orderId) {
        hasRecored = true
      }
    })
    if (hasRecored) {
      // console.log("same Recored");
    }

    return hasRecored
  }

  showBetHistory(bet_info) {
    let { allBets, myBets, highBets, rareBets } = this.props.diceList
    if (this.isHasRecored(bet_info)) {
      return
    }

    if (bet_info.payout == undefined) {
      console.error('order error', { bet_info })
      return
    }

    if (bet_info.isHighRoller) {
      highBets.unshift(bet_info)
    }
    if (bet_info.isRareWins) {
      rareBets.unshift(bet_info)
    }
    if (bet_info.bettor == Wallet.getWalletAddress()) {
      myBets.unshift(bet_info)
    }
    allBets.unshift(bet_info)

    if (myBets.length > 50) myBets.pop()
    if (allBets.length > 50) allBets.pop()
    if (highBets.length > 50) highBets.pop()
    if (rareBets.length > 50) rareBets.pop()

    window.cmd({
      type: 'diceList',
      allBets,
      highBets,
      rareBets,
      myBets: this.sortByOrderId(myBets),
      updateTime: new Date().valueOf(),
    })
  }

  goResult(roll, number, direction, money, cb) {
    let { changeNum } = this.props.dice
    let total = roll - changeNum

    if (changeNum >= roll) {
      total = 99 - changeNum + roll
    }

    clearInterval(this.rollTimer)
    let pos = 0
    this.rollTimer = setInterval(() => {
      if (pos >= total) {
        clearInterval(this.rollTimer)
        this.showResult(roll, number, direction, money, cb)
        return
      }

      let num = Number(this.props.dice.changeNum) + 1
      if (num > 99) num = 0
      this.setNumColor(num, number, direction)
      if (num < 10) num = '0' + num

      window.cmd({ type: 'dice', changeNum: num, rolling: true })

      pos++
    }, 20)
  }

  showResult(roll, number, direction, newMoney, cb) {
    if (roll < 10) roll = '0' + roll
    let { targetMoney, rollType, selectNum } = this.props.dice

    let { userMoney } = this.props

    let isWin = this.setNumColor(roll, number, direction)
    isWin ? $('#winMp3')[0].play() : $('#loseMp3')[0].play()

    window.cmd({ type: 'dice', changeNum: roll })

    window.cmd({ type: 'wallet', userMoney: newMoney })

    let multiplier = this.getMultiplier(selectNum, rollType)

    let money = isWin ? Common.numFloor(multiplier * targetMoney - targetMoney, 10000) : -targetMoney

    this.fixedMoney(Number(userMoney) + money)

    // if(isWin){
    //   this.showFlyMoney(Common.numFloor((multiplier*targetMoney),  10000));
    // }

    this.showFlyMoney(money)

    if (cb) {
      cb()
    }
  }

  fixedMoney(needMoney) {
    console.log('fixedMoney')
    let t1 = setTimeout(() => {
      Wallet.getUserMoeny((money) => {
        clearTimeout(t1)
        if (Math.abs(needMoney - money) > 20) {
          let t2 = setTimeout(() => {
            clearTimeout(t2)
            Wallet.getUserMoeny((money) => {
              this.autoPlay()
              window.cmd({ type: 'wallet', userMoney: money })
            })
          }, 2000)
        } else {
          this.autoPlay()
          window.cmd({ type: 'wallet', userMoney: money })
        }
      })
    }, 1000)
  }

  setNumColor(num, number, direction) {
    var isWin
    var color

    if (direction == 0) {
      isWin = num < number ? true : false
      color = num < number ? '#01F593' : '#FF006C'
    } else {
      color = num > number ? '#01F593' : '#FF006C'
      isWin = num > number ? true : false
    }

    $('#rollNum').css('color', color)

    return isWin
  }

  showFlyMoney(winMoney) {
    window.cmd({ type: 'dice', winMoney })
    let t = setTimeout(() => {
      clearTimeout(t)
      window.cmd({ type: 'dice', winMoney: 0 })
    }, 2000)
  }

  autoPlay() {
    if (this.props.dice.autoPlay) {
      this.startRollNum(true)
    } else {
      window.cmd({ type: 'dice', rolling: false })
    }
  }

  //win
  startRollNumTRC20() {
    let { tokens } = this.props
    let { targetMoney, payType, selectNum, rollType, autoPlay } = this.props.dice
    //
    let minTargetMoney = Wallet.minMoneyObj[payType]

    if (Number(tokens.win) < minTargetMoney) {
      UI.showNotice(intl.get('TronBetUI_0172'))
      window.cmd({ type: 'dice', rolling: false })
      return
    }

    if (Number(tokens.win) < Number(targetMoney)) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      window.cmd({ type: 'dice', rolling: false })
      return
    }

    //开始下注
    window.cmd({ type: 'dice', rolling: true })

    let value = Number(selectNum.toFixed(0))

    let obj = {
      value,
      rollType,
      tokenNum: targetMoney,
    }

    Wallet.goodLuck20(obj, (err, txID) => {
      console.log({ err, txID })
      if (err) {
        if (autoPlay) {
          this.startRollNum(true)
        } else {
          window.cmd({ type: 'dice', rolling: false })
        }
        return
      }

      let tokenType = 'trc20'
      let lastOrderId = this.props.dice.lastOrderId[tokenType]

      //上报最后订单到服务器
      let counter = 0
      let t = setInterval(() => {
        Wallet.handleLastOrder(async (curOrder) => {
          let { orderId, roll, tokenAddr } = curOrder
          console.log(curOrder)

          if (!(orderId > lastOrderId)) {
            counter += 1
            if (counter < 32) return
            clearInterval(t)

            if (counter == 32) {
              console.log('counter', counter)
              //查到订单被回滚，不重新提交
              if (orderId == lastOrderId && roll == 255) {
                console.log('Lucky order!')
                window.socket.emit('new_order', {
                  tx: txID,
                  address: Wallet.getWalletAddress(),
                  orderId,
                  state: 1,
                  tokenAddr,
                  tokenType,
                })

                window.cmd({ type: 'dice', lastOrderId: { ...this.props.dice.lastOrderId, trc20: orderId - 1 } })

                this.orderFindCounter = 1
                return
              }

              if (autoPlay) {
                this.startRollNum(true)
              } else {
                window.cmd({ type: 'dice', rolling: false })
              }
            }

            return
          }

          clearInterval(t)
          console.log('waite 3s....')
          let t2 = setTimeout(() => {
            console.log('notice server')
            console.log({ tx: txID, address: Wallet.getWalletAddress(), orderId, state: 1, tokenAddr, tokenType })

            clearTimeout(t2)
            //上报到服务器
            window.socket.emit('new_order', {
              tx: txID,
              address: Wallet.getWalletAddress(),
              orderId,
              state: 1,
              tokenAddr,
              tokenType,
            })
            this.orderFindCounter = 1
          }, 3000)
        }, tokenType)
      }, 300)
    })
  }

  //10token
  startRollNumTRC10() {
    let { dice, tokens } = this.props
    let { targetMoney, payType, selectNum, rollType, autoPlay } = dice
    //
    let minTargetMoney = Wallet.minMoneyObj[payType]

    let tokenVlaue = tokens[payType]
    console.log({ payType })
    let tokenID = Wallet.coins[payType].tokenID

    if (Number(tokenVlaue) < minTargetMoney) {
      UI.showNotice(intl.get('TronBetUI_0172'))
      window.cmd({ type: 'dice', rolling: false })
      return
    }

    if (Number(tokenVlaue) < Number(targetMoney)) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      window.cmd({ type: 'dice', rolling: false })
      return
    }

    //开始下注
    window.cmd({ type: 'dice', rolling: true })

    let value = Number(selectNum.toFixed(0))

    let obj = {
      value,
      rollType,
      tokenID,
      tokenNum: targetMoney,
    }

    Wallet.goodLuck10(obj, (err, txID) => {
      console.log({ err, txID })
      if (err) {
        if (autoPlay) {
          this.startRollNum(true)
        } else {
          window.cmd({ type: 'dice', rolling: false })
        }
        return
      }

      let tokenType = 'trc10'
      let lastOrderId = this.props.dice.lastOrderId[tokenType]

      //上报最后订单到服务器
      let counter = 0
      let t = setInterval(() => {
        Wallet.handleLastOrder(async (curOrder) => {
          console.log({ curOrder })
          let { orderId, roll } = curOrder

          if (!(orderId > lastOrderId)) {
            counter += 1
            if (counter < 32) return
            clearInterval(t)

            if (counter == 32) {
              console.log('counter', counter)
              //查到订单被回滚，不重新提交
              if (orderId == lastOrderId && roll == 255) {
                console.log('Lucky order!')
                window.socket.emit('new_order', {
                  tx: txID,
                  address: Wallet.getWalletAddress(),
                  orderId,
                  state: 1,
                  tokenType,
                  tokenID,
                })

                window.cmd({ type: 'dice', lastOrderId: { ...this.props.dice.lastOrderId, trc10: orderId - 1 } })

                this.orderFindCounter = 1
                return
              }

              if (autoPlay) {
                this.startRollNum(true)
              } else {
                window.cmd({ type: 'dice', rolling: false })
              }
            }

            return
          }

          clearInterval(t)
          console.log('waite 3s....')
          let t2 = setTimeout(() => {
            console.log('notice server')
            console.log({ tx: txID, address: Wallet.getWalletAddress(), orderId, state: 1, tokenType })

            clearTimeout(t2)
            //上报到服务器
            window.socket.emit('new_order', {
              tx: txID,
              address: Wallet.getWalletAddress(),
              orderId,
              state: 1,
              tokenType,
              tokenID,
            })
            this.orderFindCounter = 1
          }, 3000)
        }, tokenType)
      }, 300)
    })
  }

  startRollNum(auto = false) {
    if (!Wallet.checkLogin()) return

    let { rolling, targetMoney, selectNum, rollType, autoPlay, payType } = this.props.dice

    if (rolling && !auto) return

    if (Wallet.coins.trc20.indexOf(payType) != -1) {
      this.startRollNumTRC20(auto)
      return
    }

    if (Wallet.coins.trc10.indexOf(payType) != -1) {
      this.startRollNumTRC10(payType)
      return
    }

    let { userMoney } = this.props

    let value = Number(selectNum.toFixed(0))
    let trxVal = targetMoney * 1e6

    if (Number(userMoney) < minTargetMoney) {
      UI.showNotice(intl.get('TronBetUI_0043'))
      window.cmd({ type: 'dice', rolling: false })
      return
    }

    if (Number(userMoney) < Number(targetMoney)) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      window.cmd({ type: 'dice', rolling: false })
      return
    }

    Wallet.getAllBlance((allBlance) => {
      let multiplier = this.getMultiplier(selectNum, rollType)
      let winMoney = Common.numFloor(multiplier * targetMoney - targetMoney, 10000)

      //可以赢得钱小于总奖池的千分之八
      if (winMoney > allBlance * 0.008) {
        UI.showNotice(intl.get('TronBetUI_0042'))
        return
      }

      //开始下注
      window.cmd({ type: 'dice', rolling: true })

      let obj = {
        refer,
        value,
        rollType,
        trxVal,
        userHasBet: this.props.userHasBet,
        userHasRefer: this.props.userHasRefer,
      }

      Wallet.goodLuck(obj, (err, txID) => {
        console.log({ err, txID })
        if (err) {
          console.log(err)
          if (autoPlay) {
            this.startRollNum(true)
          } else {
            window.cmd({ type: 'dice', rolling: false })
          }
          return
        }

        // window.socket.emit("new_order", {tx:txID, address: Wallet.getWalletAddress(), orderId: this.props.dice.lastOrderId, state: 2});

        let tokenType = 'trx'
        let { lastOrderId } = this.props.dice

        //上报最后订单到服务器
        let counter = 0
        let t = setInterval(() => {
          Wallet.handleLastOrder(async (curOrder) => {
            let { orderId, roll, tokenAddr } = curOrder
            console.log({ orderId, newID: lastOrderId[tokenType] })

            if (!(orderId > lastOrderId[tokenType])) {
              counter += 1
              if (counter < 32) return
              // if this happens then
              // rolling is stuck because it is never been completed
              // window.cmd({type: "dice", rolling: false})
              clearInterval(t)

              if (counter == 32) {
                console.log('counter', counter)
                //查到订单被回滚，不重新提交
                if (orderId == lastOrderId[tokenType] && roll == 255) {
                  console.log('Lucky order!')
                  window.socket.emit('new_order', {
                    tx: txID,
                    address: Wallet.getWalletAddress(),
                    orderId,
                    state: 1,
                    tokenAddr,
                    tokenType,
                  })
                  // window.cmd({type: "dice", lastOrderId: orderId - 1 })
                  window.cmd({ type: 'dice', lastOrderId: { ...lastOrderId, trx: orderId - 1 } })

                  this.orderFindCounter = 1
                  return
                }

                if (autoPlay) {
                  this.startRollNum(true)
                } else {
                  window.cmd({ type: 'dice', rolling: false })
                }
              }

              return
            }

            clearInterval(t)
            console.log('waite 3s....')
            let t2 = setTimeout(() => {
              console.log('notice server')
              clearTimeout(t2)
              //上报到服务器
              window.socket.emit('new_order', {
                tx: txID,
                address: Wallet.getWalletAddress(),
                orderId,
                state: 1,
                tokenAddr,
                tokenType,
              })
              window.cmd({ type: 'wallet', userHasBet: true })
              this.orderFindCounter = 1
            }, 3000)
          }, tokenType)
        }, 300)
      })
    })
  }

  updateMoney(txID) {
    let count = 0
    let t = setInterval(async () => {
      count++
      console.log(count)
      let isTxSuccess = await Wallet.isTxSuccess(txID)
      console.log(isTxSuccess)
      if (count >= 5) {
        clearInterval(t)
      }
      if (isTxSuccess) {
        clearInterval(t)
        console.log('update User money')
        Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
      }
    }, 1000)
  }

  render() {
    return <section></section>
  }
}

export default connect((state) => ({
  diceList: state.diceList,
  anteObj: state.wallet.anteObj,
  setUserAnte: state.wallet.setUserAnte,
  setUserToken: state.wallet.setUserToken,
  setTRC10Jackpot: state.wallet.setTRC10Jackpot,
  userMoney: state.wallet.userMoney,
  anteFree: state.wallet.anteFree,
  tokens: state.wallet.tokens,
  userHasBet: state.wallet.userHasBet,
  userHasRefer: state.wallet.userHasRefer,
  dice: state.dice,

  giftBoxNum: state.common.giftBoxNum,
}))(App)
