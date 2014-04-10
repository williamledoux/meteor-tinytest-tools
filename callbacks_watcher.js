var Future = Meteor.isServer ? Npm.require('fibers/future') : null;
//-----------------------------------------------------------------------------
// Helper to test one or more functions that are supposed to call several 
// of the callbacks they were passed as parameters
//
// To do this, each callback must be wrapped with the wrapCb function before
// being sent to the function
//
// At the end of the test, the function wait must be called so that the test
// can't end before all the expected callbacks have been called (and to fail 
// the test after some time if not all of the expected callback have been 
// called
//-----------------------------------------------------------------------------
CallbacksWatcher = function(test){
	this._iTotalCall=-1;
	this._iTimeoutCall=-2;
	this._test		= test;
	this._futures	= [];
	this._wrapped	= [];
};
//-----------------------------------------------------------------------------
CallbacksWatcher.prototype.wrapCB = function(name, expectedCalls, callback, bForceArgs){
	var self = this;
	var f = new Future();
	_bForceArgs = bForceArgs || arguments.length>5;
	self._futures.push(f);
	
	var worker={
		identifier : name,
		expectedCallCount : 0,
		expectedCallSequence : null,
		iCall	: -1
	};
	if(expectedCalls instanceof Array){
		worker.expectedCallCount = expectedCalls.length;
		worker.expectedCallSequence = expectedCalls;
	}else{
		worker.expectedCallCount = expectedCalls;
	}
	worker.do = function(){
		++worker.iCall;
		++self._iTotalCall;
		var bFinalCall;
		if(worker.expectedCallCount>0 && worker.iCall>=worker.expectedCallCount){
			self._test.fail(name+" > was called more than "+worker.expectedCallCount+" times");
		}
		if(worker.expectedCallSequence){
			self._test.equal(worker.expectedCallSequence[worker.iCall], self._iTotalCall, name+" > Wrong calling order");
		}
		var result;
		if(callback){
			if (typeof callback!='function')
				result=callback;
			else if(_bForceArgs){
				arguments.iCall = worker.iCall;
				result=callback(arguments);
			}else{
				switch(arguments.length){
					case 0: result=callback(worker.iCall); break;
					case 1: result=callback(arguments[0], worker.iCall); break;
					case 2: result=callback(arguments[0], arguments[1], worker.iCall); break;
					case 3: result=callback(arguments[0], arguments[1], arguments[2], worker.iCall); break;
					case 4: result=callback(arguments[0], arguments[1], arguments[2], arguments[3], worker.iCall); break;
					case 5: result=callback(arguments[0], arguments[1], arguments[2], arguments[3], arguments[4], worker.iCall); break;
				}
			}				
		}
		if(worker.iCall==worker.expectedCallCount-1)
			f.return();
		return result;
	};
	self._wrapped.push(worker);
	return worker.do;
};
//-----------------------------------------------------------------------------

CallbacksWatcher.prototype.wait = function(onComplete, delay, interval){
	var self = this;
	var _interval = interval || 500;
	self._hInterval = Meteor.setInterval(function(){
		if(self._iTotalCall === self._iTimeoutCall){
			for(var iWorker=0; iWorker<self._wrapped.length; ++iWorker){
				var worker = self._wrapped[iWorker];
					if(worker.expectedCallCount>0 && worker.iCall<worker.expectedCallCount){
						self._test.fail("after "+_interval+"ms, "+worker.identifier+" has been called "+(worker.iCall+1)+" times instead of "+worker.expectedCallCount+" times");
					}
			}
			Meteor.clearInterval(self._hInterval);
			onComplete();
		}else{
			self._iTimeoutCall=self._iTotalCall;
		}
	},_interval);
	for(var iFuture=0; iFuture<self._futures.length; ++iFuture){
		self._futures[iFuture].wait();
	}
	Meteor.clearInterval(self._hInterval);
	Meteor.setTimeout(onComplete, delay);
};
//-----------------------------------------------------------------------------