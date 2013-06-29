/*** 注意：淡入淡出和滑动效果依赖shownhide.js ，需要解除依赖请重写使用到show 、hide 和animate 方法的地方；绑定快捷键依赖Mousetrap 库，要解除依赖请重写使用到Mousetrap.bind() 方法的地方 ***/

/** 全局命名空间 **/
var Y = {
	/* 为不足两位的字符串补0 */
	add0: function(str){
		if(str.length < 2){
			return '0' + str.toString();
		}else{
			return str.toString();
		}
	},

	/* 检查数组中是否存在指定值（或对象） */
	contains: function(array, elem){
		for(var i = 0, l = array.length; i < l; i ++){
			if(array[i] === elem){
				return true;
			}
		}
		return false;
	},

	/* 添加值或对象到数组末端，防止添加相同的值或对象 */
	push: function(arr, el){
		var contains = function(array, elem){
			for(var i = 0, l = array.length; i < l; i ++){
				if(array[i] === elem){
					return true;
				}
			}
			return false;
		};
		if(!contains(arr, el)){
			arr[arr.length] = el;
			return arr.length;
		}
	}
};
/** 播放核心 **/
Y.audio = new Audio();
/** 指示当前播放的条目 **/
Y.nowPlayingId = null;
/** 文件列表 **/
Y.list = [];
/** DOM 元素 **/
Y.dom = {
	/* 播放按钮，同时用作添加文件按钮和暂停按钮 */
	play: document.getElementById('play'),
	/* 下一曲按钮 */
	next: document.getElementById('next'),
	/* 实际载入文件的对象，是一个input[type='file'] */
	file: document.getElementById('file'),
	/* 文件列表，是一个空的ul ，用于插入文件条目 */
	playlist: document.getElementById('playlist'),
	/* 进度条背景，width 为500px 的div */
	progress: document.getElementById('progress'),
	/* 进度条，一个没有设置宽度的span */
	nowprogress: document.getElementById('now'),
	/* 用于在操作栏上显示当前播放的文件名称的span */
	nowitem: document.getElementById('nowitem'),
	/* 音量滑条背景，一个span */
	volumebar: document.getElementById('volumebar'),
	/* 音量滑条，是一个span */
	volume: document.getElementById('volume'),
	/* 用于在操作栏上显示当前时间点和文件总时长的span 标签 */
	time: document.getElementById('time'),
	/* 菜单按钮 */
	menu: document.getElementById('menu'),
	/* 菜单div */
	childmenu: document.getElementById('childmenu'),
	/* 列表选项菜单按钮 */
	listoption: document.getElementById('listoption'),
	/* 播放选项菜单按钮 */
	playeroption: document.getElementById('playeroption'),
	/* 列表选项菜单div */
	listoptionmenu: document.getElementById('listoptionmenu'),
	/* 播放选项菜单div */
	playeroptionmenu: document.getElementById('playeroptionmenu'),
	/* 列表居左按钮 */
	listalignl: document.getElementById('listalignl'),
	/* 列表居中按钮 */
	listalignc: document.getElementById('listalignc'),
	/* 列表居右按钮 */
	listalignr: document.getElementById('listalignr'),
	/* 列表重绘按钮 */
	listredraw: document.getElementById('listredraw'),
	/* 切换随机状态的按钮 */
	toggleshuffle: document.getElementById('toggleshuffle'),
	/* 切换循环状态的按钮 */
	toggleloop: document.getElementById('toggleloop')
};

/** 设置，loop 指示循环设置，有三种值：no、single 和list ；shuffle 指示选择曲目时是否随机，有true 和false 两种值 **/
Y.settings = {
	loop: 'no',
	shuffle: false
};

/** 用于在loop 为no 时记录已经播放过的文件，避免重复播放 **/
Y.played = [];

/** 遍历指定目录，提取m4a 和mp3 格式文件 **/
Y.parseDir = function(files){
	var self = this,
		re = /\.mp3$|\.m4a$|\.ogg$/i;
	if(files.length){
		for(var i = 0, l = files.length; i < l; i ++){
			/* Chrome 支持m4a 、mp3 和ogg 格式 */
			if(re.test(files[i].name)){
				self.list.push(files[i]);
			}
		}
	}
};

