//ホームへ移動
const goToHomeList = document.querySelectorAll(".goToHome");
for (const a of goToHomeList) {
  a.setAttribute("href", location.origin + "/home");
}
const goToSettingsList = document.querySelectorAll(".goToSettings");
for (const a of goToSettingsList) {
  a.setAttribute("href", location.href + "/groupSettings");
}
const goToCreateEventList = document.querySelectorAll(".goToCreateEvent");
for (const a of goToCreateEventList) {
  a.setAttribute("href", location.href + "/addEvent");
}
