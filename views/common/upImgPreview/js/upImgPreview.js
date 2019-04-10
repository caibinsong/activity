(function ($) {
  'use strict';

  var DEFAULT = {
    showAt: null,
    showImgWidth: '100%',
    showImgHeight: '100%'
  };
  var NAMESPACE = 'upImgPreview';
  var UpImgPreview = function (el,opt) {
    function UpImgPreview(el,opt) {
      this._$el = $(el);
      this._opts = $.extend(DEFAULT, opt);
      this._init();
    }
    UpImgPreview.prototype._init = function () {
      this._bind();
    }
    UpImgPreview.prototype._bind = function () {
      var self = this;
      var $el = self._$el;
      var renderShow = self._renderShow;
      $el.on('change.' + NAMESPACE, renderShow.bind($el[0],self));
    }
    UpImgPreview.prototype._renderShow = function (self) {
      var opts = self._opts;
      var renderEl = opts.showAt;
      var imgWidth = opts.showImgWidth;
      var imgHeight = opts.showImgHeight;
      var imgFile = this;
      var filextension = imgFile.value.substring(imgFile.value.lastIndexOf("."), imgFile.value.length);
      filextension = filextension.toLowerCase();
      if ((filextension != '.jpg') && (filextension != '.gif') && (filextension != '.jpeg') && (filextension != '.png') && (filextension != '.bmp')) {
        alert("对不起，系统仅支持标准格式的照片，请您调整格式后重新上传，谢谢 !");
        imgFile.focus();
      } else {
        var path;
        if (document.all) //IE  
        {
          imgFile.select();
          path = document.selection.createRange().text;
          $(renderEl).each(function(){
            this.innerHTML = '';
            this.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled='true',sizingMethod='scale',src=\"" + path + "\")";
            $(this).css({
              width:imgWidth,
              height:imgHeight
            })
          });
        } else //FF  
        {
          path = window.URL.createObjectURL(imgFile.files[0]); // FF 7.0以上  
          //path = imgFile.files[0].getAsDataURL();// FF 3.0  
          $(renderEl).each(function(){
            var $img = $("<img src='" + path + "'/>").css({
              width:imgWidth,
              height:imgHeight,
            });
            $(this).append($img);
          });
          //document.getElementById("img1").src = path;  
        }
      }
    }
    return UpImgPreview;
  }()
  $.fn.upImgPreview = function (options) {
    var $this = this;
    $this.each(function(){
      new UpImgPreview(this, options);
    })
  }
})(jQuery);