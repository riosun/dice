import React, {Component} from 'react';
import intl from 'react-intl-universal';
import {connect} from 'react-redux';
import Common from '../../utils/Common';
import Wallet from '../../utils/Wallet';
import UI from '../../utils/UI';

import './style.css';
import ListView  from './list';
var  _ = require('lodash');

const $ = window.$;
let canMove = false;
let startX = 0;
let startNum = 0;


const WINRARE = [0,600,559,522,487,454,424,395,369,344,321,302,294,286,278,270,262,255,248,241,
234,227,221,215,209,203,197,192,186,181,176,171,166,162,157,153,148,144,140,
136,132,129,125,122,118,115,112,108,105,102,100,97,94,91,88,85,82,79,76,73,70,67,65,62,60,57,55,52,50,48,46,43,41,39,37,35,33,31,30,28,26,24,23,21,19,18,16,15,13,12,10,9,8,6,5,4,0,0,0,0]

const anteWinRare =[0, 62, 116, 164, 206, 243, 275, 302, 326, 346, 363, 380, 408, 435, 461, 485, 508, 532, 555, 576, 596, 615, 636, 655, 673, 690, 706, 725, 739, 755, 771, 785, 799, 816, 828, 843, 852, 866, 879, 891, 903, 920, 929, 945, 953, 967, 981, 986, 998, 1010, 1031, 1041, 1051, 1060, 1068, 1075, 1081, 1085, 1088, 1090, 1091, 1090, 1104, 1100, 1113, 1106, 1117, 1106, 1115, 1123, 1130, 1110, 1114, 1117, 1117, 1117, 1114, 1110, 1142, 1135, 1124, 1111, 1143, 1125, 1101, 1134, 1101, 1059, 1006, 937, 847, 728, 566, 508, 418, 272, 0, 0, 0, 0]

const bttWinRare=[0,12400,23200,32800,41200,48600,55000,60400,65200,69200,72600,76000,81600,87000,92200,97000,101600,106400,111000,115200,119200,
  123000,127200,131000,134600,138000,141200,145000,147800,151000,154200,157000,159800,163200,165600,168600,170400,173200,175800,178200,180600,184000,
  185800,189000,190600,193400,196200,197200,199600,202000,206200,208200,210200,212000,213600,215000,216200,217000,217600,218000,218200,218000,220800,
  220000,222600,221200,223400,221200,223000,224600,226000,222000,222800,223400,223400,223400,222800,222000,228400,227000,224800,222200,228600,225000,
  220200,226800,220200,211800,201200,187400,169400,145600,113200,101600,83600,54400, 0, 0, 0, 0];

const winTokenRare = [0,93000,174000,246000,309000,364500,412500,453000,489000,519000,544500,570000,612000,652500,691500,
727500,762000,798000,832500,864000,894000,922500,954000,982500,1009500,1035000,1059000,1087500,1108500,
1132500,1156500,1177500,1198500,1224000,1242000,1264500,1278000,1299000,1318500,1336500,1354500,1380000,1393500,
1417500,1429500,1450500,1471500,1479000,1497000,1515000,1546500,1561500,1576500,1590000,1602000,1612500,1621500,
1627500,1632000,1635000,1636500,1635000,1656000,1650000,1669500,1659000,1675500,1659000,1672500,1684500,1695000,1665000,
1671000,1675500,1675500,1675500,1671000,1665000,1713000,1702500,1686000,1666500,1714500,1687500,1651500,1701000,1651500,1588500,
1509000,1405500,1270500,1092000,849000,762000,627000,408000,0,0,0,0];

class App extends Component {

  //roll控制
  rollControl = [0, {min: 1, max: 95}, {min: 4, max: 98}];
  rolllName = [0, "Roll Under", "Roll Over"];

  componentDidMount(){
    //界面UI的一些操作事件
    this.bindUIEvent();

    //关闭moon的自动
    window.cmd({type:"crash", autoPlay: false});
  }

