const fs = window.nodeRequire('fs');
const path = window.nodeRequire('path');



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
                name: 'Edit · 编辑',
                content: ['All · 全选', 'Copy · 复制', 'Cut · 剪切', 'Paste · 粘贴', 'Search · 搜索']
            },
            {
                name: 'Window·窗口',
                content: ['Theme1 · 主题1', 'Theme2 · 主题2', 'Theme3 · 主题3', 'SideBar · 边栏']
            },
            {
                name: 'Settings · 设置',
                content: ['Theme1 · 主题1', 'Theme1 · 主题2', 'Theme1 · 主题3', 'SideBar · 边栏']
            },
            {
                name: 'Help · 帮助',
                content: ['Help · 使用说明', 'Reference · 参考文档', 'Github · 源码目录', 'About Us · 关于我们']
            }
        ],
        model: ['Style · 高亮','3024-night', 'monokai', 'bespin', 'eclipse', 'dracula'],
        language: ['Language · 语言', 'C语言', 'C++', 'Java', 'Javascript'],
        lModel: ['Language · 语言', 'cmake', 'cmake', 'javascript', 'javascript'],
        tree: {},
        currentFolder:'',
        currentDoc:'',

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
        deepSearch: function(route){
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

                default:
                    break;
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
    });

    var main = function () {
        code.getTree('/Users/sleepGod/frontEnd/homework/homework1/src/');
        code.buildTree();
        code.eventPool();
    };
    main();
    avalon.scan();
});
