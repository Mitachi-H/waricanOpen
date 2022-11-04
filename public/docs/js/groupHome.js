import { showMember, checkalertEvent } from "./showGroup.js";

$("#member-button").on("click", function () {
  $("#member-input-wrapper").slideToggle(120);
  $("#bt-l-01, #bt-l-02").toggleClass("active");
});

$(".sex-button").on("click", function () {
  $(".sex-button").toggleClass("male");
  $(".sex-button").toggleClass("female");
  $($(".sex-button").children()).toggleClass("fa-mars");
  $($(".sex-button").children()).toggleClass("fa-venus");
});

function load() {
  groupTitleLoad();
  /*
  memberLoad();
  eventLoad();
  */
}
function groupTitleLoad() {
  const groupTitleLoader = document.querySelector(
    "#group-title-loader-wrapper"
  );
  groupTitleLoader.classList.toggle("active");
}
function memberLoad() {
  const loaderWrapper = document.querySelector("#member-loader-wrapper");
  loaderWrapper.classList.toggle("active");
}
/* 追加しても良い
function eventLoad() {
  //イベントのロード
  const eventsWrapper = document.querySelector("#events-loader-wrapper");
  eventsWrapper.classList.toggle("active");
}
*/

//groupName編集
const modal = document.querySelector(".modal");

$(".group-header-edit").on("click", function () {
  const height = window.innerHeight;
  modal.style.height = height;
  modal.classList.toggle("modal-on");

  const groupInput = document.getElementById("modal-input-group-name");
  let { groupname } = JSON.parse(sessionStorage.getItem("group"));
  groupInput.value = groupname;
});

$("#modal-cancel-bt").on("click", function () {
  modal.classList.toggle("modal-on");
});

$("#modal-edit-bt").on("click", () => {
  const groupInput = document.getElementById("modal-input-group-name");
  if (groupInput.value) {
    onEditGroup();
    modal.classList.toggle("modal-on");
    if ($(".modal-alert").hasClass("modal-alert-on")) {
      $(".modal-alert").removeClass("modal-alert-on");
    }
  } else {
    if (!$(".modal-alert").hasClass("modal-alert-on")) {
      $(".modal-alert").addClass("modal-alert-on");
    }
  }
});

//groupNameの編集
function onEditGroup() {
  //まずheaderを空にする
  const groupHeaderTitle = document.querySelector("#groupHeaderTitle");
  groupHeaderTitle.textContent = "";

  //grouptypeを取得しておく
  let { grouptype, _ } = JSON.parse(sessionStorage.getItem("group"));

  const groupInput = document.getElementById("modal-input-group-name");
  const groupname = groupInput.value;
  const obj = {
    method: "editGroup",
    arguments: { groupname: groupname, grouptype: grouptype },
  };
  //showGroupし、sessionストレージにデータを追加
  postServer(obj, (obj) => {
    //groupnameをheaderに適用
    groupHeaderTitle.textContent = obj.groupname;
    sessionStorage.setItem(
      "group",
      JSON.stringify({
        ...JSON.parse(sessionStorage.getItem("group")),
        groupname: obj.groupname,
      })
    );
  });
  groupInput.value = "";
}

//member追加したときの動作
$("#member-add").on("click", function () {
  const memberNameInput = document.querySelector("#member-name-input");
  const memberSex = document
    .querySelector("#sex-button")
    .className.split(" ")[1];

  if (memberNameInput.value) {
    const obj = {
      method: "addMember",
      arguments: {
        name: memberNameInput.value,
        membertype: memberSex,
      },
    };
    //showMemberし、sessionストレージにデータ追加
    postServer(obj, (obj) => {
      showMember(obj);
      sessionStorage.setItem(
        "member",
        JSON.stringify([...JSON.parse(sessionStorage.getItem("member")), obj])
      );
    });
  }
  //更新終わった後にinputを空にする
  memberNameInput.value = "";
});

$(".add-event").on("click", () => {
  sessionStorage.setItem("editEvent", "");
});

//メンバーの削除
$("body").on("click", ".member-delete", function () {
  //クリックしたitemのidを取得
  const id = $($(this).parent()).attr("id");
  //itemはmember-idという形なので、id番号だけ取得
  const memberid = id.split("-")[1];
  //クリックしたitemのhtmlも削除
  const obj = {
    method: "deleteMember",
    arguments: {
      memberid: memberid,
    },
  };
  postServer(obj, (obj) => {
    sessionStorage.setItem(
      "member",
      JSON.stringify(
        JSON.parse(sessionStorage.getItem("member")).filter(
          ({ memberid }) => memberid != obj.memberid
        )
      )
      //削除したメンバーのいるイベントはアラートする。
    );
    checkalertEvent();
  });
  $($(this).parent()).remove(); //サーバー側に問題発生したら大丈夫？？
});

