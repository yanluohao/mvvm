function Compile(el, vm) {
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    if (this.$el) {
        this.$fragment = this.nodeToFragment(this.$el);
        this.init();
        this.$el.appendChild(this.$fragment);
    }
}

Compile.prototype = {
    init: function () {
        this.compileElement(this.$fragment);
    },
    nodeToFragment: function (el) {
        // 轻量版的document，文档碎片
        var fragment = document.createDocumentFragment(),
            child;
        // el.firstChild属性
        // 内容做剪切操作到fragment内
        while (child = el.firstChild) {
            fragment.appendChild(child);
        }
        return fragment;
    },
    compileElement: function (el) {
        var childNodes = el.childNodes,
            me = this;
        Array.prototype.slice.call(childNodes).forEach(function (node) {
            // 获取节点的内容
            var text = node.textContent;
            var reg = /\{\{(.*)\}\}/; // 捕获内容

            if (me.isElementNode(node)) {
                me.compile(node);
            } else if (me.isTextNode(node) && reg.test(text)) {
                me.compileText(node, RegExp.$1);
            }

            if (node.childNodes && node.childNodes.length) {
                me.compileElement(node);
            }
        })
    },
    compile: function (node) {
        // 返回的是一个类map的属性对象
        var nodeAttrs = node.attributes,
            me = this;
        Array.prototype.slice.call(nodeAttrs).forEach(function (attr) {
            // 获取节点上的属性
            var attrName = attr.name;
            if (me.isDirective(attrName)) {
                // 指令绑定的变量名
                var exp = attr.value;
                var dir = attrName.substring(2);
                if (me.isEventDirective(dir)) {
                    compileUtil.eventHandler(node, me.$vm, exp, dir);
                } else if (me.isBindDirective(dir)) {
                    compileUtil.bindHandler(node, me.$vm, exp, dir);
                } else {
                    compileUtil[dir] && compileUtil[dir](node, me.$vm, exp);
                }

                node.removeAttribute(attrName);
            }
        })
    },
    compileText: function (node, exp) {
        compileUtil.text(node, this.$vm, exp);
    },
    isElementNode: function (node) {
        return node.nodeType == 1;
    },
    isTextNode: function (node) {
        return node.nodeType == 3;
    },
    isDirective: function (attr) {
        return attr.indexOf('v-') == 0;
    },
    isEventDirective: function (dir) {
        return dir.indexOf('on') == 0;
    },
    isBindDirective: function (dir) {
        return dir.indexOf('bind') == 0;
    },
}

// 指令集合
var compileUtil = {
    text: function (node, vm, exp) {
        this.bind(node, vm, exp, 'text');
    },
    html: function (node, vm, exp) {
        this.bind(node, vm, exp, 'html');
    },
    model: function (node, vm, exp) {
        this.bind(node, vm, exp, 'model');

        var me = this,
            val = this._getVMVal(vm, exp);
        node.addEventListener('input', function (e) {
            var newValue = e.target.value;
            if (val === newValue) {
                return;
            }

            me._setVMVal(vm, exp, newValue);
            val = newValue;
        });
    },
    // class: function (node, vm, exp) {
    //     this.bind(node, vm, exp, 'class');
    // },
    bind: function (node, vm, exp, dir) {
        var updateFn = updater[dir + 'Updater'];
        updateFn && updateFn(node, vm[exp]);
        // 实例化订阅者
        new Watcher(vm, exp, function (value, oldValue) {
            updateFn && updateFn(node, value, oldValue);
        })
    },
    eventHandler: function (node, vm, exp, dir) {
        var eventType = dir.split(":")[1],
            fn = vm.$options.methods && vm.$options.methods[exp];

        if (eventType && fn) {
            // bind让函数方法中的this指向回到vm对象本身
            node.addEventListener(eventType, fn.bind(vm), false);
        }
    },
    bindHandler: function (node, vm, exp, dir) {
        var bindAttr = dir.split(":")[1],
            updateFn = updater.bindUpdater;
        updateFn(node, bindAttr, vm[exp]);
        // 实例化订阅者
        new Watcher(vm, exp, function (value, oldValue) {
            updateFn && updateFn(node, bindAttr, value);
        })
    },
    _getVMVal: function (vm, exp) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k) {
            val = val[k];
        });
        return val;
    },
    _setVMVal: function (vm, exp, value) {
        var val = vm;
        exp = exp.split('.');
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k];
            } else {
                val[k] = value;
            }
        });
    }
}

// 更新集合
var updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value;
    },
    bindUpdater: function (node, attr, value) {
        node.setAttribute(attr, value);
    },
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value;
    },
    /*
    classUpdater: function (node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '');
        var space = className && String(value) ? ' ' : '';
        node.className = className + space + value;
    },
    */
    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value;
    }
}