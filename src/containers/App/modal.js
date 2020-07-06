import React, { Component } from 'react'
import intl from 'react-intl-universal'
import { connect } from 'react-redux'
import Wallet from '../../utils/Wallet'
import Common from '../../utils/Common'
import UI from '../../utils/UI'
import _ from 'lodash'
import Config from '../../config'

const $ = window.$

//燃烧类型
const BURNDES = [0, 'TronBetUI_0179', 'TronBetUI_0178', 'TronBetUI_0180', 'TronBetUI_0180']

let imgNum = 0

class App extends Component {
  state = {
    newSeed: '',
    inputRefCode: '',
    refErrorMsg: '',
    rainMoneyPos: 0,
    rainNumPos: 0,
    fhDjs: '00:00:00',
    hdDjs: '00:00:00',
    chiJiDjs: '00:00:00',
    anteOprObj: {
      type: 1, //1:冻结，2解冻
      anteNum: 0,
    },
    inputAnte: 0,
    info: '<span></span>',
    chijiInfo: { ranks: [], me: { rank: '-', cnt: '-', amount: '-', reward: '-', addr: '', name: '' } },

    exchangeData: { id: -1, num: -1, inputNum: -1, oneStar: 0, oneMoney: 0 },
    sellGiftData: { oneMoney: 0, num: 0, inputNum: 0, id: -1 },
    headImgSelectPos: 0,
    nowTime: 0,
    activityRankMenuPos: 0,
  }

  fhDjsTimer = 0
  hdDjsTimer = 0
  chiJiDjsTimer = 0
  dailyDjsTimer = 0

  hasShowSnow = false

