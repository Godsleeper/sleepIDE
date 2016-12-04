const fs = window.nodeRequire('fs');
const path = window.nodeRequire('path');
const remote = window.nodeRequire('electron').remote;
const dialog = remote.dialog;
const ipc = window.nodeRequire('electron').ipcRenderer;

avalon.ready(function () {
    var editor = CodeMirror.fromTextArea(document.getElementById('codemirror1'), {
        styleActiveLine: true,
        lineNumbers: true,
        mode: 'javascript',
        lineWrapping: true,
        theme: 'monokai',
        autofocus: true,
    });

    var code = avalon.define({
        $id: 'code',
        navItem: [
            {
                name: 'File · 文件',
                content: ['New · 新建', 'Folder · 新建文件夹', 'Save · 保存', 'File · 打开文件', 'Project · 打开目录', 'Exit · 退出程序']
            },
            {
                name: 'Window·窗口',
                content: ['Theme1 · 主题1', 'Theme2 · 主题2', 'SideBar · 边栏', 'CodeLine · 行数']
            },
            {
                name: 'Help · 帮助',
                content: ['Help · 使用说明', 'Reference · 参考文档', 'Github · 源码目录', 'About Us · 关于我们']
            }
        ],
        model: ['Style · 高亮','3024-night', 'monokai', 'bespin', 'eclipse', 'dracula'],
        language: ['Language · 语言', 'C语言', 'C++', 'Java', 'Javascript'],
        lModel: ['Language · 语言', 'cmake', 'cmake', 'clike', 'javascript'],
        tree: {},
        currentFolder:'',
        currentDoc:'',
        codeVisible:true,
        codeLine:true,
        codeStyle:true,
        modelChange: function ($event, type, option) {
            var style = $event.target.value;
            if (style == code[type][0]) {
                return;
            }
            editor.setOption(option, style);
        },
        getTree: function (route) {
            code.tree = code.deepSearch(route);
        },
        setsideBar: function() {
            var codeBar = $('.code_edit_bar');
            if (code.codeVisible) {
                codeBar.addClass('code_edit_max');
                code.codeVisible = false;
            }
            else {
                codeBar.removeClass('code_edit_max');
                code.codeVisible = true;
            }
        },
        deepSearch: function (route) {
            function creater(parent,name,route){
                var obj = {};
                obj.parent = parent;
                obj.text = name;
                obj.id = route;
                return obj;
            };

            var content = {
                docs:[],
                dirs:[]
            };

            var init = function(route){
                var parent = '#';
                var text = path.basename(route);
                var id = route;
                return creater(parent,text,id);
            };
            content.dirs.push(init(route));
            var deep = function (route) {
                var root = fs.readdirSync(route);//读出文件夹都有啥，返回一个数组列表
                var _array = [];
                root.forEach(file => {
                    var state = fs.statSync(path.join(route,file));//读出这个东西是文件还是文件夹
                    if (state.isFile()) {
                        var parent = route;
                        var name = file;
                        var routes = path.join(route,file);
                        content.docs.push(new creater(parent,name,routes));
                    }
                    else {
                        var parent = route;
                        var name = file;
                        var routes = path.join(route,file);
                        _array.push(new creater(parent,name,routes));
                    }
                });
                content.dirs = content.dirs.concat(_array);
                _array.forEach(dir => {
                    deep(path.join(route,dir.text));
                });
            };
            deep(route);
            content.dirs = content.dirs.concat(content.docs);
            return content.dirs;
        },
        newFile: function(route,name){
            var normal = path.normalize(route + '/' +name);
            fs.stat(normal,function(err){
                if(err){
                    fs.writeFile(normal, '//  @name: '+name, function(err){
                        if(err){
                            alert('文件创建失败');
                            return;
                        }
                        var obj = {};
                        obj.id = normal;
                        obj.text = name;
                        obj.parent = route;
                        code.tree.push(obj);
                        var data = fs.readFileSync(normal,'utf8').toString();
                        editor.setValue(data);
                        code.buildTree();
                    });
                } else{
                    alert('已存在这个文件！');
                    return;
                }
            });

        },
        newFolder: function (route,name) {
            var normal = path.normalize(route + '/' +name);
            fs.stat(normal,function(err){
                if(err){
                    fs.mkdir(normal,function(err){
                        if (err) {
                            alert('文件夹创建失败');
                            return;
                        }
                        var obj = {};
                        obj.id = normal;
                        obj.text = name;
                        obj.parent = route;
                        code.tree.push(obj);
                        code.buildTree();
                    });
                }
                else {
                    alert('已存在这个文件夹！')
                }
            });
        },
        buildTree: function () {
            //  建立文件树结构
            $.jstree.destroy();
            $('#file_tree_bar').jstree({
                'core' : {
                    'data': code.tree,
                },
                'plugins': ['themes','types'],
                "types": {
                    "default" : {
                        "icon" : false  // 关闭默认图标
                    },
                },
            });
            //  绑定事件
            code.treeEventHandler();
        },
        treeEventHandler: function () {
            //  给文件树绑定读文件操作
            $('#file_tree_bar').on('changed.jstree',function(event,data){
                var route = data.selected[0];
                var state = fs.statSync(route);
                if(/\.jpg|\.png|\.DS_Store/.test(route)){
                    alert("亲，打开就是乱码哦");
                    return;
                }
                if(!state.isFile()){
                    code.currentFolder = route;
                    console.log(code.currentFolder);
                }else{
                    code.currentDoc = route;
                    var data = fs.readFileSync(route,'utf8').toString();
                    editor.setValue(data);
                }
            });
        },
        clickHandler: function (event) {
            var value = event.target.getAttribute('data-clickValue').split(" ")[0];
            switch (value) {
                case 'New' :
                case 'Folder' :
                    var mask = $('.input_bar');
                    mask.addClass('input_bar_active');
                    break;
                case 'Save' :
                    code.saveFile(code.currentDoc);
                    break;
                case 'File' :
                    code.openFile();
                    break;
                case 'Project' :
                    code.openDir();
                    break;
                case 'Exit' :
                    code.exitWindow();
                    break;
                case 'SideBar' :
                    code.setsideBar();
                    break;
                case 'CodeLine':
                    code.setcodeLine();
                    break;
                case 'Search' :
                    alert('请在搜索框输入搜索的数据');
                    break;
                case 'Theme1':
                    code.setTheme(0);
                    break;
                case 'Theme2':
                    code.setTheme(1);
                    break;
                case 'Help' :
                case 'Reference' :
                    window.open('https://github.com/electron/electron/blob/master/docs-translations/zh-CN/README.md');
                    break;
                case 'Github' :
                    window.open('https://github.com/Godsleeper/sleepIDE/tree/test');
                    break;
                default:
                    break;
            }
        },
        setcodeLine: function () {
            if(code.codeLine){
                editor.setOption('lineNumbers',false);
                code.codeLine = false;
            }else{
                editor.setOption('lineNumbers',true);
                code.codeLine = true;
            }
        },
        saveFile: function(route){
            var data = editor.getValue();
            fs.writeFile(route,data,function(err){
                if(err){
                    alert('出错了!');
                }
                else{
                    alert('保存成功！');
                }
            })
        },
        eventPool: function() {
            // 新建文件/文件夹
            var newBtn = $('.input_bar_confirm');
            // 新建文件夹的确定按钮
            newBtn.on('click', function () {
                var data = $('.input_bar_input').val();
                var option = $('.input_bar_select').val();

                if(code.currentFolder == ''){
                    alert('出错了哦');
                    $('.input_bar').removeClass('input_bar_active');
                    return;
                }
                if (option == 0) {
                    code.newFile(code.currentFolder,data);

                }
                else if (option == 1) {
                    code.newFolder(code.currentFolder,data);
                }
                else{
                    alert('出错了哦');
                }
                code.currentFolder = '';
                $('.input_bar').removeClass('input_bar_active');
            });
        },
        openFile: function () {
            var fileDialog = new dialog.showOpenDialog({
                title: 'Open File',
                defaultPath: '/Users/sleepGod/',
                properties: ['openFile']
            },function (filename) {
                if(filename == undefined){
                    return;
                }
                var filename = filename[0];
                code.currentDoc = filename;
                var data = fs.readFileSync(filename,'utf8').toString();
                editor.setValue(data);
            })
        },
        openDir: function () {
            var dirDialog = dialog.showOpenDialog({
                title: 'Open Directory',
                properties: ['openDirectory']
            },function (dirName) {
                if(dirName == undefined){
                    return;
                }
                var dir = dirName[0];
                code.currentFolder = dir;
                code.getTree(dir);
                code.buildTree();
                console.log(dirName);
            })
        },
        exitWindow: function () {
            ipc.send('exitWindow');
        },
        setTheme: function (style) {
            var sideBar = $('.file_tree_bar');
            var navBar = $('.nav_bar');
            var searchBar = $('.search_bar');
            var footBar = $('.foot_status_bar');
            var navbarContent = $('.nav_bar_wrapper');
            var codeBtn = $('.code_edit_max');
            var footText = $('.foot_status_title');
            if(style == 0){
                sideBar.removeClass('theme2');
                navBar.removeClass('theme2');
                searchBar.removeClass('theme2');
                footBar.removeClass('theme2');
                navbarContent.removeClass('nav_bar_wrapper_theme2');
                codeBtn.removeClass('code_edit_max_theme2');
                footText.removeClass('foot_status_title_theme2');
                editor.setOption('theme','monokai');
            }else{
                sideBar.addClass('theme2');
                navBar.addClass('theme2');
                searchBar.addClass('theme2');
                footBar.addClass('theme2');
                navbarContent.addClass('nav_bar_wrapper_theme2');
                codeBtn.addClass('code_edit_max_theme2');
                footText.addClass('foot_status_title_theme2');
                editor.setOption('theme','eclipse');
            }
        },

    });

    var main = function () {
        code.eventPool();
    };
    main();
    avalon.scan();
});