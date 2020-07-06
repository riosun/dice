import React, { Component } from 'react'
import { connect } from 'react-redux'
import intl from 'react-intl-universal'
import Common from '../../utils/Common'
import Wallet from '../../utils/Wallet'
import UI from '../../utils/UI'
import io from 'socket.io-client'
import _ from 'lodash'
import Config from '../../config'

import './style.css'

const $ = window.$
const ctgA2 = 2.747477419 // 20度余切
const minBetMoney = 10
const maxBetMoney = 20000
const maxWinMoney = 200000
const maxRunMut = 9999.0

const pixelTatio = Common.getDevicePixelRatio()
const frameInterval = 33
const canvasMarginTop = pixelTatio <= 1 ? 24 * pixelTatio : 12 * pixelTatio
const canvasMarginBottom = pixelTatio <= 1 ? 40 * pixelTatio : 24 * pixelTatio
const canvasMarginLeft = 48 * pixelTatio
const canvasMarginRight = 24 * pixelTatio
const arrowHight = pixelTatio <= 1 ? 38 * pixelTatio : 24 * pixelTatio
const arrowOffset = pixelTatio <= 1 ? 8 * pixelTatio : 5 * pixelTatio
const arrowBorn = pixelTatio <= 1 ? 30 * pixelTatio : 18 * pixelTatio
const lineXY = 2 * pixelTatio
const lineScale = 1 * pixelTatio
const lineWidth = pixelTatio <= 1 ? 10 * pixelTatio : 7 * pixelTatio
const lineJoin = pixelTatio <= 1 ? 10 * pixelTatio : 2 * pixelTatio // 箭头和线条衔接处
const aniW = 144 // 动画箭头图片宽度
const aniH = 44 // 动画箭头图片高度

let canvasWidth = 0
let canvasHeight = 0

let coordinateWidth = 0
let coordinateHeight = 0
let coordinateLeftTop = 0
let coordinateOrigin = 0
let coordinateRightBottom = 0
let oneSecWidth = 0

let yDrawArray1 = [0.5, 1]
let linePointCacheArray = []
let linePointCount = 0
let shakeCount = 0

// 动画相关参数
let animationArrow = null
let frameCount = 0

let refer = window.getUrlParms('r')
if (refer && (refer.length < 4 || refer.length > 16)) {
  refer = false
}

if (refer == null) {
  if (window.location.origin.indexOf('korea') != -1) {
    refer = 'dyeao'
  }
}

window.socket2 = io(Config.moonSocketUrl)

const moon1 = $('#moon1')[0]
const moon2 = $('#moon2')[0]
const moon3 = $('#moon3')[0]
const moon4 = $('#moon4')[0]
const moon5 = $('#moon5')[0]
const moon6 = $('#moon6')[0]

class App extends Component {
  state = {}

  ctx = 0
  canvasObj = 0

  server_ts = -1
  hold_ts = -1
  hold_info = { ts: 0, runX: 0, runY: 0 }

  t = 0
  t2 = 0
  t3 = 0
  winRunMut = 1.0

  betName = intl.get('TronBetUI_1010')
  tpName = intl.get('TronBetUI_1005')

  componentWillUnmount() {
    window.socket2.removeAllListeners('connect')
    window.socket2.removeAllListeners('activity_info')
    window.socket2.removeAllListeners('KEEP_RUNNING')
    window.socket2.removeAllListeners('RUNNING')
    window.socket2.removeAllListeners('CONFIRMING')
    window.socket2.removeAllListeners('KEEP_WAITING')
    window.socket2.removeAllListeners('WAITING')
    window.socket2.removeAllListeners('PENDING')
    window.socket2.removeAllListeners('player_info')

    window.socket2.emit('leave', 'crash')
    clearInterval(this.t)
    clearInterval(this.t2)
    $(window).unbind()
  }

  componentDidMount() {
    this.canvasObj = $('#crash-canvas')[0]
    this.ctx = this.canvasObj.getContext('2d')

    this.setCanvasSize()
    this.drawAxis(0, 1)

    this.startListen()

    this.t = setInterval(() => {
      if (Wallet.getWalletAddress()) {
        clearInterval(this.t)
        this.sortPlayer(this.props.crash.players_list)
        window.socket2.emit('my_logs', Wallet.getWalletAddress() || '')
        window.socket2.emit('join', 'crash', Wallet.getWalletAddress() || '')
      }
    }, 1000)

    $('#crash-list-view').slimScroll({
      height: 500,
      color: '#fff',
    })

    $(window).resize(() => {
      let pathName = this.props.routing.locationBeforeTransitions.pathname

      if (this.props.crash.status != 'run' && (pathName != '/moon' || pathName != '/double')) {
        this.setCanvasSize()
        this.drawAxis(0, 1)
      }
    })
  }

