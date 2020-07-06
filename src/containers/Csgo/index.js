import React, { Component } from 'react'
import { connect } from 'react-redux'
import Common from '../../utils/Common'
import intl from 'react-intl-universal'
import io from 'socket.io-client'
import Wallet from '../../utils/Wallet'
import UI from '../../utils/UI'
import Config from '../../config'

import './style.css'

var _ = require('lodash')
const $ = window.$
const COLORS = { '2': '#666', '3': '#C13C3C', '5': '#278DCB', '50': '#FFC870' }
const NUM_MUT = [
  50,
  5,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  5,
  2,
  5,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  5,
  2,
  5,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  5,
  2,
  5,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  5,
  2,
  5,
  2,
  3,
  2,
  3,
  2,
  3,
  2,
  5,
]
const AUTO_MUT = [2, 3, 5, 50]
const minBetMoney = 10
const maxWinMoney = 120000
const pkBetMoney = [50, 100, 500, 1000, 2000, 5000, 10000, 20000]
let userName = ''
let hasStartRoll = false

//pk
const COLORS_ID = { '1': '#c32d4f', '2': '#278DCB', '3': '#019965', '4': '#ffc76f' }

const typeToColorArr = [
  [3, 5],
  [3, 5, 1],
  [3, 5, 1, 50],
]

let refer = window.getUrlParms('r')
if (refer && (refer.length < 4 || refer.length > 16)) {
  refer = false
}

if (refer == null) {
  if (window.location.origin.indexOf('korea') != -1) {
    refer = 'dyeao'
  }
}

window.socket3 = io(Config.ringSocketUrl)

class App extends Component {
  state = {
    array: [],
  }

  t = 0
  t2 = 0
  t2 = 0

  componentWillUnmount() {
    window.cmd({ type: 'csgo', status: '' })
    hasStartRoll = false
    window.socket3.removeAllListeners('user_name')
    window.socket3.removeAllListeners('activity_info')
    window.socket3.removeAllListeners('connect')
    window.socket3.removeAllListeners('history_logs_ret')
    window.socket3.removeAllListeners('START_ROLL')
    window.socket3.removeAllListeners('CONFIRMING')
    window.socket3.removeAllListeners('WAITING')
    window.socket3.removeAllListeners('KEEP_WAITING')
    window.socket3.removeAllListeners('PENDING')
    window.socket3.removeAllListeners('player_info')
    window.socket3.emit('leave', 'wheel')
    clearInterval(this.t)
    clearInterval(this.t2)
    clearInterval(this.t3)

    $('#ringMp3')[0].stop()

    console.log('componentWillUnmount')

    //pk
    window.socket3.removeAllListeners('room_battle')
    window.socket3.removeAllListeners('room_info')
    window.socket3.removeAllListeners('solo_history_logs_ret')
    window.socket3.removeAllListeners('room_info')
    window.socket3.removeAllListeners('room_battle')
    window.socket3.removeAllListeners('room_ready')
    window.socket3.removeAllListeners('solo_my_logs_ret')
    window.socket3.emit('leave_solo', 'solo_wheel')
    window.cmd({ type: 'csgo', roomsInfo: [] })
  }

  componentDidMount() {
    this.startListen()

    this.t = setInterval(() => {
      console.log(Wallet.getWalletAddress())
      if (Wallet.getWalletAddress()) {
        clearInterval(this.t)
        // this.sortPlayer(this.props.crash.players_list);
        window.socket3.emit('join', 'wheel', Wallet.getWalletAddress() || '')
      }
    }, 1000)
    this.bindUIListen()
  }

  bindUIListen() {
    $('.csgo-history-item').hover(
      function () {
        $(this).find('.csgo-history-item-detail').show()
      },
      function () {
        $(this).find('.csgo-history-item-detail').hide()
      }
    )

    $('.csgo-history-item-detail').hover(
      function () {
        $(this).show()
      },
      function () {
        $(this).hide()
      }
    )

    let pathName = this.props.routing.locationBeforeTransitions.pathname
    if (pathName == '/double' || document.body.clientWidth < 500) {
      $('.csgo-list-view').slimScroll({
        height: 100,
        color: '#fff',
      })
    } else {
      $('.csgo-list-view').slimScroll({
        height: 500,
        color: '#fff',
      })
    }
  }