  bindUIEvent(){

    //控制滑竿操作
    $("#slider-c").mousedown(e => this.startMove(e));
    $("#slider-c").on("touchstart", (e) => {
      e.preventDefault();
      this.startMove(e.targetTouches[0]);
    });
    $("body").mousemove(e =>this.sliderMove(e)).mouseup(()=>canMove=false)
    $("body").on("touchend", ()=>{canMove=false}).on("touchmove", e=>{
      this.sliderMove(e.targetTouches[0])
    });

    $('#scatter-ranking').slimScroll({
       height: 380,
       color:"#fff"
    });

    $('#daily-ranking').slimScroll({height: 380});

    $(".balanceSelect").blur(()=>{
      $(".coinType").addClass("hide")
    })

  }

  startMove(e){
    canMove = true;
    startX = e.pageX;
    startNum = this.props.dice.selectNum;
  }

  sliderMove(e){
    let {rolling, rollType} = this.props.dice;
    if(rolling) return;
    let {min, max} = this.rollControl[rollType];
    if(canMove){
      let resultNum = startNum+(e.pageX - startX)/4.75;
      if(resultNum >= max){
        resultNum = max;
      }
      if(resultNum <= min){
        resultNum = min;
      }

      let value = Number(resultNum.toFixed(0));
      this.adjustMoneyBuyNum(resultNum);

      window.cmd({type:"dice",selectNum: resultNum})
    }
  }

  adjustMoneyBuyNum(selectNum, rollType){
    selectNum = Number(selectNum);
    if(this.props.allBlance == 0) return;
    let {targetMoney, payType} = this.props.dice;
    if(!rollType){
      rollType = this.props.dice.rollType;
    }

    let multiplier = this.getMultiplier(selectNum, rollType)

    let winRate = rollType==1?selectNum.toFixed(0): 99-selectNum.toFixed(0);

    let maxMoney = this.props.allBlance * WINRARE[winRate]/10000 * 0.8 ;

    let canMaxTargetMoney = maxMoney/(multiplier-1) + "";
    canMaxTargetMoney = Number(canMaxTargetMoney.split(".")[0]);

    if(payType == "ante"){
      canMaxTargetMoney = anteWinRare[winRate];
    }

    if(payType == "btt"){
      canMaxTargetMoney = bttWinRare[winRate];
    }

    if(payType == "win"){
      canMaxTargetMoney = winTokenRare[winRate];
    }

    if(Number(targetMoney) > Number(canMaxTargetMoney)){
      window.cmd({type:"dice",targetMoney: canMaxTargetMoney})
    }

    return canMaxTargetMoney;
  }

  getMultiplier(selectNum, rollType){
    selectNum = selectNum.toFixed(0);
    return  rollType==1?
    Common.numFloor(98.5/selectNum, 10000):
    Common.numFloor(98.5/(99-selectNum), 10000);
  }


  shouldComponentUpdate(nextProps, nextState){
    if (!_.isEqual(this.props, nextProps) || !_.isEqual(this.state, nextState)) {
       return true
    } else {
       return false
    }
  }

  setPayType(e, payType){
    e.stopPropagation();
    $(".coinType").addClass("hide");
    window.localStorage.payType_dice = payType;
    window.cmd({type:"dice", payType, targetMoney: Wallet.minMoneyObj[payType]});

    //获取自己对应币的记录
    let tokenType = Wallet.coins[payType].type;
    window.socket.emit("get_dice_log", {address: Wallet.getWalletAddress() || "", tokenType})
  }

  setImgNumber(img, lv){
    img = img == undefined ? "10000":img;
    lv = (lv == undefined || lv == undefined) ?1:lv;
    img = img=="10000"?9999+(Common.getLevelStage(Number(lv))/10):img;
    img = img==9999?10000:img;

    return img
  }


