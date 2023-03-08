import Vue from 'vue'
import App from './App.vue'
import messageUI from "./components/message";
Vue.prototype.$message = messageUI;
Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
