let { grouptype, groupname } = JSON.parse(sessionStorage.getItem("group"));
let setting_summary = document.getElementById("unit-summary");
setting_summary.textContent = grouptype.forXYen + "円単位";
//forXYenを代入する
for (const item of $(".unit-form")[0].querySelectorAll(".unit-item")) {
  item.firstElementChild.checked =
    item.firstElementChild.value == grouptype.forXYen;
}
if (grouptype.ratelist[1] != 1.5 || grouptype.ratelist[2] != 2) {
  //デフォルトをカスタムに変更
  document.getElementById("rate-summary").textContent = "カスタム";
}
//rateを代入する
const rateBoxs = document.querySelectorAll(".rate-box");
for (let i = 0; i < 2; i++) {
  rateBoxs[i].querySelector("input").value = grouptype.ratelist[1 + i];
  rateBoxs[i].querySelector(".rate-text").textContent =
    grouptype.ratelist[1 + i];
}

$(".back-area").on("click", function () {
  location.href = location.href.slice(0, -14); //強引
});

$(".rate-input").on("change", function () {
  $(this)[0].nextElementSibling.textContent = "";
  let newratelist = grouptype.ratelist;
  newratelist[$(this)[0].id == "little-rate" ? 1 : 2] = Number(
    $(this)[0].value
  );
  const obj = {
    method: "editGroup",
    arguments: {
      name: groupname,
      grouptype: {
        ...grouptype,
        ratelist: newratelist,
      },
    },
  };
  postServer(obj, function () {
    sessionStorage.setItem(
      "group",
      JSON.stringify({
        ...JSON.parse(sessionStorage.getItem("group")),
        grouptype: obj.arguments.grouptype,
      })
    );

    for (let i = 0; i < 2; i++) {
      rateBoxs[i].querySelector("input").value =
        obj.arguments.grouptype.ratelist[1 + i];
      rateBoxs[i].querySelector(".rate-text").textContent =
        obj.arguments.grouptype.ratelist[1 + i];
    }
  });
});

$(".accordion-trigger").on("click", function () {
  $($(this).next("div")).slideToggle(
    (speed = $(this).hasClass("fast") ? 200 : 300)
  );
  $($(this).find(".fa-chevron-down")).toggleClass("rotate");
});

$(".unit-item").change(function () {
  const obj = {
    method: "editGroup",
    arguments: {
      name: groupname,
      grouptype: {
        ...grouptype,
        forXYen: Number($(this)[0].firstElementChild.value),
      },
    },
  };
  postServer(obj, (obj) => {
    sessionStorage.setItem(
      "group",
      JSON.stringify({
        ...JSON.parse(sessionStorage.getItem("group")),
        grouptype: obj.arguments.grouptype,
      })
    );
    setting_summary = document.getElementById("unit-summary");
    setting_summary.textContent = obj.arguments.grouptype.forXYen + "円単位";
  });
});

function postServer(obj, callback) {
  fetch(location.pathname, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(obj),
  }).then((res) => {
    //errorハンドリング
    callback(obj);
  });
}
