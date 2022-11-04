//locationの階層がわからない以上動的にファイルを読み込む必要あり
//imgを読み込む
const img = document.querySelector(".main-view-image");
//goTo.jsを読み込む
const script = document.createElement("script");
script.type = "text/javascript";
script.src = location.origin + "/docs/js/goTo.js";
document.querySelector(".footer").after(script);
//cssを読み込む
const csss = document.querySelectorAll(".css");
for (const css of csss) {
  css.href = location.orgin + css.href;
}

//グループidが存在しなかった時にcookieのデータを消す。
const errorMassage = document.querySelector(".error-massage");
const hrefList = location.href.split("/");
const invalidgroupid = hrefList[hrefList.indexOf("groupHome") + 1];
if (errorMassage.textContent == "お探しのグループは存在しません") {
  const cookie = document.cookie.split("; ").map((str) => str.split("="));
  cookie.forEach(([groupid, groupname]) => {
    if (groupid == invalidgroupid) {
      console.log(document.cookie);
      console.log(groupid + "=" + groupname + "; max-age=0");
      document.cookie =
        groupid +
        "=" +
        groupname +
        "; expires=Mon, 31 Aug 2020 15:00:00 GMT;path=/";
    }
  });
}
