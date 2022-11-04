const express = require("express");
const cookie = require("cookie-parser");
const app = express();
const pool = require("./db");

app.use(express.json());
app.use(cookie());

app.set("view engine", "ejs");

app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
app.listen(PORT);

//ログインのないgroupを削除 サーバーの起動ごとに実行
deleteOldData();

//以下リクエストハンドラ
app.route("/home").get((req, res) => {
  //res.sendFile(__dirname + "/public/debug/debug.html");
  res.sendFile(__dirname + "/public/docs/html/index.html");
});

app
  .route("/home/addGroup")
  .get((req, res) => {
    res.sendFile(__dirname + "/public/docs/html/createGroup.html");
  })
  .post((req, res, next) => {
    const obj = req.body;
    if (obj.method === "addGroup") {
      addGroup(obj.arguments, res, next);
    }
  });

//groupIdをチェックするミドルウェア
app.use("/home/groupHome/:groupId", (req, res, next) => {
  checkGroupId(req.params.groupId, next);
});

app
  .route("/home/groupHome/:groupId")
  .get((req, res, next) => {
    res.sendFile(__dirname + "/public/docs/html/groupHome.html");
  })
  .post((req, res, next) => {
    const obj = req.body;
    if (obj.method === "editGroup") {
      editGroup(req.params.groupId, obj.arguments, res, next);
    }
    if (obj.method === "addMember") {
      addMember(req.params.groupId, obj.arguments, res, next);
    }
    if (obj.method === "deleteMember") {
      deleteMember(req.params.groupId, obj.arguments, res, next);
    }
    if (obj.method === "deleteEvent") {
      deleteEvent(req.params.groupId, obj.arguments, res, next);
    }
  });

app
  .route("/home/groupHome/:groupId/showGroup")
  .get((req, res, next) => {
    showGroup(req.params.groupId, res, next);
  })
  //最終ログイン時刻を更新
  .get((req, res, next) => {
    updateLastLogin(req.params.groupId, next);
  });

app.route("/home/groupHome/:groupId/deleteGroup").post((req, res, next) => {
  const obj = req.body;
  if (obj.method === "deleteGroup") {
    deleteGroup(req.params.groupId, res, next);
  }
});

app
  .route("/home/groupHome/:groupId/groupSettings")
  .get((req, res) => {
    res.sendFile(__dirname + "/public/docs/html/settings.html");
  })
  .post((req, res, next) => {
    const obj = req.body;
    if (obj.method === "editGroup") {
      editGroup(req.params.groupId, obj.arguments, res, next);
    }
  });

app
  .route("/home/groupHome/:groupId/addEvent")
  .get((req, res) => {
    res.sendFile(__dirname + "/public/docs/html/createEvent.html");
  })
  .post((req, res, next) => {
    const obj = req.body;
    if (obj.method === "addEvent") {
      addEvent(req.params.groupId, obj.arguments, res, next);
    }
    if (obj.method === "editEvent") {
      editEvent(req.params.groupId, obj.arguments, res, next);
    }
  });

//errorハンドリングミドルウェア
app.use((err, req, res, next) => {
  //errによって場合分け=>window.statusによって文字列を変える
  if (err == "Error: noGroup") {
    errMessage = "お探しのグループは存在しません";
    res.status(404);
  } else if ((err = "Error: invalidGroupId")) {
    errMessage = "グループIDが無効です";
    res.status(406);
  } else {
    errMessage = "サーバー上で問題が発生しました";
    res.status(500);
  }
  res.render(__dirname + "/public/docs/html/error.ejs", {
    err: errMessage,
  });
});

//以下SQL操作

//group
function showGroup(groupid, res, next) {
  //groupの全データを表示する
  let obj = {};
  const memberString = "select * from " + groupid + "member";
  const eventString = "select * from " + groupid + "event";
  Promise.all([
    pool.query("select * from allgroup where groupid = $1", [groupid]),
    pool.query(memberString),
    pool.query(eventString),
  ])
    .then(([group, member, event]) => {
      obj.group = group.rows[0];
      obj.member = member.rows;
      obj.event = event.rows;
      res
        .status(200)
        .cookie(groupid, obj.group.groupname, { maxAge: 1000 * 3600 * 24 * 4 })
        .json(obj);
      next(); //最終ログイン更新
    })
    .catch((err) => {
      next(err);
    });
}

