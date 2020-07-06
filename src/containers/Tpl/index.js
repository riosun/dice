import React, {Component} from 'react';
import {connect} from 'react-redux';
import './style.css';
import Net from '../../utils/Net';

class App extends Component {
  state = {
  }

  componentDidMount(){
  }

  // componentDidMount(){
  //   this.loadUserlist();
  // }
  // async loadUserlist(){
  //     let data = await Net.get("/wxapi/relative/getRelatives");
  //     if(data.result){
  //       this.setState({userList: data.data.reverse(),loading: false});
  //       localStorage.userList = JSON.stringify(data.data);
  //
  //     }
  //     console.log("loadUserlist",data);
  // }

  render() {
    return (
      <section>
        asdsa
      </section>
    );
  }
}

export default connect(
  (state)=>({

  })
)(App)
