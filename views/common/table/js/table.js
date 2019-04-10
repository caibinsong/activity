//模拟渲染table
(function ($) {
    'use strict';
    //配置基本项
    var DEFAULT = {
        headerQuery: {
            text: '查询',
            btnIcon: true,
            initQuery: {},
            callback: null,
            initSyncCallback: null	//5.26
        },
        header: {
            show: true,
            column: 1,
            key: {
                text: '---',
                name: '---',
                width: '90px'
            },
            value: {
                marginLeft: '0px',
                text: '---',
                type: 'input',
                width: '120px',
                require: false,
                tip: '',
                options: [],
                datepicker: {}, //3.23  添加嵌入日历选择器的配置项
                tree: {}, //4.17  表头添加tree组件的功能
                initValue: '', //4.24	给表头的表单控件添加初始值
                callback: null //4.24	给select类型表头控件添加自定义回调
            }
        },
        body: {
            url: '',
            mtype: '',
            update: {},
            colModel: [],
            rowList: [],
            //pageSize: 10, //4.13  向下兼容:调整字段：sortType=>orderType  sortName=>orderBy rowNum=>pageSize
            //orderType: '',
            //orderBy: '',
            sortable: false,
            pageable: true, //4.5 添加禁止分页功能
            resizeable: true,
            checkable: false,
            unScrollBar: false, //4.22  添加是否有滚动条 默认为false[有滚动条] true没有滚动条
            tools: [],
            cruds: [],
            //rowNum: 10, //旧接口
            //sortName: '',
            //sortType: '',
            //冷门
            noBorder: '',
            editable: false,
            isWrapRow: false,
            filterByColumn: false,

            //5.25 之后的添加配置项
            errorCallback: null,

            //7.10 添加展示区域项
            isSelectedNumArea: false,
            //7.20	请求成功后的回调函数
            success: null
        }
    };
    //默认的筛选按钮样式
    var DEFAULTFILTERBUTTON = {
        text: '自定义指标',
        icon: 't-btn-custom-table'
    };
    //默认的换行样式
    var DEFAULTWRAPROW = {
        odd: {
            backgroundColor: 'white'
        },
        even: {
            backgroundColor: '#ddd'
        }
    };

    /**
     * 3.23  table的工具函数  [如果引入datepicker.js,不会跟datepicker.js中的utils冲突]
     */
    //utils作为$的静态工具方法
    $.utils = {
        removeObjProp: function (obj) { //删除对象中的属性值为无效的属性
            var temp = {};
            for (var k in obj) {
                var v = obj[k];
                if (v) {
                    if ($.isPlainObject(v) && !$.isEmptyObject(v)) {
                        temp[k] = v;
                    } else if ($.isArray(v) && v.length > 0) {
                        temp[k] = v;
                    } else if (!$.isPlainObject(v) && !$.isArray(v)) {
                        temp[k] = v;
                    }
                }
            }
            return temp;
        },
        watchValChange: function (ele, fn) { //3.28 简单监听val的函数
            var pre = '',
                $ele = $(ele);
            return setInterval(function () {
                var curCtt = $ele.val();
                if (curCtt !== pre) {
                    pre = curCtt;
                    fn.call(ele, curCtt);
                }
            }, 500);
        },
        isHide: function (e, $wrapEle, $openEle) {
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

    //防止构造函数被当做普通函数来使用，应当做类来使用
    var classCallCheck = function (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    };

    //将组件的逻辑方法挂载为类的实例方法和静态属性,并保证这些不能被遍历(不能随意使用)
    var createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var NAMESPACE = 'table';

    var Table = function () {
        function Table(element, options) {
            classCallCheck(this, Table); //防止把Table当函数使用，应将其当做类来使用
            var self = this,
                bodyOptions = options.body;
            self.$element = $(element);
            //如果缺少body选项就报错,来提醒开发人员
            if (!bodyOptions || $.isEmptyObject(bodyOptions)) {
                throw('body选项必填！！！');
            }
            //由于换行和筛选按钮的样式选择有3种情况,开始过滤
            if (bodyOptions.filterByColumn === true) {
                bodyOptions.filterByColumn = DEFAULTFILTERBUTTON;
            }
            if (bodyOptions.isWrapRow === true) {
                bodyOptions.isWrapRow = DEFAULTWRAPROW;
            }
            self.options = $.extend(true, {}, DEFAULT, $.isPlainObject(options) && options);
            self.header = header; //4.24 将header封装到table中
            self.init();
        };
        createClass(Table, [{
            key: 'init',
            value: function init() {
                //init进行数据初始化，为后面的行为做铺垫
                var self = this,
                    $element = self.$element,
                    options = self.options,
                    bodyOptions = self.options.body;
                self.ready = false; //控制第一次渲染
                self.loading = false; //控制异步请求的时候，不能再发生请求
                self.selectIndex = [];
                self.total = 0; //4.13  记录每次返回的总条数
                self.colModel = bodyOptions.colModel;
                self.selectedRows = {}; //4.13  添加被选定行数据对象
                self.unScrollBar = bodyOptions.unScrollBar; //4.22
                //4.13   ajax 接口调整[兼容]
                self.pageIndex = 1; //page=>pageIndex
                self.pageSize = bodyOptions.pageSize; //records=>pageSize
                self.orderBy = bodyOptions.orderBy; //sortName=>orderBy
                self.orderType = bodyOptions.orderType; //sortType=>orderType
                self.ajaxData = {}; //4.27 调整
                //4.27接口调整
                for (var k in bodyOptions) {
                    if (k === 'rowNum' || k === 'sortName' || k === 'sortType' || k === 'pageSize' || k === 'orderBy' || k === 'orderType') {
                        if (k === 'rowNum') {
                            self.ajaxData['records'] = bodyOptions[k];
                        } else {
                            self.ajaxData[k] = bodyOptions[k];
                        }
                    }
                }
                if (self.ajaxData['sortName'] !== undefined) {
                    self.ajaxData['page'] = 1;
                } else {
                    self.ajaxData['pageIndex'] = 1;
                }
                //初始化所选定的下标
                for (var i = 0; i < bodyOptions.colModel.length; i++) {
                    self.selectIndex[i] = i;
                }
                if (options.header.length > 0) {
                    self.header.control(options, $element, $element, self);
                }
                self.reset();
                self.bind();
            }
        }, {
            key: 'reset',
            value: function reset() {
                var self = this,
                    options = self.options,
                    bodyOptions = self.options.body,
                    url = bodyOptions.url,
                    $element = self.$element,
                    mtype = bodyOptions.mtype,
                    rowList = bodyOptions.rowList,
                    pageable = bodyOptions.pageable, //4.5 	添加禁止分页功能
                    errorCallback = bodyOptions.errorCallback, //5.25	添加配置项
                    success = bodyOptions.success, //7.20	添加请求成功后的回调函数
                    initSyncCallback = options.headerQuery.initSyncCallback,	//5.26 用于表格首次刷新的时候自定义异步的同步执行函数
                    hdInitQuery = options.headerQuery.initQuery;
                //只接受json格式的数据
                self.output();
                self.loading = true;
                //4.5 添加初始查询条件
                if (!$.isEmptyObject(hdInitQuery)) {
                    for (var k in hdInitQuery) {
                        self.ajaxData[k] = hdInitQuery[k];
                    }
                }
                self.loadingAjax({
                    url: url, //调试
                    type: mtype,
                    data: self.ajaxData,
                    dataType: 'json',
                    success: function (res) {
                        //4.13  接口调整[兼容]
                        var pageCount, current, total;
                        res = typeof res === 'string' ? JSON.parse(res) : res;
                        //5.25 添加自定义处理错误的方法----只有在首次刷新的时候进行这种判断
                        if (res.status === 'error' && typeof errorCallback === 'function' && errorCallback(res) === true) {
                            return;
                        }

                        try {
                            if (res) {
                            	$element.find('.table-container>.loading').hide();
                                self.loading = false;
                                //5.19
                                if (res.data.length > 0) {
                                    $element.find('.noData').hide();
                                } else {
                                    // 7.17 当前没有数据的时候去除return，保证页码出现一页
                                    $element.find('.noData').show();
                                }
                                //4.28  规避返回的数字不规范
                                self.total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount; //4.13 接口调整[兼容]  total=>totalCount
                                self.output(res.data);
                                //4.13 接口调整[兼容]
                                pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records));
                                current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page;
                                total = self.total;
                                //4.5 添加禁止分页功能
                                if (pageable) {
                                    var $tablePage = $('<div class="t-table-page fn-clear"></div>');
                                    $tablePage.append(self.getPageRecord(rowList));
                                    $tablePage.append(self.getPageCode({
                                        pageCount: pageCount,
                                        current: current,
                                        total: total
                                    }))
                                    $element.append($tablePage);
                                }
                                //3.28 添加动态绑定
                                self.dynamicBind(res.data);

                                //5.26 添加配置项-用于表格首次刷新的时候自定义异步的同步执行函数
                                if (typeof initSyncCallback === 'function') {
                                    initSyncCallback();
                                }

                                //7.20 请求成功后的回调函数
                                if (typeof success === 'function') {
                                    success(res);
                                }
                            }
                        } catch (err) {
                            console.log('错误信息：', err);
                        }
                    }
                }, 'reset');
            }
        }, {
            key: 'loadingAjax',
            value: function loadingAjax(ajaxObj, src) {
                var self = this,
                    $element = self.$element;
                //5.19 调整
                if (self.loading) {
                    if (src === 'reset') {
                        $.ajax(ajaxObj);
                    } else {
                        $element.find('.table-container>.loading').show();
                        setTimeout(function () {
                            $.ajax(ajaxObj);
                        }, 150);
                    }
                }
            }
        }, {
            key: 'output',
            value: function output(data) {
                //output得到对应部位的字符串并渲染到页面上
                var self = this,
                    bodyOptions = self.options.body,
                    selectIndex = self.selectIndex,
                    $element = self.$element,
                    colModel = self.colModel,
                    ready = self.ready, //通过ready来判断是否为第一次渲染
                    rowNum = bodyOptions.rowNum !== undefined ? bodyOptions.rowNum : bodyOptions.pageSize; //4.27 调整

                var $content = ready ? $element.find('.scrollBox') : $('<div class="t-table-content"></div>');
                //如果tools未赋予或者tool已经渲染出来了,不走括号内
                if (bodyOptions.tools.length > 0 && !ready) {
                    $content.append(self.getTools());
                }
                // 7.10 添加开启选择数目区域的选项
                if (bodyOptions.isSelectedNumArea && !ready) {
                    $content.append(self.getSelectedNumArea());
                }

                if (colModel.length > 0 && !ready) {
                    $content.append(self.getThTable());
                }
                if (ready) {
                    if ($content.children().is('.t-table-td')) {
                        $content.children('.t-table-td').remove();
                    }
                    $content.append(self.getTdTable(data));
                    //5.17 防止数据格式不正确，现在将数据都存放至data('item')中，不再将数据绑到dom上
                    $element.find('.t-table-td tr').each(function (tidx, tdom) {
                        $(tdom).data('item', data[tidx]);
                    });
                    // 7.4 防止容器元素宽为小数时出现表格错位的问题
                    var $eleWidth = $element.width();
                    if ($eleWidth !== parseFloat(getComputedStyle($element[0]).width)) {
                        $element.width($eleWidth);
                    }
                } else {
                    $element.append($content);
                    //表明第一次渲染完成
                    self.ready = true;
                }
            }
        }, {
            key: 'getTools',
            value: function getTools() {
                var self = this,
                    bodyOptions = self.options.body,
                    tools = bodyOptions.tools,
                    filterByColumn = bodyOptions.filterByColumn,
                    colModel = self.colModel,
                    $tools = $('<div class="table-tools fn-clear"></div>');
                for (var i = 0; i < tools.length; i++) {
                    var tool = tools[i];
                    var iStr = /-t\b/g.test(tool.toolIcon) ? '' : '<i class="t-btn-icon"></i>';
                    //4.10	容错处理
                    if (!tool.toolIcon) {
                        tool.toolIcon = '';
                    } else {
                    	tool.toolIcon += ' icon ';
                    }
                    if (!tool.title) {
                        tool.title = '';
                    }
                    if (!tool.text) {
                        tool.text = '';
                    }
                    var $btn = $('<a class="t-button no-bg ' + tool.toolIcon + '" title="' + tool.title + '" href="javascript:void(0)>' + iStr + '<label class="t-btn-text">' + tool.text + '</label></a>');
                    $tools.append($btn);
                }
                var $btn = null;
                if (filterByColumn) {
                    var btn = filterByColumn;
                    var $filterWrap = $('<div class="custom-wrap fn-clear"></div>');
                    var $btn = $('<a href="javascript:;" class="' + btn.icon + '"><i class="btn-icon"></i>' + btn.text + '</a>');
                    $filterWrap.append($btn);

                    var $choic = $('<div class="choic-columns fn-clear"></div>');
                    var ulStr = '';
                    var i = 0;
                    for (var i = 0; i < colModel.length; i++) {
                        ulStr += i % 5 === 0 ? '<ul>' : '';
                        ulStr += '<li><div class="t-checkbox"></div><span data-i="' + i + '">' + colModel[i].text + '</span></li>';
                        ulStr += i % 5 === 4 ? '</ul>' : '';
                    }
                    ulStr += i % 5 === 0 ? '' : '</ul>';
                    $choic.width(Math.ceil(i / 5) * 150 + 24).append('<div class="fn-clear">' + ulStr + '</div>').append('<p><a class="t-button">确定</a></p>');
                    $filterWrap.append($choic);
                }
                return $filterWrap ? $tools.append($filterWrap) : $tools;
            }
        }, {
            key: 'getSelectedNumArea',
            value: function getSelectedNumArea() {
                var selectedNumAreaStr = ''
                    + '<div class="table-selectedNumArea">'
                    + '<i class="icon-colon"></i>已选择<span class="selectedNum">0</span>项'
                    + '</div>';
                return selectedNumAreaStr;
            }
        }, {
            key: 'getPageRecord',
            value: function getPageRecord(rowList) {
                //4.6 添加指定rowNum作为recordsNum的初始值
                var rowNum = this.options.body.rowNum !== undefined ? this.options.body.rowNum : this.options.body.pageSize,
                    selectRecords = '<div class="selectRecords"><span class="recordsNum">' +
                        rowNum +
                        '<i class="p-icon"></i></span><ul class="recordsList">';
                $.each(rowList, function (ri, rv) {
                    selectRecords += '<li><a href="javascript:;">' + rv + '</a></li>';
                });
                selectRecords += '</ul></div>';
                return selectRecords;
            }
        }, {
            key: 'getPageCode',
            value: function getPageCode(args, targetCode) {
                var $pageCode = $('<div class="pageCode"></div>');
                args.current = parseInt(args.current);
                args.pageCount = parseInt(args.pageCount);
                targetCode = targetCode || 1;

                //5.2 针对total为0时的数据调整
                if (Number(args.total) === 0) {
                    args.current = 1;
                    args.pageCount = 1;
                    targetCode = 1;
                }
                //上一页
                if (args.current > 1) {
                    $pageCode.append('<a href="javascript:;" class="prevPage">上一页</a>');
                } else {
                    $pageCode.remove('.prevPage');
                    $pageCode.append('<span class="disabled">上一页</span>');
                }
                //中间页码
                if (args.current != 1 && args.current >= 4 && args.pageCount != 4) {
                    $pageCode.append('<a href="javascript:;" class="tcdNumber">' + 1 + '</a>');
                }
                if (args.current - 2 > 2 && args.current <= args.pageCount && args.pageCount > 5) {
                    $pageCode.append('<span class="ellipsis">...</span>');
                }
                var start = args.current - 2,
                    end = args.current + 2;
                if ((start > 1 && args.current < 4) || args.current == 1) {
                    end++;
                }
                if (args.current > args.pageCount - 4 && args.current >= args.pageCount) {
                    start--;
                }
                for (; start <= end; start++) {
                    if (start <= args.pageCount && start >= 1) {
                        if (start != args.current) {
                            $pageCode.append('<a href="javascript:;" class="tcdNumber">' + start + '</a>');
                        } else {
                            $pageCode.append('<span class="current">' + start + '</span>');
                        }
                    }
                }
                if (args.current + 2 < args.pageCount - 1 && args.current >= 1 && args.pageCount > 5) {
                    $pageCode.append('<span class="ellipsis">...</span>');
                }
                if (args.current != args.pageCount && args.current < args.pageCount - 2 && args.pageCount != 4) {
                    $pageCode.append('<a href="javascript:;" class="tcdNumber">' + args.pageCount + '</a>');
                }
                //下一页
                if (args.current < args.pageCount) {
                    $pageCode.append('<a href="javascript:;" class="nextPage">下一页</a>');
                } else {
                    $pageCode.remove('.nextPage');
                    $pageCode.append('<span class="disabled">下一页</span>');
                }
                $pageCode.append('<a href="javascript:void(0)" class="dataCount">共' + args.total + '条</a>');
                $pageCode.append('<span class="inputTargetCode"><input type="text" value="' + targetCode + '" /></span><a href="javascript:void(0)" class="targetCode"><i class="p-icon"></i></a>');

                return $pageCode;
            }
        }, {
            key: 'getThTable',
            value: function getThTable() {
                var self = this,
                    bodyOptions = self.options.body,
                    $element = self.$element,
                    colModel = bodyOptions.colModel,
                    checkable = bodyOptions.checkable,
                    cruds = bodyOptions.cruds,
                    noBorder = bodyOptions.noBorder,
                    //4.13 接口调整[兼容] rowNum =>pageSize  sotName=>orderBy sortType=>orderType
                    rowNum = bodyOptions.rowNum || bodyOptions.pageSize,
                    sortName = bodyOptions.sortName || bodyOptions.orderBy,
                    sortType = bodyOptions.sortType || bodyOptions.orderType,
                    resizeable = bodyOptions.resizeable, //4.19 添加判断是否移动列
                    unScrollBar = self.unScrollBar, //4.22
                    cancelBorderTop = ''; //4.12 添加机制，消除如果没有tools时，会出现双重边框的问题
                if (bodyOptions.tools.length === 0) {
                    cancelBorderTop = 'style="border-top:none;"';
                }
                //形成Table
                var thTable = '<table class="t-table-th">';
                thTable += checkable ? '<tr><th class="checkbox"><div class="t-checkbox"></div></th>' : '<tr>';

                for (var i = 0; i < colModel.length; i++) {
                    var sort = colModel[i].sort ? 'sort-span' : '',
                        width = colModel[i].width ? colModel[i].width : '',
                        iStr = '';
                    sort += colModel[i].name === sortName ? (' sort-' + sortType) : '';
                    if (resizeable) {
                        iStr = '<i class="col-resize"><i>';
                    }
                    thTable += '<th style="width:' + width + 'px;" ><span class="' + sort + '" data-name="' + colModel[i].name + '">' + colModel[i].text + '</span>' + iStr + '</th>';
                }
                if (cruds.length > 0) {
                    $.each(cruds, function (cri, cro) {
                        thTable += '<th class="crud">' + cro.text + '</th>';
                    });
                }
                thTable += '</tr></table>';

                //4.22  针对是否需要滚动条进行调整
                var tableWrapCss;
                if (!unScrollBar) {
                    tableWrapCss = {
                        height: rowNum * 35,
                        overflow: 'hidden',
                        position: 'relative'
                    };
                } else {
                    tableWrapCss = {
                        height: 'auto',
                        overflow: 'hidden',
                        position: 'relative'
                    };
                }
                var $box = $('<div class="t-table-wrap"></div>').css(tableWrapCss),
                    $scrollBox = $('<div class="scrollBox"></div>').css({
                        height: 'inherit',
                        overflow: 'auto',
                        position: 'relative', //5.19
                        width: $element.width() + 30
                    });
                // 5.19  调整暂无数据的位置
                var noDate = $('<div class="noData"><i></i><h4>暂无数据</h4></div>').hide();
                $scrollBox.append(noDate);
                //$box.append('<div class="loadingBox"><div class="loading"><i></i><h4>暂无数据</h4></div></div>').append($scrollBox);
                $box.append($scrollBox);

                // 7.11  添加加载效果
                var loading = $('<div class="loading"><i class="loading-bg"></i></div>').show();

                return $('<div class="table-container ' + (noBorder ? noBorder : '') + '"' + cancelBorderTop + '></div>').append('<div class="liner"></div>').append(loading).append(thTable).append($box);
            }
        }, {
            key: 'getTdTable',
            value: function getTdTable(data) {
                var self = this,
                    $element = self.$element,
                    bodyOptions = self.options.body,
                    selectIndex = self.selectIndex,
                    checkable = bodyOptions.checkable,
                    rowNum = bodyOptions.rowNum || bodyOptions.pageSize, //4.13 接口调整[兼容] rowNum=>pageSize
                    selectedRows = self.selectedRows, //4.13 跨页多选功能
                    pageIndex = self.ajaxData.pageIndex || self.ajaxData.page, //4.13
                    pageIndexStr = 'page' + pageIndex, //4.13
                    isWrapByRow = bodyOptions.isWrapRow,
                    cruds = bodyOptions.cruds,
                    colModel = self.colModel,
                    styleStr = '',
                    borderBottom = data.length < rowNum && data.length > 0 ? 'border-bottom:1px solid #d8d8d8' : '';
                //5.19 调整
                var $tdTable = $('<table class="t-table-td" style="position:relative;z-index:5;width:' + $element.find('.t-table-wrap').width() + 'px;' + borderBottom + '"></table>');
                //形成td的行
                for (var i = 0; i < data.length; i++) {
                    if (isWrapByRow && !$.isEmptyObject(isWrapByRow)) {
                        var styleStr = i % 2 === 0 ? 'background-color:' + isWrapByRow.even.backgroundColor + ';color:' + isWrapByRow.even.color :
                            'background-color:' + isWrapByRow.odd.backgroundColor + ';color:' + isWrapByRow.odd.color;
                    }
                    //5.17 将curDataStr删除
                    var item = data[i],
                        activeStr = '';
                    if (selectedRows[pageIndexStr] && selectedRows[pageIndexStr].length > 0) {
                        $.each(selectedRows[pageIndexStr], function (si, sv) {
                            if (sv.id === item.id) {
                                activeStr = 'active';
                            }
                        });
                    }
                    //4.15 调整无checkbox状态下，无data-item，data-id的情况
                    //5.9 防止数据中出现空字符时出现问题
                    var tdStr = checkable ? '<tr data-id="' + item.id + '" ><td class="checkbox" style="' + styleStr + '"><div class="t-checkbox ' + activeStr + '"></div></td>' : '<tr data-id="' + item.id + '" >';
                    $.each(colModel, function (mi, mo) {
                        var width = mo.width ? mo.width : '',
                            align = mo.align ? mo.align : '',
                            name = mo.name ? mo.name : '',
                            callback = mo.callback ? mo.callback : '',
                            temp,
                            value,
                            title,
                            display = false;
                        $.each(item.cell, function (ck, cv) {
                            if (name === ck) {
                                value = cv;
                            }
                        });
                        temp = value;
                        $.each(selectIndex, function (si, sv) {
                            if (mi === sv) {
                                display = 'table-cell';
                            }
                        });
                        if (!display) {
                            display = 'none';
                        }
                        if (callback) {
                            value = callback(temp, item);
                        }

                        if (typeof value === 'string') {
                            temp = /^</.test(value) ? temp : value;
                        }

                        //6.5 为了避免返回的数据为html标签，对所有返回的html标签都当做字符串处理
                        if (/^<[a-zA-Z0-9]+>.*(<\/[a-zA-Z0-9]+>)?$/.test(temp)) {
                            value = temp.replace(/(<)|(>)/g, function ($0) {
                                return $0 === '<' ? '&lt;' : '&gt;';
                            });
                        }

                        //4.7 title属性完善
                        title = typeof callback === 'function' ? '' : temp;
                        //4.10 容错处理   4.14 跟进补充
                        if (!value && value !== 0 && value !== false) {
                            value = '';
                        }
                        tdStr += '<td style="' + styleStr + ';width:' + parseInt(width) + 'px;text-align:' + align + ';display:' + display + '" data-name=' + name + ' data-value="' + temp + '" title="' + title + '">' + value + '</td>';
                    });

                    if (cruds.length > 0) {
                        $.each(cruds, function (cri, cro) {
                            var crudsList = cro.data;
                            tdStr += '<td class="crud" style="' + styleStr + '">';
                            for (var j = 0; j < crudsList.length; j++) {
                                var crudItem = crudsList[j];
                                tdStr += '<a class="t-button-table icon' + crudItem.crudIcon + '" title="' + crudItem.title + '" href="javascript:void(0)"><i class="t-tab-icon"></i></a>';
                            }
                            tdStr += '</td>';
                        });
                    }
                    tdStr += '</tr>';
                    $tdTable.append(tdStr);
                }

                return $tdTable;
            }
        }, {
            key: 'bind',
            value: function bind() {
                var self = this,
                    $element = self.$element,
                    bodyOptions = self.options.body,
                    checkable = bodyOptions.checkable,
                    colModelLength = self.colModel.length,
                    url = bodyOptions.url,
                    mtype = bodyOptions.mtype,
                    update = bodyOptions.update,
                    sortable = bodyOptions.sortable,
                    pageable = bodyOptions.pageable,
                    editable = bodyOptions.editable,
                    filterByColumn = bodyOptions.filterByColumn,
                    resizeable = bodyOptions.resizeable,
                    tools = bodyOptions.tools,
                    isSelectedNumArea = bodyOptions.isSelectedNumArea, //7.10  添加是否开启选择项目数量的区域
                    success = bodyOptions.success, //7.20  添加是否开启选择项目数量的区域
                    targetCode = 1; //targetCode作为页码交互的共享变量

                //基础事件绑定
                //4.5 添加禁止分页功能
                if (pageable) {
                    //页码事件绑定
                    $element.on('click.body' + NAMESPACE, '.t-table-page .recordsNum', function () {
                        $(this).siblings('.recordsList').toggle();
                    });
                    $element.on('click.body' + NAMESPACE, '.t-table-page .recordsList a', function () {
                        if (!self.loading) {
                            //4.13 接口调整[兼容] records=>pageSize
                            var pageSize = parseInt($(this).html()); //每页条数
                            if (pageSize !== self.ajaxData.pageSize) {
                                //4.27 调整
                                if (self.ajaxData['pageSize'] !== undefined) {
                                    self.ajaxData['pageSize'] = pageSize;
                                } else if (self.ajaxData['records'] !== undefined) {
                                    self.ajaxData['records'] = pageSize;
                                }
                                $(this).parents('.recordsList').hide().siblings('.recordsNum').html(pageSize + '<i class="p-icon"></i>');
                                self.loading = true;
                                //4.28 每次选页数应该总是从第一页开始
                                if (self.ajaxData['pageIndex'] !== undefined) {
                                    self.ajaxData['pageIndex'] = 1;
                                } else if (self.ajaxData['page'] !== undefined) {
                                    self.ajaxData['page'] = 1;
                                }
                                self.loadingAjax({
                                    url: url,
                                    type: mtype,
                                    data: self.ajaxData,
                                    dataType: 'json',
                                    success: $.proxy(function (res) {
                                        res = typeof res === 'string' ? JSON.parse(res) : res;
                                        try {
                                            if (res) {
                                                //4.13 接口调整[兼容]		total=>totalCount page=>pageIndex
                                                //5.2 验证0
                                                //5.25 添加自定义处理错误的方法
                                                var total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount,
                                                    current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page,
                                                    pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records));
                                                self.loading = false;

                                                // loading效果
                                                $element.find('.table-container>.loading').hide();
                                                if (res.data.length > 0) {
                                                    $element.find('.noData').hide();
                                                } else {
                                                    // 7.17
                                                    $element.find('.noData').show();
                                                }
                                                self.total = total;
                                                //5.10 重选总页数的时候清空选定的内容
                                                self.selectedRows = {};
                                                $element.data('selectedRows', {});
                                                self.output(res.data);
                                                $(this).closest('.selectRecords').siblings('.pageCode').remove();
                                                $(this).closest('.t-table-page').append(self.getPageCode({
                                                    pageCount: pageCount,
                                                    current: current,
                                                    total: total
                                                }, targetCode));
                                                //3.28
                                                self.dynamicBind(res.data);
                                                //4.20 去除列头的复选框
                                                if (checkable) {
                                                    $element.find('.t-table-th .t-checkbox').removeClass('active');
                                                }
                                                //7.20 请求成功后的回调函数
                                                if (typeof success === 'function') {
                                                    success(res);
                                                }
                                            }
                                        } catch (err) {
                                            console.log('错误信息：', err);
                                        }
                                    }, this)
                                });
                            }
                        }
                    });
                    //指定页码
                    $element.on('click.body' + NAMESPACE, '.pageCode a.tcdNumber', function () {
                        if (!self.loading) {
                            //4.13 接口调整[兼容] page=>pageIndex
                            var pageIndex = parseInt($(this).html()); //当前页码
                            //4.27 调整
                            if (self.ajaxData['pageIndex'] !== undefined) {
                                self.ajaxData['pageIndex'] = pageIndex;
                            } else if (self.ajaxData['page'] !== undefined) {
                                self.ajaxData['page'] = pageIndex;
                            }
                            self.loading = true;
                            self.loadingAjax({
                                url: url,
                                type: mtype,
                                data: self.ajaxData,
                                dataType: 'json',
                                success: function (res) {
                                    res = typeof res === 'string' ? JSON.parse(res) : res;
                                    try {
                                        if (res) {
                                            //4.13 接口调整[兼容]		total=>totalCount page=>pageIndex
                                            //5.2 验证0
                                            var total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount,
                                                current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page,
                                                pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records)),
                                                pageSize = Number(res.pageSize) || Number(res.pageSize) === 0 ? Number(res.pageSize) : res.records, //4.20
                                                selectedRows = self.selectedRows; //5.12
                                            // loading效果
                                            $element.find('.table-container>.loading').hide();
                                            if (res.data.length > 0) {
                                                self.total = total; //4.13
                                                $element.find('.noData').hide();
                                            } else {
                                                // 7.17
                                                $element.find('.noData').show();
                                            }
                                            self.loading = false;
                                            self.output(res.data);
                                            //4.6 分页功能的动态更新
                                            $element.find('.pageCode').remove();
                                            $element.find('.t-table-page').append(self.getPageCode({
                                                pageCount: pageCount,
                                                current: current,
                                                total: total
                                            }, targetCode));
                                            //3.28
                                            self.dynamicBind(res.data);
                                            //4.20 修正翻页全选的功能
                                            if (checkable) {
                                                //5.26  调整全选的条件，当选定数据的数量等于响应数据的数据时满足全选
                                                if (selectedRows['page' + current] && selectedRows['page' + current].length === res.data.length) {
                                                    $element.find('.t-table-th .t-checkbox').addClass('active');
                                                } else {
                                                    $element.find('.t-table-th .t-checkbox').removeClass('active');
                                                }
                                            }
                                            //7.20 请求成功后的回调函数
                                            if (typeof success === 'function') {
                                                success(res);
                                            }
                                        }
                                    } catch (err) {
                                        console.log('错误信息：', err);
                                    }
                                }
                            });
                        }
                    });
                    //上一页
                    $element.on("click", ".pageCode a.prevPage", function () {
                        if (!self.loading) {
                            //4.13 接口调整[兼容] page=>pageIndex
                            var pageIndex = parseInt($(this).siblings("span.current").text()) - 1; //当前页码
                            //4.27 调整
                            if (self.ajaxData['pageIndex'] !== undefined) {
                                self.ajaxData['pageIndex'] = pageIndex;
                            } else if (self.ajaxData['page'] !== undefined) {
                                self.ajaxData['page'] = pageIndex;
                            }
                            self.loading = true;
                            self.loadingAjax({
                                url: url, //测试
                                type: mtype,
                                data: self.ajaxData,
                                dataType: 'json',
                                success: function (res) {
                                    res = typeof res === 'string' ? JSON.parse(res) : res;
                                    try {
                                        if (res) {
                                            //4.13 接口调整[兼容]		total=>totalCount page=>pageIndex
                                            //5.2 验证0
                                            var total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount,
                                                current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page,
                                                pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records)),
                                                pageSize = Number(res.pageSize) || Number(res.pageSize) === 0 ? Number(res.pageSize) : res.records, //4.20
                                                selectedRows = self.selectedRows; //5.12
                                            self.loading = false;
                                            // loading效果
                                            $element.find('.table-container>.loading').hide();
                                            if (res.data.length > 0) {
                                                $element.find('.noData').hide();
                                            } else {
                                                // 7.17
                                                $element.find('.noData').show();
                                            }
                                            self.total = total;
                                            self.output(res.data);
                                            //4.6 分页功能的动态更新
                                            $element.find('.pageCode').remove();
                                            $element.find('.t-table-page').append(self.getPageCode({
                                                pageCount: pageCount,
                                                current: current,
                                                total: total
                                            }, targetCode));
                                            //3.28
                                            self.dynamicBind(res.data);
                                            //4.20 修正翻页全选的功能
                                            if (checkable) {
                                                //5.26
                                                if (selectedRows['page' + current] && selectedRows['page' + current].length === res.data.length) {
                                                    $element.find('.t-table-th .t-checkbox').addClass('active');
                                                } else {
                                                    $element.find('.t-table-th .t-checkbox').removeClass('active');
                                                }
                                            }
                                            //7.20 请求成功后的回调函数
                                            if (typeof success === 'function') {
                                                success(res);
                                            }
                                        }
                                    } catch (err) {
                                        console.log('错误信息：', err);
                                    }
                                }
                            });
                        }
                    });
                    //下一页
                    $element.on("click", ".pageCode a.nextPage", function () {
                        if (!self.loading) {
                            //4.13 接口调整[兼容] page=>pageIndex
                            var pageIndex = parseInt($(this).siblings("span.current").text()) + 1; //当前页码
                            //4.27 调整
                            if (self.ajaxData['pageIndex'] !== undefined) {
                                self.ajaxData['pageIndex'] = pageIndex;
                            } else if (self.ajaxData['page'] !== undefined) {
                                self.ajaxData['page'] = pageIndex;
                            }
                            self.loading = true;
                            self.loadingAjax({
                                url: url,
                                type: mtype,
                                data: self.ajaxData,
                                dataType: 'json',
                                success: function (res) {
                                    res = typeof res === 'string' ? JSON.parse(res) : res;
                                    try {
                                        if (res) {
                                            //4.13 接口调整[兼容]		total=>totalCount page=>pageIndex
                                            //5.2 验证0
                                            var total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount,
                                                current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page,
                                                pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records)),
                                                pageSize = Number(res.pageSize) || Number(res.pageSize) === 0 ? Number(res.pageSize) : res.records, //4.20
                                                selectedRows = self.selectedRows; //5.12
                                            self.loading = false;
                                            // loading效果
                                            $element.find('.table-container>.loading').hide();
                                            if (res.data.length > 0) {
                                                $element.find('.noData').hide();
                                            } else {
                                                // 7.17
                                                $element.find('.noData').show();
                                            }
                                            self.total = total;
                                            self.output(res.data);
                                            //4.6 分页功能的动态更新
                                            $element.find('.pageCode').remove();
                                            $element.find('.t-table-page').append(self.getPageCode({
                                                pageCount: pageCount,
                                                current: current,
                                                total: total
                                            }, targetCode));
                                            //3.28
                                            self.dynamicBind(res.data);
                                            //4.20 修正翻页全选的功能
                                            if (checkable) {
                                                //5.26
                                                if (selectedRows['page' + current] && selectedRows['page' + current].length === res.data.length) {
                                                    $element.find('.t-table-th .t-checkbox').addClass('active');
                                                } else {
                                                    $element.find('.t-table-th .t-checkbox').removeClass('active');
                                                }
                                            }
                                            //7.20 请求成功后的回调函数
                                            if (typeof success === 'function') {
                                                success(res);
                                            }
                                        }
                                    } catch (err) {
                                        console.log('错误信息：', err);
                                    }
                                }
                            });
                        }
                    });
                    //到目标页码
                    $element.on("click", ".pageCode a.targetCode", function () {
                        if (!self.loading) {
                            //4.13 接口调整[兼容]
                            var total = self.total,
                                records = self.ajaxData.records || self.ajaxData.pageSize,
                                pageCount = Math.ceil(parseFloat(total / records)),
                                targetCode = $(this).siblings("span.inputTargetCode").children('input').val();
                            if (targetCode < 1) {
                                targetCode = 1;
                            } else if (targetCode > pageCount) {
                                targetCode = pageCount;
                            } else if (!(/^[0-9]+$/.test(targetCode))) {
                                //4.19 添加非数字的验证
                                targetCode = 1;
                            }
                            //4.27 调整
                            if (self.ajaxData['pageIndex'] !== undefined) {
                                self.ajaxData['pageIndex'] = targetCode;
                            } else if (self.ajaxData['page'] !== undefined) {
                                self.ajaxData['page'] = targetCode;
                            }
                            self.loading = true;
                            self.loadingAjax({
                                url: url, //测试
                                type: mtype,
                                data: self.ajaxData,
                                dataType: 'json',
                                success: function (res) {
                                    res = typeof res === 'string' ? JSON.parse(res) : res;
                                    try {
                                        if (res) {
                                            //4.13 接口调整[兼容]		total=>totalCount page=>pageIndex
                                            //5.2 验证0
                                            var total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount,
                                                current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page,
                                                pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records)),
                                                pageSize = Number(res.pageSize) || Number(res.pageSize) === 0 ? Number(res.pageSize) : res.records, //4.20
                                                selectedRows = self.selectedRows; //5.12 调整
                                            self.loading = false;
                                            // loading效果
                                            $element.find('.table-container>.loading').hide();
                                            //5.19
                                            if (res.data.length > 0) {
                                                $element.find('.noData').hide();
                                            } else {
                                                // 7.17
                                                $element.find('.noData').show();
                                            }
                                            self.total = total;
                                            self.output(res.data);
                                            //4.6 分页功能的动态更新
                                            $element.find('.pageCode').remove();
                                            $element.find('.t-table-page').append(self.getPageCode({
                                                pageCount: pageCount,
                                                current: current,
                                                total: total
                                            }, targetCode));
                                            //3.28
                                            self.dynamicBind(res.data);
                                            //4.20 修正翻页全选的功能
                                            if (checkable) {
                                                //5.26
                                                if (selectedRows['page' + current] && selectedRows['page' + current].length === res.data.length) {
                                                    $element.find('.t-table-th .t-checkbox').addClass('active');
                                                } else {
                                                    $element.find('.t-table-th .t-checkbox').removeClass('active');
                                                }
                                            }
                                            //7.20 请求成功后的回调函数
                                            if (typeof success === 'function') {
                                                success(res);
                                            }
                                        }
                                    } catch (err) {
                                        console.log('错误信息：', err);
                                    }
                                }
                            });
                        }
                    });
                }

                //编辑功能
                if (editable) {
                    var editstatus = true;
                    $element.on('dblclick.body' + NAMESPACE, '.t-table-td td', function () {
                        if (editstatus) {
                            var val = $(this).text();
                            $(this).css('overflow', 'visible').html('<input type="text" value="' + val + '" ><ul class="ynList"><li class="yes">确定</li><li class="no">取消</li></ul>');
                            editstatus = false;
                        }
                    });
                    $element.on('click.body' + NAMESPACE, '.t-table-td .ynList .yes', function () {
                        var updateData = {
                                index: $(this).parents('tr').data('id'),
                                type: 'update',
                                msg: {}
                            },
                            value = $(this).parent().siblings('input').val();
                        updateData['msg'][$(this).parents('td').data('name')] = value;
                        if (!self.loading) {
                            self.loading = true;
                            self.loadingAjax({
                                url: update.url,
                                type: update.utype,
                                data: updateData,
                                success: $.proxy(function (res) {
                                    res = typeof res === 'string' ? JSON.parse(res) : res;
                                    if (res.success === true) {
                                        self.loading = false;
                                        $(this).closest('td').data('value', value).html(value).css('overflow', '');
                                        editstatus = true;
                                    }
                                }, this)
                            });
                        }
                    });
                    $element.on('click.body' + NAMESPACE, '.t-table-td .ynList .no', function () {
                        var value = $(this).closest('td').data('value');
                        $(this).closest('td').html(value).css('overflow', '');
                        editstatus = true;
                    });
                }

                //全选和多选
                if (checkable) {
                    //单选
                    //4.13 跨页多选功能
                    $element.on('click.body.' + NAMESPACE, '.table-container td .t-checkbox', function () {
                        var pageIndex = self.ajaxData.pageIndex || self.ajaxData.page,
                            curItemData = $(this).closest('tr').data('item'),
                            pageIndexStr = 'page' + pageIndex,
                            selectedRows = self.selectedRows,
                            curTrLen = $element.find('.t-table-td tr').length;	//5.26  当前数据的行数用于全选
                        if (!$(this).hasClass('active')) {
                            if (!selectedRows[pageIndexStr]) {
                                selectedRows[pageIndexStr] = [curItemData];
                            } else {
                                selectedRows[pageIndexStr].push(curItemData);
                            }
                            //4.28 完善多选功能
                            if (selectedRows[pageIndexStr].length === curTrLen || selectedRows[pageIndexStr].length === curTrLen) {
                                $element.find('.table-container th .t-checkbox').addClass('active');
                            }
                        } else {
                            //4.28 完善多选功能
                            $element.find('.table-container th .t-checkbox').removeClass('active');
                            for (var i = 0, tmpArr = selectedRows[pageIndexStr]; i < tmpArr.length; i++) {
                                if (tmpArr[i].id === curItemData.id) {
                                    selectedRows[pageIndexStr].splice(i, 1);
                                    break;
                                }
                            }
                        }
                        self.selectedRows = selectedRows;
                        $element.data('selectedRows', selectedRows);
                        if (isSelectedNumArea) {
                            countSelNum(selectedRows);
                        }
                        $(this).toggleClass('active');
                    });
                    //多选
                    $element.on('click.body.' + NAMESPACE, '.table-container th .t-checkbox', function () {
                        var pageIndex = self.ajaxData.pageIndex || self.ajaxData.page,
                            pageIndexStr = 'page' + pageIndex,
                            selectedRows = self.selectedRows;
                        selectedRows[pageIndexStr] = [];
                        if ($(this).hasClass('active')) {
                            $(this).removeClass('active').parents('.table-container').find('.t-table-td .t-checkbox').removeClass('active');
                        } else {
                            $(this).addClass('active').parents('.table-container').find('.t-table-td .t-checkbox').each(function () {
                                selectedRows[pageIndexStr].push($(this).closest('tr').data('item'));
                                $(this).addClass('active');
                            });
                        }
                        self.selectedRows = selectedRows;
                        if (isSelectedNumArea) {
                            countSelNum(selectedRows);
                        }
                        $element.data('selectedRows', selectedRows);
                    });

                    // 7.10 得到选定项的数量
                    function countSelNum(selectedRows) {
                        var num = 0;
                        for (var key in selectedRows) {
                            if (key) {
                                num += selectedRows[key].length;
                            }
                        }
                        $element.find('.table-selectedNumArea .selectedNum').html(num);
                    }
                }

                //排序
                if (sortable) {
                    $element.on('click.body.' + NAMESPACE, '.table-container span.sort-span', function () {
                        if (!self.loading) {
                            //在这里self指向table实例，this指向绑定事件的元素
                            //4.13 接口调整[兼容]  sortName=>orderBy sortType=>orderType
                            var $span = $(this),
                                orderBy = $span.data('name');
                            //4.27 调整
                            if (self.ajaxData['sortName'] !== undefined) {
                                self.ajaxData['sortName'] = orderBy;
                            } else if (self.ajaxData['orderBy'] !== undefined) {
                                self.ajaxData['orderBy'] = orderBy;
                            }

                            //一开始是无序，点击之后只可能是升序或者降序
                            if (!$span.hasClass('sort-up')) {
                                $span.removeClass('sort-down').addClass('sort-up');
                                //4.27 调整
                                if (self.ajaxData['sortType'] !== undefined) {
                                    self.ajaxData['sortType'] = 'up';
                                } else if (self.ajaxData['orderType'] !== undefined) {
                                    self.ajaxData['orderType'] = 'ASC';
                                }
                            } else {
                                $span.removeClass('sort-up').addClass('sort-down');
                                //								self.ajaxData.sortType = 'down';
                                //4.27 调整
                                if (self.ajaxData['sortType'] !== undefined) {
                                    self.ajaxData['sortType'] = 'down';
                                } else if (self.ajaxData['orderType'] !== undefined) {
                                    self.ajaxData['orderType'] = 'DESC';
                                }
                            }
                            self.loading = true;
                            $span.parent().siblings().children('span').removeClass('sort-down sort-up');
                            self.loadingAjax({
                                url: url, //测试
                                type: mtype,
                                data: self.ajaxData,
                                success: function (res) {
                                    res = typeof res === 'string' ? JSON.parse(res) : res;
                                    try {
                                        if (res) {
                                            //4.13 接口调整[兼容]
                                            var total = res.total || res.totalCount;
                                            self.total = total;
                                            self.loading = false;
                                            // loading效果
                                            $element.find('.table-container>.loading').hide();
                                            //5.19
                                            if (res.data.length > 0) {
                                                $element.find('.noData').hide();
                                            } else {
                                                // 7.17
                                                $element.find('.noData').show();
                                            }
                                            self.output(res.data);
                                            //3.28
                                            self.dynamicBind(res.data);

                                            //7.20 请求成功后的回调函数
                                            if (typeof success === 'function') {
                                                success(res);
                                            }
                                        }
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }
                            });
                        }
                    });
                }

                //筛选列
                if (!$.isEmptyObject(filterByColumn)) {
                    $element.on('mouseenter.body' + NAMESPACE, '.table-tools .custom-wrap', function () {
                        $(this).find('.choic-columns').show();
                    });
                    $element.on('mouseleave.body' + NAMESPACE, '.table-tools .custom-wrap', function () {
                        $(this).find('.choic-columns').hide();
                    });
                    $element.on('click.body' + NAMESPACE, '.table-tools .choic-columns .t-checkbox', function () {
                        $(this).toggleClass('active');
                    });
                    //确认按钮
                    $element.on('click.body' + NAMESPACE, '.table-tools .choic-columns .t-button', function () {
                        //为了更可读,me指向确认按钮,里面的this指向每个多选框
                        var selectIndex = [],
                            me = this;
                        $(me).parents('.choic-columns').find('.t-checkbox.active').each(function (index) {
                            var i = $(this).siblings().data('i');
                            selectIndex[index] = i;
                        });
                        self.selectIndex = selectIndex;
                        $element.find('.table-container th:not(.checkbox,.crud),.table-container td:not(.checkbox,.crud)').each(function (i, dom) {
                            var status = false;
                            $.each(selectIndex, function (index, value) {
                                if (i % colModelLength === value) {
                                    $(dom).show();
                                    status = true;
                                }
                            });
                            if (!status) {
                                $(dom).hide();
                            }
                        });
                        //4.20 调整页面布局
                        $element.trigger('resize');
                    });
                }

                //列移动
                if (resizeable) {
                    //关于列移动的相关变量
                    var resize = {
                        beginPageX: 0, //记录移动开始相对于页面的距离
                        beginLine: 0,
                        beginResize: 0,
                        move: false, //控制是否移动
                        index: 0
                    };
                    // 7.26 优化列移动的部分
                    $element.on('mousedown.body.' + NAMESPACE, '.table-container .col-resize', function (e) {
                        //为了获取距离
                        resize.beginPageX = e.pageX;
                        resize.beginLine = e.pageX - $element.offset().left;
                        resize.beginResize = this.offsetLeft;
                        resize.index = $element.find('.table-container .col-resize').index(this);
                        if (checkable) {
                            resize.index++;
                        }
                        $element.find('.table-container .liner').css({
                            height: $element.find('.table-container').height(),
                            left: resize.beginLine
                        }).show();
                        $(document).on('mouseup.body.' + NAMESPACE, function (e) {
                            var i = resize.index,
                                beginPageX = resize.beginPageX,
                                colModel = self.colModel;
                            var dis = e.pageX - beginPageX,
                                width = $element.find('.table-container th').eq(i).width() + dis;
                            if (width < 50) {
                                width = 50;
                            }
                            if (resize.move) {
                                $element.find('.table-container th:eq(' + i + '),.t-table-td tr:first-child td:eq(' + i + ')').width(width);
                                i += checkable ? -1 : 0;
                                //结束的时候把.col-resize复位
                                $element.find('.table-container .col-resize').eq(i).css({
                                    left: '',
                                    right: 0
                                });
                            }
                            $element.find('.table-container .liner').hide();
                            resize.move = false;
                            //3.28 每次更新th的宽度要同步更新td的宽度和colModel中的宽度
                            $element.find('.t-table-th th:not(.checkbox,.crud)').each(function (ti, tdom) {
                                var tw = $(tdom).outerWidth();
                                $element.find('.t-table-td tr:first-child td:not(.checkbox,.crud)').eq(ti).outerWidth(tw);
                                colModel[ti].width = tw;
                            });
                            //4.28 事件调整
                            $(document).off('mouseup.body.' + NAMESPACE);
                            $element.off('mousemove.body.' + NAMESPACE);
                            $(document).off('selectstart');
                        });
                        // 7.25 取消选定，使列移动更流畅
                        $(document).on('selectstart', function () {
                            return false;
                        });
                        $element.on('mousemove.body.' + NAMESPACE, '.table-container .t-table-th tr', function (e) {
                            var i = resize.index,
                                beginPageX = resize.beginPageX,
                                beginLine = resize.beginLine,
                                beginResize = resize.beginResize;
                            var dis = e.pageX - beginPageX, //相对于table的距离
                                minDis = 50 - $element.find('.table-container th').eq(i).width(); //获得距离最小限,这里假定th的宽度最小为50
                            if (dis < minDis) {
                                dis = minDis;
                            }
                            $element.find('.table-container .liner').css({
                                left: beginLine + dis
                            });
                            i += checkable ? -1 : 0;
                            $element.find('.table-container .col-resize').eq(i).css({
                                left: beginResize + dis
                            });
                            resize.move = true;
                        });
                    });
                }
                //用户自定义事件绑定
                if (tools.length > 0) {
                    for (var i = 0; i < tools.length; i++) {
                        var toolEvent = tools[i].toolEvent;
                        $element.on(toolEvent.type + '.body.' + NAMESPACE, '.table-tools>:nth-child(' + (i + 1) + ')', toolEvent.cb);
                    }
                }
                //3.22  补充监听容器元素
                $element.on('resize', function () {
                    var colModel = self.colModel,
                        ew = $element.width(),
                        thtw = $element.find('.t-table-th').outerWidth();
                    //5.19 调整
                    $element.find('.scrollBox').width(ew + 30).children('.t-table-td').outerWidth(thtw);
                    $element.find('.t-table-th th:not(.checkbox,.crud)').each(function (index, dom) {
                        //4.27 针对IE边框不对齐问题  //5.3   进行完整修缮
                        //5.11 修复在某些浏览器下不能获取style属性的问题
                        var tw = $(dom)[0].currentStyle !== undefined ? $(dom)[0].currentStyle.width : getComputedStyle($(dom)[0]).width;
                        $element.find('.t-table-td tr:first-child td:not(.checkbox,.crud)').eq(index).outerWidth(tw);
                        colModel[index].width = tw;
                    });
                });
            }
        }, {
            key: 'dynamicBind',
            value: function (data) {
                //3.28  添加动态绑定事件
                var self = this,
                    $element = self.$element,
                    bodyOptions = self.options.body,
                    rows = self.ajaxData.records,
                    cruds = bodyOptions.cruds;
                //1.绑定表格内事件
                if (cruds.length > 0) {
                    //3.30  调整
                    $element.find('.table-container  .t-table-td tr').each(function (tri, trdom) {
                        $.each(cruds, function (cri, cro) {
                            var crudsList = cro.data;
                            for (var j = 0; j < crudsList.length; j++) {
                                var crudEvent = crudsList[j].crudEvent;
                                $(trdom).on(crudEvent.type + '.body.' + NAMESPACE, 'td.crud:eq(' + cri + ')>:nth-child(' + (j + 1) + ')', function (e) {
                                    crudEvent.cb(data[tri], e);
                                });
                            }
                        });
                    });
                }
            }
        }], [{
            key: 'setDefaults',
            value: function setDefaults(options) {
                $.extend(DEFAULTS, $.isPlainObject(options) && options);
            }
        }]);
        return Table;
    }();

    var header = {
        /**
         * 3.23 添加公共变量容器
         */
        common: {
            dateOptArr: null,
            treeOpt: {}, //4.17 添加tree组件配置项,
            context: null, //4.24  添加table实例上下文
            eventArr: null //4.24 添加select自定义回调函数数组
        },
        // header 控制器
        control: function (obj, wrap, _this, context) {
            var elements, //4.14 防止多次调用函数
                template,
                downArrow,
                treeOpt, //4.17
                treeSetting,
                treeZNodes,
                treeIsNewAdd;
            this.common.context = context; //4.24  添加table实例上下文
            //4.26 每次调用table组件重新清空dateOptArr并且修复tree组件不出现的问题
            this.common.dateOptArr = [];
            elements = this.getElements(obj);
            template = elements.template;
            downArrow = elements.isDownArrow ? '<i class="release-btn"></i>' : '';
            treeOpt = this.common.treeOpt;
            treeSetting = treeOpt.setting;
            treeZNodes = treeOpt.zNodes;
            treeIsNewAdd = treeOpt.isNewAdd;
            //4.5 补充查询头样式功能
            //4.6 修正
            var tmpObj = $.extend(true, {}, DEFAULT, obj),
                headerQuery = tmpObj.headerQuery,
                aStr = '<a href="javascript:void(0)" class="t-button icon t-btn-search"><i class="t-btn-icon"></i><label class="t-btn-text">' + headerQuery.text + '</label></a>';
            if (!headerQuery.btnIcon) {
                aStr = '<a href="javascript:void(0)" class="t-button t-btn-search"><label class="t-btn-text">' + headerQuery.text + '</label></a>';
            }
            if (!template) return false;
            _this.append('<div class="t-table-header"><div class="header-condition"></div>' + aStr + downArrow + '</div>');
            this.fillHtml(template, wrap);
            //4.17  表头添加tree组件选项
            if (wrap.find('.t-select-tree')[0]) {
                //4.22 对树进行判断
                if (!$.isEmptyObject(treeOpt)) {
                    var treeCallBack = treeOpt.yesCallBack, //如果yesCallBack为false可取消确定按钮
                        $tTreeOptEle = wrap.find('.t-select-tree').find('.select-option'),
                        tl = wrap.find('.t-select-tree').length, //5.15
                        $yesBtn,
                        treeIdStr = '_tt_';
                    if (tl) {
                        treeIdStr += (tl - 1);
                    }
                    $tTreeOptEle.find('li:first-child').attr('id', treeIdStr).addClass('t-treeLi').tree(treeSetting, treeZNodes, treeIsNewAdd);
                    if (treeCallBack && typeof treeCallBack === 'function') {
                        //5.3 调整确定按钮的样式
                        $tTreeOptEle.css({
                            border: 'none',
                            position: 'static'
                        });
                        $yesBtn = $('<p class="t-table-treeYesP"><button class="t-table-treeYesBtn">确定</button></p>').css({
                            position: 'static',
                            display: 'none'
                        });
                        $tTreeOptEle.find('.t-treeLi').closest('.dvScrollBar').wrap('<div class="t-templateWrap" style="position:absolute;top:33px;z-index:10;"></div>');
                        $tTreeOptEle.closest('.t-select-tree').find('.t-templateWrap').append($yesBtn);
                    }
                }
            }
            this.bindEvent(tmpObj, wrap);
        },
        // 模版区
        templates: {
            'button': '<a href="javascript:void(0)" class="{{type}}" {{style}}>{{text}}</a>',
            'label': '<label class="t-label" {{style}} data-tkey="{{data}}">{{text}}</label>',
            'input': '<div class="t-input {{require}}" {{style}} data-tvalue="{{tvalue}}">' +
            '<div class="input-wrap">' +
            '<input class="text-input {{datepicker}}" type="text" placeholder="{{text}}" />' +
            '<i class="text-icon"></i>' +
            '</div>' +
            '<div class="tip-content tip-content-down warning">' +
            '<div class="tip-text">{{tip}}</div>' +
            '</div>' +
            '</div>',
            'select': '<div class="t-select {{require}} {{treeClass}} {{event}}" {{style}} data-tvalue="{{tvalue}}">' +
            '<div class="select-wrap">' +
            '<span class="select-span">{{text}}</span>' +
            '<i class="select-arrow"></i>' +
            '</div>' +
            '<div class="select-option dvScrollBar">' +
            '<ul>' +
            '<li>{{options}}</li>' +
            '</ul>' +
            '</div>' +
            '</div>',
        },
        //获取头部元素
        getElements: function (obj) {
            var
                _this = this, //3.23 用来获取header对象=>用以将公共变量存于common中
                templates = this.templates,
                hDefaults = DEFAULT.header,
                hData = obj.header,
                hStr = '',
                isDownArrow = 0;

            if (hData instanceof Array && hData.length !== 0) {
                $.each(hData, function (k, v) {
                    var newData = mapData(v, hDefaults),
                        h = writeInData(newData, templates, hDefaults); //4.14 防止多次调用函数
                    if (!h) return false;
                    hStr += h;
                });
                isDownArrow = isDownArrow > 0 ? true : false;
                return {
                    template: hStr,
                    isDownArrow: isDownArrow
                };
            } else if (hData === undefined) {
                return false;
            } else {
                console.error('table组件头部配置参数错误！');
            }

            // 处理缺省值 返回完整配置值
            function mapData(resource, defaults) {
                // 若value 为数组
                if (resource.value instanceof Array && resource.value.length !== 0) {
                    $.each(resource.value, function (k, v) {
                        resource.value[k] = $.extend({}, hDefaults.value, v);
                    });
                    var keyConfig = resource.key;
                    resource.key = $.extend({}, hDefaults.key, resource.key);
                    return $.extend({}, hDefaults, resource);
                } else {
                    console.error('table value传入格式错误！');
                    return false;
                }
            }

            // 写入数据
            function writeInData(data, template, defaults) {
                var
                    show,
                    require,
                    datepicker, //3.23添加日历选择项
                    columnWidth,
                    tip,
                    width,
                    marginLeft,
                    resultStr,
                    keyStr = template.label,
                    valueStr = '',
                    common = _this.common, //4.17
                    dArr = common.dateOptArr, //3.23 获取 datepicker的配置项的数组
                    di = dArr.length; //3.23  获取 datepicker的配置项的数组的当前下标
                /**
                 * 3.23 添加内容
                 */

                if (!data) return false;
                // key 写入
                keyStr = keyStr.replace(/{{text}}/, data.key.text + '：');
                if (data.key.name === '---') {
                    console.error('查询头中name字段必须传入！');
                    return false;
                }
                keyStr = keyStr.replace(/{{data}}/, data.key.name);
                if (data.key.width !== defaults.key.width) {
                    keyStr = keyStr.replace(/{{style}}/, 'style="width:' + data.key.width + '"');
                } else {
                    keyStr = keyStr.replace(/{{style}}/, '');
                }

                if (data) {
                    // value 写入
                    $.each(data.value, function (k, v) {
                        var flag = true;
                        for (var types in templates) {
                            if (types === v.type) {
                                flag = false;
                                valueStr += templates[types];
                                //4.6 默认设置的value的text作为data-tvalue的初始值
                                //4.22 调整initValue的值作为初始值，text作为初始的展示文本内容
                                var initValue = v.initValue;
                                valueStr = valueStr.replace(/{{tvalue}}/, initValue); //4.22 4.24 补充
                                // 7.14 设定初始值会显示出来
                                if (initValue) {
                                    if (v.type == 'select') {
                                        $.each(v.options, function (oi, ov) {
                                            var initOptVal = ov.name || ov.value;
                                            if (initOptVal === initValue) {
                                                valueStr = valueStr.replace(/{{text}}/, ov.text || ov.value);
                                            }
                                        });
                                    } else {
                                        valueStr = valueStr.replace(/{{text}}/, initValue);
                                    }
                                } else {
                                    valueStr = valueStr.replace(/{{text}}/, v.text);
                                }
                                // 宽度 marginLeft 写入
                                width = v.width !== defaults.value.width ? 'width:' + v.width + ';' : '';
                                marginLeft = v.marginLeft !== defaults.value.marginLeft ? 'margin-left:' + v.marginLeft + ';' : '';
                                width + marginLeft !== '' ?
                                    valueStr = valueStr.replace(/{{style}}/, 'style="' + width + marginLeft + '"') :
                                    valueStr = valueStr.replace(/{{style}}/, '');

                                // 必选项
                                require = v.require ? 'require' : '';
                                valueStr = valueStr.replace(/{{require}}/, require);

                                /**
                                 * 3.23 添加日历选择项    4.17
                                 */

                                if (v.type === 'input') {
                                    if (!$.isEmptyObject(v.datepicker)) {
                                        datepicker = 'datepicker';
                                        dArr[di] = v.datepicker;
                                        di++;
                                    } else {
                                        datepicker = '';
                                    }
                                    valueStr = valueStr.replace(/{{datepicker}}/, datepicker);
                                }

                                // 提示文字
                                tip = (v.tip && v.tip !== '') ? v.tip : '';
                                valueStr = valueStr.replace(/{{tip}}/, v.tip);

                                //4.24 添加select的自定义回调函数
                                if (v.type === 'select' && typeof v.callback === 'function') {
                                    valueStr = valueStr.replace(/{{event}}/, 't-select-event');
                                    if (!Array.isArray(common.eventArr)) {
                                        common.eventArr = [];
                                    }
                                    common.eventArr.push(v.callback);
                                } else {
                                    valueStr = valueStr.replace(/{{event}}/, '');
                                }
                                // 下拉选项遍历
                                if (v.options && v.options.length !== 0) {
                                    //4.17 表头添加tree组件的选项[调整]
                                    var optionsStr = '';
                                    $.each(v.options, function (ok, ov) {
                                        if (!ov.otype) {
                                            //4.22 调整select的接口value 与原生option中的value一致，text表示option的文本内容
                                            var value = ov.name ? ov.name : ov.value,
                                                text = ov.text ? ov.text : ov.value,
                                                dataStr = ov.name ? ('data-name=' + value) : ('data-value=' + value);
                                            optionsStr += '<li ' + dataStr + '>' + text + '</li>';
                                            valueStr = valueStr.replace(/{{treeClass}}/, '');
                                        } else if (ov.otype === 'tree' && v.type === 'select') {
                                            common.treeOpt.setting = ov.setting || {};
                                            common.treeOpt.zNodes = ov.zNodes || [];
                                            common.treeOpt.isNewAdd = ov.isNewAdd;
                                            common.treeOpt.yesCallBack = ov.yesCallBack;
                                            valueStr = valueStr.replace(/{{treeClass}}/, 't-select-tree');
                                        }
                                    });
                                    if (optionsStr) {
                                        valueStr = valueStr.replace(/<li>{{options}}<\/li>/, optionsStr);
                                    } else {
                                        valueStr = valueStr.replace(/<li>{{options}}<\/li>/, '<li></li>');
                                    }
                                } else {
                                    valueStr = valueStr.replace(/<li>{{options}}<\/li>/, '<li></li>');
                                }
                            }
                        }
                        if (flag) {
                            console.error('未知元素类型！');
                            return false;
                        }
                    });
                }
                // 块容器单元格判断
                resultStr = keyStr + valueStr;
                if (keyStr == false || valueStr == false) return false;
                // 显示隐藏
                show = data.show ? '' : 'none';
                show === 'none' ? isDownArrow++ : '';
                // 列宽度判断
                columnWidth = data.column === 1 ? '' : 'style="width:' + (parseInt(data.column) * 230 + (data.column - 1) * 10) + 'px"';
                // 固定容器
                resultStr = '<div class="t-form-wrap ' + show + '" ' + columnWidth + '>' + resultStr + '</div>';
                return resultStr;
            }
        },
        // 写入html 数据
        fillHtml: function (template, wrap) {
            if (!template) {
                wrap.css({
                    'display': 'none'
                });
                return false;
            } else {
                wrap.find('.header-condition').html(template);
                return true;
            }
        },
        // 绑定事件
        bindEvent: function (obj, wrap) {
            var
                dateOptArr = this.common.dateOptArr, //3.23 添加内容
                table = this.common.context, //4.24 添加table实例上下文
                formWrap = wrap.find('.header-condition'),
                pullDownBtn = wrap.find('.release-btn'),
                hideParts = formWrap.find('.none'),
                inquiryBtn = wrap.find('.t-btn-search'),
                tInputs = formWrap.find('.t-input'),
                $tSelectTree = formWrap.find('.t-select-tree'), //4.17
                yesCallBack = this.common.treeOpt.yesCallBack, //4.17
                eArr = this.common.eventArr, //4.24
                ei = 0; //4.24
            // 模拟表单数据挂载
            tInputs.each(function () {
                $(this).on('blur', '.input-wrap .text-input', function () {
                    $(this).closest('.t-input').attr('data-tvalue', $(this).val());
                });
                //4.25 添加点击enter发送请求事件
                $(this).on('keydown', '.input-wrap .text-input', function (e) {
                    if (e.keyCode === 13) {
                        //4.28  修复回车没有改变请求参数的问题
                        $(this).closest('.t-input').attr('data-tvalue', $(this).val());
                        inquiryBtn.trigger('click');
                    }
                });
            });

            //3.28  监听datepicker元素
            $('.datepicker').each(function () {
                $.utils.watchValChange(this, function (curVal) {
                    $(this).closest('[data-tvalue]').attr('data-tvalue', curVal);
                });
            });

            //4.22 调整select选择效果
            //4.24 调整
            formWrap.find('.t-select').each(function (si, sd) {
                var $this = $(this),
                    curCallback;
                if ($this.hasClass('t-select-event') && Array.isArray(eArr)) {
                    curCallback = eArr[ei++];
                }
                if (!$this.hasClass('t-select-tree')) {
                    $this.on('click', function () {
                        if (!$this.hasClass('active')) {
                            $this.addClass('active').find('.select-option').show();
                            $(document).on('click.tSelect-' + si, function (e) {
                                if ($.utils.isHide(e, $this, $this.find('.select-option'))) {
                                    $this.removeClass('active').find('.select-option').hide();
                                    $(document).off('click.tSelect-' + si);
                                }
                            });
                        } else {
                            $(document).off('click.tSelect-' + si);
                            $this.removeClass('active').find('.select-option').hide();
                        }
                    });
                    $this.on('click', 'li', function () {
                        var value = $(this).attr('data-name') !== undefined ? $(this).attr('data-name') : $(this).attr('data-value');
                        //5.17 添加选定后颜色变为#505050
                        $(this).closest('.t-select').attr('data-tvalue', value).find('.select-span').css('color', '#505050').html($(this).html());
                        //4.24 针对select自定义回调函数
                        if (typeof curCallback === 'function') {
                            curCallback(value);
                        }
                    });
                }
            })
            //4.17	4.22调整
            //5.3 调整确定按钮样式
            if ($tSelectTree[0]) {
                $tSelectTree.find('.select-wrap').on('click', function () {
                    var $this = $(this).parent();
                    if (!$this.hasClass('active')) {
                        $this.addClass('active').find('.select-option').show();
                        $(document).on('click.tSelectTree', function (e) {
                            if ($.utils.isHide(e, $this, $this.find('.select-option'))) {
                                $(this).off('click.tSelectTree');
                                $this.removeClass('active').find('.select-option').hide();
                                $tSelectTree.find('.t-table-treeYesP').hide();
                            }
                        });
                    } else {
                        $(document).off('click.tSelectTree');
                        $this.removeClass('active').find('.select-option').hide();
                    }
                    $tSelectTree.find('.t-table-treeYesP').toggle();
                });
                if (yesCallBack && typeof yesCallBack === 'function') {
                    //5.3 调整树的确定按钮
                    $tSelectTree.find('.t-table-treeYesBtn').on('click', function () {
                        var selectObj = yesCallBack();
                        $tSelectTree.attr('data-tvalue', selectObj.tvalue).removeClass('active').find('.select-span').css('color', '#505050').text(selectObj.text)
                            .parent().siblings('.select-option').hide();
                    });
                }
            }

            // 下拉按钮
            pullDownBtn.on('click', function () {
                if (hideParts.length < 1) return;
                if (hideParts.hasClass('none')) {
                    hideParts.removeClass('none');
                    $(this).addClass('active');
                } else {
                    hideParts.addClass('none');
                    $(this).removeClass('active');
                }
            });
            // 查询按钮
            inquiryBtn.on('click', function () {
                var cells = formWrap.find('.t-form-wrap:not(.none)'),
                    datas = getData(cells),
                    headerQuery = obj.headerQuery, //3.31  添加表单头的查询回调函数
                    hdcb = headerQuery.callback, //4.5 调整查询头的回调函数
                    hqCbParams = null, //3.31  添加表单头的查询回调函数
                    errorCallback = obj.body.errorCallback,	//5.25
                    success = obj.body.success,	//7.20 请求成功的回调函数
                    tempObj = {}; //3.23
                if (cells.length === 0) {
                    return false;
                }
                // 3.31 添加表格查询头的回调函数
                // 6.22 修改逻辑：先进行查询判断，再合并参数-防止查询明明为false，但仍传出去的情况
                if (hdcb && typeof hdcb === 'function') {
                    hqCbParams = hdcb();
                    //4.28 如果headerQuery的callback返回false自动退出
                    if (hqCbParams === false) {
                        return;
                    }
                    for (var hk in hqCbParams) {
                        table.ajaxData[hk] = hqCbParams[hk];
                    }
                }
                // 3.23 处理数据残余问题
                // 4.13 接口调整[兼容]  page=>pageIndex records=>pageSize sortName=>orderBy sortType=>orderType
                if ($.isPlainObject(datas) && !$.isEmptyObject(datas)) {
                    for (var attr in datas) {
                        table.ajaxData[attr] = datas[attr]; //3.23 这里空值也会处理
                    }
                    table.ajaxData = $.utils.removeObjProp(table.ajaxData);
                } else if ($.isEmptyObject(datas)) { //如果datas为空对象，只传ajax必要的部分给后台，目的是为了清空之前请求的内容
                    //4.13 接口调整[兼容]
                    for (var k in table.ajaxData) {
                        if (k === 'page' || k === 'records' || k === 'sortName' || k === 'sortType' || k === 'pageIndex' ||
                            k === 'pageSize' || k === 'orderBy' || k === 'orderType') {
                            tempObj[k] = table.ajaxData[k];
                        }
                    }
                    table.ajaxData = tempObj;
                }
                //4.6 每次查询应该是请求第一页的内容
                //4.27 调整
                if (table.ajaxData['pageIndex'] !== undefined) {
                    table.ajaxData['pageIndex'] = 1;
                } else if (table.ajaxData['page'] !== undefined) {
                    table.ajaxData['page'] = 1;
                }
                //4.14 补充清空selectedRows
                table.selectedRows = {};
                wrap.data('selectedRows', {});
                table.loading = true;
                table.loadingAjax({
                    data: table.ajaxData,
                    url: obj.body.url,
                    type: obj.body.mtype,
                    success: function (res) {
                        res = typeof res === 'string' ? JSON.parse(res) : res;
                        //5.25
                        if (res.status === 'error' && typeof errorCallback === 'function' && errorCallback(res) === true) {
                            return;
                        }
                        try {
                            if (res) {
                                //4.13 接口调整[兼容]		total=>totalCount page=>pageIndex
                                //4.28 预防返回的数值非法
                                //5.3 调整
                                var total = Number(res.total) || Number(res.total) === 0 ? Number(res.total) : res.totalCount,
                                    current = Number(res.pageIndex) || Number(res.pageIndex) === 0 ? Number(res.pageIndex) : res.page,
                                    pageCount = Number(res.totalPage) || Number(res.totalPage) === 0 ? Number(res.totalPage) : Math.ceil(parseFloat(res.total / res.records));
                                table.loading = false;
                                table.$element.find('.table-container>.loading').hide();
                                //5.19
                                if (res.data.length > 0) {
                                    table.$element.find('.noData').hide();
                                } else {
                                    table.$element.find('.noData').show();
                                }
                                table.total = total;
                                //5.11 修复查询会清空选定
                                table.selectedRows = {};
                                table.$element.data('selectedRows', {});
                                table.output(res.data);
                                if (table.$element.find('.t-table-th .t-checkbox').hasClass('active')) {
                                    table.$element.find('.t-table-th .t-checkbox').removeClass('active');
                                }
                                //4.6 查询头补充页码调整
                                $(wrap).find('.pageCode').remove();
                                $(wrap).find('.t-table-page').append(table.getPageCode({
                                    pageCount: pageCount,
                                    current: current,
                                    total: total
                                }));
                                table.dynamicBind(res.data);

                                //7.20 请求成功后的回调函数
                                if (typeof success === 'function') {
                                    success(res);
                                }
                            }
                        } catch (err) {
                            console.log('错误信息：', err);
                        }
                    }
                });
            });

            // 获取表单数据
            function getData(obj) {
                // 数据处理
                var datas = {};
                obj.each(function () {
                    var
                        dataArr,
                        keys = $(this).find('[data-tkey]'),
                        values = $(this).find('[data-tvalue]');

                    if (values.length === 1) {
                        dataArr = values.attr('data-tvalue');
                    } else if (values.length > 1) {
                        dataArr = [];
                        for (var i = 0; i < values.length; i++) {
                            var tval = values.eq(i).attr('data-tvalue');
                            if (values.eq(i).find('.datepicker')[0]) {
                                dataArr.push(tval);
                            } else if (values.eq(i).attr('data-tvalue') !== '') {
                                dataArr.push(tval);
                            }
                        }
                    }
                    //3.23   这里不设置限制
                    datas[keys.data('tkey')] = dataArr;
                });
                return datas;
            };

            /**
             * 3.23 添加调用日历选择器事件
             */
            if (dateOptArr.length > 0) {
                wrap.find('.datepicker').each(function (di, dom) {
                    $(dom).datepicker(dateOptArr[di]);
                });
            }
        }
    };
    var table = void 0;
    $.fn.table = function jQueryTable(option) {
        //外面的this指向jQuery对象,each里面的this指向jQuery中的dom对象
        this.each(function each() {
            var $this = $(this).append('<div class="t-table"  style="width:100%"></div>'),
                options = $.extend({}, $.isPlainObject(option) && option),
                tTable = $this.children('.t-table')[0];
            //把实例通过节点data属性暴露给外部,用以获取
            //渲染body部分
            $this.data(NAMESPACE, table = new Table(tTable, options));
        });
        return this;
    };
})(jQuery)