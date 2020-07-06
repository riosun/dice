import React, { Component } from "react";
import { connect } from "react-redux";
import Wallet from "../../utils/Wallet";
import Common from "../../utils/Common";
import intl from "react-intl-universal";
import _ from "lodash";
import "./style.css";

const $ = window.$;

const langToShowName = {
  zh: "CN",
  en: "EN",
  ko: "KR",
  ru: "RU",
  fr: "FR",
  all: "ALL",
};

const systemAddr = "TFXshAocC6ctfTYDdvtb3iK6jGcYVtcBLF";

const faceArr = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😃",
  "😄",
  "😅",
  "😆",
  "😉",
  "😊",
  "😋",
  "😎",
  "😍",
  "😘",
  "😗",
  "😙",
  "😚",
  "☺️",
  "🙂",
  "🤗",
  "🤔",
  "😐",
  "😑",
  "😶",
  "🙄",
  "😏",
  "😣",
  "😥",
  "😮",
  "🤐",
  "😯",
  "😪",
  "😫",
  "😴",
  "😌",
  "😛",
  "😜",
  "😝",
  "🤤",
  "😒",
  "😓",
  "😔",
  "😕",
  "🙃",
  "🤑",
  "😲",
  "☹️",
  "🙁",
  "😖",
  "😞",
  "😟",
  "😤",
  "😢",
  "😭",
  "😦",
  "😧",
  "😨",
  "😩",
  "😬",
  "😰",
  "😱",
  "😳",
  "😵",
  "😡",
  "😠",
  "😷",
  "🤒",
  "🤕",
  "🤢",
  "🤧",
  "😇",
  "🤠",
  "🤡",
  "🤥",
  "🤓",
  "😈",
  "👿",
  "👹",
  "👺",
  "💀",
  "👻",
  "👽",
  "🤖",
  "💩",
  "👐",
  "🙌",
  "👏",
  "🤝",
  "👍",
  "👎",
  "👊",
  "✊",
  "🤛",
  "🤜",
  "🤞",
  "✌️",
  "🤘",
  "👌",
  "👈",
  "👉",
  "👆",
  "👇",
  "☝️",
  "✋",
  "🤚",
  "🖐",
  "🖖",
  "👋",
  "🤙",
  "💪",
  "🖕",
  "✍️",
  "🙏",
  "💍",
  "💄",
  "💋",
  "👄",
  "👅",
  "👂",
  "👃",
  "👣",
  "👁",
  "👀",
  "🎲",
  "🌛",
  "🌜",
  "🌙",
  "🐻",
  "🐮",
  "🥞",
  "🥓",
  "🍗",
  "🍖",
  "🌭",
  "🍔",
  "🍟",
  "🍕",
  "🥙",
  "🌮",
  "🌯",
  "🥗",
  "🥘",
  "🍝",
  "🍜",
  "🍲",
  "🍛",
  "🍣",
  "🍱",
  "🍤",
  "🍙",
  "🍚",
  "🍘",
  "🍥",
  "🍺",
  "🍻",
  "🥂",
  "🍷",
  "🥃",
  "🍸",
  "🍹",
  "🍾",
  "⚽️",
  "🏀",
  "🏈",
  "⚾️",
  "🏐",
  "🏉",
  "🎾",
  "🎱",
  "🏓",
  "🏸",
  "🥅",
  "🏒",
  "🏑",
  "🏏",
  "⛳️",
  "🏹",
  "🎣",
  "🥊",
  "🏆",
  "🚀",
  "💸",
  "💵",
  "💴",
  "💶",
  "💷",
  "💰",
  "💳",
  "💎",
  "🎉",
  "🎇",
  "🎆",
];

