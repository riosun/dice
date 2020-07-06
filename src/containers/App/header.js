import React, { Component } from "react";
import { connect } from "react-redux";
import Wallet from "../../utils/Wallet";
import Common from "../../utils/Common";
import intl from "react-intl-universal";
import Clipboard from "clipboard";
import _ from "lodash";
import "./style.css";
import Config from "../../config";

const $ = window.$;
let refer = window.getUrlParms("r");
if (refer && (refer.length < 4 || refer.length > 16)) {
  refer = false;
}
if (refer == null) {
  if (window.location.origin.indexOf("korea") != -1) {
    refer = "dyeao";
  }
}

const langToGQ = {
  "zh-CN": "country",
  en: "country1",
  kr: "country2",
  fr: "country5",
  ru: "country4",
  de: "country6",
  po: "country7",
};

class App extends Component {
  state = {
    online: 0,
    address: "",
  };
  componentDidMount() {
    let t = setInterval(() => {
      let address = Wallet.getWalletAddress();
      if (address) {
        clearInterval(t);
        this.setState({ address });
      }
    }, 500);

    this.clipboard = new Clipboard("#copyText", {
      target: () => document.getElementById("inputId"),
    });
  }

  componentWillUnmount() {
    this.clipboard.destroy();
  }

  jumpLang(lang) {
    refer = refer ? "&r=" + refer : "";
    let url = "/?lang=" + lang + refer;
    window.location.href = url;
  }

  setWallet(walletNew) {
    let { wallet } = window.localStorage;
    if (wallet == walletNew) return;
    window.localStorage.setItem("wallet", walletNew);
    window.location.reload();
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (
      !_.isEqual(this.props, nextProps) ||
      !_.isEqual(this.state, nextState)
    ) {
      return true;
    } else {
      return false;
    }
  }

  jumpGame(url) {
    $("#header-menu").toggleClass("displayInPhone");
    window.location.href = url;
  }

