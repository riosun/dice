const initialState = {
  boxHeight: '250px',
  initHeightKey: true,
}

export default function reducer(state = initialState, action = {}) {
  switch (action.type) {
    case 'home':
      return {
        ...state,
        ...action,
      }
    default:
      return state
  }
}
