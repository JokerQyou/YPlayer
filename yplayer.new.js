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

	function changeClass(element, oldClass, newClass){
		element.className = element.className.replace(oldClass, newClass);
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
		ready: false,
		played: [],
		ctrls: {
			play: get('#play'),
			next: get('#next'),
			file: get('#file'),
			playlist: get('#playlist'),
			listswitch: get('#listswitch'),
			progress: get('#progress'),
			nowprogress: get('#now'),
			songtitle: get('#songtitle'),
			search: get('#keyword'),
			searchweb: get('#searchweb'),
			shuffleswitch: get('#shuffleswitch'),
			repeatswitch: get('#repeatswitch'),
			redraw: get('#redraw'),
			mask: get('.mask'),
			cdmask: get('#cdmask')
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
		if(core.list.length != 0){
			core.ready = true
			showList();
		}
	};
	/**
	 * 显示列表
	 * @return {None} 不返回值
	 */
	function showList(){
		for(var _i = 0; _i < core.list.length; _i ++){
			var _name = core.list[_i].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, ''),
				_item = create('span');
			_item.className = 'song';
			_item.innerHTML = _name;
			_item.title = _name;
			_item.dataset.songId = _i;
			core.ctrls.playlist.appendChild(_item);
		}
		unmask();
		changeClass(core.ctrls.play, 'add', 'play');
		switchList();
	};

	function play(id){
		if(core.ready){
			if(!core.audio.src){
				var _URL = getBlobURL(core.list[id]);
				core.audio.src = _URL;
				core.audio.play();
				core.now = id;
				core.ctrls.songtitle.innerHTML = core.list[id].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
				var _now = get('[data-song-id="' + id + '"]');
				_now.className += ' now';
				changeClass(core.ctrls.cdmask, 'paused', 'running');
				changeClass(core.ctrls.play, 'play', 'pause');
				return false;
			}else{
				if(id == core.now){
					if(core.audio.paused){
						core.audio.play();
						changeClass(core.ctrls.cdmask, 'paused', 'running');
						changeClass(core.ctrls.play, 'play', 'pause');
						return false;
					}else{
						return false;
					}
				}else{
					revokeBlobURL(core.audio.src);
					var _now = get('[data-song-id="' + core.now + '"]');
					changeClass(_now, 'now', '');
					var _URL = getBlobURL(core.list[id]);
					core.audio.src = _URL;
					core.audio.play();
					core.now = id;
					core.ctrls.songtitle.innerHTML = core.list[id].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
					var _now = get('[data-song-id="' + id + '"]');
					_now.className += ' now';
					changeClass(core.ctrls.cdmask, 'paused', 'running');
					changeClass(core.ctrls.play, 'play', 'pause');
					return false;
				}
			}
		}else{
			return false;
		}
	};

	function pause(){
		if(!core.audio.paused){
			core.audio.pause();
			changeClass(core.ctrls.cdmask, 'running', 'paused');
			changeClass(core.ctrls.play, 'pause', 'play');
		}
	};

	function updateProgress(){
		if(!core.audio.src){
			return false;
		}else{
			var _audio = core.audio;
			if(_audio.currentTime > 0 && _audio.currentTime < _audio.duration){
				var _progress = (100 / _audio.duration) * _audio.currentTime;
			}else{
				var _progress = 0;
			}
			core.ctrls.nowprogress.style.width = _progress + '%';
		}
	};

	function mask(){
		changeClass(core.ctrls.mask, 'hide', 'show');
	};

	function unmask(){
		changeClass(core.ctrls.mask, 'show', 'hide');
	};

	function switchList(){
		var _list = core.ctrls.playlist;
		if(inArray('rhide', _list.classList)){
			changeClass(_list, 'rhide', 'rshow');
		}else{
			changeClass(_list, 'rshow', 'rhide');
		}
		return false;
	};

	function searchList(keyword){
		var _list = core.ctrls.playlist;
		for(var _i = 0; _i < _list.children.length; _i ++){
			if(_list.children[_i].innerHTML.search(keyword) != -1){
				return _list.children[_i];
			}
		}
		return false;
	};

	function getNextSong(){
		if(core.cfg.loop == 'no'){
			if(core.played.length == core.list.length){
				return -1;
			}
			if(!core.cfg.shuffle){
				if(core.now == null){
					return 0;
				}
				if(core.now < core.list.length - 1){
					var _n = core.now + 1;
				}else{
					var _n = 0;
				}
				if(inArray(_n, core.played)){
					getNextSong();
				}else{
					return _n;
				}
			}else{
				var _n = Math.floor(Math.random() * core.list.length);
				if(inArray(_n, core.played)){
					getNextSong();
				}else{
					return _n;
				}
			}
		}else if(core.cfg.loop == 'single'){
			if(core.now){
				return core.now;
			}else{
				return 0;
			}
		}else if(core.cfg.loop == 'list'){
			if(!core.cfg.shuffle){
				if(core.now == null){
					return 0;
				}
				if(core.now < core.list.length - 1){
					return core.now + 1;
				}else{
					return 0;
				}
			}else{
				var _n = Math.floor(Math.random() * core.list.length);
				return _n;
			}
		}
	};

	function searchWeb(id){
		var _API = 'https://www.google.com/search?q=';
		var _keyword = core.list[id].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
		_API = _API + _keyword;
		window.open(_API, 'ywebsearch');
	};

	/**
	 * 事件绑定
	 */
	core.ctrls.play.addEventListener('click', function(){
		if(!core.ready){
			mask();
			core.ctrls.file.click();
		}else{
			if(!!core.audio.src){
				if(core.audio.paused){
					play(core.now);
				}else{
					pause();
				}
			}else{
				var _next = getNextSong();
				play(_next);
			}
		}
		return false;
	});
	core.ctrls.next.addEventListener('click', function(){
		if(core.ready){
			var _next = getNextSong();
			play(_next);
		}
	});
	core.ctrls.file.addEventListener('change', function(){
		parseDir(this.files);
	});
	core.ctrls.playlist.addEventListener('click', function(e){
		e = e || window.event;
		var _target = e.target || e.srcElement;
		if(!!_target.dataset.songId){
			play(parseInt(_target.dataset.songId));
		}
		return false;
	});
	core.ctrls.listswitch.addEventListener('click', switchList);

	core.audio.addEventListener('timeupdate', updateProgress);
	core.ctrls.mask.addEventListener('click', unmask);
	document.onkeydown = function(e){
		e = e || window.event;
		if(e.keyCode == 70 && e.ctrlKey){
			changeClass(get('#search'), 'lhide', 'lshow');
			core.ctrls.search.focus();
			return false;
		}else if(e.keyCode == 27){
			changeClass(get('#search'), 'lshow', 'lhide');
			changeClass(core.ctrls.playlist, 'rshow', 'rhide');
		}
	};
	core.ctrls.search.addEventListener('keydown', function(){
		var _result = searchList(this.value);
		if(!!_result){
			core.ctrls.playlist.scrollTop = _result.offsetTop;
		}
	});
	core.ctrls.searchweb.addEventListener('click', function(){
		if(core.ready && core.now){
			searchWeb(core.now);
		}
		return false;
	});
})();
