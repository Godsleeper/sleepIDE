//  引入electron模块
const electron = require('electron'); 
//  控制应用的生命周期,给app绑定各种状态事件来控制生命周期
const app = electron.app; 
//  控制原生浏览器窗口
const BrowserWindow = electron.BrowserWindow; 
//  path路径管理模块
const path = require('path'); 
//  url管理模块
const url = require('url'); 
//  与渲染进程通信的ipc模块
const ipc = require('electron').ipcMain;
//  永久存放一个window对象的引用，不然会被对象垃圾回收而使应用关闭
let mainWindow; 

//  生成一个浏览器窗口
function createWindow () {
  //  使用new 一个BrowserWindow对象实例获取一个新的窗口，因为引用在外面不会被消除
  mainWindow = new BrowserWindow({width: 1000, height: 750, resizable: true, frame:true});

  //  内核还是网页，因此要打开网页
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  })); 

  //   启用开发者工具
  //  mainWindow.webContents.openDevTools()

  //   给窗口关闭事件设置回调函数，使这个实例为空
  mainWindow.on('closed', function () {
    //  如果应用支持多窗口，应该将多个window对象放在一个数组中进行管理，与此同时，删除对应的元素
    mainWindow = null; 
  });

  ipc.on('exitWindow',function () {
    mainWindow.close();
  });
}

//  给窗口准备设置回调，在创建了窗口后执行这个函数
app.on('ready', createWindow); 

//  给全部窗口关闭时绑定回调，与上面不同，上面只销毁对应的窗口对象，这里会完全退出
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit(); 
  }
});


//  给点击图标设置回调，开启一个新窗口
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow(); 
  }
});
