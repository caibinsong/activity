//5.9 调整dialog的思路
var cdialog = null;
(function($) {
	'use strict';
	//配置基本项
	var DEFAULT = {
		style: { //弹出框的默认样式
			width: 425,
			height: 'auto',
			left: '50%',
			top: 0
		},
		confirmType: false, //确认按钮的类型  0只有确认  1确认和取消  
		dialogHeader: {
			tipIcon: 'success',
			text: '此处填写标题',
			noArrow: false //4.19	添加取消x的选项
		},
		dialogContent: { //弹出框的主体内容
			text: '此处填写内容', //主体内容的文本内容
			title: ''
		},
		dialogYes: null,
		dialogNo: null, //4.19 	添加否定回调函数
		//4.22	新接口
		dialogType: 0, //弹出框的类型  0弹出框  1提醒框	//新接口调整
		content: null,
		yesCallback: null,
		noCallback: null,
	};
	
	//工具函数
	var utils = {
		getAnimStr:function(anim){
			return 'cdialog-anim'+(anim?('-0'+anim):'');
		}
	};
	
	//将组件的逻辑方法挂载为类的实例方法和静态属性,并保证这些不能被遍历(不能随意使用)
	var createClass = function() {
		function defineProperties(target, props) {
			for(var i = 0; i < props.length; i++) {
				var descriptor = props[i];
				descriptor.enumerable = descriptor.enumerable || false;
				descriptor.configurable = true;
				if("value" in descriptor) descriptor.writable = true;
				Object.defineProperty(target, descriptor.key, descriptor);
			}
		}
		return function(Constructor, protoProps) {
			if(protoProps) defineProperties(Constructor.prototype, protoProps);
			return Constructor;
		};
	}();
	var NAMESPACE = 'dialog';

	var Dialog = function() {
		function Dialog(element, options,isMask,anim) {
			this.$element = $(element);
			this.options = $.extend(true, {}, DEFAULT, options);
			//5.10 添加遮罩层
			this.isMask = isMask;
			this.anim = anim;	//6.10 添加弹出的效果
			this.output();
			this.bind();
		}

		createClass(Dialog, [{
			key: 'output',
			value: function output() {
				//这里设置self的目标是为了防止和其他this混淆
				var self = this,
					$element = self.$element,
					style = self.options.style,
					dialogType = self.options.dialogType,
					wrapStyle = {
						position: 'fixed',
						zIndex: 9999,
						left: style.left,
						top: style.top,
						marginLeft: -(style.width / 2)
					};
				$.extend(wrapStyle,style);
				//设置选定元素的位置
				$element.css(wrapStyle);
				
				if(dialogType === 0 || dialogType === 'pop') {
					//弹出框
					$element.append(self.getPopBox());
				} else {
					//提醒框
					$element.append(self.getTipPopBox());
				}
				if(self.isMask){
					$element.wrap(self.getMask());
				}
			}
		}, {
			key: 'getPopBox',
			value: function getPopBox() {
				var self = this,
					style = self.options.style,
					content = self.options.content,
					title, text, closeStr, popBox;
				var animStr = utils.getAnimStr(this.anim);	//6.10 
				
				if(!content) {
					title = self.options.dialogHeader.text;
					text = self.options.dialogContent.text;
					closeStr = self.options.dialogHeader.noArrow ? '' : '<i class="t-pop-close"></i>';
				} else if(content) {
					title = content.title;
					text = content.text;
					closeStr = '<i class="t-pop-close"></i>';
				}
				popBox = '<div class="t-pop '+animStr+'" style="width:' + style.width + 'px;height:' + style.height + 'px;">' + closeStr 
					+ '<div class="t-pop-header">' + title + '</div>' 
					+ '<div class="t-pop-content">' + text + '</div>' 
					+ '</div>';
				return popBox;
			}
		}, {
			key: 'getTipPopBox',
			value: function getTipPopBox() {
				var self = this,
					style = self.options.style,
					dialogType = self.options.dialogType,
					content = self.options.content,
					yesCallback = self.options.yesCallback,
					noCallback = self.options.noCallback,
					confirmType, icon, title, text, tipPopBox;
					
				var animStr = utils.getAnimStr(this.anim);	//6.10 
				
				if(!content) {
					confirmType = self.options.confirmType;
					icon = self.options.dialogHeader.tipIcon;
					title = self.options.dialogContent.title;
					text = self.options.dialogContent.text;
				} else {
					icon = dialogType;
					title = content.title;
					text = content.text;
				}
				//6.14 提示框的文本强制换行，并且当其内容超出时出现滚动条
				tipPopBox = '<div class="t-prompt '+animStr+'">' +
					'<div class="t-prompt-icon ' + icon + '"><i></i></div>' +
					'<div class="t-prompt-content">' +
					'<h2>' + title + '</h2>' +
					'<p class="dvScrollBar">' + text + '</p>' +
					'</div>';
				if(confirmType === 0 || (confirmType !== 1 && dialogType !== 'pop' && !noCallback)) {
					tipPopBox += '<div class="t-prompt-button">' +
						'<div class="t-button confirm"><label class="t-btn-text">确定</label></div>' +
						'</div></div>';
				} else if(confirmType === 1 || (noCallback && typeof noCallback === 'function')) {
					tipPopBox += '<div class="t-prompt-button">' +
						'<div class="t-button confirm"><label class="t-btn-text">确定</label></div>' +
						'<div class="t-button cancel"><label class="t-btn-text">取消</label></div>' +
						'</div></div>';
				}
				return tipPopBox;
			}
		}, {
			key:'getMask',
			value:function getMask(){
				var maskStr = '<div class="t-dialog-mask"></div>';
				return maskStr;
			}
		},{
			key: 'bind',
			value: function bind() {
				var self = this,
					$element = self.$element,
					options = self.options,
					dialogType = options.dialogType,
					confirmType = options.confirmType,
					yesEvent, noEvent; //4.19

				if(options.dialogYes && typeof options.dialogYes.callback === 'function') {
					yesEvent = options.dialogYes.callback;
				} else if(options.yesCallback && typeof options.yesCallback === 'function') {
					yesEvent = options.yesCallback;
				}

				if(options.dialogNo && typeof options.dialogNo.callback === 'function') {
					noEvent = options.dialogNo.callback;
				} else if(options.noCallback && typeof options.noCallback === 'function') {
					noEvent = options.noCallback;
				}
				if(dialogType === 0 || dialogType === 'pop') {
					$element.on('click.' + NAMESPACE, '.t-pop>.t-pop-close', function() {
						if(typeof noEvent === 'function') {
							noEvent(this);
						}
						if(self.isMask) {
							$element.parent('.t-dialog-mask').remove();
						} else {
							$element.remove();
						}
					})
				} else if(dialogType === 1 || dialogType !== 'pop') {
					$element.on('click.' + NAMESPACE, '.t-button.confirm', function() {
						if(yesEvent) {
							yesEvent(this);
						}
						if(self.isMask) {
							$element.parent('.t-dialog-mask').remove();
						} else {
							$element.remove();
						}
					});
					if(typeof noEvent === 'function') {
						$element.on('click.' + NAMESPACE, '.t-button.cancel', function() {
							noEvent(this);
							if(self.isMask) {
							$element.parent('.t-dialog-mask').remove();
						} else {
							$element.remove();
						}
						});
					}
				}
			}
		}]);

		return Dialog;
	}();

	$.fn.dialog = function jQueryDialog(option,isMask,anim) {
		//外面的this指向jQuery对象,each里面的this指向jQuery中的dom对象
		var options = $.isPlainObject(option) && option || {},
			$this = this;
		$this.each(function() {
			//把实例通过节点data属性暴露给外部,用以获取
			$(this).data(NAMESPACE, new Dialog(this, options,isMask,anim));
		});
		return $this;
	};
	
	
	//5.9 为使得dialog更简单调整组件结构
	cdialog = {};
	//5.25 提示框的宽和高
	//5.25 添加提示框的位置选项   相关添加变量 style,pos
	//6.10 添加的弹出的效果
	var tipHeight = 264;
	cdialog.pop = function Pop(url, title,width,height,pos,nocallback,isMask,anim) {
		if($('#cdialogPop')[0])  return;
		var style = null;
		url = url || '';
		title = title || '此处应有标题';
		pos = pos || 'center';
		nocallback = nocallback || null;
		isMask = isMask !== undefined ? isMask :true;
		if(pos === 'center') {
			//5.25 针对自定义高度实现自适应
			style = $.extend({ 
				top: '50%',
				transform:'translate(0,-50%)',
				webkitTransform:'translate(0,-50%)',
				msTransform:'translate(0,-50%)'
			},{width:width,height:height});
		} else if(pos === 'top') {
			style = $.extend({ top: 0 },{width:width,height:height});
		}
		$.ajax({
			url: url,
			type: 'get',
			success: function(res) {
				$(document.body).append('<div id="cdialogPop"></div>');
				$('#cdialogPop').dialog({
					dialogType: 'pop',
					style: style,
					content: {
						title: title,
						text: res
					},
					noCallback: nocallback
				},isMask,anim);
			}
		});
	};
	cdialog.success = function success(text, yescallback, nocallback,isMask,pos,anim) {
		if($('#cdialogSuccess')[0])  return;
		var style = null;
		text = text || '';
		yescallback = yescallback || null;
		nocallback = nocallback || null;
		isMask = isMask !== undefined ? isMask :true;
		pos = pos || 'top';
		if(pos === 'center') {
			//5.25
			style = { 
				top: '50%',
				transform:'translate(0,-50%)',
				webkitTransform:'translate(0,-50%)',
				msTransform:'translate(0,-50%)'
			};
		} else if(pos === 'top') {
			style = { top: 0 };
		}
		$(document.body).append('<div id="cdialogSuccess"></div>');
		$('#cdialogSuccess').dialog({
			style:style,
			dialogType: 'success',
			content: {
				title: '成功',
				text: text
			},
			noCallback: nocallback,
			yesCallback:yescallback
		},isMask,anim);
	};
	// 5.11 news => info
	cdialog.info = function info(text, yescallback, nocallback,isMask,pos,anim) {
		if($('#cdialogInfo')[0])  return;
		var style = null;
		text = text || '';
		yescallback = yescallback || null;
		nocallback = nocallback || null;
		isMask = isMask !== undefined ? isMask :true;
		pos = pos || 'top';
		if(pos === 'center') {
			//5.25
			style = { 
				top: '50%',
				transform:'translate(0,-50%)',
				webkitTransform:'translate(0,-50%)',
				msTransform:'translate(0,-50%)'
			};
		} else if(pos === 'top') {
			style = { top: 0 };
		}
		$(document.body).append('<div id="cdialogInfo"></div>');
		$('#cdialogInfo').dialog({
			style:style,
			dialogType: 'news',
			content: {
				title: '消息',
				text: text
			},
			noCallback: nocallback,
			yesCallback:yescallback
		},isMask,anim);
	};
	cdialog.warn = function warn(text, yescallback, nocallback,isMask,pos,anim) {
		if($('#cdialogWarn')[0])  return;
		var style = null;
		text = text || '';
		yescallback = yescallback || null;
		nocallback = nocallback || null;
		isMask = isMask !== undefined ? isMask :true;
		pos = pos || 'top';
		if(pos === 'center') {
			//5.25
			style = { 
				top: '50%',
				transform:'translate(0,-50%)',
				webkitTransform:'translate(0,-50%)',
				msTransform:'translate(0,-50%)'
			};
		} else if(pos === 'top') {
			style = { top: 0 };
		}
		$(document.body).append('<div id="cdialogWarn"></div>');
		$('#cdialogWarn').dialog({
			style:style,
			dialogType: 'warning',
			content: {
				title: '警告',
				text: text
			},
			noCallback: nocallback,
			yesCallback:yescallback
		},isMask,anim);
	};
	cdialog.error = function error(text, nocallback, yescallback,isMask,pos,anim) {
		if($('#cdialogError')[0])  return;
		var style = null;
		text = text || '';
		yescallback = yescallback || null;
		nocallback = nocallback || null;
		isMask = isMask !== undefined ? isMask :true;
		pos = pos || 'top';
		if(pos === 'center') {
			// 5.25 
			style = { 
				top: '50%',
				transform:'translate(0,-50%)',
				webkitTransform:'translate(0,-50%)',
				msTransform:'translate(0,-50%)'
			};
		} else if(pos === 'top') {
			style = { top: 0 };
		}
		$(document.body).append('<div id="cdialogError"></div>');
		$('#cdialogError').dialog({
			style:style,
			dialogType: 'error',
			content: {
				title: '错误',
				text: text
			},
			noCallback: nocallback,
			yesCallback:yescallback
		},isMask,anim);
	};
}(jQuery))