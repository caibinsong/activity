(function($) {
	//设置默认值
	var DEFAULT = {
		width: '120px',
		require: false,
		text: '---',
		initValue: '',
		content: {
			callBack: false,
			type: 'select',
			multiable: false,
			data: [{
				text: '',
				value: ''
			}]
		}
	};
	var NAMESPACE = 'select';
	//工具函数
	var utils = {
		isHide: function(e, $wrapEle, $openEle) {
			var curTop = $wrapEle.offset().top,
				curLeft = $wrapEle.offset().left,
				curBottom = curTop + $wrapEle.outerHeight(),
				curRight = curLeft + $wrapEle.outerWidth(),
				dpTop = $openEle.offset().top,
				dpLeft = $openEle.offset().left,
				dpBottom = dpTop + $openEle.outerHeight(),
				dpRight = dpLeft + $openEle.outerWidth();
			return !(e.pageX > curLeft && e.pageX < curRight && e.pageY < curBottom && e.pageY > curTop) &&
				!(e.pageX > dpLeft && e.pageX < dpRight && e.pageY < dpBottom && e.pageY > dpTop);

		}
	};

	var Select = function(_this, option) {
		this.oThis = this;
		this._this = $(_this);
		this.options = $.extend(true, {}, DEFAULT, option);
		this.template = null;
		this.data = {
			main: null,
			content: null
		};
	};
	Select.prototype = {
		getData: function() {
			return this.data.main = this.data.content;
		},
		setData: function(data) {
			this.data.content = data;
			return this;
		},
		setDefaults: function(newOption) {
			this.defaults = newOption;
			return this;
		},
		init: function() {
			return this.writeInData().fillHtml().bindEvent();
		},
		writeInData: function() {
			var
				text,
				optionsStr = '',
				contentStr = '',
				
				// 处理选项
				options = this.options,
				multiable = options.content.multiable,	//6.15 针对多选情况
				initValue = options.initValue,	//6.15 针对多选情况
				tempTextArr = [],			//6.15 [针对多选情况]  暂存文本数组
				initva = [],					//6.15 [针对多选情况]  初始值数组
				type = options.content.type;
			var require = options.require ? 'require' : '';
			if( multiable ){
				if( typeof initValue === 'string'){
					initva = initValue.split(',');
				} else {
					initva.push(String(initValue));
				}
				initva.map(function(iv,ii,curArr){
					return curArr[ii] = $.trim(iv);
				})
			}
			
			/*
			 4.21 对select组件进行调整
			 * */
			if(type === 'select') {
				if(options.content.data.length > 0) {
					optionsStr += '<ul>';
					var datas = options.content.data;
					for(var i = 0, length = datas.length; i < length; i++) {
						//4.21 对内容接口调整进行判断
						var item = datas[i],
							dataStr = '',
							selectColorStr = '',		//6.15 添加选定颜色
							value, text;
						if(item.name !== undefined) {
							//旧接口
							value = item.name;
							text = item.value;
							dataStr = 'data-name= ' + value;
						} else if(item.text !== undefined) {
							//新接口
							value = item.value;
							text = item.text;
							dataStr = 'data-value=' + value;
						}
//						console.log(value);
						//5.24 添加initValue影响初始值问题
						if( initValue !== '') {
							//6.15
							if( !multiable
								&& ((typeof value === 'string' && initValue === value)
								|| (typeof value === 'number' && value === parseInt(initValue)))
								) {
									options.text = text;
									selectColorStr = 'class="focus"';
							} else{
								if( initva.indexOf(String(value)) > -1 ){
									selectColorStr = 'class="focus"';	//6.15  添加focus用以标记
									tempTextArr.push(text);
								}
							}
						}
						optionsStr += '<li ' + dataStr + ' '+selectColorStr +'>' + text + '</li>';
					}
					optionsStr += '</ul>';
					//6.15
					if( multiable ){
						options.text = tempTextArr.join(',');
					}
				}
				contentStr = optionsStr;
			} else if(type === 'custom') {
				contentStr = options.content.template;
			}
			//4.11  添加设置选项初始值的方式
			this.template = '<div class="t-select ' + require + '" style="width:' + options.width + '">' +
				'<div class="select-wrap" data-init_value=' + options.initValue + ' data-tvalue = '+ options.initValue +'>' +
				'<span class="select-span">' + options.text + '</span>' +
				'<i class="select-arrow"></i>' +
				'</div>' +
				'<div class="select-option dvScrollBar">' +
				contentStr +
				'</div>' +
				'</div>';
			return this;
		},
		fillHtml: function() {
			var $_this = this._this,
				$curSelect, //4.22 调用元素
				initValue = this.options.initValue, //5.19  调整
				name = this.options.name;
			//4.22 调整元素样式
			$_this.css('display', 'inline-block').empty().append(this.template);
			//4.22 添加一个隐藏的input框用于提交元素
			$curSelect = $_this.find('.t-select');
			//5.19  存在初始值的时候，把初始值放置到input上
			$curSelect.before('<input name="' + name + '" type="hidden" class="t-select-form" value="' + initValue + '"/>')
			return this;
		},
		bindEvent: function() {
			var
				//oThis 指向构造函数内部
				oThis = this.oThis,
				$_this = this._this, //调用元素
				// $this 指向当前t-select jQuery对象
				$this = this._this.find('.t-select'),
				// optionsWrap 为隐藏部分的jQuery对象
				$optionsWrap = $this.find('.select-option'),
				// options 为处理缺省值后的参数
				options = this.options,
				callBack = options.content.callBack;
		
			var mulitable = options.content.multiable; //6.7  添加复选功能
			var contentType = this.options.content.type;
			var $selWrap = $this.find('.select-wrap');
			var $selForm = $_this.find('.t-select-form');
			if(contentType === 'select') {
				//4.22   调整行为
				$optionsWrap.on('click', 'li', function() {
					var value;
					if($(this).data('name') !== undefined) {
						value = $(this).data('name');
					} else if($(this).data('value') !== undefined) {
						value = $(this).data('value');
					}
					if(!mulitable ){
						$(this).addClass('focus').siblings().removeClass('focus');
						$selWrap.attr('data-tvalue', value).children('.select-span').addClass('focus').html($(this).html());
						$selForm.val(value);
						callBack({
							value: value,
							text: $(this).html()
						});
						$optionsWrap.hide();
					}else {
						var curWrapValue = $selWrap.attr('data-tvalue');
						var curSpanHtml  = $selWrap.children('.select-span').html();
						var curSelForm = $selForm.val();
						var tempArr1,tempArr2;
						if(!$(this).hasClass('focus')){
							$(this).addClass('focus');
							if(curWrapValue === '' || curWrapValue === undefined){
								$selWrap.attr('data-tvalue', value).children('.select-span').html($(this).html());
								$selForm.val(value);
							} else{
								tempArr1 = curWrapValue.split(',');
								tempArr1.push(value);
								tempArr2 = $selWrap.children('.select-span').html().split(',');
								tempArr2.push($(this).html());
								$selWrap.attr('data-tvalue', tempArr1.join(',')).children('.select-span').html(tempArr2.join(','));
								$selForm.val(tempArr1.join(','));
							}
						}
						else {
							$(this).removeClass('focus');
							tempArr1 = curWrapValue.split(',');
							tempArr2 = $selWrap.children('.select-span').html().split(',');
							if(tempArr1.length === 1){
								$selWrap.attr('data-tvalue', '').children('.select-span').html('');
								$selForm.val('');
							}else {
								if(typeof value !== 'string'){
									value += '';
								}
								var i = tempArr1.indexOf(value);
								tempArr1.splice(i,1);
								tempArr2.splice(i,1);
								$selWrap.attr('data-tvalue', tempArr1.join(',')).children('.select-span').html(tempArr2.join(','));
								$selForm.val(tempArr1.join(','));
							}
						}
					}
				});
			}
			//4.21  调整这一部分
			$this.on('click.' + NAMESPACE, '.select-wrap', function() {
				//4.17 t-select添加active类
				if(!$this.hasClass('active')) {
					$this.addClass('active').find('.select-option').show();
				} else {
					$this.removeClass('active').find('.select-option').hide();
				}
				//4.22  调整这一部分
				$(document).on('click.' + NAMESPACE, function(e) {
					if(utils.isHide(e, $this, $optionsWrap)) {
						$this.removeClass('active').find('.select-option').hide();
						if(contentType === 'select' && mulitable === true) {
							//6.7  复选功能也支持callback
							callBack({
								value: $selWrap.children('.select-span').html(),
								text: $selForm.val()
							})
						}
						$(this).off('click.' + NAMESPACE);
					}
				});
			});
			return oThis.data;
		}
	};
	$.fn.select = function(option) {
		$(this).each(function() {
			$(this).data('data', new Select(this, option).init());
		});
	}
})(jQuery)