/** 显示文件列表 **/
Y.showList = function(){
	var self = this,
	/* 随机颜色对，用于列表条目，主要是为了看起来炫一点 */
	randomColorPair = function(){
		var h, s, l, a, h1, s1, l1, c = [];
		h = Math.floor(Math.random()*360);
		s = Math.floor(Math.random()*100);
		l = Math.floor(15 + Math.random()*70);
		a = 1;
		h1 = (h > 240)?(h - 120):(h + 120);
		s1 = Math.floor(15 + Math.random()*85);
		l1 = ((l-50) >= 0)?(l - 50):(l + 50);
		c.push('hsla(' + h + ', ' + s + '%, ' + l + '%, ' + a + ')');
		c.push('hsla(' + h1 + ', ' + s1 + '%, ' + l1 + '%, ' + a + ')');
		return c;
	},
	colorPair;
	self.dom.playlist.style.display = 'none';
	self.dom.playlist.innerHTML = '';
	for(var i = 0, l = self.list.length; i < l; i ++){
		var item = document.createElement('li'),
			name = self.list[i].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '');
		item.innerHTML = (name.length > 20)?((name).substr(0, 15) + '...'):(name);
		item.title = self.list[i].name;
		item.setAttribute('onclick', 'Y.play(' + i + ');');
		colorPair = randomColorPair();
		item.style.backgroundColor = colorPair[0];
		item.style.color = colorPair[1];
		// item.style.borderRadius = Math.floor(Math.random()*20) + 'px';
		self.dom.playlist.appendChild(item);
	}
	self.dom.playlist.show(1000);
};

/** 播放和继续，包括第一次播放（核心的src 属性不存在，并且当前条目为null ，此时会随机挑选一条来播放） **/
Y.play = function(num){
	var self = this,
		data = '',
		createBlobURL = (window.URL && URL.createObjectURL.bind(URL)) || (window.webkitURL && webkitURL.createObjectURL.bind(webkitURL)) || window.createObjectURL,
		nowplayingTop = 0,
		nowname = '';
	/* 列表不存在时是不能播放的 */
	if(self.list.length){
		/* 没有传入参数 */
		if(num == undefined){
			/* 没有传入参数，核心src 属性有定义，核心处于paused 状态，说明当前正处于某个文件的暂停状态，此时继续播放 */
			if(self.audio.src && self.audio.paused){
				self.dom.playlist.children[self.nowPlayingId].setAttribute('class', 'nowplaying');
				self.audio.play();
			/* 没有传入参数，核心src 未定义，说明是载入文件后的第一次播放，而且是通过播放按钮触发（如果是列表中的文件触发会传入参数），随机选择一个文件播放 */
			}else if(!self.audio.src){
				num = Math.floor(Math.random()*self.list.length);
				data = createBlobURL(self.list[num]);
				self.audio.src = data;
				self.audio.play();
				self.nowPlayingId = num;
				self.dom.playlist.children[num].setAttribute('class', 'nowplaying');
			}
		/* 有传入参数 */
		}else{
			/* 参数与正在播放id 不同，且核心src 属性有定义，说明用户切换了歌曲 */
			if((num != self.nowPlayingId) && self.audio.src){
				self.dom.playlist.children[self.nowPlayingId].removeAttribute('class');
				data = createBlobURL(self.list[num]);
				self.audio.src = data;
				self.audio.play();
				self.nowPlayingId = num;
				self.dom.playlist.children[num].setAttribute('class', 'nowplaying');
			/* 参数与正在播放id 不同，且核心src 属性有定义，说明是第一次播放，而且是通过文件列表触发，此时播放指定文件 */
			}else if((num != self.nowPlayingId) && !self.audio.src){
				data = createBlobURL(self.list[num]);
				self.audio.src = data;
				self.audio.play();
				self.nowPlayingId = num;
				self.dom.playlist.children[num].setAttribute('class', 'nowplaying');
			/* 参数与正在播放id 相同，核心src 属性有定义，且核心处于paused 状态，可能是单曲循环状态下切换曲目时由playNext 方法触发（也可能是当前曲目暂停时用户点击文件列表中当前播放条目触发） */
			}else if((num == self.nowPlayingId) && self.audio.src && self.audio.paused){
				self.audio.play();
				self.dom.playlist.children[num].setAttribute('class', 'nowplaying');
			/* 参数与正在播放id 相同，核心src 属性有定义，且核心正处于播放状态，可能是用户选择重新绘制列表后请求重新突出显示当前条目，也可能是正在播放时用户点击文件列表中当前播放条目触发，统一处理成突出显示当前条目 */
			}else if((num == self.nowPlayingId) && self.audio.src && !self.audio.paused){
				self.dom.playlist.children[num].setAttribute('class', 'nowplaying');
			}
		}
	}else{
		return false;
	}
	/* 在当前条目中显示文件名 */
	nowname = self.list[self.nowPlayingId].name.replace(/\.mp3$|\.m4a$|\.ogg$/i, '');
	self.dom.nowitem.innerHTML = nowname;
	/* 在页面标题栏现实文件名 */
	document.title = nowname + ' - Yplayer Local';
	/* 设置中关闭循环时，将当前条目记录在“已经播放过”数组中 */
	/* 切换播放按钮外观为暂停键 */
	self.dom.play.style.backgroundImage = 'url(\'Pause.png\')';
	self.dom.play.title = '暂停';
	/* 计算文档当前可见位置与当前条目之间的距离，120 是为顶部播放器操作栏空出的高度 */
	nowplayingTop = (document.height - document.querySelector('.nowplaying').offsetTop <= (window.innerHeight - 120))?(document.querySelector('.nowplaying').offsetTop):(document.querySelector('.nowplaying').offsetTop - 120);
	/* 滑动文档使当前条目处于可见位置 */
	document.body.animate({scrollTop:nowplayingTop}, nowplayingTop);
	if(self.settings.loop == 'no'){
		self.push(self.played, self.nowPlayingId);
	}
	return false;
};

