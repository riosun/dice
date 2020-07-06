/**
 * 钱包一些通用的数据
 */

const initialState = {
  userMoney: 0, //用户的余额
  refCode: -1, //推荐码
  tjTrx: 0, //推荐获得的TRX
  weekly_rank_info: [],
  fhArr: [],

  //ante相关
  anteLock: 0,
  anteFree: 0,
  newAnte: 0,
  antePledge: { address: '', anteAmount: 0, tmUnfreeze: 0, unfreezingAmount: 0 },
  anteLeftTime: '00:00:00',
  canGetPledge: false,
  anteObj: {
    totalTRX: 0,
    nowAnte: 0,
    totalAnte: 5000000,
    canGetTrx: 0,
    stage: 1,
    needTrx: 200,
    totalPledgeAnte: 0,
    devPledgeAnte: 0,
  },

  allBlance: 0,
  userHasBet: false,
  userHasRefer: false,

  ante: 0,
  totalWon: 0,
  newTotalWon: 0,
  betMoney: 0,
  tokens: {
    btt: 0,
    win: 0,
  },
  jackpots: {
    btt: 0,
    live: 0,
  },
  ourMoneys: {
    btt: 0,
  },

  otherIncome: [],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'wallet':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
