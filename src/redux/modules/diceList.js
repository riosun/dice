const initialState = {
  myBets: [],
  allBets: [],
  highBets: [],
  rareBets: [],
  updateTime: 0,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'diceList':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
