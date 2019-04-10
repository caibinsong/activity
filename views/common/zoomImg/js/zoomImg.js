(function ($) {
  'use strict';

  $.fn.zoomImg = function (options) {
    var settings = {
      offset: 10,
      position: 'PR',
      zoomDivBorder:'1px solid #ccc',
      zoomMaskBg:'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAMAAABFaP0WAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAAGUExURf///////1V89WwAAAACdFJOU/8A5bcwSgAAABBJREFUeNpiYGBkYGQECDAAAA0ABMZIs2EAAAAASUVORK5CYII=)'
    };
    if (options) {
      $.extend(settings, options);
    }
    var noalt = '';
    var self = this;
    var $curPar = $(this).parent();
    if ($curPar.css('display') === 'inline') {
      $curPar.css('display', 'inline-block');
    }
    $(this).bind("mouseenter", function (ev) {
      var imageLeft = $(this).offset().left; // img
      var imageTop = $(this).offset().top;
      var imageWidth = $(this).get(0).offsetWidth;
      var imageHeight = $(this).get(0).offsetHeight;
      var boxLeft = $(this).parent().offset().left; // a
      var boxTop = $(this).parent().offset().top;
      var boxWidth = $(this).parent().width();
      var boxHeight = $(this).parent().height();
      var noalt = $(this).attr("alt");
      var bigimage = $(this).attr("data-rel");
      var leftpos;
      $(this).attr("alt", '');
      if ($("div.t-zoomDiv").get().length == 0) {
        $(document.body).append("<div class='t-zoomDiv'><img class='t-zoomBigimg' src='" + bigimage + "'/></div><div class='t-zoomMask'></div>");
      }
      if (settings.position === 'PR') {
        if (boxLeft + boxWidth + settings.offset + settings.xzoom > screen.width) {
          leftpos = boxLeft - settings.offset - settings.xzoom; // ?
        } else {
          leftpos = boxLeft + boxWidth + settings.offset;
        }
      } else if (settings.positon === 'PL') {
        leftpos = imageLeft - settings.xzoom - settings.offset;
        if (leftpos < 0) {
          leftpos = imageLeft + imageWidth + settings.offset; // ?
        }
      }
      $("div.t-zoomDiv").css({
        position: 'absolute',
        overflow: 'hidden',
        zIndex: 999,
        top: boxTop,
        left: leftpos,
        border:settings.zoomDivBorder
      });
      $("div.t-zoomMask").css({
        position:'absolute',
        cursor: 'move',
        zIndex: 1,
        background:settings.zoomMaskBg
      });
      // 默认情况下展示框的展示部分与小图片大小一致
      var zoomWidth = settings.zoomWidth || imageWidth;
      var zoomHeight = settings.zoomHeight || imageHeight;
      $("div.t-zoomDiv").width(zoomWidth);
      $("div.t-zoomDiv").height(zoomHeight);
      // $("div.zoomDiv").show();
      $(this).css('cursor', 'crosshair');
      $(document.body).mousemove(function (e) {
        var mouse = new MouseEvent(e);
        if (mouse.x < imageLeft || mouse.x > imageLeft + imageWidth || mouse.y < imageTop || mouse.y > imageTop + imageHeight) {
          mouseOutImage();
          return;
        }
        // 核心代码
        /*
          核心思想：设移动框的mask为sm,小图片为si,展示框的展示部分为bm,展示框实际的图片为bi
            sm/si = bm/bi <=> sm/bm = si/bi 
            即下面的scalex = bi/si
        **保持比例是关键 => 使得在移动框中移动的位移程度和展示框中展示部分与展示框的位移程序相同
        */
        var bigwidth = $(".t-zoomBigimg").get(0).offsetWidth;
        var bigheight = $(".t-zoomBigimg").get(0).offsetHeight;
        var scaley = 'x';
        var scalex = 'y';
        if (isNaN(scalex) | isNaN(scaley)) {
          scalex = (bigwidth / imageWidth);
          scaley = (bigheight / imageHeight);
          $("div.t-zoomMask").width(zoomWidth / scalex);
          $("div.t-zoomMask").height(zoomHeight / scaley);
        }
        var xpos = mouse.x - $("div.t-zoomMask").width() / 2;
        var ypos = mouse.y - $("div.t-zoomMask").height() / 2;
        var xposs = mouse.x - $("div.t-zoomMask").width() / 2 - imageLeft;
        var yposs = mouse.y - $("div.t-zoomMask").height() / 2 - imageTop;
        /*
          核心限制逻辑：用来限制移动框的位置
        */
        xpos = (mouse.x - $("div.t-zoomMask").width() / 2 < imageLeft) ? imageLeft : (mouse.x + $("div.t-zoomMask").width() / 2 > imageWidth + imageLeft) ? (imageWidth + imageLeft - $("div.t-zoomMask").width()) : xpos;
        ypos = (mouse.y - $("div.t-zoomMask").height() / 2 < imageTop) ? imageTop : (mouse.y + $("div.t-zoomMask").height() / 2 > imageHeight + imageTop) ? (imageHeight + imageTop - $("div.t-zoomMask").height()) : ypos;
        //
        $("div.t-zoomMask").css({
          top: ypos,
          left: xpos
        });
        /**
         *  在这里采用scrollLeft/Top,由于scrollTop为负值或者超出的时候都不起作用,所以使用scrollLeft/Top更方便,
         *  不然也要像上面限制移动框一样去限制展示框
         */
        $("div.t-zoomDiv").get(0).scrollLeft = xposs * scalex;
        $("div.t-zoomDiv").get(0).scrollTop = yposs * scaley;
      });
    });

    function mouseOutImage() {
      $(self).attr("alt", noalt);
      $(document.body).unbind("mousemove");
      $("div.t-zoomMask").remove();
      $("div.t-zoomDiv").remove();
    }

    function MouseEvent(e) {
      this.x = e.pageX;
      this.y = e.pageY;
    }
  }
})(jQuery);