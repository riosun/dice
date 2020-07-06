import React, {Component} from 'react';
import {connect} from 'react-redux';
import './style.css';
import {Crash, Dice, Csgo}  from '../';

class App extends Component {
  state = {
  }

  render() {
    let { mutWindow } = this.props;
    return (
      <section id="double">
        {mutWindow.dice?<div style={{width:"50%",float:"left"}}><Dice /></div>:""}
        {mutWindow.moon?<div style={{width:"50%",float:"left"}}><Crash /></div>:""}
        {mutWindow.ring?<div style={{width:"50%",float:"left"}}><Csgo /></div>:""}
      </section>
    );
  }
}

export default connect(
  (state)=>({
    mutWindow: state.common.mutWindow,
  })
)(App)
