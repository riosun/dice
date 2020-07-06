import React, {Component} from 'react';
import intl from 'react-intl-universal';
import {connect} from 'react-redux';
import Wallet from '../../utils/Wallet';
import Common from '../../utils/Common';
var  _ = require('lodash');

const $ = window.$;

class App extends Component {
    state={
      pagePos: 1,
    }


    getRowTr(item, key){
      let {pagePos} = this.state;
      let payoutClass = "list-th";
      if(item.payout == 0) payoutClass += " nomoney"
      item.isWin?payoutClass += " winc": payoutClass+ " losec";

      if(item.name == undefined && item.roll == 255){
        return false
      }
      if(item.payout == undefined){
            return false;
      }

      let tokenName = "TRX";
      if(item.tokenName) tokenName = item.tokenName.toUpperCase();

      return (
        <tr key={key} className={item.isWin?"win":"lose"}>
        <td ></td>
        {pagePos == 0?
          <td >{item.orderId}</td>:""
        }
        <td className="list-th">{item.name == ""?window.parseAddress(item.bettor):Common.strTo7(item.name)}</td>
        <td className="list-th">{item.direction==0?<span className="">Under</span>:<span className="">Over</span>}&nbsp;{item.number}</td>
        <td className="list-th" className={item.isWin?"winc":"losec"}>{item.roll}</td>
        <td className="list-th" style={{textAlign:"right"}}>{item.trx_amount} {tokenName}</td>
        <td className={payoutClass} style={{textAlign:"right"}}>{item.payout==0?"-":item.payout+" "+tokenName}</td>
        <td className="adj-th" style={{width:"100px"}}></td>
      </tr>
      )
    }

    setPagePos(pagePos){
      if(this.state.pos == pagePos) return;
      this.setState({pagePos});
    }

    shouldComponentUpdate(nextProps, nextState){
      if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
         return true
      } else {
         return false
      }
    }

    render() {
        let {pagePos} = this.state;
        let {myBets, allBets, highBets, rareBets} = this.props.diceList;
        return (
          <section id="listView"  style={{backgroundImage:"url('./images/bg.jpg')"}}>
            <section id="list-menu">
              <p className={pagePos==0?"active":""} onClick={this.setPagePos.bind(this, 0)}>{intl.get("TronBetUI_0021")}</p>
              <p className={pagePos==1?"active":""} onClick={this.setPagePos.bind(this, 1)}>{intl.get("TronBetUI_0022")}</p>
              <p className={pagePos==2?"active":""} onClick={this.setPagePos.bind(this, 2)}>{intl.get("TronBetUI_0023")}</p>
              <p className={pagePos==3?"active":""} onClick={this.setPagePos.bind(this, 3)}>{intl.get("TronBetUI_0024")}</p>
            </section>

            <table cellSpacing="0" cellPadding="0" id="list-table">
              <tr>
                <th className="adj-th" style={{width:"100px"}}></th>
                {pagePos == 0?
                  <th style={{width:"80px"}}>#</th>:""
                }
                <th className="adj-th list-th" style={{width:"210px"}}>{intl.get("TronBetUI_0025")}</th>
                <th className="list-th" >Prediction</th>
                <th className="list-th" style={{width:"20%"}}>Lucky Number</th>
                <th className="list-th" style={{textAlign:"right", width:"10%" }}>{intl.get("TronBetUI_0028")}</th>
                <th className="list-th" style={{textAlign:"right", width:"20%"}}>{intl.get("TronBetUI_0029")}</th>
                <th className="adj-th list-th" style={{width:"150px"}}></th>
              </tr>
              <tbody className={pagePos==0?"":"hide"}>
                <tr className={myBets.length > 0?"hide":""}><td colSpan="7" style={{height:"160px"}}>{intl.get("TronBetUI_0050")}</td></tr>
                  {myBets.map((item, key)=>
                    {return this.getRowTr(item, key)}
                  )}
              </tbody>

              <tbody className={pagePos==1?"":"hide"}>
              <tr className={allBets.length > 0?"hide":""}><td colSpan="7" style={{height:"160px"}}>{intl.get("TronBetUI_0050")}</td></tr>
                {allBets.map((item, key)=>
                    {return this.getRowTr(item, key)}
                )}
              </tbody>

              <tbody className={pagePos==2?"":"hide"}>
              <tr className={highBets.length > 0?"hide":""}><td colSpan="7" style={{height:"160px"}}>{intl.get("TronBetUI_0050")}</td></tr>
                {highBets.map((item, key)=>
                    {return this.getRowTr(item, key)}
                )}
              </tbody>

              <tbody className={pagePos==3?"":"hide"}>
              <tr className={rareBets.length > 0?"hide":""}><td colSpan="7" style={{height:"160px"}}>{intl.get("TronBetUI_0050")}</td></tr>
                {rareBets.map((item, key)=>
                    {return this.getRowTr(item, key)}
                )}
              </tbody>

            </table>

          </section>

        )
    }
}

export default connect(
  state=>({
    diceList: state.diceList,
  })
)(App)
