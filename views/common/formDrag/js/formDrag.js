/* 
 * @file 表单滑动验证组件
 * @author ko00(ko00ml@163.com)
 * @version 1.0.0
 */
(function($) {
	var DEFAULT = {
		width: '',
		tipText:'请按住滑动块拖动到最右边',
		okText: '验证通过',
		okTextColor: '#a4d9ff',
		dragBgColor: '#0056ff'
	};
	var NAMESPACE = 'formDrag';
	var FormDrag = function() {
		function FormDrag(ele, options) {
			this.$ele = $(ele);
			this.options = $.extend({}, DEFAULT, options);
			this.init();
			this.bind();
		}

		FormDrag.prototype.init = function() {
			var $ele = this.$ele;
			var options = this.options;
			var width = options.width || 400;
			var tipText = options.tipText;
			var dragBgColor = options.dragBgColor;
			
			//添加背景，文字，滑块
			var html = '<div class="drag-bg">'
					+'<div class="drag-leftBg" style="background-color:'+dragBgColor+';"></div>'
					+'<div class="drag-rightBg"></div>'
					+'</div>'
					+ '<div class="drag-text" onselectstart="return false;" unselectable="on">'+tipText+'</div>' 
					+ '<div class="move move-bg"></div>';
			$ele.css('width',width).addClass('t-formDrag').append(html);
		};

		FormDrag.prototype.bind = function() {
			var x ;
			var isMove = false;
			var $ele = this.$ele;
			var options = this.options;
			var okText = options.okText ;
			var okTextColor = options.okTextColor;
			var $move = $ele.find('.move');
			var $dragLeftBg = $ele.find('.drag-leftBg');
			var $dragRightBg = $ele.find('.drag-rightBg');
			var $text = $ele.find('.drag-text');
			var maxWidth = $ele.width() - $move.width(); //能滑动的最大间距
			var fdLens 	= $('.t-formDrag').length;	//判断使用formDrag的个数=>为了避免组件重用导致取消document的mouse事件
			var fdWidth = $('.t-formDrag').width();	
			var mar = $move.css('borderRadius');
			var moveEleRadius = mar.slice(0,mar.indexOf('p'));
			
			//鼠标按下时候的x轴的位置
			$move.on('mousedown.' + NAMESPACE,function(e) {
				isMove = true;
				x = e.pageX;
			});

			//鼠标指针在上下文移动时，移动距离大于0小于最大间距，滑块x轴位置等于鼠标移动距离
			$(document).on('mousemove.' + NAMESPACE + '.' + fdLens, function(e) {
				var dis = e.pageX - x;
				if(isMove) {
					$move.css('borderRadius',0);
					if(dis > 0 && dis <= maxWidth) {
						$move.css({ 'left': dis });
						$dragLeftBg.css({ 'width': dis });
						$dragRightBg.css({ 'width': (fdWidth - dis) });
					} else if(dis > maxWidth) { //鼠标指针移动距离达到最大时清空事件
						dragOk();
					}
				}
			}).on('mouseup.' + NAMESPACE + '.' + fdLens, function(e) {
				var dis = e.pageX - x;
				isMove = false;
				if(dis < maxWidth) { //鼠标松开时，如果没有达到最大距离位置，滑块就返回初始位置
					$move.animate({ 'left': 0 },500,function(){
						$(this).css('borderRadius', moveEleRadius+'px '+' 0 0 '+moveEleRadius+'px');
					});
					$dragLeftBg.animate({ 'width': 0 },500);
					$dragRightBg.animate({ 'width': '100%' },500);
				}
			});

			//验证成功
			function dragOk() {
				//为了规避鼠标异常超出，需定死move和dragBg的最终状态
				$move.css({ 'left': maxWidth , 'display':'none'});
				$dragLeftBg.css({ 'width': fdWidth ,'borderRadius':moveEleRadius+'px'});
				$dragRightBg.css({ 'width': 0});
				$text.css({ 'color': okTextColor,'textAlign':'center','textIndent':0}).text(okText);
				$move.off('mousedown.' + NAMESPACE);
				$(document).off('mousemove.' + NAMESPACE + '.' + fdLens);
				$(document).off('mouseup.' + NAMESPACE + '.' + fdLens);
			}
		};
		return FormDrag;
	}()
	
	$.fn.formDrag = function jqueryFormDrag(options) {
		$(this).each(function(index,curDom){
			$(curDom).data('formDrag',new FormDrag(curDom, options));
		});
		return this;
	};
})(jQuery);