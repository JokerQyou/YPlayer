#YPLayer#
Chrome 下的本地音乐播放器

##Notice##

目标是完成一个在浏览器中（或打包成桌面程序后）可用的音乐播放器，而不是完成一个音乐播放的库。

##项目起源##
灵感来自于 [MP3 Player]( http://antimatter15.github.io/player/player.html )，这是我见过的第一个经由浏览器来播放本地音乐的例子。第一个可运行的播放器（大概是现在 full 分支上没有历史记录的一部分代码）成型于 2012 年清明节期间。 full 分支与 lite 分支现在的功能和 UI 在 2012 年暑假期间经历大幅改动之后就一直保留到现在。

现在，主系统是 Ubuntu 的我发现 Linux 下没有顺手的播放器，于是开始重构这个项目的代码。

##分支说明##

主分支会保持与 new 分支跟进，需要其他分支请自行 checkout 。

当前 new 分支下的新版播放器正经历重构，要使用的话建议 checkout lite 分支的代码。 full 分支下的代码依赖较多，可能无法很好地保证正常使用。

##On Branch 'new'##
* 大幅改进样式，借鉴了 Jing+ Music 的 UI 风格。
* 完全不同的页面结构。
* 列表搜索功能。在考虑了列表分页显示之后决定还是采用搜索比较直接、快捷和方便。按 Ctrl + F 来打开搜索。
* 取消了对其他浏览器的支持，现在只支持 Google Chrome ，所有的开发调试都是在 Chrome 上进行的。因为个人时间比较紧张，无法很好地处理浏览器兼容问题（ IE 是铁定不支持，其他浏览器可以试试。当然如果你有兴趣提交不同浏览器的 patch 我也非常欢迎）。我可以作出在时间充裕的情况下改善对不同现代浏览器支持的保证，但这保证的有效性其实你我都心知肚明。
* 更少的 JavaScript 库依赖。我正尝试保证这个分支上的代码不依赖任何第三方库，在现代浏览器中似乎不是那么困难。

##On Branch 'full'##
完整版的代码，经历了很多变动。最初依赖 jQuery ，后来依赖了一个类似 jQuery 的库、 Mousetrap 、 LRC 和 easyanim 。代码比较直接、混乱。

##On Branch 'lite'##
简化去除了 full 分支的歌词功能，即不再依赖于 LRC 库。
