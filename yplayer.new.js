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
	 * 更改元素的类名
	 * @param  {Element} element  要更改的元素
	 * @param  {String} oldClass 元素原来的类名
	 * @param  {String} newClass 新类名
	 * @return {None}          不返回值
	 */
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
		notification: false,
		played: [],
		ctrls: {
			play: get('#play'),
			next: get('#next'),
			file: get('#file'),
			playlist: get('#playlist'),
			listswitch: get('#listswitch'),
			progressContainer: get('#prog'),
			progress: get('#progress'),
			nowprogress: get('#now'),
			songtitle: get('#songtitle'),
			search: get('#keyword'),
			searchweb: get('#searchweb'),
			shuffleswitch: get('#shuffleswitch'),
			repeatswitch: get('#repeatswitch'),
			mask: get('.mask'),
			cdmask: get('#cdmask'),
			volume: get('#volume')
		},
		cfg: {
			loop: 'no',
			shuffle: false,
			volume: 'full'
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

	function notify(id){
		if(!!window.webkitNotifications){
			if(window.webkitNotifications.checkPermission() == 0){
				core.notification = true;
			}else{
				window.webkitNotifications.requestPermission();
			}
			console.log(core);
		}
		if(core.notification){
			var _item = core.list[id];
			var _timeout = 5000;
			var _name = _item.name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
			var _notification = window.webkitNotifications.createNotification('music.png', 'YPlayer', '正在播放：' + _name);
			_notification.ondisplay = function(e){
				e = e || window.event;
				setTimeout(function(){
					e.currentTarget.cancel();
				}, _timeout);
			};
			_notification.show();
		}
	};

	/**
	 * 播放指定的歌曲
	 * @param  {Integer} id 要播放的歌曲 ID
	 * @return {Boolean}    返回 false
	 */
	function play(id){
		console.log(core);
		// 列表存在才能播放
		if(core.ready){
			// 核心 SRC 未定义，是初次播放
			if(!core.audio.src){
				var _URL = getBlobURL(core.list[id]);
				core.audio.src = _URL;
				core.audio.play();
				core.now = id;
				push(core.played, core.now);
				core.ctrls.songtitle.innerHTML = core.list[id].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
				var _now = get('[data-song-id="' + id + '"]');
				_now.className += ' now';
				notify(core.now);
				return false;
			}else{
				// 核心 SRC 有定义，且要求播放当前正在播放的曲目
				if(id == core.now){
					// 处于暂停状态，继续播放即可
					if(!core.audio.ended && core.audio.paused){
						core.audio.play();
						return false;
					// 播放已经结束，重新生成 BlobURL 进行播放（ Firefox 下不作次处理会有问题）
					}else if(core.audio.ended){
						var _URL = getBlobURL(core.list[id]);
						revokeBlobURL(core.audio.src);
						core.audio.src = _URL;
						core.audio.play();
						notify(core.now);
					// 正在播放指定的曲目，不作任何操作
					}else{
						return false;
					}
				// 核心 SRC 有定义，且要求播放不同的曲目
				}else{
					revokeBlobURL(core.audio.src);
					var _now = get('[data-song-id="' + core.now + '"]');
					changeClass(_now, 'now', '');
					var _URL = getBlobURL(core.list[id]);
					core.audio.src = _URL;
					core.audio.play();
					core.now = id;
					push(core.played, core.now);
					core.ctrls.songtitle.innerHTML = core.list[id].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
					var _now = get('[data-song-id="' + id + '"]');
					_now.className += ' now';
					notify(core.now);
					return false;
				}
			}
		}else{
			// 没有列表，无法播放
			return false;
		}
	};

	/**
	 * 暂停播放
	 * @return {None} 不返回值
	 */
	function pause(){
		if(!core.audio.paused){
			core.audio.pause();
		}
	};

	/**
	 * 更新进度条
	 * @return {Boolean} 返回 false
	 */
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
		return false;
	};

	/**
	 * 产生全屏遮罩
	 * @return {None} 不返回值
	 */
	function mask(){
		changeClass(core.ctrls.mask, 'hide', 'show');
	};

	/**
	 * 解开全屏遮罩
	 * @return {None} 不返回值
	 */
	function unmask(){
		changeClass(core.ctrls.mask, 'show', 'hide');
	};

	/**
	 * 切换播放列表显示状态
	 * @return {Boolean} 返回 false
	 */
	function switchList(){
		var _list = core.ctrls.playlist;
		if(inArray('rhide', _list.classList)){
			changeClass(_list, 'rhide', 'rshow');
		}else{
			changeClass(_list, 'rshow', 'rhide');
		}
		return false;
	};

	/**
	 * 在列表中搜索指定关键词
	 * @param  {String} keyword 要搜索的关键词
	 * @return {Element|Boolean}         如果找到匹配项目则返回该元素，否则返回 false
	 */
	function searchList(keyword){
		var _list = core.ctrls.playlist;
		for(var _i = 0; _i < _list.children.length; _i ++){
			if(_list.children[_i].innerHTML.search(keyword) != -1){
				return _list.children[_i];
			}
		}
		return false;
	};

	/**
	 * 计算下一首歌的 ID
	 * @return {Integer} 若不应继续播放了，返回 -1 ；否则返回应当播放的歌曲 ID
	 */
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
				console.log(core);
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

	/**
	 * 打开新窗口进行网络搜索
	 * @param  {Integer} id 要搜索的歌曲 ID
	 * @return {None}    不返回值
	 */
	function searchWeb(id){
		var _API = 'https://www.google.com/search?q=';
		var _keyword = core.list[id].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '').replace(/^\d{2,}(\ |\.|\-)/i, '');
		_API = _API + _keyword;
		window.open(_API, 'ywebsearch');
	};

	/**
	 * 设置音量
	 * @param  {String} str 音量类名，对应 5 个档次音量中的一个
	 * @return {Boolean}     返回 false
	 */
	function updateVolume(str){
		var _volumes = [0, 0.25, 0.5, 0.75, 1];
		var _classes = ['muted', 'quarter', 'twoquarter', 'triquarter', 'full'];
		var _newvolume = _classes.indexOf(str);
		if(_newvolume != -1){
			_newvolume = _volumes[_newvolume];
		}
		core.audio.volume = _newvolume;
		return false;
	};

	/**
	 * 事件绑定
	 */
	/**
	 * 播放按钮
	 * 同时作为添加文件夹/文件的按钮
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
	/**
	 * 下一曲
	 */
	core.ctrls.next.addEventListener('click', function(){
		if(core.ready){
			var _next = getNextSong();
			play(_next);
		}
	});
	/**
	 * 触发添加列表的动作
	 */
	core.ctrls.file.addEventListener('change', function(){
		parseDir(this.files);
	});
	/**
	 * 从播放列表播放歌曲
	 */
	core.ctrls.playlist.addEventListener('click', function(e){
		e = e || window.event;
		var _target = e.target || e.srcElement;
		if(!!_target.dataset.songId){
			play(parseInt(_target.dataset.songId));
		}
		return false;
	});
	/**
	 * 切换播放列表的显示状态
	 */
	core.ctrls.listswitch.addEventListener('click', switchList);

	/**
	 * 自动更新进度条
	 */
	core.audio.addEventListener('timeupdate', updateProgress);
	/**
	 * 在遮罩上点击，自动撤销遮罩
	 */
	core.ctrls.mask.addEventListener('click', unmask);
	/**
	 * 搜索快捷键： Ctrl + F
	 * 关闭搜索和播放列表： Esc
	 */
	document.onkeydown = function(e){
		e = e || window.event;
		if(e.keyCode == 70 && e.ctrlKey){
			changeClass(get('#search'), 'lhide', 'lshow');
			changeClass(core.ctrls.playlist, 'rhide', 'rshow');
			core.ctrls.search.focus();
			return false;
		}else if(e.keyCode == 27){
			changeClass(get('#search'), 'lshow', 'lhide');
			changeClass(core.ctrls.playlist, 'rshow', 'rhide');
		}
	};
	/**
	 * 搜索功能
	 */
	core.ctrls.search.addEventListener('keydown', function(){
		var _result = searchList(this.value);
		if(!!_result){
			core.ctrls.playlist.scrollTop = _result.offsetTop;
		}
	});
	/**
	 * 在网络上搜索当前播放的歌曲
	 */
	core.ctrls.searchweb.addEventListener('click', function(){
		if(core.ready && core.now){
			searchWeb(core.now);
		}
		return false;
	});
	/**
	 * 切换随机播放状态
	 */
	core.ctrls.shuffleswitch.addEventListener('click', function(){
		if(core.cfg.shuffle){
			core.cfg.shuffle = false;
			changeClass(this, 'true', 'false');
		}else{
			core.cfg.shuffle = true;
			changeClass(this, 'false', 'true');
		}
		return false;
	});
	/**
	 * 切换循环播放状态
	 */
	core.ctrls.repeatswitch.addEventListener('click', function(){
		var _allowed = ['no', 'list', 'single'];
		var _nowstate = _allowed.indexOf(core.cfg.loop);
		var _nextstate;
		if(_nowstate < _allowed.length - 1){
			_nextstate = _nowstate + 1;
		}else{
			_nextstate = 0;
		}
		core.cfg.loop = _allowed[_nextstate];
		changeClass(this, _allowed[_nowstate], _allowed[_nextstate]);
		return false;
	});
	/**
	 * 歌曲播放完毕时自动播放下一曲
	 */
	core.audio.addEventListener('ended', function(){
		console.log(core.audio.ended);
		var _next = getNextSong();
		if(_next != -1){
			play(_next);
		}
	});
	/**
	 * 歌曲开始播放时切换播放按钮为暂停样式
	 */
	core.audio.addEventListener('play', function(){
		changeClass(core.ctrls.play, 'play', 'pause');
		changeClass(core.ctrls.cdmask, 'paused', 'running');
	});
	/**
	 * 歌曲暂停播放时切换播放按钮为播放样式
	 */
	core.audio.addEventListener('pause', function(){
		changeClass(core.ctrls.play, 'pause', 'play');
		changeClass(core.ctrls.cdmask, 'running', 'paused');
	});
	/**
	 * 音量档次切换
	 */
	core.ctrls.volume.addEventListener('click', function(){
		var _classes = ['muted', 'quarter', 'twoquarter', 'triquarter', 'full'];
		var _nowvolume = _classes.indexOf(core.cfg.volume);
		var _nextvolume;
		if(_nowvolume < _classes.length - 1){
			_nextvolume = _nowvolume + 1;
		}else{
			_nextvolume = 0;
		}
		core.cfg.volume = _classes[_nextvolume];
		updateVolume(core.cfg.volume);
		changeClass(this, _classes[_nowvolume], _classes[_nextvolume]);
		return false;
	});
	/**
	 * 歌曲内时间跳转
	 */
	core.ctrls.progressContainer.addEventListener('click', function(e){
		e = e || window.event;
		var _rate = e.offsetX / this.clientWidth;
		var _timetarget = _rate * core.audio.duration;
		core.audio.currentTime = _timetarget;
		return false;
	});
	/**
	 * Desktop notification request
	 */
	// window.webkitNotifications.requestPermission();
})();
