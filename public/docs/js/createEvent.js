const one = document.getElementById("one");
const several = document.getElementById("several");
const oneContent = document.getElementById("one-content");
const severalContent = document.getElementById("several-content");

const addEventButtons = document.querySelectorAll(".add-event-button");

let memberidList;
importMember();
importEvent();

function importMember() {
  //sessionストレージに入っているデータが正しいなら=>正しくないならダウンロード
  const memberList = JSON.parse(sessionStorage.getItem("member"));
  memberidList = memberList.map(({ memberid }) => memberid);

  const OnepayerList = document.getElementById("payer-select");
  const OnePayerItem = OnepayerList.querySelector(".payer-1"); //

  const severalPayerContainer = document.querySelector(
    ".payer-checkbox-container"
  );
  const severalPayerItem = severalPayerContainer.querySelector(
    ".payer-checkbox-item"
  );

  const receiverCheckboxContainers = document.querySelectorAll(
    ".receiver-checkbox-container"
  );
  const receiverCheckboxItem = receiverCheckboxContainers[0].querySelector(
    ".receiver-checkbox-item"
  );

  memberList.forEach(({ memberid, name }) => {
    //one payer追加
    const OnePayerClone = OnePayerItem.cloneNode(true);
    OnePayerClone.value = "payer-" + memberid;
    OnePayerClone.id = "payer-" + memberid;
    OnePayerClone.textContent = name;
    OnepayerList.append(OnePayerClone);

    //one several receiver追加
    const receiverCheckboxItemClone = receiverCheckboxItem.cloneNode(true);
    receiverCheckboxItemClone.querySelector(".checkbox-area").id =
      "receiver-" + memberid;
    receiverCheckboxItemClone.querySelector(".receiver-name").textContent =
      name;
    const receiverCheckboxItemClone2 =
      receiverCheckboxItemClone.cloneNode(true);
    receiverCheckboxContainers[0].append(receiverCheckboxItemClone);
    receiverCheckboxContainers[1].append(receiverCheckboxItemClone2);

    //several payer追加
    const severalPayerItemClone = severalPayerItem.cloneNode(true);
    severalPayerItemClone.querySelector(".checkbox-area").id =
      "payer-" + memberid;
    severalPayerItemClone.querySelector(".payer-name").textContent = name;
    severalPayerContainer.append(severalPayerItemClone);
  });
  OnePayerItem.remove();
  receiverCheckboxItem.remove();
  severalPayerItem.remove();
}

function importEvent() {
  const editeventid = sessionStorage.getItem("editEvent");
  try {
    //編集するイベントのデータを取得
    const { name, payerlist, receiverlist } = JSON.parse(
      sessionStorage.getItem("event")
    ).find(({ eventid }) => eventid == editeventid);
    //nameを代入
    for (const input of document.querySelectorAll(".event-name-input")) {
      input.value = name || "イベント" + editeventid;
    }
    //payerを代入
    if (payerlist.length == 1) {
      //oneのページを表示
      showOneorSeveral("one");
      //one payerに代入
      selectOnePayer(payerlist[0].memberid);
      //one costに代入
      document.querySelector(".cost-input").value = payerlist[0].cost;
    } else {
      //severalのページを表示
      showOneorSeveral("several");
      //several payerとcostを代入
      payerlist.forEach(({ cost, memberid, name }) => {
        selectSeveralPayer(memberid);
        addSeveralPayerCostItem({
          memberid: memberid,
          name: name,
          cost: cost,
        });
      });
    }
    //receiverを代入
    receiverlist.forEach((memberid) => {
      selectReciever(Number(payerlist.length != 1), memberid);
    });
    //最後に追加ボタンを更新ボタンに変更
    for (const button of addEventButtons) {
      button.firstElementChild.textContent = "更新";
    }
  } catch (err) {
    console.log(err);
  }
}

/*.change()によって、checkedの変更が反映されてからjQUeryでいじっている
on("click")だと、checkedが変更される前のclickされた段階になってしまうので
checkedの変更が反映されず、一個前のcheckedを使用してしまう。*/
//タブ切り替え
$("#one, #several").change(function () {
  if (one.checked && !oneContent.classList.contains("show")) {
    //severalのpayerとcost(1番目）を　oneのpayerとcostにいれる
    try {
      const { memberid, cost } = JSON.parse(checkSeveralPayer()[0]);
      removeAllActive("one");
      //payerを同じにする
      selectOnePayer(memberid);
      //receriverを同じにする
      checkReceiver(1).forEach((memberid) => {
        selectReciever(0, memberid);
      });
      //costを同じにする
      document.querySelector(".cost-input").value = cost;
    } catch (err) {
      console.log(err);
    }
    showOneorSeveral("one");
  } else if (several.checked && !severalContent.classList.contains("show")) {
    //oneのpayerとcostを　severalのpayerとcostにいれる
    try {
      removeAllActive("several"); //初期化
      const memberObj = checkOnePayer();
      //payerを同じにする
      selectSeveralPayer(memberObj.memberid);
      //receiverを同じにする
      checkReceiver(0).forEach((memberid) => {
        selectReciever(1, memberid);
      });
      //costを同じにする
      document.querySelector(".cost-per-payer-wrapper").innerHTML = ""; //初期化
      addSeveralPayerCostItem(memberObj);
    } catch (err) {
      console.log(err);
    }
    showOneorSeveral("several");
  } else {
    return console.error("tab error");
  }
});