  startListen() {
    window.socket2.emit('join', 'crash', Wallet.getWalletAddress() || '') //玩家上线

    window.socket2.emit('my_logs', Wallet.getWalletAddress() || '')

    window.socket2.on('connect', (msg) => {
      window.socket2.emit('join', 'crash', Wallet.getWalletAddress()) //玩家上线
    })

    window.socket2.on('activity_info', (activity_info) => {
      let { giftBoxNum } = this.props
      window.cmd({ type: 'common', giftBoxNum: giftBoxNum + 1 })
      $('#sdj-box-num').addClass('myshake')
      let t = setTimeout(() => {
        clearTimeout(t)
        $('#sdj-box-num').removeClass('myshake')
      }, 500)
    })

    window.socket2.on('KEEP_RUNNING', (time) => {
      // let time = Math.floor(msg/100)*100;
      clearInterval(this.t3)
      let count = 0
      this.t3 = setInterval(() => {
        count++
        if (count >= 15) {
          clearTimeout(this.t3)
          return
        }
        time += 33
        this.drawCanvas(time, false)

        if (time < 11100) moon1.play()
        if (time >= 11100 && time < 17610) moon2.play()
        if (time >= 17610 && time < 22220) moon3.play()
        if (time >= 22220 && time < 25800) moon4.play()
        if (time >= 25800 && time < 36910) moon5.play()
        if (time >= 36910) moon6.play()
      }, 33)
    })

    window.socket2.on('RUNNING', (msg) => {
      this.hold_ts = -1
      this.hold_info = { ts: 0, runX: 0, runY: 0 }
      window.cmd({ type: 'crash', status: 'run', crash: false, upChain: false })
    })

    //游戏结算（不可下注）
    window.socket2.on('CONFIRMING', (msg) => {
      $('#boom')[0].play()
      clearTimeout(this.t3)
      let { duration } = msg
      this.drawCanvas(msg.duration, true)
      let nowMut = 1.0
      if (msg.result) nowMut = msg.result.toFixed(2)
      window.cmd({ type: 'crash', crash: true, nowMut, nowTime: duration, betting: false, status: 'confirm' })
    })

    //游戏准备中（可下注）
    window.socket2.on('KEEP_WAITING', (msg) => {
      if (this.props.crash.status == 'pending') return
      this.clearCanvas()
      this.drawAxis(0, 1)

      clearInterval(this.t2)
      this.t2 = setInterval(() => {
        msg -= 30
        if (msg <= 0) {
          msg = 0
          clearInterval(this.t2)
        }
        window.cmd({ type: 'crash', waitTime: msg, status: 'waiting', nowMut: 1 })
      }, 30)
    })

    //游戏准备中（可下注）
    window.socket2.on('WAITING', (msg) => {
      console.log('WAITING')
      this.clearCanvas()
      this.drawAxis(0, 1)
      if (this.props.crash.autoPlay) {
        let t = setTimeout(() => {
          clearTimeout(t)
          this.goToMoon()
        }, Common.randomNum(500, 3000))
      }
      let { players_list } = this.props.crash
      Wallet.getUserMoeny((money) => {
        players_list.map((item) => {
          if (item.addr == Wallet.getWalletAddress()) {
            this.showFlyMoney(item.profit)
            this.props.setUserAnte()
          }
        })
        window.cmd({ type: 'wallet', userMoney: money })
      })
      window.cmd({ type: 'crash', players: [] })

      window.socket2.emit('my_logs', Wallet.getWalletAddress() || '')
    })

    window.socket2.on('PENDING', function (msg) {
      let t = setTimeout(() => {
        clearTimeout(t)
        window.cmd({ type: 'crash', status: 'pending' })
      }, 500)
    })

    window.socket2.on('player_info', (msg) => {
      let { count, total, players_list } = msg
      window.cmd({ type: 'crash', count, total, players_list: this.sortPlayer(players_list) })
    })
  }

  showFlyMoney(winMoney) {
    window.cmd({ type: 'crash', winMoney: Common.numFloor(winMoney, 100) })
    let t = setTimeout(() => {
      clearTimeout(t)
      window.cmd({ type: 'crash', winMoney: 0 })
    }, 2000)

    if (Number(winMoney) + Number(this.props.crash.betMoney) >= maxWinMoney) {
      let systemMsg = {
        addr: 'TFXshAocC6ctfTYDdvtb3iK6jGcYVtcBLF',
        msg: Common.encrypt('[system]' + Wallet.getWalletAddress() + ',' + this.winRunMut + ',' + Common.numFloor(winMoney, 100)),
        type: 'all',
      }
      // console.log(systemMsg);
      // return;
      window.socket.emit('chat', systemMsg)
    }
  }

  sortPlayer(players_list) {
    let lose = []
    let win = []
    let meItem = ''
    players_list.map((item) => {
      let { profit, addr, hold_ts, cashed_out } = item
      if (addr != Wallet.getWalletAddress()) {
        profit >= 0 ? win.push(item) : lose.push(item)
      } else {
        meItem = item
      }

      if (addr == Wallet.getWalletAddress() && profit > 0) {
        this.hold_ts = hold_ts
        this.hold_info = { ts: hold_ts, runX: hold_ts / 1000, runY: Math.pow(2, (hold_ts / 1000) * 0.09) }
        this.winRunMut = cashed_out
      }
    })

    win.sort((a, b) => {
      if (a.bet > b.bet) {
        return -1
      } else if (a.bet < b.bet) {
        return 1
      } else {
        return 0
      }
    })

    lose.sort((a, b) => {
      if (a.bet > b.bet) {
        return 1
      } else if (a.bet < b.bet) {
        return -1
      } else {
        return 0
      }
    })

    if (meItem != '') {
      win.unshift(meItem)
    }

    return [...win, ...lose]
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  }

