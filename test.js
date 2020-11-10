const Queue = require('./index.js');

var tests = {
	retryTest: () => {
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
	},
	anyMethod: (fulfillPoint = 3) => {
		var queue = new Queue();
		var promises = [];
		for(var i=0;i<10;i++){
			let id = i;
			promises.push(() => {
				return new Promise((fulfill, reject) => {
					if(id == fulfillPoint) fulfill('Success on '+id);
					else reject('Rejected '+id);
				});
			});
		}
		console.log(promises);
		queue.any(promises).then(console.log).catch(console.log);
	}
}

tests.anyMethod(11);
