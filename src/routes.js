import React from 'react'
import { IndexRoute, Route } from 'react-router'

import { App, Dice, Crash, Double, Scan, Csgo } from './containers'

export default store => {
  return (
    <Route path='/' component={App}>
      <IndexRoute component={Dice} />
      <Route path='dice' component={Dice} />
      <Route path='moon' component={Crash} />
      <Route path='scan' component={Scan} />
      <Route path='double' component={Double} />
      <Route path='ring' component={Csgo} />
      <Route path='ringPk' component={Csgo} />
    </Route>
  )
}
