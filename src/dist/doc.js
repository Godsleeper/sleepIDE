const fs = window.nodeRequire('fs');
const path = window.nodeRequire('path');



avalon.ready(function () {
    var editor = CodeMirror.fromTextArea(document.getElementById('codemirror1'), {
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
                content: ['New · 新建', 'File · 打开文件', 'Open Project · 打开目录', 'Exit · 退出程序']
            },
            {
                name: 'Edit · 编辑',
                content: ['All · 全选', 'Copy · 复制', 'Cut · 剪切', 'Paste · 粘贴', 'Search · 搜索']
            },
            {
                name: 'Window·窗口',
                content: ['Theme1 · 主题1', 'Theme1 · 主题2', 'Theme1 · 主题3', 'SideBar · 边栏']
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

        modelChange: function ($event,type,option) {
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

    });

    var main = function () {
        code.getTree('/Users/sleepGod/frontEnd/homework/homework1/src/');
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
        $('#file_tree_bar').on('changed.jstree',function(event,data){
            var route = data.selected[0];
            var data = fs.readFileSync(route,'utf-8').toString();
            editor.setValue(data);
        })
    };
    main();
    avalon.scan();
});