class App extends Component {
  state = {
    menuPos: 0,
    showChatRoom: false,

    chats: {
      chat_dice_lan_zh: [],
      chat_dice_lan_en: [],
      chat_dice_lan_all: [],
      chat_dice_lan_ko: [],
      chat_dice_lan_ru: [],
      chat_dice_lan_fr: [],
    },
    rainList: [],
    betRank: [],
    updateTime: 0,
    rainTop: 125,
  };
  rainObj = { id: 0, left: 0 };
  maxHeigh = 500;
  addChats = [];
  shouldShowFace = true;

  componentDidMount() {
    $("chatTextarea").attr("placeholder", "Type your message...");
    window.socket.on("rank_info", (rank_info) => {
      this.setState({
        betRank: rank_info.data,
        updateTime: new Date().valueOf(),
      });
    });

    if (window.screen.width < 991) this.maxHeigh = 260;

    window.socket.on("rain_list", (rain_list) => {
      let { rainList, rainTop } = this.state;
      //新红包
      if (rain_list.length != 0 && rainList.length == 0) {
        rainTop = Common.randomNum(125, this.maxHeigh);
      }
      //id不一样
      if (
        rainList.length != 0 &&
        rain_list != 0 &&
        rainList[0]["id"] != rain_list[0]["id"]
      ) {
        rainTop = Common.randomNum(125, this.maxHeigh);
      }

      this.setState({
        rainList: rain_list,
        updateTime: new Date().valueOf(),
        rainTop,
      });
    });

    //增量聊天信息
    window.socket.on("chat_info", (chat_info) => {
      if (chat_info.code) {
        if (chat_info.code == "LV_IS_TOO_LOW") {
          $("#lvNot-modal").modal("show");
        }
        if (chat_info.code == "RAIN_LV_IS_TOO_LOW") {
          $("#rainLvNot-modal").modal("show");
        }
        return;
      }
      // let systemMsg = {
      //   addr: systemAddr,
      //   lv: 99,
      //   msg: "FayGmynUONAz19kt47flxhrdH+tK2cFHe76E7aD5rLiF5oEZEDlLKL2ac75QckptKFEiD9w5mcw=",
      //   name: "",
      //   ts: 0,
      //   type:"all"
      // }
      //
      // this.addChats.push(systemMsg)

      this.addChats.push(chat_info);
    });

    setInterval(() => {
      if (this.addChats.length == 0) return;
      this.showChatInfo(this.addChats.shift());
    }, 200);

    window.socket.on("login_info", (login_info) => {
      let {
        chat_dice_lan_zh,
        chat_dice_lan_en,
        chat_dice_lan_all,
        chat_dice_lan_ko,
        chat_dice_lan_ru,
        chat_dice_lan_fr,
        TOP_BET_RANK,
        RAIN_LIST,
      } = login_info;
      let { chats } = this.state;
      chats["chat_dice_lan_zh"] = chat_dice_lan_zh.reverse();
      chats["chat_dice_lan_en"] = chat_dice_lan_en.reverse();
      chats["chat_dice_lan_all"] = chat_dice_lan_all.reverse();
      chats["chat_dice_lan_ko"] = chat_dice_lan_ko.reverse();
      chats["chat_dice_lan_ru"] = chat_dice_lan_ru.reverse();
      chats["chat_dice_lan_fr"] = chat_dice_lan_fr.reverse();
      this.setState({
        chats,
        betRank: TOP_BET_RANK,
        updateTime: new Date().valueOf(),
        rainList: RAIN_LIST,
      });

      $("#chat-content").slimScroll({
        scrollTo: $("#chat-content")[0].scrollHeight,
      });
    });

    this.setChatHeight();

    $(window).resize(() => {
      this.setChatHeight();
    });

    $("#wx_icon").hover(
      () => {
        $("#wx_qrcode").css("display", "block");
      },
      () => {
        $("#wx_qrcode").hide();
      }
    );

    $("#guildchat").hover(
      () => {
        $("#wx_qrcode2").css("display", "block");
      },
      () => {
        $("#wx_qrcode2").hide();
      }
    );

    $("#face-panel").blur(() => {
      this.shouldShowFace = false;
      $("#face-panel").addClass("hide");
      let t = setTimeout(() => {
        clearTimeout(t);
        this.shouldShowFace = true;
      }, 200);
    });

    $("#face-panel-body").slimScroll({
      height: 300,
      color: "#fff",
    });
  }

