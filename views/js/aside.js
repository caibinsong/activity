(function($) {
	'use strict';
	//配置基本项
	var DEFAULT = {
		asideType: 0,
		asideHeader: {},
		toolBox: {
			asideBtn:false,
			switchType:0	//控制子菜单的展开风格
		},
		asideBody: []
	};
	var utils = {
		isShowScroll:function(type,ele){
			var limit = 0,
				htmlHeight = $('html').height();
			if(type === 'mini'){
				var miniScrollBar = $(ele).closest('.dvScrollBar'),
					miniTop = miniScrollBar.offset().top,
					limit = htmlHeight - miniTop-1;
				if(limit >= 0 && miniScrollBar.height()> limit){
					miniScrollBar.css({
						height:limit,
						overflow:'auto'
					});
					return ;
				}
				miniScrollBar.css({
					height:'auto',
					overflow:''
				});
			}else if(type === 'unmini'){
				var root = $(ele).closest('.root-ul'),
					rootTop = root.offset().top,
					dvScrollLength = root.find('.dvScrollBar').length,
					dvScrollHeight = root.find('.dvScrollBar:not(.active)').height(),
					curScroll= $(ele).closest('.dvScrollBar'),
					curHeight = curScroll.height(),
					limit = htmlHeight -rootTop - (dvScrollLength-1)*dvScrollHeight;
				if(limit >=0 && curHeight > limit){
					curScroll.css({
						height:limit,
						overflow:'auto'
					});
					return ;
				}
				curScroll.css({
					height:'auto',
					overflow:''
				});
			}
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
		};
		return function(Constructor, protoProps) {
			if(protoProps) defineProperties(Constructor.prototype, protoProps);
			return Constructor;
		};
	}();
	
	var Aside = function() {
		function Aside($element, options) {
			var self = this;
			self.$element = $element;
			self.cbList = [];	//回调函数列表
			
			if($.isEmptyObject(options)){
				throw ('警告：不能传入空对象!!!')
			}
			self.options = $.extend(true, {}, DEFAULT, $.isPlainObject(options) && options);
			self.output();
			self.bind();
		};
		
		createClass(Aside,[{
			key:'output',
			value:function output(){
				var self = this,
					$element = self.$element,
					asideType = self.options.asideType,
					asideBtn = self.options.toolBox.asideBtn;
				if(asideBtn){
					$element.append('<div class="asideBtn"></div>');
				}
				//判断选择左导航类型，0为多左导航类型，1为少左导航类型
				if(asideType === 0 ){
					$element.append(self.getAsideMore());
					utils.isShowScroll('unmini',$element.find('.t-aside-more').find('.dvScrollBar.active')[0]);
				}
				else if (asideType === 1){
					$element.append(self.getAsideLess());
					utils.isShowScroll('unmini',$element.find('.t-aside-less').find('.dvScrollBar.active')[0]);
				}
				
				$element.append(self.getAsideMini());
			}
		},{
			key:'getAsideMore',
			value:function getAsideMore(){
				var self = this,
					asideHeader = self.options.asideHeader,
					asideBody = self.options.asideBody,
					toolBox = self.options.toolBox,
					asideHeaderBtn = asideHeader.noRightBtn?'':'<i class="aside-btn headerSwitch"></i>',
					asideMore = '',
					cbList = self.cbList,
					padLeft25 = asideHeader.btnIcon?'':'style="padding-left:25px;"',
					ei = 0 ;//标记事件下标
				
				//拼接导航头
				asideMore += '<div class="t-aside-more">'
					+ '<div class="t-caption-title">'
					+ 	'<div class="option-wrap">'
					+		'<i class="t-aside-icon '+asideHeader.btnIcon+'"></i>'
					+		'<span class="caption-text" '+padLeft25+'>'+asideHeader.text+'</span>'
					+		asideHeaderBtn
					+	'</div>'
					+  '</div>';
					
				asideMore += '<div class="aside-option"><ul class="root-ul"><li><ul class="moreChildList">';
				
					
				//拼接导航体
				$.each(asideBody,function(ni,no){
					var btnIconTop = no.btnIcon?no.btnIcon:'',
						topDataEventStr = '',
						topActiveStr = '',
						topId = no.id !== undefined ?no.id:'',
						asideArrow = '<i class="aside-arrow"></i>',
						hasArrow = 'hasArrow';
						
					if(typeof no.callback === 'function' ){
						cbList[ei] = no.callback;
						topDataEventStr = 'data-event';
						ei++;
					}
					if(no.active){
						topActiveStr ='active';
					}
					if(!(Array.isArray(no.childList) && no.childList.length>0)){
						asideArrow = '';
						hasArrow = '';
					}
					asideMore += '<li id="'+topId+'" class="dvScrollBar '+topActiveStr+'"'+topDataEventStr+'>'
							+ '<div class="option-wrap '+hasArrow+'" >'
							+ 	'<i class="t-aside-icon '+btnIconTop+'"></i>'
							+ 	'<span class="aside-text">'+no.text+'</span>'
							+ 	asideArrow
							+ '</div><div class="aside-node"><ul class="childList">';
					if(Array.isArray(no.childList) && no.childList.length>0){
						$.each(no.childList,function(ci,co){
							var twoDataEventStr = '',
								idStr = co.id !== undefined ?co.id:'';
							if(typeof co.callback === 'function' ){
								cbList[ei] = co.callback;
								twoDataEventStr = 'data-event';
								ei++;
							}
							asideMore += '<li id="'+idStr+'">'
									+	'<div class="option-wrap" '+twoDataEventStr+'>'
									+		'<span class="aside-text">'+co.text+'</span>'
									+	'</div>'
									+'</li>';
						});
					}
					asideMore += '</ul></div></li>';
				})
				asideMore += '</ul></li></ul></div></div>';
				return asideMore;
			}
		},{
			key:'getAsideLess',
			value:function getAsideLess(){
				var self = this,
					asideHeader = self.options.asideHeader,
					asideBody = self.options.asideBody,
					toolBox = self.options.toolBox,
					asideHeaderBtn = asideHeader.noRightBtn?'':'<i class="aside-btn headerSwitch"></i>',
					cbList = self.cbList,
					padLeft25 = asideHeader.btnIcon?'':'style="padding-left:25px;"',
					asideLess = '',
					ei = 0 ;//事件下标
				
				//拼接导航头
				asideLess += '<div class="t-aside-less">'
					+ '<div class="t-caption-title">'
					+ 	'<div class="option-wrap">'
					+		'<i class="t-aside-icon '+asideHeader.btnIcon+'"></i>'
					+		'<span class="caption-text" '+padLeft25+'>'+asideHeader.text+'</span>'
					+		asideHeaderBtn
					+	'</div>'
					+  '</div><div class="aside-option"><ul class="root-ul">';
				
				
				//拼接导航体
				$.each(asideBody,function(ni,no){
					var btnIconTop = no.btnIcon?no.btnIcon:'',
						topDataEventStr = '',
						activeStr = '',
 						asideArrow = '<i class="aside-arrow"></i>',
 						topId = no.id !== undefined ? no.id:'',
 						hasArrow = 'hasArrow';
					if(typeof no.callback === 'function' ){
						cbList[ei] = no.callback;
						topDataEventStr = 'data-event';
						ei++;
					}
					if(no.active){
						activeStr = 'active';
					}
					if(!(Array.isArray(no.childList) && no.childList.length>0)){
						asideArrow = '';
						hasArrow = '';
					}
					asideLess += '<li id="'+topId+'" class="dvScrollBar '+activeStr+'" '+topDataEventStr+'>'
							+ '<div class="option-wrap '+hasArrow+'">'
							+ 	'<i class="t-aside-icon '+btnIconTop+'"></i>'
							+ 	'<span class="aside-text">'+no.text+'</span>'
							+ 	asideArrow
							+ '</div><div class="aside-node"><ul>';
					if(Array.isArray(no.childList) && no.childList.length>0){
						$.each(no.childList,function(ci,co){
							var btnIconTwo = co.btnIcon?co.btnIcon:'',
								twoDataEventStr = '',
								twoActiveStr = '',
								asideArrow = '<i class="aside-arrow"></i>',
								idStr = co.id !== undefined ? co.id:'',
								hasArrow = 'hasArrow';
							if(typeof co.callback === 'function' ){
								cbList[ei] = co.callback;
								twoDataEventStr = 'data-event';
								ei++;
							}
							if(co.active){
								twoActiveStr = 'active';
							}
							if(!(Array.isArray(co.childList) && co.childList.length>0)){
								asideArrow = '';
								hasArrow = '';
							}
							asideLess += '<li class="'+twoActiveStr+'" id="'+idStr+'">'
									+	'<div class="option-wrap '+hasArrow+'" '+twoDataEventStr+'>'
									+		'<i class="t-aside-icon '+btnIconTwo+'"></i>'
									+		'<span class="aside-text">'+co.text+'</span>'
									+		asideArrow
									+	'</div><div class="aside-node"><ul class="childList">';
							if(Array.isArray(co.childList) && co.childList.length>0){			
								$.each(co.childList, function(cci,cco) {
									var threeDataEventStr = '',
										idStr = cco.id !== undefined ? cco.id : '';
									if(typeof cco.callback === 'function' ){
										cbList[ei] = cco.callback;
										threeDataEventStr = 'data-event';
										ei++;
									}
									asideLess += '<li id="'+idStr+'">'
											+	'<div class="option-wrap" '+threeDataEventStr+'>'
											+		'<span class="aside-text">'+cco.text+'</span>'
											+	'</div>'
											+'</li>';
								});
							}
							asideLess +='</ul></div></li>';
						})
					}
					asideLess += '</ul></div></li>';
				})
				asideLess += '</ul></div></div>';
				
				return asideLess;
			}
		},{
			key:'getAsideMini',
			value:function getAsideMini(){
				var self =this,
					asideType = self.options.asideType,
					asideHeader = self.options.asideHeader,
					asideBody = self.options.asideBody,
					toolBox = self.options.toolBox,
					asideHeaderBtn = asideHeader.noRightBtn?'':'<i class="aside-btn"></i>',
					asideMini = '',
					ei = 0;//事件下标
				
				//判断导航类型，左导航多/少的情况渲染方式不同
				if( asideType === 0 ){
					//渲染左导航(多)
					//渲染导航头按钮
					asideMini +='<div class="t-aside-mini" >'
							+	'<div class="t-caption-title">'
							+		'<div class="option-wrap">' + asideHeaderBtn +'</div>'
							+	'</div>';
					//渲染导航体
					asideMini +='<div class="aside-option"> <ul class="root-ul"> <li>'
							+	'<i class="t-aside-icon '+asideHeader.btnIcon+'"></i>'
							+ 	'<div class="mini-option-wrap"><span class="title-option">'
							+	asideHeader.text +'</span>';
					//渲染列表
					asideMini += '<div class="aside-node dvScrollBar"><ul>';
					$.each(asideBody,function(ni,no){
						var topDataEventStr = '',
							asideArrow = '<i class="aside-arrow"></i>',
							hasArrow = 'hasArrow';
						if(typeof no.callback === 'function' ){
							topDataEventStr = 'data-event';
							ei++;
						}
						if(!(Array.isArray(no.childList) && no.childList.length>0)){
							asideArrow = '';
							hasArrow = '';
						}
						asideMini += '<li>'
								+ '<div class="option-wrap '+hasArrow+'" '+topDataEventStr+'>'
								+ 	'<i class="t-aside-icon"></i>'
								+ 	'<span class="aside-text">'+no.text+'</span>'
								+ 	asideArrow
								+ '</div><div class="aside-node"><ul class="childList">';
						if(Array.isArray(no.childList) && no.childList.length>0){
							$.each(no.childList,function(ci,co){
								var twoDataEventStr = '';
								if(typeof co.callback === 'function' ){
									twoDataEventStr = 'data-event';
								}
								asideMini += '<li>'
										+	'<div class="option-wrap" '+twoDataEventStr+'>'
										+		'<span class="aside-text">'+co.text+'</span>'
										+	'</div>'
										+'</li>';
							});
						}
						asideMini += '</ul></div></li>';
					})
					asideMini += '</ul></div></div></li></ul></div></div>';
				} else if(asideType === 1){
					//渲染左导航(少)
					//渲染导航头按钮
					asideMini +='<div class="t-aside-mini" >'
							+	'<div class="t-caption-title">'
							+		'<div class="option-wrap">' + asideHeaderBtn +'</div>'
							+	'</div>';
					//渲染导航体
					asideMini +='<div class="aside-option"> <ul class="root-ul">';
					
					//拼接导航体
					$.each(asideBody,function(ni,no){
						var btnIconTop = no.btnIcon?no.btnIcon:'',
							eventStr = '',
							cursor = '';
						if(typeof no.callback === 'function' ){
							eventStr = 'data-event';
							cursor = 'style="cursor:pointer;"'
						}
						asideMini += '<li><i class="t-aside-icon '+btnIconTop+'"></i>'
								+ '<div class="mini-option-wrap">'
								+ 	'<span class="title-option" '+eventStr+' '+cursor+'>'+no.text+'</span>'
								+ '<div class="aside-node dvScrollBar"><ul>';
						if(Array.isArray(no.childList) && no.childList.length>0){
							$.each(no.childList,function(ci,co){
								var btnIconTwo = co.btnIcon?co.btnIcon:'',
									twoDataEventStr = '',
									asideArrow = '<i class="aside-arrow"></i>',
									hasArrow = 'hasArrow';
								if(typeof co.callback === 'function' ){
									twoDataEventStr = 'data-event';
								}
								if(!(Array.isArray(co.childList) && co.childList.length>0)){
									asideArrow = '';
									hasArrow = '';
								}
								asideMini += '<li>'
										+	'<div class="option-wrap '+hasArrow+'" '+twoDataEventStr+'>'
										+		'<i class="t-aside-icon '+btnIconTwo+'"></i>'
										+		'<span class="aside-text">'+co.text+'</span>'
										+		asideArrow
										+	'</div><div class="aside-node"><ul class="childList">';
								if(Array.isArray(co.childList) && co.childList.length>0){			
									$.each(co.childList, function(cci,cco) {
										var threeDataEventStr = '';
										if(typeof cco.callback === 'function' ){
											threeDataEventStr = 'data-event';
										}
										asideMini += '<li>'
												+	'<div class="option-wrap"'+threeDataEventStr+'>'
												+		'<span class="aside-text">'+cco.text+'</span>'
												+	'</div>'
												+'</li>';
									});
								}
								asideMini +='</ul></div></li>';
							})
						}
						asideMini += '</ul></div></div></li>';
					})
					asideMini += '</ul></div></div>';
				}
				return asideMini;		
			}
		},{
			key:'bind',
			value:function bind(){
				var self = this,
					$element = self.$element,
					toolBox = self.options.toolBox,
					asideType = self.options.asideType,
					cbHeader = self.options.asideHeader.callback,
					cbList = self.cbList,
					asideBtn = toolBox.asideBtn,
					switchType = toolBox.switchType;
				
				//处理cbList和cbHeader
				cbHeader = cbHeader?cbHeader:function(){return true};
				
				if(asideBtn){
					$element.on('click','.asideBtn',function(){
						if(!$(this).hasClass('active')){
							$(this).addClass('active').siblings(':not(.t-aside-mini)').animate({
								width: 50
							}, 200, function() {
								$(this).hide().siblings('.t-aside-mini').show();
							});
						}
						else{
							var asideStr = asideType === 0 ?'.t-aside-more':'.t-aside-less';
							$(this).removeClass('active').siblings('.t-aside-mini').hide().siblings(asideStr).show().animate({
								width:220
							},200);
						}
					});
				}
				//判断导航类型，绑定事件
				//多
				var leDvIndex = 0;//4.1 添加less <=>mini  映射下标  
				if(	asideType === 0 ){
					//顶层菜单都是手风琴效果
					//手风琴
					//3.22 补充添加只有1级的情况
					$element.on('click','.t-aside-more .dvScrollBar',function(){
						if(!$(this).hasClass('active')){
							if($(this).children('.aside-node').height() == 0){
								$(this).addClass('active').children('.option-wrap').find('.aside-text').css('color','#57a3f1')
									.closest('.dvScrollBar').siblings().css({
									overflow:'',
									height:'auto'
								}).removeClass('active').children('.option-wrap').find('.aside-text').css('color','')
								.parent().siblings('.aside-node').slideUp(200);
							}else {
								$(this).children('.aside-node').slideDown(200,$.proxy(function(){
									utils.isShowScroll('unmini',this);
								},this)).parent().addClass('active').siblings().css({
									overflow:'',
									height:'auto'
								}).removeClass('active').children('.option-wrap').find('.aside-text').css('color','')
								.parent().siblings('.aside-node').slideUp(200);
							}
							//3.31 添加映射关系：展开=>缩小
							var dvIndex = $(this).index();
							$('.t-aside-mini .dvScrollBar>ul>li').eq(dvIndex).addClass('active').find('.childList').show()
								.closest('.active').siblings('.active').removeClass('active').find('.childList').hide();
						}
					});
					//给more部分绑定事件
					$element.children('.t-aside-more').find('[data-event]').each(function(ei,edom){
						var curEvent = cbList[ei];
						//3.22为事件元素补充样式
						$(edom).click(function(){
							if(!$(this).hasClass('focus')){
								$(this).closest('.root-ul').find('.focus').removeClass('focus');
								$(this).addClass('focus');
							}
							curEvent();
						});
					});
				}else if(asideType === 1){
					//少	
					//顶层菜单一定是手风琴的效果
					//3.22 补充添加只有1级的情况
					
					//4.1  添加映射：展开=>缩小
					$element.on('click','.t-aside-less .dvScrollBar',function(){
						if(!$(this).hasClass('active')){
							if($(this).children('.aside-node').height() == 0){
								$(this).addClass('active').children('.option-wrap').find('.aside-text').css('color','#57a3f1')
									.closest('.dvScrollBar').siblings().css({
									overflow:'',
									height:'auto'
								}).removeClass('active').children('.option-wrap').find('.aside-text').css('color','')
								.parent().siblings('.aside-node').slideUp(200);
							} else {
								$(this).children('.aside-node').slideDown(200,$.proxy(function(){
									utils.isShowScroll('unmini',this);
								},this)).parent().addClass('active').siblings().css({
									overflow:'',
									height:'auto'
								}).removeClass('active').children('.option-wrap').find('.aside-text').css('color','')
								.parent().siblings('.aside-node').slideUp(200);
								//4.1
								leDvIndex = $(this).index();
							}
						}
					});
					if(switchType === 0 ){
						$element.on('click','.t-aside-less .dvScrollBar>.aside-node .hasArrow',function(){
							if(!$(this).parent().hasClass('active')){
								$(this).siblings('.aside-node').slideDown(200,$.proxy(function(){
									utils.isShowScroll('unmini',this);
								},this)).parent().toggleClass('active').siblings().removeClass('active').children('.aside-node').slideUp(200);
								//4.1 
								var sIndex = $(this).parent().index();
								$('.t-aside-mini .root-ul>li').eq(leDvIndex).find('.dvScrollBar>ul>li').eq(sIndex).addClass('active')
									.find('.childList').show().closest('.active').siblings('.active').removeClass('active').find('.childList').hide();
							}
						});
					}
					//4.1 只保留手风琴效果，去除点击即打开的效果
					
					//给less部分绑定事件
					$element.children('.t-aside-less').find('[data-event]').each(function(ei,edom){
						var curEvent = cbList[ei];
						$(edom).click(function(){
							//3.22为事件元素补充样式
							if(!$(this).hasClass('focus')){
								$(this).closest('.root-ul').find('.focus').removeClass('focus');
								$(this).addClass('focus');
							}
							curEvent();
						});
					});
				}
				
				//mini部分
				if(switchType === 0){
					$element.on('click','.t-aside-mini .dvScrollBar>ul>li>.hasArrow',function(){
						if(!$(this).parent().hasClass('active')){
							$(this).siblings('.aside-node').find('.childList').slideDown(200,$.proxy(function(){
								utils.isShowScroll('mini',this);
							},this)).closest('li').toggleClass('active')
							.siblings().removeClass('active').find('.childList').slideUp(200);
							
							//4.1  缩小=>展开
							var mlIndex = $(this).parent().index(),
								leDvIndex = $(this).closest('.root-ul>li').index();
							if($('.t-aside-more')[0]){
								$('.t-aside-more .dvScrollBar').eq(mlIndex).addClass('active').siblings('.active').removeClass('active');
							}else if($('.t-aside-less')[0]){
								$('.t-aside-less .root-ul>li').eq(leDvIndex).addClass('active').find('.aside-node>ul>li').eq(mlIndex)
									.addClass('active').children('.aside-node').show().closest('.active').siblings('.active').removeClass('active')
									.children('.aside-node').hide();
								$('.t-aside-less .root-ul>li').eq(leDvIndex).siblings('.active').removeClass('active');
							}
						}
					});
				}
				//4.1 只保留手风琴效果，去除点击即打开的效果
//				else if (switchType === 1){
//					$element.on('click','.t-aside-mini .dvScrollBar>ul>li>.hasArrow',function(){
//						$(this).parent().toggleClass('active').find('.childList').slideToggle(200);
//						untils.isShowScroll('mini',this);
//					});
//				}
				//给mini部分绑定事件
				$element.children('.t-aside-mini').find('[data-event]').each(function(ei,edom){
					var curEvent = cbList[ei];
					//3.22为事件元素补充样式
					$(edom).click(function(){
						if(!$(this).hasClass('focus')){
							$(this).closest('.root-ul').find('.focus').removeClass('focus');
							$(this).addClass('focus');
						}
						curEvent();
					});
				});
				
				//公共部分
				$element.on('click','.headerSwitch',function(){
					//3.21 不收起来
					$(this).closest('.t-caption-title').parent().animate({
						width: 50
					}, 0, function() {
						$(this).hide().siblings('.t-aside-mini').show();
					});
					cbHeader(this);
				});
				$element.on('click','.t-aside-mini>.t-caption-title .aside-btn',function(){
					var asideStr = asideType === 0 ?'.t-aside-more':'.t-aside-less';
					//3.21 	不收起来
					$(this).closest('.t-aside-mini').hide().siblings(asideStr).show().animate({
						width:220
					},200);
					cbHeader(this);
				});
				
			}
		},{
			key:'activateTopItem',
			value:function activatetopItem(index){
				//4.22 	激活指定顶级菜单选项
				var self = this,
					$element = self.$element;
				//5.3 调整activateTopItem的方式=>激活对应dvScrollBar的click事件
				if($element.find('.t-aside-more')[0]){
					$element.find('.moreChildList').children('.dvScrollBar').eq(index).trigger('click');
				}else if($element.find('.t-aside-less')[0]){
					$element.find('.root-ul').children('.dvScrollBar').eq(index).trigger('click');
				}
			}
		}]);
		
		return Aside ;
	}()
	
	var NAMESPACE = 'aside';
	
	$.fn.aside = function jQueryAside(option) {
		//外面的this指向jQuery对象,each里面的this指向jQuery中的dom对象
		this.each(function each() {
			var $this = $(this).append('<div class="t-aside fn-clear"></div>'),
				$aside = $this.children('.t-aside');
			//4.14	处理容器元素z-index不高，导致点透效果
			$(this).css('zIndex',999);
			//把实例通过节点data属性暴露给外部,用以获取
			$this.data(NAMESPACE, new Aside($aside, option));
		});
		return this;
	};
}(jQuery))