  shouldComponentUpdate(nextProps, nextState) {
    if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
      return true
    } else {
      return false
    }
  }

  componentDidMount() {
    this.startFhDjs()
    this.startHdDjs()
    this.startDailyDjs()

    this.getInfo()
    this.getDailyInfo()

    $('#BONUS').on('shown.bs.modal', (e) => {
      this.startFhDjs()
    })

    $('#info-modal').on('shown.bs.modal', (e) => {
      this.getInfo()
    })

    $('#activity-modal').on('shown.bs.modal', (e) => {
      this.startHdDjs()
    })

    $('#Avatar-modal').on('shown.bs.modal', (e) => {
      let { currentImg } = this.props
      imgNum = currentImg

      this.setState({
        headImgSelectPos: imgNum,
      })
    })

    $(' #anteburn-modal, #confirm-ante-opr,#frozen-notice-modal,#notice-modal, #common-notice-modal').on('hidden.bs.modal', function (e) {
      $('body').addClass('modal-open')
    })

    $('#daily-modal').on('hidden.bs.modal', function (e) {
      window.cmd({ type: 'common', showPreDaily: false })
    })

    $('#Avatar-modal').on('hidden.bs.modal', (e) => {
      this.setState({
        headImgSelectPos: imgNum,
      })
    })

    $('#daily-modal').on('shown.bs.modal', (e) => {
      this.getDailyInfo()
    })

    $('#anteburn-modal').on('shown.bs.modal', (e) => {
      this.getburnData()
    })

    let t = 0

    setInterval(() => {
      this.getDailyInfo()
      if ($('#anteburn-modal').css('display') == 'block') {
        this.getburnData()
      }
    }, 20000)

    $('#star-ranking').slimScroll({ height: 350 })
    $('#daily-ranking').slimScroll({ height: 380 })
    $('#avatar-selct-area').slimScroll({ height: 680 })
    $('#mission-scrollArea').slimScroll({ height: 500, color: '#fff' })

    $(document).click((e) => {
      if (this.props.giftResultMask) {
        e.stopPropagation()
        this.hideGiftResult()
      }
    })
  }

  getburnData() {
    Wallet.getburnData(this.props.burnData, (burnData) => window.cmd({ type: 'common', burnData }))

    $.get(Config.rankUrl + '/beter/anteburnt', (res) => {
      if (res.errno != 0) {
        console.log(res)
        return
      }

      let { burnData } = this.props
      burnData.burnList = res.data
      window.cmd({ type: 'common', burnData })
    })
  }

  getDailyInfo() {
    $.post(Config.rankUrl + '/update/dailyrank', { addr: Wallet.getWalletAddress() }, (result) => {
      let { errno, data } = result
      if (errno == 0) {
        window.cmd({ type: 'common', dailyData: data })
      }
    })
  }

  getInfo() {
    window.axios
      .get(Config.rankUrl + '/update/info?lang=' + window.localStorage.lang)
      .then((result) => {
        let { errno, data } = result.data
        if (errno == 0) {
          this.setState({ info: data })
        }
      })
      .catch((err) => {
        console.log(err)
      })
  }

  startHdDjs() {
    window.axios
      .post(Config.rankUrl + '/update/getActEndTime')
      .then((result) => {
        let { errno, data } = result.data
        if (errno == 0) {
          this.setHdDjs(data.now, data.end)
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  startFhDjs() {
    this.setFhDjs(Date.parse(new Date()) / 1000)
    window.axios
      .post(Config.rankUrl + '/update/getActEndTime')
      .then((result) => {
        let { errno, data } = result.data
        if (errno == 0) {
          this.setFhDjs(data.now)
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  checkTxIDAndUpdateMoney(txID, cb) {
    Wallet.checkTxID(txID, (err, transaction) => {
      console.log(transaction)
      if (err) {
        if (typeof cb == 'function') cb()
        return
      }
      if (transaction.ret[0].contractRet == 'SUCCESS') {
        Wallet.getUserMoeny((userMoney) => window.cmd({ type: 'wallet', userMoney }))
      } else {
        if (typeof cb == 'function') cb()
      }
    })
  }

  setFhDjs(nowTime) {
    if (this.fhDjsTimer != 0) clearInterval(this.fhDjsTimer)

    let timeCount = 0
    let isFirst = true
    // 1545537600
    // 1542600000
    if (nowTime < 1545534000) {
      timeCount = 1545534000 - nowTime
    } else {
      timeCount = 86400 - ((nowTime - 1542596400) % 86400)
    }

    if (timeCount > 0) {
      this.fhDjsTimer = setInterval(() => {
        if (timeCount <= 0) {
          clearInterval(this.fhDjsTimer)
          this.startFhDjs()
          return
        }
        if (
          $('#BONUS').css('display') == 'block' ||
          $('#mission-modal').css('display') == 'block' ||
          isFirst ||
          $('#sdjActivity-modal').css('display') == 'block'
        ) {
          this.setState({ fhDjs: Common.getLeftTimes(timeCount) })
        }
        isFirst = false
        timeCount--
      }, 1000)
    }
  }

  startDailyDjs() {
    this.setDailyDjs(Date.parse(new Date()) / 1000)
    window.axios
      .post(Config.rankUrl + '/update/getActEndTime')
      .then((result) => {
        let { errno, data } = result.data
        if (errno == 0) {
          this.setDailyDjs(data.now)
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }

  setDailyDjs(nowTime) {
    if (this.dailyDjsTimer != 0) clearInterval(this.dailyDjsTimer)

    let timeCount = 0
    let isFirst = true
    if (nowTime < 1546056000) {
      timeCount = 1546056000 - nowTime
    } else {
      timeCount = 3600 * 1 - ((nowTime - 1542600000) % (3600 * 1))
    }

    if (timeCount > 0) {
      this.dailyDjsTimer = setInterval(() => {
        if (timeCount <= 0) {
          clearInterval(this.dailyDjsTimer)
          this.startDailyDjs()
          return
        }
        window.cmd({ type: 'common', dailyDjs: Common.getLeftTimes(timeCount) })
        isFirst = false
        timeCount--
      }, 1000)
    }
  }

  setHdDjs(nowTime, endTime) {
    if (this.hdDjsTimer != 0) clearInterval(this.hdDjsTimer)

    let timeCount = endTime - nowTime
    let isFirst = true
    if (timeCount > 0) {
      this.hdDjsTimer = setInterval(() => {
        if (timeCount <= 0) {
          clearInterval(this.hdDjsTimer)
          this.setState({ hdDjs: '00:00:00' })
          return
        }
        if ($('#activity-modal').css('display') == 'block' || isFirst) {
          this.setState({ hdDjs: Common.getLeftTimes(timeCount) })
        }
        isFirst = false
        timeCount--
      }, 1000)
    }
  }

  setSeed() {
    let { newSeed } = this.state
    let { oldSeed } = this.props
    let bSeed = Common.getbSeed(newSeed)
    if (bSeed == '' || oldSeed == bSeed) return
    Wallet.setSeed(bSeed, () => Wallet.getSeed((oldSeed) => window.cmd({ type: 'dice', oldSeed })))
  }

  setRefCode() {
    let { inputRefCode } = this.state

    let reg = /^[0-9a-zA-Z]+$/
    let length = inputRefCode.length
    if (!reg.test(inputRefCode) || length < 4 || length > 16) {
      this.setState({ refErrorMsg: intl.get('TronBetUI_0061') })
      return
    }

    Wallet.setRefCode(inputRefCode, (hasSuccess) => {
      if (hasSuccess) {
        Wallet.getRefCode((refCode) => window.cmd({ type: 'wallet', refCode }))
      } else {
        this.setState({ refErrorMsg: intl.get('TronBetUI_0062') })
      }
    })
  }

  getRefLink() {
    return 'https://www.wink.org' + '/?r=' + this.props.refCode
  }

  getAnteFhInfo() {
    let { antePledge, anteObj } = this.props

    let canGetTrx = anteObj.canGetTrx ? Common.numToQian(anteObj.canGetTrx) : 0

    let msg = intl
      .get('TronBetUI_0121')
      .replace('%0%', "<span class='mainC'> " + Common.numToQian(anteObj.totalPledgeAnte) + ' DICE</span>')
      .replace('%1%', "<span class='mainC'> " + canGetTrx + ' TRX</span>')
    return <span dangerouslySetInnerHTML={{ __html: '<span>' + msg + '</span>' }}></span>
  }

  getStage(stage) {
    return Math.ceil(stage / 10) + '-' + (stage - Math.floor(Math.ceil(stage / 10) - 1) * 10)
  }

  //领取ante
  collectAnte() {
    Wallet.collectAnte(() => this.props.setUserAnte())
  }

  getIconStyle(id) {
    let res = ''

    switch (id) {
      case 'dice':
        res = <i className="iconfont icon-dice" id="mission-icon"></i>
        break
      case 'crash':
        res = <i className="iconfont icon-crash" id="mission-icon"></i>
        break
      case 'ring':
        res = <img src="./images/ring_a.png" style={{ height: '50px', width: '50px' }} />
        break
      case 'daily':
        res = <img src="./images/allMission.png" style={{ height: '60px', width: '60px' }} />
        break
      default:
        res = ''
        break
    }

    return res
  }

  getTaskBtn(status, id) {
    let res = ''

    switch (status) {
      case 0:
        res = <div id="mission-status">{intl.get('TronBetUI_0164')}</div>
        break
      case 1:
        res = <div id="mission-status">{intl.get('TronBetUI_0159')}</div>
        break
      case 2:
        res = (
          <div id="mission-status1" onClick={() => this.getAward(id)}>
            {intl.get('TronBetUI_0160')}
          </div>
        )
        break
      case 3:
        res = <div id="mission-status2">{intl.get('TronBetUI_0161')}</div>
        break
      default:
        break
    }

    return res
  }

  getAward(id) {
    window.cmd({ type: 'common', loading: true })
    window.socket.emit('receive_task_award', { addr: Wallet.getWalletAddress() || '', id: id })
  }

  confirmImg(headImgSelectPos) {
    Wallet.getSign((sign) => {
      window.socket.emit('set_img', { addr: Wallet.getWalletAddress() || '', sign: sign, img: headImgSelectPos })
    })
  }

  getDialyBox(status) {
    let res = ''

    switch (status) {
      case 0:
        res = './images/dailyBox0.png'
        break
      case 1:
        res = './images/dailyBox0.png'
        break
      case 2:
        res = './images/dailyBox1.png'
        break
      case 3:
        res = ''
        break
      default:
        break
    }

    return res
  }

  render() {
    let { headImgSelectPos, newSeed, inputRefCode, refErrorMsg, fhDjs, hdDjs, anteOprObj, inputAnte, info } = this.state
    let {
      jackpots,
      burnData,
      playerLevel,
      imgLists,
      taskDaily,
      taskLists,
      showPreDaily,
      dailyData,
      dailyDjs,
      noticeBody,
      noticeTitle,
      anteObj,
      oldSeed,
      refCode,
      tjTrx,
      anteLock,
      anteFree,
      antePledge,
      anteLeftTime,
      canGetPledge,
      noticeMsg,
    } = this.props
    let avatarLv = playerLevel
    avatarLv = Common.getNewStage(avatarLv)

    let nowShowAnte = Number((anteObj.totalAnte - (anteObj.nowAnte % 5e6)).toFixed(0))
    let taskDailyAll = taskDaily[taskDaily.length - 1]
    let taskAllAmount = taskDaily[taskDaily.length - 1].need

    let showDailyList = dailyData.rank
    if (showPreDaily) showDailyList = dailyData.last.rank

    let getBtt = Common.numFloor(((jackpots.btt - 0) / Number(anteObj.totalPledgeAnte)) * Number(antePledge.anteAmount), 100)
    if (getBtt < 0 || !getBtt) getBtt = 0

    return (
      <section>
        <div className="modal fade" id="HOWTOPLAY" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0004')}
                </h4>
              </div>
              <div className="modal-body">
                <p>{intl.getHTML('TronBetUI_0039')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="FAIRNESS" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0031')}
                </h4>
              </div>
              <div className="modal-body">
                <p>{intl.get('TronBetUI_0059')}</p>
                <p>
                  <input type="text" className="my-input" style={{ width: '100%' }} value={oldSeed} />
                </p>
                <p>{intl.get('TronBetUI_0032')}</p>
                <p>
                  <input
                    type="text"
                    className="my-input"
                    style={{ width: '100%' }}
                    value={newSeed}
                    onChange={(e) => this.setState({ newSeed: e.target.value })}
                  />
                  &nbsp;&nbsp;
                </p>
                <p>{intl.get('TronBetUI_0060')}</p>
                <p className="tac">
                  <input type="text" className="my-input" style={{ width: '100%' }} value={Common.getbSeed(this.state.newSeed)} />
                  <button
                    className="btn blue"
                    style={{ display: 'inline-block', width: '120px', margin: '0px', marginTop: '10px' }}
                    onClick={() => this.setSeed()}
                  >
                    {intl.get('TronBetUI_0033')}
                  </button>
                </p>
                <p style={{ marginTop: '20px' }}>{intl.getHTML('TronBetUI_0034')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="REFERRLAS" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0036')}
                </h4>
              </div>
              <div className="modal-body">
                <div className={refCode == '' ? '' : 'hide'}>
                  <span>({intl.get('TronBetUI_0056')})</span>
                  <input
                    type="text"
                    className="my-input"
                    style={{ width: '438px' }}
                    value={inputRefCode}
                    onChange={(e) => this.setState({ inputRefCode: e.target.value, refErrorMsg: '' })}
                    placeholder={intl.get('TronBetUI_0058')}
                  />
                  &nbsp;&nbsp;
                  <button className="btn blue" style={{ display: 'inline-block', width: '120px', margin: '0px' }} onClick={() => this.setRefCode()}>
                    {intl.get('TronBetUI_0057')}
                  </button>
                  <p className="tac c-e" style={{ marginTop: '5px' }}>
                    {refErrorMsg}
                  </p>
                </div>

                <div className={refCode != -1 && refCode != '' ? '' : 'hide'}>
                  <input type="text" id="inputId" className="my-input" style={{ width: '438px' }} value={this.getRefLink()} />
                  &nbsp;&nbsp;
                  <button className="btn blue copyText" id="copyText" style={{ display: 'inline-block', width: '120px', margin: '0px' }}>
                    {intl.get('TronBetUI_0037')}
                  </button>
                </div>

                <p style={{ marginTop: '20px' }}>{intl.get('TronBetUI_0038')}</p>

                <div style={{ marginTop: '80px', textAlign: 'center' }}>
                  <span className="por dpi">
                    <span className="ante-label">{intl.get('TronBetUI_0090')}</span>
                    <input type="text" id="inputId" className="my-input" style={{ width: '300px', fontSize: '20px' }} value={tjTrx + ' TRX'} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="mission-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ marginTop: '80px', background: 'rgb(37, 42, 42)' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0148')}
                </h4>
              </div>
              <div className="modal-body" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
                <div id="mission-tips" style={{ marginBottom: '10px' }}>
                  {intl.get('TronBetUI_0162')}
                </div>

                <div
                  style={{
                    background: 'rgb(45,64,63)',
                    borderRadius: '10px',
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    borderColor: '#3b5854',
                    margin: '20px 0',
                  }}
                >
                  <div
                    id="mission-module"
                    style={{ background: 'transparent', paddingTop: '15px', paddingBottom: '30px', paddingLeft: '90px', paddingRight: '0' }}
                  >
                    <div style={{ width: '90px', position: 'absolute', left: '0', display: 'flex', height: '100%', top: '0' }} className="tac">
                      <span id="mission-icon-bg" style={{ margin: 'auto' }}>
                        {this.getIconStyle(taskDailyAll.game)}
                      </span>
                    </div>

                    <div id="mission-middle" style={{ width: '100%', position: 'relative' }}>
                      <p style={{ color: 'white', fontSize: '17px', marginBottom: '15px' }}>
                        {intl.get('TronBetUI_0158')}
                        {' ( ' + fhDjs + ' )'}
                      </p>
                      <div id="mission-barContain" style={{ width: '93%' }}>
                        <div
                          id="mission-bar"
                          style={{
                            width: (taskDailyAll.now / taskDailyAll.need) * 100 + '%',
                            background: taskDailyAll.status == 3 ? 'rgb(88,88,88)' : 'rgb(10,175,91)',
                          }}
                        ></div>
                      </div>

                      {taskDaily.map((item, key) => (
                        <div key={key} style={{ position: 'absolute', bottom: '-26px', left: (item.need / taskAllAmount) * 93 + '%' }}>
                          <div style={{ width: '70px', marginLeft: '-32px' }}>
                            <div style={{ display: 'flex' }}>
                              <img
                                src={this.getDialyBox(item.status)}
                                style={{ verticalAlign: 'middle', margin: 'auto', height: '41px', cursor: item.status == 2 ? 'pointer' : 'default' }}
                                className={item.status == 2 ? 'animated rubberBand animated infinite animated fast' : ''}
                                onClick={() => {
                                  item.status == 2 ? this.getAward(item.id) : ''
                                }}
                              />
                            </div>
                            <div id="mission-daily-step" style={{ left: '20%' }}>
                              {item.status == 3 ? <img style={{ marginTop: '3px' }} src="./images/dailyComplete.png" /> : item.need}
                            </div>
                            <div style={{ color: 'white', marginTop: '4px', textAlign: 'center', margin: '4px auto 0 auto' }}>{item.amount} TRX</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div id="mission-content" style={{ background: 'rgb(24,24,24)', borderRadius: '10px', padding: '10px' }}>
                  <div id="mission-scrollArea">
                    {taskLists.map((item, key) => (
                      <div key={key}>
                        <div id="mission-module" style={{ marginBottom: key == taskLists.length - 1 ? '0px' : '5px' }}>
                          <div style={{ width: '80px', position: 'absolute', left: '0' }} className="tac">
                            <span id="mission-icon-bg">{this.getIconStyle(item.game)}</span>
                          </div>

                          <div id="mission-middle" style={{ width: '100%' }}>
                            <p>
                              {intl.get('TronBetUI_0' + (148 + Number(item.id)))}
                              {item.id == 10 ? ' ( ' + fhDjs + ' )' : ''}
                            </p>
                            <div id="mission-barContain">
                              <div
                                id="mission-bar"
                                style={{ width: (item.now / item.need) * 100 + '%', background: item.status == 3 ? 'rgb(88,88,88)' : 'rgb(10,175,91)' }}
                              ></div>
                              <div style={{ top: '0', position: 'absolute', width: '100%', textAlign: 'center' }}>
                                {item.now}/{item.need}
                              </div>
                            </div>
                          </div>

                          <div id="mission-right" style={{ width: '180px', position: 'absolute', right: '0' }} className="tac">
                            <div id="mission-award">{item.amount} TRX</div>
                            {this.getTaskBtn(item.status, item.id)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="Avatar-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document" id="avatar-modal-content">
            <div className="modal-content" style={{ marginTop: '20px', background: 'rgb(37, 42, 42)' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_2047')}
                </h4>
              </div>
              <div className="modal-body" style={{ paddingLeft: '50px', paddingRight: '50px' }}>
                <p style={{ textAlign: 'center', color: 'rgb(102,102,102)', margin: '-18px 0 10px' }}>{intl.get('TronBetUI_2048')}</p>

                <div id="avatar-selct-area" className="tac" style={{ border: '1px solid rgb(79,79,79)', paddingBottom: '30px', paddingTop: '10px' }}>
                  <div className="avatar-level chat-lv1">Lv 1-9</div>
                  <div style={{ width: '90%', margin: 'auto' }}>
                    {imgLists.map((item, key) => (
                      <div
                        key={key}
                        className="avatar"
                        onClick={() => {
                          if (avatarLv <= key) {
                            return
                          }
                          this.setState({ headImgSelectPos: item })
                        }}
                        style={{ cursor: avatarLv > key ? 'pointer' : 'default' }}
                      >
                        <img src={Common.getUserAvatar(item)} width="100" height="100" />
                        <span id="okBtn" className={item == headImgSelectPos ? '' : 'hide'}>
                          <img src="./images/avatar/okIcon.png" />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="avatar-level chat-lv2">Lv 10-24</div>
                  <div style={{ width: '90%', margin: 'auto' }}>
                    {imgLists.map((item, key) => (
                      <div
                        key={key + 12}
                        className="avatar"
                        onClick={() => {
                          if (avatarLv <= key + 12) {
                            return
                          }
                          this.setState({ headImgSelectPos: item + 10 })
                        }}
                        style={{ cursor: avatarLv > key + 12 ? 'pointer' : 'default' }}
                      >
                        <img src={Common.getUserAvatar(item + 10)} width="100" />
                        <img src="./images/avatar/lv2-dark.png" id="avatar-lock" className={avatarLv > key + 12 ? 'hide' : ''} width="100" height="100" />
                        <span id="okBtn" className={item + 10 == headImgSelectPos ? '' : 'hide'}>
                          <img src="./images/avatar/okIcon.png" />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="avatar-level chat-lv3">Lv 25-49</div>
                  <div style={{ width: '90%', margin: 'auto' }}>
                    {imgLists.map((item, key) => (
                      <div
                        key={key + 24}
                        className="avatar"
                        onClick={() => {
                          if (avatarLv <= key + 24) {
                            return
                          }
                          this.setState({ headImgSelectPos: item + 20 })
                        }}
                        style={{ cursor: avatarLv > key + 24 ? 'pointer' : 'default' }}
                      >
                        <img src={Common.getUserAvatar(item + 20)} width="100" />
                        <img src="./images/avatar/lv3-dark.png" id="avatar-lock" className={avatarLv > key + 24 ? 'hide' : ''} width="100" height="100" />
                        <span id="okBtn" className={item + 20 == headImgSelectPos ? '' : 'hide'}>
                          <img src="./images/avatar/okIcon.png" />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="avatar-level chat-lv4">Lv 50-74</div>
                  <div style={{ width: '90%', margin: 'auto' }}>
                    {imgLists.map((item, key) => (
                      <div
                        key={key + 36}
                        className="avatar"
                        onClick={() => {
                          if (avatarLv <= key + 36) {
                            return
                          }
                          this.setState({ headImgSelectPos: item + 30 })
                        }}
                        style={{ cursor: avatarLv > key + 36 ? 'pointer' : 'default' }}
                      >
                        <img src={Common.getUserAvatar(item + 30)} width="100" />
                        <img src="./images/avatar/lv4-dark.png" id="avatar-lock" className={avatarLv > key + 36 ? 'hide' : ''} width="100" height="100" />
                        <span id="okBtn" className={item + 30 == headImgSelectPos ? '' : 'hide'}>
                          <img src="./images/avatar/okIcon.png" />
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="avatar-level chat-lv5">Lv 75-99</div>
                  <div style={{ width: '90%', margin: 'auto' }}>
                    {imgLists.map((item, key) => (
                      <div
                        key={key + 48}
                        className="avatar"
                        onClick={() => {
                          if (avatarLv <= key + 48) {
                            return
                          }
                          this.setState({ headImgSelectPos: item + 40 })
                        }}
                        style={{ cursor: avatarLv > key + 48 ? 'pointer' : 'default' }}
                      >
                        <img src={Common.getUserAvatar(item + 40)} width="100" />
                        <img src="./images/avatar/lv5-dark.png" id="avatar-lock" className={avatarLv > key + 48 ? 'hide' : ''} width="100" height="100" />
                        <span id="okBtn" className={item + 40 == headImgSelectPos ? '' : 'hide'}>
                          <img src="./images/avatar/okIcon.png" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position: 'relative', marginTop: '30px' }}>
                  <div
                    className="avatar-button"
                    onClick={() => this.confirmImg(headImgSelectPos)}
                    style={{ position: 'absolute', right: '30%', background: 'rgb(31,124,55)' }}
                    data-dismiss="modal"
                    aria-label="Close"
                  >
                    {intl.get('TronBetUI_0051')}
                  </div>
                  <div className="avatar-button" style={{ marginLeft: '30%', background: 'rgb(187,19,63)' }} data-dismiss="modal" aria-label="Close">
                    {intl.get('TronBetUI_0052')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="daily-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  <img src="./images/drank1.png" style={{ position: 'relative', top: '-5px' }} className="vm" />
                  &nbsp;{intl.get('TronBetUI_0147')}
                </h4>
                <p style={{ textAlign: 'center', fontSize: '16px', margin: '0px', marginTop: '10px' }}>
                  {showPreDaily ? Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(dailyData.last.time)) : intl.get('TronBetUI_4009') + ': ' + dailyDjs}
                </p>
                <div
                  id="daily-modal-history"
                  className={dailyData.last.rank.length == 0 ? 'hide' : ''}
                  onClick={() => {
                    window.cmd({ type: 'common', showPreDaily: !showPreDaily })
                  }}
                >
                  <img src="./images/back_history.png" style={{ transform: showPreDaily ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </div>
              </div>
              <div className="modal-body" style={{ borderTop: '1px solid #333', paddingBottom: '5px' }}>
                <p className="tac">
                  <div id="chatRankMenu">
                    <table id="fh-table" style={{ marginTop: '0px' }}>
                      <tr>
                        <th style={{ width: '10%' }}>{intl.get('TronBetUI_0096')}</th>
                        <th style={{ width: '25%' }}>{intl.get('TronBetUI_0097')}</th>
                        <th style={{ width: '15%' }}>{intl.get('TronBetUI_0098')}</th>
                        <th style={{ width: '20%' }}>{intl.get('TronBetUI_0099')}</th>
                      </tr>
                    </table>
                  </div>

                  <div id="daily-ranking">
                    <table id="sr-table" style={{ marginTop: '0px' }}>
                      {showDailyList.map((item, key) => (
                        <tr key={key} className={item.addr == Wallet.getWalletAddress() ? 'me' : ''}>
                          <td style={{ width: '10%' }}>
                            {key > 2 ? <span>{item.rank}</span> : <img src={'./images/drank' + (key + 1) + '.png'} width="50" />}
                          </td>
                          <td style={{ width: '25%' }}>{item.name == item.addr ? window.parseAddress(item.addr) : Common.strTo7(item.name)}</td>
                          <td style={{ width: '15%' }}>{Common.numToQian(item.amont.toFixed(0)) + ' TRX'}</td>
                          <td style={{ width: '20%' }}>
                            {item.reward.trx == 0 ? '-' : Common.numToQian(item.reward.trx.toFixed(0)) + 'TRX'}
                            {item.reward.ante == 0 ? '' : ' + ' + Common.numToQian(item.reward.ante.toFixed(0)) + 'DICE'}
                          </td>
                        </tr>
                      ))}
                    </table>
                  </div>

                  <p style={{ marginTop: '30px', fontSize: '12px' }}>{showPreDaily ? '' : intl.get('TronBetUI_0100')}</p>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="BONUS" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '35px' }}>
                  <img src="./images/ante.png" className="vm" width="50" /> DICE
                </h4>
              </div>
              <div className="modal-body">
                <div className="tac">
                  <p style={{ fontSize: '16px' }}>{intl.get('TronBetUI_0072').replace('%0%', this.getStage(anteObj.stage)).replace('%1%', anteObj.needTrx)}</p>
                  <div className="por">
                    <span id="jd1">
                      <img src="./images/ante_jd_bg.png" id="ante-bg" width="800" />
                      <div id="ante-jd" style={{ width: 794 * (1 - (anteObj.nowAnte % 5000000) / anteObj.totalAnte) }}>
                        <img src="./images/ante_jd_a.png" width="800" />
                      </div>
                      <p id="ante-jd-text">
                        {window.numToQian(anteObj.totalAnte)}/{nowShowAnte}
                      </p>
                    </span>
                    <span id="jd2" style={{ display: 'none' }}>
                      <div id="ante-jd2">
                        <span style={{ width: (1 - (anteObj.nowAnte % 5000000) / anteObj.totalAnte) * 100 + '%' }}></span>
                        <p>
                          {window.numToQian(anteObj.totalAnte)}/{nowShowAnte}
                        </p>
                      </div>
                    </span>
                  </div>

                  <p style={{ color: '#666' }}>
                    {intl
                      .get('TronBetUI_0080')
                      .replace('%0%', this.getStage(anteObj.stage + 1))
                      .replace('%1%', anteObj.needTrx + 4)}
                  </p>

                  <div id="ante-des" className="por">
                    <h2 style={{ margin: '0px' }}>{intl.get('TronBetUI_0073')}</h2>
                    <h1 style={{ color: '#fff', marginTop: '30px' }}>{Common.numToQian(anteObj.totalTRX)} TRX</h1>

                    <h3 style={{ color: '#fff', marginTop: '30px' }}>{Common.numToQian(Common.numFloor(jackpots.btt, 100))} BTT </h3>
                    <span>
                      {intl.get('TronBetUI_0182')} <span className="mainC">{getBtt} BTT</span>
                    </span>

                    <p style={{ margin: '0px', marginTop: '30px' }}>{this.getAnteFhInfo()}</p>
                    <span style={{ display: 'inline-block', marginTop: '5px' }}>
                      {intl.get('TronBetUI_0134')}
                      {fhDjs}
                    </span>

                    <div id="anteburn" onClick={() => $('#anteburn-modal').modal('show')}>
                      <img src="./images/winburn.png" />
                      <br />
                      {intl.get('TronBetUI_0166')}
                    </div>
                  </div>

                  <div style={{ marginTop: '50px', display: 'none' }}>
                    <span className="por dpi" style={{ border: '1px solid red' }}>
                      <p className="ante-label">{intl.get('TronBetUI_0075')}</p>
                      <input type="text" id="inputId" className="my-input" style={{ width: '35%', fontSize: '20px' }} value={anteLock + ' DICE'} />
                      <br />
                      <button
                        className="btn"
                        style={{ display: 'inline-block', height: '29px', margin: '0px', lineHeight: '25px', fontSize: '14px', background: '#0AAF5B' }}
                        onClick={() => this.collectAnte()}
                      >
                        {intl.get('TronBetUI_0077')}
                      </button>
                    </span>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <button
                      className="btn"
                      style={{
                        display: 'inline-block',
                        width: '11%',
                        height: '29px',
                        margin: '0px',
                        lineHeight: '25px',
                        fontSize: '14px',
                        background: '#181818',
                        backgroundImage: "url('./images/getantebt.png')",
                      }}
                      onClick={() => this.collectAnte()}
                    >
                      {intl.get('TronBetUI_0077')}
                    </button>
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    <span className="por dpi">
                      <p className="ante-label">{intl.get('TronBetUI_0076')}</p>
                      <input type="text" id="inputId" className="my-input" style={{ width: '35%', fontSize: '20px' }} value={anteFree + ' DICE'} />
                    </span>
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <div className="ante-input">
                      <span>{intl.get('TronBetUI_0075')}</span>
                      <input type="text" style={{ fontSize: '20px', marginTop: '10px' }} value={anteLock + ' DICE'} />
                      <br />
                      <button className="btn" onClick={() => this.collectAnte()}>
                        {intl.get('TronBetUI_0077')}
                      </button>
                    </div>
                    <div className="ante-split">
                      <img src="./images/split.png" />
                    </div>
                    <div className="ante-input por">
                      <span>{intl.get('TronBetUI_0076')}</span>
                      <input type="text" style={{ fontSize: '20px', marginTop: '10px' }} value={anteFree + ' DICE'} />
                      <br />
                      <button
                        className="btn"
                        style={{ background: '#008FB9' }}
                        onClick={() => {
                          Wallet.canFrozen((can) => {
                            if (!can) {
                              UI.showNotice(intl.get('TronBetUI_0129'))
                              return
                            }
                            this.setState({ anteOprObj: { type: 1, anteNum: anteFree }, inputAnte: anteFree })
                            $('#confirm-ante-opr').modal('show')
                          })
                        }}
                      >
                        {intl.get('TronBetUI_0118')}
                      </button>
                      <i
                        className="fa fa-question-circle frozenWenhao"
                        onClick={() => $('#frozen-notice-modal').modal('show')}
                        style={{ cursor: 'pointer', position: 'absolute', right: '10px', bottom: '3px', fontSize: '20px' }}
                      ></i>
                    </div>
                    <div className="ante-split">
                      <img src="./images/split.png" />
                    </div>
                    <div className="ante-input ">
                      <span>{intl.get('TronBetUI_0117')}</span>
                      <input type="text" style={{ fontSize: '20px', marginTop: '10px' }} value={antePledge.anteAmount + ' DICE'} />
                      <br />
                      <button
                        className="btn"
                        onClick={() => {
                          Wallet.canFrozen((can) => {
                            if (!can) {
                              UI.showNotice(intl.get('TronBetUI_0129'))
                              return
                            }
                            this.setState({ anteOprObj: { type: 2, anteNum: antePledge.anteAmount }, inputAnte: antePledge.anteAmount })
                            $('#confirm-ante-opr').modal('show')
                          })
                        }}
                      >
                        {intl.get('TronBetUI_0119')}
                      </button>
                    </div>
                  </div>

                  {/* 取消解冻 */}
                  <div id="unFrozenInfo" className={antePledge.unfreezingAmount == 0 ? 'hide' : ''}>
                    <p>
                      {intl.get('TronBetUI_0125')}
                      {antePledge.tmUnfreeze == 0 ? '' : Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(antePledge.tmUnfreeze * 1000))}
                    </p>
                    <div>
                      <p>
                        <span>{intl.get('TronBetUI_0127')}</span>
                        <span style={{ float: 'right' }}>
                          {intl.get('TronBetUI_0126')}
                          {anteLeftTime}
                        </span>
                      </p>
                      <p>
                        <span style={{ fontSize: '40px' }}>
                          {antePledge.unfreezingAmount} &nbsp;&nbsp;<small style={{ fontSize: '20px' }}>DICE</small>
                        </span>
                        {canGetPledge ? (
                          <button
                            className="btn"
                            id="cancelUnfreeze"
                            style={{ background: '#0AAF5B' }}
                            onClick={() => {
                              Wallet.withdrawUnfreeze((err, txID) => {
                                console.log({ txID })
                                let t = setTimeout(() => {
                                  clearTimeout(t)
                                  console.log('update')
                                  this.props.setUserAnte()
                                }, 5000)
                              })
                            }}
                          >
                            {intl.get('TronBetUI_0130')}
                          </button>
                        ) : (
                          <button
                            className="btn"
                            id="cancelUnfreeze"
                            onClick={() => {
                              Wallet.cancelUnfreeze((err, txID) => {
                                console.log({ txID })
                                let t = setTimeout(() => {
                                  clearTimeout(t)
                                  console.log('update')
                                  this.props.setUserAnte()
                                }, 5000)
                              })
                            }}
                          >
                            {intl.get('TronBetUI_0128')}
                          </button>
                        )}
                      </p>
                    </div>
                  </div>

                  <p style={{ marginTop: '30px', color: '#666' }}>{intl.get('TronBetUI_0120')}</p>
                </div>

                <p>
                  <p className="tac">
                    <div style={{ display: 'inline-block', display: 'none' }}>
                      <input type="text" id="inputId" className="my-input" style={{ width: '200px' }} value={anteLock + ' DICE'} />
                      &nbsp;&nbsp;
                      <button
                        className="btn blue copyText"
                        id="copyText"
                        style={{ display: 'inline-block', width: '100px', margin: '0px' }}
                        onClick={() => this.collectAnte()}
                      >
                        {intl.get('TronBetUI_0077')}
                      </button>
                    </div>
                  </p>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="anteburn-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ marginTop: '100px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  <img src="./images/winburn.png" width="35" style={{ position: 'relative', top: '5px' }} /> {intl.get('TronBetUI_0166')}
                </h4>
              </div>
              <div className="modal-body">
                <div id="ante-des" className="por tac">
                  <h3 style={{ margin: '0px' }}>{intl.get('TronBetUI_0167')}</h3>
                  <h1 style={{ color: '#50D48A', marginTop: '20px' }}>{Common.numToQian(burnData.waiteBurn)}</h1>
                  <span style={{ display: 'inline-block', marginTop: '5px', fontSize: '12px' }}>{intl.get('TronBetUI_0169')}</span>
                </div>

                <div id="ante-des" className="por tac" style={{ marginTop: '50px', marginBottom: '50px' }}>
                  <h3 style={{ margin: '0px' }}>{intl.get('TronBetUI_0168')}</h3>
                  <h1 style={{ color: '#50D48A', marginTop: '20px' }}>{Common.numToQian(burnData.hasBurn)}</h1>
                  <span style={{ display: 'inline-block', marginTop: '5px', fontSize: '12px' }}>{intl.get('TronBetUI_0181')}</span>
                </div>

                <div id="ante-des" className="por tac" style={{ marginTop: '50px', marginBottom: '50px' }}>
                  <h3 style={{ margin: '0px' }}>{intl.get('TronBetUI_0173')}</h3>
                  <table>
                    <tr>
                      <th>{intl.get('TronBetUI_0174')}</th>
                      <th>{intl.get('TronBetUI_0175')}</th>
                      <th>{intl.get('TronBetUI_0176')}</th>
                      <th>{intl.get('TronBetUI_0177')}</th>
                    </tr>
                    {burnData.burnList.map((item, key) => (
                      <tr key={key}>
                        <td>{Common.dateFtt('yyyy-MM-dd', new Date(item.ts))}</td>
                        <td>{intl.get(BURNDES[item.types])}</td>
                        <td>
                          <span className="winc">{item.amount}</span> WIN
                        </td>
                        <td>
                          <a href={'https://tronscan.org/#/transaction/' + item.tx_id} target="_blank">
                            {Common.strTo7(item.tx_id)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="confirm-ante-opr" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-sm" role="document" style={{ width: '375px' }}>
            <div className="modal-content" style={{ marginTop: '250px', background: '#222328' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '16px' }} className="tac">
                  <p style={{ textAlign: 'left' }}>
                    {anteOprObj.type == 1 ? intl.get('TronBetUI_0123') : intl.get('TronBetUI_0124')} :
                    <span style={{ color: '#00ff98' }}>{anteOprObj.anteNum} DICE</span>
                  </p>
                  <div className="ante-input" style={{ float: 'none', width: '100%' }}>
                    <img src="./images/ante.png" />
                    <input
                      type="text"
                      style={{ fontSize: '20px' }}
                      value={inputAnte}
                      onChange={(e) => {
                        let newInput = e.target.value.replace(/[^\d\.]/g, '')
                        if (anteOprObj.type == 1) {
                          if (newInput > anteFree) newInput = anteFree
                        } else {
                          if (newInput > antePledge.anteAmount) newInput = antePledge.anteAmount
                        }
                        this.setState({ inputAnte: newInput })
                      }}
                    />
                    <br />
                    <button
                      className="btn"
                      id="ante-total"
                      onClick={() => {
                        this.setState({ inputAnte: anteOprObj.type == 1 ? anteFree : antePledge.anteAmount })
                      }}
                    >
                      {intl.get('TronBetUI_0122')}
                    </button>
                  </div>
                  <button
                    className="btn"
                    style={{ width: '120px', background: '#0AAF5B', height: '29px', lineHeight: '25px', fontSize: '14px' }}
                    onClick={() => {
                      if (inputAnte <= 0) return
                      if (inputAnte < 1) {
                        UI.Notice(intl.get('TronBetUI_0131'))
                        return
                      }
                      if (anteOprObj.type == 1) {
                        Wallet.frozenAnte(inputAnte, (err, txId) => {
                          console.log({ txId })
                          $('#confirm-ante-opr').modal('hide')
                          let t = setTimeout(() => {
                            clearTimeout(t)
                            console.log('update')
                            this.props.setUserAnte()
                          }, 5000)
                        })
                      } else {
                        Wallet.unFrozenAnte(inputAnte, (err, txId) => {
                          console.log({ txId })
                          $('#confirm-ante-opr').modal('hide')
                          let t = setTimeout(() => {
                            clearTimeout(t)
                            console.log('update')
                            this.props.setUserAnte()
                          }, 5000)
                        })
                      }
                    }}
                  >
                    {intl.get('TronBetUI_0051')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="ring-notice-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_4005')}
                </h4>
              </div>
              <div className="modal-body">
                <p style={{ wordBreak: 'break-all' }}>{intl.getHTML('TronBetUI_4006')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="info-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {info.title}
                </h4>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '16px' }} dangerouslySetInnerHTML={{ __html: '<span>' + info.content + '</span>' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="notice-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '16px' }} className="tac">
                  {noticeMsg}
                  <br />
                  <br />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="common-notice-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {noticeTitle}
                </h4>
              </div>
              <div className="modal-body">
                <p dangerouslySetInnerHTML={{ __html: '<span>' + noticeBody + '</span>' }}></p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="frozen-notice-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0132')}
                </h4>
              </div>
              <div className="modal-body">
                <p>{intl.getHTML('TronBetUI_0133')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="roll-notice-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0048')}
                </h4>
              </div>
              <div className="modal-body">
                <p>{intl.getHTML('TronBetUI_0049')}</p>
                <h3 className="tac">{intl.get('TronBetUI_0093')}</h3>
                <p>{intl.getHTML('TronBetUI_0094')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="chiji-notice-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title tac" style={{ fontSize: '25px' }}>
                  {intl.get('TronBetUI_0139')}
                </h4>
              </div>
              <div className="modal-body">
                <p>{intl.getHTML('TronBetUI_0140')}</p>
                <br />
                <p>{intl.getHTML('TronBetUI_0141')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="loginTron-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog " role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '16px' }} className="tac">
                  {intl.getHTML('TronBetUI_0041')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="loginScatter-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog " role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '16px' }} className="tac">
                  {intl.getHTML('TronBetUI_0084')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="needScatter-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog " role="document">
            <div className="modal-content" style={{ marginTop: '150px', background: '#181818' }}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: '16px' }} className="tac">
                  {intl.getHTML('TronBetUI_0102')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

export default connect((state) => ({
  refCode: state.wallet.refCode,
  anteObj: state.wallet.anteObj,
  jackpots: state.wallet.jackpots,
  tjTrx: state.wallet.tjTrx,
  anteLock: state.wallet.anteLock,
  anteFree: state.wallet.anteFree,
  antePledge: state.wallet.antePledge,
  anteLeftTime: state.wallet.anteLeftTime,
  canGetPledge: state.wallet.canGetPledge,
  weekly_rank_info: state.wallet.weekly_rank_info,
  fhArr: state.wallet.fhArr,
  setUserAnte: state.wallet.setUserAnte,
  userMoney: state.wallet.userMoney,
  otherIncome: state.wallet.otherIncome,

  noticeMsg: state.common.noticeMsg,
  noticeTitle: state.common.noticeTitle,
  noticeBody: state.common.noticeBody,
  sdjMenuPos: state.common.sdjMenuPos,
  giftExchang: state.common.giftExchang,
  giftNum: state.common.giftNum,
  giftValue: state.common.giftValue,
  giftSellSelectPos: state.common.giftSellSelectPos,
  giftBoxNum: state.common.giftBoxNum,
  openBoxArr: state.common.openBoxArr,
  giftResultMask: state.common.giftResultMask,
  superResultMask: state.common.superResultMask,
  superList: state.common.superList,
  giftRecod: state.common.giftRecod,
  starScore: state.common.starScore,
  starRank: state.common.starRank,
  starRank_t: state.common.starRank_t,
  starRank_d: state.common.starRank_d,
  dailyDjs: state.common.dailyDjs,
  dailyData: state.common.dailyData,
  showPreDaily: state.common.showPreDaily,

  taskLists: state.common.taskLists,
  taskDaily: state.common.taskDaily,

  imgLists: state.common.imgLists,
  playerLevel: state.common.playerLevel,
  currentImg: state.common.currentImg,

  superbowlList: state.common.superbowlList,
  superbowlData: state.common.superbowlData,
  superbowlMoney: state.common.superbowlMoney,
  superbowlCountDown: state.common.superbowlCountDown,
  superbowlEndTime: state.common.superbowlEndTime,
  burnData: state.common.burnData,
  superWin: state.common.superWin,

  oldSeed: state.dice.oldSeed,
}))(App)
