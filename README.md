# tinytest-tools

(wanabee set of) helper(s) for working with Meteor's tinytest framework.
Contributions and comments are welcome

## Callback Watcher

Helper to test one or more functions that are supposed to call callbacks they were passed as parameters
Note: this package features are similar to [callback_logger](https://github.com/meteor/meteor/blob/devel/packages/test-helpers/callback_logger.js), but with different usage

With this package, you can easily get or make understandable errors whenever some callbacks
  1. haven't been called in a certain times, or have been called too many times
  1. have not been called in a specified order
  1. have been called with the wrong parameters
  1. have been called in the wrong context

### Example

```javascript
  Tinytest.addAsync("Example Test", function(test, onComplete){
    var CBW = new CallbacksWatcher(test);
    // create a callback that should be called 3 times
    // and would do nothing but returning true
    var WrappedCallback1 = CBW.wrapCB("MyFirstCallback", 3, true);
    // wrap an existing callback that should be called 2 times 
    // in a specific order (it should be the first and sixth callback 
    //  called among all wrapped callbacks)
    var WrappedCallback2 = CBW.wrapCB("MyFirstCallback", [0, 5], ExistingCallback);
    
    MyTestedFunction(WrappedCallback1, WrappedCallback2);

    // Call the oncomplete callback 10ms after the last wrapped callback 
    // has been called.
    // Fail if some callbacks have not yet been called after 500ms.
    CBW.wait(onComplete, 10, 500); 
  });
```

### API

#### CallbacksWatcher

`CallbacksWatcher` needs the tinytest's `test` object

Example:

```javascript
  Tinytest.addAsync("Example Test", function(test, onComplete){
    var CBW = new CallbacksWatcher(test);
    //[...]
    CBW.wait(onComplete); 
  }
```

#### wrapCB(name, expectedCalls, callback, verbatim=false)

Will wrap the `callback` and watch that it will be called `expectedCalls (number)` times  or 
in the `expectedCalls (array)` call sequence.
`name` will be used in failure messages related to this callback.
the `callback` will be called with an extra last parameter `iCall` that will allow different test for each calls

Example:

```javascript
  
  var foo = function(a, b, c){}
  var bar = function(){}
  testedFunction = function(fooCB, barCB){
    fooCB(1, 2, 3);
    barCB();
    fooCB(3, 2, 1);
    barCB();
    barCB();
  }
  
  //[...]
  Tinytest.addAsync("Example Test", function(test, onComplete){
    var CBW = new CallbacksWatcher(test);
    var WrappedBar = CBW.wrapCB("", 3, bar); //wrapping with no test on arguments
    var WrappedFoo = CBW.wrapCB("", [0, 2], function(a, b, c, iCall){
      // optionnal tests on arguments:
      switch(iCall){
        case 0: test.equal(a, 1); break; // first call arg test
        case 1: test.equal(a, 3); break; // second call arg test
      }
      return foo(a, b, c);
    });
    testedFunction(wrappedFoo, wrappedBar);
    CBW.wait(onComplete, 10, 500); 
  }
```

However, in case the `callback` takes more than 5 parameters, or if the `forceArgs` is set to ` true`, `callback`
will be called with an array of parameters. Note that `forceArgs` needs to be `true` if some of the parameters of the
`callback` may be ommitted by the tested function.

Example:

```javascript
  
  var foo = function(a, b, c){}
  var bar = function(a, b, c, d, e, f){}
  testedFunction = function(fooCB, barCB){
    fooCB(1, 2); // not calling all parameters
    barCB(1, 2, 3, 4, 5, 6); // more thatn 5 parameters
    fooCB(3, 2); // not calling all parameters
  }
  
  //[...]
  Tinytest.addAsync("Example Test", function(test, onComplete){
    var CBW = new CallbacksWatcher(test);


    // this won't work because optional parameters:
    var WrappedFoo = CBW.wrapCB("", 1, foo); 
    // instead do:
    var WrappedFoo = CBW.wrapCB("", 2, function(args){
      // optionnal tests on arguments:
      switch(args.iCall){
        case 0: test.equal(args[0], 1); break; // first call arg test
        case 1: test.equal(args[0], 3); break; // second call arg test
      }
      return foo(args[0], args[1], args[2]);
    }, true); // <-- forceArgs needs to be true !!


    // this won't work because more than 5 parameters:
    var WrappedBar = CBW.wrapCB("", 1, bar); 
    // instead do:
    var WrappedBar = CBW.wrapCB("", 1, function(args){
      return bar(args[0], args[1], args[2], args[3], args[4], args[5]);
    });

    testedFunction(wrappedFoo, wrappedBar);
    CBW.wait(onComplete, 10, 500); 
  }
```

`callback` can also not be a function:

```javascript
  var WrappedCallback1 = CBW.wrapCB("MyFirstCallback", 1, 42); 
  // is similar to
  var WrappedCallback1 = CBW.wrapCB("MyFirstCallback", 1, function(){return 42;}); 
```

#### wait(onComplete, delay, interval)

Will call tinytest's `onComplete` callback `delay`ms after the last expected callback call has been made.
Will make the test to fail if no callback has been called during `interval`ms

```javascript
  Tinytest.addAsync("Example Test", function(test, onComplete){
    var CBW = new CallbacksWatcher(test);
    //[...]
    // Call the oncomplete callback 10ms after the last wrapped callback 
    // has been called.
    // Fail if some callbacks have not yet been called after 500ms.
    CBW.wait(onComplete, 10, 500); 
  }
```