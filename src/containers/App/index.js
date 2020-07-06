import React, { Component } from "react";
import "./style.css";
import intl from "react-intl-universal";
import Wallet from "../../utils/Wallet";
import Common from "../../utils/Common";
import UI from "../../utils/UI";
import { connect } from "react-redux";

import Header from "./header";
import Chat from "./chat";
import Modal from "./modal";
import MoonModal from "./moonModal";
import ScrollNum from "./scrollNum";
import DiceSocket from "./diceSocket";
import Config from "../../config";

const $ = window.$;

const locales = {
  en: require("../../locales/en"),
  "zh-CN": require("../../locales/zh-CN"),
  kr: require("../../locales/kr"),
  ru: require("../../locales/ru"),
  fr: require("../../locales/fr"),
  po: require("../../locales/po"),
  de: require("../../locales/de"),
  es: require("../../locales/es"),
};
const wallets = ["tronLink", "scatter", "guildWallet"];

class App extends Component {
  state = {
    initDone: false,
  };

  //分两次ante
  anteFree = 0; // 已经派发的ANTE
  anteLock = 0; // 尚未派发的ANTE
  anteAmount = 0; // 冻结中的ante
  unfreezingAmount = 0; // 解冻中的ante
  anteDjsTimer = 0;
  hasLoad = false;

  componentWillMount() {
    this.setLang();
    window.cmd({ type: "wallet", setUserAnte: this.setUserAnte.bind(this) });
    window.cmd({ type: "wallet", setUserToken: this.setUserToken.bind(this) });
    window.cmd({
      type: "wallet",
      setTRC10Jackpot: this.setTRC10Jackpot.bind(this),
    });
  }

  componentDidMount() {
    // alert("componentDidMount")
    let t = setTimeout(() => {
      clearTimeout(t);
      $("#root").animate({ opacity: 1 });
      $("#loading").remove();
    }, 1500);

    //首次登录
    window.socket.emit("login", {});

    this.initWallet();
    window.addEventListener("message", (e) => {
      if (typeof e.data != "object") return;
      if (e.data.isTronLink && e.data.message.action == "setAccount") {
        if (e.data.message.data.address != Wallet.getWalletAddress()) {
          this.initWallet();
        }
      }
    });
  }

  initWallet() {
    console.log("init wallet");
    let { wallet } = window.localStorage;
    if (wallets.indexOf(wallet) == -1 || wallet == "guildWallet") {
      wallet = "tronLink";
    }

    console.log({ wallet });
    //初始化钱包，加载初始化数据
    Wallet.init(wallet, () => this.loadBaseData());
  }

  loadBaseData() {
    Wallet.getUserMoeny((userMoney) =>
      window.cmd({ type: "wallet", userMoney })
    );
    Wallet.getRefCode((refCode) => window.cmd({ type: "wallet", refCode }));
    Wallet.getAllBlance((allBlance) =>
      window.cmd({ type: "wallet", allBlance })
    );
    Wallet.userHasBet((userHasBet) =>
      window.cmd({ type: "wallet", userHasBet })
    );
    Wallet.userHasRefer((userHasRefer) =>
      window.cmd({ type: "wallet", userHasRefer })
    );
    this.setUserToken();
    this.setUserAnte();
    //trc10的奖池
    this.setTRC10Jackpot();

    //dice
    Wallet.getSeed((oldSeed) => window.cmd({ type: "dice", oldSeed }));
    Wallet.handleLastOrder((curOrder) => {
      let { roll, under, direction, orderId, tokenAddr } = curOrder;
      window.cmd({
        type: "dice",
        lastOrderId: { ...this.props.lastOrderId, trx: orderId },
      });
      if (roll == 255 && orderId > 0) {
        window.socket.emit("new_order", {
          tx: "",
          address: Wallet.getWalletAddress(),
          orderId: orderId,
          tokenAddr,
          tokenType: "trx",
        });
      }
    }, "trx");

    Wallet.handleLastOrder((curOrder) => {
      let { roll, under, direction, orderId, tokenAddr } = curOrder;
      window.cmd({
        type: "dice",
        lastOrderId: { ...this.props.lastOrderId, trc20: orderId },
      });
      if (roll == 255 && orderId > 0) {
        window.socket.emit("new_order", {
          tx: "",
          address: Wallet.getWalletAddress(),
          orderId: orderId,
          tokenAddr,
          tokenType: "trc20",
        });
      }
    }, "trc20");

    window.cmd({
      type: "dice",
      lastOrderId: {
        trx: 0,
        trc20: 0,
        trc10: 0,
      },
    });

    //crash
  }

