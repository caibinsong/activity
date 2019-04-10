'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (constructor) {
	$.fn.checkboxRadio = function (config) {
		$(this).each(function () {
			new constructor($(this), config).init();
		});
	};
})(function () {
	var checkboxRadio = function checkboxRadio($th, config) {
		_classCallCheck(this, checkboxRadio);

		this.$th = $th;
		this.config = config;
		this.template = null;
		this.zt = Object.create({});
	};

	var type;

	var isLine;

	var template;

	var init = function init() {
		this.defaultConfig().judge().fillHtml().bindEvent();
	};

	var defaultConfig = function defaultConfig() {
		this.config = $.extend(true, {}, {
			defaultVal: '',
			type: 'checkbox',
			orientation: 'vertical'
		}, this.config);
		return this;
	};

	var judge = function judge() {
		console.log(this.config.orientation.toLowerCase());
		isLine = this.zt.isLine = this.config.orientation.toLowerCase() === 'horizontal' ? 'float: left' : 'float: none';
		type = this.zt.type = this.config.type.toLowerCase() === 'radio' ? 'radio' : 'checkbox';
		template = this.tempalte = '<div class="t-form-wrap">';
		return this;
	};

	var fillHtml = function fillHtml(config) {
		$.each(this.config.data.map(function (x) {
			return $.extend(true, {}, x, {
				type: type
			});
		}), function () {
			template += getItem(this);
		});
		template += '</div>';
		this.$th.html(template).append('<input type="hidden" name="' + this.config.id + '" value="' + this.config.defaultVal + '">');

		return this;
	};

	var getItem = function getItem(item) {
		return '<div class="t-' + item.type + '-box" style="' + isLine + '; margin:5px 10px;" data-id="' + item.id + '"> \
			<div class="t-' + item.type + '"></div> \
			<span class="t-' + item.type + '-span">' + item.text + '</span> \
		</div>';
	};

	var bindEvent = function bindEvent() {
		var _th = this;
		this.$th.on('click', '.t-' + type + '-box', function (e) {
			if ($(e.currentTarget).hasClass('t-radio-box')) {
				_th.$th.find('.t-radio').removeClass('active');
				toggleRadio($(this).find('.t-radio'), 'active') ? setVal($(this).data('id')) : null;
			} else if ($(e.currentTarget).hasClass('t-checkbox-box')) {
				toggleCheckbox($(this).find('.t-checkbox'), 'active') ? setVal(forInVal($(this).data('id'), true)) : setVal(forInVal($(this).data('id'), false));
			}
		});

		var forInVal = function forInVal(val, is) {
			var arr = getHidden().val() !== _th.config.defaultVal && getHidden().val() !== '' && getHidden().val().split(',') || new Array();
			var val = val;
			val = typeof val === 'number' ? val.toString() : val;
			if (is) {
				arr.push(val);
			} else {
				$.each(arr, function (k, v) {
					v = typeof v === 'number' ? v.toString() : v;
					if (v == val) {
						arr.splice(k, 1);
					}
				});
			}
			console.log(arr);
			return arr.toString();
		};

		var toggleCheckbox = function toggleCheckbox(ele, cl) {
			if (ele.hasClass(cl)) {
				ele.removeClass(cl);
				return false;
			} else {
				ele.addClass(cl);
				return true;
			}
		};

		var toggleRadio = function toggleRadio(ele, cl) {
			if (!ele.hasClass(cl)) {
				ele.addClass(cl);
				return true;
			}
			return false;
		};

		var setVal = function setVal(val) {
			getHidden().val(val);
		};

		var getHidden = function getHidden() {
			return _th.$th.find('input[name="' + _th.config.id + '"]');
		};

		return this;
	};

	Object.assign(checkboxRadio.prototype, {
		init: init,
		judge: judge,
		fillHtml: fillHtml,
		bindEvent: bindEvent,
		defaultConfig: defaultConfig
	});

	return checkboxRadio;
}());