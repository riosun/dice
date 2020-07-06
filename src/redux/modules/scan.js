const initialState = {
  betTimes: 0,
  lv: 0,
  totalAnte: 0,
  totalDivid: 0,
  tableData: [],
  tableTotal: 0,
  gamePos: 0,
  resultPos: 0,
  lastDivid: 0,
  bttTotalDivid: 0,
  bttLastDivid: 0,
  pagelist: [1],
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'scan':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