/** 暂停 **/
Y.pause = function(){
	var self = this;
	if(!self.audio.paused){
		self.audio.pause();
		self.dom.play.style.backgroundImage = 'url(\'Play.png\')';
		self.dom.play.title = '播放';
	}
};

/** 跳到指定时间点上 **/
Y.jumpTo = function(time){
	var self = this;
	if(time <= self.audio.duration){
		self.audio.currentTime = time;
	}
};

/** 调整音量 **/
Y.updateVolume = function(volume){
	var self = this;
	if((volume <= 1) && (volume >= 0)){
		self.audio.volume = volume;
		/* 这个方法同时还负责调整音量条的外观 */
		self.dom.volume.style.width = volume * 100 + 'px';
		self.dom.volumebar.title = '音量：' + Math.floor(self.audio.volume*100).toString() + '%';
	}
};

/** 调整进度条的宽度（视觉长度）和时间标记中的数字 **/
Y.barProgress = function(){
	var self = this,
		current = 0,
		bRangesLength = 0,
		bValue = 0,
		buffer = 0,
		cu = 0,
		du = 0;
	(self.audio.currentTime > 0 && self.audio.currentTime < self.audio.duration) ? current = Math.floor((500 / self.audio.duration) * self.audio.currentTime) : current = 0;
	self.dom.nowprogress.style.width = current + 'px';
	bRangesLength = self.audio.buffered.length;
	bValue = self.audio.buffered.end(bRangesLength - 1);
	buffer = Math.floor((500 * bValue) / self.audio.duration);
	self.dom.progress.style.width = buffer + 'px';
	cu = self.add0(Math.floor(self.audio.currentTime/60).toString())+':'+self.add0(Math.floor(self.audio.currentTime%60).toString());
	du = self.add0(Math.floor(self.audio.duration/60).toString())+':'+self.add0(Math.floor(self.audio.duration%60).toString());
	self.dom.time.innerHTML = cu + '/' + du;
};

