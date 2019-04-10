(function($, Constructor) {
	if(!$) console.error('no jQuery !');

	win = this ? this : window;
	win.Panel = Constructor;
})(window.jQuery, function() {
	function Panel($el, opt) {
		this.$el = $el;
		this.opt = opt;
		this.init();
	}
	var utils = {
		isTypeOf: function(o) {
			var t = {}.toString.call(o).toLowerCase();
			return t.slice(8, t.indexOf(']'))
		}
	}
	var _prototype = {
		init: function() {
			this
				.defaultConfig()
				.fillHtml()
				.getContent()
				.status()
				.bindEvent();
		},
		defaultConfig: function() {
			var DEFAULT = {
				style: {
					current: 0,
					average: false,
					animate: true,
					simple: {
						isOpen: false,
						target: '',
						cb: null,
					},
					css: {}
				},
				tabs: [],
				tools: [],
				beforeShrink: null,
				afterShrink: null,
			};
			this.opt = $.extend(true, {}, DEFAULT, this.opt);
			return this;
		},
		getTabs: function() {
			var opt = this.opt;
			var $el = this.$el;
			var tabsStr = '<ul class="panel-tab-ul">';
			var isSingle = opt.tabs.length === 1 ? 'single-li' : '';
			var isCurrent = opt.style.current;
			$.each(opt.tabs, function(k, v) {
				var tab = $.extend(true, {}, {
					text: '---',
					template: '',
					cb: null,
				}, v);
				var isActive = isCurrent === k && (opt.tabs.length !== 1) ? 'active' : ''
				tabsStr += '<li class="' + isSingle + ' ' + isActive + '">' + tab.text + '</li>'
			});
			tabsStr += '</ul>';
			return opt.tabs.length > 0 ? tabsStr : '';
		},
		getTools: function() {
			var opt = this.opt;
			var $el = this.$el;
			var toolsStr = '<ul class="panel-function-ul">';
			$.each(opt.tools, function(k, v) {
				var tool = $.extend(true, {}, {
					cssName: '',
					cb: null,
				}, v);
				var isActive = '';
				if(tool.cssName.toLowerCase() === 'panel-downarrow' && !opt.style.isOpen) {
					isActive = 'active'
				}
				toolsStr += `<li class="${ tool.cssName } ${ isActive }"></li>`
			});
			toolsStr += '</ul>';
			return opt.tools.length > 0 ? toolsStr : '';
		},
		getContent: function(index) {
			var opt = this.opt;
			var $el = this.$el;
			var currentIndex;
			if(index || index === 0) {
				currentIndex = index;
			} else if(index === undefined) {
				currentIndex = opt.style.current;
			}
			var url = opt.tabs[currentIndex].url;
			var domData = opt.tabs[currentIndex].domData;
			var content = opt.tabs[currentIndex].template;
			var type = utils.isTypeOf(content);
			var container = $el.find('.t-panel-container');
			var hideCss = opt.style.simple && opt.style.simple.target || null;
			var isExist = container.find('.item-' + 　currentIndex).length > 0;
			var indexWrap = $('<li class="item-' + currentIndex + '"></li>');
			var tabs = $el.find('.panel-tab-ul').children('li');
			var btnStatus = function(o) {
				var miniBtn = $el.find('.panel-shrink-btn');
				var hidePart = container.children('.item-' + currentIndex).find(hideCss);
				if(o && opt.style.simple && !opt.style.simple.isOpen) {
						hidePart.hide()
					}
				if(hideCss && hidePart.length > 0) {
					miniBtn.show();
					hidePart.css('display').toLowerCase() === 'none' 
					&& miniBtn.addClass('active') 
					|| miniBtn.removeClass('active');
				} else {
					miniBtn.hide()
				}
			}
			opt.tabs.length !== 1 && tabs.removeClass('active').eq(currentIndex).addClass('active');
			if(isExist) {
				indexWrap = $el.find(indexWrap);
				indexWrap.show();
				btnStatus(0);
			} else {
				container.children('li').hide();
				container.append(indexWrap);
				if(url) {
					indexWrap.load(url, function() {
						//cb ???
						btnStatus(1);
					});
				} else if(type === 'string') {
					indexWrap.html(content)
				} else if(type === 'function') {
					var resultContent = content(indexWrap);
					resultContent && indexWrap.html(resultContent);
				} else {
					return new Error('wrong type !');
				}
				btnStatus(1);
			}
			return this;
		},
		status: function() {
			var opt = this.opt;
			var $el = this.$el;
			var container = $el.find('.t-panel-container');
			var title = $el.find('.t-panel-title');
			var tabs = title.children('.panel-tab-ul').children('li');
			if(opt.style && !opt.style.isOpen) container.children('').hide();
			if(opt.style.average) {
				console.log(title.width());
				console.log(tabs.length);
				tabs.css({
					'width': title.width() / tabs.length,
					'text-align': 'center',
					'box-sizing': 'border-box'
				}).eq(tabs.length - 1).css({
					'border-right': 'none',
				});
				$el.find('.panel-function-ul').remove();
			}
			return this;
		},
		fillHtml: function() {
			var opt = this.opt;
			var $el = this.$el;
			var simpleIsOpen = opt.style.simple && opt.style.simple.isOpen || false;
			var simpleActive = simpleIsOpen ? '' : 'active';
			var btn = opt.style.simple ? '<div class="panel-shrink-btn ' + simpleActive + '"></div>' : '';
			var template = `<div class="t-panel">
								<div class="t-panel-title">
									${ this.getTabs() }
									${ this.getTools() }
								</div>
								<div class="t-panel-content">
									<ul class="t-panel-container"></ul>
								</div>
								${ btn }
							</div>`;
			$el.html(template);
			$el.css(opt.style.css);
			return this;
		},
		bindEvent: function() {
			var _th = this;
			var $el = _th.$el;
			var opt = _th.opt;
			var isDoing = false;
			var simple = opt.style.simple;
			var hideCss = simple && simple.target || null;
			var isAnimate = opt.style.animate ? 'slow' : 0;
			var container = $el.find('.t-panel-container');
			// tabs
			$el.on('click', '.panel-tab-ul li', function() {
				if(opt.tabs.length === 1) return;
				var index = $(this).index();
				_th.getContent(index);
				container.children('li').hide();
				container.children('.item-' + index).show();
				$el.find('li.panel-downarrow').removeClass('active');
				opt.tabs[index].cb && opt.tabs[index].cb($(this), index);
			})
			// 功能按钮
			$el.on('click', '.panel-function-ul li', function() {
				var index = $(this).index();
				opt.tools[index].cb && opt.tools[index].cb($(this), index);
			})
			// 缩小按钮
			$el.on('click', '.panel-function-ul li.panel-downarrow', function() {
				if(isDoing) return;
				
				var currentIndex = $el.find('.panel-tab-ul li.active').index() !== -1
									&& $el.find('.panel-tab-ul li.active').index()
									|| 0;
				var currentItem = container.children('li.item-' + currentIndex);
				
				!isDoing && opt.beforeShrink && opt.beforeShrink();
				isDoing = true;
				
				if($(this).hasClass('active')) {
					$(this).removeClass('active');
					currentItem.slideDown(isAnimate, function() {
						isDoing = false;
						opt.afterShrink && opt.afterShrink();
					});
				} else {
					$(this).addClass('active');
					currentItem.slideUp(isAnimate, function() {
						isDoing = false;
						opt.afterShrink && opt.afterShrink();
					});
				}
			})
			// 简化按钮
			$el.on('click', '.panel-shrink-btn', function() {
				debugger
				if($el.find('.panel-downarrow.active').length > 0 || !hideCss) return;
				var currentIndex = $el.find('.panel-tab-ul li.active').index() !== -1 
									&& $el.find('.panel-tab-ul li.active').index() 
									|| 0;
				var hidePart = container.children('.item-' + currentIndex).find(hideCss);
				if($(this).hasClass('active')) {
					$(this).removeClass('active');
					hidePart.show(isAnimate, function() {
						simple.cb && simple.cb(1)
					})
				} else {
					$(this).addClass('active');
					hidePart.hide(isAnimate, function() {
						simple.cb && simple.cb(0)
					});
				}
			})
		},
		switchTo: function(i) {
			this.getContent(i);
			return this;
		}
	}
	Panel.prototype = _prototype;
	return Panel;
}())