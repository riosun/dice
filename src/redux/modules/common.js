let sound = window.localStorage.sound
if (sound == undefined) {
  sound = 1
}
if (sound == 0) {
  window.$('.sound').each(function() {
    window.$(this)[0].volume = 0
  })
}

const initialState = {
  noticeMsg: '',
  noticeTitle: '',
  noticeBody: '',
  alertMsg: '',
  loading: false,
  lock: false,
  sound: window.localStorage.sound == undefined ? 1 : window.localStorage.sound,
  double: false,
  sdjMenuPos: 0,
  giftBoxNum: 0,
  starScore: 0,
  giftExchang: [
    { star: 20, money: 160, arr: ['s10', 's11', 's12', 's13', 's14'] },
    { star: 20, money: 160, arr: ['h10', 'h11', 'h12', 'h13', 'h14'] },
    { star: 20, money: 160, arr: ['c10', 'c11', 'c12', 'c13', 'c14'] },
    { star: 20, money: 160, arr: ['d10', 'd11', 'd12', 'd13', 'd14'] },

    { star: 10, money: 100, arr: ['s10', 'h10', 'c10', 'd10', '00'] },
    { star: 10, money: 100, arr: ['s11', 'h11', 'c11', 'd11', '00'] },
    { star: 10, money: 100, arr: ['s12', 'h12', 'c12', 'd12', '00'] },
    { star: 10, money: 100, arr: ['s13', 'h13', 'c13', 'd13', '00'] },
    { star: 10, money: 100, arr: ['s14', 'h14', 'c14', 'd14', '00'] },
  ],
  giftNum: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, '9': 0, '10': 0 },
  giftValue: [
    { id: 's10', money: 20 },
    { id: 's11', money: 20 },
    { id: 's12', money: 20 },
    { id: 's13', money: 20 },
    { id: 's14', money: 20 },
    { id: 'h10', money: 20 },
    { id: 'h11', money: 20 },
    { id: 'h12', money: 20 },
    { id: 'h13', money: 20 },
    { id: 'h14', money: 20 },
    { id: 'c10', money: 20 },
    { id: 'c11', money: 20 },
    { id: 'c12', money: 20 },
    { id: 'c13', money: 20 },
    { id: 'c14', money: 20 },
    { id: 'd10', money: 20 },
    { id: 'd11', money: 20 },
    { id: 'd12', money: 20 },
    { id: 'd13', money: 20 },
    { id: 'd14', money: 20 },
    { id: '00', money: 5 },
  ],
  giftSellSelectPos: 0,
  exchangeGifting: false,
  openBoxArr: [],
  giftResultMask: false,
  superResultMask: false,
  superList: [],

  giftRecod: [],
  starRank: { rank: [], me: { rank: '-', reward: '-', score: '-', addr: '-', name: '-' } },
  starRank_d: { rank: [], me: { rank: '-', reward: '-', score: '-', addr: '-', name: '-' } },
  starRank_t: { rank: [], me: { rank: '-', reward: '-', score: '-', addr: '-', name: '-' } },
  luckers: { joker100: [], joker101: [] },

  superbowlList: { team1: [], team2: [], team1Cnt: 0, team2Cnt: 0 },
  superbowlData: { newLimit: 0, loslimit: 0, newTotal: 0, losTotal: 0 },
  superbowlMoney: 10,
  superbowlCountDown: 0,
  superbowlEndTime: 1554091200,
  superWin: -1,

  dailyDjs: '00:00:00',
  dailyData: {
    me: { addr: '-', amont: 0, name: '-', rank: '-', reward: { trx: 0, ante: 0 } },
    rank: [],
    last: { rank: [], time: 0 },
  },
  showPreDaily: false,

  mutWindow: { dice: true, moon: true, ring: false },
  oldPath: '/',

  // taskDaily : {id: 10, need: 10, now: 0, game: "daily", amount:130, status: 0,order: 1},
  taskDaily: [
    { id: 10, need: 4, now: 0, game: 'daily', amount: 20, status: 1, order: 1 },
    { id: 11, need: 7, now: 0, game: 'daily', amount: 30, status: 1, order: 2 },
    { id: 12, need: 9, now: 0, game: 'daily', amount: 50, status: 1, order: 3 },
  ],
  taskLists: [
    // {id: 10, TaskType: 1, need: 10, now: 5, game: "daily", amount:10, status: 0,order: 1},
    { id: 1, need: 10, now: 0, game: 'dice', amount: 6, status: 0, order: 2 },
    { id: 2, need: 7, now: 0, game: 'crash', amount: 6, status: 0, order: 3 },
    { id: 3, need: 8, now: 0, game: 'ring', amount: 6, status: 0, order: 4 },
    { id: 4, need: 3, now: 0, game: 'dice', amount: 12, status: 0, order: 5 },
    { id: 5, need: 10, now: 0, game: 'crash', amount: 12, status: 0, order: 6 },
    { id: 6, need: 15, now: 0, game: 'ring', amount: 12, status: 0, order: 7 },
    { id: 7, need: 10, now: 0, game: 'dice', amount: 30, status: 0, order: 8 },
    { id: 8, need: 10, now: 0, game: 'crash', amount: 30, status: 0, order: 9 },
    { id: 9, need: 10, now: 0, game: 'ring', amount: 16, status: 0, order: 10 },
  ],
  imgLists: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 100, 101],
  currentImg: 10000,
  playerLevel: 1,
  redPoint: false,

  burnData: { hasBurn: 0, waiteBurn: 0, burnList: [] },
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'common':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