/** 播放下一个文件 **/
Y.playNext = function(){
	var self = this;
	/* 单曲循环时 */
	if(self.settings.loop == 'single'){
		self.play(self.nowPlayingId);
		return false;
	/* 列表循环时 */
	}else if(self.settings.loop == 'list'){
		/* 列表循环+随机 */
		if(self.settings.shuffle){
			self.play(Math.floor(Math.random()*self.list.length));
			return false;
		/* 列表循环+顺序 */
		}else{
			if(self.nowPlayingId < self.list.length){
				self.play(self.nowPlayingId+1);
				return false;
			}else{
				self.play(0);
				return false;
			}
		}
	/* 关闭循环时 */
	}else if(self.settings.loop == 'no'){
		/* 关闭循环+随机 */
		if(self.settings.shuffle){
			var sxloop = function(){
				/* “已经播放过”数组与文件列表长度一样，说明所有文件都已经播放过了，直接返回（如果不做这个判断，在所有文件播放结束后会陷入死循环 */
				if(self.played.length == self.list.length){
					return false;
				}else{
					var num = Math.floor(Math.random()*self.list.length);
					if(!self.contains(self.played, num)){
						self.play(num);
						return false;
					}else{
						sxloop();
					}
				}
			};
			sxloop();
		/* 关闭循环+顺序 */
		}else{
			/* 关闭循环+顺序播放，在列表末尾要做一个判断，因为播放到了列表末尾并不表示列表头部的曲目播放过 */
			if(self.nowPlayingId < self.list.length-1){
				var num = self.nowPlayingId + 1;
				var xloop = function(){
					/* “已经播放过”数组与文件列表长度一样，说明所有文件都已经播放过了，直接返回（如果不做这个判断，在所有文件播放结束后会陷入死循环 */
					if(self.played.length == self.list.length){
						return false;
					}else{
						if(!self.contains(self.played, num)){
							self.play(num);
							return false;
						}else{
							num ++;
							xloop();
						}
					}
				};
				xloop();
				return false;
			}else{
				var num = 0;
				var xloop = function(){
					/* “已经播放过”数组与文件列表长度一样，说明所有文件都已经播放过了，直接返回（如果不做这个判断，在所有文件播放结束后会陷入死循环 */
					if(self.played.length == self.list.length){
						return false;
					}else{
						if(!self.contains(self.played, num)){
							self.play(num);
							return false;
						}else{
							num ++;
							xloop();
						}
					}
				};
				xloop();
				return false;
			}
		}
	}
};

/** 切换循环状态（是否随机挑选下一曲），整个播放选项设置是参考我的诺基亚手机自带播放器设计的 **/
Y.toggleLoop = function(){
	var self = this,
		loopArray = ['no', 'single', 'list'],
		loopImgArray = ['url(\'Delete.png\')', 'url(\'Lock.png\')', 'url(\'Paper.png\')'],
		nowLoop = loopArray.indexOf(Y.settings.loop);
	if(nowLoop == 0){
		self.played.length = 0;
	}
	if(nowLoop < loopArray.length-1){
		self.settings.loop = loopArray[nowLoop+1];
		self.dom.toggleloop.style.backgroundImage = loopImgArray[nowLoop+1];
	}else{
		self.settings.loop = loopArray[0];
		self.dom.toggleloop.style.backgroundImage = loopImgArray[0];
	}
	return false;
};

/** 切换随机状态 **/
Y.toggleShuffle = function(){
	var self = this;
	/* 这里本来可以更简洁地写成：self.settings.shuffle = !self.settings.shuffle ，但是因为要使用背景图来指示状态没有这样写 */
	if(self.settings.shuffle){
		self.settings.shuffle = false;
		self.dom.toggleshuffle.style.backgroundImage = 'url(\'Remove.png\')';
	}else{
		self.settings.shuffle = true;
		self.dom.toggleshuffle.style.backgroundImage = 'url(\'Clock.png\')';
	}
	return false;
};