  setCanvasSize() {
    let adjust = document.body.clientWidth > 991 ? 45 : 0
    let viewW = $('#crash-view')[0].clientWidth - adjust
    let viewH = $('#crash-view')[0].clientHeight

    let width = pixelTatio * viewW
    let height = pixelTatio * viewH

    $('#crash-canvas').width(viewW)
    $('#crash-canvas').height(viewH)

    this.canvasObj.width = width
    this.canvasObj.height = height

    canvasWidth = width
    canvasHeight = height

    coordinateWidth = canvasWidth - canvasMarginLeft - canvasMarginRight
    coordinateHeight = canvasHeight - canvasMarginTop - canvasMarginBottom
    coordinateLeftTop = { x: canvasMarginLeft, y: canvasMarginTop }
    coordinateOrigin = { x: canvasMarginLeft, y: canvasMarginTop + coordinateHeight }
    coordinateRightBottom = { x: canvasMarginLeft + coordinateWidth, y: canvasMarginTop + coordinateHeight }
    oneSecWidth = Math.floor(coordinateWidth / 10) // 初始状态1S的像素数量

    if (linePointCacheArray.length < canvasWidth) {
      let addCount = canvasWidth - linePointCacheArray.length
      for (let i = 0; i < addCount; ++i) {
        linePointCacheArray.push({ x: 0, y: 0, rX: 0, rY: 0 })
      }
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
      return true
    } else {
      return false
    }
  }

  drawCanvas(time, crash) {
    this.setCanvasSize()
    this.drawKD(time, crash)
  }

  getMultiplierByTime(time) {
    return (Math.floor(Math.pow(2, time * 0.09) * 1000) / 1000).toFixed(3)
  }

  drawArrow(p1, p2, pLimit, color, headOffset, drawAni, crash, time) {
    let dx = p2.x - p1.x
    let dy = p2.y - p1.y
    let dl = Math.sqrt(dx * dx + dy * dy)

    if (headOffset) {
      let x2 = (dl * p2.x + headOffset * dx) / dl
      let y2 = (dl * p2.y + headOffset * dy) / dl
      p2 = { x: x2, y: y2 }
    }

    let x1 = (dl * p2.x - arrowHight * dx) / dl
    let y1 = (dl * p2.y - arrowHight * dy) / dl

    if (x1 <= pLimit.x) {
      x1 = pLimit.x
      y1 = pLimit.y
    }

    p1 = { x: x1, y: y1 }

    let x3 = (p1.x * ctgA2 + p2.y - p1.y) / ctgA2
    let y3 = (p1.y * ctgA2 + p1.x - p2.x) / ctgA2

    let x4 = p1.x + (p1.x - x3)
    let y4 = p1.y + (p1.y - y3)

    let ctx = this.ctx

    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(x3, y3)
    ctx.lineTo(p2.x, p2.y)
    ctx.lineTo(x4, y4)
    ctx.lineTo(p1.x, p1.y)
    ctx.fillStyle = color
    ctx.fill()

    if (drawAni) {
      // this.drawArrowAnimation(x3, y3, p1, p2, crash, time);
    }
  }

  drawArrowAnimation(x3, y3, p1, p2, crash, time) {
    if (animationArrow == null) {
      animationArrow = []
      for (let i = 0; i <= 10; ++i) {
        animationArrow[i] = new Image()
        animationArrow[i].src = './images/arrow/' + i + '.png'
      }
    }
    if (p2.x == p1.x) {
      return
    }

    frameCount += 1

    let showWidth = x3 - 48 * pixelTatio
    if (showWidth < 0) {
      return
    }
    if (showWidth > aniW) {
      showWidth = aniW
    }

    let radian = Math.atan((p2.y - p1.y) / (p2.x - p1.x))
    let img = animationArrow[Math.floor(frameCount / 1.5) % 10]
    if (crash) {
      img = animationArrow[10]
    }

    let ctx = this.ctx
    ctx.save()
    ctx.translate(x3, y3)
    ctx.rotate(radian * 0.89)
    ctx.drawImage(img, aniW - showWidth, 0, showWidth, aniH, -showWidth, -aniH + 10, showWidth, aniH)
    ctx.restore()
  }

  drawXScale(realX, realY) {
    let ctx = this.ctx
    ctx.fillStyle = '#849696'
    ctx.strokeStyle = '#206969'
    ctx.lineWidth = lineScale
    ctx.textAlign = 'center'
    ctx.font = 14 * pixelTatio + 'px Arial'
    let xPos = 0
    if (realX <= 10) {
      for (let i = 0; i < 10; ++i) {
        xPos = canvasMarginLeft + i * oneSecWidth
        ctx.beginPath()
        ctx.moveTo(xPos, coordinateOrigin.y - 6)
        ctx.lineTo(xPos, coordinateOrigin.y)
        ctx.stroke()

        ctx.fillText(i + 's', xPos, coordinateOrigin.y + 20 * pixelTatio)
      }
    } else {
      let secCount = Math.floor(realX)
      let step = 1
      if (realX <= 12) {
        step = 1
      } else if (realX <= 22) {
        step = 2
      } else if (realX <= 55) {
        step = 5
      } else if (realX < 110) {
        step = 10
      } else if (realX < 210) {
        step = 20
      } else {
        step = 50
      }

      for (let i = 0; i <= secCount; i += step) {
        xPos = canvasMarginLeft + (i * coordinateWidth) / realX
        ctx.beginPath()
        ctx.moveTo(xPos, coordinateOrigin.y - 6)
        ctx.lineTo(xPos, coordinateOrigin.y)
        ctx.stroke()

        ctx.fillText(i + 's', xPos, coordinateOrigin.y + 20 * pixelTatio)
      }
    }
  }

