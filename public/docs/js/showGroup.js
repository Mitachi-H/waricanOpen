import { load } from "./groupHome.js";

//fetchして情報を受け取る(result)。=>描画+ローカルストレージに保存
const obj = {
  method: "showGroup",
};
window.onload = onload();

function onload() {
  //loader開始
  load();
  //データ通信
  fetch(location.pathname + "/showGroup").then((result) => {
    if (result.status === 200) {
      result.json().then(({ group, member, event }) => {
        //sessionStorageに保存
        sessionStorage.setItem("group", JSON.stringify(group));
        sessionStorage.setItem("member", JSON.stringify(member));
        sessionStorage.setItem("event", JSON.stringify(event));

        //showMember showEvent showGroup
        member.forEach((memberObj) => {
          showMember(memberObj);
        });
        event.forEach((eventObj) => {
          showEvent(eventObj);
        });
        showGroup(group);

        checkalertEvent();

        //loader終了
        load();

        window.dispatchEvent(new Event("allLoaded"));
        document.querySelector(".event-item-wrapper").remove();
      });
    } else {
      //エラーハンドリング
      console.log(result.status);
    }
  });
}

//memberを表示
function showMember({ memberid, name, membertype }) {
  //list内の各名前ごとにitemを作成
  //forEachだからmemberにはmemberListの中の一つの配列が入っているのだ！
  var div_element = document.createElement("div");
  div_element.className = `member-item ${membertype || "male"}`.trim();
  div_element.id = `member-${memberid}`;

  var p_element = document.createElement("p");
  p_element.className = "member-name";
  p_element.textContent = name;

  var delete_element = document.createElement("div");
  delete_element.className = "member-delete";
  var i_element = document.createElement("i");
  i_element.className = "fa-solid fa-xmark";
  delete_element.appendChild(i_element);

  div_element.appendChild(p_element);
  div_element.appendChild(delete_element);

  //wrapperにitemをぶち込む
  const member_wrapper = document.querySelector(".member-item-wrapper");
  member_wrapper.appendChild(div_element);
}

function showGroup({ groupname, grouptype }) {
  const groupHeaderTitle = document.querySelector("#groupHeaderTitle");
  groupHeaderTitle.textContent = groupname;

  const paymentSelect = document.getElementById("payment");
  for (const option of paymentSelect.options) {
    option.selected = grouptype.balance == option.value;
  }
}

function showEvent({ eventid, name, payerlist }) {
  const eventsWrapper = document.querySelector(".events-wrapper");
  const eventItemWrapper = document.querySelector(".event-item-wrapper");
  const eventItemWrapperClone = eventItemWrapper.cloneNode(true);
  eventItemWrapperClone.id = "event-" + eventid;
  eventItemWrapperClone.hidden = false;
  eventItemWrapperClone.querySelector(".main-title").textContent =
    name || "イベント" + eventid;
  const subTitle =
    payerlist.reduce((total, { name }) => {
      return total + " " + name;
    }, "") + "が立て替え";
  eventItemWrapperClone.querySelector(".sub-title").textContent = subTitle;
  eventItemWrapperClone.querySelector(
    ".event-cost"
  ).firstElementChild.textContent =
    Number(payerlist.reduce((total, { cost }) => total + Number(cost), 0)) +
    "円";
  eventsWrapper.append(eventItemWrapperClone);
}
function checkalertEvent() {
  //全てのイベントのpayerlist,receiverlistに削除されたメンバーがいないか確認
  const memberidList = JSON.parse(sessionStorage.getItem("member")).map(
    ({ memberid }) => memberid
  );
  const eventList = JSON.parse(sessionStorage.getItem("event"));
  eventList.forEach(({ eventid, payerlist, receiverlist }) => {
    if (
      receiverlist.find((memberid) => !memberidList.includes(memberid)) ||
      payerlist.find(({ memberid }) => !memberidList.includes(Number(memberid)))
    ) {
      const str = "#event-" + eventid;
      const item = document.querySelector(str);
      if (!item.classList.contains("alert")) {
        item.classList.toggle("alert");
        //メッセージ表示
        item.querySelector(".alert-message").hidden = false;
      }
    }
  });
}

//showMemeberをgroupHomeで使えるようにexport
export { showMember, checkalertEvent };