  showChatInfo(chat_info) {
    let { chats } = this.state;
    let type = "chat_dice_lan_" + chat_info.type;
    chats[type].push(chat_info);
    if (chats[type].length > 200) chats[type].shift();

    let $chatDom = $("#chat-content")[0];

    if (
      chat_info.addr == window.myAddress ||
      $chatDom.clientHeight + $chatDom.scrollTop == $chatDom.scrollHeight
    ) {
      let t = setTimeout(() => {
        clearTimeout(t);
        $("#chat-content").slimScroll({
          scrollTo: $("#chat-content")[0].scrollHeight,
        });
      }, 300);
    }

    this.setState({ chats, updateTime: new Date().valueOf() });
  }

  setChatHeight() {
    let bodyH = $(window).height();
    let headerH = $("header")[0].clientHeight;
    // let headerH = $("header").height();
    let cmH = $("#chat-menu")[0].clientHeight;
    let ipH = $("#chatTextarea")[0].clientHeight;
    let crmH = $("#chatRankMenu").height();

    if (navigator.userAgent.match(/iPad|iPhone/i)) {
      bodyH = 600;
      $("#chatTextarea").addClass("chatTextarea_iphone");
      $("#chat").height(480);
    }

    $("#chat-content").height(bodyH - headerH - cmH - ipH - 20);

    $("#chat-rank-sc").height(bodyH - headerH - cmH - 50);

    $("#chat-content").slimScroll({
      height: bodyH - headerH - cmH - ipH - 20,
      color: "#fff",
    });
    $("#chat-rank-sc").slimScroll({
      height: bodyH - headerH - cmH - 50,
      color: "#fff",
    });

    $("#chat-content").slimScroll({
      scrollTo: $("#chat-content")[0].scrollHeight,
    });
  }

  sendMsg(msg) {
    Wallet.getSign((sign) => {
      $("#chatTextarea").val("");
      let addr = Wallet.getWalletAddress();
      let data = {
        sign,
        addr,
        msg: msg,
        type: this.getChatLang(),
      };
      window.socket.emit("chat", data);
    });
  }

  getLvType(lv) {
    let type = 1;
    if (lv >= 25 && lv < 50) type = 2;
    if (lv >= 50 && lv < 75) type = 3;
    if (lv >= 75 && lv < 99) type = 4;
    if (lv >= 99) type = 5;

    return type;
  }

  setChatLang(chatLang) {
    this.setState({ chatLang, showChatRoom: false });
    window.localStorage.chatLang = chatLang;
    let t = setTimeout(() => {
      clearTimeout(t);
      $("#chat-content").slimScroll({
        scrollTo: $("#chat-content")[0].scrollHeight,
      });
    }, 50);
  }

  getChatLang() {
    let { chatLang } = window.localStorage;
    if (chatLang == undefined) {
      chatLang = "all";
    }
    if (chatLang == "zh-CN") chatLang = "zh";
    return chatLang;
  }

