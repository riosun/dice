const initialState = {
  nowMut: 1.0,
  nowTime: 0,
  crash: false,
  status: 'waiting', //run游戏中  pengding确认中 waiting下单中 confirm结算中
  waitTime: 0,

  latestLogs: [],
  players_list: [],
  count: 0,
  total: 0,
  winMoney: 0,

  //操作相关
  betMoney: 10,
  autoPlay: false,
  runMut: 2.0,
  betting: false,
  crashList: [],
  roundPlayerList: [],
  roundInfo: { hash: '', end_ts: '', result: '' },
  upChain: false,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'crash':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