  startListen() {
    window.socket3.emit('join', 'wheel', Wallet.getWalletAddress() || '') //玩家上线

    window.socket3.emit('history_logs')

    window.socket3.on('user_name', (user_name) => {
      if (user_name != Wallet.getWalletAddress()) {
        userName = user_name
      }
    })

    window.socket3.on('activity_info', (activity_info) => {
      let { giftBoxNum } = this.props
      window.cmd({ type: 'common', giftBoxNum: giftBoxNum + 1 })
      $('#sdj-box-num').addClass('myshake')
      let t = setTimeout(() => {
        clearTimeout(t)
        $('#sdj-box-num').removeClass('myshake')
      }, 500)
    })

    window.socket3.on('connect', (msg) => {
      console.log('ring---connect-----------')
      window.socket3.emit('join', 'wheel', Wallet.getWalletAddress() || '') //玩家上线

      window.cmd({ type: 'csgo', roomsInfo: [] })
      window.socket3.emit('join_solo', 'solo_wheel', Wallet.getWalletAddress() || '') //玩家上线
    })

    window.socket3.on('history_logs_ret', (arr) => {
      if (document.body.clientWidth < 500) {
        arr = arr.slice(0, arr.length - 7)
      }
      arr.sort((a, b) => a.round - b.round)
      window.cmd({ type: 'csgo', history_logs: [...arr] })
      this.bindUIListen()
    })

    window.socket3.on('START_ROLL', (msg) => {
      console.log('start Roll...............................')
      window.cmd({ type: 'csgo', status: 'CONFIRMING' })
      let { angle, luckyNum, hash } = msg
      this.rotate(Number(angle))
      hasStartRoll = true
      $('#csgo-text').css('color', COLORS[NUM_MUT[luckyNum]])
      window.cmd({ type: 'csgo', upChains: { '2': [], '3': [], '5': [], '50': [] } })
    })

    window.socket3.on('CONFIRMING', (msg) => {
      if (this.props.csgo.status == 'CONFIRMING' || this.props.csgo.status == 'CONFIRMING2') return
      window.cmd({ type: 'csgo', status: 'CONFIRMING', newHash: msg.hash })
      //新刷新进来的玩家 修正下一轮的结果
      if (!hasStartRoll) {
        $('#csgo-rotate').css('transform', `rotate(${msg.angle % 360}deg)`)
        $('.triangle_border_up').css('borderColor', 'transparent transparent ' + this.getColNumByAngel(msg.angle))
        $('#csgo-text').css('color', this.getColNumByAngel(msg.angle))
        hasStartRoll = true
        window.cmd({ type: 'csgo', status: 'CONFIRMING2' })
      }
    })

    window.socket3.on('WAITING', (msg) => {
      window.cmd({
        type: 'csgo',
        status: 'WAITING',
        newHash: msg.hash,
        upChains: { '2': [], '3': [], '5': [], '50': [] },
      })
      window.socket3.emit('history_logs')
      Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
      this.props.setUserAnte()

      let { autoPlay, autoPlayMutPos } = this.props.csgo

      if (autoPlay) {
        let t = setTimeout(() => {
          clearTimeout(t)
          this.ring(AUTO_MUT[autoPlayMutPos])
        }, Common.randomNum(500, 3000))
      }
    })

    window.socket3.on('KEEP_WAITING', (msg) => {
      if (this.props.csgo.status == 'PENDING') return
      let count = msg.cntDown * 1000
      clearInterval(this.t2)
      this.t2 = setInterval(() => {
        count -= 30
        if (count <= 0) {
          count = 0
          clearInterval(this.t2)
        }
        // console.log(msg.cntDown * 1000,'倒计时')
        window.cmd({ type: 'csgo', waitTime: count, status: 'KEEP_WAITING', newHash: msg.hash })
      }, 30)
    })

    window.socket3.on('PENDING', (msg) => {
      window.cmd({ type: 'csgo', status: 'PENDING', newHash: msg.hash })
    })

    window.socket3.on('player_info', (player_info) => {
      this.sortPlayer(player_info)
      window.cmd({ type: 'csgo', player_info })
    })

    //pk
    window.socket3.emit('join_solo', 'solo_wheel', Wallet.getWalletAddress() || '') //玩家上线

    window.socket3.on('solo_history_logs_ret', (roomsInfo) => {
      window.cmd({ type: 'csgo', roomsInfo })
      // $(".dual-svg g").css("transform-origin","50% 50%");
    })

    window.socket3.on('solo_my_logs_ret', (soloHistorys) => {
      window.cmd({ type: 'csgo', soloHistorys })
      // $(".dual-svg g").css("transform-origin","50% 50%");
    })

    window.socket3.on('room_info', (room_info) => {
      let { roomsInfo } = this.props.csgo

      let { seatId, roomId, status } = room_info

      //忽略旧的值
      if (roomsInfo[seatId] && roomId == roomsInfo[seatId].roomId && status < roomsInfo[seatId].status) return

      //更新房间信息
      let arr1 = [],
        arr2 = []
      roomsInfo.map((item, i) => {
        if (i == seatId) return
        i < seatId ? arr1.push(item) : arr2.push(item)
      })

      window.cmd({ type: 'csgo', roomsInfo: [...arr1, room_info, ...arr2] })
    })

    window.socket3.on('room_battle', (battle_info) => {
      this.battleRotate(battle_info)
    })

    window.socket3.on('room_ready', (battle_info) => {
      let t = setTimeout(() => {
        clearTimeout(t)

        let { roomsInfo } = this.props.csgo
        roomsInfo.map((item, i) => {
          if (item.roomId == battle_info.roomId) {
            item.countDown = 10
          }
        })
        window.cmd({ type: 'csgo', roomsInfo })
      }, 500)
    })

    // setTimeout(()=>{
    //   console.log("start roll");
    //   // this.battleRotate({roomId:80, luckyNum:2, angle:800});
    //
    //   let battle_info = {roomId:84, luckyNum:2, angle:800};
    //
    //   let {roomsInfo} = this.props.csgo;
    //   let targetItem = {};
    //   roomsInfo.map((item,i)=>{
    //     if(item.roomId == battle_info.roomId){
    //       targetItem = item;
    //     }
    //   });
    //
    //   let count = 5;
    //   let t = setInterval(()=>{
    //     if(count <= 0){
    //       clearInterval(t);
    //       this.battleRotate(battle_info);
    //     }
    //     targetItem.countDown = count;
    //     window.cmd({type:"csgo", roomsInfo});
    //     count--;
    //   }, 1000)
    //
    //
    // }, 5000)
    let count = 0
    setInterval(() => {
      let { roomsInfo } = this.props.csgo
      let shouldUpdate = false
      roomsInfo.map((item) => {
        if (item.needUpdateColor) {
          this.setColor(item)
        }

        //1s执行刷新
        if (count % 10 == 0) {
          if (item.countDown != undefined && item.countDown >= 0) {
            item.countDown--
            shouldUpdate = true
          }
        }
      })

      if (shouldUpdate) {
        window.cmd({ type: 'csgo', roomsInfo, updateTime: new Date() })
      }

      count++
    }, 100)
  }

