import React, { Component } from 'react'
import intl from 'react-intl-universal'
import { connect } from 'react-redux'
import Wallet from '../../utils/Wallet'
var _ = require('lodash')

const $ = window.$
const shouDoubleSwitch = ['/', '/dice', '/moon', '/double', '/ring']

class App extends Component {
  timer = 0
  isHomePage = false

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  componentDidMount() {
    this.timer = setInterval(() => {
      let { totalWon, ante, newTotalWon, newAnte } = this.props
      let needAdd = newTotalWon - totalWon
      if (needAdd != 0) {
        let step1 = Math.floor(needAdd / 8)
        if (step1 <= 0) step1 = 1
        if (needAdd >= step1) {
          window.cmd({ type: 'wallet', totalWon: totalWon + step1 })
        } else {
          window.cmd({ type: 'wallet', totalWon: newTotalWon })
        }
      }

      let needAddAnte = newAnte - ante
      if (needAddAnte != 0) {
        let step2 = Math.floor(needAddAnte / 10)
        if (step2 <= 1) step2 = 1
        if (needAddAnte >= step2) {
          window.cmd({ type: 'wallet', ante: Math.floor(ante + step2) })
        } else {
          window.cmd({ type: 'wallet', ante: newAnte })
        }
      }
    }, 50)

    //ante币放大操作
    $('#anteCoin').hover(
      () => {
        $('#anteCoinB').show()
      },
      () => {
        $('#anteCoinB').hide()
      }
    )

    $('#anteCoinB').hover(
      () => {
        $('#anteCoinB').show()
      },
      () => {
        $('#anteCoinB').hide()
      }
    )
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
      return true
    } else {
      return false
    }
  }

  handleSound() {
    let { sound } = this.props
    let nexSound = Number(sound) ? 0 : 1
    window.localStorage.sound = nexSound
    window.cmd({ type: 'common', sound: nexSound })

    //关闭所有声音
    $('.sound').each(function() {
      $(this)[0].volume = nexSound
    })
  }

  setPayType(e, payType) {
    e.stopPropagation()
    $('.coinType').addClass('hide')
    window.localStorage.payType_dice = payType
    window.cmd({ type: 'dice', payType, targetMoney: Wallet.minMoneyObj[payType] })

    //获取自己对应币的记录
    let tokenType = Wallet.coins[payType].type
    window.socket.emit('get_dice_log', { address: Wallet.getWalletAddress() || '', tokenType })
  }

  render() {
    let { totalWon, ante, betMoney, double, mutWindow, oldPath, sound, payType } = this.props
    let pathName = this.props.routing.locationBeforeTransitions.pathname
    if (pathName == '/') {
      pathName = '/dice'
      this.isHomePage = true
    } else {
      this.isHomePage = false
    }
    $('#double-switch').css('display', shouDoubleSwitch.indexOf(pathName) == -1 ? 'none' : 'block')

    return (
      <div className='por'>
        <div
          className={double || pathName == '/double' ? 'ly-switch open ' : 'ly-switch '}
          id='double-switch'
          onClick={() => {
            if (double || pathName == '/double') {
              window.location.href = '#' + oldPath
            } else {
              $('#mutWindow-modal').modal('show')
            }
          }}
        >
          <p>{intl.get('TronBetUI_0112')}</p>
          <span>{intl.get('TronBetUI_1026')}</span>
        </div>

        <img
          src={Number(sound) ? './images/sound.png' : './images/sound_l.png'}
          onClick={() => this.handleSound()}
          id='sound'
          width='25'
        />

        <table id='title'>
          <tr style={{ textAlign: 'left' }}>
            <td>
              <div id='coins' style={{ paddingLeft: '20px' }}>
                <span className={payType == 'trx' ? 'active' : ''} onClick={e => this.setPayType(e, 'trx')}>
                  <img src='./images/trxico.png' height='20' className='vm' /> TRX
                </span>
                <span className={payType == 'btt' ? 'active' : ''} onClick={e => this.setPayType(e, 'btt')}>
                  <img src='./images/btt.png' height='20' className='vm' /> BTT
                </span>
                <span className={payType == 'win' ? 'active' : ''} onClick={e => this.setPayType(e, 'win')}>
                  <img src='./images/win.png' height='20' className='vm' /> WIN
                </span>
              </div>
            </td>
          </tr>
        </table>

        <div className='modal fade' id='mutWindow-modal' tabIndex='-1' role='dialog'>
          <div className='modal-dialog modal-sm' role='document'>
            <div className='modal-content' style={{ marginTop: '150px', background: '#181818' }}>
              <div className='modal-header'>
                <button type='button' className='close' data-dismiss='modal' aria-label='Close'>
                  <span aria-hidden='true'>&times;</span>
                </button>
              </div>
              <div className='modal-body tac'>
                <select
                  className='form-control dib'
                  style={{ outline: 'none', background: '#0C0C0C', color: '#BBBBBB', border: 'none', width: '200px' }}
                  ref='gameSelect'
                >
                  {pathName != '/dice' ? <option value='/dice'>{intl.get('TronBetUI_0143')}</option> : ''}
                  {pathName != '/moon' ? <option value='/moon'>{intl.get('TronBetUI_0144')}</option> : ''}
                  {pathName != '/ring' ? <option value='/ring'>{intl.get('TronBetUI_4007')}</option> : ''}
                </select>
                <button
                  className='base-btn'
                  style={{ width: '100px', marginTop: '30px' }}
                  onClick={() => {
                    $('#mutWindow-modal').modal('hide')
                    let selectValue = this.refs.gameSelect.value
                    window.cmd({
                      type: 'common',
                      oldPath: pathName,
                      mutWindow: {
                        dice: selectValue == '/dice' || pathName == '/dice',
                        moon: selectValue == '/moon' || pathName == '/moon',
                        ring: selectValue == '/ring' || pathName == '/ring',
                      },
                    })
                    window.location.href = '#/double'
                  }}
                >
                  {intl.get('TronBetUI_0051')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(state => ({
  ante: state.wallet.ante,
  newAnte: state.wallet.newAnte,
  totalWon: state.wallet.totalWon,
  betMoney: state.wallet.betMoney,
  newTotalWon: state.wallet.newTotalWon,
  double: state.common.double,
  mutWindow: state.common.mutWindow,
  oldPath: state.common.oldPath,
  sound: state.common.sound,
  payType: state.dice.payType,
  routing: state.routing,
}))(App)