  setTRC10Jackpot() {
    Wallet.getTRC10Token((err, data) => {
      if (err) {
        console.log(err);
        return;
      }

      let { jackpots, ourMoneys } = this.props;
      data.assetV2.map((item) => {
        //BTT
        if (item.key == Wallet.coins.btt.tokenID) {
          Wallet.getOriginalAmount(Wallet.coins.btt.tokenID, (btt) => {
            jackpots.btt = Common.numFloor(item.value / 1e6, 10000) - btt;
          });
        }
      });
      window.cmd({ type: "wallet", jackpots });
    });
  }

  setUserToken() {
    //获取用户钱包的token
    Wallet.getWalletToken((err, data) => {
      if (err) {
        console.log(err);
        return;
      }

      let { tokens } = this.props;
      data.assetV2.map((item) => {
        //BTT
        if (item.key == Wallet.coins.btt.tokenID) {
          tokens.btt = Common.numFloor(item.value / 1e6, 10000);
        }
      });

      Wallet.getWinToken((win) => {
        tokens.win = win;
        window.cmd({ type: "wallet", tokens });
      });
    });
  }

  setUserAnte() {
    Wallet.getAnteInfo(this.props.anteObj, -1, (anteObj) => {
      console.log(anteObj, "anteObjanteObjanteObjanteObjanteObj_____");
      window.cmd({ type: "wallet", anteObj });
    });
    // console.log("getUserAnte");
    Wallet.getUserAnte(
      (anteLock) => {
        this.anteLock = anteLock;
        let newAnte = Common.numFloor(
          this.anteLock +
            this.anteFree +
            this.anteAmount +
            this.unfreezingAmount,
          1000
        );
        console.log("newAnte", newAnte);
        window.cmd({ type: "wallet", newAnte, anteLock });
      },
      (anteFree) => {
        this.anteFree = anteFree;
        let newAnte = Common.numFloor(
          this.anteLock +
            this.anteFree +
            this.anteAmount +
            this.unfreezingAmount,
          1000
        );
        console.log("anteFree", newAnte);
        window.cmd({ type: "wallet", newAnte, anteFree: anteFree });
      },
      (antePledge) => {
        this.anteAmount = antePledge.anteAmount;
        this.unfreezingAmount = antePledge.unfreezingAmount;
        let newAnte = Common.numFloor(
          this.anteLock +
            this.anteFree +
            this.anteAmount +
            this.unfreezingAmount,
          1000
        );
        console.log("anteAmount", newAnte);
        window.cmd({ type: "wallet", newAnte, antePledge });

        console.log(
          antePledge.tmUnfreeze - Date.parse(new Date()) / 1000,
          "antePledge.unfreezingAmountantePledge.unfreezingAmountantePledge.unfreezingAmount"
        );

        if (antePledge.unfreezingAmount != 0) {
          this.setAnteDjs(
            antePledge.tmUnfreeze - Date.parse(new Date()) / 1000
          );

          window.axios
            .post("https://ttweb.ether.online/user/getServerTs")
            .then((date) => {
              console.log(
                antePledge.tmUnfreeze - date.data.data,
                "antePledge.tmUnfreeze - date.data.data"
              );
              this.setAnteDjs(antePledge.tmUnfreeze - date.data.data);
            })
            .catch((error) => {
              console.log(error);
            });
        }
      }
    );
  }

