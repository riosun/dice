import React, { Component } from 'react'
import { connect } from 'react-redux'
import './style.css'

class App extends Component {
  render() {
    let { children, id, modalType } = this.props
    if (!modalType) modalType = ''
    return (
      <div className='modal fade baseModal' id={id} tabIndex='-1' role='dialog'>
        <div className={'modal-dialog ' + modalType} role='document'>
          <div className='modal-content' style={{ marginTop: '50px', background: '#24292F' }}>
            <div className='modal-header'>
              <button type='button' className='close' data-dismiss='modal' aria-label='Close'>
                <span aria-hidden='true'>&times;</span>
              </button>
            </div>
            <div className='modal-body'>{children}</div>
          </div>
        </div>
      </div>
    )
  }
}

export default connect(state => ({}))(App)