  setColor(item) {
    let { roomId, luckyNum, playerCnt } = item
    let deg = $(`#dual${roomId} g`).getRotateAngle()[0]
    let colorArr = {
      '2': [2, 1],
      '3': [2, 3, 1],
      '4': [2, 3, 4, 1],
    }
    let color = COLORS_ID[colorArr[playerCnt][~~(((deg % 360) * playerCnt) / 360)]]
    $(`#tag${roomId}`).attr('fill', color)
  }

  battleRotate(battle_info) {
    let { roomId, luckyNum, angle } = battle_info

    let $g = $(`#dual${roomId} g`)

    this.getTargetItem(battle_info, (targetItem, roomsInfo) => {
      targetItem.needUpdateColor = true
      targetItem.countDown = -1
      window.cmd({ type: 'csgo', roomsInfo })
    })

    $g.rotate({
      angle: 0,
      animateTo: Number(angle),
      duration: 6000,
      easing: $.easing.easeOutQuint,
      callback: () => {
        this.getTargetItem(battle_info, (targetItem, roomsInfo) => {
          targetItem.status = 2
          targetItem.luckyNum = battle_info.luckyNum
          targetItem.needUpdateColor = false
          targetItem.angle = angle
          window.cmd({ type: 'csgo', roomsInfo })
        })

        Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
        this.props.setUserAnte()

        //延时5s置灰
        let t = setTimeout(() => {
          clearTimeout(t)

          this.getTargetItem(battle_info, (targetItem, roomsInfo) => {
            targetItem.status = 3
            window.cmd({ type: 'csgo', roomsInfo })
          })
        }, 5000)
      },
    })
  }

  getTargetItem(battle_info, cb) {
    let targetItem = {}
    let { roomsInfo } = this.props.csgo
    roomsInfo.map((item) => {
      if (item.roomId == battle_info.roomId) targetItem = item
    })
    cb(targetItem, roomsInfo)
  }

  getItemPos(obj, arr) {
    let pos = -1
    arr.map((item, i) => {
      if (item.roomId == obj.roomId) pos = i
    })
    return pos
  }

  sortPlayer(player_info) {
    let { upChains } = this.props.csgo
    let myAddress = Wallet.getWalletAddress()
    ;[2, 3, 5, 50].map((item) => {
      let arr = player_info[`bet${item}X`]
      arr.sort((a, b) => b.amount - a.amount)
      let newArr = [],
        myArr = []
      arr.map((item2) => {
        item2.addr == myAddress ? myArr.push(item2) : newArr.push(item2)
      })
      player_info[`bet${item}X`] = [...myArr, ...newArr]
      //删除本地的
      let localArr = upChains[item]
      localArr.map((item) => (item.isRemove = false))
      myArr.map((item2) => {
        let hasRemove = false
        localArr.map((item3) => {
          if (item3.amount == item2.amount && !hasRemove && item3.isRemove == false) {
            hasRemove = true
            item3.isRemove = true
          }
        })
      })
    })
  }

  getColNumByAngel(deg) {
    return COLORS[NUM_MUT[~~(((deg % 360) * 54) / 360)]]
  }

  rotate(deg) {
    // let deg = Common.randomNum(360*2, 360*3);
    let $csgoRotate = $('#csgo-rotate')

    let color = ''
    $('#ringMp3')[0].play()

    this.t3 = setInterval(() => {
      $('.triangle_border_up').css('borderColor', 'transparent transparent ' + this.getColNumByAngel($csgoRotate.getRotateAngle()[0]))
    }, 30)

    let mut = NUM_MUT[~~(((deg % 360) * 54) / 360)]
    let { player_info } = this.props.csgo

    $csgoRotate.rotate({
      angle: 0,
      animateTo: deg,
      duration: 7000,
      easing: $.easing.easeOutQuint,
      callback: () => {
        clearInterval(this.t3)
        player_info['betWin' + mut] = true
        player_info[`bet${mut}XTotal`] *= mut
        window.cmd({ type: 'csgo', player_info, status: 'CONFIRMING2' })
        Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
        this.props.setUserAnte()

        let payMoney = 0
        let addr = Wallet.getWalletAddress()

        if (!addr) return
        ;[2, 3, 5, 50].map((item) => {
          let arr = player_info[`bet${item}X`]
          arr.map((item2) => {
            if (item2.addr == addr) {
              payMoney += item2.amount
            }
          })
        })

        let winMoney = 0
        player_info[`bet${mut}X`].map((item) => {
          if (item.addr == addr) {
            winMoney += item.amount * mut
          }
        })

        this.showFlyMoney(winMoney - payMoney)
      },
    })
  }

