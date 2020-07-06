import { createStore as _createStore } from 'redux'
import reducer from './modules/reducer'

export default function createStore() {
  const store = _createStore(reducer)
  return store
}
