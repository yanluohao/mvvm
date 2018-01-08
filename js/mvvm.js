function MVVM(options) {
    this.$options = options;
    var data = this._data = this.$options.data,
        me = this;
    
    // 对new出来的对象做数据劫持，使得能够以this.key的形式获取相对应的属性
    Object.keys(data).forEach(function(key) {
        me._proxyData(key);
    })

    this._initComputed();

    // 开始对数据进行观察
    observe(data);

    // 开始对绑定的dom片段进行解析和渲染
    this.$compile = new Compile(options.el || document.body, this);
}

MVVM.prototype = {
    $watch: function(key, cb, options) {
        new Watcher(this, key, cb);
    },
    _proxyData: function (key) {
        var me = this;
        Object.defineProperty(me, key, {
            configurable: false,
            enumerable: true,
            get: function () {
                return me._data[key];
            },
            set: function (newVal) {
                me._data[key] = newVal;
            }
        })
    },
    _initComputed: function() {
        var me = this;
        var computed = this.$options.computed;
        if (typeof computed === 'object') {
            Object.keys(computed).forEach(function(key) {
                Object.defineProperty(me, key, {
                    get: typeof computed[key] === 'function' 
                            ? computed[key] 
                            : computed[key].get,
                    set: function() {}
                });
            });
        }
    }
}