  render() {
    let { online, address } = this.state;
    let { lang, wallet } = window.localStorage;

    let bookUrl = "./pdf/whitepaper_" + lang + ".pdf";
    let pathName = this.props.routing.locationBeforeTransitions.pathname;

    // <span className="header-menu-item">
    //   <i className="iconfont icon-scan disableded"></i>
    //   <span className="disableded">{intl.get("TronBetUI_0146")}</span>
    // </span>

    // <a href="#/scan"><span className={pathName=="/scan"?"active header-menu-item":"header-menu-item"}>
    //   <i className="iconfont icon-scan"></i>
    //   <span>{intl.get("TronBetUI_0146")}</span>
    // </span> </a>
    let { giftBoxNum } = this.props;
    if (giftBoxNum > 999) giftBoxNum = "999+";
    return (
      <header style={{ display: "none" }}>
        <div className="dib tac" style={{ width: "350px" }} id="logo">
          <img src="./images/anteLogo.png" alt="" height="60" />
        </div>
        <span id="header-left2" style={{ display: "none" }}>
          <i
            className="fa fa-bars mv"
            onClick={() => $("#header-menu").toggleClass("displayInPhone")}
          ></i>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <i
            className="fa fa-comments mv"
            onClick={() => {
              let $chat = $("#chat");
              $chat.css("left") == "0px"
                ? $chat.animate({ left: "-100%" })
                : $chat.animate({ left: "0px" });
            }}
          ></i>
        </span>
        <span id="header-left">
          <span id="header-menu" className="hide">
            <span onClick={() => this.jumpGame("#/dice")}>
              {intl.get("TronBetUI_0143")}
            </span>
            <span onClick={() => this.jumpGame("#/moon")}>
              {intl.get("TronBetUI_0144")}
            </span>
            <span onClick={() => this.jumpGame("#/ring")}>
              {intl.get("TronBetUI_4007")}
            </span>
            <span onClick={() => this.jumpGame("#/ringPk")}>
              {intl.get("TronBetUI_4004")}
            </span>
            <span onClick={() => $("#FAIRNESS").modal("show")}>
              {intl.get("TronBetUI_0001")}
            </span>
            <span onClick={() => $("#REFERRLAS").modal("show")}>
              {intl.get("TronBetUI_0003")}{" "}
            </span>
            <span
              className="hide"
              onClick={() => $("#HOWTOPLAY").modal("show")}
            >
              {intl.get("TronBetUI_0004")}
            </span>
            <span className="hide">
              <a href={bookUrl} target="_blank">
                {intl.get("TronBetUI_0005")}
              </a>
            </span>
            <span onClick={() => $("#BONUS").modal("show")} id="fh">
              {intl.get("TronBetUI_0079")}
            </span>
            <span onClick={() => this.jumpGame("#/scan")}>
              {intl.get("TronBetUI_0146")}
            </span>

            <span
              onClick={() => $("#sdj-modal").modal("show")}
              className="hide"
              style={{ color: "#FF5050" }}
            >
              {intl.get("TronBetUI_2240")}
            </span>

            <span
              className="hide"
              onClick={() => {
                // this.getSdjData();
                $("#sdj-modal").modal("show");
              }}
            >
              {intl.get("TronBetUI_2208")}
            </span>
          </span>

          <span id="header-menu">
            <a href="#/dice">
              <span
                className={
                  pathName == "/dice" || pathName == "/"
                    ? "active header-menu-item"
                    : "header-menu-item"
                }
              >
                <i className="iconfont icon-dice"></i>
                <span>{intl.get("TronBetUI_0143")}</span>
              </span>{" "}
            </a>
            <a href="#/moon">
              <span
                className={
                  pathName == "/moon"
                    ? "active header-menu-item"
                    : "header-menu-item"
                }
              >
                <i className="iconfont icon-crash"></i>
                <span>{intl.get("TronBetUI_0144")}</span>
              </span>{" "}
            </a>

            <a href="#/ring">
              <span
                className={
                  pathName == "/ring"
                    ? "active header-menu-item"
                    : "header-menu-item"
                }
                style={{ position: "relative", top: "4px" }}
              >
                <img
                  src={
                    pathName == "/ring"
                      ? "./images/ring_a.png"
                      : "./images/ring.png"
                  }
                  height="35"
                />
                <span className="">{intl.get("TronBetUI_4007")}</span>
              </span>
            </a>

            <a href="#/ringPk">
              <span
                className={
                  pathName == "/ringPk"
                    ? "active header-menu-item"
                    : "header-menu-item"
                }
                style={{ position: "relative", top: "4px" }}
              >
                <img
                  src={
                    pathName == "/ringPk"
                      ? "./images/ringpk_a.png"
                      : "./images/ringpk.png"
                  }
                  height="35"
                />
                <span className="">{intl.get("TronBetUI_4004")}</span>
              </span>
            </a>

            <span
              className="header-menu-item"
              onClick={() => $("#BONUS").modal("show")}
            >
              <i className="iconfont icon-divide"></i>
              <span>{intl.get("TronBetUI_0079")}</span>
            </span>

            <a href="#/scan">
              <span
                className={
                  pathName == "/scan"
                    ? "active header-menu-item"
                    : "header-menu-item"
                }
              >
                <i className="iconfont icon-scan"></i>
                <span>{intl.get("TronBetUI_0146")}</span>
              </span>{" "}
            </a>

            <span className="dib por">
              <span
                data-toggle="dropdown"
                style={{ cursor: "pointer" }}
                className="header-menu-item"
              >
                <i className="iconfont icon-help"></i>
                <span>{intl.get("TronBetUI_0145")}</span>
              </span>
              <ul
                className="dropdown-menu "
                id="my-dropdown-menu"
                aria-labelledby="dropdownMenu2"
                style={{
                  width: "120px",
                  textAlign: "left",
                  paddingLeft: "8px",
                  right: "-45px",
                  top: "97%",
                }}
              >
                <li
                  onClick={() => $("#FAIRNESS").modal("show")}
                  style={{ height: "25px" }}
                >
                  {intl.get("TronBetUI_0001")}
                </li>
                <li
                  onClick={() => $("#REFERRLAS").modal("show")}
                  style={{ height: "25px" }}
                >
                  {intl.get("TronBetUI_0003")}
                </li>
                <li
                  className="hide"
                  onClick={() => $("#HOWTOPLAY").modal("show")}
                  style={{ height: "25px" }}
                >
                  {intl.get("TronBetUI_0004")}
                </li>
                <a className="hide" href={bookUrl} target="_blank">
                  <li style={{ height: "25px" }}>
                    {intl.get("TronBetUI_0005")}
                  </li>
                </a>
              </ul>
            </span>

            <a href="https://trontrade.io/" className="hide" target="_blank">
              <span
                className="header-menu-item"
                style={{ position: "relative", top: "4px" }}
              >
                <img src="./images/trade.png" height="35" />
                <span className="">{intl.get("TronBetUI_0165")}</span>
              </span>
            </a>

            <span
              className="header-menu-item  hide"
              onClick={() => {
                $("#sdj-modal").modal("show");
              }}
              style={{ position: "relative", top: "4px" }}
            >
              <img src="./images/tsl/tsla_ico.png" height="30" />
              <span style={{ color: "#FF5050", bottom: "5px" }}>
                {intl.get("TronBetUI_2240")}
              </span>
              <lable id="sdj-box-num" className={giftBoxNum > 0 ? "" : "hide"}>
                {giftBoxNum}
              </lable>
            </span>
          </span>
        </span>

        <span id="header-info">
          <div id="connect">
            <p>
              <a href="https://t.me/WINk_org_official" target="_blank">
                <i
                  className="iconfont icon-telegram"
                  style={{ fontSize: "20px" }}
                ></i>
              </a>
            </p>
            <p>
              <a href="https://twitter.com/WINkorg" target="_blank">
                <i
                  className="iconfont icon-twitter"
                  style={{ fontSize: "20px" }}
                ></i>
              </a>
            </p>
            <p id="wx_icon" className="por hide">
              <span className="shequIcon" target="_blank">
                <i
                  className="iconfont icon-weixin1"
                  style={{ fontSize: "20px" }}
                ></i>
              </span>
              <img id="wx_qrcode" src="./images/wx_qrcode.jpg" width="200" />
            </p>
            <p id="guildchat" className="por hide">
              <a href="http://guildchat.io/g/yGy6ka" target="_blank">
                <img
                  src="./images/guildchat.png"
                  width="20"
                  style={{ position: "relative", top: "4px" }}
                />
              </a>
              <img
                id="wx_qrcode2"
                src="./images/guildchatcode.png"
                width="200"
              />
            </p>
          </div>
          &nbsp;&nbsp;&nbsp;&nbsp;
          <span className="hide" style={{ marginRight: "30px" }}>
            <span className="online" style={{ fontSize: "20px" }}>
              ●
            </span>{" "}
            Online: {online}
          </span>
          <span className="hide" style={{ marginRight: "30px" }}>
            {address == "" ? (
              <span
                style={{ cursor: "pointer" }}
                onClick={() => {
                  Wallet.checkLogin();
                }}
              >
                {intl.get("TronBetUI_0065")}
              </span>
            ) : (
              window.parseAddress(address)
            )}
          </span>
          <div
            className="dib por hide"
            id="wallet-select"
            style={{ marginRight: "30px" }}
          >
            <span data-toggle="dropdown" style={{ cursor: "pointer" }}>
              <img
                className="vm"
                src={"./images/" + wallet + ".png"}
                alt=""
                height="40"
                width="40"
              />
              &nbsp;{wallet}&nbsp;<span className="caret"></span>
            </span>

            <ul
              className="dropdown-menu "
              id="my-dropdown-menu"
              aria-labelledby="dropdownMenu2"
              style={{ width: "120px", textAlign: "left", paddingLeft: "8px" }}
            >
              <li
                className={wallet == "tronLink" ? "hide" : ""}
                onClick={() => this.setWallet("tronLink")}
              >
                <img
                  className="vm"
                  src="./images/tronLink.png"
                  height="40"
                  alt=""
                />
                &nbsp;tronLink
              </li>
              <li
                className={wallet == "scatter" ? "hide" : ""}
                onClick={() => this.setWallet("scatter")}
              >
                <img
                  className="vm"
                  src="./images/scatter.png"
                  height="40"
                  alt=""
                />
                &nbsp;scatter
              </li>
              <li
                className={wallet == "guildWallet" ? "hide" : ""}
                onClick={() => this.setWallet("guildWallet")}
              >
                <img
                  className="vm"
                  src="./images/guildchat.png"
                  width="32"
                  height="32"
                  alt=""
                />
                &nbsp;guildWallet
              </li>
            </ul>
          </div>
          <div className="dib por hide">
            <span data-toggle="dropdown" style={{ cursor: "pointer" }}>
              <img
                className="vm"
                src={"./images/" + langToGQ[lang] + ".png"}
                width="40"
                height="25"
                alt=""
              />
              &nbsp;&nbsp;<span className="caret"></span>
            </span>

            <ul
              className="dropdown-menu "
              id="my-dropdown-menu"
              aria-labelledby="dropdownMenu2"
            >
              <li
                className={lang == "kr" ? "hide" : ""}
                onClick={() => this.jumpLang("kr")}
                style={{ marginTop: "10px" }}
              >
                <img
                  className="vm"
                  src="./images/country2.png"
                  width="40"
                  height="25"
                  alt=""
                />
              </li>
              <li
                className={lang == "en" ? "hide" : ""}
                onClick={() => this.jumpLang("en")}
              >
                <img
                  className="vm"
                  src="./images/country1.png"
                  width="40"
                  height="25"
                  alt=""
                />
              </li>
              <li
                className={lang == "ru" ? "hide" : ""}
                onClick={() => this.jumpLang("ru")}
                style={{ marginTop: "10px" }}
              >
                <img
                  className="vm"
                  src="./images/country4.png"
                  width="40"
                  height="25"
                  alt=""
                />
              </li>
              <li
                className={lang == "zh-CN" ? "hide" : ""}
                onClick={() => this.jumpLang("zh-CN")}
                style={{ height: "25px" }}
              >
                <img src="./images/country.png" width="40" height="25" alt="" />
              </li>
              <li
                className={lang == "fr" ? "hide" : ""}
                onClick={() => this.jumpLang("fr")}
                style={{ marginTop: "10px" }}
              >
                <img
                  className="vm"
                  src="./images/country5.png"
                  width="40"
                  height="25"
                  alt=""
                />
              </li>
              <li
                className={lang == "de" ? "hide" : ""}
                onClick={() => this.jumpLang("de")}
                style={{ marginTop: "10px" }}
              >
                <img
                  className="vm"
                  src="./images/country6.png"
                  width="40"
                  height="25"
                  alt=""
                />
              </li>
              <li
                className={lang == "po" ? "hide" : ""}
                onClick={() => this.jumpLang("po")}
                style={{ marginTop: "10px" }}
              >
                <img
                  className="vm"
                  src="./images/country7.png"
                  width="40"
                  height="25"
                  alt=""
                />
              </li>
            </ul>
          </div>
        </span>
      </header>
    );
  }
}

export default connect((state) => ({
  routing: state.routing,
  giftBoxNum: state.common.giftBoxNum,
}))(App);
