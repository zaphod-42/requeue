module.exports = class promiseQueue{
	constructor(concurrentLimit = 1, queueLimit = Infinity, promise = Promise){
		this.cLimit = concurrentLimit;
		this.qLimit = queueLimit;
		this.Promise = promise;

		this.processing = this.length = 0;
		this.queue = [];
		this.active = true;
		this.next = Array.prototype.shift;
	}
	push(...a){return this._add('push', ...a);}
	unshift(...a){return this._add('unshift', ...a);}
	pop(){return this._remove('pop');}
	shift(){return this._remove('shift');}
	flush(){this.queue.length = 0;}
	stop(){
		this.active = false;
	}
	start(){
		this.active = true;
		this.process();
	}
	pause(t = 0){
		this.unshift(() => {
			return new this.Promise((f,r) => {
				setTimeout(f, t);
			});
		});
	}
	//Internal functions, these should not be called directly
	_add(m,f,r=false,t=0){
		if(this.qLimit == this.queue.length) return this.Promise.reject('Queue Full');
		return new this.Promise((fulfill, reject) => {
			this.length = this.queue[m](() => {
				f().then(fulfill).catch((err) => {
					if(r){
						this.unshift(f, r-1, t).then(fulfill).catch(reject);
						this.pause(t);
					}else reject(err);
				}).then((c) => {
					this.process(--this.processing);
				});
			});
			this.process();
		});
	}
	_remove(m){
		let res = this.queue[m]();
		this.length = this.queue.length;
		return this.length;
	}
	process(){
		while(this.active && this.queue.length && this.processing < this.cLimit){
			this.processing++;
			this.next.apply(this.queue)();
			this.length = this.queue.length;
		}
	}
};
