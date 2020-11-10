module.exports = class promiseQueue{
	constructor(concurrentLimit = 1, queueLimit = Infinity, promise = Promise){
		this.cLimit = concurrentLimit;
		this.qLimit = queueLimit;
		this.Promise = promise;

		this.processing = this.length = 0;
		this.queue = [];
		this.active = true;
		this.next = Array.prototype.shift;

		this.firstFulfill = false;
		this.allReject = false;
	}
	any(f){
		if(this.length){
			throw 'Tried to use the "any" method on a non-empty queue';
			return false;
		}
		return new Promise((fulfill, reject) => {
			var rejects = [];
			this.firstFulfill = (r) => {
				this.flush();
				fulfill(r);
			};
			this.allReject = (r) => {
				rejects.push(r);
				if(!this.queue.length) reject(rejects);
			};
			console.log(f);
			f.map((_f) => this._add('push', _f));
		});
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
	pause(t = 0, m = 'unshift'){
		this[m](() => {
			return new this.Promise((f,r) => {
				setTimeout(f, t);
			});
		});
	}
	//Internal functions, these should not be called directly
	_add(m,f,r=false,t=0){
		if(this.qLimit == this.queue.length) return this.Promise.reject('Queue Full');
		return new this.Promise((fulfill, reject) => {
			var _fulfill = !this.firstFulfill ? fulfill : this.firstFulfill.bind(this);
			var _reject = !this.firstFulfill ? reject : this.allReject.bind(this);

			this.length = this.queue[m](() => {
				f().then(_fulfill).catch((err) => {
					if(r){
						this.unshift(f, r-1, t).then(fulfill).catch(reject);
						this.pause(t);
					}else _reject(err);
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
