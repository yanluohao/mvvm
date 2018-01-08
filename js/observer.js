// 观察者
function Observer(data) {
    this.data = data;
    this.init(data);
}

Observer.prototype = {
    init: function (data) {
        var me = this;
        Object.keys(data).forEach(function (key) {
            me.defindReactive(me.data, key, me.data[key]);
        })
    },
    defindReactive: function (data, key, val) {
        // 针对key创建订阅者队列
        var dep = new Dep();
        var childObj = observe(val);
        Object.defineProperty(data, key, {
            enumerable: true, // 可枚举
            configurable: false, // 不能再define
            get: function () {
                // 一个开关的阈值
                if (Dep.target) {
                    dep.depend();
                }
                return val;
            },
            set: function (newVal) {
                if(newVal === val) {
                    return;
                }
                // 如果传入的set修改的值为object对象，进行监听。
                childObj = observe(newVal);
                val = newVal;
                // console.log("----->" + newVal);
                dep.notify();
            }
        })
    }
}

function observe(val) {
    if (!val || typeof (val) !== 'object') {
        return;
    }
    return new Observer(val);
}

var uid = 0;

// 订阅器
// 每一个key值对应的订阅者队列
function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.prototype = {
    addSub: function (sub) {
        // 某属性在片段中被调用一次push一次
        // sub对应一个Watcher
        this.subs.push(sub);
    },
    depend: function () {
        Dep.target.addDep(this);
    },
    removeSub: function (sub) {
        var index = this.subs.indexOf(sub);
        if (index != -1) {
            this.subs.splice(index, 1);
        }
    },
    notify: function () {
        this.subs.forEach(function (sub) {
            sub.update();
        })
    }
}

Dep.target = null;