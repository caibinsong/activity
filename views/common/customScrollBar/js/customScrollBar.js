/**
 * @version:1.0.0
 * @date:Tue Apr 11 2017
 * @Author:Ko00
 * @Copyright (c) 2017 yuanwang
 *===========================================================
 * ==================== customscrollbar commponet ===========
 *===========================================================
 **/
(function ($) {
    var DEFAULT = {
        scrollBoxCssX: {
            width: '100%',
            height: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: 98
        },
        scrollBarCssX: {
            height: '100%',
            backgroundColor: '#57a1ff',
            borderRadius: '5px',
            position: 'relative',
            left: 0,
            cursor: 'default'
        },
        scrollBoxCssY: {
            width: 3,
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 99
        },
        scrollBarCssY: {
            width: '100%',
            backgroundColor: '#57a1ff',
            borderRadius: '5px',
            position: 'relative',
            top: 0,
            cursor: 'default'
        },
        initShiftValue:{	//4.18 添加预设初始的位移值
        	top:0,
        	left:0
        }
    };
    var NAMESPACE = 'customScroll';
    var customScrollBar = (function () {
        function customScrollBar(ele, options) {
            this.$element = $(ele);
            this.options = options;
            this.init();
            this.bind();
        }
        customScrollBar.prototype.init = function () {
            /**
             * 布局核心:在已有元素的上层构建一个假的滚动视图结构
             * t-scrollClient表示可视区域，t-scrollBoxX t-scrollBoxY表示对应滚动条
             */
            /**
             * 4.14  针对内容区域无法操作，去除虚拟的展示区域
             */
            var $element = this.$element, options = this.options, $contentEle = $element.find('.t-scrollContent').css('position', 'relative'), ew = $element.outerWidth(), //容器元素宽度
	            eh = $element.outerHeight(), //容器元素高度
	            cw = $contentEle.outerWidth(), //内容元素宽度
	            ch = $contentEle.outerHeight(), //内容元素高度
            	sBoxHeightX = options.scrollBoxCssX.height, sBoxWidthY = options.scrollBoxCssY.width;
            var cPaddingRight = 0, //如果出现滚动条，需要给容器元素添加padding
            	cPaddingBottom = 0;
            this.scaleX = ew / cw;
            this.scaleY = eh / ch;
            if (this.scaleX && this.scaleX < 1) {
                $element.append(this.renderScrollBarX());
                cPaddingBottom = parseInt(sBoxHeightX);
            }
            if (this.scaleY && this.scaleY < 1) {
                $element.append(this.renderScrollBarY());
                cPaddingRight = parseInt(sBoxWidthY);
            }
            //对内容区域添加样式
            $element.css({
                boxSizing: 'border-box',
                position:'relative',
                paddingRight: cPaddingRight,
                paddingBottom: cPaddingBottom
            });
        };
        customScrollBar.prototype.bind = function () {
            /**
             * 核心部分:
             * 滚动条宽度:sw   滚动条位移:sx 原始内容宽度:rw 原始内容位移:rx  展示框宽度:cw
             *  sx /sw = rx / rw =  cw / rw = sw / cw
             *
             * */
            if (this.scaleX && this.scaleX < 1) {
                this.bindScrollBarX();
            }
            if (this.scaleY && this.scaleY < 1) {
                this.bindScrollBarY();
            }
        };
        customScrollBar.prototype.renderScrollBarX = function () {
            var $element = this.$element, $contentEle = $element.find('.t-scrollContent'),options = this.options, scaleX = this.scaleX, scaleY = this.scaleY, $scrollBoxX = $('<div class="t-scrollBoxX"></div>').css(options.scrollBoxCssX), $scrollBarX = $('<div class="t-scrollBarX"></div>').css(options.scrollBarCssX), sBoxHeightX = options.scrollBoxCssX.height, sBoxWidthY = options.scrollBoxCssY.width;
            var sBoxWidthX = $element.outerWidth(), sBarWidthX = sBoxWidthX * scaleX,left = options.initShiftValue.left;
            this.maxLeft = sBoxWidthX - sBarWidthX;
            if (scaleY && scaleY < 1) {		//如果Y轴滚动条存在
                var maxDistanceX = sBoxWidthX - parseInt(sBoxWidthY);
                sBarWidthX = maxDistanceX * scaleX;
                this.maxLeft = maxDistanceX - sBarWidthX;
            }
            $scrollBarX.width(sBarWidthX);
            //4.18	根据预设位移值进行操作
            left = left <=0?0:(0<left &&left <this.maxLeft)?left:this.maxLeft;
            $scrollBarX.css('left',left);
            $contentEle.css('left',-left/scaleX);
            $scrollBoxX.append($scrollBarX);
            return $scrollBoxX;
        };
        customScrollBar.prototype.renderScrollBarY = function () {
            var $element = this.$element,$contentEle = $element.find('.t-scrollContent'), options = this.options, scaleX = this.scaleX, scaleY = this.scaleY, $scrollBoxY = $('<div class="t-scrollBoxY"></div>').css(options.scrollBoxCssY), $scrollBarY = $('<div class="t-scrollBarY"></div>').css(options.scrollBarCssY), sBoxWidthY = options.scrollBoxCssY.width, sBoxHeightX = options.scrollBoxCssX.height;
            var sBoxHeightY = $element.outerHeight(), sBarHeightY = sBoxHeightY * scaleY,top = options.initShiftValue.top;
            this.maxTop = sBoxHeightY - sBarHeightY;
            if (scaleX && scaleX < 1) {		//如果X轴滚动条存在
                var maxDistanceY = sBoxHeightY - parseInt(sBoxHeightX);
                sBarHeightY = maxDistanceY * scaleY;
                this.maxTop = maxDistanceY - sBarHeightY;
            }
            $scrollBarY.height(sBarHeightY);
            //4.18	根据预设位移值进行操作
            top = top <=0?0:(0<top &&top <this.maxTop)?top:this.maxTop;
            $scrollBarY.css('top',top);
            $contentEle.css('top',-top/scaleY);
            $scrollBoxY.append($scrollBarY);
            return $scrollBoxY;
        };
        customScrollBar.prototype.bindScrollBarX = function () {
            var self = this, $element = self.$element, $scrollBarX = $element.find('.t-scrollBarX'), $scrollBoxX = $element.find('.t-scrollBoxX'), $contentEle = $element.find('.t-scrollContent');
            var originX, left = self.options.initShiftValue.left;
            //绑定事件两种:1.鼠标移动 
            //绑定鼠标移动
            $scrollBarX.on('mousedown.' + NAMESPACE, function (e) {
                e.stopPropagation();
                originX = e.clientX - this.offsetLeft; //这一步是具体实现的核心
                $(document).on('mousemove.' + NAMESPACE, function (e) {
                    left = e.clientX - originX;
                    left = Math.max(0, Math.min(left, self.maxLeft));
                    $scrollBarX.css('left', left);
                    $contentEle.css('left', -left / self.scaleX);
                });
                $(document).on('mouseup.' + NAMESPACE, function (e) {
                    $(document).off('mousemove.' + NAMESPACE);
                    $(document).off('mouseup.' + NAMESPACE);
                });
            });
            //给滚动槽绑定事件
            $scrollBoxX.on('click.' + NAMESPACE, function (e) {
                if ($(e.target).hasClass('t-scrollBoxX')) {
                    var mCurLeft = e.offsetX, //鼠标相对于box元素框的Y轴距离
                    barWidthX = $('.t-scrollBarX').width(), boxWidthX = $('.t-scrollBoxX').width(), mcDiffX = boxWidthX - Math.floor(boxWidthX / barWidthX) * barWidthX; //最小差值X
                    //根据bar和box的宽度来进行划分
                    if (boxWidthX % barWidthX === 0) {
                        left = Math.floor(mCurLeft / barWidthX) * barWidthX;
                    }
                    else {
                        if (0 <= mCurLeft && mCurLeft < mcDiffX) {
                            left = 0;
                        }
                        else {
                            left = mcDiffX + Math.floor((mCurLeft - mcDiffX) / barWidthX) * barWidthX;
                        }
                    }
                    $scrollBarX.animate({
                        left: left
                    }, 1000);
                    $contentEle.animate({
                        left: -left / self.scaleX
                    }, 1000);
                }
            });
        };
        customScrollBar.prototype.bindScrollBarY = function () {
            var self = this, $element = self.$element, $scrollBoxY = $element.find('.t-scrollBoxY'), $scrollBarY = $element.find('.t-scrollBarY'), $contentEle = $element.find('.t-scrollContent');
            var originY, top = self.options.initShiftValue.top; //记录scrollbar在scrollbox的相对位置
            //声名滚轮滚动事件类型
            var wheelEvent = function (e) {
                e = e.originalEvent;
                var wheel = e.wheelDelta || e.detail;
                var isDown = true;
                e.wheelDelta ? (isDown = wheel < 0 ? true : false) : (isDown = wheel > 0 ? true : false);
                top += isDown ? 10 : -10;
                top = Math.max(0, Math.min(top, self.maxTop));
                //滚轮滚动的话，内容和滚动条都要滚动
                $scrollBarY.css('top', top);
                $contentEle.css('top', -top / self.scaleY);
            };
            //绑定滚轮事件
            if (navigator.userAgent.indexOf("Firefox") > 0) {
                $element.on('DOMMouseScroll.'+NAMESPACE, function (e) {
                    wheelEvent(e);
                    //6.7 当当前滚动条滚动的时候，不影响其他滚动条的滚动
                    return false;
                });
            }
            else {
                $element.on('mousewheel.'+NAMESPACE, function (e) {
                    wheelEvent(e);
                    //6.7 当当前滚动条滚动的时候，不影响其他滚动条的滚动
                    return false;
                });
            }
            //绑定事件两种:1.鼠标移动  2.滚动轴
            //绑定鼠标移动
            $scrollBarY.on('mousedown.' + NAMESPACE, function (e) {
                e.stopPropagation();
                originY = e.clientY - this.offsetTop; //这一步是具体实现的核心
                $(document).on('mousemove.' + NAMESPACE, function (e) {
                    top = e.clientY - originY;
                    top = Math.max(0, Math.min(top, self.maxTop));
                    $scrollBarY.css('top', top);
                    $contentEle.css('top', -top / self.scaleY);
                });
                $(document).on('mouseup.' + NAMESPACE, function (e) {
                    $(document).off('mousemove.' + NAMESPACE);
                    $(document).off('mouseup.' + NAMESPACE);
                });
            });
            //给滚动槽绑定事件
            $scrollBoxY.on('click.' + NAMESPACE, function (e) {
                if ($(e.target).hasClass('t-scrollBoxY')) {
                    var mCurTop = e.offsetY, //鼠标相对于box元素框的Y轴距离
                    barHeightY = $('.t-scrollBarY').height(), boxHeightY = $('.t-scrollBoxY').height(), mcDiffY = boxHeightY - Math.floor(boxHeightY / barHeightY) * barHeightY; //最小差值Y
                    //根据bar和box的宽度来进行划分
                    if (boxHeightY % barHeightY === 0) {
                        top = Math.floor(mCurTop / barHeightY) * barHeightY;
                    }
                    else {
                        if (0 <= mCurTop && mCurTop < mcDiffY) {
                            top = 0;
                        }
                        else {
                            top = mcDiffY + Math.floor((mCurTop - mcDiffY) / barHeightY) * barHeightY;
                        }
                    }
                    $scrollBarY.animate({
                        top: top
                    }, 1000);
                    $contentEle.animate({
                        top: -top / self.scaleY
                    }, 1000);
                }
            });
        };
        return customScrollBar;
    }());
    $.fn.customScrollBar = function (option) {
        var options = $.extend(true, {}, DEFAULT, option);
        $(this).each(function (index, sdom) {
            new customScrollBar(sdom, options);
        });
        return this;
    };
})(jQuery);
