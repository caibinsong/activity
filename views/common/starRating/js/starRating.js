/* 
 * @file 星级评定组件
 * @author ko00(ko00ml@163.com)
 * @version 1.0.0
 */

(function ( $, window, document, undefined ) {

  'use strict';

  // 设置默认值
  var NAMESPACE = 'starRating';
  var noop = function(){};
  var DEFAULT = {
    totalStars: 5,
    useFullStars: false,
    starShape: 'straight',
    emptyColor: 'lightgray',
    hoverColor: 'rgba(68,145,225,.8)',
    activeColor: '#4491e1',
    useGradient: false,
    readOnly: false,
    disableAfterRate: true,
    baseUrl: false,
    starGradient: {
      start: '#4491e1',
      end: '#4491e1'
    },
    strokeWidth: 4,
    strokeColor: 'black',
    initialRating: 0,
    starSize: 20,
    callback: noop,
    onHover: noop,
    onLeave: noop
  };

	// 组件构造函数
  var Plugin = function( element, options ) {
    var _rating;
    this.element = element;
    this.$el = $(element);
    this.settings = $.extend( {}, DEFAULT, options );

    // 获取绑定在元素上的星星级别
    _rating = this.$el.data('rating') || this.settings.initialRating;
    this._state = {
      // 四舍五入到最近的半星
      rating: (Math.round( _rating * 2 ) / 2).toFixed(1)
    };

    // 为组件设置唯一的id
    this._uid = Math.floor( Math.random() * 999 );

    // 设置渐变的默认值
    if( !options.starGradient && !this.settings.useGradient ){
      this.settings.starGradient.start = this.settings.starGradient.end = this.settings.activeColor;
    }

    this._defaults = DEFAULT;
    this._name = NAMESPACE;
    this.init();
  };

  var methods = {
    init: function () {
      this.renderMarkup();
      this.addListeners();
      this.initRating();
    },

    addListeners: function(){
      if( this.settings.readOnly ){ return; }
      this.$stars.on('mouseover', this.hoverRating.bind(this));
      this.$stars.on('mouseout', this.restoreState.bind(this));
      this.$stars.on('click', this.handleRating.bind(this));
    },

    // hover效果
    hoverRating: function(e){
      var index = this.getIndex(e);
      this.paintStars(index, 'hovered');
      this.settings.onHover(index + 1, this._state.rating, this.$el);
    },

    // click效果
    handleRating: function(e){
      var index = this.getIndex(e);
      var rating = index + 1;

      this.applyRating(rating, this.$el);
      this.executeCallback( rating, this.$el );

      if(this.settings.disableAfterRate){
        this.$stars.off();
      }
    },

    applyRating: function(rating){
      var index = rating - 1;
      // 给选定的星星应用颜色并移除hover颜色
      this.paintStars(index, 'active');
      this._state.rating = index + 1;
    },

    restoreState: function(e){8
      var index = this.getIndex(e);
      var rating = this._state.rating || -1;
      this.paintStars(rating - 1, 'active');
      this.settings.onLeave(index + 1, this._state.rating, this.$el);
    },

    getIndex: function(e){
      var $target = $(e.currentTarget);
      var width = $target.width();
      var side = $(e.target).attr('data-side');

      // hover到star外面，用像素来计算hover到的目标位置
      side = (!side) ? this.getOffsetByPixel(e, $target, width) : side;
      side = (this.settings.useFullStars) ? 'right' : side ;

      var index = $target.index() - ((side === 'left') ? 0.5 : 0);

      // 设定未选定的条件
      index = ( index < 0.5 && (e.offsetX < width / 4) ) ? -1 : index;
      return index;
    },

    getOffsetByPixel: function(e, $target, width){
      var leftX = e.pageX - $target.offset().left;
      return ( leftX <= (width / 2) && !this.settings.useFullStars) ? 'left' : 'right';
    },

    initRating: function(){
      this.paintStars(this._state.rating - 1, 'active');
    },

    paintStars: function(endIndex, stateClass){
    // endIndex 是以0为起点
      var $polygonLeft;
      var $polygonRight;
      var leftClass;
      var rightClass;
	
	
      $.each(this.$stars, function(index, star){
        $polygonLeft = $(star).find('[data-side="left"]');
        $polygonRight = $(star).find('[data-side="right"]');
        leftClass = rightClass = (index <= endIndex) ? stateClass : 'empty';
        // 当下标为.5时，选定left的class名为实现效果
        leftClass = ( index - endIndex === 0.5 ) ? stateClass : leftClass;

        $polygonLeft.attr('class', 'svg-'  + leftClass + '-' + this._uid);
        $polygonRight.attr('class', 'svg-'  + rightClass + '-' + this._uid);

      }.bind(this));
    },

    renderMarkup: function () {
      var s = this.settings;
      var baseUrl = s.baseUrl ? location.href.split('#')[0] : '';

      // 手动插入svg标签，来控制属性
      var star = '<div class="t-jq-star" style="width:' + s.starSize+ 'px;  height:' + s.starSize + 'px;display:inline-block;cursor:pointer"><svg version="1.0" class="t-jq-star-svg" style="padding-left:3px;width:100%;height:100%;" shape-rendering="geometricPrecision" xmlns="http://www.w3.org/2000/svg" ' + this.getSvgDimensions(s.starShape) +  ' stroke-width:' + s.strokeWidth + 'px;" xml:space="preserve"><style type="text/css">.svg-empty-' + this._uid + '{fill:url(' + baseUrl + '#' + this._uid + '_SVGID_1_);}.svg-hovered-' + this._uid + '{fill:url(' + baseUrl + '#' + this._uid + '_SVGID_2_);}.svg-active-' + this._uid + '{fill:url(' + baseUrl + '#' + this._uid + '_SVGID_3_);}</style>' +

      this.getLinearGradient(this._uid + '_SVGID_1_', s.emptyColor, s.emptyColor, s.starShape) +
      this.getLinearGradient(this._uid + '_SVGID_2_', s.hoverColor, s.hoverColor, s.starShape) +
      this.getLinearGradient(this._uid + '_SVGID_3_', s.starGradient.start, s.starGradient.end, s.starShape) +
      this.getVectorPath(this._uid, {
        starShape: s.starShape,
        strokeWidth: s.strokeWidth,
        strokeColor: s.strokeColor
      } ) +
      '</svg></div>';

      // 根据星星数插入星星
      var starsMarkup = '';
      for( var i = 0; i < s.totalStars; i++){
        starsMarkup += star;
      }
      this.$el.css('display','inline-block').append(starsMarkup);
      this.$stars = this.$el.find('.t-jq-star');
    },

    getVectorPath: function(id, attrs){
      return (attrs.starShape === 'rounded') ?
        this.getRoundedVectorPath(id, attrs) : this.getSpikeVectorPath(id, attrs);
    },

    getSpikeVectorPath: function(id, attrs){
      return '<polygon data-side="center" class="svg-empty-' + id + '" points="281.1,129.8 364,55.7 255.5,46.8 214,-59 172.5,46.8 64,55.4 146.8,129.7 121.1,241 212.9,181.1 213.9,181 306.5,241 " style="fill: transparent; stroke: ' + attrs.strokeColor + ';" />' +
        '<polygon data-side="left" class="svg-empty-' + id + '" points="281.1,129.8 364,55.7 255.5,46.8 214,-59 172.5,46.8 64,55.4 146.8,129.7 121.1,241 213.9,181.1 213.9,181 306.5,241 " style="stroke-opacity: 0;" />' +
          '<polygon data-side="right" class="svg-empty-' + id + '" points="364,55.7 255.5,46.8 214,-59 213.9,181 306.5,241 281.1,129.8 " style="stroke-opacity: 0;" />';
    },

    getRoundedVectorPath: function(id, attrs){
      var fullPoints = 'M520.9,336.5c-3.8-11.8-14.2-20.5-26.5-22.2l-140.9-20.5l-63-127.7 c-5.5-11.2-16.8-18.2-29.3-18.2c-12.5,0-23.8,7-29.3,18.2l-63,127.7L28,314.2C15.7,316,5.4,324.7,1.6,336.5S1,361.3,9.9,370 l102,99.4l-24,140.3c-2.1,12.3,2.9,24.6,13,32c5.7,4.2,12.4,6.2,19.2,6.2c5.2,0,10.5-1.2,15.2-3.8l126-66.3l126,66.2 c4.8,2.6,10,3.8,15.2,3.8c6.8,0,13.5-2.1,19.2-6.2c10.1-7.3,15.1-19.7,13-32l-24-140.3l102-99.4 C521.6,361.3,524.8,348.3,520.9,336.5z';

      return '<path data-side="center" class="svg-empty-' + id + '" d="' + fullPoints + '" style="stroke: ' + attrs.strokeColor + '; fill: transparent; stroke-linejoin: round;" /><path data-side="right" class="svg-empty-' + id + '" d="' + fullPoints + '" style="stroke-opacity: 0;stroke-linejoin: round;" /><path data-side="left" class="svg-empty-' + id + '" d="M121,648c-7.3,0-14.1-2.2-19.8-6.4c-10.4-7.6-15.6-20.3-13.4-33l24-139.9l-101.6-99 c-9.1-8.9-12.4-22.4-8.6-34.5c3.9-12.1,14.6-21.1,27.2-23l140.4-20.4L232,164.6c5.7-11.6,17.3-18.8,30.2-16.8c0.6,0,1,0.4,1,1 v430.1c0,0.4-0.2,0.7-0.5,0.9l-126,66.3C132,646.6,126.6,648,121,648z" style="stroke: ' + attrs.strokeColor + '; stroke-opacity: 0;stroke-linejoin: round;" />';
    },

    getSvgDimensions: function(starShape){
      return (starShape === 'rounded') ? 'width="550px" height="500.2px" viewBox="0 146.8 550 500.2" style="enable-background:new 0 0 550 500.2;' : 'x="0px" y="0px" width="305px" height="305px" viewBox="60 -62 309 309" style="enable-background:new 64 -59 305 305;';
    },

    getLinearGradient: function(id, startColor, endColor, starShape){
      var height = (starShape === 'rounded') ? 500 : 250;
      return '<linearGradient id="' + id + '" gradientUnits="userSpaceOnUse" x1="0" y1="-50" x2="0" y2="' + height + '"><stop  offset="0" style="stop-color:' + startColor + '"/><stop  offset="1" style="stop-color:' + endColor + '"/> </linearGradient>';
    },

    executeCallback: function(rating, $el){
      var callback = this.settings.callback;
      callback(rating, $el);
    }

  };

  var publicMethods = {

    unload: function() {
      var _name = 'plugin_' + NAMESPACE;
      var $el = $(this);
      var $starSet = $el.data(_name).$stars;
      $starSet.off();
      $el.removeData(_name).remove();
    },

    setRating: function(rating, round) {
      var _name = 'plugin_' + NAMESPACE;
      var $el = $(this);
      var $plugin = $el.data(_name);
      if( rating > $plugin.settings.totalStars || rating < 0 ) { return; }
      if( round ){
        rating = Math.round(rating);
      }
      $plugin.applyRating(rating);
    },

    getRating: function() {
      var _name = 'plugin_' + NAMESPACE;
      var $el = $(this);
      var $starSet = $el.data(_name);
      return $starSet._state.rating;
    },

    resize: function(newSize) {
      var _name = 'plugin_' + NAMESPACE;
      var $el = $(this);
      var $starSet = $el.data(_name);
      var $stars = $starSet.$stars;

      if(newSize <= 1 || newSize > 200) {
        console.log('star size out of bounds');
        return;
      }

      $stars = Array.prototype.slice.call($stars);
      $stars.forEach(function(star){
        $(star).css({
          'width': newSize + 'px',
          'height': newSize + 'px'
        });
      });
    },

    setReadOnly: function(flag) {
      var _name = 'plugin_' + NAMESPACE;
      var $el = $(this);
      var $plugin = $el.data(_name);
      if(flag === true){
        $plugin.$stars.off('mouseover mouseout click');
      } else {
        $plugin.settings.readOnly = false;
        $plugin.addListeners();
      }
    }

  };


  $.extend(Plugin.prototype, methods);

  $.fn[ NAMESPACE ] = function ( options ) {
	options = options === undefined ? {} : options;
    // options为方法时
    if( !$.isPlainObject(options) ){
      if( publicMethods.hasOwnProperty(options) ){
        return publicMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
      } else {
        $.error('Method '+ options +' does not exist on ' + NAMESPACE + '.js');
      }
    }

    return this.each(function() {
    //组件复用
      if ( !$.data( this, 'plugin_' + NAMESPACE ) ) {
        $.data( this, 'plugin_' + NAMESPACE, new Plugin( this, options ) );
      }
    });
  };

})( jQuery, window, document );