  drawYScale(realX, realY) {
    let ctx = this.ctx
    ctx.lineWidth = lineScale
    ctx.textAlign = 'end'
    ctx.font = 14 * pixelTatio + 'px Arial'
    let textXPos = canvasMarginLeft - 4 * pixelTatio
    var yPos
    if (realY < 2) {
      ctx.fillText('1x', textXPos, coordinateOrigin.y)

      ctx.beginPath()
      let yPos = coordinateOrigin.y - 0.5 * coordinateHeight
      ctx.moveTo(coordinateOrigin.x, yPos)
      ctx.lineTo(coordinateOrigin.x + coordinateWidth, yPos)
      ctx.stroke()

      ctx.fillText('1.5x', textXPos, yPos)
    } else if (realY < 2.2) {
      ctx.fillText('1x', textXPos, coordinateOrigin.y)
      for (let i = 0; i < yDrawArray1.length; ++i) {
        ctx.beginPath()
        let yPos = coordinateOrigin.y - (yDrawArray1[i] / (realY - 1)) * coordinateHeight
        ctx.moveTo(coordinateOrigin.x, yPos)
        ctx.lineTo(coordinateOrigin.x + coordinateWidth, yPos)
        ctx.stroke()

        ctx.fillText(1 + yDrawArray1[i] + 'x', textXPos, yPos)
      }
    } else if (realY < 6.4) {
      ctx.fillText('1x', textXPos, coordinateOrigin.y)
      let mCount = Math.floor(realY)
      for (let i = 1; i < mCount; ++i) {
        let yPos = coordinateOrigin.y - (i / (realY - 1)) * coordinateHeight
        ctx.beginPath()
        ctx.moveTo(coordinateOrigin.x, yPos)
        ctx.lineTo(coordinateOrigin.x + coordinateWidth, yPos)
        ctx.stroke()

        ctx.fillText(i + 1 + 'x', textXPos, yPos)
      }
    } else {
      let mCount = Math.floor(realY)

      let step = 2
      if (realY <= 12) {
        step = 2
      } else if (realY <= 44) {
        step = 10
      } else if (realY <= 120) {
        step = 20
      } else if (realY < 440) {
        step = 100
      } else if (realY < 1100) {
        step = 200
      } else if (realY < 4200) {
        step = 500
      } else if (realY < 12000) {
        step = 1000
      } else {
        step = 2000
      }

      for (let i = step; i <= mCount; i += step) {
        let yPos = coordinateOrigin.y - ((i - 1) / (realY - 1)) * coordinateHeight
        ctx.beginPath()
        ctx.moveTo(coordinateOrigin.x, yPos)
        ctx.lineTo(coordinateOrigin.x + coordinateWidth, yPos)
        ctx.stroke()
        ctx.fillText(i + 'x', textXPos, yPos)
      }
    }
  }

  drawAxis(realX, realY) {
    let ctx = this.ctx
    ctx.beginPath()
    ctx.moveTo(coordinateLeftTop.x, coordinateLeftTop.y)
    ctx.lineTo(coordinateOrigin.x, coordinateOrigin.y) // Y轴
    ctx.lineTo(coordinateRightBottom.x, coordinateRightBottom.y) // X轴
    ctx.textAlign = 'end'
    ctx.lineWidth = lineXY
    ctx.strokeStyle = '#206969'
    ctx.stroke()

    this.drawXScale(realX, realY) // 画X轴刻度
    this.drawYScale(realX, realY) // 画Y轴刻度
  }