$("#select-all-01").on("click", function () {
  if (checkifReceiverisFull(0)) {
    removeReceiverActive(0);
  } else {
    memberidList.forEach((memberid) => {
      selectReciever(0, memberid);
    });
  }
  //trueに変えたら
});

$("#select-all-several").on("click", function () {
  if (checkifReceiverisFull(1)) {
    removeReceiverActive(1);
  } else {
    memberidList.forEach((memberid) => {
      selectReciever(1, memberid);
    });
  }
});
/*checkbox-area にactiveクラスをつけることでチェックを発動。*/
$(".checkbox-area").on("click", function () {
  $(this).toggleClass("active");
  //もしreceiverが全員じゃなくなったら全員選択からactiveをはずす
  if (
    $(this)[0].id.includes("receiver") &&
    ($("#select-all-01")[0].classList.contains("active") ||
      $("#select-all-several")[0].classList.contains("active"))
  ) {
    $("#select-all-01")[0].classList.remove("active");
    $("#select-all-several")[0].classList.remove("active");
  }
  //もしreceiverが全員になったら全員選択にactiveをつける
  if (checkifReceiverisFull(0)) {
    $("#select-all-01")[0].classList.add("active");
  } else if (checkifReceiverisFull(1)) {
    $("#select-all-several")[0].classList.add("active");
  }
});

$("#select-all-01").change(function () {
  if ($(this).classList.contains("active")) {
    memberidList.forEach((memberid) => {
      selectReciever(0, memberid);
    });
  } else {
    removeAllActive("one");
  }
});

$("#select-all-several").on("click", function () {
  if ($(this).classList.contains("active")) {
    memberidList.forEach((memberid) => {
      selectReciever(1, memberid);
    });
  } else {
    removeAllActive("several");
  }
});

/*
checkbox用のfunction
*/
function removeAllActive(str) {
  const receiverCheckboxContainers = document.querySelectorAll(
    ".receiver-checkbox-container"
  );
  if (str == "one") {
    for (const item of receiverCheckboxContainers[0].children) {
      item.firstElementChild.classList.remove("active");
    } //receiver
  } else if (str == "several") {
    for (const item of document
      .querySelector(".payer-checkbox-container")
      .querySelectorAll(".checkbox-area")) {
      item.classList.remove("active");
    } //payer
    for (const item of receiverCheckboxContainers[1].children) {
      item.firstElementChild.classList.remove("active");
    } //receiver
  }
}

//recieverに全員activeが付いているかどうか判別
function checkifReceiverisFull(num) {
  const activeReceiverCheckboxes = document
    .querySelectorAll(".receiver-checkbox-container")
    [num].querySelectorAll(".active");
  const memberList = JSON.parse(sessionStorage.getItem("member"));
  if (activeReceiverCheckboxes.length === memberList.length) {
    return true;
  } else {
    return false;
  }
}

function selectReciever(num, memberid) {
  //指定した方のreceiverにチェック付け
  const receiverCheckboxContainer = document.querySelectorAll(
    ".receiver-checkbox-container"
  )[num]; //oneなら0,severalなら1
  for (const item of receiverCheckboxContainer.children) {
    if (
      "receiver-" + memberid == item.firstElementChild.id &&
      !item.firstElementChild.classList.contains("active")
    ) {
      item.firstElementChild.classList.toggle("active");
    }
  }
}

//payerのfunction
$(".payer-several").on("click", function () {
  const costPerPayerWrapper = document.querySelector(".cost-per-payer-wrapper");
  const memberid = $(this)[0].id; //payer-memberidの形
  if ($(this)[0].classList.contains("active")) {
    const name = $(this)[0].querySelector(".payer-name").textContent;
    addSeveralPayerCostItem({ memberid: memberid.split("-")[1], name: name });
  } else {
    //下のやつから要素を削除
    const target = costPerPayerWrapper.querySelector("#" + memberid);
    target.remove();
  }
});

function selectOnePayer(memberid) {
  //one payerにチェック付け
  const onePayerList = document.getElementById("payer-select");
  for (const option of onePayerList.options) {
    option.selected = "payer-" + memberid == option.value;
  }
}

function selectSeveralPayer(memberid) {
  //several payerにチェック付け
  const severalPayerContainer = document.querySelector(
    ".payer-checkbox-container"
  );
  for (const item of severalPayerContainer.children) {
    if ("payer-" + memberid == item.firstElementChild.id) {
      item.firstElementChild.classList.add("active");
    }
  }
}

for (const button of addEventButtons) {
  button.addEventListener("click", addoreditEvent);
}