  render() {
    let {userMoney, showPreDaily, dailyData, dailyDjs, anteFree, tokens} = this.props;
    let {selectNum, rollType, changeNum, rolling, targetMoney, winMoney, autoPlay, payType} = this.props.dice;
    let multiplier = this.getMultiplier(selectNum, rollType);

    let showDailyList = dailyData.rank;
    if(showPreDaily) showDailyList = dailyData.last.rank;

    let showBalances = {
      "ante": anteFree,
      "trx": userMoney,
      "btt": tokens.btt,
      "win": tokens.win,
    }

    let minTargetMoney = Wallet.minMoneyObj[payType];

    return (
      <section>
      <div>

        <div id="dice-view"  className="dib" >

          <section id="numView" style={{backgroundImage:"url('./images/bg.jpg')"}}>

            <img src="./images/numbg.png" id="showNumBg"  alt="" style={{marginTop:"10px", width:"350px",}} />
            <p id="number">
              <span><span className="showNum" style={{fontSize:"100px",color:"#ECECEC",display:"inline-block",width:"170px",fontWeight:"800"}}>{selectNum.toFixed(0)}</span><span style={{fontSize:"16px", lineHeight:"16px"}}><br/>Prediction</span></span>
               <span>
              <span  id="rollNum" className="showNum por" style={{fontSize:"100px",display:"inline-block",width:"170px",color:"#00E689", fontWeight:"800"}}>{changeNum}</span>

              <span style={{fontSize:"16px", lineHeight:"16px"}}><br/>
              {rolling?
                <img style={{height:"22px",verticalAlign:"top",marginTop:"-3px",marginLeft:"2px"}} src="./images/pending.gif" />:
                "Lucky Number"
              }
              </span></span>
            </p>

            <p id="roll-control">
                <span className={rollType==1?"active": ""} onClick={()=>{
                  if(rolling) return;
                  selectNum = Number(selectNum).toFixed(0);
                  if(selectNum < 4){
                    selectNum = 4;
                  }
                  if(selectNum > 95){
                    selectNum = 95
                  }

                  window.cmd({type:"dice", rollType: 1, selectNum: Number(selectNum)})
                  this.adjustMoneyBuyNum(selectNum, 1);
                }}>Roll Under</span>
                <span style={{width:"550px"}} className="dibr dib"></span>
                <span className={rollType==2?"active": ""} onClick={()=>{
                  if(rolling) return;
                  selectNum = Number(selectNum).toFixed(0);
                  if(selectNum > 95){
                    selectNum = 95;
                  }
                  if(selectNum < 4){
                    selectNum = 4
                  }
                  window.cmd({type:"dice", rollType: 2, selectNum: Number(selectNum)})
                  this.adjustMoneyBuyNum(selectNum, 2);

                }}>Roll Over</span>
            </p>

            <section id="slider">
                <p id="slider-bg">
                  <span id="slider-start">0</span>
                  <span id="slider-end">99</span>

                  <p id="slider-up" style={{width: selectNum+"%"}}>
                      <p id="slider-now"></p>
                  </p>
                  <div id="slider-cc" style={{position:"absolute",width:"95%"}}>
                    <p id="slider-c" style={{left: (selectNum-1)+"%"}} >
                      <p id="slider-num">
                        <img src="./images/viewNum.png" alt="" />
                        <span>{selectNum.toFixed(0)}</span>
                      </p>
                    </p>
                  </div>

                </p>

            </section>
          </section>

          <section id="control">
            <div style={{maxWidth:"800px",margin:"0px auto",height:"200px",paddingTop:"10px"}}>
              <div style={{display:"inline-block", width:"58%", height:"100%"}}>
                <table id="control-table">
                  <tr>
                    <td>
                      <p className="kk">{rollType==1?selectNum.toFixed(0): 99-selectNum.toFixed(0)}%
                        <label>{intl.get("TronBetUI_0016")}</label>
                      </p>
                    </td>
                    <td>
                      <p className="kk kk-lg" >
                        <input type="tel" value={targetMoney} onBlur={(e)=>{
                          if(e.target.value < minTargetMoney){
                            window.cmd({type:"dice",targetMoney: minTargetMoney})
                          }
                        }} onChange={(e)=>{
                          if(rolling) return;
                          let targetMoney = e.target.value.replace(/[^\d]/g,'');
                          // if(targetMoney < 1) targetMoney = 1;
                          if(Number(targetMoney) > Number(showBalances[payType])){
                            targetMoney = Math.floor(showBalances[payType]);
                          }

                          let canMoney = this.adjustMoneyBuyNum(selectNum);
                          if(targetMoney > canMoney){
                            targetMoney = canMoney;
                          }
                          window.cmd({type:"dice",targetMoney})
                        }} />
                        <img className={payType=="trx"?"":"hide"} src="./images/trxico.png" />
                        <img className={payType=="btt"?"":"hide"} src="./images/btt.png" width="25" />
                        <img className={payType=="win"?"":"hide"} src="./images/win.png" width="25" />
                        <label style={{top:"-24px"}}> {intl.get("TronBetUI_0017")}
                        <span className="label-btn" onClick={()=>{
                          if(rolling) return;
                          let afterMoney = targetMoney * 2;
                          if(afterMoney > showBalances[payType]){
                            afterMoney = Math.floor(showBalances[payType])
                          }
                          if(afterMoney < minTargetMoney) afterMoney = minTargetMoney;
                          let canMoney = this.adjustMoneyBuyNum(selectNum);
                          if(afterMoney > canMoney){
                            afterMoney = canMoney;
                          }
                          window.cmd({type:"dice",targetMoney: afterMoney})
                        }}>X2</span>
                        <span className="label-btn" onClick={()=>{
                          if(rolling) return;
                          let money = targetMoney/2
                          if(money < minTargetMoney){
                            money = minTargetMoney
                          }
                          window.cmd({type:"dice",targetMoney: money.toFixed(0)})

                        }}>1/2</span>
                        <span className="label-btn" onClick={()=>{
                          if(rolling) return;
                          window.cmd({type:"dice",targetMoney: minTargetMoney})
                        }}>Min</span>
                        <span className="label-btn" onClick={()=>{
                          if(rolling) return;
                          $("#confirm-modal").modal("show")
                        }}>Max</span>
                        </label>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <p className="kk">{multiplier}X
                        <label>{intl.get("TronBetUI_0019")}</label>
                      </p>
                    </td>
                    <td>
                      <p className="kk kk-lg">{  Common.numFloor(multiplier*targetMoney, 10000)}
                        <img className={payType=="trx"?"":"hide"} src="./images/trxico.png" />
                        <img className={payType=="btt"?"":"hide"} src="./images/btt.png" width="25" />
                        <img className={payType=="win"?"":"hide"} src="./images/win.png" width="25" />
                        <label>{intl.get("TronBetUI_0020")}</label>
                      </p>
                    </td>
                  </tr>
                </table>
              </div>

              <div style={{display:"inline-block", width:"42%", height:"100%"}}>
                <table id="control-table">
                  <tr >
                    <td style={{textAlign:"right"}} className="por">
                      <p className="kk kk-lg balanceSelect" tabIndex="3" style={{cursor:"pointer",userSelect:"none",outline:"none"}} onClick={()=>{
                        if(rolling) return
                        $(".coinType").toggleClass("hide");
                      }}>{showBalances[payType]}
                        <img className={payType=="trx"?"":"hide"} src="./images/trxico.png" />
                        <img className={payType=="btt"?"":"hide"} src="./images/btt.png" width="25" />
                        <img className={payType=="win"?"":"hide"} src="./images/win.png" width="25" />
                        <label>
                            {payType.toUpperCase()} {intl.get("TronBetUI_0170")}
                         </label>
                        <i className="fa fa-caret-down"></i>
                        <span className={winMoney==0?"hide":"animated slideOutUp"} style={{color: winMoney>0?"#01F593":"#FF006C"}} id="flyNum">{winMoney>0?"+":"-"}{winMoney} {payType.toUpperCase()}</span>

                        <div className="coinType hide" >
                            <p className={payType=="trx"?"hide":""} onClick={(e)=>this.setPayType(e, "trx")}>{userMoney}
                              <img src="./images/trxico.png" />
                            </p>
                            <p className={payType=="btt"?"hide":""}  onClick={(e)=>this.setPayType(e, "btt")}>{tokens.btt}
                              <img src="./images/btt.png" width="25" />
                            </p>
                            <p className={payType=="win"?"hide":""}  onClick={(e)=>this.setPayType(e, "win")}>{tokens.win}
                              <img src="./images/win.png" width="25" />
                            </p>
                        </div>

                      </p>

                    </td>
                  </tr>

                  <tr>
                    <td style={{position:"relative"}}>
                      <div style={{position:"absolute",left:"36px"}} className="dice-switch">
                        <button type="button" id="autoBtn" className={autoPlay?"active hide":"hide"} onClick={()=>{
                          if(rolling && !autoPlay) return;
                          window.cmd({type:"dice", autoPlay: !autoPlay})
                        }}>{intl.get("TronBetUI_0092")}</button>

                        <div className={autoPlay?"ly-switch open":"ly-switch"}onClick={()=>{
                          if(rolling && !autoPlay) return;
                          window.cmd({type:"dice", autoPlay: !autoPlay})
                        }}>
                        <span className="hide">{autoPlay?"AUTO ON": "AUTO OFF"}</span>
                        <p>{autoPlay? intl.get("TronBetUI_0112") : intl.get("TronBetUI_0113")}</p>
                        <span>{intl.get("TronBetUI_0092")}</span>
                        </div>
                      </div>
                      <button className="btn blue" id="playBtn" style={{width:"200px"}} onClick={()=>this.props.dice.startRollNum()}>
                        {rolling? "Rolling...": this.rolllName[rollType] + " "+selectNum.toFixed(0)}
                      </button>
                      <i className="fa fa-question-circle wenhao" onClick={()=>$("#roll-notice-modal").modal("show")} style={{cursor:"pointer",position:"absolute", right:"-26px", top:"30px",fontSize:"20px"}}></i>
                    </td>
                  </tr>
                </table>
              </div>

            </div>
          </section>

          <section id="control2">
            <div style={{width:"100%",margin:"0px auto"}}>
              <div >
                <table id="control-table">
                  <tr>
                    <td>
                      <p className="kk kk-lg" >
                        <input type="tel" value={targetMoney} onBlur={(e)=>{
                          if(e.target.value < minTargetMoney){
                            window.cmd({type:"dice", tatargetMoney: minTargetMoney})
                          }
                        }} onChange={(e)=>{
                          let targetMoney = e.target.value.replace(/[^\d]/g,'');
                          // if(targetMoney < 1) targetMoney = 1;
                          if(Number(targetMoney) > Number(showBalances[payType])){
                            targetMoney = Math.floor(showBalances[payType]);
                          }

                          let canMoney = this.adjustMoneyBuyNum(selectNum);
                          if(targetMoney > canMoney){
                            targetMoney = canMoney;
                          }
                          window.cmd({type:"dice",targetMoney})

                        }} />
                        <img className={payType=="trx"?"":"hide"} src="./images/trxico.png" />
                        <img className={payType=="btt"?"":"hide"} src="./images/btt.png" width="25" />
                        <img className={payType=="win"?"":"hide"} src="./images/win.png" width="25" />
                        <label style={{top:"-24px"}}> {intl.get("TronBetUI_0017")}
                        <span className="label-btn" onClick={()=>{
                          if(rolling) return;
                          let afterMoney = targetMoney * 2;
                          if(afterMoney > showBalances[payType]){
                            afterMoney = Math.floor(showBalances[payType])
                          }
                          if(afterMoney < minTargetMoney) afterMoney = minTargetMoney;
                          let canMoney = this.adjustMoneyBuyNum(selectNum);
                          if(afterMoney > canMoney){
                            afterMoney = canMoney;
                          }
                          window.cmd({type:"dice",targetMoney: afterMoney})

                        }}>X2</span>
                        <span className="label-btn" onClick={()=>{
                          let money = targetMoney/2
                          if(money < minTargetMoney){
                            money = minTargetMoney
                          }
                          window.cmd({type:"dice", targetMoney: money.toFixed(0)})

                        }}>1/2</span>
                        <span className="label-btn" onClick={()=>window.cmd({type:"dice", targetMoney: minTargetMoney})}>Min</span>
                        <span className="label-btn" onClick={()=>$("#confirm-modal").modal("show")}>Max</span>
                        </label>
                      </p>
                    </td>
                    <td style={{width:"35%"}}>
                      <p className="kk">{rollType==1?selectNum.toFixed(0): 99-selectNum.toFixed(0)}%
                        <label>{intl.get("TronBetUI_0016")}</label>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td>
                      <p className="kk kk-lg">{  Common.numFloor(multiplier*targetMoney, 10000)}
                        <img className={payType=="trx"?"":"hide"} src="./images/trxico.png" />
                        <img className={payType=="btt"?"":"hide"} src="./images/btt.png" width="25" />
                        <img className={payType=="win"?"":"hide"} src="./images/win.png" width="25" />
                        <label>{intl.get("TronBetUI_0020")}</label>
                      </p>
                    </td>
                    <td>
                      <p className="kk">{multiplier}X
                        <label>{intl.get("TronBetUI_0019")}</label>
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td className="por">
                      <p className="kk kk-lg balanceSelect"   tabIndex="3" style={{cursor:"pointer",userSelect:"none",outline:"none"}}  onClick={()=>{
                        if(rolling) return
                        $(".coinType").toggleClass("hide");
                        }}>{showBalances[payType]}
                        <img className={payType=="trx"?"":"hide"} src="./images/trxico.png" />
                        <img className={payType=="btt"?"":"hide"} src="./images/btt.png" width="25" />
                        <img className={payType=="win"?"":"hide"} src="./images/win.png" width="25" />
                        <label>
                          {payType.toUpperCase()} {intl.get("TronBetUI_0170")}
                        </label>
                        <i className="fa fa-caret-down "></i>

                        <span className={winMoney==0?"hide":"animated slideOutUp"} style={{color: winMoney>0?"#01F593":"#FF006C"}} id="flyNum">{winMoney>0?"+":"-"}{winMoney} {payType.toUpperCase()}</span>

                        <div className="coinType hide" >
                            <p className={payType=="trx"?"hide":""} onClick={(e)=>this.setPayType(e, "trx")}>{userMoney}
                              <img src="./images/trxico.png" />
                            </p>

                            <p className={payType=="btt"?"hide":""}  onClick={(e)=>this.setPayType(e, "btt")}>{tokens.btt}
                              <img src="./images/btt.png" width="25" />
                            </p>
                            <p className={payType=="win"?"hide":""}  onClick={(e)=>this.setPayType(e, "win")}>{tokens.win}
                              <img src="./images/win.png" width="25" />
                            </p>
                        </div>

                      </p>


                    </td>
                    <td style={{position:"relative"}} className="dice-switch">
                      <button className="btn blue" id="playBtn" onClick={()=>this.props.dice.startRollNum()}>
                        {rolling? "Rolling...": this.rolllName[rollType] + " "+selectNum.toFixed(0)}
                      </button>

                      <div className={autoPlay?"ly-switch open":"ly-switch"}onClick={()=>{
                        if(rolling && !autoPlay) return;
                        window.cmd({type:"dice", autoPlay: !autoPlay})
                      }}>
                      <span className="hide">{autoPlay?"AUTO ON": "AUTO OFF"}</span>
                      <p>{autoPlay? intl.get("TronBetUI_0112") : intl.get("TronBetUI_0113")}</p>
                      <span>{intl.get("TronBetUI_0092")}</span>
                      </div>

                      <i className="fa fa-question-circle wenhao" onClick={()=>$("#roll-notice-modal").modal("show")} style={{cursor:"pointer",position:"absolute", right:"-26px", top:"30px",fontSize:"20px"}}></i>
                    </td>
                  </tr>

                </table>
              </div>

            </div>
          </section>

          </div>

          <div id="all-daily-list"  className="dib por">
          <div style={{background:"#181818",padding:"10px",height:"100%"}}>
          <h4 className="modal-title tac" style={{fontSize:"21px"}}>{intl.get("TronBetUI_0147")}</h4>
          <p style={{textAlign:"center",fontSize:"14px",margin:"0px",}}>{showPreDaily? Common.dateFtt("yyyy-MM-dd hh:mm:ss", new Date(dailyData.last.time)): intl.get("TronBetUI_4009")+": "+dailyDjs}</p>
          <div id="daily-modal-history" className={dailyData.last.rank.length == 0?"hide":""} onClick={()=>{
            window.cmd({type:"common", showPreDaily: !showPreDaily})
          }}><img src="./images/back_history.png" width="35" style={{transform: showPreDaily?"rotate(180deg)":"rotate(0deg)"}}/></div>
                <p className="tac">
                <div id="chatRankMenu">
                  <table id="fh-table" style={{marginTop:"0px"}}>
                    <tr>
                      <th style={{width:"15%"}}>{intl.get("TronBetUI_0096")}</th>
                      <th style={{width:"35%"}}>{intl.get("TronBetUI_0097")}</th>
                      <th style={{width:"25%"}}>{intl.get("TronBetUI_0098")}</th>
                      <th style={{width:"25%"}}>{intl.get("TronBetUI_0099")}</th>
                    </tr>
                  </table>
                </div>

                <div id="daily-ranking">
                <table id="sr-table" style={{marginTop:"0px"}}>
                  {showDailyList.map((item, key)=>
                    <tr key={key} className={item.addr == Wallet.getWalletAddress()?"me":""}>
                      <td style={{width:"15%"}}>
                        {key > 2?<span>{item.rank}</span>:
                          <img style={{verticalAlign:"middle"}} src={"./images/drank"+(key+1)+".png"}  width="35"/>
                        }</td>
                      <td style={{width:"35%"}}>
                          <div style={{paddingLeft:"60px",position: "relative",height: key>2?"50px":"65px",lineHeight: key>2?"50px":"65px"}}>
                            {item.name == item.addr?window.parseAddress(item.addr):Common.strTo7(item.name)}
                            <div style={{position: "absolute",left: "0", top: "0", width: "60px", height: "60px"}}><img data-maxImg={this.setImgNumber(item.img, item.lv)} src={Common.getUserAvatar(this.setImgNumber(item.img, item.lv))}  style={{verticalAlign:"middle"}} width={key>2?"25px":"60px"}/></div>
                          </div>

                      </td>
                      <td style={{width:"25%"}}>{Common.numToQian(item.amont.toFixed(0))+" TRX"}</td>
                      <td style={{width:"25%"}}>
                        {item.reward.ante == 0?"": <span>{Common.numToQian(item.reward.ante.toFixed(0))+" ANTE"}<br/></span>}
                        {item.reward.trx == 0?"-":Common.numToQian(item.reward.trx.toFixed(0))+" TRX"}
                       </td>
                    </tr>
                    )}
                </table>
                </div>

                <p style={{margin:"0px", marginTop:"20px",fontSize:"12px"}} >{showPreDaily?"":intl.get("TronBetUI_0100")}</p>

                </p>
                </div>
          </div>

          </div>

          <ListView />

          <div className="modal fade" id="confirm-modal" tabIndex="-1" role="dialog">
          <div className="modal-dialog" role="document" >
            <div className="modal-content" style={{marginTop:"150px",background:"#181818"}}>
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              </div>
              <div className="modal-body">
              <div style={{fontSize:"16px"}} className="tac">
              {intl.get("TronBetUI_0045")}
              <br/><br/><br/>
              <button className="mybtn btn-default" style={{background:"#ddd"}} data-dismiss="modal">{intl.get("TronBetUI_0052")}</button>&nbsp;&nbsp;&nbsp;&nbsp;
              <button className="mybtn" style={{background:"#307DAC", color:"#fff"}} onClick={()=>{
                let targetMoney = minTargetMoney;
                if(showBalances[payType] > minTargetMoney){
                  targetMoney = Math.floor(showBalances[payType]);
                }
                let canMoney = this.adjustMoneyBuyNum(selectNum);

                if(targetMoney > canMoney){
                  targetMoney = canMoney;
                }
                window.cmd({type:"dice", targetMoney})

                $("#confirm-modal").modal("hide")
              }}>{intl.get("TronBetUI_0051")}</button>
              </div>
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
    userMoney: state.wallet.userMoney,
    allBlance: state.wallet.allBlance,
    userHasBet: state.wallet.userHasBet,
    anteFree: state.wallet.anteFree,
    tokens: state.wallet.tokens,
    dailyDjs: state.common.dailyDjs,
    dailyData: state.common.dailyData,
    showPreDaily: state.common.showPreDaily,

    dice: state.dice,
  })
)(App)
