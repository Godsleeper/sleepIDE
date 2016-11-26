/**
 * @file index.js, 商品列表页
 * @author xisi(xisi@yiran.com)
 */

var avalon = require('avalon');
var $ = require('jquery');
var Mock = require('mockjs');
var wechat = require('./wechat.js');
require('css/index.scss');


/**
 * 模拟首页的信息
 * top_bar_arr: {String}顶部导航栏的内容
 * bottom_bar_arr: {String}底部栏的内容
 * currentIndex: @name: {String}当前页面的类别, @content: @name: {String}该类别下的名称, @src: {String}图标url
 */
Mock.mock('xisi.hutaojie.com/index', {
    topbarArr: ['首页', '服饰箱包', '家居生活', '食品饮料', '数码电器', '家纺家居', '水果生鲜', '母婴玩具', '美妆护肤'],
    bottombarArr: ['首页', '上新', '海淘', '搜索', '个人中心'],
    currentIndex: {
        name: '服饰箱包',
        content: [
            {
                name: '女装',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/45/sEJUKXrvboEa8JSMEzDipmi664T7fRAF.jpg'
            },
            {
                name: '男装',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/47/LlkmHkpjBnIvKvfLXnKW6NxCo4nkC5Xx.jpg'
            },
            {
                name: '内衣裤袜',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/610/GS4X5Ojt5TlVPuAtNGqr2hywByGs2FHN.jpg'
            },
            {
                name: '女鞋',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/48/HcNgazUs9Nu3MyOsijKbE1Q1zUu15Tzl.jpg'
            },
            {
                name: '箱包',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/51/Vdq95da7ykOseXe6zPCvuOQbKWQ4EOhU.jpg'
            },
            {
                name: '男鞋',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/49/AtacHo2ebeKJlYKZfru6U1vvPWLuG0XC.jpg'
            },
            {
                name: '运动服饰',
                src: 'http://omsproductionimg.yangkeduo.com/images/label/551/T55phkzs5Lgu1eZhAooMJ56bdc1sr7Hs.jpg'
            },
            {
                name: '查看全部',
                src: 'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAACwAAAAsBAMAAADsqkcyAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAhUExURQAAAODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4P7+/u/v73koT0EAAAAIdFJOUwBO8rKJ1CMLoiR1VwAAANtJREFUKM91kz0OwjAMhYNAsFaIgRUxkBEhIXWErTtLR46AuAFpKxlOQHoCekvitI2a1u8NkfUl8k9sK9VqtTlrc7s+VKTZibz2SURz6lQN+DKloOIe8JoG2vV0QZEuHc5iXIqP++fbMX75NPQYG05mThMdJR+tl3yKK1c3CUok1+z8KeGDFJFjZhIuVSrhQsqPM+TSP/bnzqYOplF82diaARNvOqwlTDI2PuTbft1pbTArlCAoBxQPvgp8LGgDaBpqMRgIMD5g2NBogkFGYw+WBK0UWEC0rpPl/gMSMZBtc0a6EQAAAABJRU5ErkJggg=='
            }
        ]
    }
});


/**
 * avalon start
 */
avalon.ready(function () {
    /**
     *  导航栏的vmodel
     */
    var bar = avalon.define({
        /**
         *   @type {String} vm绑定到ms-controller是bar的元素上
         */
        $id: 'bar',
        /**
         *   @type {Array} 绑定导航栏的内容
         */
        topbarArr: [],
        /**
         *   @type {Array} 绑定底部类的内容
         */
        bottombarArr: [],
        /**
         *   @type {Object} 绑定当前分类的内容
         */
        currentIndex: {},

        /**
         *   页面进入时ajax加载数据，加载导航栏的内容，分类栏的内容和图标，底部栏的内容
         */
        databarLoader: function () {
            $.ajax({
                url: 'xisi.hutaojie.com/index',
                type: 'GET'
            }).done(function (json) {
                //  mock数据传回的是json字符串，需要转换为json对象
                var jsons = JSON.parse(json);
                bar.topbarArr = jsons.topbarArr;
                bar.bottombarArr = jsons.bottombarArr;
                bar.currentIndex = jsons.currentIndex;
            });
        }

    });

    /**
     * 商品列表的vm部分
     */
    var list = avalon.define({

        /**
         * @type {string} 绑定到商品详情的div上
         */
        $id: 'list',

        /**
         * @type {Array} 存储商品的信息对象
         */

        info: [],

        /**
         * Load Data
         *
         * @param {number} page, 加载商品信息的页号
         * @param {number} size, 加载商品一页的大小
         *
         * @return {function}
         */
        datalistLoader: (function (page, size) {
            var pages = page;
            var sizes = size;
            return function () {
                $.ajax({
                    url: 'http://apiv2.hutaojie.com/v2/goods?page=' + pages + '&size=' + sizes,
                    type: 'GET'
                }).done(function (json) {
                    //  传回了数据再绑定下拉刷新函数
                    list.pullRefresh();
                    //  使用闭包在内存中存储页数，不断增加，将新增的数据加入list.info中
                    list.info = list.info.pushArray(json.goods_list);
                    pages++;
                });
            };
        })(1, 20),

        /**
         * 下拉刷新功能
         */
        pullRefresh: function () {
            var wrapper = document.querySelector('.screen_wrapper');
            var scroll = function () {
                // 判断是否需要下拉加载
                if (this.scrollTop + this.clientHeight === this.scrollHeight) {
                    list.datalistLoader();
                    this.removeEventListener('scroll', scroll);
                }
            };
            wrapper.addEventListener('scroll', scroll);
        },

        /**
         * 回到顶部效果
         */
        goTop: function () {
            var toTop = document.querySelector('.to_top');
            var wrapper = document.querySelector('.screen_wrapper');
            //  判断是否出现回到顶部
            var scrollTop = function () {
                // 判断是否需要出现回到顶部
                if (parseInt(this.scrollTop) >= 700) {
                    toTop.style.bottom = '64px';
                }
                else {
                    toTop.style.bottom = '-50px';
                }
            };
            //  定时器实现回到顶部的函数，12ms执行一次，每次每次scrollTop减少50
            var animateTop = function () {
                var timer = setInterval(function () {
                    wrapper.scrollTop = wrapper.scrollTop - 50;
                    if (Math.floor(wrapper.scrollTop) <= 0) {
                        clearInterval(timer);
                    }
                }, 12);
            };
            //  给回到顶部绑定点击事件
            toTop.addEventListener('click', animateTop);
            //  给wrapper绑定拖动事件
            wrapper.addEventListener('scroll', scrollTop);
        },

        /**
         * 处理页面跳转
         */
        jumpUrl: function () {
            window.location.href = 'detail.html';
        },

        /**
         * 处理所有绑定事件
         */
        eventPool: function () {
            list.goTop();
        }
    });

    /**
     * 入口函数main函数
     */
    var main = function () {
        wechat($);
        //  绑定各种事件
        list.eventPool();
        //  加载列表菜单和分类导航
        bar.databarLoader();
        //  加载商品列表信息
        list.datalistLoader();
        //  执行扫描
        avalon.scan();
    };
    main();
});