function addoreditEvent(event) {
  const receiverCheckboxContainers = document.querySelectorAll(
    ".receiver-checkbox-container"
  );
  const isSeveral = Number(event.target.dataset.isseveral); //0 or 1
  try {
    //payerlist作成
    let payerlist = [];
    if (isSeveral) {
      //several payer
      payerlist = checkSeveralPayer();
      if (!payerlist.length) {
        throw new Error("支払い者は一人以上必要です");
      }
      payerlist.forEach(({ cost }) => {
        if (cost ? cost >= 0 : false) {
          throw new Error("支払い金額に誤りがあります");
        }
      });
    } else {
      //one payer
      const payerObj = checkOnePayer();
      if (!payerObj.memberid) {
        throw new Error("支払い者を選択してください");
      } else if (!payerObj.cost || payerObj.cost <= 0) {
        throw new Error("支払い金額に誤りがあります");
      }
      payerlist.push(payerObj);
    }
    //receiverlist作成
    let receiverlist = checkReceiver(isSeveral);
    if (!receiverlist.length) {
      throw new Error("受け取り者は一人以上必要です");
    }

    //name作成
    const eventNameInput =
      document.querySelectorAll(".event-name-input")[isSeveral];
    let name = eventNameInput.value;

    const eventid = sessionStorage.getItem("editEvent");
    const postObj = {
      method: eventid ? "editEvent" : "addEvent",
      arguments: {
        eventid: eventid,
        name: name,
        payerlist: payerlist,
        receiverlist: receiverlist,
      },
    };
    event.target.parentElement.removeEventListener("click", addoreditEvent);

    postServer(postObj, () => {
      location.href = location.href.slice(0, -9); //横暴？？
    });
  } catch (err) {
    window.alert(err);
  }
}

function addSeveralPayerCostItem({ memberid, name, cost }) {
  const costPerPayerWrapper = document.querySelector(".cost-per-payer-wrapper");
  //costPerPayerWrapperに追加
  var div_element = document.createElement("div");
  div_element.className = "cost-per-payer-item";
  div_element.id = "payer-" + memberid;

  var p_01_element = document.createElement("p");
  p_01_element.className = "large-text text-01";

  var p_02_element = document.createElement("p");
  p_02_element.className = "large-text";
  p_02_element.textContent = "は";

  var input_element = document.createElement("input");
  input_element.value = cost || "";
  input_element.type = "number";
  input_element.className = "cost-input";

  var p_03_element = document.createElement("pmemberid");
  p_03_element.className = "large-text text-02";
  p_03_element.textContent = "支払った";

  div_element.appendChild(p_02_element);
  div_element.appendChild(input_element);
  div_element.appendChild(p_03_element);
  //console.log(index, e);
  //activeなところの名前を取得、,p_01を先頭に追加
  p_01_element.textContent = name;
  div_element.prepend(p_01_element);
  costPerPayerWrapper.appendChild(div_element);
}

function checkOnePayer() {
  const select = document.querySelector("#payer-select"); //ちょっと横暴
  const memberid = select.value.split("-")[1];
  const costInput = document.querySelector(".cost-input");
  const cost = costInput.value;
  const name = select.querySelector("#" + select.value).textContent;
  return { memberid: memberid, name: name, cost: cost };
}

function checkSeveralPayer() {
  const costPerPayersItems = document.querySelector(
    ".cost-per-payer-wrapper"
  ).children;
  let payerlist = [];
  for (const Item of costPerPayersItems) {
    const memberid = Item.id.split("-")[1];
    const cost = Item.querySelector("input").value;
    const name = Item.firstElementChild.textContent;
    const obj = { memberid: memberid, cost: cost, name: name };
    payerlist.push(JSON.stringify(obj));
  }
  return payerlist;
}

function checkReceiver(num) {
  const receiverCheckboxContainers = document.querySelectorAll(
    ".receiver-checkbox-container"
  );
  let receiverList = [];
  const activeReceiver =
    receiverCheckboxContainers[num].querySelectorAll(".active");
  for (const receiver of activeReceiver) {
    receiverList.push(Number(receiver.id.split("-")[1]));
  }
  return receiverList;
}

function showOneorSeveral(str) {
  if (str == "one") {
    one.checked = true;
    oneContent.classList.add("show");
    severalContent.classList.remove("show");
  } else if (str == "several") {
    several.checked = true;
    oneContent.classList.remove("show");
    severalContent.classList.add("show");
  }
}

function removeAllActive(str) {
  if (str == "one") {
    removeReceiverActive(0);
  } else if (str == "several") {
    for (const item of document
      .querySelector(".payer-checkbox-container")
      .querySelectorAll(".checkbox-area")) {
      item.classList.remove("active");
    } //payer
    removeReceiverActive(1);
  }
}
function removeReceiverActive(num) {
  const receiverCheckboxContainer = document.querySelectorAll(
    ".receiver-checkbox-container"
  )[num];
  for (const item of receiverCheckboxContainer.children) {
    item.firstElementChild.classList.remove("active");
  }
}

async function postServer(obj, callback) {
  fetch(location.pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  }).then((res) => {
    //errorハンドリング
    callback();
  });
}