  setAnteDjs(timeCount) {
    if (this.anteDjsTimer != 0) clearInterval(this.anteDjsTimer);
    this.anteDjsTimer = setInterval(() => {
      if (timeCount <= 0) {
        clearInterval(this.anteDjsTimer);
        window.cmd({
          type: "wallet",
          anteLeftTime: "00:00:00",
          canGetPledge: true,
        });
        return;
      }
      if ($("#BONUS").css("display") == "block") {
        window.cmd({
          type: "wallet",
          anteLeftTime: Common.getLeftTimes(timeCount),
          canGetPledge: false,
        });
      }
      timeCount--;
    }, 1000);
  }

  setLang() {
    let lang = Common.getUrlParms("lang");
    let langAttr = ["en", "zh-CN"];
    if (lang != null) {
      window.localStorage.setItem("lang", lang);
    } else {
      lang = window.localStorage.getItem("lang");
      if (lang == null) {
        lang = navigator.systemLanguage
          ? navigator.systemLanguage
          : navigator.language;
        if (langAttr.indexOf(lang) == -1) {
          lang = "en";
        }
      }
    }

    if (lang == null) lang = "en";
    if (lang == undefined) lang = "en";

    window.localStorage.setItem("lang", lang);

    let wallet = Common.getUrlParms("wallet");

    if (wallet == null) {
      wallet = window.localStorage.getItem("wallet");
    }
    if (wallet == null) {
      wallet = "tronLink";
    }
    window.localStorage.setItem("wallet", wallet);

    intl
      .init({
        currentLocale: lang,
        locales,
      })
      .then(() => {
        this.setState({ initDone: true });
      });
  }

  render() {
    return (
      <section>
        <div style={{ paddingRight: "15px" }}>
          <div id="loading" className={this.props.loading ? "" : "hide"}>
            <i className="fa fa-spinner fa-spin fa-pulse"></i>
          </div>
          <div id="loading" className={this.props.lock ? "" : "hide"}></div>
          <Header />
          <DiceSocket />
          <Chat />
          <div className="row" id="content">
            <ScrollNum />
            {this.props.children}
            {/* <footer>
              <p>
                If you reside in a location where lottery, gambling, or betting over the internet is illegal, please do not click on anything related to these
                activities on this site. You must be 21 years of age to click on any gambling related items even if it is legal to do so in your location.
                Recognising that the laws and regulations involving online gaming are different everywhere, players are advised to check with the laws that
                exist within their own jurisdiction or region to ascertain the legality of the activities which are covered.
              </p>
              <p>
                The games provided by WINk are based on blockchain, fair, and transparency. When you start playing these games, please take note that online
                gambling and lottery is an entertainment vehicle and that it carries with it a certain degree of financial risk. Players should be aware of
                these risks and govern themselves accordingly.
              </p>
            </footer> */}
          </div>
        </div>
        <MoonModal />
        <Modal />
        <div className="ly-alert error" id="goToMoonAlert">
          {this.props.alertMsg}
          <span className="ly-alert-close" onClick={() => UI.hideAlert()}>
            ×
          </span>
        </div>
      </section>
    );
  }
}

function mapDispatch(dispatch) {
  window.cmd = dispatch;
}
export default connect(
  (state) => ({
    anteObj: state.wallet.anteObj,
    tokens: state.wallet.tokens,
    jackpots: state.wallet.jackpots,
    ourMoneys: state.wallet.ourMoneys,
    alertMsg: state.common.alertMsg,
    loading: state.common.loading,
    lock: state.common.lock,
    routing: state.routing,
    lastOrderId: state.dice.lastOrderId,
  }),
  mapDispatch
)(App);
