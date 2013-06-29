/**
 * the New YPlayer
 * @author Joker Qyou <Joker.Qyou@gmail.com>
 * @date 2013.6.23
 */
!(function(){
	/**
	 * 为不足两位的字符串补齐'0'
	 * @param  {String|Integer} str 要补齐的字符串
	 * @return {String}     补齐后的字符串
	 */
	function add0(str){
		str = str.toString();
		return (str.length<2)?('0'+str):(str);
	};
	/**
	 * 检查数组中是否含有指定的对象
	 * @param  {Any} elem  指定的对象
	 * @param  {Array} array 要检查的数组
	 * @return {Boolean}       检测结果
	 */
	function inArray(elem, array){
		for(var _i = 0; _i < array.length; _i ++){
			if(array[_i] === elem){
				return true;
			}
		}
		return false;
	};
	/**
	 * 推送不重复的对象到数组中
	 * @param  {Array} array 目标数组
	 * @param  {Any} elem  要添加的对象
	 * @return {Integer|Boolean}       成功时返回新的数组长度，若数组中已经含有该对象，则返回 false
	 */
	function push(array, elem){
		if(!inArray(elem, array)){
			array[array.length] = elem;
			return array.length;
		}
		return false;
	};
	/**
	 * 一些常用方法的简写
	 */
	var get = document.querySelector.bind(document);
	var create = document.createElement.bind(document);
	var getBlobURL = (window.URL && URL.createObjectURL.bind(URL)) || (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) || window.createObjectURL;
	var revokeBlobURL = (window.URL && URL.revokeObjectURL.bind(URL)) || (window.webkitURL && webkitURL.revokeObjectURL.bind(webkitURL)) || window.revokeObjectURL;
	/**
	 * 核心对象
	 */
	var core = {
		audio: new Audio(),
		now: null,
		list: [],
		played: [],
		ctrls: {
			play: get('#play'),
			next: get('#next'),
			file: get('#file'),
			playlist: get('#playlist'),
			progress: get('#progress'),
			nowprogress: get('#now'),
			nowitem: get('#nowitem'),
			volumebar: get('#volumebar'),
			volume: get('#volume'),
			time: get('#time')
		},
		cfg: {
			loop: 'no',
			shuffle: false
		}
	};
	/**
	 * 遍历由文件控件获取的文件列表，解析符合要求的音频文件到播放列表中
	 * @param  {[type]} files 文件列表
	 * @return {None}       不返回值
	 */
	function parseDir(files){
		var _re = /\.mp3$|\.m4a$|\.ogg$/i;
		if(files.length){
			for(var _i = 0; _i < files.length; _i ++){
				if(_re.test(files[_i].name)){
					core.list.push(files[_i]);
				}
			}
		}
	};
	/**
	 * 产生对比合适的颜色对
	 * @return {Array} 产生的颜色对，包含两个颜色
	 */
	function randomColors(){
		var _h, _s, _l, _a, _h1, _s1, _l1, c = [];
		_h = Math.floor(Math.random() * 360);
		_s = Math.floor(Math.random() * 100);
		_l = Math.floor(15 + Math.random() * 70);
		_a = 1;
		_h1 = (_h > 240)?(_h - 120):(_h + 120);
		_s1 = Math.floor(15 + Math.random() * 85);
		_l1 = ((_l - 50) >= 0)?(_l - 50):(_l + 50);
		c.push('hsla(' + _h + ', ' + _s + '%, ' + _l + '%, ' + _a + ')');
		c.push('hsla(' + _h1 + ', ' + _s1 + '%, ' + _l1 + '%, ' + _a + ')');
		return c;
	};
	/**
	 * 显示列表
	 * @return {None} 不返回值
	 */
	function showList(){
		for(var _i = 0; _i < core.list.length; _i ++){
			var _name = core.list[_i].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, ''),
				_colorPair = randomColors(),
				_item = create('li');
			_item.innerHTML = _name;
			_item.title = _name;
			_item.dataset.songId = _i;
			_item.style.backgroundColor = _colorPair[0];
			_item.style.color = _colorPair[1];
			core.ctrls.playlist.appendChild(_item);
		}
	};

	function play(id){
		if(core.list.length){
			var _URL = getBlobURL(core.list[id]);
			core.audio.src = _URL;
			core.audio.play();
		}
	};

	/**
	 * 事件绑定
	 */
	core.ctrls.play.addEventListener('click', function(){
		if(!core.list.length){
			core.ctrls.file.click();
			return false;
		}
	});
	core.ctrls.file.addEventListener('change', function(){
		parseDir(this.files);
		showList();
	});
	core.ctrls.playlist.addEventListener('click', function(e){
		e = e || window.event;
		var _target = e.target || e.srcElement;
		play(_target.dataset.songId);
	});
})();
