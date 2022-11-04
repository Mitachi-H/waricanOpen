//createGroupへ移動
const addGroup = document.getElementById("addGroup");
addGroup.setAttribute("href", location.origin + "/home/addGroup");

const groupListContainer = document.querySelector(".group-list-container");
const groupListItem = document.querySelector(".group-list-item");
//cokkieの情報をゲットする
const oldData = document.cookie.split("; ");
//cookie空確認
if (Boolean(oldData[0])) {
  oldData.forEach((str) => {
    const [groupid, name] = str.split("=");
    const cloneItem = groupListItem.cloneNode(true);
    cloneItem.id = groupid;
    //日本語の文字化けを直す
    cloneItem.querySelector(".group-title").textContent = decodeURI(name);
    groupListContainer.append(cloneItem);
  });
}
groupListItem.remove();

//過去データクリックしたらグループホームへ
$(".group-list-item").on("click", function () {
  location.href = location.origin + "/home/groupHome/" + $(this)[0].id;
});
