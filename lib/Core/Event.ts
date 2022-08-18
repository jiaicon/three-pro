/**
 * Event事件类
 */
class Event {
  eventTypeObj: any;
  cacheObj: any;
  // 中间仓库
  constructor() {
    this.eventTypeObj = {};
    this.cacheObj = {};
  }

  // 发布者
  fire() {
    let eventType = Array.prototype.shift.call(arguments);
    let args = arguments;
    const that = this;

    if (!this.cacheObj[eventType]) this.cacheObj[eventType] = [];

    function cache() {
      if (that.eventTypeObj[eventType]) {
        let eventList = that.eventTypeObj[eventType];
        eventList.forEach((f: any) => {
          f.apply(f, args);
        });
      }
    }

    cache();

    this.cacheObj[eventType].push(cache);
  }

  // 订阅者
  on(eventType: any, fn: any) {
    if (!this.eventTypeObj[eventType]) this.eventTypeObj[eventType] = [];

    this.eventTypeObj[eventType].push(fn);

    if (this.cacheObj[eventType]) {
      let eventCacheList = this.cacheObj[eventType];
      eventCacheList.forEach((f: any) => f());
    }
  }

  // 取消订阅
  off(eventType: any, fn: any) {
    let eventTypeList = this.eventTypeObj[eventType];
    if (!eventTypeList) return false;

    if (!fn) {
      if (eventTypeList) eventTypeList.length = 0;
    } else {
      for (let i = 0; i < eventTypeList.length; i++) {
        if (eventTypeList[i] === fn) {
          eventTypeList.splice(i, 1);
          i--;
        }
      }
    }
    return true;
  }
}

export default Event;