/** 初始化，注意所有DOM 操作都需要return false 来阻止浏览器默认动作（因为使用a 标签作为按钮） **/
Y.init = function(){
	var self = this;
	self.dom.volume.style.width = '70px';
	self.audio.volume = 0.7;
	/* 添加文件夹/播放/暂停功能都在一个按钮上 */
	self.dom.play.onclick = function(){
		if(self.list.length == 0){ /* 没有列表时需要先载入文件 */
			self.dom.file.click();
			return false;
		}else{
			if(self.audio.paused){
				self.play();
				return false;
			}else{
				self.pause();
				return false;
			}
		}
	};
	/* 点击播放下一个文件 */
	self.dom.next.onclick = function(){
		if(self.list.length){
			self.playNext();
			return false;
		}else{
			return false;
		}
	};
	/* 点击调整音量 */
	self.dom.volumebar.onclick = function(e){
		var x = e.pageX - this.offsetLeft;
		self.updateVolume(x / 100);
	};
	/* 拖动调整音量，由于音量条比较细，这个拖动模拟使用并不是很方便，但是暂时没有其他方案 */
	self.dom.volumebar.onmousedown = function(e){
		this.mousevalid = true;
	};
	self.dom.volumebar.onmouseup = function(e){
		this.mousevalid = false;
	};
	self.dom.volumebar.onmouseout = function(e){
		this.mousevalid = false;
	};
	self.dom.volumebar.onmousemove = function(e){
		var x = e.pageX - this.offsetLeft;
		if(this.mousevalid){
			self.updateVolume(x / 100);
		}
	};
	/* 载入文件夹（中的文件） */
	self.dom.file.onchange = function(){
		self.parseDir(self.dom.file.files);
		self.showList();
		if(self.list.length){
			/* 按钮外观切换为播放键 */
			self.dom.play.style.backgroundImage = 'url(\'Play.png\')';
			self.dom.play.title = '播放';
		}
	};
	/* 实时更新进度条 */
	self.audio.addEventListener('timeupdate', function(){
			self.barProgress();
		}
	);
	/* 播放结束时的动作 */
	self.audio.addEventListener('ended', function(){
			if(self.nowPlayingId != null){
				/* 解除当前条目的突出显示 */
				self.dom.playlist.children[self.nowPlayingId].removeAttribute('class');
				/* 清空条目显示 */
				self.dom.nowitem.innerHTML = '';
				/* 时间显示中的“当前时间”置零 */
				var du = self.add0(Math.floor(self.audio.duration/60).toString())+':'+self.add0(Math.floor(self.audio.duration%60).toString());
				self.dom.time.innerHTML = '00:00/' + du;
				/* 播放下一个文件 */
				self.playNext();
			}
		}
	);
	/* 用户在进度条上点击时跳到相应时间点 */
	self.dom.progress.onclick = function(e){
		var x = e.pageX - this.offsetLeft,
			rate = x / 500,
			targetTime = rate * self.audio.duration;
		self.jumpTo(targetTime);
		self.play();
	};
	/* 显示和隐藏二级菜单 */
	self.dom.menu.onclick = function(e){
		var x = this.offsetLeft + 32,
			y = this.offsetTop + 32;
		self.dom.childmenu.style.left = x.toString()+'px';
		self.dom.childmenu.style.top = y.toString()+'px';
		if(self.dom.childmenu.style.display == 'none'){
			self.dom.childmenu.show(300);
		}else{
			self.dom.childmenu.hide(300);
		}
		if(self.dom.listoptionmenu.style.display != 'none'){
			self.dom.listoptionmenu.hide(300);
		}
		if(self.dom.playeroptionmenu.style.display != 'none'){
			self.dom.playeroptionmenu.hide(300);
		}
		return false;
	};
	/* 显示和隐藏列表选项菜单 */
	self.dom.listoption.onclick = function(e){
		var x = this.offsetLeft + this.parentElement.offsetLeft + 32,
			y = this.offsetTop + this.parentElement.offsetTop + 32;
		self.dom.listoptionmenu.style.left = x.toString()+'px';
		self.dom.listoptionmenu.style.top = y.toString()+'px';
		if(self.dom.playeroptionmenu.style.display != 'none'){
			self.dom.playeroptionmenu.hide(300);
		}
		if(self.dom.listoptionmenu.style.display == 'none'){
			self.dom.listoptionmenu.show(300);
			// self.dom.childmenu.hide(300);
			return false;
		}else{
			self.dom.listoptionmenu.hide(300);
			return false;
		}
	};
	/* 显示和隐藏播放选项菜单 */
	self.dom.playeroption.onclick = function(e){
		var x = this.offsetLeft + this.parentElement.offsetLeft + 32,
			y = this.offsetTop + this.parentElement.offsetTop + 32;
		self.dom.playeroptionmenu.style.left = x.toString()+'px';
		self.dom.playeroptionmenu.style.top = y.toString()+'px';
		if(self.dom.listoptionmenu.style.display != 'none'){
			self.dom.listoptionmenu.hide(300);
		}
		if(self.dom.playeroptionmenu.style.display == 'none'){
			self.dom.playeroptionmenu.show(300);
			// self.dom.childmenu.hide(300);
			return false;
		}else{
			self.dom.playeroptionmenu.hide(300);
			return false;
		}
	};
	/* 文件列表居左 */
	self.dom.listalignl.onclick = function(){
		self.dom.playlist.style.textAlign = 'left';
		self.dom.listoptionmenu.hide(300);
		return false;
	};
	/* 文件列表居中 */
	self.dom.listalignc.onclick = function(){
		self.dom.playlist.style.textAlign = 'center';
		self.dom.listoptionmenu.hide(300);
		return false;
	};
	/* 文件列表居右 */
	self.dom.listalignr.onclick = function(){
		self.dom.playlist.style.textAlign = 'right';
		self.dom.listoptionmenu.hide(300);
		return false;
	};
	/* 重绘列表（重新生成列表DOM 元素，这个过程会重新配制随机色） */
	self.dom.listredraw.onclick = function(){
		self.showList();
		/* 此时列表中没有突出显示当前条目，请求突出显示（在play 方法中已经处理过，不会干扰正常的播放） */
		if(!self.audio.paused && (self.nowPlayingId != null)){
			self.play(self.nowPlayingId);
		}
		self.dom.listoptionmenu.hide(300);
		return false;
	};
	/* 切换随机状态 */
	self.dom.toggleshuffle.onclick = function(){
		self.toggleShuffle();
		return false;
	};
	/* 切换循环状态 */
	self.dom.toggleloop.onclick = function(){
		self.toggleLoop();
		return false;
	};
	/* 绑定快捷键 */
	/* Ctrl + up ：音量加 */
	Mousetrap.bind('ctrl+up', function(){
			var volume = self.audio.volume;
			if(volume < 1){
				volume += 0.01;
				self.updateVolume(volume);
			}
			return false;
		}
	);
	/* Ctrl + down ：音量减 */
	Mousetrap.bind('ctrl+down', function(){
			var volume = self.audio.volume;
			if(volume > 0){
				volume -= 0.01;
				self.updateVolume(volume);
			}
			return false;
		}
	);
	/* Ctrl + right ：下一曲 */
	Mousetrap.bind('ctrl+right', function(){
			self.playNext();
			return false;
		}
	);
	/* 空格键：播放/暂停 */
	Mousetrap.bind('space', function(){
			if(self.audio.paused){
				self.play();
				return false;
			}else{
				self.pause();
				return false;
			}
		}
	);
	/* 下面四个快捷键是列表相关，特意挑选了w 、a 、s 、d 四个键 */
	/* w ：重绘列表 */
	Mousetrap.bind('w', function(){
			self.showList();
			/* 此时列表中没有突出显示当前条目，请求突出显示（在play 方法中已经处理过，不会干扰正常的播放） */
			if(!self.audio.paused && (self.nowPlayingId != null)){
				self.play(self.nowPlayingId);
			}
			self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* a ：列表居左 */
	Mousetrap.bind('a', function(){
			self.dom.playlist.style.textAlign = 'left';
			self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* s ：列表居中 */
	Mousetrap.bind('s', function(){
			self.dom.playlist.style.textAlign = 'center';
			self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* d ：列表居右 */
	Mousetrap.bind('d', function(){
			self.dom.playlist.style.textAlign = 'right';
			self.dom.listoptionmenu.hide(300);
			return false;
		}
	);
	/* Ctrl + l ：切换循环状态（Control Loop ） */
	Mousetrap.bind('ctrl+l', function(){
			self.toggleLoop();
			return false;
		}
	);
	/* Ctrl + r ：切换随机状态（Control Random ），不用Ctrl + s （Control Shuffle ）是因为这个组合是浏览器默认的保存网页 */
	Mousetrap.bind('ctrl+r', function(){
			self.toggleShuffle();
			return false;
		}
	);
};