  drawKD(time, crash) {
    this.clearCanvas()

    let realX = time / 1000
    let realY = Math.pow(2, realX * 0.09)
    if (realY >= 10000) {
      realX = 147.641249
      realY = Math.pow(2, realX * 0.09)
    }

    if (!crash) {
      window.cmd({ type: 'crash', crash, nowMut: Common.numFloor(realY, 100).toFixed(2), nowTime: time, status: 'run' })
      shakeCount += 1
    }

    this.drawAxis(realX, realY)

    // 10秒以后
    let linePointCount = 0
    if (realX <= 10) {
      linePointCount = Math.ceil(realX * oneSecWidth)
    } else {
      linePointCount = coordinateWidth
    }

    var pxX, pxY, tmpX, tmpY

    let hold_info = this.hold_info
    let ctx = this.ctx
    ctx.beginPath()
    if (hold_info.ts <= 0) {
      ctx.moveTo(coordinateOrigin.x, coordinateOrigin.y)
    }

    var pLastX = 0
    let shadowOffset = 0
    let isShadowRunDrawn = false // 是否已绘制完逃脱
    let pSepHead = { x: 0, y: 0 }
    // 拟合函数曲线
    for (let i = 0; i < linePointCount; ++i) {
      pxX = coordinateOrigin.x + i
      if (realX <= 10) {
        tmpX = i / oneSecWidth // 每个像素点对应的X值固定
      } else {
        tmpX = realX * (i / coordinateWidth) // 每个像素点对应的X值浮动
      }

      tmpY = Math.pow(2, tmpX * 0.09)
      if (realY <= 2) {
        pxY = coordinateOrigin.y - (tmpY - 1) * coordinateHeight // 每个像素点对应的Y值固定
      } else {
        pxY = coordinateOrigin.y - ((tmpY - 1) / (realY - 1)) * coordinateHeight
      }

      linePointCacheArray[i].x = pxX
      linePointCacheArray[i].y = pxY
      linePointCacheArray[i].rX = tmpX
      linePointCacheArray[i].rY = tmpY

      if (linePointCount - i >= shadowOffset) {
        if (hold_info.ts > 0 && hold_info.runX <= tmpX && !isShadowRunDrawn) {
          ctx.moveTo(pxX, pxY)

          isShadowRunDrawn = true
          pSepHead = { x: pxX, y: pxY }
        }
        if (hold_info.ts > 0) {
          if (hold_info.runX <= tmpX) {
            if (i < coordinateWidth - 1 || shakeCount % 2 == 1) {
              ctx.lineTo(pxX, pxY)
            }
          }
        } else {
          if (i < coordinateWidth - 1 || shakeCount % 2 == 1) {
            ctx.lineTo(pxX, pxY)
          }
        }

        pLastX = pxX
      }
    }

    if (linePointCount < coordinateWidth - 1 || shakeCount % 2 == 1) {
      ctx.lineTo(pLastX, coordinateOrigin.y)
    } else {
      ctx.lineTo(pLastX - 1, coordinateOrigin.y)
    }

    if (hold_info.ts <= 0) {
      ctx.fillStyle = crash ? 'rgba(255,90,90,0.5)' : 'rgba(15,226,122,0.5)'
      ctx.lineTo(coordinateOrigin.x, coordinateOrigin.y)
    } else {
      if (pSepHead.x == 0 && linePointCount > 0) {
        pSepHead = linePointCacheArray[linePointCount - 1]
      }
      ctx.fillStyle = 'rgba(255,90,90,0.5)'
      ctx.lineTo(pSepHead.x, coordinateOrigin.y)
      ctx.lineTo(pSepHead.x, pSepHead.y)
    }

    ctx.fill()

    let pHead = { x: pxX, y: pxY } // 箭头顶点

    // 绘制曲线
    if (linePointCount >= arrowBorn) {
      ctx.beginPath()
      ctx.lineWidth = lineWidth
      ctx.moveTo(coordinateOrigin.x, coordinateOrigin.y)
    }
    let pBottom = { x: -1, y: -1 } // 箭头高垂直线底部点
    let pRunHead = { x: -1, y: -1 } // 箭头高垂直线底部点
    let pSepBottom = { x: -1, y: -1 }
    var curX,
      curY,
      overPx = 0
    let isLineRunDrawn = false
    // 拟合已经计算出来的点的函数曲线
    for (let i = 0; i < linePointCount; ++i) {
      curX = linePointCacheArray[i].x
      curY = linePointCacheArray[i].y
      if (i % 2 == 0) {
        continue
      }

      if (linePointCount >= arrowBorn && i < linePointCount - lineJoin) {
        ctx.lineTo(curX, curY)
      }

      if (hold_info.ts > 0 && hold_info.runX <= linePointCacheArray[i].rX && !isLineRunDrawn) {
        ctx.lineTo(curX, curY)
        ctx.strokeStyle = '#0FE27A'
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(curX, curY)

        isLineRunDrawn = true
        pRunHead = { x: curX, y: curY, rX: linePointCacheArray[i].rX, ry: linePointCacheArray[i].rY }
      }

      // 寻找箭头1底点
      if (pBottom.x < 0 && this.distance(curX, curY, pHead.x, pHead.y) <= arrowHight) {
        pBottom.x = curX
        pBottom.y = curY
      }

      // 寻找箭头2底点
      if (hold_info.ts > 0 && pSepBottom.x < 0 && this.distance(curX, curY, pSepHead.x, pSepHead.y) <= arrowHight) {
        pSepBottom.x = curX
        pSepBottom.y = curY
      }

      if (pBottom.x > 0) {
        if (overPx++ >= arrowOffset) {
          break
        } // 线多画3个PX, 防止漏开像素
      }
    }
    if (linePointCount >= arrowBorn) {
      ctx.strokeStyle = isLineRunDrawn || crash ? '#FF5A5A' : '#0FE27A'
      ctx.stroke()
    }

    if (pBottom.x > 0) {
      let pLimit = pSepHead.x <= 0 ? coordinateOrigin : pSepHead
      this.drawArrow(pBottom, pHead, pLimit, hold_info.ts > 0 || crash ? '#FF5A5A' : '#0FE27A', false, true, crash, time) // 画前部箭头
    }

    if (pSepBottom.x > 0 && pSepHead.x <= pHead.x) {
      this.drawArrow(pSepBottom, pSepHead, coordinateOrigin, '#0FE27A', arrowOffset, false, false, time) // 画后部箭头
    }
  }

