/**
 * @version:1.0.0
 * @date: 2017 05 20
 * @Author:Ko00
 * @Copyright (c) 2017 yuanwang
 *===========================================================
 *====================== pager commponet ====================
 *===========================================================
 **/
(function($) {
	var DEFAULT = {
		pageIndex: 1,
		ajax: {
			type: 'get'
		}
	};
	var NAMESPACE = 'pagination';
	var Pagination = function($element, options) {
		function Pagination($element, options) {
			options = $.extend(true, {}, DEFAULT, options);
			this.init($element, options);
		};
		Pagination.prototype.init = function init($element, options) {
			var args = {
				current: options.pageIndex,
				pageCount: options.pageCount,
			};
			$element.append(this.getPageCode(args));
			this.bind($element, options);
		};

		Pagination.prototype.getPageCode = function getPageCode(args, targetCode) {
			var pageStr = '<div class="t-pagination">';
			args.current = parseInt(args.current);
			args.pageCount = parseInt(args.pageCount);
			targetCode = targetCode || 1;

			//上一页
			if(args.current > 1) {
				pageStr += '<a href="javascript:;" class="prevPage">上一页</a>';
			} else {
				pageStr += '<span class="disabled">上一页</span>';
			}
			//中间页码
			if(args.current >= 4 && args.pageCount != 4) {
				pageStr += '<a href="javascript:;" class="pageCode-num">' + 1 + '</a>';
			}
			if(args.current - 2 > 2 && args.current <= args.pageCount && args.pageCount > 5) {
				pageStr += '<span class="ellipsis">...</span>';
			}
			var start = args.current - 2,
				end = args.current + 2;
			if((start > 1 && args.current < 4) || args.current == 1) {
				end++;
			}
			if(args.current > args.pageCount - 4 && args.current >= args.pageCount) {
				start--;
			}
			for(; start <= end; start++) {
				if(start <= args.pageCount && start >= 1) {
					if(start != args.current) {
						pageStr += '<a href="javascript:;" class="pageCode-num">' + start + '</a>';
					} else {
						pageStr += '<span class="current">' + start + '</span>';
					}
				}
			}
			if(args.current + 2 < args.pageCount - 1 && args.current >= 1 && args.pageCount > 5) {
				pageStr += '<span class="ellipsis">...</span>';
			}
			if(args.current != args.pageCount && args.current < args.pageCount - 2 && args.pageCount != 4) {
				pageStr += '<a href="javascript:;" class="pageCode-num">' + args.pageCount + '</a>';
			}
			//下一页
			if(args.current < args.pageCount) {
				pageStr += '<a href="javascript:;" class="nextPage">下一页</a>';
			} else {
				pageStr += '<span class="disabled">下一页</span>';
			}
			pageStr += '<a href="javascript:void(0)" class="dataCount">共' + args.pageCount + '页</a>';
			pageStr += '<span class="inputTargetCode"><input type="text" value="' + targetCode + '" /></span><a href="javascript:void(0)" class="targetCode"><i class="p-icon"></i></a></div>';

			return pageStr;
		};

		Pagination.prototype.bind = function bind($element, options) {
			//添加分页事件
			var self = this,
				ajax = options.ajax,
				pageCount = options.pageCount;
			//指定页码
			$element.on('click', '.t-pagination a.pageCode-num', function() {
				var pageIndex = parseInt($(this).html()),
					args = {
						current: pageIndex,
						pageCount: pageCount,
					},
					ajaxObj = null;
				$element.html('').append(self.getPageCode(args));
				//考虑ajax
				if(typeof ajax.url === 'string') {
					ajaxObj = $.extend(true, {}, {
						data: {
							pageIndex: pageIndex
						}
					}, ajax);
					$.ajax(ajaxObj);
				}
			});
			//上一页
			$element.on("click", ".t-pagination a.prevPage", function() {
				var pageIndex = $(this).siblings("span.current").text() - 1,
					args = {
						current: pageIndex,
						pageCount: pageCount,
					};
				$element.html('').append(self.getPageCode(args));
				if(typeof ajax.url === 'string') {
					ajaxObj = $.extend(true, {}, {
						data: {
							pageIndex: pageIndex
						}
					}, ajax);
					$.ajax(ajaxObj);
				}
			});
			//下一页
			$element.on("click", ".t-pagination a.nextPage", function() {
				var pageIndex = parseInt($(this).siblings("span.current").text()) + 1,
					args = {
						current: pageIndex,
						pageCount: pageCount,
					};
				$element.html('').append(self.getPageCode(args));
				if(typeof ajax.url === 'string') {
					ajaxObj = $.extend(true, {}, {
						data: {
							pageIndex: pageIndex
						}
					}, ajax);
					$.ajax(ajaxObj);
				}
			});
			//目标页码
			$element.on("click", ".t-pagination a.targetCode", function() {
				var targetCode = $(this).siblings("span.inputTargetCode").children('input').val(),
					args = {
						current: targetCode,
						pageCount: pageCount,
					};
				if(targetCode < 1) {
					targetCode = 1;
				} else if(targetCode > pageCount) {
					targetCode = pageCount;
				} else if(!(/^[0-9]+$/.test(targetCode))) {
					//4.19 添加非数字的验证
					targetCode = 1;
				}
				args.current = targetCode;
				$element.html('').append(self.getPageCode(args, targetCode));
				if(typeof ajax.url === 'string') {
					ajaxObj = $.extend(true, {}, {
						data: {
							pageIndex: targetCode
						}
					}, ajax);
					$.ajax(ajaxObj);
				}
			});
		};
		return Pagination;
	}();

	$.fn.pagination = function jqPagination(url, pageCount, success, customParams, type) {
		var options = {
				pageCount: pageCount,
			},
			customeParams = customParams || {};
		type = type || 'get';
		if(typeof url !== 'string') {
			throw new Error('url格式错误 !');
		}
		if(typeof success !== 'function') {
			throw new Error('success函数格式错误 !');
		}
		options.ajax = {
			url: url,
			type: type,
			data: customeParams,
			success: success
		}
		this.each(function(di, dom) {
			$(dom).data(NAMESPACE, new Pagination($(dom), options));
		});
		return this;
	};
})(jQuery)