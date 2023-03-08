<template>
  <div id="app">
    <DialogView
      ref="loginView"
      title="輸入名子"
      confirmBtn="開始聊天"
      @confirm="login"
    >
      <input
        class="nickname"
        v-model="nickname"
        type="text"
        placeholder="名子"
      />
    </DialogView>

    <DialogView
      ref="createGroupDialog"
      title="群組名稱"
      confirmBtn="確認"
      @confirm="createGroup"
    >
      <input
        class="nickname"
        v-model="groupName"
        type="text"
        placeholder="輸入群組名稱"
      />
    </DialogView>

    <div class="web dis-flex">
      <div class="left">
        <div class="aside content">
          <div class="header-top">
            <div class="chat-header">聊天</div>
            <div @click="$refs.createGroupDialog.show()" class="addchat">
              <img src="./assets/addchat.png" />
            </div>
          </div>
          <div class="header">
            <div class="tabbar dis-flex">
              <!-- 朋友 -->
              <label
                :class="{ active: switchType == 1, unread: usersUnRead }"
                for=""
                @click="switchType = 1"
                >朋友</label
              >
              <!-- 群組 -->
              <label
                :class="{ active: switchType == 2, unread: groupsUnRead }"
                for=""
                @click="switchType = 2"
                >群組</label
              >
            </div>
          </div>
          <!-- 朋友與群組列表 -->
          <div class="body user-list">
            <!-- 顯示群組 -->
            <div
              v-if="switchType == 2"
              class="user"
              @click="triggerGroup(item)"
              v-for="item in currentGroups"
            >
              {{ item.name }}
              <span class="tips-num" v-if="item.unread">{{ item.unread }}</span>
              <span
                v-if="!checkUserIsGroup(item)"
                @click.stop="addGroup(item)"
                class="add-group"
                >+</span
              >
            </div>
            <!-- 顯示朋友 -->
            <div
              v-if="switchType == 1 && item.uid != uid"
              class="user"
              @click="triggerPersonal(item)"
              :class="{ offline: !item.status }"
              v-for="item in currentUserList"
            >
              {{ item.nickname }}
              <span class="tips-num" v-if="item.unread">{{ item.unread }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="right content">
        <div class="header title">{{ title }}</div>
        <div class="body record" id="record">
          <div class="ul">
            <div
              class="li"
              :class="{ user: item.uid == uid }"
              v-for="item in currentMessage"
            >
              <template v-if="item.type === 1">
                <p class="join-tips">{{ item.msg }}</p>
              </template>
              <template v-else>
                <p class="message-date">
                  <span class="m-nickname">{{ item.nickname }}</span>
                  {{ item.date }}
                </p>
                <p class="message-box">{{ item.msg }}</p>
              </template>
            </div>
          </div>
        </div>
        <div class="footer input dis-flex">
          <input type="text" v-model="msg" placeholder="請輸入訊息" />
          <button @click="send">發送</button>
        </div>
      </div>
    </div>
  </div>
</template>


<style lang='scss'>
@import "./style/App.scss";
</style>

<script>
import DialogView from "./components/dialog/DialogView.vue";
import moment from "moment";
export default {
  name: "App",
  components: {
    DialogView,
  },
  data() {
    return {
      title: "websocket chatroom",
      switchType: 1,
      uid: "",
      nickname: "",
      socket: "", // new WebSocket("ws://localhost:8001");
      msg: "",
      messageList: [],
      users: [],
      groups: [],
      groupId: "",
      bridge: [], //[本人,點選的朋友]
      groupName: "",
    };
  },

  //掛載到Dom之後執行
  mounted() {
    let vm = this;

    //null or name
    let user = localStorage.getItem("CHATROOM_USER");
    //是否有值，沒值給空字串
    user = (user && JSON.parse(user)) || {};
    vm.uid = user.uid;
    vm.nickname = user.nickname;

    if (!vm.uid) {
      vm.$refs.loginView.show();
    } else {
      vm.conWebSocket();
    }

    document.onkeydown = function (event) {
      var e = event || window.event;
      if (e && e.keyCode == 13) {
        vm.send();
      }
    };

    //使用者關閉網頁時
    window.onbeforeunload = function (e) {
      vm.socket.send(
        JSON.stringify({
          uid: vm.uid,
          type: 2,
          nickname: vm.nickname,
          bridge: [],
        })
      );
    };
  },
  computed: {
    currentMessage() {
      let vm = this;
      let data = vm.messageList.filter((item) => {
        if (item.type === 1) {
          return item;
        } else if (this.groupId) {
          return item.groupId === this.groupId;
        } else if (item.bridge.length) {
          return item.bridge.sort().join(",") == vm.bridge.sort().join(",");
        }
      });
      data.map((item) => {
        item.status = 0;
        return item;
      });
      return data;
    },
    currentGroups() {
      let vm = this;
      vm.groups.map((group) => {
        group.unread = this.messageList.filter((item) => {
          return item.groupId === group.id && item.status === 1;
        }).length;
        return group;
      });
      return vm.groups;
    },
    groupsUnRead() {
      return this.messageList.some((item) => {
        return item.groupId && item.status === 1;
      });
    },
    usersUnRead() {
      return this.messageList.some((item) => {
        return item.bridge.length && item.status === 1;
      });
    },
    currentUserList() {
      let vm = this;
      vm.users.map((user) => {
        user.unread = this.messageList.filter((item) => {
          return (
            item.bridge.length && item.uid === user.uid && item.status === 1
          );
        }).length;
        return user;
      });
      return vm.users;
    },
  },
  methods: {
    addGroup(item) {
      this.socket.send(
        JSON.stringify({
          uid: this.uid,
          //加入群組
          type: 20,
          nickname: this.nickname,
          groupId: item.id,
          groupName: item.name,
          bridge: [],
        })
      );
      this.$message({ type: "success", message: `成功加入 ${item.name}` });
    },
    checkUserIsGroup(item) {
      return item.users.some((item) => {
        return item.uid === this.uid;
      });
    },
    createGroup() {
      this.groupName = this.groupName.trim();
      if (!this.groupName) {
        this.$message({ type: "error", message: "輸入群組名稱" });
        return;
      }
      this.socket.send(
        JSON.stringify({
          uid: this.uid,
          //建立群組
          type: 10,
          nickname: this.nickname,
          groupName: this.groupName,
          bridge: [],
        })
      );
    },
    triggerGroup(item) {
      let issome = item.users.some((item) => {
        return item.uid === this.uid;
      });
      if (!issome) {
        this.$message({
          type: "error",
          message: `您不是${item.name}群組的成员`,
        });
        return;
      }
      this.bridge = [];
      this.groupId = item.id;
      this.title = `和${item.name}群組成員聊天`;
    },
    triggerPersonal(item) {
      if (this.uid === item.uid) {
        return;
      }
      this.groupId = "";
      this.bridge = [this.uid, item.uid];
      this.title = `${item.nickname}`;
    },
    send() {
      this.msg = this.msg.trim();
      if (!this.msg) {
        return;
      }
      if (!this.bridge.length && !this.groupId) {
        this.$message({ type: "error", message: "請選擇要發送的好友" });
        return;
      }
      this.sendMessage(100, this.msg);
    },
    sendMessage(type, msg) {
      this.socket.send(
        //必須為字串
        JSON.stringify({
          uid: this.uid,
          type: type,
          nickname: this.nickname,
          msg: msg,
          bridge: this.bridge,
          groupId: this.groupId,
        })
      );
      this.msg = "";
    },
    conWebSocket() {
      let vm = this;
      if (window.WebSocket) {
        vm.socket = new WebSocket("wss://wandering-violet-8577.fly.dev");
        let socket = vm.socket;
        socket.onopen = function (e) {
          console.log("連線開啟");
          vm.$message({ type: "success", message: "連線開啟" });
          if (!vm.uid) {
            vm.uid = "member" + moment().valueOf(); //用登入的時間命名使用者id
            localStorage.setItem(
              "CHATROOM_USER",
              JSON.stringify({
                uid: vm.uid,
                nickname: vm.nickname,
              })
            );
          }
          vm.sendMessage(1);
        };
        socket.onclose = function (e) {
          console.log("連線關閉");
        };
        socket.onerror = function () {
          console.log("連線錯誤");
        };
        // 接收伺服器訊息
        socket.onmessage = function (e) {
          let message = JSON.parse(e.data);
          vm.messageList.push(message);
          if (message.users) {
            vm.users = message.users;
          }
          if (message.groups) {
            vm.groups = message.groups;
          }
          //$nextTick:用在DOM更新後執行callback function
          vm.$nextTick(function () {
            var div = document.getElementById("record");
            div.scrollTop = div.scrollHeight;
          });
        };
      }
    },
    login() {
      this.nickname = this.nickname.trim();
      if (!this.nickname) {
        this.$message({ type: "error", message: "請輸入您的名稱" });
        return;
      }
      this.$refs.loginView.hide();
      this.conWebSocket();
    },
  },
};
</script>