  distance(x1, y1, x2, y2) {
    let dx = x1 - x2
    let dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy)
  }

  getItemStatus(item) {
    let r = ''
    if (item.profit > 0) {
      r = 'winc'
    }
    if (item.profit < 0) {
      r = 'losec'
    }
    return r
  }

  getItemMoney(item) {
    let r = '-'
    if (item.profit > 0) {
      r = '+' + Common.numFloor(item.profit, 100)
    }
    if (item.profit < 0) {
      r = Common.numFloor(item.profit, 100)
    }
    return r
  }

  goToMoon(auto = false) {
    if (!Wallet.checkLogin()) return

    let { betMoney, status, autoPlay, runMut, count, betting, players_list } = this.props.crash
    console.log({ betting, status })
    if (status == 'run') {
      //逃跑
      window.socket2.emit('player_out', Wallet.getWalletAddress())
      return
    }

    if (betting) {
      return
    }

    if (players_list.length >= 100) {
      UI.showNotice(intl.get('TronBetUI_1023'))
      return
    }

    // betMoney = _.random(10, 20000);
    // window.socket2.emit("player_in", Wallet.getWalletAddress(), betMoney, Number(runMut));

    // return

    let { userMoney, userHasBet, userHasRefer } = this.props
    let trxVal = betMoney * 1e6

    if (Number(userMoney) < minBetMoney) {
      UI.showNotice(intl.get('TronBetUI_0043'))
      return
    }
    if (Number(userMoney) < Number(betMoney)) {
      UI.showNotice(intl.get('TronBetUI_0069'))
      return
    }

    window.cmd({ type: 'crash', betting: true, upChain: true })

    let obj = { refer, trxVal, userHasBet, userHasRefer, autoRate: runMut, suggest: count }

    Wallet.goToMoon(obj, async (err, txID) => {
      console.log({ err, txID })
      if (err) {
        window.cmd({ type: 'crash', betting: false, upChain: false })
        return
      }

      let count = 0
      let t = setInterval(async () => {
        count++
        if (count > 6) {
          let { status, players_list } = this.props.crash
          if (status == 'run' || status == 'confirm') {
            if (!this.hasBet(players_list)) {
              UI.showAlert('error', intl.get('TronBetUI_1025'))
            }
            clearInterval(t)
            return
          }
        } else {
          let isTxSuccess = await Wallet.isTxSuccess(txID)
          if (isTxSuccess) {
            UI.showAlert('success', intl.get('TronBetUI_1024'))
            clearInterval(t)
            window.socket2.emit('player_in', Wallet.getWalletAddress(), betMoney, Number(runMut))
            window.cmd({ type: 'crash', upChain: false })
          }
        }
      }, 1000)
    })
  }

  getlogColor(mut) {
    let c = '#F1433A'
    if (mut >= 1.5 && mut < 2) c = '#85BB8C'
    if (mut >= 2 && mut < 100) c = '#01C083'
    if (mut >= 100 && mut < 500) c = '#106BA6'
    if (mut >= 500 && mut < 1000) c = '#8B008A'
    if (mut >= 1000 && mut < 10000) c = '#FAEC0C'
    return c
  }

  getOprBtn() {
    let { betMoney, nowMut, betting, players_list, status, upChain } = this.props.crash
    let name = this.betName
    let money = betMoney
    let hasBet = this.hasBet(players_list)
    let clickFuc = this.goToMoon.bind(this)
    let className = 'btn blue'

    //clickFuc = this.testDraw.bind(this);

    switch (status) {
      case 'waiting':
        if (hasBet) {
          clickFuc = () => {}
          className = 'btn blue disabled'
        }
        break
      case 'confirm':
      case 'run':
        if (hasBet) {
          name = this.tpName
          money = Common.numFloor(betMoney * nowMut, 100).toFixed(2)
          if (this.hold_ts > -1) {
            let runMut = this.getMultiplierByTime(this.hold_ts / 1000)
            money = Common.numFloor(betMoney * runMut, 100).toFixed(2)
            className = 'btn blue disabled'
            clickFuc = () => {}
          } else {
            if (status == 'confirm') {
              name = this.betName
              className = 'btn blue disabled'
              money = betMoney
            }
          }
        } else {
          clickFuc = () => {}
          className = 'btn blue disabled'
        }
        break
      default:
        clickFuc = () => {}
        className = 'btn blue disabled'
    }
    return (
      <button className={className} id="betBtn" onClick={clickFuc}>
        {upChain ? <i className="fa fa-spinner fa-spin"></i> : ''} {name} {money}
      </button>
    )
  }

  hasBet(players_list) {
    let hasBet = false
    let myAddress = Wallet.getWalletAddress()
    players_list.map((item) => {
      if (item.addr == myAddress) {
        hasBet = true
        if (this.props.crash.betMoney != item.bet) {
          window.cmd({ type: 'crash', runMut: item.auto_out, betMoney: item.bet })
        }
      }
    })
    return hasBet
  }

  setMut(runMut) {
    let { betMoney, autoPlay } = this.props.crash
    if (autoPlay) return
    if (runMut * betMoney > maxWinMoney) {
      runMut = Common.numFloor(maxWinMoney / betMoney, 100)
    }
    if (runMut > maxRunMut) {
      runMut = maxRunMut
    }
    window.cmd({ type: 'crash', runMut })
  }

  getMoonBgPosition(nowTime) {
    let r = -1200
    if (nowTime > 11100) {
      r += (1200 * (nowTime - 11100)) / (147000 - 11100)
    }
    return r
  }

  showDetail(round) {
    window.socket2.emit('round_log', round)
    $('#moon-list-detail-modal').modal('show')
  }

  render() {
    let { userMoney, crash } = this.props
    let { winMoney } = crash

    return (
      <section>
        <div id="latest-view" style={{ textAlign: 'right', fontSize: '14px', padding: '0px 10px' }}>
          {intl.get('TronBetUI_1012')}:
          {crash.latestLogs.map((item, key) => (
            <span key={key} style={{ color: this.getlogColor(item) }}>
              {' '}
              {Common.numFloor(item, 100).toFixed(2)}x&nbsp;
            </span>
          ))}
        </div>
        <div className="col-md-8" style={{ padding: '0px' }} id="crash-v1">
          <div
            id="crash-view"
            style={{
              backgroundImage: "url('./images/gotoMoon.jpg')",
              backgroundPositionY: this.getMoonBgPosition(crash.nowTime),
            }}
          >
            <canvas width="100" height="200" id="crash-canvas" />
            <div id="crash-game-notice">
              <span id="mutShow" className={crash.status == 'run' || crash.status == 'confirm' ? '' : 'hide'}>
                {crash.crash ? (
                  <span style={{ color: '#FF5959' }}>
                    {intl.get('TronBetUI_1002')}@{crash.nowMut}x
                  </span>
                ) : (
                  <span>{crash.nowMut}x</span>
                )}
              </span>

              <span id="waitTimeShow" className={crash.status == 'waiting' || crash.status == 'pending' ? '' : 'hide'}>
                {crash.status == 'pending' ? intl.get('TronBetUI_1004') : (crash.waitTime / 1000).toFixed(2) + 's'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: '20px' }} id="crash-opr-view">
            <div id="crash-opr">
              <div className="col-md-6 col-sm-12">
                <p className="kk kk-lg">
                  <input
                    type="tel"
                    className={crash.autoPlay ? 'disabled' : ''}
                    value={crash.betMoney}
                    onBlur={(e) => {
                      if (e.target.value < minBetMoney) {
                        window.cmd({ type: 'crash', betMoney: minBetMoney })
                      }
                    }}
                    onChange={(e) => {
                      if (crash.status != 'waiting' || crash.autoPlay) return
                      let betMoney = e.target.value.replace(/[^\d]/g, '')
                      if (Number(betMoney) > Number(userMoney)) {
                        betMoney = Math.floor(userMoney)
                      }

                      if (betMoney > maxBetMoney) {
                        betMoney = maxBetMoney
                      }

                      if (betMoney * crash.runMut > maxWinMoney) {
                        betMoney = Common.numFloor(maxWinMoney / crash.runMut, 100)
                      }

                      if (Math.floor(userMoney) - betMoney < 3 && betMoney >= 13) {
                        betMoney = betMoney - 3
                      }

                      window.cmd({ type: 'crash', betMoney })
                    }}
                  />
                  <img src="./images/trxico.png" />
                  <label style={{ top: '-24px' }}>
                    {' '}
                    {intl.get('TronBetUI_0017')}
                    <span
                      className="label-btn"
                      onClick={() => {
                        if (crash.status != 'waiting' || crash.autoPlay) return

                        let afterMoney = crash.betMoney * 2
                        if (afterMoney > userMoney) {
                          afterMoney = Math.floor(userMoney)
                        }
                        if (afterMoney < minBetMoney) afterMoney = minBetMoney

                        if (afterMoney * crash.runMut > maxWinMoney) {
                          afterMoney = Common.numFloor(maxWinMoney / crash.runMut, 100)
                        }

                        if (Math.floor(userMoney) - afterMoney < 3 && afterMoney >= 13) {
                          afterMoney = afterMoney - 3
                        }

                        window.cmd({ type: 'crash', betMoney: afterMoney })
                      }}
                    >
                      X2
                    </span>
                    <span
                      className="label-btn"
                      onClick={() => {
                        if (crash.status != 'waiting' || crash.autoPlay) return
                        let money = crash.betMoney / 2
                        if (money < minBetMoney) {
                          money = minBetMoney
                        }
                        window.cmd({ type: 'crash', betMoney: money.toFixed(0) })
                      }}
                    >
                      1/2
                    </span>
                    <span
                      className="label-btn"
                      onClick={() => {
                        if (crash.status != 'waiting' || crash.autoPlay) return
                        window.cmd({ type: 'crash', betMoney: minBetMoney })
                      }}
                    >
                      Min
                    </span>
                    <span
                      className="label-btn"
                      onClick={() => {
                        if (crash.status != 'waiting' || crash.autoPlay) return
                        let betMoney = minBetMoney
                        if (userMoney > minBetMoney) {
                          betMoney = Math.floor(userMoney)
                        }
                        if (betMoney > maxBetMoney) {
                          betMoney = maxBetMoney
                        }

                        if (betMoney * crash.runMut > maxWinMoney) {
                          betMoney = Common.numFloor(maxWinMoney / crash.runMut, 100)
                        }
                        if (Math.floor(userMoney) - betMoney < 3 && betMoney >= 13) {
                          betMoney = betMoney - 3
                        }
                        window.cmd({ type: 'crash', betMoney })
                      }}
                    >
                      Max
                    </span>
                  </label>
                </p>
                <p className="kk kk-lg" style={{ marginTop: '25px' }}>
                  <input
                    type="number"
                    className={crash.autoPlay ? 'disabled' : ''}
                    value={crash.runMut}
                    onBlur={(e) => {
                      let runMut = e.target.value.replace(/[^\d.]/g, '')
                      if (runMut < 1.01) {
                        runMut = 1.01
                      }
                      runMut = Common.numFloor(runMut, 100)
                      window.cmd({ type: 'crash', runMut })
                    }}
                    onChange={(e) => {
                      let runMut = e.target.value.replace(/[^\d.]/g, '')
                      this.setMut(runMut)
                    }}
                  />
                  <label>
                    {intl.get('TronBetUI_1020')}
                    <span
                      className="label-btn"
                      onClick={() => {
                        this.setMut(2)
                      }}
                    >
                      2x
                    </span>
                    <span
                      className="label-btn"
                      onClick={() => {
                        this.setMut(5)
                      }}
                    >
                      5x
                    </span>
                    <span
                      className="label-btn"
                      onClick={() => {
                        this.setMut(10)
                      }}
                    >
                      10x
                    </span>
                    <span
                      className="label-btn"
                      onClick={() => {
                        this.setMut(20)
                      }}
                    >
                      20x
                    </span>
                  </label>
                </p>
              </div>
              <div className="col-md-6 col-sm-12">
                <p className="kk kk-lg">
                  {userMoney}
                  <img src="./images/trxico.png" />
                  <label>{intl.get('TronBetUI_0018')} </label>
                  <span className={winMoney == 0 ? 'hide' : 'animated slideOutUp'} style={{ color: winMoney > 0 ? '#01F593' : '#FF006C' }} id="flyNum">
                    {winMoney > 0 ? '+' : ''}
                    {winMoney} TRX
                  </span>
                </p>
                <div className="por" id="betBtnDiv">
                  <div
                    className={crash.autoPlay ? 'ly-switch open' : 'ly-switch'}
                    onClick={() => {
                      // if(rolling && !crash.autoPlay) return;
                      window.cmd({ type: 'crash', autoPlay: !crash.autoPlay })
                    }}
                  >
                    <p>{crash.autoPlay ? intl.get('TronBetUI_0112') : intl.get('TronBetUI_0113')}</p>
                    <span>{intl.get('TronBetUI_0092')}</span>
                  </div>
                  {this.getOprBtn()}
                  <i
                    className="fa fa-question-circle wenhao"
                    onClick={() => $('#moon-notice-modal').modal('show')}
                    style={{ cursor: 'pointer', position: 'absolute', right: '-23px', top: '15px', fontSize: '20px' }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4" style={{ marginTop: '10px' }} id="crash-v2">
          <div id="crash-list">
            <div className="ovh" style={{ borderBottom: '1px solid #383C3C', paddingBottom: '10px' }}>
              <div className="fol">
                <i className="iconfont icon-users"></i> {crash.count}
              </div>
              <div className="for">
                <i className="iconfont icon-tron"></i> {Common.numFloor(crash.total + 0.000000001, 100)}
              </div>
            </div>
            <table id="crash-list-table">
              <tr>
                <th style={{ width: '30%' }}>{intl.get('TronBetUI_1009')}</th>
                <th style={{ width: '25%' }}>@</th>
                <th style={{ width: '25%' }}>{intl.get('TronBetUI_1010')}</th>
                <th style={{ width: '20%' }}>{intl.get('TronBetUI_1011')}</th>
              </tr>
            </table>
            <div id="crash-list-view">
              <table id="crash-list-table">
                {crash.players_list.map((item, key) => (
                  <tr key={key} className={this.getItemStatus(item)}>
                    <td style={{ width: '30%' }}>{item.name == '' ? window.parseAddress(item.addr) : Common.strTo7(item.name)}</td>
                    <td style={{ width: '25%' }}>{item.cashed_out > 1 ? item.cashed_out + 'x' : '-'}</td>
                    <td style={{ width: '25%' }}>{item.bet}</td>
                    <td style={{ width: '20%' }}>{this.getItemMoney(item)}</td>
                  </tr>
                ))}
              </table>
            </div>
          </div>
        </div>

        <div id="moon-list" style={{ backgroundImage: "url('./images/bg.jpg')" }}>
          <table style={{ marginTop: '0px', width: '100%' }}>
            <tr>
              <th style={{ width: '20%' }}>{intl.get('TronBetUI_1018')}</th>
              <th style={{ width: '20%' }}>@</th>
              <th style={{ width: '20%' }}>{intl.get('TronBetUI_1010')}</th>
              <th style={{ width: '20%' }}>{intl.get('TronBetUI_1011')}</th>
              <th>{intl.get('TronBetUI_1019')}</th>
            </tr>
            {crash.crashList.map((item, key) => (
              <tr key={key}>
                <td style={{ color: this.getlogColor(item.result) }}>{Common.numFloor(item.result, 100).toFixed(2)}x</td>
                <td>{item.your_cashed_out == '-' ? '-' : item.your_cashed_out + 'x'}</td>
                <td>{item.bet}</td>
                <td>{item.profit}</td>
                <td>
                  <i onClick={this.showDetail.bind(this, item.round)} className="glyphicon glyphicon-eye-open"></i>
                </td>
              </tr>
            ))}
          </table>
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
  crash: state.crash,
  routing: state.routing,
  giftBoxNum: state.common.giftBoxNum,
}))(App)
