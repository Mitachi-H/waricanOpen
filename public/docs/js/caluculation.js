window.addEventListener("allLoaded", tryCalculation);
window.addEventListener("calculate", tryCalculation);
//クリップボードにコピー用
let results = "";

function tryCalculation() {
  try {
    caluculate();
  } catch (err) {
    console.log(err);
  }
}
//sessionストレージにerrorがあるなら表示しない
function caluculate() {
  //pay初期化
  const memberList = JSON.parse(sessionStorage.getItem("member")).map(
    (memberObj) => {
      return { ...memberObj, pay: 0 };
    }
  );
  const eventList = JSON.parse(sessionStorage.getItem("event"));
  const { groupname, grouptype } = JSON.parse(sessionStorage.getItem("group"));

  //results初期化
  results =
    location.href +
    "\n" +
    (groupname || "グループ") +
    " " +
    (grouptype.balance == "boy+"
      ? "男子少し多め\n"
      : grouptype.balance == "boy++"
      ? "男子かなり多め\n"
      : "") +
    memberList.length +
    "人で計算";
  eventList.forEach(({ payerlist, receiverlist }) => {
    const totalCost = payerlist.reduce(
      (total, { cost }) => total + Number(cost),
      0
    );
    let girlPay = 0;
    let boyPay = 0;
    //girlPay,boyPayを求める
    if (grouptype.balance == "equal") {
      girlPay = totalCost / receiverlist.length;
      boyPay = girlPay;
    } else {
      const rate = grouptype.ratelist[grouptype.balance == "boy++" ? 2 : 1];
      let boyGirl = [0, 0];
      receiverlist.forEach((receiverid) =>
        memberList.find(({ memberid }) => memberid == receiverid).membertype ==
        "male"
          ? boyGirl[0]++
          : boyGirl[1]++
      );
      girlPay = totalCost / (boyGirl[0] * rate + boyGirl[1]);
      boyPay = girlPay * rate;
    }
    //memberのイベントの収支を計算
    memberList.forEach(({ memberid, membertype }, index) => {
      if (receiverlist.includes(memberid)) {
        memberList[index].pay += membertype == "male" ? boyPay : girlPay;
      }
      memberList[index].pay -= Number(
        (
          payerlist.find((payerData) => payerData.memberid == memberid) || {
            cost: 0,
          }
        ).cost
      );
    });
  });

  //memberListをcost順に並び替える
  memberList.sort((a, b) => b.pay - a.pay);
  //割り勘計算
  //ここでのpayerは精算時のpayer(逆に注意)
  let payerIndex = 0;
  let receiverIndex = memberList.length - 1;

  //showCalculationで必要
  const paymentItemContainer = document.querySelector(
    ".payment-item-container"
  );
  const paymentItem = paymentItemContainer.querySelector(".payment-item");
  paymentItemContainer.innerHTML = "";
  const forXYen = grouptype.forXYen;

  while (payerIndex < receiverIndex) {
    if ((memberList[receiverIndex].pay += memberList[payerIndex].pay) >= 0) {
      showCalculation(
        memberList[payerIndex].name,
        memberList[receiverIndex].name,
        Number(memberList[payerIndex].pay - memberList[receiverIndex].pay)
      );
      memberList[payerIndex].pay = memberList[receiverIndex].pay;
      if (memberList[payerIndex].pay == 0) {
        payerIndex++;
      }
      memberList[receiverIndex].pay = 0;
      receiverIndex--;
    } else {
      showCalculation(
        memberList[payerIndex].name,
        memberList[receiverIndex].name,
        memberList[payerIndex].pay
      );
      memberList[payerIndex].pay = 0;
      payerIndex++;
    }
  }
  function showCalculation(payerName, receiverName, money) {
    const fixedMoney =
      money - Math.floor(money / forXYen) * forXYen >
      forXYen - (money - Math.floor(money / forXYen) * forXYen)
        ? (1 + Math.floor(money / forXYen)) * forXYen
        : Math.floor(money / forXYen) * forXYen;
    if (fixedMoney) {
      //domでの処理
      const cloneItem = paymentItem.cloneNode(true);
      cloneItem.querySelector(".payer").textContent = payerName;
      cloneItem.querySelector(".receiver").textContent = receiverName;
      cloneItem.querySelector(".payment-cost").textContent = fixedMoney + "円";
      paymentItemContainer.append(cloneItem);
      //resultsに対応
      results +=
        "\n" + payerName + "\n=>" + receiverName + "   " + fixedMoney + "円";
    }
  }
  paymentItem.remove();
}

//クリップボードにコピー
$(".copy-button").on("click", function () {
  if (results[results.length - 1] == "円") {
    //空じゃない
    navigator.clipboard.writeText(results);
    $(this)[0].textContent = "コピーしました!!";
  }
});
