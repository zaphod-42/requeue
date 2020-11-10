# Overview

Basic module for creating a promise based queue, allows configurable concurrent workers, queue length, and promise engine. Supports push, unshift, shift, pop, start, stop, pause, along with retries for failed workers.

### Installation

This library can be installed with npm with the following command:

```cli
npm i requeued
```
A simple delayed retry queue is set up and can be seen by running the test file
```cli
npm test
```

### Usage

You can create a minimal single concurrent worker queue by simply requiring the module and instantiating an object
```javascript
const Queue = require('requeued');

var queue = new Queue();
```
Add a worker using an old callback async function:
```javascript
queue.push(() => {
   return new Promise((resolve, reject) => {
       doSomeOldAsyncStuff((err) => {
          if(err) reject(err);
          else resolve();
       });
   });
});
```
Add a worker to the beginning of the queue using a new async promise style function
```javascript
queue.unshift(() => {
   return somePromiseEnabledFunction();
});
```
Add a function that is requred, and should be retried 3 times every 500 ms in case of a failure. e.g. initializing hardware before communication.
```javascript
queue.push(() => {
    return new Promise((resolve, reject) => {
       initSerialDevice((err) => {
           if(err) reject(rrr);
           else resolve();
       }) ;
    });
}, 3, 500)
```
Adding a worker returns a Promise object that will be resolved or rejected according to the action of the function. Since the next item in the queue is processed after the current one resolves, you can set up error handler retries at this point also.
```javascript
function initSomething(portNumber=10001, cb){
    queue.unshift(() => {
        return new Promise((resolve, reject) => {
            if(!we_have_an_error){
                resolve("Yeah! No errors here");
            }else{
                reject(we_have_an_error)
            }
        });
    }).then((data) => {
        //data == "Yeah! No errors here"
        //We could either wrap the queue in another promise so we can return the success to
        //the caller, or in this case, use an old style callback
        cb();
    }).catch((err) => {
        switch(err){
            case 1:
                //change some variable and add this to the queue again
                initSomething(portNumber+1, cb);
                break;
            case 2:
                //maybe the error was a communication timeout, just send it right back through
                 initSomething(portNumber, cb);
                break;
            default:
                //Who knows what this error is? Log it and quit
                console.log(err);
                process.exit();
        }
    });
}
```

### Instance Options

```javascript
var queue = new Queue(concurrentWorkers = 1, queueLimit = Infinity, promise = Promise);
```
* `concurrentWorkers [type = int, default = 1]`

The number of queued workers allowed to run at once

* `queueLimit [type = int, default = Infinity]`

The number of items that may exist in the queue, if an attempt is made to add an item to the queue that would bring the total length over the limit, a promise rejection will be sent immediately

* `promise [type = Promise engine, default = global Promise]`

The Promise engine to be used, this allows the queue to be used with bluebird or a promise engine other than the native one.

### Methods

```javascript
queue.push(func, [retries = 0, [waitTimeout = 0]])
queue.unshift(func, [retries = 0, [waitTimeout = 0]])
```
 Push a function to the end of the queue, or unshift to the beginning. Both of these methods will return a Promise object which will either resolve or reject after it has been processed.

 * `func [type = callable, return = Promise, required]`

Any callable that returns a Promise.

* `retries [type = int, default = 0]`

The number of times to retry this function upon failure. The promise returned by the callable will still reject appropriately even if retries are used, but after the given number of retries have all failed.

* `waitTimeout [type = int, required = 0]`

If this should be retried, the wait timeout defines how many milliseconds to pause the queue between retries.

```javascript
queue.any(funcs)
```
Similar to the `Array.prototype.some()` method, when sent a list of functions, a Promise will be returned and either resolve with the first successful queued function, or reject with an array of all rejectioned messages.

**Note!** This method will throw an error if you attempt to call it on a non-empty queue.

* `funcs [type = Array]`

Array of callables that return Promises.

```javascript
queue.shift();
queue.pop();
```
Remove a function from the beginning or end of the queue. Both of these methods return the new length of the queue.

```javascript
queue.flush();
```
Empty the queue. This will not prevent items from being added, or workers that are currently processing from completing.

```javascript
queue.stop();
queue.start();
```
Stop/Start processing items in the queue.

```javascript
queue.pause(t = 0, method = 'unshift');
```
* `t [type = int, required]`

Pause the queue for `t` milliseconds.

* `method [type = string, default="unshift"]`

Where to add the pause, by default it will happen immediately following the completion of any currently processing worker, change method to "push" to add the pause in at the end of the current queue.

### Properties

* `queue.length [type = int]`

The current number of workers in the queue, this does not include workers that are processing.

* `queue.processing [type = int]`

The number of workers that are currently processing.

* `queue.cLimit [type = int]`

The number of queued workers allowed to run at once

* `queue.qLimit [type = int]`

The number of items that may exist in the queue, if an attempt is made to add an item to the queue that would bring the total length over the limit, a promise rejection will be sent immediately

* `queue.active [type = boolean]`

Whether or not the queue is actively processing workers.

* `queue.next [type = callable, return = queued worker, default =  Array.prototype.shift]`

**Advanced!** Replace this with your own function (or Array.prototype.pop) to turn this into a LIFO queue. The function will receive the queued workers as the `this` context