  removeUrl(msg, lv) {
    if (lv >= 99) return msg;
    let matchArr = /[a-fA-F0-9]{64}$/.exec(msg);
    if (matchArr != null) {
      msg = msg.replace(matchArr[0], window.parseAddress(matchArr[0]));
    }

    return msg
      .replace("betdice.one", "****")
      .replace("www", "**")
      .replace(".one/", "***")
      .replace(".com", "***")
      .replace(".io", "***")
      .replace("ref=", "***")
      .replace("https", "***")
      .replace("http", "***")
      .replace("tronfomo.pro", "***")
      .replace("vegas", "***")
      .replace("Vegas", "***")
      .replace("?ref=", "***");
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

  isReceived(log) {
    let r = false;
    let myAddr = window.myAddress;
    log.map((item) => {
      if (item.receiver == myAddr) r = true;
    });
    return r;
  }

  getRainChat(chatItem) {
    //["receive",'receiveName',"sender","senderName","amount","result"]
    let chatArr = chatItem.msg.split(",");
    let senderName = chatArr[3] || window.parseAddress(chatArr[2]);
    let receiveName = chatArr[1] || window.parseAddress(chatArr[0]);
    let amount = chatArr[4];
    let isMe = chatArr[0] == window.myAddress;

    let msg = isMe
      ? intl
          .get("TronBetUI_0110")
          .replace("%0%", " " + senderName + " ")
          .replace("%1%", "<span class='online'>" + amount + "</span>")
      : intl
          .get("TronBetUI_0109")
          .replace("%0%", receiveName + " ")
          .replace("%1%", " " + senderName + " ")
          .replace("%2%", "<span class='online'>" + amount + "</span>");
    return (
      <span
        style={{ color: isMe ? "#307DAC" : "#bbb", fontSize: "12px" }}
        dangerouslySetInnerHTML={{ __html: "<span>" + msg + "</span>" }}
      ></span>
    );
  }

  getlogColor(mut) {
    let c = "#F1433A";
    if (mut >= 1.5 && mut < 2) c = "#85BB8C";
    if (mut >= 2 && mut < 100) c = "#01C083";
    if (mut >= 100 && mut < 500) c = "#106BA6";
    if (mut >= 500 && mut < 1000) c = "#8B008A";
    if (mut >= 1000 && mut < 9999) c = "#FAEC0C";
    return c;
  }

  handleChat(item) {
    // item.addr = "TFXshAocC6ctfTYDdvtb3iK6jGcYVtcBLF";
    // item.msg = "eveFLDLVFg7jbVDdS8Qm3Ag0LF59bKs/WmGURhTfmKTBRQMRZsoZUjUW8xffrm1RFM920zPJ7Cc=";
    // item.msg = "eveFLDLVFg7jbVDdS8Qm3Ag0LF59bKs/WmGURhTfmKTBRQMRZsoZUjUW8xffrm1RJR9TALEvLG4=";

    if (item.addr == systemAddr) {
      let msg = Common.decrypt(item.msg);
      if (msg.indexOf("[system]") == -1 && msg.indexOf("[system-tsl]") == -1)
        return <span></span>;

      //爆点消息
      if (msg.indexOf("[system]") != -1) {
        msg = msg.split("[system]")[1];
        let msgs = msg.split(",");
        return (
          <div className="chat-msg" style={{ fontSize: "12px" }}>
            <span
              className="glyphicon glyphicon-volume-up"
              style={{ fontSize: "16px", color: "#F2AB04" }}
            ></span>
            &nbsp;
            <span
              dangerouslySetInnerHTML={{
                __html:
                  "<span>" +
                  intl
                    .get("TronBetUI_1022")
                    .replace("%0%", window.parseAddress(msgs[0]))
                    .replace(
                      "%1%",
                      "<span style='color:" +
                        this.getlogColor(msgs[1]) +
                        "'>" +
                        msgs[1] +
                        "x</span>"
                    )
                    .replace(
                      "%2%",
                      "<span class='online'>" + msgs[2] + "TRX</span>"
                    ) +
                  "</span>",
              }}
            ></span>
          </div>
        );
      }

      //tsl 消息
      if (msg.indexOf("[system-tsl]") != -1) {
        msg = msg.split("[system-tsl]")[1];
        let msgs = msg.split(",");
        let msgCode = msgs[1] == 100 ? "TronBetUI_2251" : "TronBetUI_2252";
        return (
          <div className="chat-msg" style={{ fontSize: "12px" }}>
            <span
              className="glyphicon glyphicon-volume-up"
              style={{ fontSize: "16px", color: "#F2AB04" }}
            ></span>
            &nbsp;
            <span
              dangerouslySetInnerHTML={{
                __html:
                  "<span>" +
                  intl
                    .get(msgCode)
                    .replace("%0%", window.parseAddress(msgs[0])) +
                  "</span>",
              }}
            ></span>
          </div>
        );
      }

      return;
    }

    let name = item.name == "" ? item.addr : item.name;

    item.img = item.img == undefined ? 10000 : item.img;
    item.img =
      item.img == 10000
        ? 9999 + Math.floor(Common.getLevelStage(item.lv) / 10)
        : item.img;

    return (
      <div className="chat-msg">
        <img
          data-maxImg={item.img}
          src={Common.getUserAvatar(item.img)}
          onClick={this.setAt}
          data-name={Common.parseName(name)}
          style={{
            width: "30px",
            cursor: "pointer",
            position: "absolute",
            left: "10px",
            top: "4px",
          }}
        />
        <div style={{ position: "relative", marginLeft: "23px", padding: "0" }}>
          {/* <img style={{position:"absolute",zIndex:"-1",left:"0px",top:"2px"}} src={"./images/lv"+this.getLvType(item.lv)+".png"}/> */}
          {/* <span className={"lv " + "chat-lv"+this.getLvType(item.lv)} style={{marginLeft:"26px"}}>[LV {item.lv}]</span> */}
          <span
            className={"name " + "chat-lv" + this.getLvType(item.lv)}
            onClick={this.setAt}
            data-name={Common.parseName(name)}
          >
            [LV {item.lv}] {Common.parseName(name)}:
          </span>
          &nbsp;
          <p
            style={{
              wordWrap: "break-word",
              display: "inline-block",
              maxWidth: "100%",
            }}
          >
            {item.lv < 10
              ? this.getMsg(this.removeUrl(item.msg, item.lv))
              : this.removeUrl(item.msg, item.lv)}
          </p>
        </div>
      </div>
    );
  }

  setAt(e) {
    let name = $(e.target).data("name");
    let chatMsg = $("#chatTextarea").val();
    $("#chatTextarea").val(chatMsg + ` @${name} `);
  }

  chooseFace(e) {
    let face = $(e.target).data("faceval");
    let chatMsg = $("#chatTextarea").val();
    $("#chatTextarea").val(chatMsg + face);
  }

  getMsg(msg) {
    let matchArr = /[T][a-zA-Z0-9]{33}.*$/.exec(msg);
    if (matchArr != null) {
      msg = msg.replace(
        matchArr[0].substr(0, 33),
        window.parseAddress(matchArr[0].substr(0, 33))
      );
    }

    return msg;
  }

  render() {
    let {
      rainTop,
      updateTime,
      rainList,
      menuPos,
      showChatRoom,
      chats,
      betRank,
    } = this.state;
    let { dailyDjs, redPoint } = this.props;
    let pathName = this.props.routing.locationBeforeTransitions.pathname;

    let chatLang = this.getChatLang();
    // $('#chat').css("display", pathName == "/home" ? "none":"inline")
    if (!rainList) rainList = [];
    return (
      <section id="chat">
        {/* className={pathName=="/home" || pathName=="/"?"hide":""} */}

        <div id="chat-menu">
          <p
            className={menuPos == 0 ? "active" : ""}
            onClick={() => this.setState({ menuPos: 0 })}
          >
            <img src="./images/chat.png" />
            <div className="c-active">
              <img src="./images/chat_a.png" />
            </div>
          </p>
          <p
            className={menuPos == 1 ? "active" : ""}
            onClick={() => this.setState({ menuPos: 1 })}
          >
            <img src="./images/rank.png" />
            <div className="c-active">
              <img src="./images/rank_a.png" />
            </div>
          </p>
        </div>

        <div
          id="rain-list"
          className={menuPos == 0 && !showChatRoom ? "" : "hide"}
          style={{ top: rainTop }}
        >
          {rainList.map((item, key) => (
            <p key={key}>
              <img src="./images/lw_a.png" />
              <span className={item.senderName == "Admin" ? "chat-lv5" : ""}>
                {item.senderName == ""
                  ? window.parseAddress(item.sender)
                  : Common.strTo7(item.senderName)}
              </span>
              &nbsp;
              <span style={{ color: "#fff" }}>
                {intl.get("TronBetUI_0108").replace("%0%", "")}
              </span>
              <br />({item.left}/{item.count})
              {this.isReceived(item.logs) ? (
                <button className="disabled">
                  {intl.get("TronBetUI_0114")}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!Wallet.checkLogin()) return;
                    window.socket.emit("receive_rain", {
                      id: item.id,
                      addr: window.myAddress,
                    });
                  }}
                >
                  {intl.get("TronBetUI_0107")}
                </button>
              )}
            </p>
          ))}
        </div>

