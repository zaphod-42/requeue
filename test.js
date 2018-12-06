const Queue = require('./index.js');

var queue = new Queue(3);

var count = 20;

queue.push(() => {
	return new Promise((f, r) => {
		if(--count){
			console.log('retry #'+(20-count));
			r('maybe this will work');
		}else{
			f('it works!!');
		}
    });
}, 20, 1000).then(console.log).catch(console.log);
