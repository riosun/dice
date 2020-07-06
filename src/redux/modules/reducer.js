import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import wallet from './wallet'
import crash from './crash'
import home from './home'
import dice from './dice'
import diceList from './diceList'
import scan from './scan'
import csgo from './csgo'
import common from './common'
import countDown from './countDown'

export default combineReducers({
  routing: routerReducer,
  wallet,
  dice,
  diceList,
  crash,
  common,
  scan,
  csgo,
  home,
  countDown,
})