        <div
          id="changeRoom"
          className={menuPos == 0 ? "" : ""}
          onClick={() => this.setState({ showChatRoom: !showChatRoom })}
        >
          {showChatRoom ? (
            <span style={{ fontSize: "15px", fontWeight: "800" }}>✕</span>
          ) : (
            <span>{langToShowName[chatLang]}</span>
          )}
        </div>

        <div
          id="changeRoom"
          style={{ top: "70px", display: "none" }}
          className="backChat"
          onClick={() => {
            let $chat = $("#chat");
            $chat.css("left") == "0px"
              ? $chat.animate({ left: "-100%" })
              : $chat.animate({ left: "0px" });
          }}
        >
          <i className="fa fa-angle-left"></i>
        </div>

        <div id="shequ" className={menuPos == 0 ? "" : "hide"}>
          <p>
            <a
              className="shequIcon"
              href="https://t.me/WINk_org_official"
              target="_blank"
            >
              <i
                className="iconfont icon-telegram"
                style={{ fontSize: "20px" }}
              ></i>
            </a>
          </p>
          <p>
            <a
              className="shequIcon"
              href="https://twitter.com/WINkorg"
              target="_blank"
            >
              <i
                className="iconfont icon-twitter"
                style={{ fontSize: "20px" }}
              ></i>
            </a>
          </p>
          <p id="wx_icon">
            <span className="shequIcon" target="_blank">
              <i
                className="iconfont icon-weixin1"
                style={{ fontSize: "20px" }}
              ></i>
            </span>
            <img id="wx_qrcode" src="./images/wx_qrcode.jpg" width="200" />
          </p>
        </div>

