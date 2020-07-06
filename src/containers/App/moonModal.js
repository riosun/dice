import React, {Component} from 'react';
import intl from 'react-intl-universal';
import {connect} from 'react-redux';
import Wallet from '../../utils/Wallet';
import Common from '../../utils/Common';
import UI from '../../utils/UI';
import _ from "lodash";

const $ = window.$;

class App extends Component{
  state = {

  }

  shouldComponentUpdate(nextProps, nextState){
    if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
       return true
    } else {
       return false
    }
  }

  componentDidMount(){
    window.socket2.on("my_logs_ret", crashList=>{
      let latestLogs = []
      // console.log(crashList,66666666666)
      crashList.slice(0,6).map(item=>{
        latestLogs.push(item.result);
      })
      window.cmd({type:"crash", crashList, latestLogs});
    })
    window.socket2.on("round_log_ret", msg=>{
      let {playerInfo, roundInfo} = msg;
      console.log({msg});
      window.cmd({type:"crash", roundPlayerList: this.sortPlayer(playerInfo), roundInfo});
    })
  }

  sortPlayer(players_list){
    let lose = [];
    let win = [];
    players_list.map(item=>{
      let {profit} = item;
      profit > 0 ? win.push(item): lose.push(item)
    })

    win.sort((a, b)=>{
      if(Number(a.profit) > Number(b.profit)){
        return -1
      }else if (Number(a.profit) < Number(b.profit)) {
        return 1
      }else {
        return 0;
      }
    })

    lose.sort((a, b)=>{
      if(a.bet > b.bet){
        return 1
      }else if (a.bet < b.bet) {
        return -1
      }else {
        return 0;
      }
    })

    return [...win, ...lose];
  }

  showDetail(round){
    window.socket2.emit("round_log", round);
    $("#moon-list-detail-modal").modal("show");
  }

  getlogColor(mut){
    let c = "#F1433A";
    if( mut >= 1.5 && mut < 2) c = "#85BB8C";
    if( mut >= 2 && mut < 100) c = "#01C083";
    if( mut >= 100 && mut < 500) c = "#106BA6";
    if( mut >= 500 && mut < 1000) c = "#8B008A";
    if( mut >= 1000 && mut < 10000) c = "#FAEC0C";
    return c;
  }

  getHash(hash){
    if(document.body.clientWidth < 991){
      hash = Common.strTo7(hash);
    }
    return hash;
  }

  render() {
    let {crashList, roundPlayerList, roundInfo} = this.props;
    return (
      <section>
        <div className="modal fade" id="moon-list-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document" >
            <div className="modal-content" style={{marginTop:"150px",background:"#181818"}}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 className="modal-title tac" style={{fontSize:"25px"}}>Crash History</h4>
              </div>
              <div className="modal-body">
                <table style={{marginTop:"0px",width:"100%"}}>
                    <tr>
                      <th style={{width:"15%"}}>RESULT</th>
                      <th style={{width:"15%"}}>@</th>
                      <th style={{width:"15%"}}>BET</th>
                      <th style={{width:"15%"}}>PROFIT</th>
                      <th >HASH</th>
                    </tr>
                    {crashList.map((item,key)=>
                      <tr key={key}>
                        <td style={{color: this.getlogColor(item.result)}}>{Common.numFloor(item.result, 100).toFixed(2)}x</td>
                        <td >{item.your_cashed_out}</td>
                        <td >{item.profit}</td>
                        <td >{item.profit}</td>
                        <td onClick={this.showDetail.bind(this,item.round)}>{item.tx_id}</td>
                      </tr>
                    )}

                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="moon-list-detail-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog modal-lg" role="document" >
            <div className="modal-content" style={{marginTop:"150px",background:"#181818"}}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 className="modal-title tac" style={{fontSize:"25px"}}>{intl.get("TronBetUI_1013")}</h4>
              </div>
              <div className="modal-body">
                <div style={{background:"rgba(0,0,0,0.6)"}}>
                  <table>
                    <tr>
                      <td>{intl.get("TronBetUI_1015")}:</td>
                      <td ><a href={"https://tronscan.org/#/transaction/"+roundInfo.hash} target="_blank">{this.getHash(roundInfo.hash)}</a></td>
                    </tr>
                    <tr>
                      <td>{intl.get("TronBetUI_1017")}:</td>
                      <td>{roundInfo.end_ts==""?"":Common.dateFtt("yyyy-MM-dd hh:mm:ss",new Date(roundInfo.end_ts))}</td>
                    </tr>
                    <tr>
                      <td>{intl.get("TronBetUI_1018")}:</td>
                      <td  style={{color: this.getlogColor(roundInfo.result)}}>{roundInfo.result==""?"":Common.numFloor(roundInfo.result, 100).toFixed(2)+"x"}</td>
                    </tr>
                  </table>
                </div>

                <table style={{marginTop:"10px",width:"100%"}}>
                    <tr>
                      <th style={{width:"15%"}}>{intl.get("TronBetUI_1009")}</th>
                      <th style={{width:"15%"}}>{intl.get("TronBetUI_1010")}</th>
                      <th style={{width:"15%"}}>{intl.get("TronBetUI_1021")}</th>
                      <th style={{width:"15%"}}>{intl.get("TronBetUI_1011")}</th>
                    </tr>
                    {roundPlayerList.map((item, key)=>
                      <tr key={key}>
                        <td >{item.name != ""?Common.strTo7(item.name): window.parseAddress(item.addr)}</td>
                        <td >{item.bet}</td>
                        <td >{item.cashed_out>0?Common.numFloor(item.cashed_out, 100).toFixed(2):"-"}</td>
                        <td className={item.profit>0?"winc":"losec"}>{item.profit} TRX</td>
                      </tr>
                    )}

                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="moon-notice-modal" tabIndex="-1" role="dialog">
        <div className="modal-dialog" role="document" >
          <div className="modal-content" style={{marginTop:"150px",background:"#181818"}}>
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title tac" style={{fontSize:"25px"}}>{intl.get("TronBetUI_1006")}</h4>
            </div>
            <div className="modal-body">
              <p>
              {intl.getHTML("TronBetUI_1007")}
              </p>
            </div>
          </div>
        </div>
        </div>

      </section>
    );
  }

}

export default connect(
  state=>({
    crashList: state.crash.crashList,
    roundInfo: state.crash.roundInfo,
    roundPlayerList: state.crash.roundPlayerList
  })
)(App)