  showFlyMoney(winMoney) {
    window.cmd({ type: 'csgo', winMoney: Common.numFloor(winMoney, 100) })
    let t = setTimeout(() => {
      clearTimeout(t)
      window.cmd({ type: 'csgo', winMoney: 0 })
    }, 2000)
  }

  hasBet(list) {
    let hasBet = false
    let myAddress = Wallet.getWalletAddress()
    list.map((item) => {
      if (item.addr == myAddress) {
        hasBet = true
      }
    })
    return hasBet
  }

  ring(multiplier) {
    if (!Wallet.checkLogin()) return
    if (this.props.csgo.status != 'KEEP_WAITING') return

    let { userMoney, userHasBet, userHasRefer, csgo } = this.props
    let { betMoney, player_info, upChains } = csgo

    if (Number(userMoney) < minBetMoney) {
      UI.showNotice(intl.get('TronBetUI_0043'))
      return
    }
    if (Number(userMoney) < Number(betMoney)) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      return
    }

    if (betMoney > maxWinMoney / multiplier) {
      UI.showNotice(intl.get('TronBetUI_0042'))
      return
    }

    let suggest = player_info[`bet${multiplier}X`].length

    let totalMoney = 0
    let localArr = upChains[multiplier]
    localArr.map((item) => {
      totalMoney += item.amount
    })

    if (totalMoney + Number(betMoney) > maxWinMoney / multiplier) {
      UI.showNotice(intl.get('TronBetUI_0042'))
      return
    }

    if (localArr.length >= 5) return

    localArr.push({ name: '', addr: Wallet.getWalletAddress(), name: userName, amount: Number(betMoney), local: true })

    let obj = {
      trxVal: betMoney * 1e6,
      suggest,
      multiplier,
      refer,
      userHasBet,
      userHasRefer,
    }

