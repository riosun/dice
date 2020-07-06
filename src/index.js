import React from 'react'
import ReactDOM from 'react-dom'
import { Router, hashHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'

import { Provider } from 'react-redux'
import createStore from './redux/create'

import getRoutes from './routes'

import './index.css'

const store = createStore()
const $ = window.$
const history = syncHistoryWithStore(hashHistory, store)

const Component = () => <Router history={history}>{getRoutes(store)}</Router>

ReactDOM.render(
  <Provider store={store}>
    <Component />
  </Provider>,
  document.getElementById('root')
)
