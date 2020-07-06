const minMoneyObj = { trx: 10, ante: 1, btt: 500, win: 1000 }

let payType = window.localStorage.payType_dice || 'trx'

const initialState = {
  oldSeed: '', //随机种子

  selectNum: 50,
  changeNum: '00',
  targetMoney: minMoneyObj[payType],

  rolling: false,
  rollType: 2,
  winMoney: 0,

  noticeMsg: '',

  tjTrx: 0,

  autoPlay: false,

  lastOrderId: {
    trx: 0,
    trc20: 0,
    trc10: 0,
  },
  payType,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'dice':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
