var option = {
  type: 'info',
  iconClass: '', 
  customClass: '',
  showClose: true, 
  message: '', 
  duration: 2000,
  id: '', 
  onClose: null,
  timer: 0
};
var Message = function(options, type) {
  if (typeof options === 'string') {
    option.message = options;
  } else {
    for (var i in options) {
      option[i] = options[i];
    }
  }
  (type) && (option.type = type);
  creatHtml();
};
var creatHtml = function() {
  var node = document.createElement("div");
  if (option.id) {
    document.getElementById(option.id + '-p').innerHTML = option.message;
    setTimeoutClose();
    return;
  }
  option.id = new Date().getTime();
  option.id = 'msg' + option.id;
  node.id = option.id;
  node.innerHTML = '<div class="my-el-message ' + option.type + '"><div class="el-message-cover"></div><div class="my-el-message__group"><p id="' + option.id + '-p">' +
    option.message +
    '</p><div class="my-el-message-close" id="' + option.id + '-close"></div></div></div>';
  document.body.appendChild(node);
  bindClose();
},
bindClose = function() {
  document.getElementById(option.id + '-close').onclick = function() {
    close();
  };
  setTimeoutClose();
},
close = function() {
  var remove = document.getElementById(option.id);
  document.body.removeChild(remove);
  option.id = '';
  clearTimeout(option.timer);
  if (typeof option.onClose === 'function') {
    option.onClose(Message);
  }
},
setTimeoutClose = function() {
  clearTimeout(option.timer);
  if (option.duration > 0) {
    option.timer = setTimeout(function() {
      close();
    }, option.duration);
  }
};

['success', 'warning', 'info', 'error'].forEach(function(type) {
  Message[type] = function(options) {
    return Message(options, type);
  };
});

export default Message;