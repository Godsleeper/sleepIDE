##Electron学习
####1.入口文件信息
	//	引入electron模块
	const electron = require('electron'); 
	
	//	控制应用的生命周期,给app绑定各种状态事件来控制生命周期
	const app = electron.app; 
	
	//	控制原生浏览器窗口
	const BrowserWindow = electron.BrowserWindow; 
	
	//	path路径管理模块
	const path = require('path'); 
	
	//	url管理模块
	const url = require('url'); 

	//	永久存放一个window对象的引用，不然会被对象垃圾回收而使应用关闭
	let mainWindow; 

	//	生成一个浏览器窗口
	function createWindow () {
  	//	使用new 一个BrowserWindow对象实例获取一个新的窗口，因为引用在外面不会被消除
  	mainWindow = new BrowserWindow({
  		width: 800, 
  		height: 600, 
  		resizable: true, 
  		frame:truer}); 

  	//	内核还是网页，因此要打开网页
  	mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  	})); 

  	// 	启用开发者工具
  	//mainWindow.webContents.openDevTools()

  	// 	给窗口关闭事件设置回调函数，使这个实例为空
  	mainWindow.on('closed', function () {
    //	如果应用支持多窗口，应该将多个window对象放在一个数组中进行管理，与此同时，删除对应的元素
    mainWindow = null; 
  	})
	}

	//	给窗口准备设置回调，在创建了窗口后执行这个函数
	app.on('ready', createWindow); 

	//	给全部窗口关闭时绑定回调，与上面不同，上面只销毁对应的窗口对象，这里会完全退出
	app.on('window-all-closed', function () {
  		if (process.platform !== 'darwin') {
    		app.quit(); 
  		}
	})

	//	给点击图标设置回调，开启一个新窗口
	app.on('activate', function () {
  		if (mainWindow === null) {
    		createWindow(); 
  		}
	})
	
####2.渲染进程
1. 主进程：在package.json中的main指向的文件，在主进程里创建网页，给网页绑定渲染周期来进行管理，对整个GUI界面的操作全部放在主进程进行管理，渲染进程不得操作
2. 渲染进程：使用chorme多线程的特性，每个网页有自己的渲染进程，相当于普通的html和script标签，但是可以使用node的模块
3. 二者的不同:</br>
主进程通过实例化BrowserWindow对象来新建一个页面，每个BrowserWindow通过loadURL来绑定一个页面，在渲染进程中返回一个web页面，实例销毁时，渲染进程也就结束了。主进程负责管理所有的页面和他们的渲染进程，渲染进程不能调用原生GUI的模块，需要使用时应向主进程发出请求。然后在主进程中操作。
4. 不同页面间共享数据
	1. 方法一：使用localStroage
	2. 使用Electron的IPC系统，在主进程中设置全局变量，通过`remote模块`操作他们。
	
			//	主进程中
			global.shareObject = {
				shareAttr: 'value'
			}
			//	渲染进程中
			var shareAttr = requir('remote').getGlobal('shareObject').shareAttr;
			console.log(shareAttr);  //		value;
5. 详解页面通信
	* <b style = "color:red">首先注意一个概念，每个窗口都是一个渲染进程，主进程只负责窗口的生命周期管理和通信</b>

		
			//	主进程中
			const ipc = require('electron').ipcMain;
		
			app.on('ready',function(){
				//	主窗口
				var indexWindow = new BrowserWindow({})
				//	其他窗口
				var subWindow = new BrowserWindow({})
				//通信,遇见事件event1就显示子窗口
				ipc.on('event1',function(){
					subWindow.show();
				});	
			})
		
			//	渲染进程中
			const remote = require('remote').remote;
			const ipc = require('electron').ipsRenderer;
			ipc.send('event1');// 会发到主线程去

			