function addGroup({ groupname }, res, next) {
  //ランダムな8桁の文字列を生成してgroupIdとする

  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  let groupId = "";
  for (let i = 0; i < 8; i++) {
    groupId += alphabet[Math.floor(Math.random() * 26)];
  }
  //alldata table に　groupnameを追加する
  //groupId_member　groupId_event table を作成する

  const createMemberTable =
    "create table " +
    groupId +
    "member (memberid serial,name varchar(255),membertype varchar(255))";
  const createEventTable =
    "create table " +
    groupId +
    `event (eventid serial,name varchar(255),payerlist json[],receiverlist integer[])`;
  Promise.all([
    pool.query(
      "insert into allgroup (groupid,groupname,grouptype,lastlogin) values ($1,$2,$3,$4)",
      [
        groupId,
        groupname,
        JSON.stringify({
          balance: "equal",
          ratelist: [1, 1.5, 2.0],
          forXYen: 10,
        }),
        new Date(),
      ]
    ),
    pool.query(createMemberTable),
    pool.query(createEventTable),
  ])
    .then(() => {
      res
        .status(200)
        .cookie(groupId, groupname, { maxAge: 1000 * 3600 * 24 * 4 })
        .json(groupId);
    })
    .catch((err) => {
      next(err);
    });
}
function editGroup(groupId, { groupname, grouptype }, res, next) {
  //alldata table のgroupId の　nameを変更する

  pool
    .query(
      "update allgroup set groupname = $1,grouptype=$2 where groupid = $3",
      [groupname, grouptype, groupId]
    )
    .then(() => {
      res
        .status(200)
        .cookie(groupId, groupname, { maxAge: 1000 * 3600 * 24 * 4 })
        .json("Group has changed");
    })
    .catch((err) => {
      next(err);
    });
}
function deleteGroup(groupId, res, next) {
  //alldata table のgroupId を削除する

  const dropMemberTable = "drop table " + groupId + "member";
  const dropEventTable = "drop table " + groupId + "event";
  Promise.all([
    pool.query("delete from allgroup where groupid = $1", [groupId]),
    pool.query(dropMemberTable),
    pool.query(dropEventTable),
  ])
    .then(() => {
      res.status(200).json("group has deleted");
    })
    .catch((err) => {
      next(err);
    });
}

//member
function addMember(groupId, { name, membertype }, res, next) {
  //groupId_member table　に　name を追加する

  const memberString =
    "insert into " +
    groupId +
    "member (name,membertype) values($1,$2) returning memberid";
  pool
    .query(memberString, [name, membertype])
    .then((results) => {
      res.status(200).json(results.rows);
    })
    .catch((err) => {
      next(err);
    });
}

/*
function editMember({groupid,memberId,name},res,next){
    //groupId_member table の memberId　を　name に変更する

    //memberの存在確認
    const memberString = "update "+groupid+"member set name = $1 where memberid = $2"
    pool.query(memberString,[name,memberId])
    .then(()=>{console.log("ok")})
    .catch(err=>{next(err)})
}
*/

function deleteMember(groupId, { memberid }, res, next) {
  //groupId_member table の memberid　を削除する

  //memberの存在確認
  const memberString = "delete from " + groupId + "member where memberid = $1";
  pool
    .query(memberString, [memberid])
    .then(() => {
      res.status(200).json("member has deleted");
    })
    .catch((err) => {
      next(err);
    });
}

//event
function addEvent(groupId, { name, payerlist, receiverlist }, res, next) {
  //groupId_event table　に　情報 を追加する
  const eventString =
    "insert into " +
    groupId +
    "event (name,payerlist,receiverlist) values($1,$2,$3)";
  pool
    .query(eventString, [name, payerlist, receiverlist])
    .then((results) => {
      res.status(200).json("event has added");
    })
    .catch((err) => {
      next(err);
    });
}
function editEvent(
  groupId,
  { eventid, name, payerlist, receiverlist },
  res,
  next
) {
  //groupId_event table　のeventid に　情報 を追加する

  //eventの存在確認
  const eventString =
    "update " +
    groupId +
    "event set name=$1,payerlist=$2,receiverlist=$3 where eventid=$4";
  pool
    .query(eventString, [name, payerlist, receiverlist, eventid])
    .then(() => {
      res.status(200).json("event has edited");
    })
    .catch((err) => {
      next(err);
    });
}
function deleteEvent(groupId, { eventid }, res, next) {
  //groupId_event table　の　eventId を削除する

  //eventの存在確認
  const eventString = "delete from " + groupId + "event where eventid = $1";
  pool
    .query(eventString, [eventid])
    .then(() => {
      res.status(200).json("event has deleted");
    })
    .catch((err) => {
      next(err);
    });
}

function checkGroupId(groupId, next) {
  //groupIdのインジェクションを防ぐ
  if (!isGroupIdSafe(groupId)) {
    next(new Error("invalidGroupId")); //errorへ
  }
  //groupIdの存在を確認する
  else {
    pool
      .query("select * from allgroup where groupid = $1", [groupId])
      .then((results) => {
        if (!results.rows.length) {
          next(new Error("noGroup")); //errorへ
        } else {
          next();
        }
      });
  }
}

function isGroupIdSafe(groupId) {
  //groupIdのインジェクションを防ぐ
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  if (groupId.length != 8) {
    return false;
  }
  for (const word of groupId) {
    if (!alphabet.includes(word)) {
      return false;
    }
  }
  return true;
}
function updateLastLogin(groupId, next) {
  pool
    .query("update allgroup set lastlogin=$1 where groupid = $2", [
      new Date(),
      groupId,
    ])
    .catch((err) => {
      next(err);
    });
}
function deleteAllData() {
  pool.query("select groupid from allgroup").then((results) => {
    results.rows.forEach(({ groupid }) => {
      const dropMemberTable = "drop table " + groupid + "member";
      const dropEventTable = "drop table " + groupid + "event";
      Promise.allSettled([
        pool.query("delete from allgroup where groupid = $1", [groupid]),
        pool.query(dropMemberTable),
        pool.query(dropEventTable),
      ]);
    });
  });
}

function deleteOldData() {
  pool.query("select * from allgroup").then((result) => {
    const now = new Date().getTime();
    result.rows.forEach(({ groupid, lastlogin }) => {
      if (now - lastlogin.getTime() > 1000 * 3600 * 24 * 4) {
        //4日間編集なしなら
        deleteGroup(
          groupid,
          {
            status: () => {
              return { json: () => {} };
            },
          },
          console.log
        ); //いなし方雑
      }
    });
  });
}
