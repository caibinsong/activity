(function($) {
	//默认项配置
	var DEFAULT = {
		defaultShowDate: 1, //是否启用默认展示框     0 表示不启用，1表示启用	
		initValue: '', //初始值	
		readonly: true, //禁止日历选择器的调用元素可输入内容[可选]   true 禁止输入(默认)  false 不禁止		
		dateFormate: 'yyyy/MM/dd', //日期在展示框中展示的格式  'yyyy/mm/dd'  'yyyy-mm-dd'(默认)
		dateType: 'onlyDate', //日历选择器的类型   onlyDate只有日期  onlyTime只有时间  dateAndTime日期+时间   fromToOnlyDate起止日期-结束日期   fromToDateAndTime起止日期+时间-结束日期+时间[默认0]
		position:'absolute'		//针对调用日历选择器组件的场景进行合理调整
	};

	//工具函数
	var utils = {
		fmtDate: function(date, fmt) { // author: meizz
		    var o = {
		        'M+': date.getMonth() + 1, // 月份
		        'd+': date.getDate(), // 日
		        'h+': date.getHours(), // 小时
		        'm+': date.getMinutes(), // 分
		        's+': date.getSeconds(), // 秒
		        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
		        'S': date.getMilliseconds() // 毫秒
		    };
		    if (/(y+)/.test(fmt)) {
		        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
		    }
		    for (var k in o) {
		        if (new RegExp('(' + k + ')').test(fmt)) {
		            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
		        }
		    }
		    return fmt;
		},
		fmtHMS:function(hms,fmt){		//6.5  过滤时分秒
			var hmsa = hms.split(':');
			var o = {
				'h+': hmsa[0], // 小时
		        'm+': hmsa[1], // 分
		        's+': hmsa[2], // 秒
			};
			for (var k in o) {
		        if (new RegExp('(' + k + ')').test(fmt)) {
		            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
		        }
		    }
			return fmt;
		},
		mToCm: function(m) { //转为中文月份
			m = parseInt(m);
			switch(m) {
				case 1:
					return '一月';
					break;
				case 2:
					return '二月';
					break;
				case 3:
					return '三月';
					break;
				case 4:
					return '四月';
					break;
				case 5:
					return '五月';
					break;
				case 6:
					return '六月';
					break;
				case 7:
					return '七月';
					break;
				case 8:
					return '八月';
					break;
				case 9:
					return '九月';
					break;
				case 10:
					return '十月';
					break;
				case 11:
					return '十一月';
					break;
				case 12:
					return '十二月';
					break;
			}
		},
		midScrollTop: function($wrapEle) {
			//根据容器元素计算其中选定元素应该scrollTop的距离
			var secTop = $wrapEle.find('.selected').offset().top,
				secHeight = $wrapEle.find('.selected').height(),
				wrapTop = $wrapEle.offset().top,
				wrapHeight = $wrapEle.height(),
				st = secTop + secHeight / 2 - (wrapTop + wrapHeight / 2);
			return st = st < 0 ? 0 : st;
		},
		isHide: function(e, $curShow, $dpBox) {
			var curTop = $curShow.offset().top,
				curLeft = $curShow.offset().left,
				curBottom = curTop + $curShow.outerHeight(),
				curRight = curLeft + $curShow.outerWidth(),
				dpTop = $dpBox.offset().top,
				dpLeft = $dpBox.offset().left,
				dpBottom = dpTop + $dpBox.outerHeight(),
				dpRight = dpLeft + $dpBox.outerWidth();
			return !(e.pageX > curLeft && e.pageX < curRight && e.pageY < curBottom && e.pageY > curTop) &&
				!(e.pageX > dpLeft && e.pageX < dpRight && e.pageY < dpBottom && e.pageY > dpTop);

		},
		dateTypeTransform: function(dateType) {
			//为了防止以后可能还会dateType的类型
			switch(dateType) {
				case 'onlyDate':
					return 0;
				case 'onlyTime':
					return 1;
				case 'dateAndTime':
					return 2;
				case 'fromToOnlyDate':
					return 3;
				case 'fromToDateAndTime':
					return 4;
			}
		},
		dateIsValid: function(fromDate, endDate) {
			var from = {
					y: fromDate.getFullYear(),
					mon: fromDate.getMonth(),
					d: fromDate.getDate(),
					h: fromDate.getHours(),
					min: fromDate.getMinutes(),
					s: fromDate.getSeconds()
				},
				end = {
					y: endDate.getFullYear(),
					mon: endDate.getMonth(),
					d: endDate.getDate(),
					h: endDate.getHours(),
					min: endDate.getMinutes(),
					s: endDate.getSeconds()
				},
				sign = true; //判断起止时间是否合法
			if(from.y > end.y) { //判断年份
				sign = false;
			} else if(from.y === end.y && from.mon > end.mon) {
				sign = false;
			} else if(from.y === end.y && from.mon === end.mon && from.d >= end.d) {
				sign = false;
			} else if(from.y === end.y && from.mon === end.mon && from.d === end.d && from.h >= end.h) {
				sign = false;
			} else if(from.y === end.y && from.mon === end.mon && from.d === end.d && from.h === end.h && from.min >= end.min) {
				sign = false;
			} else if(from.y === end.y && from.mon === end.mon && from.d === end.d && from.h === end.h && from.min === end.min && from.s >= end.s) {
				sign = false;
			}
			return sign;
		},
		elToDocOffsetDis:function(el,pos){			//6.7  无论元素处于固定定位还是绝对定位的场景，都可以算出其相对对应场景的位移
            // 7.11 修改定位方式
			// var elToDocTop = el.offsetTop;
			// var elToDocLeft = el.offsetLeft;
			var top = 0;
			var left = 0;
			if(pos === 'absolute'){
				top = $(el).offset().top;
				left = $(el).offset().left;
			} else {
				top = el.getBoundingClientRect().top;
				left = el.getBoundingClientRect().left;
			}
			// while(el.offsetParent !== null){
			// 	console.log(el.offsetTop);
			// 	el = el.offsetParent;
			// 	elToDocTop += el.offsetTop;
			// 	elToDocLeft += el.offsetLeft;
			// }
			return {
				top:top,
				left:left
			};
		}
	};

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
	var NAMESPACE = 'datepicker';

	var Datepicker = function() {
		function Datepicker(element, options, eli) {
			this.$element = $(element);
			this.options = $.extend(true, {}, DEFAULT, options);
			this.isRender = false; //标记是否渲染组件元素
			this.output();
			this.bind();
		};

		createClass(Datepicker, [{
			key: 'output',
			value: function output(dateStr) {
				var self = this,
					$element = self.$element,
					position = self.options.position,	//6.7  根据场景调整
					dftshowDate = self.options.defaultShowDate,
					initValue = self.options.initValue,
					fmt = self.options.dateFormate,
					readonly = self.options.readonly,
					dateType = utils.dateTypeTransform(self.options.dateType),
					isRender = self.isRender,
					$datepickerBox = null,
					eleTop = utils.elToDocOffsetDis($element[0], position).top,	//6.7 获取调用元素相对于根节点上边框的差
					eleLeft = utils.elToDocOffsetDis($element[0], position).left,	//6.7 获取调用元素相对于根节点左边框的差
					eleHeight = $element.height(),
					nowDate = new Date(),
					initDate = new Date(nowDate.getFullYear()+'/'+(nowDate.getMonth()+1)+'/'+nowDate.getDate()+' 00:00:00'),//4.27 调整
					dateArr,
					fmtDateStr;	//4.27 日期格式

				/**
				 * 3.25 思路转变：保证t-datepicker-box始终只有一个，
				 * 每次出现，关闭都是render remove 的操作
				 */
				if(!isRender) {
					//未渲染
					if(dftshowDate) {
						//4.18  对每一种日历选择分类选择
						//启用默认
						$element.css('display', 'inline-block');
						if(dateType === 1) { //只有时间	
							$element.append(self.showTime());
						} else { //只有日期,时间和日期，起止日期和终止日期,起止日期时间和终止日期时间
							$element.append(self.showDate());
						}
					} else {
						$element.attr('readonly', readonly);
						//3.24 添加初始值
						if($element[0].nodeName === 'INPUT') {
							//4.19 对input进行样式调整
							if(dateType === 2) {
								$element.css({
									width: 127,
									paddingLeft: '5px',
									paddingRight:0,
									textIndent:0
								});
							} else if(dateType === 3) {
								$element.css({
									width: 154,
									paddingLeft: '5px'
								});
							} else if(dateType === 4) {
								$element.css({
									width: 257,
									paddingLeft: '5px'
								});
							}
							$element.val(initValue);
						}
					}
					//首次渲染的时候把时间挂到调用元素的data-date上
					if(dateType === 1) { //只有时间	
						//4.27  对初始值提供验证
						if(/^[\s]*$/.test(initValue)){
							initValue = undefined;
						}
						$element.data('date', initValue || '00:00:00');
					} else { //只有日期,时间和日期，起止日期和终止日期，起止日期时间和终止日期时间
						//4.27  对初始值提供验证
						if(/^[\s]*$/.test(initValue)){
							initValue = undefined;
						}
						switch(dateType) {
							case 0: //只有日期
								$element.data('date', initValue || utils.fmtDate(initDate, fmt));
								break;
							case 2: //时间和日期
								$element.data('date', initValue || utils.fmtDate(initDate, fmt));
								break;
							case 3: //起止日期和终止日期
								$element.data('date', initValue || utils.fmtDate(initDate, fmt) + '-' + utils.fmtDate(new Date(initDate.setMonth(initDate.getMonth() + 1)), fmt));
								break;
							default:
								$element.data('date', initValue || utils.fmtDate(initDate, fmt) + '-' + utils.fmtDate(new Date(initDate.setMonth(initDate.getMonth() + 1)), fmt));
						}
					}
					self.isRender = true; //首次渲染完成
					return;
				} else {
					if(!$('.t-datepicker-box')[0]) {
						//3.25 通过curIndex来保证datepicker-box出现是跟datepicker-showDate一一对应的
						//4.18 分类选择日历
						var datepickerBox = '<div class="t-datepicker-box">';
						if(dateType === 0) {
							datepickerBox += self.pickerHeader(new Date(dateStr)) + self.pickerTable(new Date(dateStr));
						} else if(dateType === 1) {
							datepickerBox += self.pickerOnlyTime(dateStr.split(':'));
						} else if(dateType === 2) {
							dateArr = dateStr.split(/[\s]+/);
							datepickerBox += self.pickerHeaderDat(new Date(dateArr[0])) + self.pickerTable(new Date(dateArr[0])) + self.datFooter(dateArr[1]);
						} else if(dateType === 3) { //双日期选择框
							dateArr = dateStr.split(/\-(?=[0-9]{4})/);
							var fromDate = dateArr[0], //开始日期
								toDate = dateArr[1]; //终止日期
							datepickerBox += '<div class="fn-clear"><div class="t-doubleDate t-from">' +
								self.pickerHeaderDat(new Date(fromDate)) + self.pickerTable(new Date(fromDate)) +
								'</div><div class="t-doubleDate t-to">' +
								self.pickerHeaderDat(new Date(toDate)) + self.pickerTable(new Date(toDate)) +
								'</div></div>' + self.dbFooter();
						} else if(dateType === 4) { //双日期+时间选择框
							dateArr = dateStr.split(/\-(?=[0-9]{4})/);
							var fromDateArr = dateArr[0].split(/\s+/), //开始日期
								toDateArr = dateArr[1].split(/\s+/); //终止日期
							datepickerBox += '<div class="fn-clear"><div class="t-doubleDate t-from">' +
								self.pickerHeaderDat(new Date(fromDateArr[0])) + self.pickerTable(new Date(fromDateArr[0])) + self.dbDatFooter(fromDateArr[1]) +
								'</div><div class="t-doubleDate t-to">' +
								self.pickerHeaderDat(new Date(toDateArr[0])) + self.pickerTable(new Date(toDateArr[0])) + self.dbDatFooter(toDateArr[1]) +
								'</div></div>' + self.dbFooter();
						}
						datepickerBox += '</div>';
						$datepickerBox = $(datepickerBox);
						
						//6.7  根据场景做出调整
						$datepickerBox.css({
							top: eleTop + eleHeight + 4,
							left: eleLeft,
							position:position
						});
						
						//4.19 补充双日期的样式
						if(dateType === 3 || dateType === 4) {
							$datepickerBox.css({
								width: '566px',
								padding: '8px 7px 0'
							})
						}
						$(document.body).append($datepickerBox);
						//4.18	绑定自定义滚动条
						if(dateType === 1) {
							self.mountSbarAtHmrWrap();
						}
					} else {
						if(dateType === 0) {
							$('.t-datepicker-table').remove();
							$('.t-datepicker-box').append(self.pickerTable(dateStr));
						} else if(dateType === 2) {
							$('.t-datepicker-table').remove();
							$('.t-datepicker-datHeader').after(self.pickerTable(dateStr));
						} else if(dateType === 3 || dateType === 4) {
							//针对dateType=3时的针对判断
							var dbDateType = dateStr.dbDateType,
								date = dateStr.date;
							if(dbDateType === 'from') {
								$('.t-from .t-datepicker-table').remove();
								$('.t-from').children('.t-datepicker-datHeader').after(self.pickerTable(date));
							} else if(dbDateType === 'to') {
								$('.t-to .t-datepicker-table').remove();
								$('.t-to').children('.t-datepicker-datHeader').after(self.pickerTable(date));
							}
						}
					}
				}
			}
		}, {
			key: 'showDate',
			value: function showDate() {
				//4.18  根据日期的类型进行不同的显示
				var self = this,
					dateType = utils.dateTypeTransform(self.options.dateType),
					initValue = self.options.initValue, //4.18 主要是对初始值进行切割分析
					readonly = self.options.readonly ? 'readonly' : '',
					fmt = self.options.dateFormate,
					fmtDate, showDate,
					nowDate = new Date(),
					adjustWidth = '';
				//4.19 不同显示效果
				if(dateType === 0) {
					fmtDate = initValue ? initValue : utils.fmtDate(nowDate, fmt);
				} else if(dateType === 2) {
					if(initValue) {
						initValue = initValue.split('/[\s]+/');
						fmtDate = initValue[0] + ' ' + initValue[1];
					} else {
						fmtDate = utils.fmtDate(nowDate, fmt) + ' 00:00:00';
					}
					adjustWidth = 'style="width:178px;"';
				} else if(dateType === 3) {
					if(initValue) {
						initValue = initValue.split(/\s*\-\s*/);
						fmtDate = initValue[0] + ' - ' + initValue[1];
					} else {
						fmtDate = utils.fmtDate(nowDate, fmt) + ' - ' + utils.fmtDate(new Date(nowDate.setMonth(nowDate.getMonth() + 1)), fmt);
					}
					adjustWidth = 'style="width:206px;"';
				} else if(dateType === 4) {
					if(initValue) {
						initValue = initValue.split(/\s*\-\s*/);
						fmtDate = initValue[0] + ' - ' + initValue[1];
					} else {
						fmtDate = utils.fmtDate(nowDate, fmt) + ' 00:00:00 - ' + utils.fmtDate(new Date(nowDate.setMonth(nowDate.getMonth() + 1)), fmt) + ' 00:00:00';
					}
					adjustWidth = 'style="width:314px;"';
				}
				showDate = '<span class="t-datepicker-showDate"' + adjustWidth + '>' +
					'<b class="calendarIcon"></b>' +
					'<input type="text" value="' + fmtDate + '" class="t-datepicker-input" ' + readonly + ' style="cursor:default;"/>' +
					'<i class="showDate-arrowIcon"></i>' +
					'</span>';
				return showDate;
			}
		}, {
			key: 'showTime',
			value: function showTime() {
				var self = this,
					$element = self.$element,
					initValue = self.options.initValue,
					hour, minute, second, showTime;
				if(initValue) {
					var timeArr = initValue.split(':');
					if(0 <= parseInt(timeArr[0]) < 60) {
						hour = timeArr[0];
					}
					if(0 <= parseInt(timeArr[1]) < 60) {
						minute = timeArr[1];
					}
					if(0 <= parseInt(timeArr[2]) < 60) {
						second = timeArr[2];
					}
				} else {
					hour = '00';
					minute = '00';
					second = '00';
				}
				showTime = '<span class="t-datepicker-showTime">' +
					'<b class="t-showHour">' + hour + '</b>' + '<i>:</i>' +
					'<b class="t-showMinute">' + minute + '</b>' + '<i>:</i>' +
					'<b class="t-showSecond">' + second + '</b>' +
					'</span>';
				return showTime;
			}
		}, {
			key: 'pickerHeader',
			value: function pickerHeader(date) {
				var self = this,
					pcHeaderStr = '';
				date = date ? date : new Date();
				var ny = date.getFullYear(),
					nm = date.getMonth();

				pcHeaderStr += '<div class="t-datepicker-boxHeader">' +
					'<span class="t-selectYear" data-value="' + ny + '">' + ny + '<i class="header-arrow"></i></span>' +
					'<span class="t-selectMonth" data-value="' + (nm + 1) + '">' + utils.mToCm(nm + 1) + '<i class="header-arrow"></i></span>' +
					'<b class="t-datepicker-empty">清&nbsp;空</b>';

				//渲染年份列表
				pcHeaderStr += '<div class="t-yearBox"><ul class="t-yearList dvScrollBar">';
				for(var y = 1901; y < 2050; y++) {
					if(y === ny) {
						pcHeaderStr += '<li data-value="' + y + '" class="selected">' + y + '</li>';
					} else {
						pcHeaderStr += '<li data-value=' + y + '>' + y + '</li>';
					}
				}
				pcHeaderStr += '</ul></div><div class="t-monthBox"><ul class="t-monthList dvScrollBar">';
				for(var m = 1; m < 13; m++) {
					if(parseInt(nm + 1) === m) {
						pcHeaderStr += '<li data-value="' + m + '" class="selected">' + utils.mToCm(m) + '</li>';
					} else {
						pcHeaderStr += '<li data-value=' + m + '>' + utils.mToCm(m) + '</li>';
					}
				}
				pcHeaderStr += '</ul></div></div>';
				return pcHeaderStr;
			}
		}, {
			key: 'pickerHeaderDat', //时间和日期头部
			value: function pickerHeaderDat(date) {
				var self = this,
					pcHeaderStr = '';
				date = date ? date : new Date();
				var ny = date.getFullYear(),
					nm = date.getMonth();
				pcHeaderStr += '<div class="t-datepicker-boxHeader t-datepicker-datHeader">' +
					'<span class="t-selectYear" data-value="' + ny + '">' + ny + '<i class="header-arrow"></i></span>' +
					'<span class="t-selectMonth" data-value="' + (nm + 1) + '">' + utils.mToCm(nm + 1) + '<i class="header-arrow"></i></span>';
				//渲染年份列表
				pcHeaderStr += '<div class="t-yearBox"><ul class="t-yearList dvScrollBar">';
				for(var y = 1901; y < 2050; y++) {
					if(y === ny) {
						pcHeaderStr += '<li data-value="' + y + '" class="selected">' + y + '</li>';
					} else {
						pcHeaderStr += '<li data-value=' + y + '>' + y + '</li>';
					}
				}
				pcHeaderStr += '</ul></div><div class="t-monthBox"><ul class="t-monthList dvScrollBar">';
				for(var m = 1; m < 13; m++) {
					if(parseInt(nm + 1) === m) {
						pcHeaderStr += '<li data-value="' + m + '" class="selected">' + utils.mToCm(m) + '</li>';
					} else {
						pcHeaderStr += '<li data-value=' + m + '>' + utils.mToCm(m) + '</li>';
					}
				}
				pcHeaderStr += '</ul></div></div>';
				return pcHeaderStr;
			}
		}, {
			key: 'pickerTable',
			value: function pickerTable(date) {
				var self = this;
				date = date ? date : new Date();
				var ynow = date.getFullYear(), //年份
					mnow = date.getMonth(), //月份
					dnow = date.getDate(), //选定日期
					firstDay = new Date(ynow, mnow, 1).getDay(), //当月第一天星期几
					leap = ynow % 100 === 0 ? (ynow % 400 === 0 ? 1 : 0) : (ynow % 4 === 0 ? 1 : 0),
					msArray = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
					dthStr = '<div class="t-datepicker-table"><table>' +
					'<tr>' +
					'<th class="week">日</th>' +
					'<th>一</th>' +
					'<th>二</th>' +
					'<th>三</th>' +
					'<th>四</th>' +
					'<th>五</th>' +
					'<th class="week">六</th>' +
					'</tr>';
				var nowDate = new Date();
				for(var i = 0; i < 6; i++) { //外层for语句 - tr标签
					dthStr += '<tr>';
					for(var k = 0; k < 7; k++) { //内层for语句 - td标签
						//关键START
						var idx = i * 7 + k, //表格单元的自然序号
							week = '',
							dateStr = idx - firstDay + 1; //计算日期
						//END
						if(firstDay === 0) {
							dateStr = idx - 6;
						}
						if(dateStr <= 0) {
							var mi = mnow === 0 ? msArray.length : mnow;
							dthStr += '<td class="invalid">' + (dateStr + msArray[mi - 1]) + '</td>';
						} else if(dateStr > msArray[mnow]) {
							dthStr += '<td class="invalid">' + (dateStr - msArray[mnow]) + '</td>';
						} else {
							if(ynow === nowDate.getFullYear() && mnow === nowDate.getMonth() && nowDate.getDate() === dateStr) {
								if(dnow === dateStr) {
									dthStr += '<td class="curDate selected"><span>' + dateStr + '</span></td>';
								} else {
									dthStr += '<td class="curDate "><span>' + dateStr + '</span></td>';
								}
							} else if(dnow === dateStr) {
								dthStr += '<td class="selected"><span>' + dateStr + '</span></td>';
							} else {
								week = (idx % 7 === 0 || idx % 7 === 6) ? 'week' : '';
								dthStr += '<td class="' + week + '"><span>' + dateStr + '</span></td>';
							}
						}
					}
					dthStr += '</tr>';
				}
				dthStr += '</table></div>';

				return dthStr;
			}
		}, {
			key: 'datFooter',
			value: function datFooter(timeStr) {
				var self = this,
					$element = self.$element,
					timeArr = timeStr.split(':'),
					hour = timeArr[0],
					minute = timeArr[1],
					second = timeArr[2],
					datFooter = '<div class="t-datepicker-datFooter">' +
					'<b class="t-showHour">' + hour + '</b>' + '<i>:</i>' +
					'<b class="t-showMinute">' + minute + '</b>' + '<i>:</i>' +
					'<b class="t-showSecond">' + second + '</b>' +
					'<button class="t-datepicker-empty">清空</button><button class="t-datYes">确认</button></div>';
				return datFooter;
			}
		}, {
			key: 'dbFooter',
			value: function dbFooter() {
				return '<p class="t-datepicker-dbFooter"><button class="t-datepicker-empty">清空</button><button class="t-datYes">确认</button></p>';
			}
		}, {
			key: 'dbDatFooter',
			value: function dbDatFooter(timeStr) {
				var self = this,
					$element = self.$element,
					timeArr = timeStr.split(':'),
					hour = timeArr[0],
					minute = timeArr[1],
					second = timeArr[2],
					dbDatFooter = '<div class="t-datepicker-datFooter t-dbDatFooter">' +
					'<b class="t-showHour">' + hour + '</b>' + '<i>:</i>' +
					'<b class="t-showMinute">' + minute + '</b>' + '<i>:</i>' +
					'<b class="t-showSecond">' + second + '</b></div>';
				return dbDatFooter;
			}
		}, {
			key: 'pickerOnlyTime',
			value: function pickerOnlyTime(timeArr) {
				var self = this,
					onlyTimeStr = '<div class="t-datepicker-onlyTime">' +
					'<div class="onlyTime-showHMS fn-clear"><div class="showHour"><span>小时</span>' +
					'<div class="t-datepicker-wrap"><ul class="hourContent t-scrollContent">',
					selectHour = parseInt(timeArr[0]),
					selectMinute = parseInt(timeArr[1]),
					selectSecond = parseInt(timeArr[2]);
				//6.15 初始值可能出现  '13'  '13:00'
				if(timeArr[1] === undefined){
					selectMinute = 0;
				}
				if(timeArr[2] === undefined){
					selectSecond = 0;
				}
				for(var i = 0; i < 24; i++) {
					var selectStr = '';
					if(i === selectHour) {
						selectStr = ' class="selected"';
					}
					if(0 <= i && i < 10) {
						onlyTimeStr += '<li' + selectStr + '>0' + i + '</li>';
					} else {
						onlyTimeStr += '<li' + selectStr + '>' + i + '</li>';
					}
				}
				onlyTimeStr += '</ul></div></div>';
				for(var i = 0; i < 120; i++) {
					//添加选定类selected
					var selectStr = '';
					if(parseInt(i / 60) === 0 && (i % 60) === selectMinute) {
						selectStr = ' class="selected"';
					} else if(parseInt(i / 60) === 1 && (i % 60) === selectSecond) {
						selectStr = ' class="selected"';
					}
					if((i / 60) === 0) {
						onlyTimeStr += '<div class="showMinute"><span>分钟</span><div class="t-datepicker-wrap"><ul class="minuteContent t-scrollContent">';
					} else if((i / 60) === 1) {
						onlyTimeStr += '<div class="showSecond"><span>秒数</span><div class="t-datepicker-wrap"><ul class="secondContent t-scrollContent">';
					}
					if(0 <= (i % 60) && (i % 60) < 10) {
						onlyTimeStr += '<li' + selectStr + '>0' + (i % 60) + '</li>';
					} else if((i % 60) === 59) {
						onlyTimeStr += '<li' + selectStr + '>' + (i % 60) + '</li></ul></div></div>';
					} else {
						onlyTimeStr += '<li' + selectStr + '>' + (i % 60) + '</li>';
					}
				}
				onlyTimeStr += '</div><p><button class="onlyTime-btn">确认</button></p></div>';
				return onlyTimeStr;
			}
		}, {
			key: 'datShowTime',
			value: function datShowTime(timeArr) {
				var self = this,
					datShowTimeStr = '<div class="t-datepicker-datShowTime"><p>时间选择<i class="t-datShowTime-close"></i></p>' +
					'<div class="t-datepicker-onlyTime">' +
					'<div class="onlyTime-showHMS fn-clear"><div class="showHour"><span>小时</span>' +
					'<div class="t-datepicker-wrap"><ul class="hourContent t-scrollContent">',
					selectHour = parseInt(timeArr[0]),
					selectMinute = parseInt(timeArr[1]),
					selectSecond = parseInt(timeArr[2]);
				for(var i = 0; i < 24; i++) {
					var selectStr = '';
					if(i === selectHour) {
						selectStr = ' class="selected"';
					}
					if(0 <= i && i < 10) {
						datShowTimeStr += '<li' + selectStr + '>0' + i + '</li>';
					} else {
						datShowTimeStr += '<li' + selectStr + '>' + i + '</li>';
					}
				}
				datShowTimeStr += '</ul></div></div>';
				for(var i = 0; i < 120; i++) {
					//添加选定类selected
					var selectStr = '';
					if(parseInt(i / 60) === 0 && (i % 60) === selectMinute) {
						selectStr = ' class="selected"';
					} else if(parseInt(i / 60) === 1 && (i % 60) === selectSecond) {
						selectStr = ' class="selected"';
					}
					if((i / 60) === 0) {
						datShowTimeStr += '<div class="showMinute"><span>分钟</span><div class="t-datepicker-wrap"><ul class="minuteContent t-scrollContent">';
					} else if((i / 60) === 1) {
						datShowTimeStr += '<div class="showSecond"><span>秒数</span><div class="t-datepicker-wrap"><ul class="secondContent t-scrollContent">';
					}
					if(0 <= (i % 60) && (i % 60) < 10) {
						datShowTimeStr += '<li' + selectStr + '>0' + (i % 60) + '</li>';
					} else if((i % 60) === 59) {
						datShowTimeStr += '<li' + selectStr + '>' + (i % 60) + '</li></ul></div></div>';
					} else {
						datShowTimeStr += '<li' + selectStr + '>' + (i % 60) + '</li>';
					}
				}
				datShowTimeStr += '</div></div>';
				return datShowTimeStr;
			}
		}, {
			key: 'bind',
			value: function bind() {
				var self = this,
					$element = self.$element,
					dftShowDate = self.options.defaultShowDate,
					dateType = utils.dateTypeTransform(self.options.dateType),
					fmtHMS = utils.fmtHMS,
					initValue = self.options.initValue,
					fmt = self.options.dateFormate;
				/**
				 * 4.18 日历选择期的多功能事件绑定
				 */
				/**
				 * 功能事件
				 */
				//添加点击事件弹出日历弹出框事件
				if(dateType === 0 || dateType === 2 || dateType === 3 || dateType === 4) {
					$element.on('click.' + NAMESPACE, function() {
						if(!$('._datepicker')[0]) {
							var date = $(this).data('date');
							//4.7   针对清空后没有值得清空
							//4.13 补充:针对首次没有选定值就清空,值出现NaN的情况
							//4.18 代码优化
							if(dftShowDate) {
								$(this).children('.t-datepicker-showDate').addClass('focus');
							}
							$element.addClass('_datepicker'); //谁开启弹框，就给他加一个隐形_datepicker  class
							self.output(date);
							if(dateType === 2) {
								//4.18 补充dat页脚功能
								//打开选择时间的功能后绑定事件
								//dat确认时间功能
								$('.t-datepicker-datFooter .t-datYes').click(function() {
									var y = $('.t-selectYear').attr('data-value'),
										mon = $('.t-selectMonth').attr('data-value'),
										d = $('.t-datepicker-table').find('.selected span').html(),
										h = $(this).siblings('.t-showHour').html(),
										min = $(this).siblings('.t-showMinute').html(),
										s = $(this).siblings('.t-showSecond').html(),
										dateStr;
									if($('.t-datepicker-datShowTime')[0]) {
										h = $('.t-datepicker-datShowTime .showHour .selected').html();
										min = $('.t-datepicker-datShowTime .showMinute .selected').html();
										s = $('.t-datepicker-datShowTime .showSecond .selected').html();
									}
									if(parseInt(mon) < 10) {
										mon = '0' + mon;
									}
									//4.27 针对IE下new Date()不支持yyyy-MM-dd问题	    对日期进行调整
									dateStr = utils.fmtDate(new Date(y + '/' + mon + '/' + d + ' ' + h + ':' + min + ':' + s), fmt);
									$element.data('date', dateStr);
									if(dftShowDate) {
										$('._datepicker').find('.t-datepicker-showDate').removeClass('focus').find('.t-datepicker-input').val(dateStr);
									} else {
										$('._datepicker').val(dateStr);
									}
									//4.27
									$('.t-datepicker-box .t-yearList li').off('click');
									$('.t-datepicker-box .t-monthList li').off('click');
									$('.t-datepicker-box td:not(.invalid) span').off('click');
									$(this).off('click');
									$('.t-datepicker-box').remove();
									$('._datepicker').removeClass('_datepicker');
								});
							}
							//4.19 补充双日期的页脚功能
							if(dateType === 3) {
								//打开选择时间的功能后绑定事件
								$('.t-datepicker-dbFooter .t-datYes').click(function() {
									var $fromDate = $('.t-from'),
										$toDate = $('.t-to'),
										fromDateStr = utils.fmtDate(new Date($fromDate.find('.t-selectYear').attr('data-value') + '/' + $fromDate.find('.t-selectMonth').attr('data-value') + '/' + $fromDate.find('.t-datepicker-table .selected span').html()), fmt),
										toDateStr = utils.fmtDate(new Date($toDate.find('.t-selectYear').attr('data-value') + '/' + $toDate.find('.t-selectMonth').attr('data-value') + '/' + $toDate.find('.t-datepicker-table .selected span').html()), fmt),
										sign = true, //保证时间的合法性[开始时间不能超过终止时间]
										fromDate = new Date(fromDateStr),
										toDate = new Date(toDateStr);
									sign = utils.dateIsValid(fromDate, toDate);
									if(sign) {
										$element.data('date', fromDateStr + '-' + toDateStr);
										if(dftShowDate) {
											$('._datepicker').find('.t-datepicker-showDate').removeClass('focus').find('.t-datepicker-input').val(fromDateStr + ' - ' + toDateStr);
										} else {
											$('._datepicker').val(fromDateStr + ' - ' + toDateStr);
										}
										//4.27
										$(this).off('click');
										$('.t-datepicker-box .t-yearList li').off('click');
										$('.t-datepicker-box .t-monthList li').off('click');
										$('.t-datepicker-box td:not(.invalid) span').off('click');
										$('.t-datepicker-box').remove();
										$('._datepicker').removeClass('_datepicker');
									}else{
										$(this).attr('title','开始时间不应超过结束时间');
									}
								});
							}
							//4.19 补充双日期+时间的功能
							if(dateType === 4) {
								//dat确认时间功能
								$('.t-datepicker-dbFooter .t-datYes').click(function() {
									//开始时间
									var sy = $('.t-from').find('.t-selectYear').attr('data-value'),
										smon = $('.t-from').find('.t-selectMonth').attr('data-value'),
										sd = $('.t-from').find('.t-datepicker-table .selected span').html(),
										sh = $('.t-from').find('.t-showHour').html(),
										smin = $('.t-from').find('.t-showMinute').html(),
										ss = $('.t-from').find('.t-showSecond').html(),
										sdateStr;
									if($('.t-from').find('.t-datepicker-datShowTime')[0]) {
										sh = $('.t-from .t-datepicker-datShowTime .showHour .selected').html();
										smin = $('.t-from .t-datepicker-datShowTime .showMinute .selected').html();
										ss = $('.t-from .t-datepicker-datShowTime .showSecond .selected').html();
									}
									if(parseInt(smon) < 10) {
										smon = '0' + smon;
									}
									sDateStr = utils.fmtDate(new Date(sy + '/' + smon + '/' + sd + ' ' + sh + ':' + smin + ':' + ss), fmt);
									//终止时间
									var ey = $('.t-to').find('.t-selectYear').attr('data-value'),
										emon = $('.t-to').find('.t-selectMonth').attr('data-value'),
										ed = $('.t-to').find('.t-datepicker-table .selected span').html(),
										eh = $('.t-to').find('.t-showHour').html(),
										emin = $('.t-to').find('.t-showMinute').html(),
										es = $('.t-to').find('.t-showSecond').html(),
										edateStr, sign = true;
									if($('.t-to').find('.t-datepicker-datShowTime')[0]) {
										eh = $('.t-to .t-datepicker-datShowTime .showHour .selected').html();
										emin = $('.t-to .t-datepicker-datShowTime .showMinute .selected').html();
										es = $('.t-to .t-datepicker-datShowTime .showSecond .selected').html();
									}
									if(parseInt(emon) < 10) {
										emon = '0' + emon;
									}
									//4.27 调整
									eDateStr = utils.fmtDate(new Date(ey + '/' + emon + '/' + ed + ' ' + eh + ':' + emin + ':' + es), fmt);
									//判断起止时间是否合法
									sign = utils.dateIsValid(new Date(sDateStr), new Date(eDateStr));
									if(sign) {
										$element.data('date', sDateStr + '-' + eDateStr);
										if(dftShowDate) {
											$('._datepicker').find('.t-datepicker-showDate').removeClass('focus').find('.t-datepicker-input').val(sDateStr + '-' + eDateStr);
										} else {
											$('._datepicker').val(sDateStr + ' - ' + eDateStr);
										}
										//4.27
										$('.t-datepicker-box .t-yearList li').off('click');
										$('.t-datepicker-box .t-monthList li').off('click');
										$('.t-datepicker-box td:not(.invalid) span').off('click');
										$(this).off('click');
										$('.t-datepicker-box').remove();
										$('._datepicker').removeClass('_datepicker');
									}else{
										$(this).attr('title','开始时间不应超过结束时间');
									}
								});
							}
							if(dateType === 3 || dateType === 4){
								//4.25 初始化结束时间的不合法样式
								var	fy = $('.t-from').find('.t-selectYear').attr('data-value'),
									fm = $('.t-from').find('.t-selectMonth').attr('data-value'),
									fd = $('.t-from').find('.t-datepicker-table .selected span').html();
								$('.t-to').find('.t-yearList li').each(function(){
									if($(this).html() < fy) {
										$(this).addClass('yearInvalid').attr('title', '终止年份不应小于开始年份').css({
											color: '#999',
											cursor: 'default'
										});
									}
								});
								if(fy === $('.t-to').find('.t-selectYear').attr('data-value')){
									$('.t-to').find('.t-monthList li').each(function(){
										if($(this).attr('data-value') < fm) {
											$(this).addClass('monthInvalid').attr('title', '终止月份不应小于开始月份').css({
												color: '#999',
												cursor: 'default'
											});
										}
									});
								}
								if(fy === $('.t-to').find('.t-selectYear').attr('data-value') && fm === $('.t-to').find('.t-selectMonth').attr('data-value')){
									$('.t-to').find('.t-datepicker-table td:not(.invalid) span').each(function(){
										if($(this).html() < fd) {
											$(this).addClass('t-datepicker-dateInvalid').attr('title', '终止日期不应小于开始日期').css({
												color: '#999',
												cursor: 'default'
											});
										}
									});
								}
							}
							//复用功能归总	4.26调整
							if(dateType === 2 || dateType === 4) {
								//打开时间选择框
								$('.t-datepicker-box .t-datepicker-datFooter b').on('click.'+NAMESPACE,function(){
									var $datFooter = $(this).parent().addClass('focus'),
										hour = $datFooter.children('.t-showHour').html(),
										minute = $datFooter.children('.t-showMinute').html(),
										second = $datFooter.children('.t-showSecond').html(),
										timeArr = [hour, minute, second];
									if(dateType === 2) {
										$('.t-datepicker-box').append(self.datShowTime(timeArr));
									} else if(dateType === 4) {
										$(this).closest('.t-doubleDate').append(self.datShowTime(timeArr));
									}
									self.mountSbarAtHmrWrap();
									$('.t-datepicker-datShowTime .t-datepicker-wrap li').click(function() {
										$(this).addClass('selected').siblings().removeClass('selected');
									});
									$('.t-datepicker-datShowTime .t-datShowTime-close').click(function() {
										$(this).closest('.t-datepicker-datShowTime').siblings('.t-datepicker-datShowTime').find('.t-datepicker-wrap li').off('click');
										$(this).off('click');
										$(this).closest('.t-datepicker-datShowTime').siblings('.t-datepicker-datFooter').removeClass('focus').siblings('.t-datepicker-datShowTime').remove();
									});
								});
							}
							/**
							 *4.25  应该是开始时间去限制结束时间，如果两者互相限制，那么开始时间的选择太不自由，用户在选择的时候会很不友好
							 * 		确认的时候对整个起止时间进行限制
							 */
							//4.27 调整事件为datepickerbox出现以后再绑定
							//选定年份的功能
							$('.t-datepicker-box .t-yearList li') .on('click.'+ NAMESPACE + '.datepickerYear',function() {
								var y = $(this).attr('data-value'),
									m = $(this).closest('.t-yearBox').siblings('.t-selectMonth').attr('data-value'),
									$dbDate = $(this).closest('.t-doubleDate');
								if(!$(this).hasClass('yearInvalid')) {
									$(this).addClass('selected').siblings().removeClass('selected')
										.parent().scrollTop(0).closest('.t-yearBox').css('visibility', 'hidden')
										.siblings('.t-selectYear').removeClass('focus').attr('data-value', y).html(y + '<i class="header-arrow"></i>');
								}
								if(dateType === 0 || dateType === 2) {
									self.output(new Date(y + '/' + m + '/' + 1));
								} else {
									if($dbDate.hasClass('t-from')) { //li是属于哪个t-doubleDate里面
										self.output({ dbDateType: 'from', date: new Date(y + '/' + m + '/' + 1) });
										//4.25 添加年份非法的样式
										$(this).closest('.t-datepicker-box').find('.t-to').find('.t-yearList>li').each(function(lidx, ldom) {
											$(ldom).removeClass('yearInvalid').attr('title', '')[0].style = '';
											if($(ldom).html() < y) {
												$(ldom).addClass('yearInvalid').attr('title', '终止年份不应小于开始年份').css({
													color: '#999',
													cursor: 'default'
												});
											}
										});
									} else if($dbDate.hasClass('t-to') && !$(this).hasClass('yearInvalid')) {
										self.output({ dbDateType: 'to', date: new Date(y + '/' + m + '/' + 1) });
										//4.25 补充去触发日期非法的样式
										$dbDate.prev().find('.t-datepicker-table .selected>span').trigger('click.' + NAMESPACE + '.datepickerTd');
										//4.25  清空确认的非法提示
										$('.t-datepicker-dbFooter').find('.t-datYes').attr('title','');
									}
								}
							});
							
							//选定月份的功能
							$('.t-datepicker-box .t-monthList li').on('click.' + NAMESPACE + '.datepickerMonth', function() {
								var m = $(this).attr('data-value'),
									y = $(this).closest('.t-monthBox').siblings('.t-selectYear').attr('data-value'),
									cmStr = utils.mToCm(m) + '<i class="header-arrow"></i>',
									$dbDate = $(this).closest('.t-doubleDate');
								if(!$(this).hasClass('monthInvalid')) {
									$(this).addClass('selected').siblings().removeClass('selected')
										.parent().scrollTop(0).closest('.t-monthBox').css('visibility', 'hidden')
										.siblings('.t-selectMonth').removeClass('focus').attr('data-value', m).html(cmStr);
								}
								if(dateType === 0 || dateType === 2) {
									self.output(new Date(y + '/' + m + '/' + 1));
								} else {
									if($dbDate.hasClass('t-from')) { //li是属于哪个t-doubleDate里面
										self.output({ dbDateType: 'from', date: new Date(y + '/' + m + '/' + 1) });
										//4.25 添加年份非法的样式
										$(this).closest('.t-datepicker-box').find('.t-to').find('.t-monthList>li').each(function(lidx, ldom) {
											$(ldom).removeClass('monthInvalid').attr('title', '')[0].style = '';
											if($(ldom).data('value') < m) {
												$(ldom).addClass('monthInvalid').attr('title', '终止月份不应小于开始月份').css({
													color: '#999',
													cursor: 'default'
												});
											}
										});
									}else if($dbDate.hasClass('t-to') && !$(this).hasClass('monthInvalid')) {
										self.output({ dbDateType: 'to', date: new Date(y + '/' + m + '/' + 1) });
										//4.25 补充去触发日期非法的样式
										$dbDate.prev().find('.t-datepicker-table .selected>span').trigger('click.' + NAMESPACE + '.datepickerTd');
										//4.25  清空确认的非法提示
										$('.t-datepicker-dbFooter').find('.t-datYes').attr('title','');
									}
								}
							});
						
							//选择日期功能
							//5.17 修复onlyDate下点击月份之后不能点击日期的问题
							$('.t-datepicker-box ').on('click.' + NAMESPACE + '.datepickerTd','td:not(.invalid) span',function() {
								if(dateType === 0) {
									var $header = $(this).closest('.t-datepicker-table').siblings('.t-datepicker-boxHeader'),
										y = $header.children('.t-selectYear').attr('data-value'),
										m = $header.children('.t-selectMonth').attr('data-value'),
										d = $(this).html(),
										dateStr = '',
										$_datepicker = $('._datepicker');
									if($_datepicker.find('.t-datepicker-showDate')[0]) {
										dateStr = utils.fmtDate(new Date(y + '/' + m + '/' + d), fmt);
										$_datepicker.find('.t-datepicker-showDate').removeClass('focus').find('.t-datepicker-input').val(dateStr);
									} else {
										//判断容器元素是哪种类型的dom元素
										dateStr = utils.fmtDate(new Date(y + '/' + m + '/' + d), fmt);
										if($_datepicker[0] && $_datepicker[0].nodeName === 'INPUT') {
											$_datepicker.val(dateStr);
										}
									}
									//4.7 针对清空后出现NaN
									$_datepicker.data('date', dateStr).removeClass('_datepicker');
									$('.t-datepicker-box').remove();
								} else if(dateType === 2 || dateType === 3 || dateType === 4) {
									//4.25 当年份和月份相同的时候，判断日期的选定是否合法
									var dbDate = $(this).closest('.t-doubleDate')[0];
									if(dbDate && $(dbDate).hasClass('t-from')) {
										//开始时间
										var $tdbDate = $(dbDate).next(),
											fromDateStr = $(dbDate).find('.t-selectYear').attr('data-value') + '/' +
														$(dbDate).find('.t-selectMonth').attr('data-value') + '/' +
														$(this).html() + ' ',
											toDateStr = $tdbDate.find('.t-selectYear').attr('data-value') + '/' +
											$tdbDate.find('.t-selectMonth').attr('data-value') + '/';
										$tdbDate.find('.t-datepicker-table td:not(.invalid) span').each(function() {
											if(!utils.dateIsValid(new Date(fromDateStr), new Date(toDateStr + $(this).html() + ' '))) {
												$(this).addClass('t-datepicker-dateInvalid').attr('title', '结束日期选择不合法');
											} else {
												$(this).removeClass('t-datepicker-dateInvalid').attr('title', '');
											}
										});
									}
									if(!dbDate || (dbDate && $(dbDate).hasClass('t-from') ) || (dbDate && $(dbDate).hasClass('t-to') && !$(this).hasClass('t-datepicker-dateInvalid'))) {
										$(this).closest('table').find('.selected').removeClass('selected');
										$(this).parent().addClass('selected');
										//4.25  清空确认的非法提示
										$('.t-datepicker-dbFooter').find('.t-datYes').attr('title','');
									}
								}
							});
							}
						});
				} else if(dateType === 1) {
					$element.on('click.' + NAMESPACE, function() {
						if(!$('._datepicker')[0]) {
							$element.addClass('_datepicker').find('.t-datepicker-showTime').addClass('focus'); //谁开启弹框，就给他加一个隐形_datepicker  class
							self.output($element.data('date'));
							//选定hms的样式
							//6.5 通过fmt来确定是否需要时，分，秒，对于不需要的部分不绑定click事件
							if(/hh/.test(fmt)){
								$('.t-datepicker-box .showHour li').on('click.' + NAMESPACE, function() {
									$(this).addClass('selected').siblings().removeClass('selected');
								});
							}
							if(/mm/.test(fmt)){
								$('.t-datepicker-box .showMinute li').on('click.' + NAMESPACE, function() {
									$(this).addClass('selected').siblings().removeClass('selected');
								});
							}
							if(/ss/.test(fmt)){
								$('.t-datepicker-box .showSecond li').on('click.' + NAMESPACE, function() {
									$(this).addClass('selected').siblings().removeClass('selected');
								});
							}
//							$('.t-datepicker-box .t-datepicker-wrap li').on('click.' + NAMESPACE, function() {
//								$(this).addClass('selected').siblings().removeClass('selected');
//							});
							$('.t-datepicker-box .onlyTime-btn').on('click.' + NAMESPACE, function() {
								var $wraps = $('.t-datepicker-onlyTime .t-datepicker-wrap'),
									hour = $wraps.eq(0).find('.selected').html(),
									minute = $wraps.eq(1).find('.selected').html(),
									second = $wraps.eq(2).find('.selected').html();
								$element.data('date', hour + ':' + minute + ':' + second)
								if(dftShowDate) {
									$element.find('.t-showHour').html(hour).siblings('.t-showMinute').html(minute).siblings('.t-showSecond').html(second);
								} else {
									//6.5 在input框的情况下可以过滤时分秒
									$element.val(fmtHMS(hour + ':' + minute + ':' + second,fmt));
								}
								$('.t-datepicker-box .t-datepicker-wrap li').off('click.' + NAMESPACE);
								$('.t-datepicker-box .onlyTime-btn').off('click.' + NAMESPACE);
								$('.t-datepicker-box').remove();
								$('._datepicker').removeClass('_datepicker').find('.t-datepicker-showTime').removeClass('focus');
							});
						}
					});
				}
			}
		}]);
		//补充跟datepicker相关公用的一些小方法
		Datepicker.prototype.mountSbarAtHmrWrap = function() {
			$('.onlyTime-showHMS').find('.t-datepicker-wrap').each(function() {
				if(!$(this).find('.t-scrollBoxY')[0]) {
					var st = utils.midScrollTop($(this)),
						scaleY = $(this).height() / $(this).children('ul').height(),
						st = st * scaleY;
					$(this).customScrollBar({
						scrollBoxCssY: {
							backgroundColor: '#f1f1f3'
						},
						initShiftValue: {
							top: st
						}
					});
				}
			});
		}
		return Datepicker;
	}();

	//4.7 针对事件重复绑定的修正[功能复用归总]
	var dpSinglerBind = function() {
		var self = Datepicker.prototype;
		//关闭
		//关闭弹出框
		$(document).on('click.' + NAMESPACE, function(e) {
			//4.14  针对可能存在._datepicker元素没有，但.t-datepicker-box仍存在的情况 
			if(!$('._datepicker')[0] || $('.t-datepicker-box')[0] && $('._datepicker')[0] && utils.isHide(e, $('._datepicker'), $('.t-datepicker-box'))) {
				if($('._datepicker')[0]) {
					//4.18  补充对showTime样式的移除
					if($('._datepicker').find('.t-datepicker-showDate')[0]) {
						$('._datepicker').find('.t-datepicker-showDate').removeClass('focus');
					} else if($('._datepicker').find('.t-datepicker-showTime')[0]) {
						$('._datepicker').find('.t-datepicker-showTime').removeClass('focus');
						$('.t-datepicker-box .t-datepicker-wrap li').off('click.' + NAMESPACE);
						$('.t-datepicker-box .onlyTime-btn').off('click.' + NAMESPACE);
					}
				}
				if($('._datepicker')[0]) {
					$('._datepicker').removeClass('_datepicker');
				}
				$('.t-datepicker-box').remove();
			}
		});
		//3.31 清空内容
		$(document).on('click.' + NAMESPACE, '.t-datepicker-box .t-empty', function() {
			if($('._datepicker').find('.t-datepicker-showDate')[0]) {
				$('._datepicker').children('.t-datepicker-showDate').find('input').val('');
			} else if($('._datepicker')[0]) {
				$('._datepicker').val('');
			}
		});

		//年份
		$(document).on('click.' + NAMESPACE, '.t-datepicker-box .t-selectYear', function() {
			var $yBox = $(this).siblings('.t-yearBox'),
				st = utils.midScrollTop($yBox);
			if(!$(this).hasClass('focus')) {
				$(this).addClass('focus').siblings('.t-yearBox').css('visibility', 'visible').find('.t-yearList').scrollTop(st);
				//6.10 选定年的时候关闭月
				$(this).siblings('.t-selectMonth').removeClass('focus').siblings('.t-monthBox').css('visibility', 'hidden').find('.t-monthList').scrollTop(0);
			} else {
				$(this).removeClass('focus').siblings('.t-yearBox').css('visibility', 'hidden').find('.t-yearList').scrollTop(0);
			}
		});
		//月份
		$(document).on('click.' + NAMESPACE, '.t-datepicker-box .t-selectMonth', function() {
			var $mBox = $(this).siblings('.t-monthBox'),
				st = utils.midScrollTop($mBox);
			if(!$(this).hasClass('focus')) {
				$(this).addClass('focus').siblings('.t-monthBox').css('visibility', 'visible').find('.t-monthList').scrollTop(st);
				//6.10 选定月的时候关闭年
				$(this).siblings('.t-selectYear').removeClass('focus').siblings('.t-yearBox').css('visibility', 'hidden').find('.t-yearList').scrollTop(0);
			} else {
				$(this).removeClass('focus').siblings('.t-monthBox').css('visibility', 'hidden').find('.t-monthList').scrollTop(0);
			}
		});
		//清空功能
		$(document).on('click.' + NAMESPACE, '.t-datepicker-box .t-datepicker-empty', function() {
			if($('._datepicker').find('.t-datepicker-input')[0]) {
				$('._datepicker').find('.t-datepicker-input').val('');
			} else {
				$('._datepicker').val('');
			}
		});

	};

	$.fn.datepicker = function jQueryDatepicker(option) {
		//为了区分this
		var $this = this,
			options = $.isPlainObject(option) && option || {};
		$this.each(function(wi) {
			//wi 调用组件的容器下标
			$(this).data(NAMESPACE, new Datepicker(this, options, wi));
		});
		//4.10  对不同类元素的消重绑定
		if(!$('html').hasClass('_bindDatepicker')) {
			//4.7 针对事件重复绑定进行调整=>4.10 补充实质上是对同类元素进行消重绑定
			$('html').addClass('_bindDatepicker')
			dpSinglerBind();
		}
		return $this;
	}
})(jQuery)