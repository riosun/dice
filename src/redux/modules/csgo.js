const initialState = {
  topMenuPos: 0,

  autoPlayMutPos: 0,
  autoPlay: false,

  status: '',
  waitTime: 0.0,
  newHash: '',
  history_logs: [],
  player_info: {
    bet2X: [],
    bet2XTotal: 0,
    bet3X: [],
    bet3XTotal: 0,
    bet5X: [],
    bet5XTotal: 0,
    bet50X: [],
    bet50XTotal: 0,
  },
  betMoney: 10,
  winMoney: 0,
  upChains: {
    '2': [],
    '3': [],
    '5': [],
    '50': [],
  },

  //pk
  roomsInfo: [],
  // rooms_history: [],
  createOpr: { typePos: 0, colorPos: 0, moneyPos: 0 },
  updateTime: 0,
  showHistory: false,
  soloHistorys: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'csgo':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
