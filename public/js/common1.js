//去除字符串的前后空格
String.prototype.trim = function() {
    return this.replace(/(^\s*)|(\s*$)/g, "");
}


//去除字符串的前后空格
String.prototype.trimPlus = function() {
    return this.replace(/[\r\n]/g,"");
}

String.prototype.isNumber = function() {
    // var reg = new RegExp("^-?\d+$");
    var reg = /^(\-|\+)?\d+$/;
    // var reg = new RegExp("^[0-9]*$");
    return reg.test(this);
}

String.prototype.isPositiveNumber = function() {
    var reg = new RegExp("^[0-9]*$");
    return reg.test(this);
}
Array.prototype.remove=function(dx)
  {
  if(isNaN(dx)||dx>this.length){return false;}
  for(var i=0,n=0;i<this.length;i++)
  {
  if(this[i]!=this[dx])
  {
  this[n++]=this[i]
  }
  }
  this.length-=1
　 }

function numToQian(num){
  if(num == null) return num;
  return num.toString().replace(/(\d{1,3})(?=(\d{3})+$)/g,'$1,');
}

function getUrlParms(name){
 var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
 var r = window.location.search.substr(1).match(reg);
 if(r!=null) return unescape(r[2]);
 return null;
 }

function parseAddress(address){
  if(!address) return ""
  var length = address.length;
  if(length < 20 ) return address;
  return address.substring(0, 5)+"...."+address.substring(length-5, length);
}

function copyToClipboard(input) {
  var el = document.createElement('textarea');

  el.value = input;

  console.log(input);

  // Prevent keyboard from showing on mobile
  el.setAttribute('readonly', '');

  el.style.contain = 'strict';
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  el.style.fontSize = '12pt'; // Prevent zooming on iOS

  var selection = document.getSelection();
  var originalRange = false;
  if (selection.rangeCount > 0) {
    originalRange = selection.getRangeAt(0);
  }

  document.body.appendChild(el);
  el.select();

  // Explicit selection workaround for iOS
  el.selectionStart = 0;
  el.selectionEnd = input.length;

  var success = false;
  try {
    success = document.execCommand('copy');
  } catch (err) {
    console.log(err);
  }

  console.log(success);

  document.body.removeChild(el);

  if (originalRange) {
    selection.removeAllRanges();
    selection.addRange(originalRange);
  }
  // alert("复制成功!")
}
