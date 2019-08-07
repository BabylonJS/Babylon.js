(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if (typeof define === 'function' && define.amd)
    define("shaderc", [], factory);
  else if (typeof exports === 'object')
    exports["shaderc"] = factory();
  else
    root["Shaderc"] = factory();
})((typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this), function () {
  const Shaderc = (Module) => {
    Module = Module || {};

    const returnPromise = new Promise(res => {
      Module.onRuntimeInitialized = () => {
        res(Module);
      };
    });

    // Sometimes an existing Module object exists with properties
    // meant to overwrite the default module functionality. Here
    // we collect those properties and reapply _after_ we configure
    // the current environment's defaults to avoid having to be so
    // defensive during initialization.
    var moduleOverrides = {};
    for (var key in Module) {
      if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key];
      }
    }

    // The environment setup code below is customized to use Module.
    // *** Environment setup code ***
    var ENVIRONMENT_IS_WEB = false;
    var ENVIRONMENT_IS_WORKER = false;
    var ENVIRONMENT_IS_NODE = false;
    var ENVIRONMENT_IS_SHELL = false;

    // Three configurations we can be running in:
    // 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
    // 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
    // 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)

    if (Module['ENVIRONMENT']) {
      if (Module['ENVIRONMENT'] === 'WEB') {
        ENVIRONMENT_IS_WEB = true;
      } else if (Module['ENVIRONMENT'] === 'WORKER') {
        ENVIRONMENT_IS_WORKER = true;
      } else if (Module['ENVIRONMENT'] === 'NODE') {
        ENVIRONMENT_IS_NODE = true;
      } else if (Module['ENVIRONMENT'] === 'SHELL') {
        ENVIRONMENT_IS_SHELL = true;
      } else {
        throw new Error('The provided Module[\'ENVIRONMENT\'] value is not valid. It must be one of: WEB|WORKER|NODE|SHELL.');
      }
    } else {
      ENVIRONMENT_IS_WEB = typeof window === 'object';
      ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
      ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
      ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
    }


    if (ENVIRONMENT_IS_NODE) {
      // Expose functionality in the same simple way that the shells work
      // Note that we pollute the global namespace here, otherwise we break in node
      if (!Module['print']) Module['print'] = console.log;
      if (!Module['printErr']) Module['printErr'] = console.warn;

      var nodeFS;
      var nodePath;

      Module['read'] = function shell_read(filename, binary) {
        if (!nodeFS) nodeFS = require('fs');
        if (!nodePath) nodePath = require('path');
        filename = nodePath['normalize'](filename);
        var ret = nodeFS['readFileSync'](filename);
        return binary ? ret : ret.toString();
      };

      Module['readBinary'] = function readBinary(filename) {
        var ret = Module['read'](filename, true);
        if (!ret.buffer) {
          ret = new Uint8Array(ret);
        }
        assert(ret.buffer);
        return ret;
      };

      Module['load'] = function load(f) {
        globalEval(read(f));
      };

      if (!Module['thisProgram']) {
        if (process['argv'].length > 1) {
          Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
        } else {
          Module['thisProgram'] = 'unknown-program';
        }
      }

      Module['arguments'] = process['argv'].slice(2);

      if (typeof module !== 'undefined') {
        module['exports'] = Module;
      }

      process['on']('uncaughtException', function (ex) {
        // suppress ExitStatus exceptions from showing an error
        if (!(ex instanceof ExitStatus)) {
          throw ex;
        }
      });

      Module['inspect'] = function () { return '[Emscripten Module object]'; };
    }
    else if (ENVIRONMENT_IS_SHELL) {
      if (!Module['print']) Module['print'] = print;
      if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

      if (typeof read != 'undefined') {
        Module['read'] = read;
      } else {
        Module['read'] = function shell_read() { throw 'no read() available' };
      }

      Module['readBinary'] = function readBinary(f) {
        if (typeof readbuffer === 'function') {
          return new Uint8Array(readbuffer(f));
        }
        var data = read(f, 'binary');
        assert(typeof data === 'object');
        return data;
      };

      if (typeof scriptArgs != 'undefined') {
        Module['arguments'] = scriptArgs;
      } else if (typeof arguments != 'undefined') {
        Module['arguments'] = arguments;
      }

      if (typeof quit === 'function') {
        Module['quit'] = function (status, toThrow) {
          quit(status);
        }
      }

    }
    else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      Module['read'] = function shell_read(url) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send(null);
        return xhr.responseText;
      };

      if (ENVIRONMENT_IS_WORKER) {
        Module['readBinary'] = function readBinary(url) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', url, false);
          xhr.responseType = 'arraybuffer';
          xhr.send(null);
          return new Uint8Array(xhr.response);
        };
      }

      Module['readAsync'] = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      };

      if (typeof arguments != 'undefined') {
        Module['arguments'] = arguments;
      }

      if (typeof console !== 'undefined') {
        if (!Module['print']) Module['print'] = function shell_print(x) {
          console.log(x);
        };
        if (!Module['printErr']) Module['printErr'] = function shell_printErr(x) {
          console.warn(x);
        };
      } else {
        // Probably a worker, and without console.log. We can do very little here...
        var TRY_USE_DUMP = false;
        if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof (dump) !== "undefined") ? (function (x) {
          dump(x);
        }) : (function (x) {
          // self.postMessage(x); // enable this if you want stdout to be sent as messages
        }));
      }

      if (ENVIRONMENT_IS_WORKER) {
        Module['load'] = importScripts;
      }

      if (typeof Module['setWindowTitle'] === 'undefined') {
        Module['setWindowTitle'] = function (title) { document.title = title };
      }
    }
    else {
      // Unreachable because SHELL is dependant on the others
      throw 'Unknown runtime environment. Where are we?';
    }

    function globalEval(x) {
      eval.call(null, x);
    }
    if (!Module['load'] && Module['read']) {
      Module['load'] = function load(f) {
        globalEval(Module['read'](f));
      };
    }
    if (!Module['print']) {
      Module['print'] = function () { };
    }
    if (!Module['printErr']) {
      Module['printErr'] = Module['print'];
    }
    if (!Module['arguments']) {
      Module['arguments'] = [];
    }
    if (!Module['thisProgram']) {
      Module['thisProgram'] = './this.program';
    }
    if (!Module['quit']) {
      Module['quit'] = function (status, toThrow) {
        throw toThrow;
      }
    }

    // *** Environment setup code ***

    // Closure helpers
    Module.print = Module['print'];
    Module.printErr = Module['printErr'];

    // Callbacks
    Module['preRun'] = [];
    Module['postRun'] = [];

    // Merge back in the overrides
    for (var key in moduleOverrides) {
      if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key];
      }
    }
    // Free the object hierarchy contained in the overrides, this lets the GC
    // reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
    moduleOverrides = undefined;



    // {{PREAMBLE_ADDITIONS}}

    // === Preamble library stuff ===

    // Documentation for the public APIs defined in this file must be updated in:
    //    site/source/docs/api_reference/preamble.js.rst
    // A prebuilt local version of the documentation is available at:
    //    site/build/text/docs/api_reference/preamble.js.txt
    // You can also build docs locally as HTML or other formats in site/
    // An online HTML version (which may be of a different version of Emscripten)
    //    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

    //========================================
    // Runtime code shared with compiler
    //========================================

    var Runtime = {
      setTempRet0: function (value) {
        tempRet0 = value;
        return value;
      },
      getTempRet0: function () {
        return tempRet0;
      },
      stackSave: function () {
        return STACKTOP;
      },
      stackRestore: function (stackTop) {
        STACKTOP = stackTop;
      },
      getNativeTypeSize: function (type) {
        switch (type) {
          case 'i1': case 'i8': return 1;
          case 'i16': return 2;
          case 'i32': return 4;
          case 'i64': return 8;
          case 'float': return 4;
          case 'double': return 8;
          default: {
            if (type[type.length - 1] === '*') {
              return Runtime.QUANTUM_SIZE; // A pointer
            } else if (type[0] === 'i') {
              var bits = parseInt(type.substr(1));
              assert(bits % 8 === 0);
              return bits / 8;
            } else {
              return 0;
            }
          }
        }
      },
      getNativeFieldSize: function (type) {
        return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
      },
      STACK_ALIGN: 16,
      prepVararg: function (ptr, type) {
        if (type === 'double' || type === 'i64') {
          // move so the load is aligned
          if (ptr & 7) {
            assert((ptr & 7) === 4);
            ptr += 4;
          }
        } else {
          assert((ptr & 3) === 0);
        }
        return ptr;
      },
      getAlignSize: function (type, size, vararg) {
        // we align i64s and doubles on 64-bit boundaries, unlike x86
        if (!vararg && (type == 'i64' || type == 'double')) return 8;
        if (!type) return Math.min(size, 8); // align structures internally to 64 bits
        return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
      },
      dynCall: function (sig, ptr, args) {
        if (args && args.length) {
          return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
        } else {
          return Module['dynCall_' + sig].call(null, ptr);
        }
      },
      functionPointers: [],
      addFunction: function (func) {
        for (var i = 0; i < Runtime.functionPointers.length; i++) {
          if (!Runtime.functionPointers[i]) {
            Runtime.functionPointers[i] = func;
            return 2 * (1 + i);
          }
        }
        throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
      },
      removeFunction: function (index) {
        Runtime.functionPointers[(index - 2) / 2] = null;
      },
      warnOnce: function (text) {
        if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
        if (!Runtime.warnOnce.shown[text]) {
          Runtime.warnOnce.shown[text] = 1;
          Module.printErr(text);
        }
      },
      funcWrappers: {},
      getFuncWrapper: function (func, sig) {
        assert(sig);
        if (!Runtime.funcWrappers[sig]) {
          Runtime.funcWrappers[sig] = {};
        }
        var sigCache = Runtime.funcWrappers[sig];
        if (!sigCache[func]) {
          // optimize away arguments usage in common cases
          if (sig.length === 1) {
            sigCache[func] = function dynCall_wrapper() {
              return Runtime.dynCall(sig, func);
            };
          } else if (sig.length === 2) {
            sigCache[func] = function dynCall_wrapper(arg) {
              return Runtime.dynCall(sig, func, [arg]);
            };
          } else {
            // general case
            sigCache[func] = function dynCall_wrapper() {
              return Runtime.dynCall(sig, func, Array.prototype.slice.call(arguments));
            };
          }
        }
        return sigCache[func];
      },
      getCompilerSetting: function (name) {
        throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
      },
      stackAlloc: function (size) { var ret = STACKTOP; STACKTOP = (STACKTOP + size) | 0; STACKTOP = (((STACKTOP) + 15) & -16); return ret; },
      staticAlloc: function (size) { var ret = STATICTOP; STATICTOP = (STATICTOP + size) | 0; STATICTOP = (((STATICTOP) + 15) & -16); return ret; },
      dynamicAlloc: function (size) { var ret = HEAP32[DYNAMICTOP_PTR >> 2]; var end = (((ret + size + 15) | 0) & -16); HEAP32[DYNAMICTOP_PTR >> 2] = end; if (end >= TOTAL_MEMORY) { var success = enlargeMemory(); if (!success) { HEAP32[DYNAMICTOP_PTR >> 2] = ret; return 0; } } return ret; },
      alignMemory: function (size, quantum) { var ret = size = Math.ceil((size) / (quantum ? quantum : 16)) * (quantum ? quantum : 16); return ret; },
      makeBigInt: function (low, high, unsigned) { var ret = (unsigned ? ((+((low >>> 0))) + ((+((high >>> 0))) * 4294967296.0)) : ((+((low >>> 0))) + ((+((high | 0))) * 4294967296.0))); return ret; },
      GLOBAL_BASE: 1024,
      QUANTUM_SIZE: 4,
      __dummy__: 0
    }



    Module["Runtime"] = Runtime;



    //========================================
    // Runtime essentials
    //========================================

    var ABORT = 0; // whether we are quitting the application. no code should run after this. set in exit() and abort()
    var EXITSTATUS = 0;

    /** @type {function(*, string=)} */
    function assert(condition, text) {
      if (!condition) {
        abort('Assertion failed: ' + text);
      }
    }

    var globalScope = this;

    // Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
    function getCFunc(ident) {
      var func = Module['_' + ident]; // closure exported function
      if (!func) {
        try { func = eval('_' + ident); } catch (e) { }
      }
      assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
      return func;
    }

    var cwrap, ccall;
    (function () {
      var JSfuncs = {
        // Helpers for cwrap -- it can't refer to Runtime directly because it might
        // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
        // out what the minified function name is.
        'stackSave': function () {
          Runtime.stackSave()
        },
        'stackRestore': function () {
          Runtime.stackRestore()
        },
        // type conversion from js to c
        'arrayToC': function (arr) {
          var ret = Runtime.stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        },
        'stringToC': function (str) {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
            var len = (str.length << 2) + 1;
            ret = Runtime.stackAlloc(len);
            stringToUTF8(str, ret, len);
          }
          return ret;
        }
      };
      // For fast lookup of conversion functions
      var toC = { 'string': JSfuncs['stringToC'], 'array': JSfuncs['arrayToC'] };

      // C calling interface.
      ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
          for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
              if (stack === 0) stack = Runtime.stackSave();
              cArgs[i] = converter(args[i]);
            } else {
              cArgs[i] = args[i];
            }
          }
        }
        var ret = func.apply(null, cArgs);
        if (returnType === 'string') ret = Pointer_stringify(ret);
        if (stack !== 0) {
          if (opts && opts.async) {
            EmterpreterAsync.asyncFinalizers.push(function () {
              Runtime.stackRestore(stack);
            });
            return;
          }
          Runtime.stackRestore(stack);
        }
        return ret;
      }

      var sourceRegex = /^function\s*[a-zA-Z$_0-9]*\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
      function parseJSFunc(jsfunc) {
        // Match the body and the return value of a javascript function source
        var parsed = jsfunc.toString().match(sourceRegex).slice(1);
        return { arguments: parsed[0], body: parsed[1], returnValue: parsed[2] }
      }

      // sources of useful functions. we create this lazily as it can trigger a source decompression on this entire file
      var JSsource = null;
      function ensureJSsource() {
        if (!JSsource) {
          JSsource = {};
          for (var fun in JSfuncs) {
            if (JSfuncs.hasOwnProperty(fun)) {
              // Elements of toCsource are arrays of three items:
              // the code, and the return value
              JSsource[fun] = parseJSFunc(JSfuncs[fun]);
            }
          }
        }
      }

      cwrap = function cwrap(ident, returnType, argTypes) {
        argTypes = argTypes || [];
        var cfunc = getCFunc(ident);
        // When the function takes numbers and returns a number, we can just return
        // the original function
        var numericArgs = argTypes.every(function (type) { return type === 'number' });
        var numericRet = (returnType !== 'string');
        if (numericRet && numericArgs) {
          return cfunc;
        }
        // Creation of the arguments list (["$1","$2",...,"$nargs"])
        var argNames = argTypes.map(function (x, i) { return '$' + i });
        var funcstr = "(function(" + argNames.join(',') + ") {";
        var nargs = argTypes.length;
        if (!numericArgs) {
          // Generate the code needed to convert the arguments from javascript
          // values to pointers
          ensureJSsource();
          funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
          for (var i = 0; i < nargs; i++) {
            var arg = argNames[i], type = argTypes[i];
            if (type === 'number') continue;
            var convertCode = JSsource[type + 'ToC']; // [code, return]
            funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
            funcstr += convertCode.body + ';';
            funcstr += arg + '=(' + convertCode.returnValue + ');';
          }
        }

        // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
        var cfuncname = parseJSFunc(function () { return cfunc }).returnValue;
        // Call the function
        funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
        if (!numericRet) { // Return type can only by 'string' or 'number'
          // Convert the result to a string
          var strgfy = parseJSFunc(function () { return Pointer_stringify }).returnValue;
          funcstr += 'ret = ' + strgfy + '(ret);';
        }
        if (!numericArgs) {
          // If we had a stack, restore it
          ensureJSsource();
          funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
        }
        funcstr += 'return ret})';
        return eval(funcstr);
      };
    })();
    Module["ccall"] = ccall;
    Module["cwrap"] = cwrap;

    /** @type {function(number, number, string, boolean=)} */
    function setValue(ptr, value, type, noSafe) {
      type = type || 'i8';
      if (type.charAt(type.length - 1) === '*') type = 'i32'; // pointers are 32-bit
      switch (type) {
        case 'i1': HEAP8[((ptr) >> 0)] = value; break;
        case 'i8': HEAP8[((ptr) >> 0)] = value; break;
        case 'i16': HEAP16[((ptr) >> 1)] = value; break;
        case 'i32': HEAP32[((ptr) >> 2)] = value; break;
        case 'i64': (tempI64 = [value >>> 0, (tempDouble = value, (+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble) / 4294967296.0))), 4294967295.0)) | 0) >>> 0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296.0))))) >>> 0) : 0)], HEAP32[((ptr) >> 2)] = tempI64[0], HEAP32[(((ptr) + (4)) >> 2)] = tempI64[1]); break;
        case 'float': HEAPF32[((ptr) >> 2)] = value; break;
        case 'double': HEAPF64[((ptr) >> 3)] = value; break;
        default: abort('invalid type for setValue: ' + type);
      }
    }
    Module["setValue"] = setValue;

    /** @type {function(number, string, boolean=)} */
    function getValue(ptr, type, noSafe) {
      type = type || 'i8';
      if (type.charAt(type.length - 1) === '*') type = 'i32'; // pointers are 32-bit
      switch (type) {
        case 'i1': return HEAP8[((ptr) >> 0)];
        case 'i8': return HEAP8[((ptr) >> 0)];
        case 'i16': return HEAP16[((ptr) >> 1)];
        case 'i32': return HEAP32[((ptr) >> 2)];
        case 'i64': return HEAP32[((ptr) >> 2)];
        case 'float': return HEAPF32[((ptr) >> 2)];
        case 'double': return HEAPF64[((ptr) >> 3)];
        default: abort('invalid type for setValue: ' + type);
      }
      return null;
    }
    Module["getValue"] = getValue;

    var ALLOC_NORMAL = 0; // Tries to use _malloc()
    var ALLOC_STACK = 1; // Lives for the duration of the current function call
    var ALLOC_STATIC = 2; // Cannot be freed
    var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
    var ALLOC_NONE = 4; // Do not allocate
    Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
    Module["ALLOC_STACK"] = ALLOC_STACK;
    Module["ALLOC_STATIC"] = ALLOC_STATIC;
    Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
    Module["ALLOC_NONE"] = ALLOC_NONE;

    // allocate(): This is for internal use. You can use it yourself as well, but the interface
    //             is a little tricky (see docs right below). The reason is that it is optimized
    //             for multiple syntaxes to save space in generated code. So you should
    //             normally not use allocate(), and instead allocate memory using _malloc(),
    //             initialize it with setValue(), and so forth.
    // @slab: An array of data, or a number. If a number, then the size of the block to allocate,
    //        in *bytes* (note that this is sometimes confusing: the next parameter does not
    //        affect this!)
    // @types: Either an array of types, one for each byte (or 0 if no type at that position),
    //         or a single type which is used for the entire block. This only matters if there
    //         is initial data - if @slab is a number, then this does not matter at all and is
    //         ignored.
    // @allocator: How to allocate memory, see ALLOC_*
    /** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
    function allocate(slab, types, allocator, ptr) {
      var zeroinit, size;
      if (typeof slab === 'number') {
        zeroinit = true;
        size = slab;
      } else {
        zeroinit = false;
        size = slab.length;
      }

      var singleType = typeof types === 'string' ? types : null;

      var ret;
      if (allocator == ALLOC_NONE) {
        ret = ptr;
      } else {
        ret = [typeof _malloc === 'function' ? _malloc : Runtime.staticAlloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
      }

      if (zeroinit) {
        var ptr = ret, stop;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
          HEAP32[((ptr) >> 2)] = 0;
        }
        stop = ret + size;
        while (ptr < stop) {
          HEAP8[((ptr++) >> 0)] = 0;
        }
        return ret;
      }

      if (singleType === 'i8') {
        if (slab.subarray || slab.slice) {
          HEAPU8.set(/** @type {!Uint8Array} */(slab), ret);
        } else {
          HEAPU8.set(new Uint8Array(slab), ret);
        }
        return ret;
      }

      var i = 0, type, typeSize, previousType;
      while (i < size) {
        var curr = slab[i];

        if (typeof curr === 'function') {
          curr = Runtime.getFunctionIndex(curr);
        }

        type = singleType || types[i];
        if (type === 0) {
          i++;
          continue;
        }

        if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

        setValue(ret + i, curr, type);

        // no need to look up size unless type changes, so cache it
        if (previousType !== type) {
          typeSize = Runtime.getNativeTypeSize(type);
          previousType = type;
        }
        i += typeSize;
      }

      return ret;
    }
    Module["allocate"] = allocate;

    // Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
    function getMemory(size) {
      if (!staticSealed) return Runtime.staticAlloc(size);
      if (!runtimeInitialized) return Runtime.dynamicAlloc(size);
      return _malloc(size);
    }
    Module["getMemory"] = getMemory;

    /** @type {function(number, number=)} */
    function Pointer_stringify(ptr, length) {
      if (length === 0 || !ptr) return '';
      // TODO: use TextDecoder
      // Find the length, and check for UTF while doing so
      var hasUtf = 0;
      var t;
      var i = 0;
      while (1) {
        t = HEAPU8[(((ptr) + (i)) >> 0)];
        hasUtf |= t;
        if (t == 0 && !length) break;
        i++;
        if (length && i == length) break;
      }
      if (!length) length = i;

      var ret = '';

      if (hasUtf < 128) {
        var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
        var curr;
        while (length > 0) {
          curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
          ret = ret ? ret + curr : curr;
          ptr += MAX_CHUNK;
          length -= MAX_CHUNK;
        }
        return ret;
      }
      return Module['UTF8ToString'](ptr);
    }
    Module["Pointer_stringify"] = Pointer_stringify;

    // Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
    // a copy of that string as a Javascript String object.

    function AsciiToString(ptr) {
      var str = '';
      while (1) {
        var ch = HEAP8[((ptr++) >> 0)];
        if (!ch) return str;
        str += String.fromCharCode(ch);
      }
    }
    Module["AsciiToString"] = AsciiToString;

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

    function stringToAscii(str, outPtr) {
      return writeAsciiToMemory(str, outPtr, false);
    }
    Module["stringToAscii"] = stringToAscii;

    // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
    // a copy of that string as a Javascript String object.

    var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;
    function UTF8ArrayToString(u8Array, idx) {
      var endPtr = idx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
      // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
      while (u8Array[endPtr])++endPtr;

      if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
      } else {
        var u0, u1, u2, u3, u4, u5;

        var str = '';
        while (1) {
          // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
          u0 = u8Array[idx++];
          if (!u0) return str;
          if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
          u1 = u8Array[idx++] & 63;
          if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
          u2 = u8Array[idx++] & 63;
          if ((u0 & 0xF0) == 0xE0) {
            u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
          } else {
            u3 = u8Array[idx++] & 63;
            if ((u0 & 0xF8) == 0xF0) {
              u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
            } else {
              u4 = u8Array[idx++] & 63;
              if ((u0 & 0xFC) == 0xF8) {
                u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
              } else {
                u5 = u8Array[idx++] & 63;
                u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
              }
            }
          }
          if (u0 < 0x10000) {
            str += String.fromCharCode(u0);
          } else {
            var ch = u0 - 0x10000;
            str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
          }
        }
      }
    }
    Module["UTF8ArrayToString"] = UTF8ArrayToString;

    // Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
    // a copy of that string as a Javascript String object.

    function UTF8ToString(ptr) {
      return UTF8ArrayToString(HEAPU8, ptr);
    }
    Module["UTF8ToString"] = UTF8ToString;

    // Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
    // encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
    // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
    //   outIdx: The starting offset in the array to begin the copying.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
    //                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
      if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
        return 0;

      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          outU8Array[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          outU8Array[outIdx++] = 0xC0 | (u >> 6);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          outU8Array[outIdx++] = 0xE0 | (u >> 12);
          outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0x1FFFFF) {
          if (outIdx + 3 >= endIdx) break;
          outU8Array[outIdx++] = 0xF0 | (u >> 18);
          outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0x3FFFFFF) {
          if (outIdx + 4 >= endIdx) break;
          outU8Array[outIdx++] = 0xF8 | (u >> 24);
          outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 5 >= endIdx) break;
          outU8Array[outIdx++] = 0xFC | (u >> 30);
          outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
          outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
          outU8Array[outIdx++] = 0x80 | (u & 63);
        }
      }
      // Null-terminate the pointer to the buffer.
      outU8Array[outIdx] = 0;
      return outIdx - startIdx;
    }
    Module["stringToUTF8Array"] = stringToUTF8Array;

    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
    // Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF8(str, outPtr, maxBytesToWrite) {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    }
    Module["stringToUTF8"] = stringToUTF8;

    // Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

    function lengthBytesUTF8(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var u = str.charCodeAt(i); // possibly a lead surrogate
        if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
        if (u <= 0x7F) {
          ++len;
        } else if (u <= 0x7FF) {
          len += 2;
        } else if (u <= 0xFFFF) {
          len += 3;
        } else if (u <= 0x1FFFFF) {
          len += 4;
        } else if (u <= 0x3FFFFFF) {
          len += 5;
        } else {
          len += 6;
        }
      }
      return len;
    }
    Module["lengthBytesUTF8"] = lengthBytesUTF8;

    // Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
    // a copy of that string as a Javascript String object.

    var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;
    function UTF16ToString(ptr) {
      var endPtr = ptr;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
      // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
      var idx = endPtr >> 1;
      while (HEAP16[idx])++idx;
      endPtr = idx << 1;

      if (endPtr - ptr > 32 && UTF16Decoder) {
        return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
      } else {
        var i = 0;

        var str = '';
        while (1) {
          var codeUnit = HEAP16[(((ptr) + (i * 2)) >> 1)];
          if (codeUnit == 0) return str;
          ++i;
          // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
          str += String.fromCharCode(codeUnit);
        }
      }
    }


    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
    // Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   outPtr: Byte address in Emscripten HEAP where to write the string to.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
    //                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF16(str, outPtr, maxBytesToWrite) {
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
      }
      if (maxBytesToWrite < 2) return 0;
      maxBytesToWrite -= 2; // Null terminator.
      var startPtr = outPtr;
      var numCharsToWrite = (maxBytesToWrite < str.length * 2) ? (maxBytesToWrite / 2) : str.length;
      for (var i = 0; i < numCharsToWrite; ++i) {
        // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        HEAP16[((outPtr) >> 1)] = codeUnit;
        outPtr += 2;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP16[((outPtr) >> 1)] = 0;
      return outPtr - startPtr;
    }


    // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

    function lengthBytesUTF16(str) {
      return str.length * 2;
    }


    function UTF32ToString(ptr) {
      var i = 0;

      var str = '';
      while (1) {
        var utf32 = HEAP32[(((ptr) + (i * 4)) >> 2)];
        if (utf32 == 0)
          return str;
        ++i;
        // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        if (utf32 >= 0x10000) {
          var ch = utf32 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        } else {
          str += String.fromCharCode(utf32);
        }
      }
    }


    // Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
    // null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
    // Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
    // Parameters:
    //   str: the Javascript string to copy.
    //   outPtr: Byte address in Emscripten HEAP where to write the string to.
    //   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
    //                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
    //                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
    // Returns the number of bytes written, EXCLUDING the null terminator.

    function stringToUTF32(str, outPtr, maxBytesToWrite) {
      // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
      if (maxBytesToWrite === undefined) {
        maxBytesToWrite = 0x7FFFFFFF;
      }
      if (maxBytesToWrite < 4) return 0;
      var startPtr = outPtr;
      var endPtr = startPtr + maxBytesToWrite - 4;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
          var trailSurrogate = str.charCodeAt(++i);
          codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
        }
        HEAP32[((outPtr) >> 2)] = codeUnit;
        outPtr += 4;
        if (outPtr + 4 > endPtr) break;
      }
      // Null-terminate the pointer to the HEAP.
      HEAP32[((outPtr) >> 2)] = 0;
      return outPtr - startPtr;
    }


    // Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

    function lengthBytesUTF32(str) {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var codeUnit = str.charCodeAt(i);
        if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF)++i; // possibly a lead surrogate, so skip over the tail surrogate.
        len += 4;
      }

      return len;
    }


    function demangle(func) {
      var __cxa_demangle_func = Module['___cxa_demangle'] || Module['__cxa_demangle'];
      if (__cxa_demangle_func) {
        try {
          var s =
            func.substr(1);
          var len = lengthBytesUTF8(s) + 1;
          var buf = _malloc(len);
          stringToUTF8(s, buf, len);
          var status = _malloc(4);
          var ret = __cxa_demangle_func(buf, 0, 0, status);
          if (getValue(status, 'i32') === 0 && ret) {
            return Pointer_stringify(ret);
          }
          // otherwise, libcxxabi failed
        } catch (e) {
          // ignore problems here
        } finally {
          if (buf) _free(buf);
          if (status) _free(status);
          if (ret) _free(ret);
        }
        // failure when using libcxxabi, don't demangle
        return func;
      }
      Runtime.warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
      return func;
    }

    function demangleAll(text) {
      var regex =
        /__Z[\w\d_]+/g;
      return text.replace(regex,
        function (x) {
          var y = demangle(x);
          return x === y ? x : (x + ' [' + y + ']');
        });
    }

    function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error(0);
        } catch (e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

    function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }
    Module["stackTrace"] = stackTrace;

    // Memory management

    var PAGE_SIZE = 16384;
    var WASM_PAGE_SIZE = 65536;
    var ASMJS_PAGE_SIZE = 16777216;
    var MIN_TOTAL_MEMORY = 16777216;

    function alignUp(x, multiple) {
      if (x % multiple > 0) {
        x += multiple - (x % multiple);
      }
      return x;
    }

    var HEAP,
      /** @type {ArrayBuffer} */
      buffer,
      /** @type {Int8Array} */
      HEAP8,
      /** @type {Uint8Array} */
      HEAPU8,
      /** @type {Int16Array} */
      HEAP16,
      /** @type {Uint16Array} */
      HEAPU16,
      /** @type {Int32Array} */
      HEAP32,
      /** @type {Uint32Array} */
      HEAPU32,
      /** @type {Float32Array} */
      HEAPF32,
      /** @type {Float64Array} */
      HEAPF64;

    function updateGlobalBuffer(buf) {
      Module['buffer'] = buffer = buf;
    }

    function updateGlobalBufferViews() {
      Module['HEAP8'] = HEAP8 = new Int8Array(buffer);
      Module['HEAP16'] = HEAP16 = new Int16Array(buffer);
      Module['HEAP32'] = HEAP32 = new Int32Array(buffer);
      Module['HEAPU8'] = HEAPU8 = new Uint8Array(buffer);
      Module['HEAPU16'] = HEAPU16 = new Uint16Array(buffer);
      Module['HEAPU32'] = HEAPU32 = new Uint32Array(buffer);
      Module['HEAPF32'] = HEAPF32 = new Float32Array(buffer);
      Module['HEAPF64'] = HEAPF64 = new Float64Array(buffer);
    }

    var STATIC_BASE, STATICTOP, staticSealed; // static area
    var STACK_BASE, STACKTOP, STACK_MAX; // stack area
    var DYNAMIC_BASE, DYNAMICTOP_PTR; // dynamic area handled by sbrk

    STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
    staticSealed = false;



    function abortOnCannotGrowMemory() {
      abort('Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
    }

    if (!Module['reallocBuffer']) Module['reallocBuffer'] = function (size) {
      var ret;
      try {
        if (ArrayBuffer.transfer) {
          ret = ArrayBuffer.transfer(buffer, size);
        } else {
          var oldHEAP8 = HEAP8;
          ret = new ArrayBuffer(size);
          var temp = new Int8Array(ret);
          temp.set(oldHEAP8);
        }
      } catch (e) {
        return false;
      }
      var success = _emscripten_replace_memory(ret);
      if (!success) return false;
      return ret;
    };

    function enlargeMemory() {
      // TOTAL_MEMORY is the current size of the actual array, and DYNAMICTOP is the new top.


      var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
      var LIMIT = 2147483648 - PAGE_MULTIPLE; // We can do one page short of 2GB as theoretical maximum.

      if (HEAP32[DYNAMICTOP_PTR >> 2] > LIMIT) {
        return false;
      }

      var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
      TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY); // So the loop below will not be infinite, and minimum asm.js memory size is 16MB.

      while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR >> 2]) { // Keep incrementing the heap size as long as it's less than what is requested.
        if (TOTAL_MEMORY <= 536870912) {
          TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE); // Simple heuristic: double until 1GB...
        } else {
          TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT); // ..., but after that, add smaller increments towards 2GB, which we cannot reach
        }
      }


      var replacement = Module['reallocBuffer'](TOTAL_MEMORY);
      if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
        // restore the state to before this call, we failed
        TOTAL_MEMORY = OLD_TOTAL_MEMORY;
        return false;
      }

      // everything worked

      updateGlobalBuffer(replacement);
      updateGlobalBufferViews();




      return true;
    }

    var byteLength;
    try {
      byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get);
      byteLength(new ArrayBuffer(4)); // can fail on older ie
    } catch (e) { // can fail on older node/v8
      byteLength = function (buffer) { return buffer.byteLength; };
    }

    var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
    var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
    if (TOTAL_MEMORY < TOTAL_STACK) Module.printErr('TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

    // Initialize the runtime's memory



    // Use a provided buffer, if there is one, or else allocate a new one
    if (Module['buffer']) {
      buffer = Module['buffer'];
    } else {
      // Use a WebAssembly memory where available
      if (typeof WebAssembly === 'object' && typeof WebAssembly.Memory === 'function') {
        Module['wasmMemory'] = new WebAssembly.Memory({ 'initial': TOTAL_MEMORY / WASM_PAGE_SIZE });
        buffer = Module['wasmMemory'].buffer;
      } else {
        buffer = new ArrayBuffer(TOTAL_MEMORY);
      }
    }
    updateGlobalBufferViews();


    function getTotalMemory() {
      return TOTAL_MEMORY;
    }

    // Endianness check (note: assumes compiler arch was little-endian)
    HEAP32[0] = 0x63736d65; /* 'emsc' */
    HEAP16[1] = 0x6373;
    if (HEAPU8[2] !== 0x73 || HEAPU8[3] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';

    Module['HEAP'] = HEAP;
    Module['buffer'] = buffer;
    Module['HEAP8'] = HEAP8;
    Module['HEAP16'] = HEAP16;
    Module['HEAP32'] = HEAP32;
    Module['HEAPU8'] = HEAPU8;
    Module['HEAPU16'] = HEAPU16;
    Module['HEAPU32'] = HEAPU32;
    Module['HEAPF32'] = HEAPF32;
    Module['HEAPF64'] = HEAPF64;

    function callRuntimeCallbacks(callbacks) {
      while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == 'function') {
          callback();
          continue;
        }
        var func = callback.func;
        if (typeof func === 'number') {
          if (callback.arg === undefined) {
            Module['dynCall_v'](func);
          } else {
            Module['dynCall_vi'](func, callback.arg);
          }
        } else {
          func(callback.arg === undefined ? null : callback.arg);
        }
      }
    }

    var __ATPRERUN__ = []; // functions called before the runtime is initialized
    var __ATINIT__ = []; // functions called during startup
    var __ATMAIN__ = []; // functions called when main() is to be run
    var __ATEXIT__ = []; // functions called during shutdown
    var __ATPOSTRUN__ = []; // functions called after the runtime has exited

    var runtimeInitialized = false;
    var runtimeExited = false;


    function preRun() {
      // compatibility - merge in anything from Module['preRun'] at this time
      if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift());
        }
      }
      callRuntimeCallbacks(__ATPRERUN__);
    }

    function ensureInitRuntime() {
      if (runtimeInitialized) return;
      runtimeInitialized = true;
      callRuntimeCallbacks(__ATINIT__);
    }

    function preMain() {
      callRuntimeCallbacks(__ATMAIN__);
    }

    function exitRuntime() {
      callRuntimeCallbacks(__ATEXIT__);
      runtimeExited = true;
    }

    function postRun() {
      // compatibility - merge in anything from Module['postRun'] at this time
      if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift());
        }
      }
      callRuntimeCallbacks(__ATPOSTRUN__);
    }

    function addOnPreRun(cb) {
      __ATPRERUN__.unshift(cb);
    }
    Module["addOnPreRun"] = addOnPreRun;

    function addOnInit(cb) {
      __ATINIT__.unshift(cb);
    }
    Module["addOnInit"] = addOnInit;

    function addOnPreMain(cb) {
      __ATMAIN__.unshift(cb);
    }
    Module["addOnPreMain"] = addOnPreMain;

    function addOnExit(cb) {
      __ATEXIT__.unshift(cb);
    }
    Module["addOnExit"] = addOnExit;

    function addOnPostRun(cb) {
      __ATPOSTRUN__.unshift(cb);
    }
    Module["addOnPostRun"] = addOnPostRun;

    // Tools

    /** @type {function(string, boolean=, number=)} */
    function intArrayFromString(stringy, dontAddNull, length) {
      var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    }
    Module["intArrayFromString"] = intArrayFromString;

    function intArrayToString(array) {
      var ret = [];
      for (var i = 0; i < array.length; i++) {
        var chr = array[i];
        if (chr > 0xFF) {
          chr &= 0xFF;
        }
        ret.push(String.fromCharCode(chr));
      }
      return ret.join('');
    }
    Module["intArrayToString"] = intArrayToString;

    // Deprecated: This function should not be called because it is unsafe and does not provide
    // a maximum length limit of how many bytes it is allowed to write. Prefer calling the
    // function stringToUTF8Array() instead, which takes in a maximum length that can be used
    // to be secure from out of bounds writes.
    /** @deprecated */
    function writeStringToMemory(string, buffer, dontAddNull) {
      Runtime.warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

      var /** @type {number} */ lastChar, /** @type {number} */ end;
      if (dontAddNull) {
        // stringToUTF8Array always appends null. If we don't want to do that, remember the
        // character that existed at the location where the null will be placed, and restore
        // that after the write (below).
        end = buffer + lengthBytesUTF8(string);
        lastChar = HEAP8[end];
      }
      stringToUTF8(string, buffer, Infinity);
      if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
    }
    Module["writeStringToMemory"] = writeStringToMemory;

    function writeArrayToMemory(array, buffer) {
      HEAP8.set(array, buffer);
    }
    Module["writeArrayToMemory"] = writeArrayToMemory;

    function writeAsciiToMemory(str, buffer, dontAddNull) {
      for (var i = 0; i < str.length; ++i) {
        HEAP8[((buffer++) >> 0)] = str.charCodeAt(i);
      }
      // Null-terminate the pointer to the HEAP.
      if (!dontAddNull) HEAP8[((buffer) >> 0)] = 0;
    }
    Module["writeAsciiToMemory"] = writeAsciiToMemory;

    function unSign(value, bits, ignore) {
      if (value >= 0) {
        return value;
      }
      return bits <= 32 ? 2 * Math.abs(1 << (bits - 1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
        : Math.pow(2, bits) + value;
    }
    function reSign(value, bits, ignore) {
      if (value <= 0) {
        return value;
      }
      var half = bits <= 32 ? Math.abs(1 << (bits - 1)) // abs is needed if bits == 32
        : Math.pow(2, bits - 1);
      if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
        // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
        // TODO: In i64 mode 1, resign the two parts separately and safely
        value = -2 * half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
      }
      return value;
    }

    // check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
    if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
      var ah = a >>> 16;
      var al = a & 0xffff;
      var bh = b >>> 16;
      var bl = b & 0xffff;
      return (al * bl + ((ah * bl + al * bh) << 16)) | 0;
    };
    Math.imul = Math['imul'];

    if (!Math['fround']) {
      var froundBuffer = new Float32Array(1);
      Math['fround'] = function (x) { froundBuffer[0] = x; return froundBuffer[0] };
    }
    Math.fround = Math['fround'];

    if (!Math['clz32']) Math['clz32'] = function (x) {
      x = x >>> 0;
      for (var i = 0; i < 32; i++) {
        if (x & (1 << (31 - i))) return i;
      }
      return 32;
    };
    Math.clz32 = Math['clz32']

    if (!Math['trunc']) Math['trunc'] = function (x) {
      return x < 0 ? Math.ceil(x) : Math.floor(x);
    };
    Math.trunc = Math['trunc'];

    var Math_abs = Math.abs;
    var Math_cos = Math.cos;
    var Math_sin = Math.sin;
    var Math_tan = Math.tan;
    var Math_acos = Math.acos;
    var Math_asin = Math.asin;
    var Math_atan = Math.atan;
    var Math_atan2 = Math.atan2;
    var Math_exp = Math.exp;
    var Math_log = Math.log;
    var Math_sqrt = Math.sqrt;
    var Math_ceil = Math.ceil;
    var Math_floor = Math.floor;
    var Math_pow = Math.pow;
    var Math_imul = Math.imul;
    var Math_fround = Math.fround;
    var Math_round = Math.round;
    var Math_min = Math.min;
    var Math_clz32 = Math.clz32;
    var Math_trunc = Math.trunc;

    // A counter of dependencies for calling run(). If we need to
    // do asynchronous work before running, increment this and
    // decrement it. Incrementing must happen in a place like
    // PRE_RUN_ADDITIONS (used by emcc to add file preloading).
    // Note that you can add dependencies in preRun, even though
    // it happens right before run - run will be postponed until
    // the dependencies are met.
    var runDependencies = 0;
    var runDependencyWatcher = null;
    var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled

    function getUniqueRunDependency(id) {
      return id;
    }

    function addRunDependency(id) {
      runDependencies++;
      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
    }
    Module["addRunDependency"] = addRunDependency;

    function removeRunDependency(id) {
      runDependencies--;
      if (Module['monitorRunDependencies']) {
        Module['monitorRunDependencies'](runDependencies);
      }
      if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
        }
        if (dependenciesFulfilled) {
          var callback = dependenciesFulfilled;
          dependenciesFulfilled = null;
          callback(); // can add another dependenciesFulfilled
        }
      }
    }
    Module["removeRunDependency"] = removeRunDependency;

    Module["preloadedImages"] = {}; // maps url to image data
    Module["preloadedAudios"] = {}; // maps url to audio data



    var memoryInitializer = null;





    function integrateWasmJS(Module) {
      // wasm.js has several methods for creating the compiled code module here:
      //  * 'native-wasm' : use native WebAssembly support in the browser
      //  * 'interpret-s-expr': load s-expression code from a .wast and interpret
      //  * 'interpret-binary': load binary wasm and interpret
      //  * 'interpret-asm2wasm': load asm.js code, translate to wasm, and interpret
      //  * 'asmjs': no wasm, just load the asm.js code and use that (good for testing)
      // The method can be set at compile time (BINARYEN_METHOD), or runtime by setting Module['wasmJSMethod'].
      // The method can be a comma-separated list, in which case, we will try the
      // options one by one. Some of them can fail gracefully, and then we can try
      // the next.

      // inputs

      var method = Module['wasmJSMethod'] || 'native-wasm';
      Module['wasmJSMethod'] = method;

      var wasmTextFile = Module['wasmTextFile'] || 'shaderc.wast';
      var wasmBinaryFile = Module['wasmBinaryFile'] || 'shaderc.wasm';
      var asmjsCodeFile = Module['asmjsCodeFile'] || 'shaderc.temp.asm.js';

      if (typeof Module['locateFile'] === 'function') {
        wasmTextFile = Module['locateFile'](wasmTextFile);
        wasmBinaryFile = Module['locateFile'](wasmBinaryFile);
        asmjsCodeFile = Module['locateFile'](asmjsCodeFile);
      }

      // utilities

      var wasmPageSize = 64 * 1024;

      var asm2wasmImports = { // special asm2wasm imports
        "f64-rem": function (x, y) {
          return x % y;
        },
        "f64-to-int": function (x) {
          return x | 0;
        },
        "i32s-div": function (x, y) {
          return ((x | 0) / (y | 0)) | 0;
        },
        "i32u-div": function (x, y) {
          return ((x >>> 0) / (y >>> 0)) >>> 0;
        },
        "i32s-rem": function (x, y) {
          return ((x | 0) % (y | 0)) | 0;
        },
        "i32u-rem": function (x, y) {
          return ((x >>> 0) % (y >>> 0)) >>> 0;
        },
        "debugger": function () {
          debugger;
        },
      };

      var info = {
        'global': null,
        'env': null,
        'asm2wasm': asm2wasmImports,
        'parent': Module // Module inside wasm-js.cpp refers to wasm-js.cpp; this allows access to the outside program.
      };

      var exports = null;

      function lookupImport(mod, base) {
        var lookup = info;
        if (mod.indexOf('.') < 0) {
          lookup = (lookup || {})[mod];
        } else {
          var parts = mod.split('.');
          lookup = (lookup || {})[parts[0]];
          lookup = (lookup || {})[parts[1]];
        }
        if (base) {
          lookup = (lookup || {})[base];
        }
        if (lookup === undefined) {
          abort('bad lookupImport to (' + mod + ').' + base);
        }
        return lookup;
      }

      function mergeMemory(newBuffer) {
        // The wasm instance creates its memory. But static init code might have written to
        // buffer already, including the mem init file, and we must copy it over in a proper merge.
        // TODO: avoid this copy, by avoiding such static init writes
        // TODO: in shorter term, just copy up to the last static init write
        var oldBuffer = Module['buffer'];
        if (newBuffer.byteLength < oldBuffer.byteLength) {
          Module['printErr']('the new buffer in mergeMemory is smaller than the previous one. in native wasm, we should grow memory here');
        }
        var oldView = new Int8Array(oldBuffer);
        var newView = new Int8Array(newBuffer);

        // If we have a mem init file, do not trample it
        if (!memoryInitializer) {
          oldView.set(newView.subarray(Module['STATIC_BASE'], Module['STATIC_BASE'] + Module['STATIC_BUMP']), Module['STATIC_BASE']);
        }

        newView.set(oldView);
        updateGlobalBuffer(newBuffer);
        updateGlobalBufferViews();
      }

      var WasmTypes = {
        none: 0,
        i32: 1,
        i64: 2,
        f32: 3,
        f64: 4
      };

      function fixImports(imports) {
        if (!0) return imports;
        var ret = {};
        for (var i in imports) {
          var fixed = i;
          if (fixed[0] == '_') fixed = fixed.substr(1);
          ret[fixed] = imports[i];
        }
        return ret;
      }

      function getBinary() {
        try {
          var binary;
          if (Module['wasmBinary']) {
            binary = Module['wasmBinary'];
            binary = new Uint8Array(binary);
          } else if (Module['readBinary']) {
            binary = Module['readBinary'](wasmBinaryFile);
          } else {
            throw "on the web, we need the wasm binary to be preloaded and set on Module['wasmBinary']. emcc.py will do that for you when generating HTML (but not JS)";
          }
          return binary;
        }
        catch (err) {
          abort(err);
        }
      }

      function getBinaryPromise() {
        // if we don't have the binary yet, and have the Fetch api, use that
        if (!Module['wasmBinary'] && typeof fetch === 'function') {
          return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
            if (!response['ok']) {
              throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
            }
            return response['arrayBuffer']();
          });
        }
        // Otherwise, getBinary should be able to get it synchronously
        return new Promise(function (resolve, reject) {
          resolve(getBinary());
        });
      }

      // do-method functions

      function doJustAsm(global, env, providedBuffer) {
        // if no Module.asm, or it's the method handler helper (see below), then apply
        // the asmjs
        if (typeof Module['asm'] !== 'function' || Module['asm'] === methodHandler) {
          if (!Module['asmPreload']) {
            // you can load the .asm.js file before this, to avoid this sync xhr and eval
            eval(Module['read'](asmjsCodeFile)); // set Module.asm
          } else {
            Module['asm'] = Module['asmPreload'];
          }
        }
        if (typeof Module['asm'] !== 'function') {
          Module['printErr']('asm evalling did not set the module properly');
          return false;
        }
        return Module['asm'](global, env, providedBuffer);
      }

      function doNativeWasm(global, env, providedBuffer) {
        if (typeof WebAssembly !== 'object') {
          Module['printErr']('no native wasm support detected');
          return false;
        }
        // prepare memory import
        if (!(Module['wasmMemory'] instanceof WebAssembly.Memory)) {
          Module['printErr']('no native wasm Memory in use');
          return false;
        }
        env['memory'] = Module['wasmMemory'];
        // Load the wasm module and create an instance of using native support in the JS engine.
        info['global'] = {
          'NaN': NaN,
          'Infinity': Infinity
        };
        info['global.Math'] = global.Math;
        info['env'] = env;
        // handle a generated wasm instance, receiving its exports and
        // performing other necessary setup
        function receiveInstance(instance) {
          exports = instance.exports;
          if (exports.memory) mergeMemory(exports.memory);
          Module['asm'] = exports;
          Module["usingWasm"] = true;
          removeRunDependency('wasm-instantiate');
        }

        addRunDependency('wasm-instantiate'); // we can't run yet

        // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
        // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
        // to any other async startup actions they are performing.
        if (Module['instantiateWasm']) {
          try {
            return Module['instantiateWasm'](info, receiveInstance);
          } catch (e) {
            Module['printErr']('Module.instantiateWasm callback failed with error: ' + e);
            return false;
          }
        }

        getBinaryPromise().then(function (binary) {
          return WebAssembly.instantiate(binary, info)
        }).then(function (output) {
          // receiveInstance() will swap in the exports (to Module.asm) so they can be called
          receiveInstance(output['instance']);
        }).catch(function (reason) {
          Module['printErr']('failed to asynchronously prepare wasm: ' + reason);
          abort(reason);
        });
        return {}; // no exports yet; we'll fill them in later
      }

      function doWasmPolyfill(global, env, providedBuffer, method) {
        if (typeof WasmJS !== 'function') {
          Module['printErr']('WasmJS not detected - polyfill not bundled?');
          return false;
        }

        // Use wasm.js to polyfill and execute code in a wasm interpreter.
        var wasmJS = WasmJS({});

        // XXX don't be confused. Module here is in the outside program. wasmJS is the inner wasm-js.cpp.
        wasmJS['outside'] = Module; // Inside wasm-js.cpp, Module['outside'] reaches the outside module.

        // Information for the instance of the module.
        wasmJS['info'] = info;

        wasmJS['lookupImport'] = lookupImport;

        assert(providedBuffer === Module['buffer']); // we should not even need to pass it as a 3rd arg for wasm, but that's the asm.js way.

        info.global = global;
        info.env = env;

        // polyfill interpreter expects an ArrayBuffer
        assert(providedBuffer === Module['buffer']);
        env['memory'] = providedBuffer;
        assert(env['memory'] instanceof ArrayBuffer);

        wasmJS['providedTotalMemory'] = Module['buffer'].byteLength;

        // Prepare to generate wasm, using either asm2wasm or s-exprs
        var code;
        if (method === 'interpret-binary') {
          code = getBinary();
        } else {
          code = Module['read'](method == 'interpret-asm2wasm' ? asmjsCodeFile : wasmTextFile);
        }
        var temp;
        if (method == 'interpret-asm2wasm') {
          temp = wasmJS['_malloc'](code.length + 1);
          wasmJS['writeAsciiToMemory'](code, temp);
          wasmJS['_load_asm2wasm'](temp);
        } else if (method === 'interpret-s-expr') {
          temp = wasmJS['_malloc'](code.length + 1);
          wasmJS['writeAsciiToMemory'](code, temp);
          wasmJS['_load_s_expr2wasm'](temp);
        } else if (method === 'interpret-binary') {
          temp = wasmJS['_malloc'](code.length);
          wasmJS['HEAPU8'].set(code, temp);
          wasmJS['_load_binary2wasm'](temp, code.length);
        } else {
          throw 'what? ' + method;
        }
        wasmJS['_free'](temp);

        wasmJS['_instantiate'](temp);

        if (Module['newBuffer']) {
          mergeMemory(Module['newBuffer']);
          Module['newBuffer'] = null;
        }

        exports = wasmJS['asmExports'];

        return exports;
      }

      // We may have a preloaded value in Module.asm, save it
      Module['asmPreload'] = Module['asm'];

      // Memory growth integration code

      var asmjsReallocBuffer = Module['reallocBuffer'];

      var wasmReallocBuffer = function (size) {
        var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE; // In wasm, heap size must be a multiple of 64KB. In asm.js, they need to be multiples of 16MB.
        size = alignUp(size, PAGE_MULTIPLE); // round up to wasm page size
        var old = Module['buffer'];
        var oldSize = old.byteLength;
        if (Module["usingWasm"]) {
          // native wasm support
          try {
            var result = Module['wasmMemory'].grow((size - oldSize) / wasmPageSize); // .grow() takes a delta compared to the previous size
            if (result !== (-1 | 0)) {
              // success in native wasm memory growth, get the buffer from the memory
              return Module['buffer'] = Module['wasmMemory'].buffer;
            } else {
              return null;
            }
          } catch (e) {
            return null;
          }
        } else {
          // wasm interpreter support
          exports['__growWasmMemory']((size - oldSize) / wasmPageSize); // tiny wasm method that just does grow_memory
          // in interpreter, we replace Module.buffer if we allocate
          return Module['buffer'] !== old ? Module['buffer'] : null; // if it was reallocated, it changed
        }
      };

      Module['reallocBuffer'] = function (size) {
        if (finalMethod === 'asmjs') {
          return asmjsReallocBuffer(size);
        } else {
          return wasmReallocBuffer(size);
        }
      };

      // we may try more than one; this is the final one, that worked and we are using
      var finalMethod = '';

      // Provide an "asm.js function" for the application, called to "link" the asm.js module. We instantiate
      // the wasm module at that time, and it receives imports and provides exports and so forth, the app
      // doesn't need to care that it is wasm or olyfilled wasm or asm.js.

      Module['asm'] = function (global, env, providedBuffer) {
        global = fixImports(global);
        env = fixImports(env);

        // import table
        if (!env['table']) {
          var TABLE_SIZE = Module['wasmTableSize'];
          if (TABLE_SIZE === undefined) TABLE_SIZE = 1024; // works in binaryen interpreter at least
          var MAX_TABLE_SIZE = Module['wasmMaxTableSize'];
          if (typeof WebAssembly === 'object' && typeof WebAssembly.Table === 'function') {
            if (MAX_TABLE_SIZE !== undefined) {
              env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, 'maximum': MAX_TABLE_SIZE, 'element': 'anyfunc' });
            } else {
              env['table'] = new WebAssembly.Table({ 'initial': TABLE_SIZE, element: 'anyfunc' });
            }
          } else {
            env['table'] = new Array(TABLE_SIZE); // works in binaryen interpreter at least
          }
          Module['wasmTable'] = env['table'];
        }

        if (!env['memoryBase']) {
          env['memoryBase'] = Module['STATIC_BASE']; // tell the memory segments where to place themselves
        }
        if (!env['tableBase']) {
          env['tableBase'] = 0; // table starts at 0 by default, in dynamic linking this will change
        }

        // try the methods. each should return the exports if it succeeded

        var exports;
        exports = doNativeWasm(global, env, providedBuffer);


        return exports;
      };

      var methodHandler = Module['asm']; // note our method handler, as we may modify Module['asm'] later
    }

    integrateWasmJS(Module);

    // === Body ===

    var ASM_CONSTS = [];




    STATIC_BASE = Runtime.GLOBAL_BASE;

    STATICTOP = STATIC_BASE + 4533776;