    Wallet.ring(obj, async (err, txID) => {
      console.log({ err, txID })
      if (err) return

      let count = 0
      let t = setInterval(async () => {
        count++
        if (count > 6) {
          let { status, players_list } = this.props.csgo
          if (status == 'PENDING') {
            if (!this.hasBet(player_info[`bet${multiplier}X`])) {
              // UI.showAlert("error", intl.get("TronBetUI_1025"));
            }
            clearInterval(t)
            return
          }
        } else {
          let isTxSuccess = await Wallet.isTxSuccess(txID)
          console.log({ isTxSuccess })
          if (isTxSuccess) {
            // UI.showAlert("success", intl.get("TronBetUI_1024"));
            clearInterval(t)
            window.socket3.emit('player_in', Wallet.getWalletAddress(), betMoney, multiplier)
          }
        }
      }, 1000)
    })
  }

  updateCreateSelect(typePos, colorPos, moneyPos) {
    window.cmd({ type: 'csgo', createOpr: { typePos, colorPos, moneyPos } })
  }

  createSolo() {
    if (!Wallet.checkLogin()) return
    let { userMoney } = this.props

    let { typePos, colorPos, moneyPos } = this.props.csgo.createOpr
    let types = [2, 3, 4]

    if (Number(userMoney) < Number(pkBetMoney[moneyPos])) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      return
    }

    let createObj = {
      lv: moneyPos,
      playerAmount: types[typePos],
      seat: colorPos,
      trxVal: pkBetMoney[moneyPos] * 1e6,
    }

    $('#create-dual-modal').modal('hide')

    Wallet.createSolo(createObj, (err, txID) => {
      console.log(txID)
      if (err) {
        UI.showAlert('error', intl.get('TronBetUI_1025'))
        return
      }
      UI.showAlert('success', intl.get('TronBetUI_4015'))

      //更新钱
      Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
    })
  }

  joinSolo(seat, tableIndex, item) {
    if (item['player' + seat] != '') return

    if (!Wallet.checkLogin()) return
    let { userMoney } = this.props

    if (Number(userMoney) < Number(item.amount)) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      return
    }

    let joinObj = {
      roomId: item.roomId,
      seat: seat - 1,
      tableIndex,
      trxVal: item.amount * 1e6,
    }
    console.log({ joinObj })

    Wallet.joinSolo(joinObj, (err, txID) => {
      console.log(txID)
      if (err) {
        UI.showAlert('error', intl.get('TronBetUI_1025'))
        return
      }
      UI.showAlert('success', intl.get('TronBetUI_4015'))

      //更新钱
      Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
    })
  }

  getItemUserClass(pos, item) {
    let cls = ''
    if (pos == item.luckyNum) {
      cls += 'win '
    }

    if ((item['player' + pos] == userName || item['player' + pos] == Wallet.getWalletAddress()) && item['player' + pos] != '') {
      cls += ' me'
    }
    return cls
  }

  getSoloItem(item, key, isHistory = false) {
    return (
      <div className={item.status == 3 && !isHistory ? 'dual-item  solo-history' : 'dual-item'} key={key}>
        <div className="dual-item-money">
          <i className="iconfont icon-tron"></i> {item.amount}
        </div>
        <div className="dual-item-roomId">#{key + 1}</div>

        <svg width="130" height="130" id={'dual' + item.roomId} className="dual-svg">
          <g style={{ transform: item.angle ? `rotate(${item.angle}deg)` : 'rotate(0deg)' }} className={item.playerCnt == 4 ? '' : 'hide'}>
            <path fill={item.player1 == '' ? '#404046' : '#c32d4f'} d="M64,125C31.7,124.4,5.6,98.3,5,66H0c0.5,35.1,28.9,63.4,64,64V125z" />
            <path fill={item.player2 == '' ? '#404046' : '#278DCB'} d="M125,66c-0.5,32.3-26.7,58.4-59,59v5c35.1-0.5,63.4-28.9,64-64H125z" />
            <path fill={item.player3 == '' ? '#404046' : '#019965'} d="M66,5c32.3,0.5,58.4,26.7,59,59h5c-0.5-35.1-28.9-63.4-64-64V5z" />
            <path fill={item.player4 == '' ? '#404046' : '#ffc76f'} d="M5,64C5.6,31.7,31.7,5.6,64,5V0C28.9,0.6,0.6,28.9,0,64H5z" />
          </g>

          <g style={{ transform: item.angle ? `rotate(${item.angle}deg)` : 'rotate(0deg)' }} className={item.playerCnt == 3 ? '' : 'hide'}>
            <path
              fill={item.player1 == '' ? '#404046' : '#c32d4f'}
              d="M64,125C31.4,124.4,5,97.7,5,65c0-10.6,2.8-20.5,7.6-29.1l-4.3-2.5C3,42.7,0,53.5,0,65c0,35.6,28.6,64.4,64,65V125z"
            />
            <path
              fill={item.player2 == '' ? '#404046' : '#278DCB'}
              d="M121.8,33.4l-4.3,2.5c4.8,8.6,7.6,18.6,7.6,29.1c0,32.7-26.4,59.4-59,60v5c35.4-0.5,64-29.4,64-65 C130,53.5,127,42.7,121.8,33.4z"
            />
            <path
              fill={item.player3 == '' ? '#404046' : '#019965'}
              d="M13.6,34.1C24.1,16.7,43.2,5,65,5s40.9,11.7,51.4,29.1l4.3-2.5C109.4,12.7,88.7,0,65,0S20.6,12.7,9.2,31.6L13.6,34.1z"
            />
          </g>

          <g style={{ transform: item.angle ? `rotate(${item.angle}deg)` : 'rotate(0deg)' }} className={item.playerCnt == 2 ? '' : 'hide'}>
            <path
              fill={item.player1 == '' ? '#404046' : '#c32d4f'}
              d="M64,125C31.4,124.4,5,97.7,5,65S31.4,5.6,64,5V0C28.6,0.6,0,29.4,0,65s28.6,64.4,64,65V125z"
            />
            <path
              fill={item.player2 == '' ? '#404046' : '#278DCB'}
              d="M66,0v5c32.6,0.5,59,27.2,59,60s-26.4,59.4-59,60v5c35.4-0.5,64-29.4,64-65S101.4,0.6,66,0z"
            />
          </g>

          <path d="M65,98.8L58.5,95.55L65,111.8L71.5,95.55Z" fill={item.luckyNum ? COLORS_ID[item.luckyNum] : '#666666'} id={'tag' + item.roomId}></path>
        </svg>

        {item.status == 2 || item.status == 3 ? (
          <div className="winner-info" style={{ color: COLORS_ID[item.luckyNum] }}>
            <span>{Common.parseName(item['player' + item.luckyNum])}</span>
            <br />
            <span>
              <i className="iconfont icon-tron"></i> +{item.amount * item.playerCnt * 0.95}
            </span>
          </div>
        ) : (
          ''
        )}

        <div className={item.countDown >= 0 ? 'dual-countDown' : 'hide'}>
          <span>Starting in:</span>
          <br />
          <span style={{ fontSize: '18px' }}>{item.countDown}</span>
        </div>

        <div className="dual-item-users">
          <p className={this.getItemUserClass(1, item)}>
            {' '}
            {Common.parseName(item.player1) == '' ? intl.get('TronBetUI_4016') : Common.parseName(item.player1)}{' '}
            <span className="glyphicon glyphicon-user"></span>
          </p>
          <p className={this.getItemUserClass(2, item)}>
            <span className="glyphicon glyphicon-user"></span>{' '}
            {Common.parseName(item.player2) == '' ? intl.get('TronBetUI_4016') : Common.parseName(item.player2)}{' '}
          </p>
          {item.playerCnt < 3 ? (
            ''
          ) : (
            <p className={this.getItemUserClass(3, item)}>
              {' '}
              {Common.parseName(item.player3) == '' ? intl.get('TronBetUI_4016') : Common.parseName(item.player3)}{' '}
              <span className="glyphicon glyphicon-user"></span>
            </p>
          )}
          {item.playerCnt < 4 ? (
            ''
          ) : (
            <p className={this.getItemUserClass(4, item)}>
              <span className="glyphicon glyphicon-user"></span>{' '}
              {Common.parseName(item.player4) == '' ? intl.get('TronBetUI_4016') : Common.parseName(item.player4)}{' '}
            </p>
          )}
        </div>

        {item.status == 0 ? (
          <div className="dual-join">
            {intl.get('TronBetUI_4017')}
            <hr />
            <p className={item.player1 == '' ? '' : 'active'} onClick={() => this.joinSolo(1, key, item)}>
              {' '}
              {item.player1 == '' ? intl.get('TronBetUI_4018') + ' ' + item.amount : Common.parseName(item.player1)}{' '}
              <span className={item.player1 == '' ? 'iconfont icon-tron' : 'hide'}></span>
            </p>
            <p className={item.player2 == '' ? '' : 'active'} onClick={() => this.joinSolo(2, key, item)}>
              {' '}
              {item.player2 == '' ? intl.get('TronBetUI_4018') + ' ' + item.amount : Common.parseName(item.player2)}{' '}
              <span className={item.player2 == '' ? 'iconfont icon-tron' : 'hide'}></span>
            </p>
            {item.playerCnt < 3 ? (
              ''
            ) : (
              <p className={item.player3 == '' ? '' : 'active'} onClick={() => this.joinSolo(3, key, item)}>
                {' '}
                {item.player3 == '' ? intl.get('TronBetUI_4018') + ' ' + item.amount : Common.parseName(item.player3)}{' '}
                <span className={item.player3 == '' ? 'iconfont icon-tron' : 'hide'}></span>
              </p>
            )}
            {item.playerCnt < 4 ? (
              ''
            ) : (
              <p className={item.player4 == '' ? '' : 'active'} onClick={() => this.joinSolo(4, key, item)}>
                {' '}
                {item.player4 == '' ? intl.get('TronBetUI_4018') + ' ' + item.amount : Common.parseName(item.player4)}{' '}
                <span className={item.player4 == '' ? 'iconfont icon-tron' : 'hide'}></span>
              </p>
            )}
          </div>
        ) : (
          ''
        )}
      </div>
    )
  }

  render() {
    let { userMoney, csgo } = this.props

    let lastAangle = csgo.history_logs[0] ? csgo.history_logs[csgo.history_logs.length - 1].angle : 2.2
    let lastColor = this.getColNumByAngel(lastAangle)

    let pathName = this.props.routing.locationBeforeTransitions.pathname

    return (
      <section className="por" style={{ backgroundImage: "url('./images/bg.jpg')", backgroundSize: 'cover' }}>
        <div id="csgo-top-opr" className="sno hide">
          <a href="#/ring">
            <span className={pathName == '/ring' ? 'active' : ''} style={{ borderRadius: '5px 0px 0px 5px' }}>
              {intl.get('TronBetUI_4000')}
            </span>
          </a>
          <a href="#/ringPk">
            <span className={pathName == '/ringPk' ? 'active' : ''} style={{ borderRadius: '0px 5px 5px 0px', position: 'relative' }}>
              {intl.get('TronBetUI_4004')}
              <img src="./images/lock.png" className="hide" width="12" style={{ position: 'absolute', right: '2px', top: '2px' }} />
            </span>
          </a>
        </div>

        <div className={pathName == '/ring' || pathName == '/double' ? '' : 'hide'}>
          <div id="csgo-view">
            <div id="csgo-rotate" style={{ transform: `rotate(${lastAangle % 360}deg)` }}>
              <img src="./images/wheel_bg.png" />
            </div>

            <div id="csgo-text" style={{ color: lastColor }}>
              <div id="csgo-djs" className={csgo.status == 'KEEP_WAITING' || csgo.status == 'PENDING' ? '' : 'hide'}>
                {csgo.status == 'PENDING' ? <span style={{ fontSize: '18px' }}>{intl.get('TronBetUI_1004')}</span> : (csgo.waitTime / 1000).toFixed(2)}
              </div>
              <span id="csgo-djs" className={csgo.status == 'CONFIRMING2' ? '' : 'hide'} style={{ fontSize: '18px' }}>
                {intl.get('TronBetUI_4008')}
              </span>
              <div id="csgo-jt">
                <div style={{ width: '20px', margin: '0px auto' }}>
                  <div className="triangle_border_up" style={{ borderColor: 'transparent transparent ' + lastColor }} id="jt1"></div>
                  <div className="triangle_border_up" style={{ borderColor: 'transparent transparent ' + lastColor }} id="jt2"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="tac" style={{ fontSize: '12px', color: '#666', padding: '10px', wordBreak: 'break-all' }}>
            {intl.get('TronBetUI_4001')}: {csgo.newHash}
            &nbsp;&nbsp;
            <i className="fa fa-question-circle" onClick={() => $('#ring-notice-modal').modal('show')} style={{ cursor: 'pointer', fontSize: '16px' }}></i>
          </div>

          <div id="csgo-history">
            {csgo.history_logs.map((item, key) => (
              <div className={`csgo-history-item type-${NUM_MUT[item.roll]}x`} key={key}>
                <span></span>
                <div className="csgo-history-item-detail">
                  {intl.get('TronBetUI_4001')}:<br />
                  <span style={{ color: '#aaa' }}>{item.hash}</span>
                  <br />
                  {intl.get('TronBetUI_4002')}:<br />
                  <span style={{ color: '#aaa' }}>{item.salt}</span>
                  <br />
                  {intl.get('TronBetUI_4003')}:<br />
                  <span style={{ color: '#aaa' }}>{item.roll}</span>
                </div>
              </div>
            ))}
          </div>

          <div id="csgo-opr">
            <p style={{ fontSize: '20px' }} className="por">
              <i className="iconfont icon-tron" style={{ fontSize: '22px' }}></i>&nbsp;{userMoney}
              <span
                className={csgo.winMoney == 0 ? 'hide' : 'animated slideOutUp'}
                style={{ color: csgo.winMoney > 0 ? '#01F593' : '#FF006C', paddingLeft: '25px', fontSize: '16px' }}
                id="flyNum"
              >
                {csgo.winMoney > 0 ? '+' : ''}
                {csgo.winMoney} TRX
              </span>
            </p>
            <p id="csgo-money-opr">
              <label>
                {intl.get('TronBetUI_0017')}
                <span
                  className="label-btn"
                  onClick={() => {
                    if (csgo.autoPlay) return

                    let afterMoney = csgo.betMoney * 2
                    if (afterMoney > userMoney) {
                      afterMoney = Math.floor(userMoney)
                    }
                    if (afterMoney < minBetMoney) afterMoney = minBetMoney

                    if (Math.floor(userMoney) - afterMoney < 3 && afterMoney >= 13) {
                      afterMoney = afterMoney - 3
                    }

                    window.cmd({ type: 'csgo', betMoney: afterMoney })
                  }}
                >
                  x2
                </span>
                <span
                  className="label-btn"
                  onClick={() => {
                    if (csgo.autoPlay) return

                    let money = csgo.betMoney / 2
                    if (money < minBetMoney) {
                      money = minBetMoney
                    }
                    window.cmd({ type: 'csgo', betMoney: money.toFixed(0) })
                  }}
                >
                  1/2
                </span>
                <span
                  className="label-btn"
                  onClick={() => {
                    if (csgo.autoPlay) return

                    window.cmd({ type: 'csgo', betMoney: minBetMoney })
                  }}
                >
                  Min
                </span>
                <span
                  className="label-btn"
                  onClick={() => {
                    if (csgo.autoPlay) return

                    let betMoney = minBetMoney
                    if (userMoney > minBetMoney) {
                      betMoney = Math.floor(userMoney)
                    }
                    if (Math.floor(userMoney) - betMoney < 3 && betMoney >= 13) {
                      betMoney = betMoney - 3
                    }
                    window.cmd({ type: 'csgo', betMoney })
                  }}
                >
                  Max
                </span>
              </label>
            </p>
            <p id="csgo-input-money">
              <input
                type="tel"
                value={csgo.betMoney}
                className={csgo.autoPlay ? 'csgo-lock' : ''}
                onBlur={(e) => {
                  if (e.target.value < minBetMoney) {
                    window.cmd({ type: 'csgo', betMoney: minBetMoney })
                  }
                }}
                onChange={(e) => {
                  if (csgo.autoPlay) return

                  let betMoney = e.target.value.replace(/[^\d]/g, '')
                  if (Number(betMoney) > Number(userMoney)) {
                    betMoney = Math.floor(userMoney)
                  }

                  if (Math.floor(userMoney) - betMoney < 3 && betMoney >= 13) {
                    betMoney = betMoney - 3
                  }
                  window.cmd({ type: 'csgo', betMoney })
                }}
              />
            </p>

            <p id="csgo-auto">
              {[2, 3, 5, 50].map((item, key) => (
                <span
                  key={key}
                  className={csgo.autoPlayMutPos == key ? `active s-${item}x` : `s-${item}x`}
                  onClick={() => {
                    if (csgo.autoPlay) return
                    window.cmd({ type: 'csgo', autoPlayMutPos: key })
                  }}
                ></span>
              ))}

              <div
                className={csgo.autoPlay ? 'ly-switch open' : 'ly-switch'}
                onClick={() => {
                  window.cmd({ type: 'csgo', autoPlay: !csgo.autoPlay })
                }}
              >
                <p>{csgo.autoPlay ? intl.get('TronBetUI_0112') : intl.get('TronBetUI_0113')}</p>
                <span>{intl.get('TronBetUI_0092')}</span>
              </div>
            </p>
          </div>

          <div className="ovh" style={{ minHeight: '500px' }}>
            {[2, 3, 5, 50].map((item, key) => (
              <div
                key={key}
                className={csgo.status == 'KEEP_WAITING' || csgo.player_info[`betWin${item}`] ? 'col-md-3 csgo-opr-list' : 'col-md-3 csgo-opr-list csgo-lock'}
                id={'csgo-item' + item}
                style={{ color: COLORS[item + ''] }}
              >
                <button className="csgo-btn" id={`csgo-btn-${item}x`} onClick={() => this.ring(item)}>
                  <span style={{ position: 'relative', top: '-5px' }}>{item}x</span>
                  <label>Max: {maxWinMoney / item}TRX</label>
                </button>
                <div className="csgo-item-total">
                  <span className="fol">
                    <i className="iconfont icon-users"></i> {csgo.player_info[`bet${item}X`].length}{' '}
                  </span>
                  <span className="for">
                    <i className="iconfont icon-tron" style={{ fontSize: '20px' }}></i> {csgo.player_info[`bet${item}XTotal`]}
                  </span>
                </div>
                <div className="csgo-list-view">
                  <table>
                    {[...csgo.upChains[item], ...csgo.player_info[`bet${item}X`]].map((item2, key) => (
                      <tr key={key} className={item2.isRemove ? 'hide' : ''}>
                        <td>{item2.name == '' ? window.parseAddress(item2.addr) : Common.strTo7(item2.name)}</td>
                        <td className="tar">
                          {item2.amount}&nbsp;{item2.local ? <i className="fa fa-spinner fa-spin"></i> : ''}
                        </td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={pathName == '/ringPk' ? '' : 'hide'} id="dual">
          <div style={{ padding: '0px 10px', height: '38px' }}>
            <button
              id="dual-history"
              onClick={() => {
                if (!csgo.showHistory) window.socket3.emit('solo_my_logs', Wallet.getWalletAddress())
                window.cmd({ type: 'csgo', showHistory: !csgo.showHistory })
              }}
            >
              {csgo.showHistory ? intl.get('TronBetUI_4020') : intl.get('TronBetUI_4019')}
            </button>{' '}
            &nbsp;&nbsp;
            <button id="dual-create" onClick={() => $('#create-dual-modal').modal('show')}>
              {intl.get('TronBetUI_4010')}
            </button>{' '}
            &nbsp;&nbsp;
            <span style={{ fontSize: '16px' }}>
              {intl.get('TronBetUI_0018')}: {userMoney}
            </span>
            <br />
          </div>

          <div className={csgo.showHistory ? 'hide' : ''}>{csgo.roomsInfo.map((item, key) => this.getSoloItem(item, key))}</div>

          <div className={csgo.showHistory ? '' : 'hide'} style={{ overflow: 'hidden', paddingBottom: '20px' }}>
            {csgo.soloHistorys.map((item, key) => this.getSoloItem(item, key, true))}
          </div>
        </div>

        <div className="modal fade" id="create-dual-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="tac">{intl.get('TronBetUI_4010')}</h4>
              </div>
              <div className="modal-body" style={{ padding: '20px 30px' }}>
                <table style={{ width: '100%' }}>
                  <tr>
                    <td style={{ minWidth: '80px' }}>{intl.get('TronBetUI_4011')}:</td>
                    <td>
                      <div>
                        <span
                          className={csgo.createOpr.typePos == 0 ? 'type-icon active' : 'type-icon'}
                          onClick={() => this.updateCreateSelect(0, 0, csgo.createOpr.moneyPos)}
                        >
                          <i className="iconfont icon-users"></i>
                        </span>
                        <span
                          className={csgo.createOpr.typePos == 1 ? 'type-icon active' : 'type-icon'}
                          onClick={() => this.updateCreateSelect(1, 0, csgo.createOpr.moneyPos)}
                        >
                          <i className="iconfont icon-users3"></i>
                        </span>
                        <span
                          className={csgo.createOpr.typePos == 2 ? 'type-icon active' : 'type-icon'}
                          onClick={() => this.updateCreateSelect(2, 0, csgo.createOpr.moneyPos)}
                        >
                          <i className="iconfont icon-users4"></i>
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <label style={{ marginTop: '30px' }}>{intl.get('TronBetUI_4012')}:</label>
                    </td>
                    <td>
                      <div id="csgo-color-slect">
                        {typeToColorArr[csgo.createOpr.typePos].map((item, key) => (
                          <span
                            key={key}
                            className={csgo.createOpr.colorPos == key ? `active s-${item}x` : `s-${item}x`}
                            onClick={() => this.updateCreateSelect(csgo.createOpr.typePos, key, csgo.createOpr.moneyPos)}
                          ></span>
                        ))}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <label style={{ marginTop: '30px' }}>{intl.get('TronBetUI_4013')}:</label>
                    </td>
                    <td>
                      <div id="csgo-money-slect">
                        {pkBetMoney.map((item, key) => (
                          <span
                            key={key}
                            className={csgo.createOpr.moneyPos == key ? 'active' : ''}
                            onClick={() => this.updateCreateSelect(csgo.createOpr.typePos, csgo.createOpr.colorPos, key)}
                          >
                            {' '}
                            <i className="iconfont icon-tron"></i>&nbsp;{item}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                </table>

                <button id="dual-create" style={{ marginTop: '30px', width: '100%' }} onClick={() => this.createSolo()}>
                  {intl.get('TronBetUI_4014')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

export default connect((state) => ({
  userMoney: state.wallet.userMoney,
  userHasBet: state.wallet.userHasBet,
  userHasRefer: state.wallet.userHasRefer,
  setUserAnte: state.wallet.setUserAnte,
  giftBoxNum: state.common.giftBoxNum,

  routing: state.routing,
  csgo: state.csgo,
}))(App)