        <div id="hd" className={menuPos == 0 ? "" : ""}>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSd8QiSucsHjg67vJAn_5x9_Avt72DnPgCNEsk0nFTwbZ-gzZg/viewform?usp=sf_link"
            target="_blank"
          >
            <p className="hdIcon">
              <img src="./images/service2.png" />
            </p>
          </a>
          <p className="hdIcon">
            <img
              src="./images/notice.png"
              title={intl.get("TronBetUI_0136")}
              onClick={() => $("#info-modal").modal("show")}
            />
          </p>
          <p className="hdIcon hide">
            <img
              src="./images/lw.png"
              title={intl.get("TronBetUI_0083")}
              onClick={() => {
                $("#makeRain-modal").modal("show");
              }}
            />
          </p>
          <p className="hdIcon hide">
            <img
              src="./images/sdj/starRank.png"
              title={intl.get("TronBetUI_2227")}
              onClick={() => $("#sdjActivity-modal").modal("show")}
            />
          </p>
          <p className="hdIcon hide">
            <img
              src="./images/activity.png"
              title={intl.get("TronBetUI_0091")}
              onClick={() => $("#activity-modal").modal("show")}
            />
          </p>
          <p className="hdIcon" style={{ position: "relative" }}>
            <img
              src="./images/mission.png"
              title={intl.get("TronBetUI_0148")}
              onClick={() => {
                $("#mission-modal").modal("show");
                window.socket.emit("get_tasks", {
                  addr: Wallet.getWalletAddress() || "",
                });
              }}
            />
            <div
              className={redPoint ? "" : "hide"}
              style={{
                height: "8px",
                width: "8px",
                background: "red",
                borderRadius: "50%",
                position: "absolute",
                top: "3px",
                right: "2px",
              }}
            ></div>
          </p>
          <p className="hdIcon hide">
            <img
              src="./images/tsl/tslRankIco.png"
              title={intl.get("TronBetUI_0091")}
              onClick={() => $("#sdjActivity-modal").modal("show")}
            />
          </p>
          <p className="hdIcon por" id="daily-rank">
            <img
              src="./images/daily.png"
              title={intl.get("TronBetUI_0147")}
              onClick={() => $("#daily-modal").modal("show")}
            />
            <span
              style={{
                fontSize: "12px",
                position: "absolute",
                bottom: "0px",
                lineHeight: "12px",
                left: "0px",
              }}
            >
              {dailyDjs}
            </span>
          </p>
        </div>

