# mvvm

主要由Observe, Compile和Watcher三部分组成，入口MVVM。

先由Observe对MVVM传入的对象进行数据劫持和监听，利用Object.defineProperty来重写该对象下属性的get和set方法。
同时每个属性都对应生成了一个dep订阅器。

然后通过传入对象的el属性，获取到dom片段。复制dom片段内容到fragment中。
对fragment内容做解析。
解析片段时，获取到变量名，同时往该变量名对应的dep订阅器中塞一个Watcher订阅者进去。
然后将变量解析为对应的值。

当MVVM传入的对象的属性值发生改变时，由于Observe重写了传入值的set方法，当set触发时，对应的dep订阅器的notify方法触发，
订阅器内部的订阅者触发自身的update方法，从而达到更新数据的目的。
