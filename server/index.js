var ws = require("nodejs-websocket");
var moment = require('moment');

console.log("開始建立連線")

// 聊天室中所有使用者的資訊
let users = [];  

// 所有用戶的 WebSocket 連線物件，以 uid 作為鍵值
let conns = {}; 

// 所有群組的資訊  
let groups = [];  


//廣播函數，將傳入的訊息廣播給所有的連線
function boardcast(obj) {     
    //只廣播給 obj.bridge 指定的用戶      
  if(obj.bridge && obj.bridge.length){
    obj.bridge.forEach(item=>{
      conns[item].sendText(JSON.stringify(obj));
    })
    return;
  }

 //廣播給指定群組的用戶
  if (obj.groupId) {              
    group = groups.filter(item=>{
      return item.id === obj.groupId
    })[0];
    //群組內的所有使用者
    group.users.forEach(item=>{      
      conns[item.uid].sendText(JSON.stringify(obj));
    })
    return;
  }
 //廣播給所有用戶
  server.connections.forEach((conn, index) => {   
      conn.sendText(JSON.stringify(obj));
  })
}

//使用`ws.createServer()`創建websocket伺服器
var server = ws.createServer(function(conn){     //conn:每個客戶端與伺服器建立的連線
  //客戶端傳送訊息時觸發
  conn.on("text", function (obj) {
    obj = JSON.parse(obj);
    conns[''+obj.uid+''] = conn;
    switch(obj.type){
      //有用戶加入聊天室
      case 1:
        //true || false
        let isuser = users.some(item=>{
          return item.uid === obj.uid
        })
        if(!isuser){
          users.push({
            nickname: obj.nickname,
            uid: obj.uid,
            status: 1
          });
        } else {

          //返回新的陣列
          users.map((item, index)=>{
            if(item.uid === obj.uid){
              item.status = 1;
            }
            return item;
          })
        }
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+'加入聊天室',
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge
        });
        break;
      // 使用者退出聊天室
      case 2:
        // delete conns[''+obj.uid+''];
        users.map((item, index)=>{
          if(item.uid === obj.uid){
            item.status = 0;
          }
          return item;
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+'退出了聊天室',
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: []
        });
        break;
      // 建群組
      case 10:
        groups.push({
          id: moment().valueOf(),
          name: obj.groupName,
          users: [{
            uid: obj.uid,
            nickname: obj.nickname
          }]
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+'建立了群組' + obj.groupName,
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge
        });
        break;
      // 加入群組
      case 20:
        let group = groups.filter(item=>{
          return item.id === obj.groupId
        })[0]
        group.users.push({
          uid: obj.uid,
          nickname: obj.nickname
        })
        boardcast({
          type: 1,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.nickname+'加入群組' + obj.groupName,
          users: users,
          groups: groups,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge
        });
        break;
      // 發送訊息
      default:
        boardcast({
          //收到朋友傳來的訊息 messageList的type:2
          type: 2,
          date: moment().format('YYYY-MM-DD HH:mm:ss'),
          msg: obj.msg,
          uid: obj.uid,
          nickname: obj.nickname,
          bridge: obj.bridge,
          groupId: obj.groupId,
          //1:未讀 2:已讀
          status: 1
        });
        break;
    }
  })
  conn.on("close", function (code, reason) {
    console.log("關閉連線")
  });
  conn.on("error", function (code, reason) {
    console.log("錯誤")
  });
}).listen(8001)
console.log("WebSocket建立完成")