        <section id="chat-chat" className={menuPos == 0 ? "" : "hide"}>
          <div id="chat-content">
            {chats["chat_dice_lan_" + chatLang].map((item, key) => (
              <div key={key} className="ovh chat-item">
                {item.msgType == "rain_log" ? (
                  <div className="rain-msg">
                    <img src="./images/lw_a.png" />
                    {this.getRainChat(item)}
                  </div>
                ) : (
                  this.handleChat(item)
                )}
              </div>
            ))}
          </div>
          <div id="chat-send">
            <textarea
              id="chatTextarea"
              onChange={(e) => {
                let text = e.target.value;

                if (text.indexOf("\n") != -1) {
                  if (text.trimPlus() == "") {
                    e.target.value = text.trimPlus();
                    return;
                  }
                  if (!window.myAddress) {
                    $("#loginTron-modal").modal("show");
                    e.target.value = text.trimPlus();
                    return;
                  }
                  e.target.value = text.trimPlus();
                  this.sendMsg(text.trimPlus());
                } else {
                  if (text.length > 150) {
                    text = text.substring(0, 150);
                    e.target.value = text;
                  }
                }
              }}
              placeholder={intl.get("TronBetUI_0053")}
            ></textarea>

            <div id="face-panel" className="hide" tabIndex="3">
              <div id="face-panel-body">
                {faceArr.map((item, key) => (
                  <span key={key} data-faceVal={item} onClick={this.chooseFace}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <i
              className="fa fa-meh-o"
              id="select-face"
              onClick={() => {
                if (!this.shouldShowFace) {
                  this.shouldShowFace = true;
                  return;
                }
                let $facePanel = $("#face-panel");

                if ($facePanel.hasClass("hide")) {
                  $facePanel.removeClass("hide").focus();
                }
              }}
            ></i>
          </div>

          <div id="chat-room" className={showChatRoom ? "" : "hide"}>
            <div>
              <div style={{ fontSize: "20px" }}>ROOM</div>
              <p
                style={{ marginTop: "20px" }}
                onClick={() => this.setChatLang("all")}
              >
                <img
                  src="./images/allCountry.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;ALL
                <span className={chatLang == "all" ? "for" : "hide"}>
                  <i className="online fa fa-check"></i>
                </span>
              </p>
              <p onClick={() => this.setChatLang("en")}>
                <img
                  src="./images/country1.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;English (EN)
                <span className={chatLang == "en" ? "for" : "hide"}>
                  <i className="online fa fa-check"></i>
                </span>
              </p>
              <p onClick={() => this.setChatLang("zh-CN")}>
                <img
                  src="./images/country.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;中文 (CN)
                <span className={chatLang == "zh" ? "for" : "hide"}>
                  <i className="online fa fa-check"></i>
                </span>
              </p>
              <p onClick={() => this.setChatLang("ko")}>
                <img
                  src="./images/country2.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;한국의 (KR)
                <span className={chatLang == "ko" ? "for" : "hide"}>
                  <i className="online fa fa-check"></i>
                </span>
              </p>
              <p onClick={() => this.setChatLang("ru")}>
                <img
                  src="./images/country4.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;Pусский (RU)
                <span className={chatLang == "ru" ? "for" : "hide"}>
                  <i className="online fa fa-check"></i>
                </span>
              </p>
              <p onClick={() => this.setChatLang("fr")}>
                <img
                  src="./images/country5.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;Français (FR)
                <span className={chatLang == "fr" ? "for" : "hide"}>
                  <i className="online fa fa-check"></i>
                </span>
              </p>

              <div
                style={{
                  fontSize: "20px",
                  marginTop: "50px",
                  color: "#ffdc00",
                }}
              >
                VIP ROOM
              </div>
              <p style={{ marginTop: "20px" }}>
                <img
                  src="./images/vipRoom1.png"
                  width="40"
                  height="25"
                  className="vm"
                />
                &nbsp;&nbsp;{intl.get("TronBetUI_0063")}
                <span className="for">{intl.get("TronBetUI_0055")}</span>
              </p>
            </div>
          </div>
        </section>

        <section id="chat-rank" className={menuPos == 1 ? "" : "hide"}>
          <div id="chatRankMenu">
            <table>
              <tr>
                <th style={{ width: "60px" }}></th>
                <th style={{ textAlign: "center" }}>
                  {intl.get("TronBetUI_0025")}
                </th>
                <th style={{ textAlign: "right", paddingRight: "30px" }}>
                  {intl.get("TronBetUI_0030")}
                </th>
              </tr>
            </table>
          </div>

          <div id="chat-rank-sc">
            <table>
              {betRank.map((item, key) => (
                <tr key={key} style={{ fontSize: key > 2 ? 12 : 14 }}>
                  <td style={{ width: "50px" }}>
                    <div className="rank-head">
                      <div className="rank-sort">
                        {key > 2 ? (
                          <span>{key + 1}</span>
                        ) : (
                          <img
                            src={"./images/rank" + (key + 1) + ".png"}
                            width="30"
                          />
                        )}
                      </div>
                      <img
                        data-maxImg={item.img}
                        style={{ width: key > 2 ? 30 : 40 }}
                        src={Common.getUserAvatar(item.img)}
                      />
                    </div>
                  </td>
                  <td
                    className={"chat-lv" + this.getLvType(item.lv)}
                    style={{ textAlign: "left" }}
                  >
                    <span style={{ fontSize: "14px" }}>
                      lv. {item.lv}&nbsp;&nbsp;
                    </span>
                    {item.name == ""
                      ? window.parseAddress(item.addr)
                      : Common.strTo7(item.name)}
                  </td>
                  <td
                    className="online"
                    style={{ textAlign: "right", paddingRight: "10px" }}
                  >
                    {item.val} TRX
                  </td>
                </tr>
              ))}
            </table>
          </div>
        </section>

        <div
          className="modal fade"
          id="lvNot-modal"
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog " role="document">
            <div
              className="modal-content"
              style={{ marginTop: "150px", background: "#181818" }}
            >
              <div className="modal-header">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: "16px" }} className="tac">
                  {intl.getHTML("TronBetUI_0044")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="modal fade"
          id="rainLvNot-modal"
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog " role="document">
            <div
              className="modal-content"
              style={{ marginTop: "150px", background: "#181818" }}
            >
              <div className="modal-header">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ fontSize: "16px" }} className="tac">
                  {intl.getHTML("TronBetUI_0115")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
}

export default connect((state) => ({
  dailyDjs: state.common.dailyDjs,
  routing: state.routing,
  redPoint: state.common.redPoint,
}))(App);
