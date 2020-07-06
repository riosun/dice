import React, {Component} from 'react';
import intl from 'react-intl-universal';
import {connect} from 'react-redux';
import Wallet from '../../utils/Wallet';
import Common from '../../utils/Common';
import Config from "../../config";
import axios from "axios"

import './style.css';

var  _ = require('lodash');

const $ = window.$;


const options = [
    'one', 'two', 'three'
  ]

class App extends Component {

  timer = 0;
  game = 'all';
  result = 'all'
  curPageStart = 1
  pageTotal = 1;
  curPage = 1
  gamePos = 0
  resultPos = 0
  state = {
    disabled: false,
    value: '',
  };

  games = ["TronBetUI_2007", "TronBetUI_2008", "TronBetUI_4000","TronBetUI_4004","TronBetUI_2049", "TronBetUI_2050"];
  results = ["TronBetUI_2006", "TronBetUI_2009", "TronBetUI_2010"];
  colors = ['TronBetUI_2043', 'TronBetUI_2044', 'TronBetUI_2045', 'TronBetUI_2046']
  styleColors = ['#A03C3C', '#278DCB', '#019965', '#D4B852']

  toggleDisabled = () => {
    this.setState({
      disabled: !this.state.disabled,
    });
  }

  searchResult(noInitPage) {
    if (!Wallet.checkLogin()){
      return
    }

    if (!noInitPage) {
      this.curPage = 1;
      this.curPageStart = 1;
    }

    let addr = Wallet.getWalletAddress()
    // addr = 'TTWnLwY1CPHQtPPWrtBDEPYnTDXTkmdkTs'
    let url = Config.back02Url+"/beter/search"
    // let url = "http://192.168.6.181:8370/beter/search"
    let {gamePos, resultPos} = this.props
    // axios({
    //   url : url,
    //   method : 'post',
    //   // headers: { 'content-type': 'application/x-www-form-urlencoded' },
    //   data : {
    //     addr : addr,
    //     game  : this.gamePos || gamePos,
    //     result : this.resultPos || resultPos,
    //     page : this.curPage,
    //     num : 20
    //   },



      var myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
      var urlencoded = new URLSearchParams();
      urlencoded.append("addr", addr);
      urlencoded.append("game", this.gamePos || gamePos);
      urlencoded.append("result", this.resultPos || resultPos);
      urlencoded.append("page", this.curPage);
      urlencoded.append("num", 20);
      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
      };
      fetch(url, requestOptions)
      .then(response => response.text())
      .then(result => {
      // console.log(typeof result,33333)
      let rs = JSON.parse(JSON.stringify(result))
      let rss = JSON.parse(rs)
      // return
      // console.log('dasdadsadasd_____4234234',rss)
      let {errno, data} = rss;
      // console.log('dasdadsadasd_____4234234',errno,data)
      if(errno == 0){
        
        let tableData = data.data
        let total  = data.total
        window.cmd({type:"scan", tableData: tableData});
        window.cmd({type:"scan", tableTotal: total});
        this.pageTotal = total
        this.reRenderPage()
      }
    }).catch((error)=>{
      console.log(error);
    })
  }

  reRenderPage() {
    let tmpPageList = []
    for (let i=this.curPageStart; i * 20 <= this.pageTotal; i++) {
      if (tmpPageList.length < 5) {
        tmpPageList.push(i)
      } else {
        break
      }
    }
    if (this.pageTotal % 20 != 0 && tmpPageList.length < 5){
      tmpPageList.push(Math.ceil(this.pageTotal / 20))
    }
    window.cmd({type:"scan", pagelist: tmpPageList});
  }

  slidRightPage(){
    if ( (this.curPageStart  + 4 ) * 20 < this.pageTotal) {
      this.curPageStart = this.curPageStart + 1
    }else {
      return
    }
    this.reRenderPage()
  }

  slidLeftPage(){
    if (this.curPageStart > 1) {
      this.curPageStart = this.curPageStart - 1
    }
    this.reRenderPage()
  }

  getOverViewData() {
    let addr = Wallet.getWalletAddress()
    // addr = ''
    let url = Config.back02Url+"/beter/overview"
    // let url = "http://localhost:8650/beter/overview"
    // axios({
    //   url : url,
    //   method : 'post',
    //   headers: { 'content-type': 'application/x-www-form-urlencoded' },
    //   data : {
    //     addr : addr
    //   },
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    var urlencoded = new URLSearchParams();
    urlencoded.append("addr", addr);
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };
fetch(url, requestOptions)
.then(response => response.text())
.then(result => {
      let rs = JSON.parse(JSON.stringify(result))
      let rss = JSON.parse(rs)
      let {errno, data} = rss;
      
      if(errno == 0){
        // alert(data)
        let {total, divid, lv, lastDivid, bttDivid, bttLastDivid} = data
        // console.log(result)
        window.cmd({type:"scan", betTimes: total});
        window.cmd({type:"scan", lv: lv});
        window.cmd({type:"scan", totalDivid: divid});
        window.cmd({type:"scan", lastDivid: lastDivid});
        window.cmd({type:"scan", bttTotalDivid: bttDivid});
        window.cmd({type:"scan", bttLastDivid: bttLastDivid});
      }
    }).catch((error)=>{
      console.log(error);
    })
  }

  componentWillUnmount(){
    clearInterval(this.timer);
    clearInterval(this.timer2);
  }

  getUserAnte(){
    let ante = 0
    Wallet.getUserAnte(anteLock=>{
      this.anteLock = anteLock;
      let newAnte = Common.numFloor((this.anteLock + this.anteFree + this.anteAmount + this.unfreezingAmount), 1000);
      ante = ante + newAnte || 0
      window.cmd({type:"scan", totalAnte: ante});
    },anteFree=>{
      this.anteFree = anteFree;
      let newAnte = Common.numFloor((this.anteLock + this.anteFree + this.anteAmount + this.unfreezingAmount), 1000);
      ante = ante + newAnte || 0
      window.cmd({type:"scan", totalAnte: ante});
    }, antePledge=>{
      this.anteAmount = antePledge.anteAmount;
      this.unfreezingAmount = antePledge.unfreezingAmount;
      let newAnte = Common.numFloor((this.anteLock + this.anteFree + this.anteAmount + this.unfreezingAmount), 1000);
      ante = ante + newAnte || 0
      window.cmd({type:"scan", totalAnte: ante});
    })
  }

  componentDidMount(){

    this.timer2 = setInterval(()=>{
      if(Wallet.getWalletAddress()){
        clearInterval(this.timer2);
        this.getUserAnte()
        this.getOverViewData()
        this.searchResult(false)
      }
   }, 1000)


   $("#select2, #select1").blur(()=>{
      $("#dropdown1, #dropdown2").addClass("hide");
   })

  }

  getPage(page) {
    this.curPage = page
    this.searchResult(true)
  }

  shouldComponentUpdate(nextProps, nextState){
    if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
       return true
    } else {
       return false
    }
  }

  formatDateFromNow(ms) {
    let now = Math.floor(new Date().getTime() / 1000)
    let betTime = Math.floor(ms / 1000)
    let sub = now - betTime
    if (sub < 60) {
      return sub.toString() + ' Seconds ago'
    } else if (sub >= 60 && sub < 120) {
      return Math.floor(sub / 60) + ' ' + intl.get('TronBetUI_2030')
    } else if (sub >= 120 && sub < 3600) {
      return Math.floor(sub / 60) + ' ' + intl.get('TronBetUI_2031')
    }else if (sub >= 3600 && sub < 7200) {
      return Math.floor(sub / 3600) + ' ' + intl.get('TronBetUI_2032')
    }else if (sub >= 7200 && sub < 86400) {
      return Math.floor(sub / 3600) + ' ' + intl.get('TronBetUI_2033')
    } else if (sub >= 86400 && sub < 172800 ){
      return Math.floor(sub / 86400) +  ' ' + intl.get('TronBetUI_2034')
    } else {
      return Math.floor(sub / 86400) +  ' ' + intl.get('TronBetUI_2035')
    }

  }

  getGameAddr(types) {
    if (types == 1) {
      return window.parseAddress('TEEXEWrkMFKapSMJ6mErg39ELFKDqEs6w3')
    } else if (types == 2) {
      return window.parseAddress('TVSkd22mRhjgTr2XSSuL6faTgo4jALmNuH')
    } else if (types == 3) {
      return window.parseAddress('TRkXAjRA6rRsCZ31DofFsZYYPjtz8fvL1u')
    } else if (types == 4) {
      return window.parseAddress('TL8WoUuaQQKtawb1iC3pLwGVGu1feu1pLo')
    } else if (types == 5) {
      return window.parseAddress('TNNrRk5sDUBqH3LMJMQ5FvSmC1ddDRSaUp')
    }
  }


  getTxByAddr(item) {
    if (item.player1 == item.addr) {
      return item.player1Tx
    } else if (item.player2 == item.addr) {
      return item.player2Tx
    } else if (item.player3 == item.addr) {
      return item.player3Tx
    } else if (item.player4 == item.addr) {
      return item.player4Tx
    }
  }

  getSoloRoomsInfo(item) {
    let result = {
      tx_id : '',
      color : '',
      styleColor : '',
    }

    if (item.player1 == item.addr) {
      result.tx_id = item.player1Tx
      result.color = this.colors[0]
      result.styleColor = this.styleColors[0]
    } else if (item.player2 == item.addr) {
      result.tx_id = item.player2Tx
      result.color = this.colors[1]
      result.styleColor = this.styleColors[1]
    } else if (item.player3 == item.addr) {
      result.tx_id = item.player3Tx
      result.color = this.colors[2]
      result.styleColor = this.styleColors[2]
    } else if (item.player4 == item.addr) {
      result.tx_id = item.player4Tx
      result.color = this.colors[3]
      result.styleColor = this.styleColors[3]
    }
    return result
  }

  getPlayers(item) {
    if (item.player4.length > 0) {
      return (<span>
        <span style = {{color : '#A03C3C'}}>{Common.parseName(item.name1)}</span>,
        <span style = {{color : '#278DCB'}}>{Common.parseName(item.name2)}</span>,
        <span style = {{color : '#019965'}}>{Common.parseName(item.name3)}</span>,
        <span style = {{color : '#D4B852'}}>{Common.parseName(item.name4)}</span>
      </span>)
    } else if (item.player3.length > 0) {
      return (<span>
        <span style = {{color : '#A03C3C'}}>{Common.parseName(item.name1)}</span>,
        <span style = {{color : '#278DCB'}}>{Common.parseName(item.name2)}</span>,
        <span style = {{color : '#019965'}}>{Common.parseName(item.name3)}</span>
      </span>)
    } else {
      return (
        <span>
        <span style = {{color : '#A03C3C'}}>{Common.parseName(item.name1)}</span>,
        <span style = {{color : '#278DCB'}}>{Common.parseName(item.name2)}</span>
      </span>
      )
    }
  }

  getGameDetail(type, item){
    if(type == 1){
      return(
        <div className="scan-search-detail">
          <p style={{color : item.payout_sun > 0 ? 'green' : 'red'}}>
            {intl.get(item.payout_sun > 0 ? 'TronBetUI_2016' : "TronBetUI_2017")}
          </p>
          {intl.get('TronBetUI_2011')} : {item.tx_id} <br/>
          {intl.get('TronBetUI_2012')} : {Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(item.ts))}<br/>
          {intl.get(item.direction == 1 ? 'TronBetUI_2021' : 'TronBetUI_2020')} : {item.number}<br/>
          {intl.get('TronBetUI_0027')}  : {item.roll}<br/>
          {intl.get('TronBetUI_2036')} : {item.amount_sun / 1e6} trx<br/>
          {intl.get('TronBetUI_2023')} : {item.payout_sun / 1e6} trx<br/>
          {intl.get('TronBetUI_2018')} : {item.order_id}<br/>
          {intl.get('TronBetUI_2022')}  : {item.sign}<br/>
        </div>
      )
    } else if (type == 2) {
      return (
        <div className="scan-search-detail">
          <p style={{color : item.win > 0 ? 'green' : 'red'}}>
            {intl.get(item.win > 0 ? 'TronBetUI_2016' : "TronBetUI_2017")}
          </p>
          {intl.get('TronBetUI_2011')} : {item.tx_id} <br/>
          {intl.get('TronBetUI_2012')} : {Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(item.ts))}<br/>
          {intl.get('TronBetUI_2024')} : {item.crashAt / 100}<br/>
          {intl.get('TronBetUI_2025')} : {item.autoAt / 100}<br/>
          {intl.get('TronBetUI_2026')} : {item.win <= 0 ? '-' : item.escapeAt / 100}<br/>
          {intl.get('TronBetUI_2036')} : {item.amount} trx<br/>
          {intl.get('TronBetUI_2023')} : {item.win} trx<br/>
          {intl.get('TronBetUI_2027')} : {item.round}<br/>
          {intl.get('TronBetUI_2022')}  : {item.sign}<br/>
        </div>
      )
    } else if (type == 3) {
      return (
        <div className="scan-search-detail">
        <p style={{color : item.win > 0 ? 'green' : 'red'}}>
          {intl.get(item.win > 0 ? 'TronBetUI_2016' : "TronBetUI_2017")}
        </p>
        {intl.get('TronBetUI_2011')} : {item.tx_id} <br/>
        {intl.get('TronBetUI_2012')} : {Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(item.ts))}<br/>
        {intl.get('TronBetUI_2037')} : {item.number}<br/>
        {intl.get('TronBetUI_2038')} : {item.roll}<br/>
        {intl.get('TronBetUI_2036')} : {item.amount} trx<br/>
        {intl.get('TronBetUI_2023')} : {item.win} trx<br/>
        {intl.get('TronBetUI_4001')}  : {item.hash}<br/>
        {intl.get('TronBetUI_4002')}  : {item.salt}<br/>
        {intl.get('TronBetUI_4003')}  : {item.luckyNum}<br/>
        {intl.get('TronBetUI_2027')} : {item.round}<br/>
        {intl.get('TronBetUI_2022')}  : {item.sign}<br/>

      </div>
      )

    }
    else if (type == 4) {
      let info = this.getSoloRoomsInfo(item)
      this.getPlayers(item)
      return (
        <div className="scan-search-detail">
          <p style={{color : item.addr == item.winAddr ? 'green' : 'red'}}>
            {intl.get(item.addr == item.winAddr ? 'TronBetUI_2016' : "TronBetUI_2017")}
          </p>
          {intl.get('TronBetUI_2011')} : {this.getTxByAddr(item)} <br/>
          {intl.get('TronBetUI_2012')} : {Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(item.ts))}<br/>
          {intl.get('TronBetUI_2039')} : <span style={{color : `${info.styleColor}`}}>{intl.get(info.color)}</span> <br/>
          {intl.get('TronBetUI_2040')} : <span style={{color : `${this.styleColors[item.roll]}`}}>{intl.get(this.colors[item.roll])}</span><br/>
          {intl.get('TronBetUI_2036')} : {item.amount} trx<br/>
          {intl.get('TronBetUI_2023')} : {item.status == 4 ? item.amount : item.addr == item.winAddr ? item.win : 0} trx<br/>
          {intl.get('TronBetUI_2027')} : {item.room_id}<br/>
          {intl.get('TronBetUI_2042')} : {this.getPlayers(item)}<br/>
      </div>
      )

    } else if(type == 5){
      return(
        <div className="scan-search-detail">
          <p style={{color : item.win > 0 ? 'green' : 'red'}}>
            {intl.get(item.win > 0 ? 'TronBetUI_2016' : "TronBetUI_2017")}
          </p>
          {intl.get('TronBetUI_2011')} : {item.hash} <br/>
          {intl.get('TronBetUI_2012')} : {Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(item.ts))}<br/>
          {intl.get(item.direction == 1 ? 'TronBetUI_2021' : 'TronBetUI_2020')} : {item.number}<br/>
          {intl.get('TronBetUI_0027')}  : {item.roll}<br/>
          {intl.get('TronBetUI_2036')} : {item.amount } ANTE<br/>
          {intl.get('TronBetUI_2023')} : {item.win} ANTE<br/>
          {intl.get('TronBetUI_2018')} : {item.order_id}<br/>
          {intl.get('TronBetUI_2022')}  : {item.sign}<br/>
        </div>
      )
    } else if(type == 6){
      return(
        <div className="scan-search-detail">
          <p style={{color : item.win > 0 ? 'green' : 'red'}}>
            {intl.get(item.win > 0 ? 'TronBetUI_2016' : "TronBetUI_2017")}
          </p>
          {intl.get('TronBetUI_2011')} : {item.hash} <br/>
          {intl.get('TronBetUI_2012')} : {Common.dateFtt('yyyy-MM-dd hh:mm:ss', new Date(item.ts))}<br/>
          {intl.get(item.direction == 1 ? 'TronBetUI_2021' : 'TronBetUI_2020')} : {item.number}<br/>
          {intl.get('TronBetUI_0027')}  : {item.roll}<br/>
          {intl.get('TronBetUI_2036')} : {item.amount } BTT<br/>
          {intl.get('TronBetUI_2023')} : {item.win} BTT<br/>
          {intl.get('TronBetUI_2018')} : {item.order_id}<br/>
          {intl.get('TronBetUI_2022')}  : {item.sign}<br/>
        </div>
      )
    }
  }

  render() {
    let {test, currentImg} = this.props;
    const defaultOption = options[0]

    // axios.defaults.headers.common['content-type'] = 'application/x-www-form-urlencoded';

    let {tableTotal, tableData, gamePos, resultPos, pagelist, betTimes, lv, totalAnte, totalDivid, lastDivid, payType, bttTotalDivid, bttLastDivid} = this.props;
    let payImgsname = payType == 'btt' ? 'btt' : 'trxico'

    return (
      <div id="scan-content" style={{minHeight:"700px"}}>

          <div id="scan-overview">
            <table id="scan-title">
              <tr>
                <td style={{width:"16.666%" ,fontSize : '21px', color : 'rgb(187,187,187)', lineHeight : "26px",cursor:"pointer"}} onClick={()=>{if(!Wallet.checkLogin()) return;$("#Avatar-modal").modal("show")}}>
                <img src={Common.getUserAvatar(currentImg)} width="70" height="70" style={{verticalAlign:"-webkit-baseline-middle"}}/>
                <br/>
                </td>
                <td style={{width:"16.666%" ,fontSize : '21px', color : 'rgb(187,187,187)', lineHeight : 2}}>
                {intl.get("TronBetUI_2001")}
                <br/>
                <span style={{fontSize:"22px" , color : 'rgb(16,187,71)', marginTop : 20}} className="c-blue0">{window.numToQian(lv)}</span>
                </td>
                <td style={{width:"16.666%",fontSize : '21px', color : 'rgb(187,187,187)',lineHeight : 2}}>
                {intl.get("TronBetUI_2002")}<br/>
                <span style={{fontSize:"22px" , color : 'rgb(16,187,71)'}} className="c-blue0">{window.numToQian(betTimes)}</span>
                </td>
                <td style={{width:"16.666%",fontSize : '21px', color : 'rgb(187,187,187)',lineHeight : 2}}>
                  {intl.get("TronBetUI_2003")}<br/>
                  <span style={{fontSize:"22px", color : 'rgb(16,187,71)'}} className="c-blue0">{window.numToQian(totalAnte)}</span>
                </td>
                <td style={{width:"16.666%",fontSize : '21px', color : 'rgb(187,187,187)',lineHeight : 2}}>
                  {intl.get("TronBetUI_2004")}<br/>
                  <img src={"./images/" + payImgsname + ".png"} width="22" height="22"/>
                  <span style={{fontSize:"22px", color : 'rgb(16,187,71)'}} className="c-blue0">{window.numToQian((payType == 'btt' ?  bttTotalDivid : totalDivid).toFixed(3))}</span>
                </td>
                <td style={{width:"16.666%",fontSize : '21px', color : 'rgb(187,187,187)',lineHeight : 2}}>
                  {intl.get("TronBetUI_2028")}<br/>
                  <img src={"./images/" + payImgsname + ".png"} width="22" height="22"/>
                  <span style={{fontSize:"22px", color : 'rgb(16,187,71)'}} className="c-blue0">{window.numToQian(((payType == 'btt' ?  bttLastDivid : lastDivid).toFixed(3)))}</span>
                </td>
              </tr>
            </table>
          </div>

          <div id="personalInfo">

          <div id="searchInfo">
            <div className="col-md-3">
                <div style={{width:"100%"}} className="por dib" tabIndex="2" id="select1">
                  <p  className="btn my-btn" style={{height:45, background:"#010C0E", border :"1px solid #4F5757", color : '#BBBBBB!important'}} onClick={()=>{
                    if($("#dropdown1").hasClass("hide")) $("#select1").focus();
                    $("#dropdown1").toggleClass("hide");

                  }}>
                    <p>{intl.get(this.games[gamePos])}</p>
                    <span className="glyphicon glyphicon-chevron-down" style={{position:"absolute",right:"20px",display:"block",height:"44px",lineHeight:"44px"}}></span>
                  </p>
                  <ul className="self-dropdown-menu hide" id="dropdown1">
                    {this.games.map((item,key)=>
                      <li key={key} className={key == 4?"hide":""} onClick={ ()=> {$("#dropdown1").toggleClass("hide");window.cmd({type:"scan", gamePos: key});this.gamePos = key;this.searchResult(false);$(".resultDetail").hide()}}>{intl.get(item)}</li>
                    )}
                  </ul>
                </div>
            </div>
            <div className="col-md-3">
                <div style={{width:"100%"}} className="por dib" tabIndex="3" id="select2">
                  <p  className="btn my-btn" style={{height:45,background:"#010C0E", border :"1px solid #4F5757"}} onClick={()=>{
                    if($("#dropdown2").hasClass("hide")) $("#select2").focus();
                    $("#dropdown2").toggleClass("hide")}
                  }>
                    <p>{intl.get(this.results[resultPos])}</p>
                    <span className="glyphicon glyphicon-chevron-down" style={{position:"absolute",right:"20px",display:"block",height:"44px",lineHeight:"44px"}}></span>
                  </p>
                  <ul className="self-dropdown-menu hide" id="dropdown2" >
                    {this.results.map((item,key)=>
                      <li key={key} onClick={ ()=> {$("#dropdown2").toggleClass("hide");window.cmd({type:"scan", resultPos: key});this.resultPos = key;this.searchResult(false);$(".resultDetail").hide()}}>{intl.get(item)}</li>
                    )}
                  </ul>
                </div>
            </div>
            <div className="scan-page-div">
                  <div className="scan-page-list" onClick={this.slidLeftPage.bind(this)}>&lt;&lt;</div>
                  {pagelist.map((item, key) =>
                      <div key= {key} className={item == this.curPage ? "scan-page-list active" : "scan-page-list"} onClick={this.getPage.bind(this, item)}>{item}</div>
                  )}
                 <div className="scan-page-list" onClick={this.slidRightPage.bind(this)}>&gt;&gt;</div>
                 <div className="scan-page-pageTotal">20/Page</div>
                </div>

          </div>

            {/* 分页 */}
            <div className="pageNation">


                <div className="tback">
                <table className="my-table-hover my-table-striped" style={{width : '100%',textAlign:"center", wordBreak:'break-all'}} id="resultTable">
                  <thead>
                    <tr>
                      <th scope="col"><p>{intl.get('TronBetUI_2018')}</p></th>
                      <th scope="col"><p>{intl.get('TronBetUI_2011')}</p></th>
                      <th scope="col"><p>{intl.get('TronBetUI_2012')}</p></th>
                      <th scope="col"><p>{intl.get('TronBetUI_2013')}</p></th>
                      <th scope="col"><p>{intl.get('TronBetUI_2014')}</p></th>
                      <th scope="col"><p>{intl.get('TronBetUI_2015')}</p></th>
                    </tr>
                  </thead>
                    {tableData.length > 0 ? "" : <tbody>
                      <tr>
                        <td colSpan={6} style={{background:"#000"}}>
                            <p style={{textAlign : "center", height : 60, marginTop : 25}}>{intl.get('TronBetUI_2029')}</p>
                        </td>
                      </tr>
                    </tbody>}
                    {tableData.map((item,key)=>
                      <tbody key={key}>
                      <tr onClick={e=>{
                        let isShow = $(".hide"+key).css('display')
                        $(".resultDetail").hide()
                        if (isShow  == 'none') {
                          $(".hide"+key).css('display', 'show')
                          $(".hide"+key).show()
                        } else {
                          $(".hide"+key).css('display', 'none')
                          $(".hide"+key).hide()
                        }

                      }}>
                        <td >{Common.strTo7(item.order_id || item.round || item.room_id)}</td>
                        <td >{Common.strTo7(item.tx_id || item.hash)}</td>
                        <td>{this.formatDateFromNow(item.ts)}</td>
                        <td>{window.parseAddress(item.addr)}</td>
                        <td>{this.getGameAddr(item.types)}</td>
                        <td>{(item.amount_sun / 1e6) || item.amount}</td>
                      </tr>
                      <tr className={"resultDetail hide"+key} style={{display :'none'}}>
                        <td colSpan={6} style={{background:"#000"}}>
                        {this.getGameDetail(item.types, item)}
                        </td>
                      </tr>
                      </tbody>
                    )}

                </table>
                </div>
            </div>
        </div>
      </div>
    )
  }
}

export default connect(
  state=>({
    test: state.scan.test,
    tableData : state.scan.tableData,
    tableTotal : state.scan.tableTotal,
    gamePos : state.scan.gamePos,
    resultPos : state.scan.resultPos,
    pagelist : state.scan.pagelist,
    betTimes: state.scan.betTimes,
    lv: state.scan.lv,
    totalAnte: state.scan.totalAnte,
    totalDivid: state.scan.totalDivid,
    lastDivid : state.scan.lastDivid,
    bttTotalDivid: state.scan.bttTotalDivid,
    bttLastDivid : state.scan.bttLastDivid,
    currentImg: state.common.currentImg,
    payType : state.dice.payType,
  })
)(App)