//payment変更時の処理（databaseとsessionに反映)
$("#payment").on("change", function () {
  let { grouptype, groupname } = JSON.parse(sessionStorage.getItem("group"));
  grouptype.balance = $(this)[0].value;
  const obj = {
    method: "editGroup",
    arguments: {
      groupname: groupname,
      grouptype: grouptype,
    },
  };
  postServer(obj, () => {
    sessionStorage.setItem(
      "group",
      JSON.stringify({
        ...JSON.parse(sessionStorage.getItem("group")),
        grouptype: obj.arguments.grouptype,
      })
    );
    window.dispatchEvent(new Event("calculate"));
  });
});

//全てのロードが終わった時にイベントを追加
window.addEventListener("allLoaded", function () {
  //touchevent（指）が利用可能かの判別
  const support_touch = "ontouchend" in document;
  //イベント名
  const eventNameTouchStart = support_touch ? "touchstart" : "mousedown";
  const eventNameTouchMove = support_touch ? "touchmove" : "mousemove";
  const eventNameTouchEnd = support_touch ? "touchend" : "mouseup";
  const ev_items = document.querySelectorAll(".event-item");
  const delete_buttons = document.querySelectorAll("#ev-delete-bt");

  for (let i = 0; i < ev_items.length; i++) {
    const ev_item = ev_items[i];
    const delete_button = delete_buttons[i];
    ev_item.addEventListener(eventNameTouchMove, logSwipe);
    ev_item.addEventListener(eventNameTouchStart, logSwipeStart);
    ev_item.addEventListener(eventNameTouchEnd, logSwipeEnd);

    let startX;
    let endX;
    //スワイプ中
    function logSwipe(e) {
      endX = support_touch ? e.touches[0].pageX : e.pageX;
      let change = (endX - startX) * 4;
      if (endX - startX < 0 && endX - startX > -20) {
        ev_item.style.cssText = `-webkit-transform: translateX(${change}px); transform: translateX(${change}px);`;
        delete_button.style.cssText = `right: 0px; width: ${Math.abs(
          change
        )}px;`;
      }
    }

    //スワイプ始め
    function logSwipeStart(e) {
      //タッチしたときに戻るようにする
      ev_item.style.cssText = `-webkit-transform: translateX(0
      px); transform: translateX(0px);`;
      delete_button.style.cssText = `right: -10px; width: 0;`;
      startX = support_touch ? e.touches[0].pageX : e.pageX;
      //スワイプしなかったときにも対応するため
      endX = startX;
    }

    //スワイプ終わり
    function logSwipeEnd(e) {
      //イベントに対するdefaultの動きを解除する
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }
  addClickEventtoDelete();
  addClickEventtoEdit();
});

function addClickEventtoDelete() {
  $(".event-delete-button-wrapper").on("click", function (event) {
    const targetEvent = $(this)[0].parentElement;
    const eventid = targetEvent.id.split("-")[1];
    if (confirm("本当に削除しますか")) {
      const obj = {
        method: "deleteEvent",
        arguments: {
          eventid: eventid,
        },
      };
      postServer(obj, removeEvent);
      function removeEvent() {
        targetEvent.remove();
        sessionStorage.setItem(
          "event",
          JSON.stringify(
            JSON.parse(sessionStorage.getItem("event")).filter(
              ({ eventid }) => eventid != obj.arguments.eventid
            )
          )
        );
        window.dispatchEvent(new Event("calculate"));
      }
    }
  });
}

function addClickEventtoEdit() {
  $(".event-edit").on("click", (event) => {
    const eventid =
      event.target.parentElement.parentElement.parentElement.id.split("-")[1];
    //sessionストレージに今やるのはeditだよってしめす
    sessionStorage.setItem("editEvent", eventid);
    location.href = location.href + "/addEvent";
  });
}

function postServer(obj, callback) {
  //ロード開始
  if (obj.method.includes("Member")) {
    memberLoad();
  } else if (obj.method === "editGroup") {
    groupTitleLoad();
  }
  fetch(location.pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  })
    .then((res) => {
      res.json().then((x) => {
        console.log(obj);
        console.log(x);
        //ロード終了
        if (obj.method.includes("Member")) {
          memberLoad();
        } else if (obj.method === "editGroup") {
          groupTitleLoad();
        }
        //addMember deleteMember の場合
        const memberObj = { memberid: x[0].memberid, ...obj.arguments }; //add=>alldata,delete=>memberid
        callback(memberObj);
      });
    })
    .catch((err) => {
      console.log("通信に失敗", err);
    });
}

export { load };

//ラインにリンクを共有
$(".share-button").on("click", function () {
  window.open(
    "https://social-plugins.line.me/lineit/share?url=" + location.href,
    "_blank"
  );
});
