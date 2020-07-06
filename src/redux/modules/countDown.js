const initialState = {
  bonusCD: 0,
  tokenLeftCD: 0,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'countDown':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
