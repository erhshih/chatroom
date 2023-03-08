<template>
  <div class="popup" v-if="visable">
    <div class="dialog">
      <div class="title" v-if="title">{{ title }}</div>
      <div class="content">
        <slot></slot>
      </div>
      <div class="btn">
        <button @click="confirm">
          {{ confirmBtn }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "DialogView",
  props: {
    title: String,
    confirmBtn: String,
  },
  data() {
    return {
      visable: false,
    };
  },
  methods: {
    show() {
      this.visable = true;
    },
    hide() {
      this.visable = false;
    },
    cancel() {
      this.hide();
    },
    confirm() {
      this.$emit("confirm");
      this.hide();
    },
  },
};
</script>

<style lang='scss'>
@import "./DialogView.scss";
</style>