/* global initializers */  __ATINIT__.push({ func: function () { __GLOBAL__I_000101() } }, { func: function () { __GLOBAL__sub_I_shaderc_js_cpp() } }, { func: function () { __GLOBAL__sub_I_SPVRemapper_cpp() } }, { func: function () { __GLOBAL__sub_I_doc_cpp() } }, { func: function () { __GLOBAL__sub_I_bind_cpp() } }, { func: function () { __GLOBAL__sub_I_iostream_cpp() } });


    memoryInitializer = Module["wasmJSMethod"].indexOf("asmjs") >= 0 || Module["wasmJSMethod"].indexOf("interpret-asm2wasm") >= 0 ? "shaderc.js.mem" : null;




    var STATIC_BUMP = 4533776;
    Module["STATIC_BASE"] = STATIC_BASE;
    Module["STATIC_BUMP"] = STATIC_BUMP;

    /* no memory initializer */
    var tempDoublePtr = STATICTOP; STATICTOP += 16;

    function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

      HEAP8[tempDoublePtr] = HEAP8[ptr];

      HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];

      HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];

      HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];

    }

    function copyTempDouble(ptr) {

      HEAP8[tempDoublePtr] = HEAP8[ptr];

      HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];

      HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];

      HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];

      HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];

      HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];

      HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];

      HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];

    }

    // {{PRE_LIBRARY}}



    function _atexit(func, arg) {
      __ATEXIT__.unshift({ func: func, arg: arg });
    } function ___cxa_atexit() {
      return _atexit.apply(null, arguments)
    }


    function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }



    var EXCEPTIONS = {
      last: 0, caught: [], infos: {}, deAdjust: function (adjusted) {
        if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
        for (var ptr in EXCEPTIONS.infos) {
          var info = EXCEPTIONS.infos[ptr];
          if (info.adjusted === adjusted) {
            return ptr;
          }
        }
        return adjusted;
      }, addRef: function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount++;
      }, decRef: function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        assert(info.refcount > 0);
        info.refcount--;
        // A rethrown exception can reach refcount 0; it must not be discarded
        // Its next handler will clear the rethrown flag and addRef it, prior to
        // final decRef and destruction here
        if (info.refcount === 0 && !info.rethrown) {
          if (info.destructor) {
            Module['dynCall_vi'](info.destructor, ptr);
          }
          delete EXCEPTIONS.infos[ptr];
          ___cxa_free_exception(ptr);
        }
      }, clearRef: function (ptr) {
        if (!ptr) return;
        var info = EXCEPTIONS.infos[ptr];
        info.refcount = 0;
      }
    };
    function ___resumeException(ptr) {
      if (!EXCEPTIONS.last) { EXCEPTIONS.last = ptr; }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    } function ___cxa_find_matching_catch() {
      var thrown = EXCEPTIONS.last;
      if (!thrown) {
        // just pass through the null ptr
        return ((Runtime.setTempRet0(0), 0) | 0);
      }
      var info = EXCEPTIONS.infos[thrown];
      var throwntype = info.type;
      if (!throwntype) {
        // just pass through the thrown ptr
        return ((Runtime.setTempRet0(0), thrown) | 0);
      }
      var typeArray = Array.prototype.slice.call(arguments);

      var pointer = Module['___cxa_is_pointer_type'](throwntype);
      // can_catch receives a **, add indirection
      if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
      HEAP32[((___cxa_find_matching_catch.buffer) >> 2)] = thrown;
      thrown = ___cxa_find_matching_catch.buffer;
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && Module['___cxa_can_catch'](typeArray[i], throwntype, thrown)) {
          thrown = HEAP32[((thrown) >> 2)]; // undo indirection
          info.adjusted = thrown;
          return ((Runtime.setTempRet0(typeArray[i]), thrown) | 0);
        }
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      thrown = HEAP32[((thrown) >> 2)]; // undo indirection
      return ((Runtime.setTempRet0(throwntype), thrown) | 0);
    } function ___cxa_throw(ptr, type, destructor) {
      EXCEPTIONS.infos[ptr] = {
        ptr: ptr,
        adjusted: ptr,
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
      };
      EXCEPTIONS.last = ptr;
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";
    }


    function getShiftFromSize(size) {
      switch (size) {
        case 1: return 0;
        case 2: return 1;
        case 4: return 2;
        case 8: return 3;
        default:
          throw new TypeError('Unknown type size: ' + size);
      }
    }



    function embind_init_charCodes() {
      var codes = new Array(256);
      for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i);
      }
      embind_charCodes = codes;
    } var embind_charCodes = undefined; function readLatin1String(ptr) {
      var ret = "";
      var c = ptr;
      while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]];
      }
      return ret;
    }


    var awaitingDependencies = {};

    var registeredTypes = {};

    var typeDependencies = {};






    var char_0 = 48;

    var char_9 = 57; function makeLegalFunctionName(name) {
      if (undefined === name) {
        return '_unknown';
      }
      name = name.replace(/[^a-zA-Z0-9_]/g, '$');
      var f = name.charCodeAt(0);
      if (f >= char_0 && f <= char_9) {
        return '_' + name;
      } else {
        return name;
      }
    } function createNamedFunction(name, body) {
      name = makeLegalFunctionName(name);
      /*jshint evil:true*/
      return new Function(
        "body",
        "return function " + name + "() {\n" +
        "    \"use strict\";" +
        "    return body.apply(this, arguments);\n" +
        "};\n"
      )(body);
    } function extendError(baseErrorType, errorName) {
      var errorClass = createNamedFunction(errorName, function (message) {
        this.name = errorName;
        this.message = message;

        var stack = (new Error(message)).stack;
        if (stack !== undefined) {
          this.stack = this.toString() + '\n' +
            stack.replace(/^Error(:[^\n]*)?\n/, '');
        }
      });
      errorClass.prototype = Object.create(baseErrorType.prototype);
      errorClass.prototype.constructor = errorClass;
      errorClass.prototype.toString = function () {
        if (this.message === undefined) {
          return this.name;
        } else {
          return this.name + ': ' + this.message;
        }
      };

      return errorClass;
    } var BindingError = undefined; function throwBindingError(message) {
      throw new BindingError(message);
    }



    var InternalError = undefined; function throwInternalError(message) {
      throw new InternalError(message);
    } function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
      myTypes.forEach(function (type) {
        typeDependencies[type] = dependentTypes;
      });

      function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
          throwInternalError('Mismatched type converter count');
        }
        for (var i = 0; i < myTypes.length; ++i) {
          registerType(myTypes[i], myTypeConverters[i]);
        }
      }

      var typeConverters = new Array(dependentTypes.length);
      var unregisteredTypes = [];
      var registered = 0;
      dependentTypes.forEach(function (dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
          typeConverters[i] = registeredTypes[dt];
        } else {
          unregisteredTypes.push(dt);
          if (!awaitingDependencies.hasOwnProperty(dt)) {
            awaitingDependencies[dt] = [];
          }
          awaitingDependencies[dt].push(function () {
            typeConverters[i] = registeredTypes[dt];
            ++registered;
            if (registered === unregisteredTypes.length) {
              onComplete(typeConverters);
            }
          });
        }
      });
      if (0 === unregisteredTypes.length) {
        onComplete(typeConverters);
      }
    } function registerType(rawType, registeredInstance, options) {
      options = options || {};

      if (!('argPackAdvance' in registeredInstance)) {
        throw new TypeError('registerType registeredInstance requires argPackAdvance');
      }

      var name = registeredInstance.name;
      if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
      }
      if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
          return;
        } else {
          throwBindingError("Cannot register type '" + name + "' twice");
        }
      }

      registeredTypes[rawType] = registeredInstance;
      delete typeDependencies[rawType];

      if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach(function (cb) {
          cb();
        });
      }
    } function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
      var shift = getShiftFromSize(size);

      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': function (wt) {
          // ambiguous emscripten ABI: sometimes return values are
          // true or false, and sometimes integers (0 or 1)
          return !!wt;
        },
        'toWireType': function (destructors, o) {
          return o ? trueValue : falseValue;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': function (pointer) {
          // TODO: if heap is fixed (like in asm.js) this could be executed outside
          var heap;
          if (size === 1) {
            heap = HEAP8;
          } else if (size === 2) {
            heap = HEAP16;
          } else if (size === 4) {
            heap = HEAP32;
          } else {
            throw new TypeError("Unknown boolean type size: " + name);
          }
          return this['fromWireType'](heap[pointer >> shift]);
        },
        destructorFunction: null, // This type does not need a destructor
      });
    }




    function simpleReadValueFromPointer(pointer) {
      return this['fromWireType'](HEAPU32[pointer >> 2]);
    } function __embind_register_std_string(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': function (value) {
          var length = HEAPU32[value >> 2];
          var a = new Array(length);
          for (var i = 0; i < length; ++i) {
            a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
          }
          _free(value);
          return a.join('');
        },
        'toWireType': function (destructors, value) {
          if (value instanceof ArrayBuffer) {
            value = new Uint8Array(value);
          }

          function getTAElement(ta, index) {
            return ta[index];
          }
          function getStringElement(string, index) {
            return string.charCodeAt(index);
          }
          var getElement;
          if (value instanceof Uint8Array) {
            getElement = getTAElement;
          } else if (value instanceof Uint8ClampedArray) {
            getElement = getTAElement;
          } else if (value instanceof Int8Array) {
            getElement = getTAElement;
          } else if (typeof value === 'string') {
            getElement = getStringElement;
          } else {
            throwBindingError('Cannot pass non-string to std::string');
          }

          // assumes 4-byte alignment
          var length = value.length;
          var ptr = _malloc(4 + length);
          HEAPU32[ptr >> 2] = length;
          for (var i = 0; i < length; ++i) {
            var charCode = getElement(value, i);
            if (charCode > 255) {
              _free(ptr);
              throwBindingError('String has UTF-16 code units that do not fit in 8 bits');
            }
            HEAPU8[ptr + 4 + i] = charCode;
          }
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: function (ptr) { _free(ptr); },
      });
    }


    function _embind_repr(v) {
      if (v === null) {
        return 'null';
      }
      var t = typeof v;
      if (t === 'object' || t === 'array' || t === 'function') {
        return v.toString();
      } else {
        return '' + v;
      }
    }

    function integerReadValueFromPointer(name, shift, signed) {
      // integers are quite common, so generate very specialized functions
      switch (shift) {
        case 0: return signed ?
          function readS8FromPointer(pointer) { return HEAP8[pointer]; } :
          function readU8FromPointer(pointer) { return HEAPU8[pointer]; };
        case 1: return signed ?
          function readS16FromPointer(pointer) { return HEAP16[pointer >> 1]; } :
          function readU16FromPointer(pointer) { return HEAPU16[pointer >> 1]; };
        case 2: return signed ?
          function readS32FromPointer(pointer) { return HEAP32[pointer >> 2]; } :
          function readU32FromPointer(pointer) { return HEAPU32[pointer >> 2]; };
        default:
          throw new TypeError("Unknown integer type: " + name);
      }
    } function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
      name = readLatin1String(name);
      if (maxRange === -1) { // LLVM doesn't have signed and unsigned 32-bit types, so u32 literals come out as 'i32 -1'. Always treat those as max u32.
        maxRange = 4294967295;
      }

      var shift = getShiftFromSize(size);

      var fromWireType = function (value) {
        return value;
      };

      if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = function (value) {
          return (value << bitshift) >>> bitshift;
        };
      }

      var isUnsignedType = (name.indexOf('unsigned') != -1);

      registerType(primitiveType, {
        name: name,
        'fromWireType': fromWireType,
        'toWireType': function (destructors, value) {
          // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
          // avoid the following two if()s and assume value is of proper type.
          if (typeof value !== "number" && typeof value !== "boolean") {
            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
          }
          if (value < minRange || value > maxRange) {
            throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ', ' + maxRange + ']!');
          }
          return isUnsignedType ? (value >>> 0) : (value | 0);
        },
        'argPackAdvance': 8,
        'readValueFromPointer': integerReadValueFromPointer(name, shift, minRange !== 0),
        destructorFunction: null, // This type does not need a destructor
      });
    }

    function _pthread_mutex_init() { }


    var emval_free_list = [];

    var emval_handle_array = [{}, { value: undefined }, { value: null }, { value: true }, { value: false }]; function __emval_decref(handle) {
      if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
        emval_handle_array[handle] = undefined;
        emval_free_list.push(handle);
      }
    }


    var PTHREAD_SPECIFIC = {};

    var PTHREAD_SPECIFIC_NEXT_KEY = 1;

    var ERRNO_CODES = { EPERM: 1, ENOENT: 2, ESRCH: 3, EINTR: 4, EIO: 5, ENXIO: 6, E2BIG: 7, ENOEXEC: 8, EBADF: 9, ECHILD: 10, EAGAIN: 11, EWOULDBLOCK: 11, ENOMEM: 12, EACCES: 13, EFAULT: 14, ENOTBLK: 15, EBUSY: 16, EEXIST: 17, EXDEV: 18, ENODEV: 19, ENOTDIR: 20, EISDIR: 21, EINVAL: 22, ENFILE: 23, EMFILE: 24, ENOTTY: 25, ETXTBSY: 26, EFBIG: 27, ENOSPC: 28, ESPIPE: 29, EROFS: 30, EMLINK: 31, EPIPE: 32, EDOM: 33, ERANGE: 34, ENOMSG: 42, EIDRM: 43, ECHRNG: 44, EL2NSYNC: 45, EL3HLT: 46, EL3RST: 47, ELNRNG: 48, EUNATCH: 49, ENOCSI: 50, EL2HLT: 51, EDEADLK: 35, ENOLCK: 37, EBADE: 52, EBADR: 53, EXFULL: 54, ENOANO: 55, EBADRQC: 56, EBADSLT: 57, EDEADLOCK: 35, EBFONT: 59, ENOSTR: 60, ENODATA: 61, ETIME: 62, ENOSR: 63, ENONET: 64, ENOPKG: 65, EREMOTE: 66, ENOLINK: 67, EADV: 68, ESRMNT: 69, ECOMM: 70, EPROTO: 71, EMULTIHOP: 72, EDOTDOT: 73, EBADMSG: 74, ENOTUNIQ: 76, EBADFD: 77, EREMCHG: 78, ELIBACC: 79, ELIBBAD: 80, ELIBSCN: 81, ELIBMAX: 82, ELIBEXEC: 83, ENOSYS: 38, ENOTEMPTY: 39, ENAMETOOLONG: 36, ELOOP: 40, EOPNOTSUPP: 95, EPFNOSUPPORT: 96, ECONNRESET: 104, ENOBUFS: 105, EAFNOSUPPORT: 97, EPROTOTYPE: 91, ENOTSOCK: 88, ENOPROTOOPT: 92, ESHUTDOWN: 108, ECONNREFUSED: 111, EADDRINUSE: 98, ECONNABORTED: 103, ENETUNREACH: 101, ENETDOWN: 100, ETIMEDOUT: 110, EHOSTDOWN: 112, EHOSTUNREACH: 113, EINPROGRESS: 115, EALREADY: 114, EDESTADDRREQ: 89, EMSGSIZE: 90, EPROTONOSUPPORT: 93, ESOCKTNOSUPPORT: 94, EADDRNOTAVAIL: 99, ENETRESET: 102, EISCONN: 106, ENOTCONN: 107, ETOOMANYREFS: 109, EUSERS: 87, EDQUOT: 122, ESTALE: 116, ENOTSUP: 95, ENOMEDIUM: 123, EILSEQ: 84, EOVERFLOW: 75, ECANCELED: 125, ENOTRECOVERABLE: 131, EOWNERDEAD: 130, ESTRPIPE: 86 }; function _pthread_key_create(key, destructor) {
      if (key == 0) {
        return ERRNO_CODES.EINVAL;
      }
      HEAP32[((key) >> 2)] = PTHREAD_SPECIFIC_NEXT_KEY;
      // values start at 0
      PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
      PTHREAD_SPECIFIC_NEXT_KEY++;
      return 0;
    }




    function count_emval_handles() {
      var count = 0;
      for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
          ++count;
        }
      }
      return count;
    }

    function get_first_emval() {
      for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
          return emval_handle_array[i];
        }
      }
      return null;
    } function init_emval() {
      Module['count_emval_handles'] = count_emval_handles;
      Module['get_first_emval'] = get_first_emval;
    } function __emval_register(value) {

      switch (value) {
        case undefined: { return 1; }
        case null: { return 2; }
        case true: { return 3; }
        case false: { return 4; }
        default: {
          var handle = emval_free_list.length ?
            emval_free_list.pop() :
            emval_handle_array.length;

          emval_handle_array[handle] = { refcount: 1, value: value };
          return handle;
        }
      }
    }


    function getTypeName(type) {
      var ptr = ___getTypeName(type);
      var rv = readLatin1String(ptr);
      _free(ptr);
      return rv;
    } function requireRegisteredType(rawType, humanName) {
      var impl = registeredTypes[rawType];
      if (undefined === impl) {
        throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
      }
      return impl;
    } function __emval_take_value(type, argv) {
      type = requireRegisteredType(type, '_emval_take_value');
      var v = type['readValueFromPointer'](argv);
      return __emval_register(v);
    }




    var ERRNO_MESSAGES = { 0: "Success", 1: "Not super-user", 2: "No such file or directory", 3: "No such process", 4: "Interrupted system call", 5: "I/O error", 6: "No such device or address", 7: "Arg list too long", 8: "Exec format error", 9: "Bad file number", 10: "No children", 11: "No more processes", 12: "Not enough core", 13: "Permission denied", 14: "Bad address", 15: "Block device required", 16: "Mount device busy", 17: "File exists", 18: "Cross-device link", 19: "No such device", 20: "Not a directory", 21: "Is a directory", 22: "Invalid argument", 23: "Too many open files in system", 24: "Too many open files", 25: "Not a typewriter", 26: "Text file busy", 27: "File too large", 28: "No space left on device", 29: "Illegal seek", 30: "Read only file system", 31: "Too many links", 32: "Broken pipe", 33: "Math arg out of domain of func", 34: "Math result not representable", 35: "File locking deadlock error", 36: "File or path name too long", 37: "No record locks available", 38: "Function not implemented", 39: "Directory not empty", 40: "Too many symbolic links", 42: "No message of desired type", 43: "Identifier removed", 44: "Channel number out of range", 45: "Level 2 not synchronized", 46: "Level 3 halted", 47: "Level 3 reset", 48: "Link number out of range", 49: "Protocol driver not attached", 50: "No CSI structure available", 51: "Level 2 halted", 52: "Invalid exchange", 53: "Invalid request descriptor", 54: "Exchange full", 55: "No anode", 56: "Invalid request code", 57: "Invalid slot", 59: "Bad font file fmt", 60: "Device not a stream", 61: "No data (for no delay io)", 62: "Timer expired", 63: "Out of streams resources", 64: "Machine is not on the network", 65: "Package not installed", 66: "The object is remote", 67: "The link has been severed", 68: "Advertise error", 69: "Srmount error", 70: "Communication error on send", 71: "Protocol error", 72: "Multihop attempted", 73: "Cross mount point (not really error)", 74: "Trying to read unreadable message", 75: "Value too large for defined data type", 76: "Given log. name not unique", 77: "f.d. invalid for this operation", 78: "Remote address changed", 79: "Can   access a needed shared lib", 80: "Accessing a corrupted shared lib", 81: ".lib section in a.out corrupted", 82: "Attempting to link in too many libs", 83: "Attempting to exec a shared library", 84: "Illegal byte sequence", 86: "Streams pipe error", 87: "Too many users", 88: "Socket operation on non-socket", 89: "Destination address required", 90: "Message too long", 91: "Protocol wrong type for socket", 92: "Protocol not available", 93: "Unknown protocol", 94: "Socket type not supported", 95: "Not supported", 96: "Protocol family not supported", 97: "Address family not supported by protocol family", 98: "Address already in use", 99: "Address not available", 100: "Network interface is not configured", 101: "Network is unreachable", 102: "Connection reset by network", 103: "Connection aborted", 104: "Connection reset by peer", 105: "No buffer space available", 106: "Socket is already connected", 107: "Socket is not connected", 108: "Can't send after socket shutdown", 109: "Too many references", 110: "Connection timed out", 111: "Connection refused", 112: "Host is down", 113: "Host is unreachable", 114: "Socket already connected", 115: "Connection already in progress", 116: "Stale file handle", 122: "Quota exceeded", 123: "No medium (in tape drive)", 125: "Operation canceled", 130: "Previous owner died", 131: "State not recoverable" };

    function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']()) >> 2)] = value;
      return value;
    }

    var PATH = {
      splitPath: function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      }, normalizeArray: function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      }, normalize: function (path) {
        var isAbsolute = path.charAt(0) === '/',
          trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function (p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      }, dirname: function (path) {
        var result = PATH.splitPath(path),
          root = result[0],
          dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      }, basename: function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1);
      }, extname: function (path) {
        return PATH.splitPath(path)[3];
      }, join: function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      }, join2: function (l, r) {
        return PATH.normalize(l + '/' + r);
      }, resolve: function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function (p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      }, relative: function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }
    };

    var TTY = {
      ttys: [], init: function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      }, shutdown: function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      }, register: function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      }, stream_ops: {
        open: function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        }, close: function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        }, flush: function (stream) {
          stream.tty.ops.flush(stream.tty);
        }, read: function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset + i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        }, write: function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }
      }, default_tty_ops: {
        get_char: function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;

              var isPosixPlatform = (process.platform != 'win32'); // Node doesn't offer a direct check, so test by exclusion

              var fd = process.stdin.fd;
              if (isPosixPlatform) {
                // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
                var usingDevice = false;
                try {
                  fd = fs.openSync('/dev/stdin', 'r');
                  usingDevice = true;
                } catch (e) { }
              }

              try {
                bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
              } catch (e) {
                // Cross-platform differences: on Windows, reading EOF throws an exception, but on other OSes,
                // reading EOF returns 0. Uniformize behavior by treating the EOF exception to return 0.
                if (e.toString().indexOf('EOF') != -1) bytesRead = 0;
                else throw e;
              }

              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }

            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        }, put_char: function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        }, flush: function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }
      }, default_tty1_ops: {
        put_char: function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        }, flush: function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }
      }
    };

    var MEMFS = {
      ops_table: null, mount: function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      }, createNode: function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.length which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null;
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      }, getFileDataAsRegularArray: function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      }, getFileDataAsTypedArray: function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      }, expandFileStorage: function (node, newCapacity) {
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }

        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.length : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      }, resizeFileStorage: function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      }, node_ops: {
        getattr: function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        }, setattr: function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        }, lookup: function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        }, mknod: function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        }, rename: function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        }, unlink: function (parent, name) {
          delete parent.contents[name];
        }, rmdir: function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        }, readdir: function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        }, symlink: function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        }, readlink: function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }
      }, stream_ops: {
        read: function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        }, write: function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();

          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) {
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }

          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position + length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
              node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position + length);
          return length;
        }, llseek: function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }, allocate: function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        }, mmap: function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) &&
            (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        }, msync: function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }

          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }
      }
    };

    var IDBFS = {
      dbs: {}, indexedDB: function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      }, DB_VERSION: 21, DB_STORE_NAME: "FILE_DATA", mount: function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      }, syncfs: function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function (err, local) {
          if (err) return callback(err);

          IDBFS.getRemoteSet(mount, function (err, remote) {
            if (err) return callback(err);

            var src = populate ? remote : local;
            var dst = populate ? local : remote;

            IDBFS.reconcile(src, dst, callback);
          });
        });
      }, getDB: function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }

        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        if (!req) {
          return callback("Unable to connect to IndexedDB");
        }
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          var transaction = e.target.transaction;

          var fileStore;

          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }

          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function () {
          db = req.result;

          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function (e) {
          callback(this.error);
          e.preventDefault();
        };
      }, getLocalSet: function (mount, callback) {
        var entries = {};

        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function (p) {
            return PATH.join2(root, p);
          }
        };

        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));

        while (check.length) {
          var path = check.pop();
          var stat;

          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }

          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }

          entries[path] = { timestamp: stat.mtime };
        }

        return callback(null, { type: 'local', entries: entries });
      }, getRemoteSet: function (mount, callback) {
        var entries = {};

        IDBFS.getDB(mount.mountpoint, function (err, db) {
          if (err) return callback(err);

          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function (e) {
            callback(this.error);
            e.preventDefault();
          };

          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');

          index.openKeyCursor().onsuccess = function (event) {
            var cursor = event.target.result;

            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }

            entries[cursor.primaryKey] = { timestamp: cursor.key };

            cursor.continue();
          };
        });
      }, loadLocalEntry: function (path, callback) {
        var stat, node;

        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }

        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      }, storeLocalEntry: function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }

          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }

        callback(null);
      }, removeLocalEntry: function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);

          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }

        callback(null);
      }, loadRemoteEntry: function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function (event) { callback(null, event.target.result); };
        req.onerror = function (e) {
          callback(this.error);
          e.preventDefault();
        };
      }, storeRemoteEntry: function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function () { callback(null); };
        req.onerror = function (e) {
          callback(this.error);
          e.preventDefault();
        };
      }, removeRemoteEntry: function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function () { callback(null); };
        req.onerror = function (e) {
          callback(this.error);
          e.preventDefault();
        };
      }, reconcile: function (src, dst, callback) {
        var total = 0;

        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });

        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });

        if (!total) {
          return callback(null);
        }

        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);

        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };

        transaction.onerror = function (e) {
          done(this.error);
          e.preventDefault();
        };

        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });

        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }
    };

    var NODEFS = {
      isWindows: false, staticInit: function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      }, mount: function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      }, createNode: function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      }, getMode: function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      }, realPath: function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      }, flagsToPermissionStringMap: { 0: "r", 1: "r+", 2: "r+", 64: "r", 65: "r+", 66: "r+", 129: "rx+", 193: "rx+", 514: "w+", 577: "w", 578: "w+", 705: "wx", 706: "wx+", 1024: "a", 1025: "a", 1026: "a+", 1089: "a", 1090: "a+", 1153: "ax", 1154: "ax+", 1217: "ax", 1218: "ax+", 4096: "rs", 4098: "rs+" }, flagsToPermissionString: function (flags) {
        flags &= ~0x200000 /*O_PATH*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x800 /*O_NONBLOCK*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x8000 /*O_LARGEFILE*/; // Ignore this flag from musl, otherwise node.js fails to open the file.
        flags &= ~0x80000 /*O_CLOEXEC*/; // Some applications may pass it; it makes no sense for a single process.
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
      }, node_ops: {
        getattr: function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        }, setattr: function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, lookup: function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        }, mknod: function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        }, rename: function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, unlink: function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, rmdir: function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, readdir: function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, symlink: function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, readlink: function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }
      }, stream_ops: {
        open: function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, close: function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }, read: function (stream, buffer, offset, length, position) {
          if (length === 0) return 0; // node errors on 0 length reads
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        }, write: function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        }, llseek: function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }

          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }

          return position;
        }
      }
    };

    var WORKERFS = {
      DIR_MODE: 16895, FILE_MODE: 33279, reader: null, mount: function (mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync();
        var root = WORKERFS.createNode(null, '/', WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
          // return the parent node, creating subdirs as necessary
          var parts = path.split('/');
          var parent = root;
          for (var i = 0; i < parts.length - 1; i++) {
            var curr = parts.slice(0, i + 1).join('/');
            // Issue 4254: Using curr as a node name will prevent the node
            // from being found in FS.nameTable when FS.open is called on
            // a path which holds a child of this node,
            // given that all FS functions assume node names
            // are just their corresponding parts within their given path,
            // rather than incremental aggregates which include their parent's
            // directories.
            if (!createdParents[curr]) {
              createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0);
            }
            parent = createdParents[curr];
          }
          return parent;
        }
        function base(path) {
          var parts = path.split('/');
          return parts[parts.length - 1];
        }
        // We also accept FileList here, by using Array.prototype
        Array.prototype.forEach.call(mount.opts["files"] || [], function (file) {
          WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
        });
        (mount.opts["blobs"] || []).forEach(function (obj) {
          WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
        });
        (mount.opts["packages"] || []).forEach(function (pack) {
          pack['metadata'].files.forEach(function (file) {
            var name = file.filename.substr(1); // remove initial slash
            WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack['blob'].slice(file.start, file.end));
          });
        });
        return root;
      }, createNode: function (parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
          node.size = contents.size;
          node.contents = contents;
        } else {
          node.size = 4096;
          node.contents = {};
        }
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      }, node_ops: {
        getattr: function (node) {
          return {
            dev: 1,
            ino: undefined,
            mode: node.mode,
            nlink: 1,
            uid: 0,
            gid: 0,
            rdev: undefined,
            size: node.size,
            atime: new Date(node.timestamp),
            mtime: new Date(node.timestamp),
            ctime: new Date(node.timestamp),
            blksize: 4096,
            blocks: Math.ceil(node.size / 4096),
          };
        }, setattr: function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
        }, lookup: function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }, mknod: function (parent, name, mode, dev) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }, rename: function (oldNode, newDir, newName) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }, unlink: function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }, rmdir: function (parent, name) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }, readdir: function (node) {
          var entries = ['.', '..'];
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        }, symlink: function (parent, newName, oldPath) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }, readlink: function (node) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
      }, stream_ops: {
        read: function (stream, buffer, offset, length, position) {
          if (position >= stream.node.size) return 0;
          var chunk = stream.node.contents.slice(position, position + length);
          var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
          buffer.set(new Uint8Array(ab), offset);
          return chunk.size;
        }, write: function (stream, buffer, offset, length, position) {
          throw new FS.ErrnoError(ERRNO_CODES.EIO);
        }, llseek: function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.size;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        }
      }
    };

    var _stdin = STATICTOP; STATICTOP += 16;;

    var _stdout = STATICTOP; STATICTOP += 16;;

    var _stderr = STATICTOP; STATICTOP += 16;; var FS = {
      root: null, mounts: [], devices: [null], streams: [], nextInode: 1, nameTable: null, currentPath: "/", initialized: false, ignorePermissions: true, trackingDelegate: {}, tracking: { openFlags: { READ: 1, WRITE: 2 } }, ErrnoError: null, genericErrors: {}, filesystems: null, syncFSRequests: 0, handleFSError: function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      }, lookupPath: function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};

        if (!path) return { path: '', node: null };

        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }

        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }

        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function (p) {
          return !!p;
        }), false);

        // start at the root
        var current = FS.root;
        var current_path = '/';

        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length - 1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }

          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);

          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }

          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);

              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;

              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }

        return { path: current_path, node: current };
      }, getPath: function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length - 1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      }, hashName: function (parentid, name) {
        var hash = 0;


        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      }, hashAddNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      }, hashRemoveNode: function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      }, lookupNode: function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      }, createNode: function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function (parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };

          FS.FSNode.prototype = {};

          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;

          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function () { return (this.mode & readMode) === readMode; },
              set: function (val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function () { return (this.mode & writeMode) === writeMode; },
              set: function (val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function () { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function () { return FS.isChrdev(this.mode); }
            }
          });
        }

        var node = new FS.FSNode(parent, name, mode, rdev);

        FS.hashAddNode(node);

        return node;
      }, destroyNode: function (node) {
        FS.hashRemoveNode(node);
      }, isRoot: function (node) {
        return node === node.parent;
      }, isMountpoint: function (node) {
        return !!node.mounted;
      }, isFile: function (mode) {
        return (mode & 61440) === 32768;
      }, isDir: function (mode) {
        return (mode & 61440) === 16384;
      }, isLink: function (mode) {
        return (mode & 61440) === 40960;
      }, isChrdev: function (mode) {
        return (mode & 61440) === 8192;
      }, isBlkdev: function (mode) {
        return (mode & 61440) === 24576;
      }, isFIFO: function (mode) {
        return (mode & 61440) === 4096;
      }, isSocket: function (mode) {
        return (mode & 49152) === 49152;
      }, flagModes: { "r": 0, "rs": 1052672, "r+": 2, "w": 577, "wx": 705, "xw": 705, "w+": 578, "wx+": 706, "xw+": 706, "a": 1089, "ax": 1217, "xa": 1217, "a+": 1090, "ax+": 1218, "xa+": 1218 }, modeStringToFlags: function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      }, flagsToPermissionString: function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      }, nodePermissions: function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      }, mayLookup: function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      }, mayCreate: function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      }, mayDelete: function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      }, mayOpen: function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if (FS.flagsToPermissionString(flags) !== 'r' || // opening for write
            (flags & 512)) { // TODO: check for O_SEARCH? (== search for dir only)
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      }, MAX_OPEN_FDS: 4096, nextfd: function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      }, getStream: function (fd) {
        return FS.streams[fd];
      }, createStream: function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function () { };
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function () { return this.node; },
              set: function (val) { this.node = val; }
            },
            isRead: {
              get: function () { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function () { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function () { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      }, closeStream: function (fd) {
        FS.streams[fd] = null;
      }, chrdev_stream_ops: {
        open: function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        }, llseek: function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
      }, major: function (dev) {
        return ((dev) >> 8);
      }, minor: function (dev) {
        return ((dev) & 0xff);
      }, makedev: function (ma, mi) {
        return ((ma) << 8 | (mi));
      }, registerDevice: function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      }, getDevice: function (dev) {
        return FS.devices[dev];
      }, getMounts: function (mount) {
        var mounts = [];
        var check = [mount];

        while (check.length) {
          var m = check.pop();

          mounts.push(m);

          check.push.apply(check, m.mounts);
        }

        return mounts;
      }, syncfs: function (populate, callback) {
        if (typeof (populate) === 'function') {
          callback = populate;
          populate = false;
        }

        FS.syncFSRequests++;

        if (FS.syncFSRequests > 1) {
          console.log('warning: ' + FS.syncFSRequests + ' FS.syncfs operations in flight at once, probably just doing extra work');
        }

        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;

        function doCallback(err) {
          assert(FS.syncFSRequests > 0);
          FS.syncFSRequests--;
          return callback(err);
        }

        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };

        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      }, mount: function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;

        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });

          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;

          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }

          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }

        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };

        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;

        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;

          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }

        return mountRoot;
      }, unmount: function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });

        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }

        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);

        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];

          while (current) {
            var next = current.name_next;

            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }

            current = next;
          }
        });

        // no longer a mountpoint
        node.mounted = null;

        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      }, lookup: function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      }, mknod: function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      }, create: function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      }, mkdir: function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      }, mkdirTree: function (path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var i = 0; i < dirs.length; ++i) {
          if (!dirs[i]) continue;
          d += '/' + dirs[i];
          try {
            FS.mkdir(d, mode);
          } catch (e) {
            if (e.errno != ERRNO_CODES.EEXIST) throw e;
          }
        }
      }, mkdev: function (path, mode, dev) {
        if (typeof (dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      }, symlink: function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      }, rename: function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch (e) {
          console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch (e) {
          console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
        }
      }, rmdir: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch (e) {
          console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch (e) {
          console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
      }, readdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      }, unlink: function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch (e) {
          console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch (e) {
          console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
        }
      }, readlink: function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      }, stat: function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      }, lstat: function (path) {
        return FS.stat(path, true);
      }, chmod: function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      }, lchmod: function (path, mode) {
        FS.chmod(path, mode, true);
      }, fchmod: function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      }, chown: function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      }, lchown: function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      }, fchown: function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      }, truncate: function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      }, ftruncate: function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      }, utime: function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      }, open: function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);

        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch (e) {
          console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
        }
        return stream;
      }, close: function (stream) {
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      }, llseek: function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      }, read: function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      }, write: function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch (e) {
          console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message);
        }
        return bytesWritten;
      }, allocate: function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      }, mmap: function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      }, msync: function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      }, munmap: function (stream) {
        return 0;
      }, ioctl: function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      }, readFile: function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      }, writeFile: function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      }, cwd: function () {
        return FS.currentPath;
      }, chdir: function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      }, createDefaultDirectories: function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      }, createDefaultDevices: function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function () { return 0; },
          write: function (stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function () { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function () { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function () { return (Math.random() * 256) | 0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      }, createSpecialDirectories: function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function () {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 511 /* 0777 */, 73);
            node.node_ops = {
              lookup: function (parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function () { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      }, createStandardStreams: function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops

        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }

        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');

        var stdout = FS.open('/dev/stdout', 'w');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');

        var stderr = FS.open('/dev/stderr', 'w');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      }, ensureErrnoError: function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          //Module.printErr(stackTrace()); // useful for debugging
          this.node = node;
          this.setErrno = function (errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function (code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      }, staticInit: function () {
        FS.ensureErrnoError();

        FS.nameTable = new Array(4096);

        FS.mount(MEMFS, {}, '/');

        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();

        FS.filesystems = {
          'MEMFS': MEMFS,
          'IDBFS': IDBFS,
          'NODEFS': NODEFS,
          'WORKERFS': WORKERFS,
        };
      }, init: function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;

        FS.ensureErrnoError();

        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];

        FS.createStandardStreams();
      }, quit: function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      }, getMode: function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      }, joinPath: function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      }, absolutePath: function (relative, base) {
        return PATH.resolve(base, relative);
      }, standardizePath: function (path) {
        return PATH.normalize(path);
      }, findObject: function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      }, analyzePath: function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      }, createFolder: function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      }, createPath: function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      }, createFile: function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      }, createDataFile: function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      }, createDevice: function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function (stream) {
            stream.seekable = false;
          },
          close: function (stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function (stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset + i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function (stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset + i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      }, createLink: function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      }, forceLoadFile: function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      }, createLazyFile: function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length - 1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize) | 0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";

          var chunkSize = 1024 * 1024; // Chunk size in bytes

          if (!hasByteServing) chunkSize = datalength;

          // Function to get a range from the remote URL.
          var doXHR = (function (from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");

            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);

            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }

            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function (chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum + 1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength - 1); // if datalength-1 is selected, this is the last block
            if (typeof (lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof (lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });

          if (usesGzip || !datalength) {
            // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
            chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
            datalength = this.getter(0).length;
            chunkSize = datalength;
            console.log("LazyFiles on gzip forces download of the whole file when length is accessed");
          }

          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperties(lazyArray, {
            length: {
              get: function () {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._length;
              }
            },
            chunkSize: {
              get: function () {
                if (!this.lengthKnown) {
                  this.cacheLength();
                }
                return this._chunkSize;
              }
            }
          });

          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }

        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function () { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function (key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      }, createPreloadedFile: function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init(); // XXX perhaps this method should move onto Browser?
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function (plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function () {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function (byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      }, indexedDB: function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      }, DB_NAME: function () {
        return 'EM_FS_' + window.location.pathname;
      }, DB_VERSION: 20, DB_STORE_NAME: "FILE_DATA", saveFilesToDB: function (paths, onload, onerror) {
        onload = onload || function () { };
        onerror = onerror || function () { };
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function (path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }, loadFilesFromDB: function (paths, onload, onerror) {
        onload = onload || function () { };
        onerror = onerror || function () { };
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch (e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function (path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }
    }; var SYSCALLS = {
      DEFAULT_POLLMASK: 5, mappings: {}, umask: 511, calculateAt: function (dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      }, doStat: function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -ERRNO_CODES.ENOTDIR;
          }
          throw e;
        }
        HEAP32[((buf) >> 2)] = stat.dev;
        HEAP32[(((buf) + (4)) >> 2)] = 0;
        HEAP32[(((buf) + (8)) >> 2)] = stat.ino;
        HEAP32[(((buf) + (12)) >> 2)] = stat.mode;
        HEAP32[(((buf) + (16)) >> 2)] = stat.nlink;
        HEAP32[(((buf) + (20)) >> 2)] = stat.uid;
        HEAP32[(((buf) + (24)) >> 2)] = stat.gid;
        HEAP32[(((buf) + (28)) >> 2)] = stat.rdev;
        HEAP32[(((buf) + (32)) >> 2)] = 0;
        HEAP32[(((buf) + (36)) >> 2)] = stat.size;
        HEAP32[(((buf) + (40)) >> 2)] = 4096;
        HEAP32[(((buf) + (44)) >> 2)] = stat.blocks;
        HEAP32[(((buf) + (48)) >> 2)] = (stat.atime.getTime() / 1000) | 0;
        HEAP32[(((buf) + (52)) >> 2)] = 0;
        HEAP32[(((buf) + (56)) >> 2)] = (stat.mtime.getTime() / 1000) | 0;
        HEAP32[(((buf) + (60)) >> 2)] = 0;
        HEAP32[(((buf) + (64)) >> 2)] = (stat.ctime.getTime() / 1000) | 0;
        HEAP32[(((buf) + (68)) >> 2)] = 0;
        HEAP32[(((buf) + (72)) >> 2)] = stat.ino;
        return 0;
      }, doMsync: function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags);
      }, doMkdir: function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length - 1] === '/') path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0;
      }, doMknod: function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
      }, doReadlink: function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);

        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        // readlink is one of the rare functions that write out a C string, but does never append a null to the output buffer(!)
        // stringToUTF8() always appends a null byte, so restore the character under the null byte after the write.
        HEAP8[buf + len] = endChar;

        return len;
      }, doAccess: function (path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -ERRNO_CODES.EACCES;
        }
        return 0;
      }, doDup: function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      }, doReadv: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov) + (i * 8)) >> 2)];
          var len = HEAP32[(((iov) + (i * 8 + 4)) >> 2)];
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      }, doWritev: function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov) + (i * 8)) >> 2)];
          var len = HEAP32[(((iov) + (i * 8 + 4)) >> 2)];
          var curr = FS.write(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      }, varargs: 0, get: function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs) - (4)) >> 2)];
        return ret;
      }, getStr: function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      }, getStreamFromFD: function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
      }, getSocketFromFD: function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
      }, getSocketAddress: function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      }, get64: function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      }, getZero: function () {
        assert(SYSCALLS.get() === 0);
      }
    }; function ___syscall91(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        // munmap
        var addr = SYSCALLS.get(), len = SYSCALLS.get();
        // TODO: support unmmap'ing parts of allocations
        var info = SYSCALLS.mappings[addr];
        if (!info) return 0;
        if (len === info.len) {
          var stream = FS.getStream(info.fd);
          SYSCALLS.doMsync(addr, stream, len, info.flags)
          FS.munmap(stream);
          SYSCALLS.mappings[addr] = null;
          if (info.allocated) {
            _free(info.malloc);
          }
        }
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }

    function __embind_register_emval(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': function (handle) {
          var rv = emval_handle_array[handle].value;
          __emval_decref(handle);
          return rv;
        },
        'toWireType': function (destructors, value) {
          return __emval_register(value);
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: null, // This type does not need a destructor

        // TODO: do we need a deleteObject here?  write a test where
        // emval is passed into JS via an interface
      });
    }

    function ___syscall54(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        // ioctl
        var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
        switch (op) {
          case 21505: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0;
          }
          case 21506: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0; // no-op, not actually adjusting terminal settings
          }
          case 21519: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            var argp = SYSCALLS.get();
            HEAP32[((argp) >> 2)] = 0;
            return 0;
          }
          case 21520: {
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return -ERRNO_CODES.EINVAL; // not supported
          }
          case 21531: {
            var argp = SYSCALLS.get();
            return FS.ioctl(stream, op, argp);
          }
          case 21523: {
            // TODO: in theory we should write to the winsize struct that gets
            // passed in, but for now musl doesn't read anything on it
            if (!stream.tty) return -ERRNO_CODES.ENOTTY;
            return 0;
          }
          default: abort('bad ioctl syscall ' + op);
        }
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }







    var _environ = STATICTOP; STATICTOP += 16;; var ___environ = _environ; function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;

      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = ENV['LOGNAME'] = 'web_user';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/web_user';
        ENV['LANG'] = 'C';
        ENV['_'] = Module['thisProgram'];
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr) >> 2)] = poolPtr;
        HEAP32[((_environ) >> 2)] = envPtr;
      } else {
        envPtr = HEAP32[((_environ) >> 2)];
        poolPtr = HEAP32[((envPtr) >> 2)];
      }

      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }

      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[(((envPtr) + (i * ptrSize)) >> 2)] = poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr) + (strings.length * ptrSize)) >> 2)] = 0;
    } var ENV = {}; function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;

      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }



    function __isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }

    function __arraySum(array, index) {
      var sum = 0;
      for (var i = 0; i <= index; sum += array[i++]);
      return sum;
    }


    var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; function __addDays(date, days) {
      var newDate = new Date(date.getTime());
      while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];

        if (days > daysInCurrentMonth - newDate.getDate()) {
          // we spill over to next month
          days -= (daysInCurrentMonth - newDate.getDate() + 1);
          newDate.setDate(1);
          if (currentMonth < 11) {
            newDate.setMonth(currentMonth + 1)
          } else {
            newDate.setMonth(0);
            newDate.setFullYear(newDate.getFullYear() + 1);
          }
        } else {
          // we stay in current month 
          newDate.setDate(newDate.getDate() + days);
          return newDate;
        }
      }

      return newDate;
    } function _strftime(s, maxsize, format, tm) {
      // size_t strftime(char *restrict s, size_t maxsize, const char *restrict format, const struct tm *restrict timeptr);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/strftime.html

      var tm_zone = HEAP32[(((tm) + (40)) >> 2)];

      var date = {
        tm_sec: HEAP32[((tm) >> 2)],
        tm_min: HEAP32[(((tm) + (4)) >> 2)],
        tm_hour: HEAP32[(((tm) + (8)) >> 2)],
        tm_mday: HEAP32[(((tm) + (12)) >> 2)],
        tm_mon: HEAP32[(((tm) + (16)) >> 2)],
        tm_year: HEAP32[(((tm) + (20)) >> 2)],
        tm_wday: HEAP32[(((tm) + (24)) >> 2)],
        tm_yday: HEAP32[(((tm) + (28)) >> 2)],
        tm_isdst: HEAP32[(((tm) + (32)) >> 2)],
        tm_gmtoff: HEAP32[(((tm) + (36)) >> 2)],
        tm_zone: tm_zone ? Pointer_stringify(tm_zone) : ''
      };

      var pattern = Pointer_stringify(format);

      // expand format
      var EXPANSION_RULES_1 = {
        '%c': '%a %b %d %H:%M:%S %Y',     // Replaced by the locale's appropriate date and time representation - e.g., Mon Aug  3 14:02:01 2013
        '%D': '%m/%d/%y',                 // Equivalent to %m / %d / %y
        '%F': '%Y-%m-%d',                 // Equivalent to %Y - %m - %d
        '%h': '%b',                       // Equivalent to %b
        '%r': '%I:%M:%S %p',              // Replaced by the time in a.m. and p.m. notation
        '%R': '%H:%M',                    // Replaced by the time in 24-hour notation
        '%T': '%H:%M:%S',                 // Replaced by the time
        '%x': '%m/%d/%y',                 // Replaced by the locale's appropriate date representation
        '%X': '%H:%M:%S'                  // Replaced by the locale's appropriate date representation
      };
      for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_1[rule]);
      }

      var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      function leadingSomething(value, digits, character) {
        var str = typeof value === 'number' ? value.toString() : (value || '');
        while (str.length < digits) {
          str = character[0] + str;
        }
        return str;
      };

      function leadingNulls(value, digits) {
        return leadingSomething(value, digits, '0');
      };

      function compareByDay(date1, date2) {
        function sgn(value) {
          return value < 0 ? -1 : (value > 0 ? 1 : 0);
        };

        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
          if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
            compare = sgn(date1.getDate() - date2.getDate());
          }
        }
        return compare;
      };

      function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
          case 0: // Sunday
            return new Date(janFourth.getFullYear() - 1, 11, 29);
          case 1: // Monday
            return janFourth;
          case 2: // Tuesday
            return new Date(janFourth.getFullYear(), 0, 3);
          case 3: // Wednesday
            return new Date(janFourth.getFullYear(), 0, 2);
          case 4: // Thursday
            return new Date(janFourth.getFullYear(), 0, 1);
          case 5: // Friday
            return new Date(janFourth.getFullYear() - 1, 11, 31);
          case 6: // Saturday
            return new Date(janFourth.getFullYear() - 1, 11, 30);
        }
      };

      function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);

        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);

        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);

        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
          // this date is after the start of the first week of this year
          if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
            return thisDate.getFullYear() + 1;
          } else {
            return thisDate.getFullYear();
          }
        } else {
          return thisDate.getFullYear() - 1;
        }
      };

      var EXPANSION_RULES_2 = {
        '%a': function (date) {
          return WEEKDAYS[date.tm_wday].substring(0, 3);
        },
        '%A': function (date) {
          return WEEKDAYS[date.tm_wday];
        },
        '%b': function (date) {
          return MONTHS[date.tm_mon].substring(0, 3);
        },
        '%B': function (date) {
          return MONTHS[date.tm_mon];
        },
        '%C': function (date) {
          var year = date.tm_year + 1900;
          return leadingNulls((year / 100) | 0, 2);
        },
        '%d': function (date) {
          return leadingNulls(date.tm_mday, 2);
        },
        '%e': function (date) {
          return leadingSomething(date.tm_mday, 2, ' ');
        },
        '%g': function (date) {
          // %g, %G, and %V give values according to the ISO 8601:2000 standard week-based year. 
          // In this system, weeks begin on a Monday and week 1 of the year is the week that includes 
          // January 4th, which is also the week that includes the first Thursday of the year, and 
          // is also the first week that contains at least four days in the year. 
          // If the first Monday of January is the 2nd, 3rd, or 4th, the preceding days are part of 
          // the last week of the preceding year; thus, for Saturday 2nd January 1999, 
          // %G is replaced by 1998 and %V is replaced by 53. If December 29th, 30th, 
          // or 31st is a Monday, it and any following days are part of week 1 of the following year. 
          // Thus, for Tuesday 30th December 1997, %G is replaced by 1998 and %V is replaced by 01.

          return getWeekBasedYear(date).toString().substring(2);
        },
        '%G': function (date) {
          return getWeekBasedYear(date);
        },
        '%H': function (date) {
          return leadingNulls(date.tm_hour, 2);
        },
        '%I': function (date) {
          var twelveHour = date.tm_hour;
          if (twelveHour == 0) twelveHour = 12;
          else if (twelveHour > 12) twelveHour -= 12;
          return leadingNulls(twelveHour, 2);
        },
        '%j': function (date) {
          // Day of the year (001-366)
          return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3);
        },
        '%m': function (date) {
          return leadingNulls(date.tm_mon + 1, 2);
        },
        '%M': function (date) {
          return leadingNulls(date.tm_min, 2);
        },
        '%n': function () {
          return '\n';
        },
        '%p': function (date) {
          if (date.tm_hour >= 0 && date.tm_hour < 12) {
            return 'AM';
          } else {
            return 'PM';
          }
        },
        '%S': function (date) {
          return leadingNulls(date.tm_sec, 2);
        },
        '%t': function () {
          return '\t';
        },
        '%u': function (date) {
          var day = new Date(date.tm_year + 1900, date.tm_mon + 1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay() || 7;
        },
        '%U': function (date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Sunday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year + 1900, 0, 1);
          var firstSunday = janFirst.getDay() === 0 ? janFirst : __addDays(janFirst, 7 - janFirst.getDay());
          var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);

          // is target date after the first Sunday?
          if (compareByDay(firstSunday, endDate) < 0) {
            // calculate difference in days between first Sunday and endDate
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
            var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
            var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
            return leadingNulls(Math.ceil(days / 7), 2);
          }

          return compareByDay(firstSunday, janFirst) === 0 ? '01' : '00';
        },
        '%V': function (date) {
          // Replaced by the week number of the year (Monday as the first day of the week) 
          // as a decimal number [01,53]. If the week containing 1 January has four 
          // or more days in the new year, then it is considered week 1. 
          // Otherwise, it is the last week of the previous year, and the next week is week 1. 
          // Both January 4th and the first Thursday of January are always in week 1. [ tm_year, tm_wday, tm_yday]
          var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
          var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);

          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);

          var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);

          if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
            // if given date is before this years first week, then it belongs to the 53rd week of last year
            return '53';
          }

          if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
            // if given date is after next years first week, then it belongs to the 01th week of next year
            return '01';
          }

          // given date is in between CW 01..53 of this calendar year
          var daysDifference;
          if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
            // first CW of this year starts last year
            daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
          } else {
            // first CW of this year starts this year
            daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate();
          }
          return leadingNulls(Math.ceil(daysDifference / 7), 2);
        },
        '%w': function (date) {
          var day = new Date(date.tm_year + 1900, date.tm_mon + 1, date.tm_mday, 0, 0, 0, 0);
          return day.getDay();
        },
        '%W': function (date) {
          // Replaced by the week number of the year as a decimal number [00,53]. 
          // The first Monday of January is the first day of week 1; 
          // days in the new year before this are in week 0. [ tm_year, tm_wday, tm_yday]
          var janFirst = new Date(date.tm_year, 0, 1);
          var firstMonday = janFirst.getDay() === 1 ? janFirst : __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
          var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);

          // is target date after the first Monday?
          if (compareByDay(firstMonday, endDate) < 0) {
            var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
            var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
            var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
            return leadingNulls(Math.ceil(days / 7), 2);
          }
          return compareByDay(firstMonday, janFirst) === 0 ? '01' : '00';
        },
        '%y': function (date) {
          // Replaced by the last two digits of the year as a decimal number [00,99]. [ tm_year]
          return (date.tm_year + 1900).toString().substring(2);
        },
        '%Y': function (date) {
          // Replaced by the year as a decimal number (for example, 1997). [ tm_year]
          return date.tm_year + 1900;
        },
        '%z': function (date) {
          // Replaced by the offset from UTC in the ISO 8601:2000 standard format ( +hhmm or -hhmm ).
          // For example, "-0430" means 4 hours 30 minutes behind UTC (west of Greenwich).
          var off = date.tm_gmtoff;
          var ahead = off >= 0;
          off = Math.abs(off) / 60;
          // convert from minutes into hhmm format (which means 60 minutes = 100 units)
          off = (off / 60) * 100 + (off % 60);
          return (ahead ? '+' : '-') + String("0000" + off).slice(-4);
        },
        '%Z': function (date) {
          return date.tm_zone;
        },
        '%%': function () {
          return '%';
        }
      };
      for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
          pattern = pattern.replace(new RegExp(rule, 'g'), EXPANSION_RULES_2[rule](date));
        }
      }

      var bytes = intArrayFromString(pattern, false);
      if (bytes.length > maxsize) {
        return 0;
      }

      writeArrayToMemory(bytes, s);
      return bytes.length - 1;
    } function _strftime_l(s, maxsize, format, tm) {
      return _strftime(s, maxsize, format, tm); // no locale support yet
    }

    function ___map_file(pathname, size) {
      ___setErrNo(ERRNO_CODES.EPERM);
      return -1;
    }




    function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
      return dest;
    }

    function __embind_register_enum_value(
      rawEnumType,
      name,
      enumValue
    ) {
      var enumType = requireRegisteredType(rawEnumType, 'enum');
      name = readLatin1String(name);

      var Enum = enumType.constructor;

      var Value = Object.create(enumType.constructor.prototype, {
        value: { value: enumValue },
        constructor: { value: createNamedFunction(enumType.name + '_' + name, function () { }) },
      });
      Enum.values[enumValue] = Value;
      Enum[name] = Value;
    }

    var _llvm_pow_f64 = Math_pow;





    function ___gxx_personality_v0() {
    }

    function _pthread_mutex_destroy() { }

    function _pthread_cond_wait() { return 0; }



    function __embind_register_memory_view(rawType, dataTypeIndex, name) {
      var typeMapping = [
        Int8Array,
        Uint8Array,
        Int16Array,
        Uint16Array,
        Int32Array,
        Uint32Array,
        Float32Array,
        Float64Array,
      ];

      var TA = typeMapping[dataTypeIndex];

      function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle]; // in elements
        var data = heap[handle + 1]; // byte offset into emscripten heap
        return new TA(heap['buffer'], data, size);
      }

      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': decodeMemoryView,
        'argPackAdvance': 8,
        'readValueFromPointer': decodeMemoryView,
      }, {
          ignoreDuplicateRegistrations: true,
        });
    }



    function ensureOverloadTable(proto, methodName, humanName) {
      if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        // Inject an overload resolver function that routes to the appropriate overload based on the number of arguments.
        proto[methodName] = function () {
          // TODO This check can be removed in -O3 level "unsafe" optimizations.
          if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
            throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
          }
          return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
        };
        // Move the previous function into the overload table.
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
      }
    } function exposePublicSymbol(name, value, numArguments) {
      if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || (undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments])) {
          throwBindingError("Cannot register public name '" + name + "' twice");
        }

        // We are exposing a function with the same name as an existing function. Create an overload table and a function selector
        // that routes between the two.
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
          throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
        }
        // Add the new function into the overload table.
        Module[name].overloadTable[numArguments] = value;
      }
      else {
        Module[name] = value;
        if (undefined !== numArguments) {
          Module[name].numArguments = numArguments;
        }
      }
    }

    function enumReadValueFromPointer(name, shift, signed) {
      switch (shift) {
        case 0: return function (pointer) {
          var heap = signed ? HEAP8 : HEAPU8;
          return this['fromWireType'](heap[pointer]);
        };
        case 1: return function (pointer) {
          var heap = signed ? HEAP16 : HEAPU16;
          return this['fromWireType'](heap[pointer >> 1]);
        };
        case 2: return function (pointer) {
          var heap = signed ? HEAP32 : HEAPU32;
          return this['fromWireType'](heap[pointer >> 2]);
        };
        default:
          throw new TypeError("Unknown integer type: " + name);
      }
    } function __embind_register_enum(
      rawType,
      name,
      size,
      isSigned
    ) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);

      function ctor() {
      }
      ctor.values = {};

      registerType(rawType, {
        name: name,
        constructor: ctor,
        'fromWireType': function (c) {
          return this.constructor.values[c];
        },
        'toWireType': function (destructors, c) {
          return c.value;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': enumReadValueFromPointer(name, shift, isSigned),
        destructorFunction: null,
      });
      exposePublicSymbol(name, ctor);
    }

    function __emval_incref(handle) {
      if (handle > 4) {
        emval_handle_array[handle].refcount += 1;
      }
    }

    function ___assert_fail(condition, filename, line, func) {
      ABORT = true;
      throw 'Assertion failed: ' + Pointer_stringify(condition) + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + stackTrace();
    }

    function __embind_register_void(rawType, name) {
      name = readLatin1String(name);
      registerType(rawType, {
        isVoid: true, // void return values can be optimized out sometimes
        name: name,
        'argPackAdvance': 0,
        'fromWireType': function () {
          return undefined;
        },
        'toWireType': function (destructors, o) {
          // TODO: assert if anything else is given?
          return undefined;
        },
      });
    }

    function _pthread_mutexattr_init() { }



    function _pthread_mutexattr_settype() { }

    function _abort() {
      Module['abort']();
    }

    function _pthread_once(ptr, func) {
      if (!_pthread_once.seen) _pthread_once.seen = {};
      if (ptr in _pthread_once.seen) return;
      Module['dynCall_v'](func);
      _pthread_once.seen[ptr] = 1;
    }




    function ClassHandle_isAliasOf(other) {
      if (!(this instanceof ClassHandle)) {
        return false;
      }
      if (!(other instanceof ClassHandle)) {
        return false;
      }

      var leftClass = this.$$.ptrType.registeredClass;
      var left = this.$$.ptr;
      var rightClass = other.$$.ptrType.registeredClass;
      var right = other.$$.ptr;

      while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass;
      }

      while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass;
      }

      return leftClass === rightClass && left === right;
    }


    function shallowCopyInternalPointer(o) {
      return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType,
      };
    }

    function throwInstanceAlreadyDeleted(obj) {
      function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name;
      }
      throwBindingError(getInstanceTypeName(obj) + ' instance already deleted');
    } function ClassHandle_clone() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }

      if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this;
      } else {
        var clone = Object.create(Object.getPrototypeOf(this), {
          $$: {
            value: shallowCopyInternalPointer(this.$$),
          }
        });

        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone;
      }
    }


    function runDestructor(handle) {
      var $$ = handle.$$;
      if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr);
      } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr);
      }
    } function ClassHandle_delete() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }

      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Object already scheduled for deletion');
      }

      this.$$.count.value -= 1;
      var toDelete = 0 === this.$$.count.value;
      if (toDelete) {
        runDestructor(this);
      }
      if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = undefined;
        this.$$.ptr = undefined;
      }
    }

    function ClassHandle_isDeleted() {
      return !this.$$.ptr;
    }


    var delayFunction = undefined;

    var deletionQueue = [];

    function flushPendingDeletes() {
      while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj['delete']();
      }
    } function ClassHandle_deleteLater() {
      if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this);
      }
      if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError('Object already scheduled for deletion');
      }
      deletionQueue.push(this);
      if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
      this.$$.deleteScheduled = true;
      return this;
    } function init_ClassHandle() {
      ClassHandle.prototype['isAliasOf'] = ClassHandle_isAliasOf;
      ClassHandle.prototype['clone'] = ClassHandle_clone;
      ClassHandle.prototype['delete'] = ClassHandle_delete;
      ClassHandle.prototype['isDeleted'] = ClassHandle_isDeleted;
      ClassHandle.prototype['deleteLater'] = ClassHandle_deleteLater;
    } function ClassHandle() {
    }

    var registeredPointers = {};

    function RegisteredClass(
      name,
      constructor,
      instancePrototype,
      rawDestructor,
      baseClass,
      getActualType,
      upcast,
      downcast
    ) {
      this.name = name;
      this.constructor = constructor;
      this.instancePrototype = instancePrototype;
      this.rawDestructor = rawDestructor;
      this.baseClass = baseClass;
      this.getActualType = getActualType;
      this.upcast = upcast;
      this.downcast = downcast;
      this.pureVirtualFunctions = [];
    }



    function upcastPointer(ptr, ptrClass, desiredClass) {
      while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
          throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass;
      }
      return ptr;
    } function constNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
      }

      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }

    function genericPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }

        if (this.isSmartPointer) {
          var ptr = this.rawConstructor();
          if (destructors !== null) {
            destructors.push(this.rawDestructor, ptr);
          }
          return ptr;
        } else {
          return 0;
        }
      }

      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);

      if (this.isSmartPointer) {
        // TODO: this is not strictly true
        // We could support BY_EMVAL conversions from raw pointers to smart pointers
        // because the smart pointer can hold a reference to the handle
        if (undefined === handle.$$.smartPtr) {
          throwBindingError('Passing raw pointer to smart pointer is illegal');
        }

        switch (this.sharingPolicy) {
          case 0: // NONE
            // no upcasting
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              throwBindingError('Cannot convert argument of type ' + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + ' to parameter type ' + this.name);
            }
            break;

          case 1: // INTRUSIVE
            ptr = handle.$$.smartPtr;
            break;

          case 2: // BY_EMVAL
            if (handle.$$.smartPtrType === this) {
              ptr = handle.$$.smartPtr;
            } else {
              var clonedHandle = handle['clone']();
              ptr = this.rawShare(
                ptr,
                __emval_register(function () {
                  clonedHandle['delete']();
                })
              );
              if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr);
              }
            }
            break;

          default:
            throwBindingError('Unsupporting sharing policy');
        }
      }
      return ptr;
    }

    function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
      if (handle === null) {
        if (this.isReference) {
          throwBindingError('null is not a valid ' + this.name);
        }
        return 0;
      }

      if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
      }
      if (!handle.$$.ptr) {
        throwBindingError('Cannot pass deleted object as a pointer of type ' + this.name);
      }
      if (handle.$$.ptrType.isConst) {
        throwBindingError('Cannot convert argument of type ' + handle.$$.ptrType.name + ' to parameter type ' + this.name);
      }
      var handleClass = handle.$$.ptrType.registeredClass;
      var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
      return ptr;
    }


    function RegisteredPointer_getPointee(ptr) {
      if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr);
      }
      return ptr;
    }

    function RegisteredPointer_destructor(ptr) {
      if (this.rawDestructor) {
        this.rawDestructor(ptr);
      }
    }

    function RegisteredPointer_deleteObject(handle) {
      if (handle !== null) {
        handle['delete']();
      }
    }


    function downcastPointer(ptr, ptrClass, desiredClass) {
      if (ptrClass === desiredClass) {
        return ptr;
      }
      if (undefined === desiredClass.baseClass) {
        return null; // no conversion
      }

      var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
      if (rv === null) {
        return null;
      }
      return desiredClass.downcast(rv);
    }




    function getInheritedInstanceCount() {
      return Object.keys(registeredInstances).length;
    }

    function getLiveInheritedInstances() {
      var rv = [];
      for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
          rv.push(registeredInstances[k]);
        }
      }
      return rv;
    }

    function setDelayFunction(fn) {
      delayFunction = fn;
      if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes);
      }
    } function init_embind() {
      Module['getInheritedInstanceCount'] = getInheritedInstanceCount;
      Module['getLiveInheritedInstances'] = getLiveInheritedInstances;
      Module['flushPendingDeletes'] = flushPendingDeletes;
      Module['setDelayFunction'] = setDelayFunction;
    } var registeredInstances = {};

    function getBasestPointer(class_, ptr) {
      if (ptr === undefined) {
        throwBindingError('ptr should not be undefined');
      }
      while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass;
      }
      return ptr;
    } function getInheritedInstance(class_, ptr) {
      ptr = getBasestPointer(class_, ptr);
      return registeredInstances[ptr];
    }

    function makeClassHandle(prototype, record) {
      if (!record.ptrType || !record.ptr) {
        throwInternalError('makeClassHandle requires ptr and ptrType');
      }
      var hasSmartPtrType = !!record.smartPtrType;
      var hasSmartPtr = !!record.smartPtr;
      if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError('Both smartPtrType and smartPtr must be specified');
      }
      record.count = { value: 1 };
      return Object.create(prototype, {
        $$: {
          value: record,
        },
      });
    } function RegisteredPointer_fromWireType(ptr) {
      // ptr is a raw pointer (or a raw smartpointer)

      // rawPointer is a maybe-null raw pointer
      var rawPointer = this.getPointee(ptr);
      if (!rawPointer) {
        this.destructor(ptr);
        return null;
      }

      var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
      if (undefined !== registeredInstance) {
        // JS object has been neutered, time to repopulate it
        if (0 === registeredInstance.$$.count.value) {
          registeredInstance.$$.ptr = rawPointer;
          registeredInstance.$$.smartPtr = ptr;
          return registeredInstance['clone']();
        } else {
          // else, just increment reference count on existing object
          // it already has a reference to the smart pointer
          var rv = registeredInstance['clone']();
          this.destructor(ptr);
          return rv;
        }
      }

      function makeDefaultHandle() {
        if (this.isSmartPointer) {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this.pointeeType,
            ptr: rawPointer,
            smartPtrType: this,
            smartPtr: ptr,
          });
        } else {
          return makeClassHandle(this.registeredClass.instancePrototype, {
            ptrType: this,
            ptr: ptr,
          });
        }
      }

      var actualType = this.registeredClass.getActualType(rawPointer);
      var registeredPointerRecord = registeredPointers[actualType];
      if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this);
      }

      var toType;
      if (this.isConst) {
        toType = registeredPointerRecord.constPointerType;
      } else {
        toType = registeredPointerRecord.pointerType;
      }
      var dp = downcastPointer(
        rawPointer,
        this.registeredClass,
        toType.registeredClass);
      if (dp === null) {
        return makeDefaultHandle.call(this);
      }
      if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
          smartPtrType: this,
          smartPtr: ptr,
        });
      } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
          ptrType: toType,
          ptr: dp,
        });
      }
    } function init_RegisteredPointer() {
      RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
      RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
      RegisteredPointer.prototype['argPackAdvance'] = 8;
      RegisteredPointer.prototype['readValueFromPointer'] = simpleReadValueFromPointer;
      RegisteredPointer.prototype['deleteObject'] = RegisteredPointer_deleteObject;
      RegisteredPointer.prototype['fromWireType'] = RegisteredPointer_fromWireType;
    } function RegisteredPointer(
      name,
      registeredClass,
      isReference,
      isConst,

      // smart pointer properties
      isSmartPointer,
      pointeeType,
      sharingPolicy,
      rawGetPointee,
      rawConstructor,
      rawShare,
      rawDestructor
    ) {
      this.name = name;
      this.registeredClass = registeredClass;
      this.isReference = isReference;
      this.isConst = isConst;

      // smart pointer properties
      this.isSmartPointer = isSmartPointer;
      this.pointeeType = pointeeType;
      this.sharingPolicy = sharingPolicy;
      this.rawGetPointee = rawGetPointee;
      this.rawConstructor = rawConstructor;
      this.rawShare = rawShare;
      this.rawDestructor = rawDestructor;

      if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
          this['toWireType'] = constNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        } else {
          this['toWireType'] = nonConstNoSmartPtrRawPointerToWireType;
          this.destructorFunction = null;
        }
      } else {
        this['toWireType'] = genericPointerToWireType;
        // Here we must leave this.destructorFunction undefined, since whether genericPointerToWireType returns
        // a pointer that needs to be freed up is runtime-dependent, and cannot be evaluated at registration time.
        // TODO: Create an alternative mechanism that allows removing the use of var destructors = []; array in
        //       craftInvokerFunction altogether.
      }
    }

    function replacePublicSymbol(name, value, numArguments) {
      if (!Module.hasOwnProperty(name)) {
        throwInternalError('Replacing nonexistant public symbol');
      }
      // If there's an overload table for this symbol, replace the symbol in the overload table instead.
      if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value;
      }
      else {
        Module[name] = value;
        Module[name].argCount = numArguments;
      }
    }

    function requireFunction(signature, rawFunction) {
      signature = readLatin1String(signature);

      function makeDynCaller(dynCall) {
        var args = [];
        for (var i = 1; i < signature.length; ++i) {
          args.push('a' + i);
        }

        var name = 'dynCall_' + signature + '_' + rawFunction;
        var body = 'return function ' + name + '(' + args.join(', ') + ') {\n';
        body += '    return dynCall(rawFunction' + (args.length ? ', ' : '') + args.join(', ') + ');\n';
        body += '};\n';

        return (new Function('dynCall', 'rawFunction', body))(dynCall, rawFunction);
      }

      var fp;
      if (Module['FUNCTION_TABLE_' + signature] !== undefined) {
        fp = Module['FUNCTION_TABLE_' + signature][rawFunction];
      } else if (typeof FUNCTION_TABLE !== "undefined") {
        fp = FUNCTION_TABLE[rawFunction];
      } else {
        // asm.js does not give direct access to the function tables,
        // and thus we must go through the dynCall interface which allows
        // calling into a signature's function table by pointer value.
        //
        // https://github.com/dherman/asm.js/issues/83
        //
        // This has three main penalties:
        // - dynCall is another function call in the path from JavaScript to C++.
        // - JITs may not predict through the function table indirection at runtime.
        var dc = Module["asm"]['dynCall_' + signature];
        if (dc === undefined) {
          // We will always enter this branch if the signature
          // contains 'f' and PRECISE_F32 is not enabled.
          //
          // Try again, replacing 'f' with 'd'.
          dc = Module["asm"]['dynCall_' + signature.replace(/f/g, 'd')];
          if (dc === undefined) {
            throwBindingError("No dynCall invoker for signature: " + signature);
          }
        }
        fp = makeDynCaller(dc);
      }

      if (typeof fp !== "function") {
        throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
      }
      return fp;
    }


    var UnboundTypeError = undefined; function throwUnboundTypeError(message, types) {
      var unboundTypes = [];
      var seen = {};
      function visit(type) {
        if (seen[type]) {
          return;
        }
        if (registeredTypes[type]) {
          return;
        }
        if (typeDependencies[type]) {
          typeDependencies[type].forEach(visit);
          return;
        }
        unboundTypes.push(type);
        seen[type] = true;
      }
      types.forEach(visit);

      throw new UnboundTypeError(message + ': ' + unboundTypes.map(getTypeName).join([', ']));
    } function __embind_register_class(
      rawType,
      rawPointerType,
      rawConstPointerType,
      baseClassRawType,
      getActualTypeSignature,
      getActualType,
      upcastSignature,
      upcast,
      downcastSignature,
      downcast,
      name,
      destructorSignature,
      rawDestructor
    ) {
      name = readLatin1String(name);
      getActualType = requireFunction(getActualTypeSignature, getActualType);
      if (upcast) {
        upcast = requireFunction(upcastSignature, upcast);
      }
      if (downcast) {
        downcast = requireFunction(downcastSignature, downcast);
      }
      rawDestructor = requireFunction(destructorSignature, rawDestructor);
      var legalFunctionName = makeLegalFunctionName(name);

      exposePublicSymbol(legalFunctionName, function () {
        // this code cannot run if baseClassRawType is zero
        throwUnboundTypeError('Cannot construct ' + name + ' due to unbound types', [baseClassRawType]);
      });

      whenDependentTypesAreResolved(
        [rawType, rawPointerType, rawConstPointerType],
        baseClassRawType ? [baseClassRawType] : [],
        function (base) {
          base = base[0];

          var baseClass;
          var basePrototype;
          if (baseClassRawType) {
            baseClass = base.registeredClass;
            basePrototype = baseClass.instancePrototype;
          } else {
            basePrototype = ClassHandle.prototype;
          }

          var constructor = createNamedFunction(legalFunctionName, function () {
            if (Object.getPrototypeOf(this) !== instancePrototype) {
              throw new BindingError("Use 'new' to construct " + name);
            }
            if (undefined === registeredClass.constructor_body) {
              throw new BindingError(name + " has no accessible constructor");
            }
            var body = registeredClass.constructor_body[arguments.length];
            if (undefined === body) {
              throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
            }
            return body.apply(this, arguments);
          });

          var instancePrototype = Object.create(basePrototype, {
            constructor: { value: constructor },
          });

          constructor.prototype = instancePrototype;

          var registeredClass = new RegisteredClass(
            name,
            constructor,
            instancePrototype,
            rawDestructor,
            baseClass,
            getActualType,
            upcast,
            downcast);

          var referenceConverter = new RegisteredPointer(
            name,
            registeredClass,
            true,
            false,
            false);

          var pointerConverter = new RegisteredPointer(
            name + '*',
            registeredClass,
            false,
            false,
            false);

          var constPointerConverter = new RegisteredPointer(
            name + ' const*',
            registeredClass,
            false,
            true,
            false);

          registeredPointers[rawType] = {
            pointerType: pointerConverter,
            constPointerType: constPointerConverter
          };

          replacePublicSymbol(legalFunctionName, constructor);

          return [referenceConverter, pointerConverter, constPointerConverter];
        }
      );
    }

    function ___lock() { }

    function ___unlock() { }

    function _pthread_getspecific(key) {
      return PTHREAD_SPECIFIC[key] || 0;
    }


    function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    } function _exit(status) {
      __exit(status);
    }

    function _pthread_setspecific(key, value) {
      if (!(key in PTHREAD_SPECIFIC)) {
        return ERRNO_CODES.EINVAL;
      }
      PTHREAD_SPECIFIC[key] = value;
      return 0;
    }

    function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }

    function ___cxa_pure_virtual() {
      ABORT = true;
      throw 'Pure virtual function called!';
    }

    var _llvm_ctlz_i32 = true;


    function floatReadValueFromPointer(name, shift) {
      switch (shift) {
        case 2: return function (pointer) {
          return this['fromWireType'](HEAPF32[pointer >> 2]);
        };
        case 3: return function (pointer) {
          return this['fromWireType'](HEAPF64[pointer >> 3]);
        };
        default:
          throw new TypeError("Unknown float type: " + name);
      }
    } function __embind_register_float(rawType, name, size) {
      var shift = getShiftFromSize(size);
      name = readLatin1String(name);
      registerType(rawType, {
        name: name,
        'fromWireType': function (value) {
          return value;
        },
        'toWireType': function (destructors, value) {
          // todo: Here we have an opportunity for -O3 level "unsafe" optimizations: we could
          // avoid the following if() and assume value is of proper type.
          if (typeof value !== "number" && typeof value !== "boolean") {
            throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
          }
          return value;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': floatReadValueFromPointer(name, shift),
        destructorFunction: null, // This type does not need a destructor
      });
    }

    function ___cxa_begin_catch(ptr) {
      var info = EXCEPTIONS.infos[ptr];
      if (info && !info.caught) {
        info.caught = true;
        __ZSt18uncaught_exceptionv.uncaught_exception--;
      }
      if (info) info.rethrown = false;
      EXCEPTIONS.caught.push(ptr);
      EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
      return ptr;
    }

    function ___syscall140(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        // llseek
        var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
        // NOTE: offset_high is unused - Emscripten's off_t is 32-bit
        var offset = offset_low;
        FS.llseek(stream, offset, whence);
        HEAP32[((result) >> 2)] = stream.position;
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }

    function ___syscall6(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        // close
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0;
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }


    function __embind_register_std_wstring(rawType, charSize, name) {
      // nb. do not cache HEAPU16 and HEAPU32, they may be destroyed by enlargeMemory().
      name = readLatin1String(name);
      var getHeap, shift;
      if (charSize === 2) {
        getHeap = function () { return HEAPU16; };
        shift = 1;
      } else if (charSize === 4) {
        getHeap = function () { return HEAPU32; };
        shift = 2;
      }
      registerType(rawType, {
        name: name,
        'fromWireType': function (value) {
          var HEAP = getHeap();
          var length = HEAPU32[value >> 2];
          var a = new Array(length);
          var start = (value + 4) >> shift;
          for (var i = 0; i < length; ++i) {
            a[i] = String.fromCharCode(HEAP[start + i]);
          }
          _free(value);
          return a.join('');
        },
        'toWireType': function (destructors, value) {
          // assumes 4-byte alignment
          var HEAP = getHeap();
          var length = value.length;
          var ptr = _malloc(4 + length * charSize);
          HEAPU32[ptr >> 2] = length;
          var start = (ptr + 4) >> shift;
          for (var i = 0; i < length; ++i) {
            HEAP[start + i] = value.charCodeAt(i);
          }
          if (destructors !== null) {
            destructors.push(_free, ptr);
          }
          return ptr;
        },
        'argPackAdvance': 8,
        'readValueFromPointer': simpleReadValueFromPointer,
        destructorFunction: function (ptr) { _free(ptr); },
      });
    }


    function heap32VectorToArray(count, firstElement) {
      var array = [];
      for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i]);
      }
      return array;
    }

    function runDestructors(destructors) {
      while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr);
      }
    } function __embind_register_class_constructor(
      rawClassType,
      argCount,
      rawArgTypesAddr,
      invokerSignature,
      invoker,
      rawConstructor
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      invoker = requireFunction(invokerSignature, invoker);

      whenDependentTypesAreResolved([], [rawClassType], function (classType) {
        classType = classType[0];
        var humanName = 'constructor ' + classType.name;

        if (undefined === classType.registeredClass.constructor_body) {
          classType.registeredClass.constructor_body = [];
        }
        if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
          throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
        }
        classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
          throwUnboundTypeError('Cannot construct ' + classType.name + ' due to unbound types', rawArgTypes);
        };

        whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {
          classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
            if (arguments.length !== argCount - 1) {
              throwBindingError(humanName + ' called with ' + arguments.length + ' arguments, expected ' + (argCount - 1));
            }
            var destructors = [];
            var args = new Array(argCount);
            args[0] = rawConstructor;
            for (var i = 1; i < argCount; ++i) {
              args[i] = argTypes[i]['toWireType'](destructors, arguments[i - 1]);
            }

            var ptr = invoker.apply(null, args);
            runDestructors(destructors);

            return argTypes[0]['fromWireType'](ptr);
          };
          return [];
        });
        return [];
      });
    }



    function new_(constructor, argumentList) {
      if (!(constructor instanceof Function)) {
        throw new TypeError('new_ called with constructor type ' + typeof (constructor) + " which is not a function");
      }

      /*
       * Previously, the following line was just:
   
       function dummy() {};
   
       * Unfortunately, Chrome was preserving 'dummy' as the object's name, even though at creation, the 'dummy' has the
       * correct constructor name.  Thus, objects created with IMVU.new would show up in the debugger as 'dummy', which
       * isn't very helpful.  Using IMVU.createNamedFunction addresses the issue.  Doublely-unfortunately, there's no way
       * to write a test for this behavior.  -NRD 2013.02.22
       */
      var dummy = createNamedFunction(constructor.name || 'unknownFunctionName', function () { });
      dummy.prototype = constructor.prototype;
      var obj = new dummy;

      var r = constructor.apply(obj, argumentList);
      return (r instanceof Object) ? r : obj;
    } function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
      // humanName: a human-readable string name for the function to be generated.
      // argTypes: An array that contains the embind type objects for all types in the function signature.
      //    argTypes[0] is the type object for the function return value.
      //    argTypes[1] is the type object for function this object/class type, or null if not crafting an invoker for a class method.
      //    argTypes[2...] are the actual function parameters.
      // classType: The embind type object for the class to be bound, or null if this is not a method of a class.
      // cppInvokerFunc: JS Function object to the C++-side function that interops into C++ code.
      // cppTargetFunc: Function pointer (an integer to FUNCTION_TABLE) to the target C++ function the cppInvokerFunc will end up calling.
      var argCount = argTypes.length;

      if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
      }

      var isClassMethodFunc = (argTypes[1] !== null && classType !== null);

      // Free functions with signature "void function()" do not need an invoker that marshalls between wire types.
      // TODO: This omits argument count check - enable only at -O3 or similar.
      //    if (ENABLE_UNSAFE_OPTS && argCount == 2 && argTypes[0].name == "void" && !isClassMethodFunc) {
      //       return FUNCTION_TABLE[fn];
      //    }

      var argsList = "";
      var argsListWired = "";
      for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i !== 0 ? ", " : "") + "arg" + i;
        argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
      }

      var invokerFnBody =
        "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" +
        "if (arguments.length !== " + (argCount - 2) + ") {\n" +
        "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" +
        "}\n";


      // Determine if we need to use a dynamic stack to store the destructors for the function parameters.
      // TODO: Remove this completely once all function invokers are being dynamically generated.
      var needsDestructorStack = false;

      for (var i = 1; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here.
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) { // The type does not define a destructor function - must use dynamic stack
          needsDestructorStack = true;
          break;
        }
      }

      if (needsDestructorStack) {
        invokerFnBody +=
          "var destructors = [];\n";
      }

      var dtorStack = needsDestructorStack ? "destructors" : "null";
      var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
      var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];


      if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
      }

      for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
        args1.push("argType" + i);
        args2.push(argTypes[i + 2]);
      }

      if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
      }

      var returns = (argTypes[0].name !== "void");

      invokerFnBody +=
        (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";

      if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n";
      } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) { // Skip return value at index 0 - it's not deleted here. Also skip class type if not a method.
          var paramName = (i === 1 ? "thisWired" : ("arg" + (i - 2) + "Wired"));
          if (argTypes[i].destructorFunction !== null) {
            invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
            args1.push(paramName + "_dtor");
            args2.push(argTypes[i].destructorFunction);
          }
        }
      }

      if (returns) {
        invokerFnBody += "var ret = retType.fromWireType(rv);\n" +
          "return ret;\n";
      } else {
      }
      invokerFnBody += "}\n";

      args1.push(invokerFnBody);

      var invokerFunction = new_(Function, args1).apply(null, args2);
      return invokerFunction;
    } function __embind_register_class_function(
      rawClassType,
      methodName,
      argCount,
      rawArgTypesAddr, // [ReturnType, ThisType, Args...]
      invokerSignature,
      rawInvoker,
      context,
      isPureVirtual
    ) {
      var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
      methodName = readLatin1String(methodName);
      rawInvoker = requireFunction(invokerSignature, rawInvoker);

      whenDependentTypesAreResolved([], [rawClassType], function (classType) {
        classType = classType[0];
        var humanName = classType.name + '.' + methodName;

        if (isPureVirtual) {
          classType.registeredClass.pureVirtualFunctions.push(methodName);
        }

        function unboundTypesHandler() {
          throwUnboundTypeError('Cannot call ' + humanName + ' due to unbound types', rawArgTypes);
        }

        var proto = classType.registeredClass.instancePrototype;
        var method = proto[methodName];
        if (undefined === method || (undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2)) {
          // This is the first overload to be registered, OR we are replacing a function in the base class with a function in the derived class.
          unboundTypesHandler.argCount = argCount - 2;
          unboundTypesHandler.className = classType.name;
          proto[methodName] = unboundTypesHandler;
        } else {
          // There was an existing function with the same name registered. Set up a function overload routing table.
          ensureOverloadTable(proto, methodName, humanName);
          proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
        }

        whenDependentTypesAreResolved([], rawArgTypes, function (argTypes) {

          var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);

          // Replace the initial unbound-handler-stub function with the appropriate member function, now that all types
          // are resolved. If multiple overloads are registered for this function, the function goes into an overload table.
          if (undefined === proto[methodName].overloadTable) {
            // Set argCount in case an overload is registered later
            memberFunction.argCount = argCount - 2;
            proto[methodName] = memberFunction;
          } else {
            proto[methodName].overloadTable[argCount - 2] = memberFunction;
          }

          return [];
        });
        return [];
      });
    }

    function ___syscall146(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        // writev
        var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
        return SYSCALLS.doWritev(stream, iov, iovcnt);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }

    function ___syscall145(which, varargs) {
      SYSCALLS.varargs = varargs;
      try {
        // readv
        var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt);
      } catch (e) {
        if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
        return -e.errno;
      }
    }

    var ___dso_handle = STATICTOP; STATICTOP += 16;;
    embind_init_charCodes();
    BindingError = Module['BindingError'] = extendError(Error, 'BindingError');;
    InternalError = Module['InternalError'] = extendError(Error, 'InternalError');;
    init_emval();;
    FS.staticInit(); __ATINIT__.unshift(function () { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() }); __ATMAIN__.push(function () { FS.ignorePermissions = false }); __ATEXIT__.push(function () { FS.quit() }); Module["FS_createFolder"] = FS.createFolder; Module["FS_createPath"] = FS.createPath; Module["FS_createDataFile"] = FS.createDataFile; Module["FS_createPreloadedFile"] = FS.createPreloadedFile; Module["FS_createLazyFile"] = FS.createLazyFile; Module["FS_createLink"] = FS.createLink; Module["FS_createDevice"] = FS.createDevice; Module["FS_unlink"] = FS.unlink;;
    __ATINIT__.unshift(function () { TTY.init() }); __ATEXIT__.push(function () { TTY.shutdown() });;
    if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); };
    ___buildEnvironment(ENV);;
    init_ClassHandle();
    init_RegisteredPointer();
    init_embind();;
    UnboundTypeError = Module['UnboundTypeError'] = extendError(Error, 'UnboundTypeError');;
    DYNAMICTOP_PTR = allocate(1, "i32", ALLOC_STATIC);

    STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

    STACK_MAX = STACK_BASE + TOTAL_STACK;

    DYNAMIC_BASE = Runtime.alignMemory(STACK_MAX);

    HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;

    staticSealed = true; // seal the static portion of memory


    Module['wasmTableSize'] = 3304;

    Module['wasmMaxTableSize'] = 3304;

    function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
      try {
        return Module["dynCall_iiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiii(index, a1, a2, a3) {
      try {
        return Module["dynCall_iiii"](index, a1, a2, a3);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
      try {
        Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_viiiii(index, a1, a2, a3, a4, a5) {
      try {
        Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
      try {
        Module["dynCall_viiiiiii"](index, a1, a2, a3, a4, a5, a6, a7);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiiiid(index, a1, a2, a3, a4, a5, a6) {
      try {
        return Module["dynCall_iiiiiid"](index, a1, a2, a3, a4, a5, a6);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_i(index) {
      try {
        return Module["dynCall_i"](index);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_vi(index, a1) {
      try {
        Module["dynCall_vi"](index, a1);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_vii(index, a1, a2) {
      try {
        Module["dynCall_vii"](index, a1, a2);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
      try {
        return Module["dynCall_iiiiiii"](index, a1, a2, a3, a4, a5, a6);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_ii(index, a1) {
      try {
        return Module["dynCall_ii"](index, a1);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_viijii(index, a1, a2, a3, a4, a5, a6) {
      try {
        Module["dynCall_viijii"](index, a1, a2, a3, a4, a5, a6);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiiij(index, a1, a2, a3, a4, a5, a6) {
      try {
        return Module["dynCall_iiiiij"](index, a1, a2, a3, a4, a5, a6);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_viii(index, a1, a2, a3) {
      try {
        Module["dynCall_viii"](index, a1, a2, a3);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_v(index) {
      try {
        Module["dynCall_v"](index);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
      try {
        return Module["dynCall_iiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiii(index, a1, a2, a3, a4) {
      try {
        return Module["dynCall_iiiii"](index, a1, a2, a3, a4);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_viiii(index, a1, a2, a3, a4) {
      try {
        Module["dynCall_viiii"](index, a1, a2, a3, a4);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iii(index, a1, a2) {
      try {
        return Module["dynCall_iii"](index, a1, a2);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
      try {
        return Module["dynCall_iiiiid"](index, a1, a2, a3, a4, a5);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
      try {
        return Module["dynCall_iiiiii"](index, a1, a2, a3, a4, a5);
      } catch (e) {
        if (typeof e !== 'number' && e !== 'longjmp') throw e;
        Module["setThrew"](1, 0);
      }
    }

    Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity, "byteLength": byteLength };

    Module.asmLibraryArg = { "abort": abort, "assert": assert, "enlargeMemory": enlargeMemory, "getTotalMemory": getTotalMemory, "abortOnCannotGrowMemory": abortOnCannotGrowMemory, "invoke_iiiiiiii": invoke_iiiiiiii, "invoke_iiii": invoke_iiii, "invoke_viiiiii": invoke_viiiiii, "invoke_viiiii": invoke_viiiii, "invoke_viiiiiii": invoke_viiiiiii, "invoke_iiiiiid": invoke_iiiiiid, "invoke_i": invoke_i, "invoke_vi": invoke_vi, "invoke_vii": invoke_vii, "invoke_iiiiiii": invoke_iiiiiii, "invoke_ii": invoke_ii, "invoke_viijii": invoke_viijii, "invoke_iiiiij": invoke_iiiiij, "invoke_viii": invoke_viii, "invoke_v": invoke_v, "invoke_iiiiiiiii": invoke_iiiiiiiii, "invoke_iiiii": invoke_iiiii, "invoke_viiii": invoke_viiii, "invoke_iii": invoke_iii, "invoke_iiiiid": invoke_iiiiid, "invoke_iiiiii": invoke_iiiiii, "floatReadValueFromPointer": floatReadValueFromPointer, "simpleReadValueFromPointer": simpleReadValueFromPointer, "throwInternalError": throwInternalError, "get_first_emval": get_first_emval, "getLiveInheritedInstances": getLiveInheritedInstances, "___assert_fail": ___assert_fail, "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv, "ClassHandle": ClassHandle, "getShiftFromSize": getShiftFromSize, "__addDays": __addDays, "___cxa_begin_catch": ___cxa_begin_catch, "_emscripten_memcpy_big": _emscripten_memcpy_big, "runDestructor": runDestructor, "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted, "__embind_register_std_string": __embind_register_std_string, "init_RegisteredPointer": init_RegisteredPointer, "ClassHandle_isAliasOf": ClassHandle_isAliasOf, "flushPendingDeletes": flushPendingDeletes, "_pthread_mutexattr_settype": _pthread_mutexattr_settype, "makeClassHandle": makeClassHandle, "whenDependentTypesAreResolved": whenDependentTypesAreResolved, "__embind_register_class_constructor": __embind_register_class_constructor, "___cxa_atexit": ___cxa_atexit, "init_ClassHandle": init_ClassHandle, "___syscall140": ___syscall140, "ClassHandle_clone": ClassHandle_clone, "___syscall145": ___syscall145, "___syscall146": ___syscall146, "RegisteredClass": RegisteredClass, "___cxa_find_matching_catch": ___cxa_find_matching_catch, "embind_init_charCodes": embind_init_charCodes, "___setErrNo": ___setErrNo, "__embind_register_bool": __embind_register_bool, "___resumeException": ___resumeException, "createNamedFunction": createNamedFunction, "___syscall91": ___syscall91, "___buildEnvironment": ___buildEnvironment, "__emval_decref": __emval_decref, "_pthread_once": _pthread_once, "init_embind": init_embind, "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType, "heap32VectorToArray": heap32VectorToArray, "ClassHandle_delete": ClassHandle_delete, "___lock": ___lock, "___syscall6": ___syscall6, "ensureOverloadTable": ensureOverloadTable, "__embind_register_emval": __embind_register_emval, "new_": new_, "downcastPointer": downcastPointer, "_exit": _exit, "replacePublicSymbol": replacePublicSymbol, "__embind_register_class": __embind_register_class, "_llvm_pow_f64": _llvm_pow_f64, "ClassHandle_deleteLater": ClassHandle_deleteLater, "___syscall54": ___syscall54, "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject, "ClassHandle_isDeleted": ClassHandle_isDeleted, "__embind_register_integer": __embind_register_integer, "___cxa_allocate_exception": ___cxa_allocate_exception, "__emval_take_value": __emval_take_value, "__isLeapYear": __isLeapYear, "enumReadValueFromPointer": enumReadValueFromPointer, "_embind_repr": _embind_repr, "_pthread_getspecific": _pthread_getspecific, "RegisteredPointer": RegisteredPointer, "_pthread_mutex_destroy": _pthread_mutex_destroy, "_getenv": _getenv, "runDestructors": runDestructors, "requireRegisteredType": requireRegisteredType, "makeLegalFunctionName": makeLegalFunctionName, "_pthread_key_create": _pthread_key_create, "upcastPointer": upcastPointer, "init_emval": init_emval, "shallowCopyInternalPointer": shallowCopyInternalPointer, "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType, "_abort": _abort, "throwBindingError": throwBindingError, "getTypeName": getTypeName, "exposePublicSymbol": exposePublicSymbol, "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType, "___cxa_pure_virtual": ___cxa_pure_virtual, "_strftime": _strftime, "_pthread_cond_wait": _pthread_cond_wait, "RegisteredPointer_destructor": RegisteredPointer_destructor, "__embind_register_memory_view": __embind_register_memory_view, "getInheritedInstance": getInheritedInstance, "setDelayFunction": setDelayFunction, "___gxx_personality_v0": ___gxx_personality_v0, "extendError": extendError, "__embind_register_void": __embind_register_void, "_strftime_l": _strftime_l, "RegisteredPointer_getPointee": RegisteredPointer_getPointee, "__emval_register": __emval_register, "__embind_register_std_wstring": __embind_register_std_wstring, "__embind_register_class_function": __embind_register_class_function, "__exit": __exit, "throwUnboundTypeError": throwUnboundTypeError, "__arraySum": __arraySum, "__emval_incref": __emval_incref, "readLatin1String": readLatin1String, "craftInvokerFunction": craftInvokerFunction, "getBasestPointer": getBasestPointer, "getInheritedInstanceCount": getInheritedInstanceCount, "__embind_register_float": __embind_register_float, "integerReadValueFromPointer": integerReadValueFromPointer, "___unlock": ___unlock, "__embind_register_enum_value": __embind_register_enum_value, "_pthread_mutexattr_init": _pthread_mutexattr_init, "_pthread_setspecific": _pthread_setspecific, "genericPointerToWireType": genericPointerToWireType, "registerType": registerType, "___cxa_throw": ___cxa_throw, "__embind_register_enum": __embind_register_enum, "count_emval_handles": count_emval_handles, "requireFunction": requireFunction, "_atexit": _atexit, "_pthread_mutex_init": _pthread_mutex_init, "___map_file": ___map_file, "DYNAMICTOP_PTR": DYNAMICTOP_PTR, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "___dso_handle": ___dso_handle };
    // EMSCRIPTEN_START_ASM
    var asm = Module["asm"]// EMSCRIPTEN_END_ASM
      (Module.asmGlobalArg, Module.asmLibraryArg, buffer);

    Module["asm"] = asm;
    var stackSave = Module["stackSave"] = function () { return Module["asm"]["stackSave"].apply(null, arguments) };
    var setThrew = Module["setThrew"] = function () { return Module["asm"]["setThrew"].apply(null, arguments) };
    var __GLOBAL__sub_I_shaderc_js_cpp = Module["__GLOBAL__sub_I_shaderc_js_cpp"] = function () { return Module["asm"]["__GLOBAL__sub_I_shaderc_js_cpp"].apply(null, arguments) };
    var _fflush = Module["_fflush"] = function () { return Module["asm"]["_fflush"].apply(null, arguments) };
    var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function () { return Module["asm"]["___cxa_is_pointer_type"].apply(null, arguments) };
    var _memset = Module["_memset"] = function () { return Module["asm"]["_memset"].apply(null, arguments) };
    var __GLOBAL__sub_I_doc_cpp = Module["__GLOBAL__sub_I_doc_cpp"] = function () { return Module["asm"]["__GLOBAL__sub_I_doc_cpp"].apply(null, arguments) };
    var _sbrk = Module["_sbrk"] = function () { return Module["asm"]["_sbrk"].apply(null, arguments) };
    var _memcpy = Module["_memcpy"] = function () { return Module["asm"]["_memcpy"].apply(null, arguments) };
    var _llvm_bswap_i32 = Module["_llvm_bswap_i32"] = function () { return Module["asm"]["_llvm_bswap_i32"].apply(null, arguments) };
    var stackAlloc = Module["stackAlloc"] = function () { return Module["asm"]["stackAlloc"].apply(null, arguments) };
    var getTempRet0 = Module["getTempRet0"] = function () { return Module["asm"]["getTempRet0"].apply(null, arguments) };
    var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = function () { return Module["asm"]["__GLOBAL__sub_I_bind_cpp"].apply(null, arguments) };
    var setTempRet0 = Module["setTempRet0"] = function () { return Module["asm"]["setTempRet0"].apply(null, arguments) };
    var _pthread_mutex_unlock = Module["_pthread_mutex_unlock"] = function () { return Module["asm"]["_pthread_mutex_unlock"].apply(null, arguments) };
    var __GLOBAL__I_000101 = Module["__GLOBAL__I_000101"] = function () { return Module["asm"]["__GLOBAL__I_000101"].apply(null, arguments) };
    var _emscripten_get_global_libc = Module["_emscripten_get_global_libc"] = function () { return Module["asm"]["_emscripten_get_global_libc"].apply(null, arguments) };
    var ___getTypeName = Module["___getTypeName"] = function () { return Module["asm"]["___getTypeName"].apply(null, arguments) };
    var __GLOBAL__sub_I_iostream_cpp = Module["__GLOBAL__sub_I_iostream_cpp"] = function () { return Module["asm"]["__GLOBAL__sub_I_iostream_cpp"].apply(null, arguments) };
    var _pthread_cond_broadcast = Module["_pthread_cond_broadcast"] = function () { return Module["asm"]["_pthread_cond_broadcast"].apply(null, arguments) };
    var ___errno_location = Module["___errno_location"] = function () { return Module["asm"]["___errno_location"].apply(null, arguments) };
    var ___cxa_can_catch = Module["___cxa_can_catch"] = function () { return Module["asm"]["___cxa_can_catch"].apply(null, arguments) };
    var _free = Module["_free"] = function () { return Module["asm"]["_free"].apply(null, arguments) };
    var runPostSets = Module["runPostSets"] = function () { return Module["asm"]["runPostSets"].apply(null, arguments) };
    var establishStackSpace = Module["establishStackSpace"] = function () { return Module["asm"]["establishStackSpace"].apply(null, arguments) };
    var _memmove = Module["_memmove"] = function () { return Module["asm"]["_memmove"].apply(null, arguments) };
    var stackRestore = Module["stackRestore"] = function () { return Module["asm"]["stackRestore"].apply(null, arguments) };
    var _malloc = Module["_malloc"] = function () { return Module["asm"]["_malloc"].apply(null, arguments) };
    var _pthread_mutex_lock = Module["_pthread_mutex_lock"] = function () { return Module["asm"]["_pthread_mutex_lock"].apply(null, arguments) };
    var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = function () { return Module["asm"]["_emscripten_replace_memory"].apply(null, arguments) };
    var __GLOBAL__sub_I_SPVRemapper_cpp = Module["__GLOBAL__sub_I_SPVRemapper_cpp"] = function () { return Module["asm"]["__GLOBAL__sub_I_SPVRemapper_cpp"].apply(null, arguments) };
    var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function () { return Module["asm"]["dynCall_iiiiiiii"].apply(null, arguments) };
    var dynCall_iiii = Module["dynCall_iiii"] = function () { return Module["asm"]["dynCall_iiii"].apply(null, arguments) };
    var dynCall_viiiiii = Module["dynCall_viiiiii"] = function () { return Module["asm"]["dynCall_viiiiii"].apply(null, arguments) };
    var dynCall_viiiii = Module["dynCall_viiiii"] = function () { return Module["asm"]["dynCall_viiiii"].apply(null, arguments) };
    var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function () { return Module["asm"]["dynCall_viiiiiii"].apply(null, arguments) };
    var dynCall_iiiiiid = Module["dynCall_iiiiiid"] = function () { return Module["asm"]["dynCall_iiiiiid"].apply(null, arguments) };
    var dynCall_i = Module["dynCall_i"] = function () { return Module["asm"]["dynCall_i"].apply(null, arguments) };
    var dynCall_vi = Module["dynCall_vi"] = function () { return Module["asm"]["dynCall_vi"].apply(null, arguments) };
    var dynCall_vii = Module["dynCall_vii"] = function () { return Module["asm"]["dynCall_vii"].apply(null, arguments) };
    var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function () { return Module["asm"]["dynCall_iiiiiii"].apply(null, arguments) };
    var dynCall_ii = Module["dynCall_ii"] = function () { return Module["asm"]["dynCall_ii"].apply(null, arguments) };
    var dynCall_viijii = Module["dynCall_viijii"] = function () { return Module["asm"]["dynCall_viijii"].apply(null, arguments) };
    var dynCall_iiiiij = Module["dynCall_iiiiij"] = function () { return Module["asm"]["dynCall_iiiiij"].apply(null, arguments) };
    var dynCall_viii = Module["dynCall_viii"] = function () { return Module["asm"]["dynCall_viii"].apply(null, arguments) };
    var dynCall_v = Module["dynCall_v"] = function () { return Module["asm"]["dynCall_v"].apply(null, arguments) };
    var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function () { return Module["asm"]["dynCall_iiiiiiiii"].apply(null, arguments) };
    var dynCall_iiiii = Module["dynCall_iiiii"] = function () { return Module["asm"]["dynCall_iiiii"].apply(null, arguments) };
    var dynCall_viiii = Module["dynCall_viiii"] = function () { return Module["asm"]["dynCall_viiii"].apply(null, arguments) };
    var dynCall_iii = Module["dynCall_iii"] = function () { return Module["asm"]["dynCall_iii"].apply(null, arguments) };
    var dynCall_iiiiid = Module["dynCall_iiiiid"] = function () { return Module["asm"]["dynCall_iiiiid"].apply(null, arguments) };
    var dynCall_iiiiii = Module["dynCall_iiiiii"] = function () { return Module["asm"]["dynCall_iiiiii"].apply(null, arguments) };
    ;
    Runtime.stackAlloc = Module['stackAlloc'];
    Runtime.stackSave = Module['stackSave'];
    Runtime.stackRestore = Module['stackRestore'];
    Runtime.establishStackSpace = Module['establishStackSpace'];
    Runtime.setTempRet0 = Module['setTempRet0'];
    Runtime.getTempRet0 = Module['getTempRet0'];


    // === Auto-generated postamble setup entry stuff ===

    Module['asm'] = asm;



    if (memoryInitializer) {
      if (typeof Module['locateFile'] === 'function') {
        memoryInitializer = Module['locateFile'](memoryInitializer);
      } else if (Module['memoryInitializerPrefixURL']) {
        memoryInitializer = Module['memoryInitializerPrefixURL'] + memoryInitializer;
      }
      if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
        var data = Module['readBinary'](memoryInitializer);
        HEAPU8.set(data, Runtime.GLOBAL_BASE);
      } else {
        addRunDependency('memory initializer');
        var applyMemoryInitializer = function (data) {
          if (data.byteLength) data = new Uint8Array(data);
          HEAPU8.set(data, Runtime.GLOBAL_BASE);
          // Delete the typed array that contains the large blob of the memory initializer request response so that
          // we won't keep unnecessary memory lying around. However, keep the XHR object itself alive so that e.g.
          // its .status field can still be accessed later.
          if (Module['memoryInitializerRequest']) delete Module['memoryInitializerRequest'].response;
          removeRunDependency('memory initializer');
        }
        function doBrowserLoad() {
          Module['readAsync'](memoryInitializer, applyMemoryInitializer, function () {
            throw 'could not load memory initializer ' + memoryInitializer;
          });
        }
        if (Module['memoryInitializerRequest']) {
          // a network request has already been created, just use that
          function useRequest() {
            var request = Module['memoryInitializerRequest'];
            if (request.status !== 200 && request.status !== 0) {
              // If you see this warning, the issue may be that you are using locateFile or memoryInitializerPrefixURL, and defining them in JS. That
              // means that the HTML file doesn't know about them, and when it tries to create the mem init request early, does it to the wrong place.
              // Look in your browser's devtools network console to see what's going on.
              console.warn('a problem seems to have happened with Module.memoryInitializerRequest, status: ' + request.status + ', retrying ' + memoryInitializer);
              doBrowserLoad();
              return;
            }
            applyMemoryInitializer(request.response);
          }
          if (Module['memoryInitializerRequest'].response) {
            setTimeout(useRequest, 0); // it's already here; but, apply it asynchronously
          } else {
            Module['memoryInitializerRequest'].addEventListener('load', useRequest); // wait for it
          }
        } else {
          // fetch it from the network ourselves
          doBrowserLoad();
        }
      }
    }



    /**
     * @constructor
     * @extends {Error}
     */
    function ExitStatus(status) {
      this.name = "ExitStatus";
      this.message = "Program terminated with exit(" + status + ")";
      this.status = status;
    };
    ExitStatus.prototype = new Error();
    ExitStatus.prototype.constructor = ExitStatus;

    var initialStackTop;
    var preloadStartTime = null;
    var calledMain = false;

    dependenciesFulfilled = function runCaller() {
      // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
      if (!Module['calledRun']) run();
      if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
    }

    Module['callMain'] = Module.callMain = function callMain(args) {

      args = args || [];

      ensureInitRuntime();

      var argc = args.length + 1;
      function pad() {
        for (var i = 0; i < 4 - 1; i++) {
          argv.push(0);
        }
      }
      var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL)];
      pad();
      for (var i = 0; i < argc - 1; i = i + 1) {
        argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
        pad();
      }
      argv.push(0);
      argv = allocate(argv, 'i32', ALLOC_NORMAL);


      try {

        var ret = Module['_main'](argc, argv, 0);


        // if we're not running an evented main loop, it's time to exit
        exit(ret, /* implicit = */ true);
      }
      catch (e) {
        if (e instanceof ExitStatus) {
          // exit() throws this once it's done to make sure execution
          // has been stopped completely
          return;
        } else if (e == 'SimulateInfiniteLoop') {
          // running an evented main loop, don't immediately exit
          Module['noExitRuntime'] = true;
          return;
        } else {
          var toLog = e;
          if (e && typeof e === 'object' && e.stack) {
            toLog = [e, e.stack];
          }
          Module.printErr('exception thrown: ' + toLog);
          Module['quit'](1, e);
        }
      } finally {
        calledMain = true;
      }
    }




    /** @type {function(Array=)} */
    function run(args) {
      args = args || Module['arguments'];

      if (preloadStartTime === null) preloadStartTime = Date.now();

      if (runDependencies > 0) {
        return;
      }


      preRun();

      if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
      if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

      function doRun() {
        if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
        Module['calledRun'] = true;

        if (ABORT) return;

        ensureInitRuntime();

        preMain();


        if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

        if (Module['_main'] && shouldRunNow) Module['callMain'](args);

        postRun();
      }

      if (Module['setStatus']) {
        Module['setStatus']('Running...');
        setTimeout(function () {
          setTimeout(function () {
            Module['setStatus']('');
          }, 1);
          doRun();
        }, 1);
      } else {
        doRun();
      }
    }
    Module['run'] = Module.run = run;

    function exit(status, implicit) {
      if (implicit && Module['noExitRuntime']) {
        return;
      }

      if (Module['noExitRuntime']) {
      } else {

        ABORT = true;
        EXITSTATUS = status;
        STACKTOP = initialStackTop;

        exitRuntime();

        if (Module['onExit']) Module['onExit'](status);
      }

      if (ENVIRONMENT_IS_NODE) {
        process['exit'](status);
      }
      Module['quit'](status, new ExitStatus(status));
    }
    Module['exit'] = Module.exit = exit;

    var abortDecorators = [];

    function abort(what) {
      if (Module['onAbort']) {
        Module['onAbort'](what);
      }

      if (what !== undefined) {
        Module.print(what);
        Module.printErr(what);
        what = JSON.stringify(what)
      } else {
        what = '';
      }

      ABORT = true;
      EXITSTATUS = 1;

      var extra = '\nIf this abort() is unexpected, build with -s ASSERTIONS=1 which can give more information.';

      var output = 'abort(' + what + ') at ' + stackTrace() + extra;
      if (abortDecorators) {
        abortDecorators.forEach(function (decorator) {
          output = decorator(output, what);
        });
      }
      throw output;
    }
    Module['abort'] = Module.abort = abort;

    // {{PRE_RUN_ADDITIONS}}

    if (Module['preInit']) {
      if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
      while (Module['preInit'].length > 0) {
        Module['preInit'].pop()();
      }
    }

    // shouldRunNow refers to calling main(), not run().
    var shouldRunNow = true;
    if (Module['noInitialRun']) {
      shouldRunNow = false;
    }


    run();

    // {{POST_RUN_ADDITIONS}}





    // {{MODULE_ADDITIONS}}


    return returnPromise;
  };

  return Shaderc;
});
// export default Shaderc;
// window.Shaderc = Shaderc;
