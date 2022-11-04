//addGroup
const groupContainer = document.getElementById("group-container");

const groupName = groupContainer.querySelector("input");
const groupButton = groupContainer.querySelector(".group-button");

groupButton.addEventListener("click", addGroup);

async function addGroup(event) {
  event.preventDefault();
  const name = groupName.value;
  if (name && name.length < 10) {
    groupButton.removeEventListener("click", addGroup);
    if (name.includes("サンフレ")) {
      alert("楽しんでね！");
    }
    const obj = {
      method: "addGroup",
      arguments: { groupname: name },
    };
    //ロード以外と長いのね
    fetch(location.pathname, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(obj),
    }).then((result) => {
      result.json().then((groupId) => {
        location.href = location.origin + "/home/groupHome/" + groupId;
      });
    });
    load();
  } else {
    alert("グループ名が不適切です");
  }
}

function load() {
  const loaderWrapper = document.querySelector(".loader-wrapper");
  loaderWrapper.classList.add("active");
}
