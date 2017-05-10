var SPECTOR;
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var Event = (function () {
            function Event() {
                this.callbacks = [];
                this.counter = -1;
            }
            Event.prototype.add = function (callback, context) {
                this.counter++;
                if (context) {
                    callback = callback.bind(context);
                }
                this.callbacks[this.counter] = callback;
                return this.counter;
            };
            Event.prototype.remove = function (id) {
                delete this.callbacks[id];
            };
            Event.prototype.clear = function () {
                this.callbacks = {};
            };
            Event.prototype.trigger = function (value) {
                for (var key in this.callbacks) {
                    this.callbacks[key](value);
                }
            };
            return Event;
        }());
        Utils.Event = Event;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["noLog"] = 0] = "noLog";
        LogLevel[LogLevel["error"] = 1] = "error";
        LogLevel[LogLevel["warning"] = 2] = "warning";
        LogLevel[LogLevel["info"] = 3] = "info";
    })(LogLevel = SPECTOR.LogLevel || (SPECTOR.LogLevel = {}));
})(SPECTOR || (SPECTOR = {}));
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var ConsoleLogger = (function () {
            function ConsoleLogger(level) {
                if (level === void 0) { level = SPECTOR.LogLevel.warning; }
                this.level = level;
            }
            ConsoleLogger.prototype.setLevel = function (level) {
                this.level = level;
            };
            ConsoleLogger.prototype.error = function (msg) {
                var restOfMsg = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    restOfMsg[_i - 1] = arguments[_i];
                }
                if (this.level > 0) {
                    console.error(msg, restOfMsg);
                }
            };
            ConsoleLogger.prototype.warn = function (msg) {
                var restOfMsg = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    restOfMsg[_i - 1] = arguments[_i];
                }
                if (this.level > 1) {
                    console.warn(msg, restOfMsg);
                }
            };
            ConsoleLogger.prototype.info = function (msg) {
                var restOfMsg = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    restOfMsg[_i - 1] = arguments[_i];
                }
                if (this.level > 2) {
                    console.log(msg, restOfMsg);
                }
            };
            return ConsoleLogger;
        }());
        Utils.ConsoleLogger = ConsoleLogger;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var StackTrace = (function () {
            function StackTrace() {
            }
            StackTrace.prototype.getStackTrace = function (removeFirstNCalls, removeLastNCalls) {
                if (removeFirstNCalls === void 0) { removeFirstNCalls = 0; }
                if (removeLastNCalls === void 0) { removeLastNCalls = 0; }
                var callstack = [];
                try {
                    throw new Error();
                }
                catch (err) {
                    if (err.stack) {
                        var lines = err.stack.split('\n');
                        for (var i = 0, len = lines.length; i < len; i++) {
                            if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                                callstack.push(lines[i]);
                            }
                            else if (lines[i].indexOf('    at ') === 0) {
                                lines[i] = lines[i].replace('    at ', '');
                                callstack.push(lines[i]);
                            }
                        }
                    }
                    else if (err.message) {
                        var lines = err.message.split('\n');
                        for (var i = 0, len = lines.length; i < len; i++) {
                            if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                                var entry = lines[i];
                                //Append next line also since it has the file info
                                if (lines[i + 1]) {
                                    entry += ' at ' + lines[i + 1];
                                    i++;
                                }
                                callstack.push(entry);
                            }
                        }
                    }
                }
                if (!callstack) {
                    var currentFunction = arguments.callee.caller;
                    while (currentFunction) {
                        var fn = currentFunction.toString();
                        var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf('')) || 'anonymous';
                        callstack.push(fname);
                        currentFunction = currentFunction.caller;
                    }
                }
                // Remove this call and Spy.
                if (callstack) {
                    callstack.shift();
                    for (var i = 0; i < removeFirstNCalls; i++) {
                        if (callstack.length > 0) {
                            callstack.shift();
                        }
                        else {
                            break;
                        }
                    }
                    for (var i = 0; i < removeLastNCalls; i++) {
                        if (callstack.length > 0) {
                            callstack.pop();
                        }
                        else {
                            break;
                        }
                    }
                }
                return callstack;
            };
            return StackTrace;
        }());
        Utils.StackTrace = StackTrace;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var Time = (function () {
            function Time() {
                if (window.performance && window.performance.now) {
                    this.nowFunction = this.dateBasedPerformanceNow.bind(this);
                }
                else {
                    var date = new Date();
                    this.nowFunction = date.getTime.bind(date);
                }
            }
            Time.prototype.dateBasedPerformanceNow = function () {
                return performance.timing.navigationStart + performance.now();
            };
            Object.defineProperty(Time.prototype, "now", {
                get: function () {
                    return this.nowFunction();
                },
                enumerable: true,
                configurable: true
            });
            return Time;
        }());
        Utils.Time = Time;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    function merge(first, second) {
        var result = {};
        for (var id in first) {
            result[id] = first[id];
        }
        for (var id in second) {
            if (!result.hasOwnProperty(id)) {
                result[id] = second[id];
            }
        }
        return result;
    }
    SPECTOR.merge = merge;
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var WebGlConstants = (function () {
        function WebGlConstants() {
        }
        WebGlConstants.isWebGlConstant = function (value) {
            return SPECTOR.WebGlConstantsByValue[value] !== null && SPECTOR.WebGlConstantsByValue[value] !== undefined;
        };
        WebGlConstants.stringifyWebGlConstant = function (value, command) {
            if (value === 0) {
                var meaning = this.zeroMeaningByCommand[command];
                if (meaning) {
                    return meaning;
                }
                return "0";
            }
            else if (value === 1) {
                var meaning = this.oneMeaningByCommand[command];
                if (meaning) {
                    return meaning;
                }
                return "1";
            }
            return SPECTOR.WebGlConstantsByValue[value].name;
        };
        return WebGlConstants;
    }());
    WebGlConstants.zeroMeaningByCommand = {
        "getError": "NO_ERROR",
        "blendFunc": "ZERO",
        "blendFuncSeparate": "ZERO",
        "readBuffer": "NONE",
        "getFramebufferAttachmentParameter": "NONE",
        "texParameterf": "NONE",
        "texParameteri": "NONE",
        "drawArrays": "POINTS",
        "drawElements": "POINTS",
        "drawArraysInstanced": "POINTS",
        "drawBuffers": "POINTS",
        "drawElementsInstanced": "POINTS",
        "drawRangeElements": "POINTS"
    };
    WebGlConstants.oneMeaningByCommand = {
        "blendFunc": "ONE",
        "blendFuncSeparate": "ONE",
        "drawArrays": "LINES",
        "drawElements": "LINES",
        "drawArraysInstanced": "LINES",
        "drawBuffers": "LINES",
        "drawElementsInstanced": "LINES",
        "drawRangeElements": "LINES"
    };
    WebGlConstants.DEPTH_BUFFER_BIT = { name: "DEPTH_BUFFER_BIT", value: 256, description: "Passed to clear to clear the current depth buffer." };
    WebGlConstants.STENCIL_BUFFER_BIT = { name: "STENCIL_BUFFER_BIT", value: 1024, description: "Passed to clear to clear the current stencil buffer." };
    WebGlConstants.COLOR_BUFFER_BIT = { name: "COLOR_BUFFER_BIT", value: 16384, description: "Passed to clear to clear the current color buffer." };
    WebGlConstants.POINTS = { name: "POINTS", value: 0, description: "Passed to drawElements or drawArrays to draw single points." };
    WebGlConstants.LINES = { name: "LINES", value: 1, description: "Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it." };
    WebGlConstants.LINE_LOOP = { name: "LINE_LOOP", value: 2, description: "Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment." };
    WebGlConstants.LINE_STRIP = { name: "LINE_STRIP", value: 3, description: "Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last." };
    WebGlConstants.TRIANGLES = { name: "TRIANGLES", value: 4, description: "Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle." };
    WebGlConstants.TRIANGLE_STRIP = { name: "TRIANGLE_STRIP", value: 5, description: "Passed to drawElements or drawArrays to draw a connected group of triangles." };
    WebGlConstants.TRIANGLE_FAN = { name: "TRIANGLE_FAN", value: 6, description: "Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan." };
    WebGlConstants.ZERO = { name: "ZERO", value: 0, description: "Passed to blendFunc or blendFuncSeparate to turn off a component." };
    WebGlConstants.ONE = { name: "ONE", value: 1, description: "Passed to blendFunc or blendFuncSeparate to turn on a component." };
    WebGlConstants.SRC_COLOR = { name: "SRC_COLOR", value: 768, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color." };
    WebGlConstants.ONE_MINUS_SRC_COLOR = { name: "ONE_MINUS_SRC_COLOR", value: 769, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color." };
    WebGlConstants.SRC_ALPHA = { name: "SRC_ALPHA", value: 770, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha." };
    WebGlConstants.ONE_MINUS_SRC_ALPHA = { name: "ONE_MINUS_SRC_ALPHA", value: 771, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha." };
    WebGlConstants.DST_ALPHA = { name: "DST_ALPHA", value: 772, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha." };
    WebGlConstants.ONE_MINUS_DST_ALPHA = { name: "ONE_MINUS_DST_ALPHA", value: 773, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha." };
    WebGlConstants.DST_COLOR = { name: "DST_COLOR", value: 774, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color." };
    WebGlConstants.ONE_MINUS_DST_COLOR = { name: "ONE_MINUS_DST_COLOR", value: 775, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color." };
    WebGlConstants.SRC_ALPHA_SATURATE = { name: "SRC_ALPHA_SATURATE", value: 776, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha." };
    WebGlConstants.CONSTANT_COLOR = { name: "CONSTANT_COLOR", value: 32769, description: "Passed to blendFunc or blendFuncSeparate to specify a constant color blend function." };
    WebGlConstants.ONE_MINUS_CONSTANT_COLOR = { name: "ONE_MINUS_CONSTANT_COLOR", value: 32770, description: "Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function." };
    WebGlConstants.CONSTANT_ALPHA = { name: "CONSTANT_ALPHA", value: 32771, description: "Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function." };
    WebGlConstants.ONE_MINUS_CONSTANT_ALPHA = { name: "ONE_MINUS_CONSTANT_ALPHA", value: 32772, description: "Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function." };
    WebGlConstants.FUNC_ADD = { name: "FUNC_ADD", value: 32774, description: "Passed to blendEquation or blendEquationSeparate to set an addition blend function." };
    WebGlConstants.FUNC_SUBSTRACT = { name: "FUNC_SUBSTRACT", value: 32778, description: "Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination)." };
    WebGlConstants.FUNC_REVERSE_SUBTRACT = { name: "FUNC_REVERSE_SUBTRACT", value: 32779, description: "Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source)." };
    WebGlConstants.BLEND_EQUATION = { name: "BLEND_EQUATION", value: 32777, description: "Passed to getParameter to get the current RGB blend function." };
    WebGlConstants.BLEND_EQUATION_RGB = { name: "BLEND_EQUATION_RGB", value: 32777, description: "Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION" };
    WebGlConstants.BLEND_EQUATION_ALPHA = { name: "BLEND_EQUATION_ALPHA", value: 34877, description: "Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION" };
    WebGlConstants.BLEND_DST_RGB = { name: "BLEND_DST_RGB", value: 32968, description: "Passed to getParameter to get the current destination RGB blend function." };
    WebGlConstants.BLEND_SRC_RGB = { name: "BLEND_SRC_RGB", value: 32969, description: "Passed to getParameter to get the current destination RGB blend function." };
    WebGlConstants.BLEND_DST_ALPHA = { name: "BLEND_DST_ALPHA", value: 32970, description: "Passed to getParameter to get the current destination alpha blend function." };
    WebGlConstants.BLEND_SRC_ALPHA = { name: "BLEND_SRC_ALPHA", value: 32971, description: "Passed to getParameter to get the current source alpha blend function." };
    WebGlConstants.BLEND_COLOR = { name: "BLEND_COLOR", value: 32773, description: "Passed to getParameter to return a the current blend color." };
    WebGlConstants.ARRAY_BUFFER_BINDING = { name: "ARRAY_BUFFER_BINDING", value: 34964, description: "Passed to getParameter to get the array buffer binding." };
    WebGlConstants.ELEMENT_ARRAY_BUFFER_BINDING = { name: "ELEMENT_ARRAY_BUFFER_BINDING", value: 34965, description: "Passed to getParameter to get the current element array buffer." };
    WebGlConstants.LINE_WIDTH = { name: "LINE_WIDTH", value: 2849, description: "Passed to getParameter to get the current lineWidth (set by the lineWidth method)." };
    WebGlConstants.ALIASED_POINT_SIZE_RANGE = { name: "ALIASED_POINT_SIZE_RANGE", value: 33901, description: "Passed to getParameter to get the current size of a point drawn with gl.POINTS" };
    WebGlConstants.ALIASED_LINE_WIDTH_RANGE = { name: "ALIASED_LINE_WIDTH_RANGE", value: 33902, description: "Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1." };
    WebGlConstants.CULL_FACE_MODE = { name: "CULL_FACE_MODE", value: 2885, description: "Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK" };
    WebGlConstants.FRONT_FACE = { name: "FRONT_FACE", value: 2886, description: "Passed to getParameter to determine the current value of frontFace. Should return CW or CCW." };
    WebGlConstants.DEPTH_RANGE = { name: "DEPTH_RANGE", value: 2928, description: "Passed to getParameter to return a length-2 array of floats giving the current depth range." };
    WebGlConstants.DEPTH_WRITEMASK = { name: "DEPTH_WRITEMASK", value: 2930, description: "Passed to getParameter to determine if the depth write mask is enabled." };
    WebGlConstants.DEPTH_CLEAR_VALUE = { name: "DEPTH_CLEAR_VALUE", value: 2931, description: "Passed to getParameter to determine the current depth clear value." };
    WebGlConstants.DEPTH_FUNC = { name: "DEPTH_FUNC", value: 2932, description: "Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL." };
    WebGlConstants.STENCIL_CLEAR_VALUE = { name: "STENCIL_CLEAR_VALUE", value: 2961, description: "Passed to getParameter to get the value the stencil will be cleared to." };
    WebGlConstants.STENCIL_FUNC = { name: "STENCIL_FUNC", value: 2962, description: "Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL." };
    WebGlConstants.STENCIL_FAIL = { name: "STENCIL_FAIL", value: 2964, description: "Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
    WebGlConstants.STENCIL_PASS_DEPTH_FAIL = { name: "STENCIL_PASS_DEPTH_FAIL", value: 2965, description: "Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
    WebGlConstants.STENCIL_PASS_DEPTH_PASS = { name: "STENCIL_PASS_DEPTH_PASS", value: 2966, description: "Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
    WebGlConstants.STENCIL_REF = { name: "STENCIL_REF", value: 2967, description: "Passed to getParameter to get the reference value used for stencil tests." };
    WebGlConstants.STENCIL_VALUE_MASK = { name: "STENCIL_VALUE_MASK", value: 2963, description: " " };
    WebGlConstants.STENCIL_WRITEMASK = { name: "STENCIL_WRITEMASK", value: 2968, description: " " };
    WebGlConstants.STENCIL_BACK_FUNC = { name: "STENCIL_BACK_FUNC", value: 34816, description: " " };
    WebGlConstants.STENCIL_BACK_FAIL = { name: "STENCIL_BACK_FAIL", value: 34817, description: " " };
    WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL = { name: "STENCIL_BACK_PASS_DEPTH_FAIL", value: 34818, description: " " };
    WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS = { name: "STENCIL_BACK_PASS_DEPTH_PASS", value: 34819, description: " " };
    WebGlConstants.STENCIL_BACK_REF = { name: "STENCIL_BACK_REF", value: 36003, description: " " };
    WebGlConstants.STENCIL_BACK_VALUE_MASK = { name: "STENCIL_BACK_VALUE_MASK", value: 36004, description: " " };
    WebGlConstants.STENCIL_BACK_WRITEMASK = { name: "STENCIL_BACK_WRITEMASK", value: 36005, description: " " };
    WebGlConstants.VIEWPORT = { name: "VIEWPORT", value: 2978, description: "Returns an Int32Array with four elements for the current viewport dimensions." };
    WebGlConstants.SCISSOR_BOX = { name: "SCISSOR_BOX", value: 3088, description: "Returns an Int32Array with four elements for the current scissor box dimensions." };
    WebGlConstants.COLOR_CLEAR_VALUE = { name: "COLOR_CLEAR_VALUE", value: 3106, description: " " };
    WebGlConstants.COLOR_WRITEMASK = { name: "COLOR_WRITEMASK", value: 3107, description: " " };
    WebGlConstants.UNPACK_ALIGNMENT = { name: "UNPACK_ALIGNMENT", value: 3317, description: " " };
    WebGlConstants.PACK_ALIGNMENT = { name: "PACK_ALIGNMENT", value: 3333, description: " " };
    WebGlConstants.MAX_TEXTURE_SIZE = { name: "MAX_TEXTURE_SIZE", value: 3379, description: " " };
    WebGlConstants.MAX_VIEWPORT_DIMS = { name: "MAX_VIEWPORT_DIMS", value: 3386, description: " " };
    WebGlConstants.SUBPIXEL_BITS = { name: "SUBPIXEL_BITS", value: 3408, description: " " };
    WebGlConstants.RED_BITS = { name: "RED_BITS", value: 3410, description: " " };
    WebGlConstants.GREEN_BITS = { name: "GREEN_BITS", value: 3411, description: " " };
    WebGlConstants.BLUE_BITS = { name: "BLUE_BITS", value: 3412, description: " " };
    WebGlConstants.ALPHA_BITS = { name: "ALPHA_BITS", value: 3413, description: " " };
    WebGlConstants.DEPTH_BITS = { name: "DEPTH_BITS", value: 3414, description: " " };
    WebGlConstants.STENCIL_BITS = { name: "STENCIL_BITS", value: 3415, description: " " };
    WebGlConstants.POLYGON_OFFSET_UNITS = { name: "POLYGON_OFFSET_UNITS", value: 10752, description: " " };
    WebGlConstants.POLYGON_OFFSET_FACTOR = { name: "POLYGON_OFFSET_FACTOR", value: 32824, description: " " };
    WebGlConstants.TEXTURE_BINDING_2D = { name: "TEXTURE_BINDING_2D", value: 32873, description: " " };
    WebGlConstants.SAMPLE_BUFFERS = { name: "SAMPLE_BUFFERS", value: 32936, description: " " };
    WebGlConstants.SAMPLES = { name: "SAMPLES", value: 32937, description: " " };
    WebGlConstants.SAMPLE_COVERAGE_VALUE = { name: "SAMPLE_COVERAGE_VALUE", value: 32938, description: " " };
    WebGlConstants.SAMPLE_COVERAGE_INVERT = { name: "SAMPLE_COVERAGE_INVERT", value: 32939, description: " " };
    WebGlConstants.COMPRESSED_TEXTURE_FORMATS = { name: "COMPRESSED_TEXTURE_FORMATS", value: 34467, description: " " };
    WebGlConstants.VENDOR = { name: "VENDOR", value: 7936, description: " " };
    WebGlConstants.RENDERER = { name: "RENDERER", value: 7937, description: " " };
    WebGlConstants.VERSION = { name: "VERSION", value: 7938, description: " " };
    WebGlConstants.IMPLEMENTATION_COLOR_READ_TYPE = { name: "IMPLEMENTATION_COLOR_READ_TYPE", value: 35738, description: " " };
    WebGlConstants.IMPLEMENTATION_COLOR_READ_FORMAT = { name: "IMPLEMENTATION_COLOR_READ_FORMAT", value: 35739, description: " " };
    WebGlConstants.BROWSER_DEFAULT_WEBGL = { name: "BROWSER_DEFAULT_WEBGL", value: 37444, description: " " };
    WebGlConstants.STATIC_DRAW = { name: "STATIC_DRAW", value: 35044, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often." };
    WebGlConstants.STREAM_DRAW = { name: "STREAM_DRAW", value: 35040, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often." };
    WebGlConstants.DYNAMIC_DRAW = { name: "DYNAMIC_DRAW", value: 35048, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often." };
    WebGlConstants.ARRAY_BUFFER = { name: "ARRAY_BUFFER", value: 34962, description: "Passed to bindBuffer or bufferData to specify the type of buffer being used." };
    WebGlConstants.ELEMENT_ARRAY_BUFFER = { name: "ELEMENT_ARRAY_BUFFER", value: 34963, description: "Passed to bindBuffer or bufferData to specify the type of buffer being used." };
    WebGlConstants.BUFFER_SIZE = { name: "BUFFER_SIZE", value: 34660, description: "Passed to getBufferParameter to get a buffer's size." };
    WebGlConstants.BUFFER_USAGE = { name: "BUFFER_USAGE", value: 34661, description: "Passed to getBufferParameter to get the hint for the buffer passed in when it was created." };
    WebGlConstants.CURRENT_VERTEX_ATTRIB = { name: "CURRENT_VERTEX_ATTRIB", value: 34342, description: "Passed to getVertexAttrib to read back the current vertex attribute." };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_ENABLED = { name: "VERTEX_ATTRIB_ARRAY_ENABLED", value: 34338, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_SIZE = { name: "VERTEX_ATTRIB_ARRAY_SIZE", value: 34339, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_STRIDE = { name: "VERTEX_ATTRIB_ARRAY_STRIDE", value: 34340, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_TYPE = { name: "VERTEX_ATTRIB_ARRAY_TYPE", value: 34341, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED = { name: "VERTEX_ATTRIB_ARRAY_NORMALIZED", value: 34922, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_POINTER = { name: "VERTEX_ATTRIB_ARRAY_POINTER", value: 34373, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = { name: "VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", value: 34975, description: " " };
    WebGlConstants.CULL_FACE = { name: "CULL_FACE", value: 2884, description: "Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method." };
    WebGlConstants.FRONT = { name: "FRONT", value: 1028, description: "Passed to cullFace to specify that only front faces should be drawn." };
    WebGlConstants.BACK = { name: "BACK", value: 1029, description: "Passed to cullFace to specify that only back faces should be drawn." };
    WebGlConstants.FRONT_AND_BACK = { name: "FRONT_AND_BACK", value: 1032, description: "Passed to cullFace to specify that front and back faces should be drawn." };
    WebGlConstants.BLEND = { name: "BLEND", value: 3042, description: "Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method." };
    WebGlConstants.DEPTH_TEST = { name: "DEPTH_TEST", value: 2929, description: "Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test." };
    WebGlConstants.DITHER = { name: "DITHER", value: 3024, description: "Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method." };
    WebGlConstants.POLYGON_OFFSET_FILL = { name: "POLYGON_OFFSET_FILL", value: 32823, description: "Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test." };
    WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE = { name: "SAMPLE_ALPHA_TO_COVERAGE", value: 32926, description: "Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels." };
    WebGlConstants.SAMPLE_COVERAGE = { name: "SAMPLE_COVERAGE", value: 32928, description: "Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling." };
    WebGlConstants.SCISSOR_TEST = { name: "SCISSOR_TEST", value: 3089, description: "Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test." };
    WebGlConstants.STENCIL_TEST = { name: "STENCIL_TEST", value: 2960, description: "Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test." };
    WebGlConstants.NO_ERROR = { name: "NO_ERROR", value: 0, description: "Returned from getError." };
    WebGlConstants.INVALID_ENUM = { name: "INVALID_ENUM", value: 1280, description: "Returned from getError." };
    WebGlConstants.INVALID_VALUE = { name: "INVALID_VALUE", value: 1281, description: "Returned from getError." };
    WebGlConstants.INVALID_OPERATION = { name: "INVALID_OPERATION", value: 1282, description: "Returned from getError." };
    WebGlConstants.OUT_OF_MEMORY = { name: "OUT_OF_MEMORY", value: 1285, description: "Returned from getError." };
    WebGlConstants.CONTEXT_LOST_WEBGL = { name: "CONTEXT_LOST_WEBGL", value: 37442, description: "Returned from getError." };
    WebGlConstants.CW = { name: "CW", value: 2304, description: "Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction" };
    WebGlConstants.CCW = { name: "CCW", value: 2305, description: "Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction" };
    WebGlConstants.DONT_CARE = { name: "DONT_CARE", value: 4352, description: "There is no preference for this behavior." };
    WebGlConstants.FASTEST = { name: "FASTEST", value: 4353, description: "The most efficient behavior should be used." };
    WebGlConstants.NICEST = { name: "NICEST", value: 4354, description: "The most correct or the highest quality option should be used." };
    WebGlConstants.GENERATE_MIPMAP_HINT = { name: "GENERATE_MIPMAP_HINT", value: 33170, description: "Hint for the quality of filtering when generating mipmap images with WebGLRenderingContext.generateMipmap()." };
    WebGlConstants.BYTE = { name: "BYTE", value: 5120, description: " " };
    WebGlConstants.UNSIGNED_BYTE = { name: "UNSIGNED_BYTE", value: 5121, description: " " };
    WebGlConstants.SHORT = { name: "SHORT", value: 5122, description: " " };
    WebGlConstants.UNSIGNED_SHORT = { name: "UNSIGNED_SHORT", value: 5123, description: " " };
    WebGlConstants.INT = { name: "INT", value: 5124, description: " " };
    WebGlConstants.UNSIGNED_INT = { name: "UNSIGNED_INT", value: 5125, description: " " };
    WebGlConstants.FLOAT = { name: "FLOAT", value: 5126, description: " " };
    WebGlConstants.DEPTH_COMPONENT = { name: "DEPTH_COMPONENT", value: 6402, description: " " };
    WebGlConstants.ALPHA = { name: "ALPHA", value: 6406, description: " " };
    WebGlConstants.RGB = { name: "RGB", value: 6407, description: " " };
    WebGlConstants.RGBA = { name: "RGBA", value: 6408, description: " " };
    WebGlConstants.LUMINANCE = { name: "LUMINANCE", value: 6409, description: " " };
    WebGlConstants.LUMINANCE_ALPHA = { name: "LUMINANCE_ALPHA", value: 6410, description: " " };
    WebGlConstants.UNSIGNED_SHORT_4_4_4_4 = { name: "UNSIGNED_SHORT_4_4_4_4", value: 32819, description: " " };
    WebGlConstants.UNSIGNED_SHORT_5_5_5_1 = { name: "UNSIGNED_SHORT_5_5_5_1", value: 32820, description: " " };
    WebGlConstants.UNSIGNED_SHORT_5_6_5 = { name: "UNSIGNED_SHORT_5_6_5", value: 33635, description: " " };
    WebGlConstants.FRAGMENT_SHADER = { name: "FRAGMENT_SHADER", value: 35632, description: "Passed to createShader to define a fragment shader." };
    WebGlConstants.VERTEX_SHADER = { name: "VERTEX_SHADER", value: 35633, description: "Passed to createShader to define a vertex shader" };
    WebGlConstants.COMPILE_STATUS = { name: "COMPILE_STATUS", value: 35713, description: "Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error" };
    WebGlConstants.DELETE_STATUS = { name: "DELETE_STATUS", value: 35712, description: "Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise." };
    WebGlConstants.LINK_STATUS = { name: "LINK_STATUS", value: 35714, description: "Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error." };
    WebGlConstants.VALIDATE_STATUS = { name: "VALIDATE_STATUS", value: 35715, description: "Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found." };
    WebGlConstants.ATTACHED_SHADERS = { name: "ATTACHED_SHADERS", value: 35717, description: "Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred." };
    WebGlConstants.ACTIVE_ATTRIBUTES = { name: "ACTIVE_ATTRIBUTES", value: 35721, description: "Passed to getProgramParameter to get the number of attributes active in a program." };
    WebGlConstants.ACTIVE_UNIFORMS = { name: "ACTIVE_UNIFORMS", value: 35718, description: "Passed to getProgramParamter to get the number of uniforms active in a program." };
    WebGlConstants.MAX_VERTEX_ATTRIBS = { name: "MAX_VERTEX_ATTRIBS", value: 34921, description: " " };
    WebGlConstants.MAX_VERTEX_UNIFORM_VECTORS = { name: "MAX_VERTEX_UNIFORM_VECTORS", value: 36347, description: " " };
    WebGlConstants.MAX_VARYING_VECTORS = { name: "MAX_VARYING_VECTORS", value: 36348, description: " " };
    WebGlConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS = { name: "MAX_COMBINED_TEXTURE_IMAGE_UNITS", value: 35661, description: " " };
    WebGlConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS = { name: "MAX_VERTEX_TEXTURE_IMAGE_UNITS", value: 35660, description: " " };
    WebGlConstants.MAX_TEXTURE_IMAGE_UNITS = { name: "MAX_TEXTURE_IMAGE_UNITS", value: 34930, description: "Implementation dependent number of maximum texture units. At least 8." };
    WebGlConstants.MAX_FRAGMENT_UNIFORM_VECTORS = { name: "MAX_FRAGMENT_UNIFORM_VECTORS", value: 36349, description: " " };
    WebGlConstants.SHADER_TYPE = { name: "SHADER_TYPE", value: 35663, description: " " };
    WebGlConstants.SHADING_LANGUAGE_VERSION = { name: "SHADING_LANGUAGE_VERSION", value: 35724, description: " " };
    WebGlConstants.CURRENT_PROGRAM = { name: "CURRENT_PROGRAM", value: 35725, description: " " };
    WebGlConstants.NEVER = { name: "NEVER", value: 512, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn." };
    WebGlConstants.ALWAYS = { name: "ALWAYS", value: 519, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn." };
    WebGlConstants.LESS = { name: "LESS", value: 513, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value." };
    WebGlConstants.EQUAL = { name: "EQUAL", value: 514, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value." };
    WebGlConstants.LEQUAL = { name: "LEQUAL", value: 515, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value." };
    WebGlConstants.GREATER = { name: "GREATER", value: 516, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value." };
    WebGlConstants.GEQUAL = { name: "GEQUAL", value: 518, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value." };
    WebGlConstants.NOTEQUAL = { name: "NOTEQUAL", value: 517, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value." };
    WebGlConstants.KEEP = { name: "KEEP", value: 7680, description: " " };
    WebGlConstants.REPLACE = { name: "REPLACE", value: 7681, description: " " };
    WebGlConstants.INCR = { name: "INCR", value: 7682, description: " " };
    WebGlConstants.DECR = { name: "DECR", value: 7683, description: " " };
    WebGlConstants.INVERT = { name: "INVERT", value: 5386, description: " " };
    WebGlConstants.INCR_WRAP = { name: "INCR_WRAP", value: 34055, description: " " };
    WebGlConstants.DECR_WRAP = { name: "DECR_WRAP", value: 34056, description: " " };
    WebGlConstants.NEAREST = { name: "NEAREST", value: 9728, description: " " };
    WebGlConstants.LINEAR = { name: "LINEAR", value: 9729, description: " " };
    WebGlConstants.NEAREST_MIPMAP_NEAREST = { name: "NEAREST_MIPMAP_NEAREST", value: 9984, description: " " };
    WebGlConstants.LINEAR_MIPMAP_NEAREST = { name: "LINEAR_MIPMAP_NEAREST", value: 9985, description: " " };
    WebGlConstants.NEAREST_MIPMAP_LINEAR = { name: "NEAREST_MIPMAP_LINEAR", value: 9986, description: " " };
    WebGlConstants.LINEAR_MIPMAP_LINEAR = { name: "LINEAR_MIPMAP_LINEAR", value: 9987, description: " " };
    WebGlConstants.TEXTURE_MAG_FILTER = { name: "TEXTURE_MAG_FILTER", value: 10240, description: " " };
    WebGlConstants.TEXTURE_MIN_FILTER = { name: "TEXTURE_MIN_FILTER", value: 10241, description: " " };
    WebGlConstants.TEXTURE_WRAP_S = { name: "TEXTURE_WRAP_S", value: 10242, description: " " };
    WebGlConstants.TEXTURE_WRAP_T = { name: "TEXTURE_WRAP_T", value: 10243, description: " " };
    WebGlConstants.TEXTURE_2D = { name: "TEXTURE_2D", value: 3553, description: " " };
    WebGlConstants.TEXTURE = { name: "TEXTURE", value: 5890, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP = { name: "TEXTURE_CUBE_MAP", value: 34067, description: " " };
    WebGlConstants.TEXTURE_BINDING_CUBE_MAP = { name: "TEXTURE_BINDING_CUBE_MAP", value: 34068, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_X = { name: "TEXTURE_CUBE_MAP_POSITIVE_X", value: 34069, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_X = { name: "TEXTURE_CUBE_MAP_NEGATIVE_X", value: 34070, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Y = { name: "TEXTURE_CUBE_MAP_POSITIVE_Y", value: 34071, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y = { name: "TEXTURE_CUBE_MAP_NEGATIVE_Y", value: 34072, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Z = { name: "TEXTURE_CUBE_MAP_POSITIVE_Z", value: 34073, description: " " };
    WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z = { name: "TEXTURE_CUBE_MAP_NEGATIVE_Z", value: 34074, description: " " };
    WebGlConstants.MAX_CUBE_MAP_TEXTURE_SIZE = { name: "MAX_CUBE_MAP_TEXTURE_SIZE", value: 34076, description: " " };
    WebGlConstants.TEXTURE0 = { name: "TEXTURE0", value: 33984, description: "A texture unit." };
    WebGlConstants.TEXTURE1 = { name: "TEXTURE1", value: 33985, description: "A texture unit." };
    WebGlConstants.TEXTURE2 = { name: "TEXTURE2", value: 33986, description: "A texture unit." };
    WebGlConstants.TEXTURE3 = { name: "TEXTURE3", value: 33987, description: "A texture unit." };
    WebGlConstants.TEXTURE4 = { name: "TEXTURE4", value: 33988, description: "A texture unit." };
    WebGlConstants.TEXTURE5 = { name: "TEXTURE5", value: 33989, description: "A texture unit." };
    WebGlConstants.TEXTURE6 = { name: "TEXTURE6", value: 33990, description: "A texture unit." };
    WebGlConstants.TEXTURE7 = { name: "TEXTURE7", value: 33991, description: "A texture unit." };
    WebGlConstants.TEXTURE8 = { name: "TEXTURE8", value: 33992, description: "A texture unit." };
    WebGlConstants.TEXTURE9 = { name: "TEXTURE9", value: 33993, description: "A texture unit." };
    WebGlConstants.TEXTURE10 = { name: "TEXTURE10", value: 33994, description: "A texture unit." };
    WebGlConstants.TEXTURE11 = { name: "TEXTURE11", value: 33995, description: "A texture unit." };
    WebGlConstants.TEXTURE12 = { name: "TEXTURE12", value: 33996, description: "A texture unit." };
    WebGlConstants.TEXTURE13 = { name: "TEXTURE13", value: 33997, description: "A texture unit." };
    WebGlConstants.TEXTURE14 = { name: "TEXTURE14", value: 33998, description: "A texture unit." };
    WebGlConstants.TEXTURE15 = { name: "TEXTURE15", value: 33999, description: "A texture unit." };
    WebGlConstants.TEXTURE16 = { name: "TEXTURE16", value: 34000, description: "A texture unit." };
    WebGlConstants.TEXTURE17 = { name: "TEXTURE17", value: 34001, description: "A texture unit." };
    WebGlConstants.TEXTURE18 = { name: "TEXTURE18", value: 34002, description: "A texture unit." };
    WebGlConstants.TEXTURE19 = { name: "TEXTURE19", value: 34003, description: "A texture unit." };
    WebGlConstants.TEXTURE20 = { name: "TEXTURE20", value: 34004, description: "A texture unit." };
    WebGlConstants.TEXTURE21 = { name: "TEXTURE21", value: 34005, description: "A texture unit." };
    WebGlConstants.TEXTURE22 = { name: "TEXTURE22", value: 34006, description: "A texture unit." };
    WebGlConstants.TEXTURE23 = { name: "TEXTURE23", value: 34007, description: "A texture unit." };
    WebGlConstants.TEXTURE24 = { name: "TEXTURE24", value: 34008, description: "A texture unit." };
    WebGlConstants.TEXTURE25 = { name: "TEXTURE25", value: 34009, description: "A texture unit." };
    WebGlConstants.TEXTURE26 = { name: "TEXTURE26", value: 34010, description: "A texture unit." };
    WebGlConstants.TEXTURE27 = { name: "TEXTURE27", value: 34011, description: "A texture unit." };
    WebGlConstants.TEXTURE28 = { name: "TEXTURE28", value: 34012, description: "A texture unit." };
    WebGlConstants.TEXTURE29 = { name: "TEXTURE29", value: 34013, description: "A texture unit." };
    WebGlConstants.TEXTURE30 = { name: "TEXTURE30", value: 34014, description: "A texture unit." };
    WebGlConstants.TEXTURE31 = { name: "TEXTURE31", value: 34015, description: "A texture unit." };
    WebGlConstants.ACTIVE_TEXTURE = { name: "ACTIVE_TEXTURE", value: 34016, description: "The current active texture unit." };
    WebGlConstants.REPEAT = { name: "REPEAT", value: 10497, description: " " };
    WebGlConstants.CLAMP_TO_EDGE = { name: "CLAMP_TO_EDGE", value: 33071, description: " " };
    WebGlConstants.MIRRORED_REPEAT = { name: "MIRRORED_REPEAT", value: 33648, description: " " };
    WebGlConstants.FLOAT_VEC2 = { name: "FLOAT_VEC2", value: 35664, description: " " };
    WebGlConstants.FLOAT_VEC3 = { name: "FLOAT_VEC3", value: 35665, description: " " };
    WebGlConstants.FLOAT_VEC4 = { name: "FLOAT_VEC4", value: 35666, description: " " };
    WebGlConstants.INT_VEC2 = { name: "INT_VEC2", value: 35667, description: " " };
    WebGlConstants.INT_VEC3 = { name: "INT_VEC3", value: 35668, description: " " };
    WebGlConstants.INT_VEC4 = { name: "INT_VEC4", value: 35669, description: " " };
    WebGlConstants.BOOL = { name: "BOOL", value: 35670, description: " " };
    WebGlConstants.BOOL_VEC2 = { name: "BOOL_VEC2", value: 35671, description: " " };
    WebGlConstants.BOOL_VEC3 = { name: "BOOL_VEC3", value: 35672, description: " " };
    WebGlConstants.BOOL_VEC4 = { name: "BOOL_VEC4", value: 35673, description: " " };
    WebGlConstants.FLOAT_MAT2 = { name: "FLOAT_MAT2", value: 35674, description: " " };
    WebGlConstants.FLOAT_MAT3 = { name: "FLOAT_MAT3", value: 35675, description: " " };
    WebGlConstants.FLOAT_MAT4 = { name: "FLOAT_MAT4", value: 35676, description: " " };
    WebGlConstants.SAMPLER_2D = { name: "SAMPLER_2D", value: 35678, description: " " };
    WebGlConstants.SAMPLER_CUBE = { name: "SAMPLER_CUBE", value: 35680, description: " " };
    WebGlConstants.LOW_FLOAT = { name: "LOW_FLOAT", value: 36336, description: " " };
    WebGlConstants.MEDIUM_FLOAT = { name: "MEDIUM_FLOAT", value: 36337, description: " " };
    WebGlConstants.HIGH_FLOAT = { name: "HIGH_FLOAT", value: 36338, description: " " };
    WebGlConstants.LOW_INT = { name: "LOW_INT", value: 36339, description: " " };
    WebGlConstants.MEDIUM_INT = { name: "MEDIUM_INT", value: 36340, description: " " };
    WebGlConstants.HIGH_INT = { name: "HIGH_INT", value: 36341, description: " " };
    WebGlConstants.FRAMEBUFFER = { name: "FRAMEBUFFER", value: 36160, description: " " };
    WebGlConstants.RENDERBUFFER = { name: "RENDERBUFFER", value: 36161, description: " " };
    WebGlConstants.RGBA4 = { name: "RGBA4", value: 32854, description: " " };
    WebGlConstants.RGB5_A1 = { name: "RGB5_A1", value: 32855, description: " " };
    WebGlConstants.RGB565 = { name: "RGB565", value: 36194, description: " " };
    WebGlConstants.DEPTH_COMPONENT16 = { name: "DEPTH_COMPONENT16", value: 33189, description: " " };
    WebGlConstants.STENCIL_INDEX = { name: "STENCIL_INDEX", value: 6401, description: " " };
    WebGlConstants.STENCIL_INDEX8 = { name: "STENCIL_INDEX8", value: 36168, description: " " };
    WebGlConstants.DEPTH_STENCIL = { name: "DEPTH_STENCIL", value: 34041, description: " " };
    WebGlConstants.RENDERBUFFER_WIDTH = { name: "RENDERBUFFER_WIDTH", value: 36162, description: " " };
    WebGlConstants.RENDERBUFFER_HEIGHT = { name: "RENDERBUFFER_HEIGHT", value: 36163, description: " " };
    WebGlConstants.RENDERBUFFER_INTERNAL_FORMAT = { name: "RENDERBUFFER_INTERNAL_FORMAT", value: 36164, description: " " };
    WebGlConstants.RENDERBUFFER_RED_SIZE = { name: "RENDERBUFFER_RED_SIZE", value: 36176, description: " " };
    WebGlConstants.RENDERBUFFER_GREEN_SIZE = { name: "RENDERBUFFER_GREEN_SIZE", value: 36177, description: " " };
    WebGlConstants.RENDERBUFFER_BLUE_SIZE = { name: "RENDERBUFFER_BLUE_SIZE", value: 36178, description: " " };
    WebGlConstants.RENDERBUFFER_ALPHA_SIZE = { name: "RENDERBUFFER_ALPHA_SIZE", value: 36179, description: " " };
    WebGlConstants.RENDERBUFFER_DEPTH_SIZE = { name: "RENDERBUFFER_DEPTH_SIZE", value: 36180, description: " " };
    WebGlConstants.RENDERBUFFER_STENCIL_SIZE = { name: "RENDERBUFFER_STENCIL_SIZE", value: 36181, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = { name: "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", value: 36048, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = { name: "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", value: 36049, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", value: 36050, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE", value: 36051, description: " " };
    WebGlConstants.COLOR_ATTACHMENT0 = { name: "COLOR_ATTACHMENT0", value: 36064, description: " " };
    WebGlConstants.DEPTH_ATTACHMENT = { name: "DEPTH_ATTACHMENT", value: 36096, description: " " };
    WebGlConstants.STENCIL_ATTACHMENT = { name: "STENCIL_ATTACHMENT", value: 36128, description: " " };
    WebGlConstants.DEPTH_STENCIL_ATTACHMENT = { name: "DEPTH_STENCIL_ATTACHMENT", value: 33306, description: " " };
    WebGlConstants.NONE = { name: "NONE", value: 0, description: " " };
    WebGlConstants.FRAMEBUFFER_COMPLETE = { name: "FRAMEBUFFER_COMPLETE", value: 36053, description: " " };
    WebGlConstants.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = { name: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT", value: 36054, description: " " };
    WebGlConstants.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = { name: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT", value: 36055, description: " " };
    WebGlConstants.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = { name: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS", value: 36057, description: " " };
    WebGlConstants.FRAMEBUFFER_UNSUPPORTED = { name: "FRAMEBUFFER_UNSUPPORTED", value: 36061, description: " " };
    WebGlConstants.FRAMEBUFFER_BINDING = { name: "FRAMEBUFFER_BINDING", value: 36006, description: " " };
    WebGlConstants.RENDERBUFFER_BINDING = { name: "RENDERBUFFER_BINDING", value: 36007, description: " " };
    WebGlConstants.MAX_RENDERBUFFER_SIZE = { name: "MAX_RENDERBUFFER_SIZE", value: 34024, description: " " };
    WebGlConstants.INVALID_FRAMEBUFFER_OPERATION = { name: "INVALID_FRAMEBUFFER_OPERATION", value: 1286, description: " " };
    WebGlConstants.UNPACK_FLIP_Y_WEBGL = { name: "UNPACK_FLIP_Y_WEBGL", value: 37440, description: " " };
    WebGlConstants.UNPACK_PREMULTIPLY_ALPHA_WEBGL = { name: "UNPACK_PREMULTIPLY_ALPHA_WEBGL", value: 37441, description: " " };
    WebGlConstants.UNPACK_COLORSPACE_CONVERSION_WEBGL = { name: "UNPACK_COLORSPACE_CONVERSION_WEBGL", value: 37443, description: " " };
    WebGlConstants.READ_BUFFER = { name: "READ_BUFFER", value: 3074, description: " " };
    WebGlConstants.UNPACK_ROW_LENGTH = { name: "UNPACK_ROW_LENGTH", value: 3314, description: " " };
    WebGlConstants.UNPACK_SKIP_ROWS = { name: "UNPACK_SKIP_ROWS", value: 3315, description: " " };
    WebGlConstants.UNPACK_SKIP_PIXELS = { name: "UNPACK_SKIP_PIXELS", value: 3316, description: " " };
    WebGlConstants.PACK_ROW_LENGTH = { name: "PACK_ROW_LENGTH", value: 3330, description: " " };
    WebGlConstants.PACK_SKIP_ROWS = { name: "PACK_SKIP_ROWS", value: 3331, description: " " };
    WebGlConstants.PACK_SKIP_PIXELS = { name: "PACK_SKIP_PIXELS", value: 3332, description: " " };
    WebGlConstants.TEXTURE_BINDING_3D = { name: "TEXTURE_BINDING_3D", value: 32874, description: " " };
    WebGlConstants.UNPACK_SKIP_IMAGES = { name: "UNPACK_SKIP_IMAGES", value: 32877, description: " " };
    WebGlConstants.UNPACK_IMAGE_HEIGHT = { name: "UNPACK_IMAGE_HEIGHT", value: 32878, description: " " };
    WebGlConstants.MAX_3D_TEXTURE_SIZE = { name: "MAX_3D_TEXTURE_SIZE", value: 32883, description: " " };
    WebGlConstants.MAX_ELEMENTS_VERTICES = { name: "MAX_ELEMENTS_VERTICES", value: 33000, description: " " };
    WebGlConstants.MAX_ELEMENTS_INDICES = { name: "MAX_ELEMENTS_INDICES", value: 33001, description: " " };
    WebGlConstants.MAX_TEXTURE_LOD_BIAS = { name: "MAX_TEXTURE_LOD_BIAS", value: 34045, description: " " };
    WebGlConstants.MAX_FRAGMENT_UNIFORM_COMPONENTS = { name: "MAX_FRAGMENT_UNIFORM_COMPONENTS", value: 35657, description: " " };
    WebGlConstants.MAX_VERTEX_UNIFORM_COMPONENTS = { name: "MAX_VERTEX_UNIFORM_COMPONENTS", value: 35658, description: " " };
    WebGlConstants.MAX_ARRAY_TEXTURE_LAYERS = { name: "MAX_ARRAY_TEXTURE_LAYERS", value: 35071, description: " " };
    WebGlConstants.MIN_PROGRAM_TEXEL_OFFSET = { name: "MIN_PROGRAM_TEXEL_OFFSET", value: 35076, description: " " };
    WebGlConstants.MAX_PROGRAM_TEXEL_OFFSET = { name: "MAX_PROGRAM_TEXEL_OFFSET", value: 35077, description: " " };
    WebGlConstants.MAX_VARYING_COMPONENTS = { name: "MAX_VARYING_COMPONENTS", value: 35659, description: " " };
    WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT = { name: "FRAGMENT_SHADER_DERIVATIVE_HINT", value: 35723, description: " " };
    WebGlConstants.RASTERIZER_DISCARD = { name: "RASTERIZER_DISCARD", value: 35977, description: " " };
    WebGlConstants.VERTEX_ARRAY_BINDING = { name: "VERTEX_ARRAY_BINDING", value: 34229, description: " " };
    WebGlConstants.MAX_VERTEX_OUTPUT_COMPONENTS = { name: "MAX_VERTEX_OUTPUT_COMPONENTS", value: 37154, description: " " };
    WebGlConstants.MAX_FRAGMENT_INPUT_COMPONENTS = { name: "MAX_FRAGMENT_INPUT_COMPONENTS", value: 37157, description: " " };
    WebGlConstants.MAX_SERVER_WAIT_TIMEOUT = { name: "MAX_SERVER_WAIT_TIMEOUT", value: 37137, description: " " };
    WebGlConstants.MAX_ELEMENT_INDEX = { name: "MAX_ELEMENT_INDEX", value: 36203, description: " " };
    WebGlConstants.RED = { name: "RED", value: 6403, description: " " };
    WebGlConstants.RGB8 = { name: "RGB8", value: 32849, description: " " };
    WebGlConstants.RGBA8 = { name: "RGBA8", value: 32856, description: " " };
    WebGlConstants.RGB10_A2 = { name: "RGB10_A2", value: 32857, description: " " };
    WebGlConstants.TEXTURE_3D = { name: "TEXTURE_3D", value: 32879, description: " " };
    WebGlConstants.TEXTURE_WRAP_R = { name: "TEXTURE_WRAP_R", value: 32882, description: " " };
    WebGlConstants.TEXTURE_MIN_LOD = { name: "TEXTURE_MIN_LOD", value: 33082, description: " " };
    WebGlConstants.TEXTURE_MAX_LOD = { name: "TEXTURE_MAX_LOD", value: 33083, description: " " };
    WebGlConstants.TEXTURE_BASE_LEVEL = { name: "TEXTURE_BASE_LEVEL", value: 33084, description: " " };
    WebGlConstants.TEXTURE_MAX_LEVEL = { name: "TEXTURE_MAX_LEVEL", value: 33085, description: " " };
    WebGlConstants.TEXTURE_COMPARE_MODE = { name: "TEXTURE_COMPARE_MODE", value: 34892, description: " " };
    WebGlConstants.TEXTURE_COMPARE_FUNC = { name: "TEXTURE_COMPARE_FUNC", value: 34893, description: " " };
    WebGlConstants.SRGB = { name: "SRGB", value: 35904, description: " " };
    WebGlConstants.SRGB8 = { name: "SRGB8", value: 35905, description: " " };
    WebGlConstants.SRGB8_ALPHA8 = { name: "SRGB8_ALPHA8", value: 35907, description: " " };
    WebGlConstants.COMPARE_REF_TO_TEXTURE = { name: "COMPARE_REF_TO_TEXTURE", value: 34894, description: " " };
    WebGlConstants.RGBA32F = { name: "RGBA32F", value: 34836, description: " " };
    WebGlConstants.RGB32F = { name: "RGB32F", value: 34837, description: " " };
    WebGlConstants.RGBA16F = { name: "RGBA16F", value: 34842, description: " " };
    WebGlConstants.RGB16F = { name: "RGB16F", value: 34843, description: " " };
    WebGlConstants.TEXTURE_2D_ARRAY = { name: "TEXTURE_2D_ARRAY", value: 35866, description: " " };
    WebGlConstants.TEXTURE_BINDING_2D_ARRAY = { name: "TEXTURE_BINDING_2D_ARRAY", value: 35869, description: " " };
    WebGlConstants.R11F_G11F_B10F = { name: "R11F_G11F_B10F", value: 35898, description: " " };
    WebGlConstants.RGB9_E5 = { name: "RGB9_E5", value: 35901, description: " " };
    WebGlConstants.RGBA32UI = { name: "RGBA32UI", value: 36208, description: " " };
    WebGlConstants.RGB32UI = { name: "RGB32UI", value: 36209, description: " " };
    WebGlConstants.RGBA16UI = { name: "RGBA16UI", value: 36214, description: " " };
    WebGlConstants.RGB16UI = { name: "RGB16UI", value: 36215, description: " " };
    WebGlConstants.RGBA8UI = { name: "RGBA8UI", value: 36220, description: " " };
    WebGlConstants.RGB8UI = { name: "RGB8UI", value: 36221, description: " " };
    WebGlConstants.RGBA32I = { name: "RGBA32I", value: 36226, description: " " };
    WebGlConstants.RGB32I = { name: "RGB32I", value: 36227, description: " " };
    WebGlConstants.RGBA16I = { name: "RGBA16I", value: 36232, description: " " };
    WebGlConstants.RGB16I = { name: "RGB16I", value: 36233, description: " " };
    WebGlConstants.RGBA8I = { name: "RGBA8I", value: 36238, description: " " };
    WebGlConstants.RGB8I = { name: "RGB8I", value: 36239, description: " " };
    WebGlConstants.RED_INTEGER = { name: "RED_INTEGER", value: 36244, description: " " };
    WebGlConstants.RGB_INTEGER = { name: "RGB_INTEGER", value: 36248, description: " " };
    WebGlConstants.RGBA_INTEGER = { name: "RGBA_INTEGER", value: 36249, description: " " };
    WebGlConstants.R8 = { name: "R8", value: 33321, description: " " };
    WebGlConstants.RG8 = { name: "RG8", value: 33323, description: " " };
    WebGlConstants.R16F = { name: "R16F", value: 33325, description: " " };
    WebGlConstants.R32F = { name: "R32F", value: 33326, description: " " };
    WebGlConstants.RG16F = { name: "RG16F", value: 33327, description: " " };
    WebGlConstants.RG32F = { name: "RG32F", value: 33328, description: " " };
    WebGlConstants.R8I = { name: "R8I", value: 33329, description: " " };
    WebGlConstants.R8UI = { name: "R8UI", value: 33330, description: " " };
    WebGlConstants.R16I = { name: "R16I", value: 33331, description: " " };
    WebGlConstants.R16UI = { name: "R16UI", value: 33332, description: " " };
    WebGlConstants.R32I = { name: "R32I", value: 33333, description: " " };
    WebGlConstants.R32UI = { name: "R32UI", value: 33334, description: " " };
    WebGlConstants.RG8I = { name: "RG8I", value: 33335, description: " " };
    WebGlConstants.RG8UI = { name: "RG8UI", value: 33336, description: " " };
    WebGlConstants.RG16I = { name: "RG16I", value: 33337, description: " " };
    WebGlConstants.RG16UI = { name: "RG16UI", value: 33338, description: " " };
    WebGlConstants.RG32I = { name: "RG32I", value: 33339, description: " " };
    WebGlConstants.RG32UI = { name: "RG32UI", value: 33340, description: " " };
    WebGlConstants.R8_SNORM = { name: "R8_SNORM", value: 36756, description: " " };
    WebGlConstants.RG8_SNORM = { name: "RG8_SNORM", value: 36757, description: " " };
    WebGlConstants.RGB8_SNORM = { name: "RGB8_SNORM", value: 36758, description: " " };
    WebGlConstants.RGBA8_SNORM = { name: "RGBA8_SNORM", value: 36759, description: " " };
    WebGlConstants.RGB10_A2UI = { name: "RGB10_A2UI", value: 36975, description: " " };
    WebGlConstants.TEXTURE_IMMUTABLE_FORMAT = { name: "TEXTURE_IMMUTABLE_FORMAT", value: 37167, description: " " };
    WebGlConstants.TEXTURE_IMMUTABLE_LEVELS = { name: "TEXTURE_IMMUTABLE_LEVELS", value: 33503, description: " " };
    WebGlConstants.UNSIGNED_INT_2_10_10_10_REV = { name: "UNSIGNED_INT_2_10_10_10_REV", value: 33640, description: " " };
    WebGlConstants.UNSIGNED_INT_10F_11F_11F_REV = { name: "UNSIGNED_INT_10F_11F_11F_REV", value: 35899, description: " " };
    WebGlConstants.UNSIGNED_INT_5_9_9_9_REV = { name: "UNSIGNED_INT_5_9_9_9_REV", value: 35902, description: " " };
    WebGlConstants.FLOAT_32_UNSIGNED_INT_24_8_REV = { name: "FLOAT_32_UNSIGNED_INT_24_8_REV", value: 36269, description: " " };
    WebGlConstants.UNSIGNED_INT_24_8 = { name: "UNSIGNED_INT_24_8", value: 34042, description: " " };
    WebGlConstants.HALF_FLOAT = { name: "HALF_FLOAT", value: 5131, description: " " };
    WebGlConstants.RG = { name: "RG", value: 33319, description: " " };
    WebGlConstants.RG_INTEGER = { name: "RG_INTEGER", value: 33320, description: " " };
    WebGlConstants.INT_2_10_10_10_REV = { name: "INT_2_10_10_10_REV", value: 36255, description: " " };
    WebGlConstants.CURRENT_QUERY = { name: "CURRENT_QUERY", value: 34917, description: " " };
    WebGlConstants.QUERY_RESULT = { name: "QUERY_RESULT", value: 34918, description: " " };
    WebGlConstants.QUERY_RESULT_AVAILABLE = { name: "QUERY_RESULT_AVAILABLE", value: 34919, description: " " };
    WebGlConstants.ANY_SAMPLES_PASSED = { name: "ANY_SAMPLES_PASSED", value: 35887, description: " " };
    WebGlConstants.ANY_SAMPLES_PASSED_CONSERVATIVE = { name: "ANY_SAMPLES_PASSED_CONSERVATIVE", value: 36202, description: " " };
    WebGlConstants.MAX_DRAW_BUFFERS = { name: "MAX_DRAW_BUFFERS", value: 34852, description: " " };
    WebGlConstants.DRAW_BUFFER0 = { name: "DRAW_BUFFER0", value: 34853, description: " " };
    WebGlConstants.DRAW_BUFFER1 = { name: "DRAW_BUFFER1", value: 34854, description: " " };
    WebGlConstants.DRAW_BUFFER2 = { name: "DRAW_BUFFER2", value: 34855, description: " " };
    WebGlConstants.DRAW_BUFFER3 = { name: "DRAW_BUFFER3", value: 34856, description: " " };
    WebGlConstants.DRAW_BUFFER4 = { name: "DRAW_BUFFER4", value: 34857, description: " " };
    WebGlConstants.DRAW_BUFFER5 = { name: "DRAW_BUFFER5", value: 34858, description: " " };
    WebGlConstants.DRAW_BUFFER6 = { name: "DRAW_BUFFER6", value: 34859, description: " " };
    WebGlConstants.DRAW_BUFFER7 = { name: "DRAW_BUFFER7", value: 34860, description: " " };
    WebGlConstants.DRAW_BUFFER8 = { name: "DRAW_BUFFER8", value: 34861, description: " " };
    WebGlConstants.DRAW_BUFFER9 = { name: "DRAW_BUFFER9", value: 34862, description: " " };
    WebGlConstants.DRAW_BUFFER10 = { name: "DRAW_BUFFER10", value: 34863, description: " " };
    WebGlConstants.DRAW_BUFFER11 = { name: "DRAW_BUFFER11", value: 34864, description: " " };
    WebGlConstants.DRAW_BUFFER12 = { name: "DRAW_BUFFER12", value: 34865, description: " " };
    WebGlConstants.DRAW_BUFFER13 = { name: "DRAW_BUFFER13", value: 34866, description: " " };
    WebGlConstants.DRAW_BUFFER14 = { name: "DRAW_BUFFER14", value: 34867, description: " " };
    WebGlConstants.DRAW_BUFFER15 = { name: "DRAW_BUFFER15", value: 34868, description: " " };
    WebGlConstants.MAX_COLOR_ATTACHMENTS = { name: "MAX_COLOR_ATTACHMENTS", value: 36063, description: " " };
    WebGlConstants.COLOR_ATTACHMENT1 = { name: "COLOR_ATTACHMENT1", value: 36065, description: " " };
    WebGlConstants.COLOR_ATTACHMENT2 = { name: "COLOR_ATTACHMENT2", value: 36066, description: " " };
    WebGlConstants.COLOR_ATTACHMENT3 = { name: "COLOR_ATTACHMENT3", value: 36067, description: " " };
    WebGlConstants.COLOR_ATTACHMENT4 = { name: "COLOR_ATTACHMENT4", value: 36068, description: " " };
    WebGlConstants.COLOR_ATTACHMENT5 = { name: "COLOR_ATTACHMENT5", value: 36069, description: " " };
    WebGlConstants.COLOR_ATTACHMENT6 = { name: "COLOR_ATTACHMENT6", value: 36070, description: " " };
    WebGlConstants.COLOR_ATTACHMENT7 = { name: "COLOR_ATTACHMENT7", value: 36071, description: " " };
    WebGlConstants.COLOR_ATTACHMENT8 = { name: "COLOR_ATTACHMENT8", value: 36072, description: " " };
    WebGlConstants.COLOR_ATTACHMENT9 = { name: "COLOR_ATTACHMENT9", value: 36073, description: " " };
    WebGlConstants.COLOR_ATTACHMENT10 = { name: "COLOR_ATTACHMENT10", value: 36074, description: " " };
    WebGlConstants.COLOR_ATTACHMENT11 = { name: "COLOR_ATTACHMENT11", value: 36075, description: " " };
    WebGlConstants.COLOR_ATTACHMENT12 = { name: "COLOR_ATTACHMENT12", value: 36076, description: " " };
    WebGlConstants.COLOR_ATTACHMENT13 = { name: "COLOR_ATTACHMENT13", value: 36077, description: " " };
    WebGlConstants.COLOR_ATTACHMENT14 = { name: "COLOR_ATTACHMENT14", value: 36078, description: " " };
    WebGlConstants.COLOR_ATTACHMENT15 = { name: "COLOR_ATTACHMENT15", value: 36079, description: " " };
    WebGlConstants.SAMPLER_3D = { name: "SAMPLER_3D", value: 35679, description: " " };
    WebGlConstants.SAMPLER_2D_SHADOW = { name: "SAMPLER_2D_SHADOW", value: 35682, description: " " };
    WebGlConstants.SAMPLER_2D_ARRAY = { name: "SAMPLER_2D_ARRAY", value: 36289, description: " " };
    WebGlConstants.SAMPLER_2D_ARRAY_SHADOW = { name: "SAMPLER_2D_ARRAY_SHADOW", value: 36292, description: " " };
    WebGlConstants.SAMPLER_CUBE_SHADOW = { name: "SAMPLER_CUBE_SHADOW", value: 36293, description: " " };
    WebGlConstants.INT_SAMPLER_2D = { name: "INT_SAMPLER_2D", value: 36298, description: " " };
    WebGlConstants.INT_SAMPLER_3D = { name: "INT_SAMPLER_3D", value: 36299, description: " " };
    WebGlConstants.INT_SAMPLER_CUBE = { name: "INT_SAMPLER_CUBE", value: 36300, description: " " };
    WebGlConstants.INT_SAMPLER_2D_ARRAY = { name: "INT_SAMPLER_2D_ARRAY", value: 36303, description: " " };
    WebGlConstants.UNSIGNED_INT_SAMPLER_2D = { name: "UNSIGNED_INT_SAMPLER_2D", value: 36306, description: " " };
    WebGlConstants.UNSIGNED_INT_SAMPLER_3D = { name: "UNSIGNED_INT_SAMPLER_3D", value: 36307, description: " " };
    WebGlConstants.UNSIGNED_INT_SAMPLER_CUBE = { name: "UNSIGNED_INT_SAMPLER_CUBE", value: 36308, description: " " };
    WebGlConstants.UNSIGNED_INT_SAMPLER_2D_ARRAY = { name: "UNSIGNED_INT_SAMPLER_2D_ARRAY", value: 36311, description: " " };
    WebGlConstants.MAX_SAMPLES = { name: "MAX_SAMPLES", value: 36183, description: " " };
    WebGlConstants.SAMPLER_BINDING = { name: "SAMPLER_BINDING", value: 35097, description: " " };
    WebGlConstants.PIXEL_PACK_BUFFER = { name: "PIXEL_PACK_BUFFER", value: 35051, description: " " };
    WebGlConstants.PIXEL_UNPACK_BUFFER = { name: "PIXEL_UNPACK_BUFFER", value: 35052, description: " " };
    WebGlConstants.PIXEL_PACK_BUFFER_BINDING = { name: "PIXEL_PACK_BUFFER_BINDING", value: 35053, description: " " };
    WebGlConstants.PIXEL_UNPACK_BUFFER_BINDING = { name: "PIXEL_UNPACK_BUFFER_BINDING", value: 35055, description: " " };
    WebGlConstants.COPY_READ_BUFFER = { name: "COPY_READ_BUFFER", value: 36662, description: " " };
    WebGlConstants.COPY_WRITE_BUFFER = { name: "COPY_WRITE_BUFFER", value: 36663, description: " " };
    WebGlConstants.COPY_READ_BUFFER_BINDING = { name: "COPY_READ_BUFFER_BINDING", value: 36662, description: " " };
    WebGlConstants.COPY_WRITE_BUFFER_BINDING = { name: "COPY_WRITE_BUFFER_BINDING", value: 36663, description: " " };
    WebGlConstants.FLOAT_MAT2x3 = { name: "FLOAT_MAT2x3", value: 35685, description: " " };
    WebGlConstants.FLOAT_MAT2x4 = { name: "FLOAT_MAT2x4", value: 35686, description: " " };
    WebGlConstants.FLOAT_MAT3x2 = { name: "FLOAT_MAT3x2", value: 35687, description: " " };
    WebGlConstants.FLOAT_MAT3x4 = { name: "FLOAT_MAT3x4", value: 35688, description: " " };
    WebGlConstants.FLOAT_MAT4x2 = { name: "FLOAT_MAT4x2", value: 35689, description: " " };
    WebGlConstants.FLOAT_MAT4x3 = { name: "FLOAT_MAT4x3", value: 35690, description: " " };
    WebGlConstants.UNSIGNED_INT_VEC2 = { name: "UNSIGNED_INT_VEC2", value: 36294, description: " " };
    WebGlConstants.UNSIGNED_INT_VEC3 = { name: "UNSIGNED_INT_VEC3", value: 36295, description: " " };
    WebGlConstants.UNSIGNED_INT_VEC4 = { name: "UNSIGNED_INT_VEC4", value: 36296, description: " " };
    WebGlConstants.UNSIGNED_NORMALIZED = { name: "UNSIGNED_NORMALIZED", value: 35863, description: " " };
    WebGlConstants.SIGNED_NORMALIZED = { name: "SIGNED_NORMALIZED", value: 36764, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_INTEGER = { name: "VERTEX_ATTRIB_ARRAY_INTEGER", value: 35069, description: " " };
    WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR = { name: "VERTEX_ATTRIB_ARRAY_DIVISOR", value: 35070, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_MODE = { name: "TRANSFORM_FEEDBACK_BUFFER_MODE", value: 35967, description: " " };
    WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS = { name: "MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS", value: 35968, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_VARYINGS = { name: "TRANSFORM_FEEDBACK_VARYINGS", value: 35971, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_START = { name: "TRANSFORM_FEEDBACK_BUFFER_START", value: 35972, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_SIZE = { name: "TRANSFORM_FEEDBACK_BUFFER_SIZE", value: 35973, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = { name: "TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN", value: 35976, description: " " };
    WebGlConstants.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS = { name: "MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS", value: 35978, description: " " };
    WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS = { name: "MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS", value: 35979, description: " " };
    WebGlConstants.INTERLEAVED_ATTRIBS = { name: "INTERLEAVED_ATTRIBS", value: 35980, description: " " };
    WebGlConstants.SEPARATE_ATTRIBS = { name: "SEPARATE_ATTRIBS", value: 35981, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_BUFFER = { name: "TRANSFORM_FEEDBACK_BUFFER", value: 35982, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING = { name: "TRANSFORM_FEEDBACK_BUFFER_BINDING", value: 35983, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK = { name: "TRANSFORM_FEEDBACK", value: 36386, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_PAUSED = { name: "TRANSFORM_FEEDBACK_PAUSED", value: 36387, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_ACTIVE = { name: "TRANSFORM_FEEDBACK_ACTIVE", value: 36388, description: " " };
    WebGlConstants.TRANSFORM_FEEDBACK_BINDING = { name: "TRANSFORM_FEEDBACK_BINDING", value: 36389, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = { name: "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING", value: 33296, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE = { name: "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE", value: 33297, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_RED_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_RED_SIZE", value: 33298, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_GREEN_SIZE", value: 33299, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_BLUE_SIZE", value: 33300, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE", value: 33301, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE", value: 33302, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE", value: 33303, description: " " };
    WebGlConstants.FRAMEBUFFER_DEFAULT = { name: "FRAMEBUFFER_DEFAULT", value: 33304, description: " " };
    WebGlConstants.DEPTH24_STENCIL8 = { name: "DEPTH24_STENCIL8", value: 35056, description: " " };
    WebGlConstants.DRAW_FRAMEBUFFER_BINDING = { name: "DRAW_FRAMEBUFFER_BINDING", value: 36006, description: " " };
    WebGlConstants.READ_FRAMEBUFFER = { name: "READ_FRAMEBUFFER", value: 36008, description: " " };
    WebGlConstants.DRAW_FRAMEBUFFER = { name: "DRAW_FRAMEBUFFER", value: 36009, description: " " };
    WebGlConstants.READ_FRAMEBUFFER_BINDING = { name: "READ_FRAMEBUFFER_BINDING", value: 36010, description: " " };
    WebGlConstants.RENDERBUFFER_SAMPLES = { name: "RENDERBUFFER_SAMPLES", value: 36011, description: " " };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER", value: 36052, description: " " };
    WebGlConstants.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE = { name: "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE", value: 36182, description: " " };
    WebGlConstants.UNIFORM_BUFFER = { name: "UNIFORM_BUFFER", value: 35345, description: " " };
    WebGlConstants.UNIFORM_BUFFER_BINDING = { name: "UNIFORM_BUFFER_BINDING", value: 35368, description: " " };
    WebGlConstants.UNIFORM_BUFFER_START = { name: "UNIFORM_BUFFER_START", value: 35369, description: " " };
    WebGlConstants.UNIFORM_BUFFER_SIZE = { name: "UNIFORM_BUFFER_SIZE", value: 35370, description: " " };
    WebGlConstants.MAX_VERTEX_UNIFORM_BLOCKS = { name: "MAX_VERTEX_UNIFORM_BLOCKS", value: 35371, description: " " };
    WebGlConstants.MAX_FRAGMENT_UNIFORM_BLOCKS = { name: "MAX_FRAGMENT_UNIFORM_BLOCKS", value: 35373, description: " " };
    WebGlConstants.MAX_COMBINED_UNIFORM_BLOCKS = { name: "MAX_COMBINED_UNIFORM_BLOCKS", value: 35374, description: " " };
    WebGlConstants.MAX_UNIFORM_BUFFER_BINDINGS = { name: "MAX_UNIFORM_BUFFER_BINDINGS", value: 35375, description: " " };
    WebGlConstants.MAX_UNIFORM_BLOCK_SIZE = { name: "MAX_UNIFORM_BLOCK_SIZE", value: 35376, description: " " };
    WebGlConstants.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS = { name: "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS", value: 35377, description: " " };
    WebGlConstants.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS = { name: "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS", value: 35379, description: " " };
    WebGlConstants.UNIFORM_BUFFER_OFFSET_ALIGNMENT = { name: "UNIFORM_BUFFER_OFFSET_ALIGNMENT", value: 35380, description: " " };
    WebGlConstants.ACTIVE_UNIFORM_BLOCKS = { name: "ACTIVE_UNIFORM_BLOCKS", value: 35382, description: " " };
    WebGlConstants.UNIFORM_TYPE = { name: "UNIFORM_TYPE", value: 35383, description: " " };
    WebGlConstants.UNIFORM_SIZE = { name: "UNIFORM_SIZE", value: 35384, description: " " };
    WebGlConstants.UNIFORM_BLOCK_INDEX = { name: "UNIFORM_BLOCK_INDEX", value: 35386, description: " " };
    WebGlConstants.UNIFORM_OFFSET = { name: "UNIFORM_OFFSET", value: 35387, description: " " };
    WebGlConstants.UNIFORM_ARRAY_STRIDE = { name: "UNIFORM_ARRAY_STRIDE", value: 35388, description: " " };
    WebGlConstants.UNIFORM_MATRIX_STRIDE = { name: "UNIFORM_MATRIX_STRIDE", value: 35389, description: " " };
    WebGlConstants.UNIFORM_IS_ROW_MAJOR = { name: "UNIFORM_IS_ROW_MAJOR", value: 35390, description: " " };
    WebGlConstants.UNIFORM_BLOCK_BINDING = { name: "UNIFORM_BLOCK_BINDING", value: 35391, description: " " };
    WebGlConstants.UNIFORM_BLOCK_DATA_SIZE = { name: "UNIFORM_BLOCK_DATA_SIZE", value: 35392, description: " " };
    WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORMS = { name: "UNIFORM_BLOCK_ACTIVE_UNIFORMS", value: 35394, description: " " };
    WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = { name: "UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES", value: 35395, description: " " };
    WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = { name: "UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER", value: 35396, description: " " };
    WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = { name: "UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER", value: 35398, description: " " };
    WebGlConstants.OBJECT_TYPE = { name: "OBJECT_TYPE", value: 37138, description: " " };
    WebGlConstants.SYNC_CONDITION = { name: "SYNC_CONDITION", value: 37139, description: " " };
    WebGlConstants.SYNC_STATUS = { name: "SYNC_STATUS", value: 37140, description: " " };
    WebGlConstants.SYNC_FLAGS = { name: "SYNC_FLAGS", value: 37141, description: " " };
    WebGlConstants.SYNC_FENCE = { name: "SYNC_FENCE", value: 37142, description: " " };
    WebGlConstants.SYNC_GPU_COMMANDS_COMPLETE = { name: "SYNC_GPU_COMMANDS_COMPLETE", value: 37143, description: " " };
    WebGlConstants.UNSIGNALED = { name: "UNSIGNALED", value: 37144, description: " " };
    WebGlConstants.SIGNALED = { name: "SIGNALED", value: 37145, description: " " };
    WebGlConstants.ALREADY_SIGNALED = { name: "ALREADY_SIGNALED", value: 37146, description: " " };
    WebGlConstants.TIMEOUT_EXPIRED = { name: "TIMEOUT_EXPIRED", value: 37147, description: " " };
    WebGlConstants.CONDITION_SATISFIED = { name: "CONDITION_SATISFIED", value: 37148, description: " " };
    WebGlConstants.WAIT_FAILED = { name: "WAIT_FAILED", value: 37149, description: " " };
    WebGlConstants.SYNC_FLUSH_COMMANDS_BIT = { name: "SYNC_FLUSH_COMMANDS_BIT", value: 1, description: " " };
    WebGlConstants.COLOR = { name: "COLOR", value: 6144, description: " " };
    WebGlConstants.DEPTH = { name: "DEPTH", value: 6145, description: " " };
    WebGlConstants.STENCIL = { name: "STENCIL", value: 6146, description: " " };
    WebGlConstants.MIN = { name: "MIN", value: 32775, description: " " };
    WebGlConstants.MAX = { name: "MAX", value: 32776, description: " " };
    WebGlConstants.DEPTH_COMPONENT24 = { name: "DEPTH_COMPONENT24", value: 33190, description: " " };
    WebGlConstants.STREAM_READ = { name: "STREAM_READ", value: 35041, description: " " };
    WebGlConstants.STREAM_COPY = { name: "STREAM_COPY", value: 35042, description: " " };
    WebGlConstants.STATIC_READ = { name: "STATIC_READ", value: 35045, description: " " };
    WebGlConstants.STATIC_COPY = { name: "STATIC_COPY", value: 35046, description: " " };
    WebGlConstants.DYNAMIC_READ = { name: "DYNAMIC_READ", value: 35049, description: " " };
    WebGlConstants.DYNAMIC_COPY = { name: "DYNAMIC_COPY", value: 35050, description: " " };
    WebGlConstants.DEPTH_COMPONENT32F = { name: "DEPTH_COMPONENT32F", value: 36012, description: " " };
    WebGlConstants.DEPTH32F_STENCIL8 = { name: "DEPTH32F_STENCIL8", value: 36013, description: " " };
    WebGlConstants.INVALID_INDEX = { name: "INVALID_INDEX", value: 4294967295, description: " " };
    WebGlConstants.TIMEOUT_IGNORED = { name: "TIMEOUT_IGNORED", value: -1, description: " " };
    WebGlConstants.MAX_CLIENT_WAIT_TIMEOUT_WEBGL = { name: "MAX_CLIENT_WAIT_TIMEOUT_WEBGL", value: 37447, description: " " };
    // extensions
    WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = { name: "VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE", value: 35070, description: "Describes the frequency divisor used for instanced rendering.", extensionName: "ANGLE_instanced_arrays" };
    WebGlConstants.UNMASKED_VENDOR_WEBGL = { name: "UNMASKED_VENDOR_WEBGL", value: 37445, description: "Passed to getParameter to get the vendor string of the graphics driver.", extensionName: "ANGLE_instanced_arrays" };
    WebGlConstants.UNMASKED_RENDERER_WEBGL = { name: "UNMASKED_RENDERER_WEBGL", value: 37446, description: "Passed to getParameter to get the renderer string of the graphics driver.", extensionName: "WEBGL_debug_renderer_info" };
    WebGlConstants.MAX_TEXTURE_MAX_ANISOTROPY_EXT = { name: "MAX_TEXTURE_MAX_ANISOTROPY_EXT", value: 34047, description: "Returns the maximum available anisotropy.", extensionName: "EXT_texture_filter_anisotropic" };
    WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT = { name: "TEXTURE_MAX_ANISOTROPY_EXT", value: 34046, description: "Passed to texParameter to set the desired maximum anisotropy for a texture.", extensionName: "EXT_texture_filter_anisotropic" };
    WebGlConstants.COMPRESSED_RGB_S3TC_DXT1_EXT = { name: "COMPRESSED_RGB_S3TC_DXT1_EXT", value: 33776, description: "A DXT1-compressed image in an RGB image format.", extensionName: "WEBGL_compressed_texture_s3tc" };
    WebGlConstants.COMPRESSED_RGBA_S3TC_DXT1_EXT = { name: "COMPRESSED_RGBA_S3TC_DXT1_EXT", value: 33777, description: "A DXT1-compressed image in an RGB image format with a simple on/off alpha value.", extensionName: "WEBGL_compressed_texture_s3tc" };
    WebGlConstants.COMPRESSED_RGBA_S3TC_DXT3_EXT = { name: "COMPRESSED_RGBA_S3TC_DXT3_EXT", value: 33778, description: "A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.", extensionName: "WEBGL_compressed_texture_s3tc" };
    WebGlConstants.COMPRESSED_RGBA_S3TC_DXT5_EXT = { name: "COMPRESSED_RGBA_S3TC_DXT5_EXT", value: 33779, description: "A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.", extensionName: "WEBGL_compressed_texture_s3tc" };
    WebGlConstants.COMPRESSED_R11_EAC = { name: "COMPRESSED_R11_EAC", value: 37488, description: "One-channel (red) unsigned format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_SIGNED_R11_EAC = { name: "COMPRESSED_SIGNED_R11_EAC", value: 37489, description: "One-channel (red) signed format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_RG11_EAC = { name: "COMPRESSED_RG11_EAC", value: 37490, description: "Two-channel (red and green) unsigned format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_SIGNED_RG11_EAC = { name: "COMPRESSED_SIGNED_RG11_EAC", value: 37491, description: "Two-channel (red and green) signed format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_RGB8_ETC2 = { name: "COMPRESSED_RGB8_ETC2", value: 37492, description: "Compresses RBG8 data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_RGBA8_ETC2_EAC = { name: "COMPRESSED_RGBA8_ETC2_EAC", value: 37493, description: "Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_SRGB8_ETC2 = { name: "COMPRESSED_SRGB8_ETC2", value: 37494, description: "Compresses sRBG8 data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = { name: "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC", value: 37495, description: "Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = { name: "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2", value: 37496, description: "Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = { name: "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2", value: 37497, description: "Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.", extensionName: "WEBGL_compressed_texture_etc" };
    WebGlConstants.COMPRESSED_RGB_PVRTC_4BPPV1_IMG = { name: "COMPRESSED_RGB_PVRTC_4BPPV1_IMG", value: 35840, description: "RGB compression in 4-bit mode. One block for each 4×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
    WebGlConstants.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = { name: "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG", value: 35842, description: "RGBA compression in 4-bit mode. One block for each 4×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
    WebGlConstants.COMPRESSED_RGB_PVRTC_2BPPV1_IMG = { name: "COMPRESSED_RGB_PVRTC_2BPPV1_IMG", value: 35841, description: "RGB compression in 2-bit mode. One block for each 8×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
    WebGlConstants.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = { name: "COMPRESSED_RGBA_PVRTC_2BPPV1_IMG", value: 35843, description: "RGBA compression in 2-bit mode. One block for each 8×4 pixe", extensionName: "WEBGL_compressed_texture_pvrtc" };
    WebGlConstants.COMPRESSED_RGB_ETC1_WEBGL = { name: "COMPRESSED_RGB_ETC1_WEBGL", value: 36196, description: "Compresses 24-bit RGB data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc1" };
    WebGlConstants.COMPRESSED_RGB_ATC_WEBGL = { name: "COMPRESSED_RGB_ATC_WEBGL", value: 35986, description: "Compresses RGB textures with no alpha channel.", extensionName: "WEBGL_compressed_texture_atc" };
    WebGlConstants.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = { name: "COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL", value: 35986, description: "Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp).", extensionName: "WEBGL_compressed_texture_atc" };
    WebGlConstants.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = { name: "COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL", value: 34798, description: "Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient).", extensionName: "WEBGL_compressed_texture_atc" };
    WebGlConstants.UNSIGNED_INT_24_8_WEBGL = { name: "UNSIGNED_INT_24_8_WEBGL", value: 34042, description: "Unsigned integer type for 24-bit depth texture data.", extensionName: "WEBGL_depth_texture" };
    WebGlConstants.HALF_FLOAT_OES = { name: "HALF_FLOAT_OES", value: 36193, description: "Half floating-point type (16-bit).", extensionName: "OES_texture_half_float" };
    WebGlConstants.RGBA32F_EXT = { name: "RGBA32F_EXT", value: 34836, description: "RGBA 32-bit floating-point color-renderable format.", extensionName: "WEBGL_color_buffer_float" };
    WebGlConstants.RGB32F_EXT = { name: "RGB32F_EXT", value: 34837, description: "RGB 32-bit floating-point color-renderable format.", extensionName: "WEBGL_color_buffer_float" };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT = { name: "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT", value: 33297, description: " ", extensionName: "WEBGL_color_buffer_float" };
    WebGlConstants.UNSIGNED_NORMALIZED_EXT = { name: "UNSIGNED_NORMALIZED_EXT", value: 35863, description: " ", extensionName: "WEBGL_color_buffer_float" };
    WebGlConstants.MIN_EXT = { name: "MIN_EXT", value: 32775, description: "Produces the minimum color components of the source and destination colors.", extensionName: "EXT_blend_minmax" };
    WebGlConstants.MAX_EXT = { name: "MAX_EXT", value: 32776, description: "Produces the maximum color components of the source and destination colors.", extensionName: "EXT_blend_minmax" };
    WebGlConstants.SRGB_EXT = { name: "SRGB_EXT", value: 35904, description: "Unsized sRGB format that leaves the precision up to the driver.", extensionName: "EXT_sRGB" };
    WebGlConstants.SRGB_ALPHA_EXT = { name: "SRGB_ALPHA_EXT", value: 35906, description: "Unsized sRGB format with unsized alpha component.", extensionName: "EXT_sRGB" };
    WebGlConstants.SRGB8_ALPHA8_EXT = { name: "SRGB8_ALPHA8_EXT", value: 35907, description: "Sized (8-bit) sRGB and alpha formats.", extensionName: "EXT_sRGB" };
    WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = { name: "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT", value: 33296, description: "Returns the framebuffer color encoding.", extensionName: "EXT_sRGB" };
    WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES = { name: "FRAGMENT_SHADER_DERIVATIVE_HINT_OES", value: 35723, description: "Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth.", extensionName: "OES_standard_derivatives" };
    WebGlConstants.COLOR_ATTACHMENT0_WEBGL = { name: "COLOR_ATTACHMENT0_WEBGL", value: 36064, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT1_WEBGL = { name: "COLOR_ATTACHMENT1_WEBGL", value: 36065, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT2_WEBGL = { name: "COLOR_ATTACHMENT2_WEBGL", value: 36066, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT3_WEBGL = { name: "COLOR_ATTACHMENT3_WEBGL", value: 36067, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT4_WEBGL = { name: "COLOR_ATTACHMENT4_WEBGL", value: 36068, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT5_WEBGL = { name: "COLOR_ATTACHMENT5_WEBGL", value: 36069, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT6_WEBGL = { name: "COLOR_ATTACHMENT6_WEBGL", value: 36070, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT7_WEBGL = { name: "COLOR_ATTACHMENT7_WEBGL", value: 36071, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT8_WEBGL = { name: "COLOR_ATTACHMENT8_WEBGL", value: 36072, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT9_WEBGL = { name: "COLOR_ATTACHMENT9_WEBGL", value: 36073, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT10_WEBGL = { name: "COLOR_ATTACHMENT10_WEBGL", value: 36074, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT11_WEBGL = { name: "COLOR_ATTACHMENT11_WEBGL", value: 36075, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT12_WEBGL = { name: "COLOR_ATTACHMENT12_WEBGL", value: 36076, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT13_WEBGL = { name: "COLOR_ATTACHMENT13_WEBGL", value: 36077, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT14_WEBGL = { name: "COLOR_ATTACHMENT14_WEBGL", value: 36078, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.COLOR_ATTACHMENT15_WEBGL = { name: "COLOR_ATTACHMENT15_WEBGL", value: 36079, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER0_WEBGL = { name: "DRAW_BUFFER0_WEBGL", value: 34853, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER1_WEBGL = { name: "DRAW_BUFFER1_WEBGL", value: 34854, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER2_WEBGL = { name: "DRAW_BUFFER2_WEBGL", value: 34855, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER3_WEBGL = { name: "DRAW_BUFFER3_WEBGL", value: 34856, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER4_WEBGL = { name: "DRAW_BUFFER4_WEBGL", value: 34857, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER5_WEBGL = { name: "DRAW_BUFFER5_WEBGL", value: 34858, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER6_WEBGL = { name: "DRAW_BUFFER6_WEBGL", value: 34859, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER7_WEBGL = { name: "DRAW_BUFFER7_WEBGL", value: 34860, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER8_WEBGL = { name: "DRAW_BUFFER8_WEBGL", value: 34861, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER9_WEBGL = { name: "DRAW_BUFFER9_WEBGL", value: 34862, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER10_WEBGL = { name: "DRAW_BUFFER10_WEBGL", value: 34863, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER11_WEBGL = { name: "DRAW_BUFFER11_WEBGL", value: 34864, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER12_WEBGL = { name: "DRAW_BUFFER12_WEBGL", value: 34865, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER13_WEBGL = { name: "DRAW_BUFFER13_WEBGL", value: 34866, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER14_WEBGL = { name: "DRAW_BUFFER14_WEBGL", value: 34867, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.DRAW_BUFFER15_WEBGL = { name: "DRAW_BUFFER15_WEBGL", value: 34868, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.MAX_COLOR_ATTACHMENTS_WEBGL = { name: "MAX_COLOR_ATTACHMENTS_WEBGL", value: 36063, description: "Maximum number of framebuffer color attachment points", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.MAX_DRAW_BUFFERS_WEBGL = { name: "MAX_DRAW_BUFFERS_WEBGL", value: 34852, description: "Maximum number of draw buffers", extensionName: "WEBGL_draw_buffers" };
    WebGlConstants.VERTEX_ARRAY_BINDING_OES = { name: "VERTEX_ARRAY_BINDING_OES", value: 34229, description: "The bound vertex array object (VAO).", extensionName: "VERTEX_ARRAY_BINDING_OES" };
    WebGlConstants.QUERY_COUNTER_BITS_EXT = { name: "QUERY_COUNTER_BITS_EXT", value: 34916, description: "The number of bits used to hold the query result for the given target.", extensionName: "EXT_disjoint_timer_query" };
    WebGlConstants.CURRENT_QUERY_EXT = { name: "CURRENT_QUERY_EXT", value: 34917, description: "The currently active query.", extensionName: "EXT_disjoint_timer_query" };
    WebGlConstants.QUERY_RESULT_EXT = { name: "QUERY_RESULT_EXT", value: 34918, description: "The query result.", extensionName: "EXT_disjoint_timer_query" };
    WebGlConstants.QUERY_RESULT_AVAILABLE_EXT = { name: "QUERY_RESULT_AVAILABLE_EXT", value: 34919, description: "A Boolean indicating whether or not a query result is available.", extensionName: "EXT_disjoint_timer_query" };
    WebGlConstants.TIME_ELAPSED_EXT = { name: "TIME_ELAPSED_EXT", value: 35007, description: "Elapsed time (in nanoseconds).", extensionName: "EXT_disjoint_timer_query" };
    WebGlConstants.TIMESTAMP_EXT = { name: "TIMESTAMP_EXT", value: 36392, description: "The current time.", extensionName: "EXT_disjoint_timer_query" };
    WebGlConstants.GPU_DISJOINT_EXT = { name: "GPU_DISJOINT_EXT", value: 36795, description: "A Boolean indicating whether or not the GPU performed any disjoint operation.", extensionName: "EXT_disjoint_timer_query" };
    SPECTOR.WebGlConstants = WebGlConstants;
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    SPECTOR.WebGlConstantsByName = {};
    (function init() {
        for (var name_1 in SPECTOR.WebGlConstants) {
            var constant = SPECTOR.WebGlConstants[name_1];
            SPECTOR.WebGlConstantsByName[constant.name] = constant;
        }
    })();
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    SPECTOR.WebGlConstantsByValue = {};
    (function init() {
        for (var name_2 in SPECTOR.WebGlConstants) {
            var constant = SPECTOR.WebGlConstants[name_2];
            SPECTOR.WebGlConstantsByValue[constant.value] = constant;
        }
    })();
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Decorators;
    (function (Decorators) {
        var COMMANDNAMEKEY = "__CommandName";
        function command(commandName) {
            return function (target) {
                target[COMMANDNAMEKEY] = commandName;
            };
        }
        Decorators.command = command;
        function getCommandName(target) {
            return target[COMMANDNAMEKEY];
        }
        Decorators.getCommandName = getCommandName;
        var STATENAMEKEY = "__StateName";
        function state(stateName) {
            return function (target) {
                target[STATENAMEKEY] = stateName;
            };
        }
        Decorators.state = state;
        function getStateName(target) {
            return target[STATENAMEKEY];
        }
        Decorators.getStateName = getStateName;
        var RECORDEROBJECTNAMEKEY = "___RecorderObjectName";
        function recorder(objectName) {
            return function (target) {
                target[RECORDEROBJECTNAMEKEY] = objectName;
            };
        }
        Decorators.recorder = recorder;
        function getRecorderName(target) {
            return target[RECORDEROBJECTNAMEKEY];
        }
        Decorators.getRecorderName = getRecorderName;
        Decorators.OBJECTNAMEKEY = "___ObjectName";
        Decorators.OBJECTTYPEKEY = "___ObjectType";
        function webGlObject(objectName) {
            return function (target) {
                target[Decorators.OBJECTNAMEKEY] = objectName;
                target[Decorators.OBJECTTYPEKEY] = window[objectName] || null;
            };
        }
        Decorators.webGlObject = webGlObject;
        function getWebGlObjectName(target) {
            return target[Decorators.OBJECTNAMEKEY];
        }
        Decorators.getWebGlObjectName = getWebGlObjectName;
        function getWebGlObjectType(target) {
            return target[Decorators.OBJECTTYPEKEY];
        }
        Decorators.getWebGlObjectType = getWebGlObjectType;
    })(Decorators = SPECTOR.Decorators || (SPECTOR.Decorators = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var TimeSpy = (function () {
            function TimeSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.spiedWindow = options.spiedWindow || window;
                this.lastFrame = 0;
                this.speedRatio = 1;
                this.willPlayNextFrame = false;
                this.onFrameStart = new options.eventConstructor();
                this.onFrameEnd = new options.eventConstructor();
                this.time = new this.options.timeConstructor();
                this.lastSixtyFramesDuration = [];
                this.lastSixtyFramesCurrentIndex = 0;
                this.lastSixtyFramesPreviousStart = 0;
                for (var i = 0; i < TimeSpy.fpsWindowSize; i++) {
                    this.lastSixtyFramesDuration[i] = 0;
                }
                this.init();
            }
            TimeSpy.prototype.playNextFrame = function () {
                this.willPlayNextFrame = true;
            };
            TimeSpy.prototype.changeSpeedRatio = function (ratio) {
                this.speedRatio = ratio;
            };
            TimeSpy.prototype.getFps = function () {
                var accumulator = 0;
                for (var i = 0; i < TimeSpy.fpsWindowSize; i++) {
                    accumulator += this.lastSixtyFramesDuration[i];
                }
                if (accumulator === 0) {
                    return 0;
                }
                return 1000 * 60 / accumulator;
            };
            TimeSpy.prototype.init = function () {
                for (var _i = 0, _a = TimeSpy.requestAnimationFrameFunctions; _i < _a.length; _i++) {
                    var Spy = _a[_i];
                    this.spyRequestAnimationFrame(Spy);
                }
                for (var _b = 0, _c = TimeSpy.setTimerFunctions; _b < _c.length; _b++) {
                    var Spy = _c[_b];
                    this.spySetTimer(Spy);
                }
            };
            TimeSpy.prototype.spyRequestAnimationFrame = function (functionName) {
                var self = this;
                var oldRequestAnimationFrame = this.spiedWindow[functionName];
                var spiedWindow = this.spiedWindow;
                spiedWindow[functionName] = function () {
                    var callback = arguments[0];
                    var onCallback = self.getCallback(self, callback, function () { spiedWindow[functionName](callback); });
                    return oldRequestAnimationFrame.apply(self.spiedWindow, [onCallback]);
                };
            };
            TimeSpy.prototype.spySetTimer = function (functionName) {
                var self = this;
                var oldSetTimer = this.spiedWindow[functionName];
                var needsReplay = (functionName === "setTimeout");
                var spiedWindow = this.spiedWindow;
                spiedWindow[functionName] = function () {
                    var callback = arguments[0];
                    var time = arguments[1];
                    if (TimeSpy.setTimerCommonValues.indexOf(time) > -1) {
                        callback = self.getCallback(self, callback, needsReplay ? function () { spiedWindow[functionName](callback); } : null);
                    }
                    return oldSetTimer.apply(self.spiedWindow, [callback, time]);
                };
            };
            TimeSpy.prototype.getCallback = function (self, callback, skippedCalback) {
                if (skippedCalback === void 0) { skippedCalback = null; }
                return function () {
                    var now = self.time.now;
                    self.lastFrame = ++self.lastFrame % self.speedRatio;
                    if (self.willPlayNextFrame || (self.speedRatio && !self.lastFrame)) {
                        self.onFrameStart.trigger(self);
                        callback.apply(self.spiedWindow, arguments);
                        self.lastSixtyFramesCurrentIndex = (self.lastSixtyFramesCurrentIndex + 1) % TimeSpy.fpsWindowSize;
                        self.lastSixtyFramesDuration[self.lastSixtyFramesCurrentIndex] = now - self.lastSixtyFramesPreviousStart;
                        self.onFrameEnd.trigger(self);
                        self.willPlayNextFrame = false;
                    }
                    else {
                        if (skippedCalback) {
                            skippedCalback();
                        }
                    }
                    self.lastSixtyFramesPreviousStart = now;
                };
            };
            return TimeSpy;
        }());
        TimeSpy.requestAnimationFrameFunctions = ['requestAnimationFrame',
            'msRequestAnimationFrame',
            'webkitRequestAnimationFrame',
            'mozRequestAnimationFrame',
            'oRequestAnimationFrame'
        ];
        TimeSpy.setTimerFunctions = ['setTimeout',
            'setInterval'
        ];
        TimeSpy.setTimerCommonValues = [0, 15, 16, 33, 32, 40];
        TimeSpy.fpsWindowSize = 60;
        Spies.TimeSpy = TimeSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var CanvasSpy = (function () {
            function CanvasSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.onContextRequested = new options.eventConstructor();
                this.canvas = options.canvas;
                this.init();
            }
            CanvasSpy.prototype.init = function () {
                var self = this;
                var getContextSpied = function () {
                    var context = self.spiedGetContext.apply(this, arguments);
                    if (arguments.length > 0 && arguments[0] === "2d") {
                        return context;
                    }
                    if (context) {
                        var contextAttributes = Array.prototype.slice.call(arguments);
                        var isWebgl2 = (contextAttributes[0] === "webgl2" || contextAttributes[0] === "experimental-webgl2");
                        var version = isWebgl2 ? 2 : 1;
                        self.onContextRequested.trigger({
                            context: context,
                            contextVersion: version
                        });
                    }
                    return context;
                };
                if (this.canvas) {
                    this.spiedGetContext = this.canvas.getContext;
                    this.canvas.getContext = getContextSpied;
                }
                else {
                    this.spiedGetContext = HTMLCanvasElement.prototype.getContext;
                    HTMLCanvasElement.prototype.getContext = getContextSpied;
                }
            };
            return CanvasSpy;
        }());
        Spies.CanvasSpy = CanvasSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var ContextSpy = (function () {
            function ContextSpy(options, time, logger) {
                this.options = options;
                this.time = time;
                this.logger = logger;
                this.commandId = 0;
                this.context = options.context;
                this.version = options.version;
                this.capturing = false;
                this.globalCapturing = true;
                this.injection = options.injection;
                this.contextInformation = {
                    context: this.context,
                    contextVersion: this.version,
                    toggleCapture: this.toggleGlobalCapturing.bind(this),
                    tagWebGlObject: this.tagWebGlObject.bind(this),
                    extensions: {}
                };
                this.commandSpies = {};
                this.stateSpy = new this.injection.StateSpyCtor({
                    contextInformation: this.contextInformation,
                    stateNamespace: this.injection.StateNamespace
                }, logger);
                this.recorderSpy = new this.injection.RecorderSpyCtor({
                    contextInformation: this.contextInformation,
                    recorderNamespace: this.injection.RecorderNamespace
                }, logger);
                this.webGlObjectSpy = new this.injection.WebGlObjectSpyCtor({
                    contextInformation: this.contextInformation,
                    webGlObjectNamespace: this.injection.WebGlObjectNamespace
                }, logger);
                this.initStaticCapture();
                if (options.recordAlways) {
                    this.spy();
                }
            }
            ContextSpy.prototype.spy = function () {
                this.spyContext(this.context);
                var extensions = this.contextInformation.extensions;
                for (var extensionName in extensions) {
                    this.spyContext(extensions[extensionName]);
                }
            };
            ContextSpy.prototype.unSpy = function () {
                for (var member in this.commandSpies) {
                    this.commandSpies[member].unSpy();
                }
            };
            ContextSpy.prototype.startCapture = function () {
                var startTime = this.time.now;
                if (!this.options.recordAlways) {
                    this.spy();
                }
                this.capturing = true;
                this.commandId = 0;
                this.currentCapture = {
                    canvas: this.canvasCapture,
                    context: this.contextCapture,
                    commands: [],
                    initState: {},
                    endState: {},
                    startTime: startTime,
                    listenCommandsStartTime: 0,
                    listenCommandsEndTime: 0,
                    endTime: 0
                };
                this.stateSpy.startCapture(this.currentCapture);
                this.currentCapture.listenCommandsStartTime = this.time.now;
            };
            ContextSpy.prototype.stopCapture = function () {
                var listenCommandsEndTime = this.time.now;
                if (!this.options.recordAlways) {
                    this.unSpy();
                }
                this.capturing = false;
                this.stateSpy.stopCapture(this.currentCapture);
                this.currentCapture.listenCommandsEndTime = listenCommandsEndTime;
                this.currentCapture.endTime = this.time.now;
                return this.currentCapture;
            };
            ContextSpy.prototype.isCapturing = function () {
                return this.globalCapturing && this.capturing;
            };
            ContextSpy.prototype.getNextCommandCaptureId = function () {
                return this.commandId++;
            };
            ContextSpy.prototype.onCommand = function (commandSpy, functionInformation) {
                if (!this.globalCapturing) {
                    return;
                }
                this.webGlObjectSpy.tagWebGlObjects(functionInformation);
                this.recorderSpy.recordCommand(functionInformation);
                if (this.isCapturing()) {
                    var commandCapture = commandSpy.createCapture(functionInformation, this.getNextCommandCaptureId());
                    this.stateSpy.captureState(commandCapture);
                    this.currentCapture.commands.push(commandCapture);
                    commandCapture.endTime = this.time.now;
                }
            };
            ContextSpy.prototype.spyContext = function (bindingContext) {
                for (var member in bindingContext) {
                    if (~ContextSpy.unSpyableMembers.indexOf(member)) {
                        continue;
                    }
                    try {
                        var isFunction = typeof bindingContext[member] !== 'number';
                        if (isFunction) {
                            this.spyFunction(member, bindingContext);
                        }
                    }
                    catch (e) {
                        this.logger.error('Cant Spy member: ' + member);
                        this.logger.error(e);
                    }
                }
            };
            ContextSpy.prototype.initStaticCapture = function () {
                var extensionsState = new this.injection.ExtensionsCtor(this.contextInformation, this.logger);
                var extensions = extensionsState.getExtensions();
                for (var extensionName in extensions) {
                    this.contextInformation.extensions[extensionName] = extensions[extensionName];
                }
                var capabilitiesState = new this.injection.CapabilitiesCtor(this.contextInformation, this.logger);
                var compressedTextures = new this.injection.CompressedTexturesCtor(this.contextInformation, this.logger);
                this.contextCapture = {
                    version: this.version,
                    contextAttributes: this.context.getContextAttributes(),
                    capabilities: capabilitiesState.getStateData(),
                    extensions: extensionsState.getStateData(),
                    compressedTextures: compressedTextures.getStateData()
                };
                this.canvasCapture = {
                    width: this.context.canvas.width,
                    height: this.context.canvas.height,
                    clientWidth: this.context.canvas.clientWidth,
                    clientHeight: this.context.canvas.clientHeight,
                    browserAgent: navigator ? navigator.userAgent : ""
                };
            };
            ContextSpy.prototype.spyFunction = function (member, bindingContext) {
                if (!this.commandSpies[member]) {
                    var options = SPECTOR.merge(this.contextInformation, {
                        spiedCommandName: member,
                        spiedCommandRunningContext: bindingContext,
                        callback: this.onCommand.bind(this),
                        commandNamespace: this.injection.CommandNamespace,
                        stackTraceCtor: this.injection.StackTraceCtor,
                        defaultCommandCtor: this.injection.DefaultCommandCtor
                    });
                    this.commandSpies[member] = new this.injection.CommandSpyCtor(options, this.time, this.logger);
                }
                this.commandSpies[member].spy();
            };
            ContextSpy.prototype.toggleGlobalCapturing = function (capture) {
                this.globalCapturing = capture;
            };
            ContextSpy.prototype.tagWebGlObject = function (object) {
                return this.webGlObjectSpy.tagWebGlObject(object);
            };
            return ContextSpy;
        }());
        ContextSpy.unSpyableMembers = ['canvas',
            'drawingBufferWidth',
            'drawingBufferHeight'
        ];
        Spies.ContextSpy = ContextSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var CommandSpy = (function () {
            function CommandSpy(options, time, logger) {
                this.time = time;
                this.logger = logger;
                this.stackTrace = new options.stackTraceCtor();
                this.spiedCommandName = options.spiedCommandName;
                this.spiedCommandRunningContext = options.spiedCommandRunningContext;
                this.spiedCommand = this.spiedCommandRunningContext[this.spiedCommandName];
                this.callback = options.callback;
                this.commandOptions = {
                    context: options.context,
                    contextVersion: options.contextVersion,
                    extensions: options.extensions,
                    toggleCapture: options.toggleCapture,
                    spiedCommandName: options.spiedCommandName
                };
                this.initCustomCommands(options.commandNamespace);
                this.initCommand(options.defaultCommandCtor);
            }
            CommandSpy.prototype.spy = function () {
                this.spiedCommandRunningContext[this.spiedCommandName] = this.overloadedCommand;
            };
            CommandSpy.prototype.unSpy = function () {
                this.spiedCommandRunningContext[this.spiedCommandName] = this.spiedCommand;
            };
            CommandSpy.prototype.createCapture = function (functionInformation, commandCaptureId) {
                return this.command.createCapture(functionInformation, commandCaptureId);
            };
            CommandSpy.prototype.initCustomCommands = function (commandNamespace) {
                if (CommandSpy.customCommandsConstructors) {
                    return;
                }
                CommandSpy.customCommandsConstructors = {};
                for (var Spy in commandNamespace) {
                    var commandCtor = commandNamespace[Spy];
                    var commandName = SPECTOR.Decorators.getCommandName(commandCtor);
                    if (commandName) {
                        CommandSpy.customCommandsConstructors[commandName] = commandCtor;
                    }
                }
            };
            CommandSpy.prototype.initCommand = function (defaultCommandCtor) {
                if (CommandSpy.customCommandsConstructors[this.spiedCommandName]) {
                    this.command = new CommandSpy.customCommandsConstructors[this.spiedCommandName](this.commandOptions, this.stackTrace, this.logger);
                }
                else {
                    this.command = new defaultCommandCtor(this.commandOptions, this.stackTrace, this.logger);
                }
                this.overloadedCommand = this.getSpy();
            };
            CommandSpy.prototype.getSpy = function () {
                var self = this;
                return function () {
                    var before = self.time.now;
                    var result = self.spiedCommand.apply(self.spiedCommandRunningContext, arguments);
                    var after = self.time.now;
                    var functionInformation = {
                        name: self.spiedCommandName,
                        arguments: arguments,
                        result: result,
                        startTime: before,
                        endTime: after
                    };
                    self.callback(self, functionInformation);
                    return result;
                };
            };
            return CommandSpy;
        }());
        Spies.CommandSpy = CommandSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var BaseCommand = (function () {
            function BaseCommand(options, stackTrace, logger) {
                this.options = options;
                this.stackTrace = stackTrace;
                this.logger = logger;
                this.spiedCommandName = options.spiedCommandName;
            }
            BaseCommand.prototype.createCapture = function (functionInformation, commandCaptureId) {
                // Removes the spector interna calls to leave only th relevant part. 
                var stackTrace = this.stackTrace.getStackTrace(4, 1);
                var text = this.stringify(functionInformation.arguments, functionInformation.result);
                var commandCapture = {
                    id: commandCaptureId,
                    startTime: functionInformation.startTime,
                    commandEndTime: functionInformation.endTime,
                    endTime: 0,
                    name: functionInformation.name,
                    commandArguments: functionInformation.arguments,
                    result: functionInformation.result,
                    stackTrace: stackTrace,
                    status: 0 /* Unknown */,
                    text: text,
                };
                this.transformCapture(commandCapture);
                return commandCapture;
            };
            BaseCommand.prototype.transformCapture = function (commandCapture) {
                // Nothing by default.
            };
            BaseCommand.prototype.stringify = function (args, result) {
                var stringified = this.options.spiedCommandName;
                if (args && args.length > 0) {
                    stringified += ": " + this.stringifyArgs(args).join(", ");
                }
                if (result) {
                    stringified += " -> " + this.stringifyResult(result);
                }
                return stringified;
            };
            BaseCommand.prototype.stringifyArgs = function (args) {
                var stringified = [];
                for (var i = 0; i < args.length; i++) {
                    var arg = args[i];
                    var stringifiedValue = this.stringifyValue(arg);
                    stringified.push(stringifiedValue);
                }
                return stringified;
            };
            BaseCommand.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return this.stringifyValue(result);
            };
            BaseCommand.prototype.stringifyValue = function (value) {
                if (value === null) {
                    return "null";
                }
                if (value === undefined) {
                    return "undefined";
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(value);
                if (tag) {
                    return tag.displayText;
                }
                if (typeof value === "number" && SPECTOR.WebGlConstants.isWebGlConstant(value)) {
                    return SPECTOR.WebGlConstants.stringifyWebGlConstant(value, this.spiedCommandName);
                }
                if (typeof value === "string") {
                    return value;
                }
                if (value instanceof HTMLImageElement) {
                    return value.src;
                }
                if (value instanceof ArrayBuffer) {
                    return "[--(" + value.byteLength + ")--]";
                }
                if (value.length) {
                    return "[..(" + value.length + ")..]";
                }
                return value;
            };
            return BaseCommand;
        }());
        Commands.BaseCommand = BaseCommand;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var deprecatedCommands = [
            "lineWidth",
        ];
        var DefaultCommand = (function (_super) {
            __extends(DefaultCommand, _super);
            function DefaultCommand(options, stackTrace, logger) {
                var _this = _super.call(this, options, stackTrace, logger) || this;
                _this.isDeprecated = (deprecatedCommands.indexOf(_this.spiedCommandName) > -1);
                return _this;
            }
            DefaultCommand.prototype.transformCapture = function (commandCapture) {
                if (this.isDeprecated) {
                    commandCapture.status = 50 /* Deprecated */;
                }
            };
            return DefaultCommand;
        }(Commands.BaseCommand));
        Commands.DefaultCommand = DefaultCommand;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var Clear = (function (_super) {
            __extends(Clear, _super);
            function Clear() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Clear.prototype.stringifyArgs = function (args) {
                var stringified = [];
                if ((args[0] & SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) === SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.name);
                }
                if ((args[0] & SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) === SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.name);
                }
                if ((args[0] & SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) === SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.name);
                }
                return stringified;
            };
            return Clear;
        }(Commands.BaseCommand));
        Clear = __decorate([
            SPECTOR.Decorators.command("clear")
        ], Clear);
        Commands.Clear = Clear;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var BlitFrameBuffer = (function (_super) {
            __extends(BlitFrameBuffer, _super);
            function BlitFrameBuffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BlitFrameBuffer.prototype.stringifyArgs = function (args) {
                var stringified = [];
                var readFrameBuffer = this.options.context.getParameter(SPECTOR.WebGlConstants.READ_FRAMEBUFFER_BINDING.value);
                var readFrameBufferTag = this.options.tagWebGlObject(readFrameBuffer);
                stringified.push("READ FROM: " + this.stringifyValue(readFrameBufferTag));
                var drawFrameBuffer = this.options.context.getParameter(SPECTOR.WebGlConstants.DRAW_FRAMEBUFFER_BINDING.value);
                var drawFrameBufferTag = this.options.tagWebGlObject(drawFrameBuffer);
                stringified.push("WRITE TO: " + this.stringifyValue(drawFrameBufferTag));
                for (var i = 0; i < 8; i++) {
                    stringified.push(args[i]);
                }
                if ((args[8] & SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) === SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.name);
                }
                if ((args[8] & SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) === SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.name);
                }
                if ((args[8] & SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) === SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.name);
                }
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[9], "blitFrameBuffer"));
                return stringified;
            };
            return BlitFrameBuffer;
        }(Commands.BaseCommand));
        BlitFrameBuffer = __decorate([
            SPECTOR.Decorators.command("blitFrameBuffer")
        ], BlitFrameBuffer);
        Commands.BlitFrameBuffer = BlitFrameBuffer;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var VertexAttribPointer = (function (_super) {
            __extends(VertexAttribPointer, _super);
            function VertexAttribPointer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            VertexAttribPointer.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(args[0]);
                stringified.push(args[1]);
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[2], "vertexAttribPointer"));
                stringified.push(args[3]);
                stringified.push(args[4]);
                stringified.push(args[5]);
                return stringified;
            };
            return VertexAttribPointer;
        }(Commands.BaseCommand));
        VertexAttribPointer = __decorate([
            SPECTOR.Decorators.command("vertexAttribPointer")
        ], VertexAttribPointer);
        Commands.VertexAttribPointer = VertexAttribPointer;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetActiveAttrib = (function (_super) {
            __extends(GetActiveAttrib, _super);
            function GetActiveAttrib() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetActiveAttrib.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "name: " + result.name + ", size: " + result.size + ", type: " + result.type;
            };
            return GetActiveAttrib;
        }(Commands.BaseCommand));
        GetActiveAttrib = __decorate([
            SPECTOR.Decorators.command("getActiveAttrib")
        ], GetActiveAttrib);
        Commands.GetActiveAttrib = GetActiveAttrib;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetActiveUniform = (function (_super) {
            __extends(GetActiveUniform, _super);
            function GetActiveUniform() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetActiveUniform.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "name: " + result.name + ", size: " + result.size + ", type: " + result.type;
            };
            return GetActiveUniform;
        }(Commands.BaseCommand));
        GetActiveUniform = __decorate([
            SPECTOR.Decorators.command("getActiveUniform")
        ], GetActiveUniform);
        Commands.GetActiveUniform = GetActiveUniform;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetTransformFeedbackVarying = (function (_super) {
            __extends(GetTransformFeedbackVarying, _super);
            function GetTransformFeedbackVarying() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetTransformFeedbackVarying.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "name: " + result.name + ", size: " + result.size + ", type: " + result.type;
            };
            return GetTransformFeedbackVarying;
        }(Commands.BaseCommand));
        GetTransformFeedbackVarying = __decorate([
            SPECTOR.Decorators.command("getTransformFeedbackVarying")
        ], GetTransformFeedbackVarying);
        Commands.GetTransformFeedbackVarying = GetTransformFeedbackVarying;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetExtension = (function (_super) {
            __extends(GetExtension, _super);
            function GetExtension() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetExtension.prototype.stringifyResult = function (result) {
                return result ? "true" : "false";
            };
            return GetExtension;
        }(Commands.BaseCommand));
        GetExtension = __decorate([
            SPECTOR.Decorators.command("getExtension")
        ], GetExtension);
        Commands.GetExtension = GetExtension;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetShaderPrecisionFormat = (function (_super) {
            __extends(GetShaderPrecisionFormat, _super);
            function GetShaderPrecisionFormat() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetShaderPrecisionFormat.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "min: " + result.rangeMin + ", max: " + result.rangeMax + ", precision: " + result.precision;
            };
            return GetShaderPrecisionFormat;
        }(Commands.BaseCommand));
        GetShaderPrecisionFormat = __decorate([
            SPECTOR.Decorators.command("getShaderPrecisionFormat")
        ], GetShaderPrecisionFormat);
        Commands.GetShaderPrecisionFormat = GetShaderPrecisionFormat;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetParameter = (function (_super) {
            __extends(GetParameter, _super);
            function GetParameter() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetParameter.prototype.stringifyResult = function (result) {
                if (!result) {
                    return "null";
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(result);
                if (tag) {
                    return tag.displayText;
                }
                return result;
            };
            return GetParameter;
        }(Commands.BaseCommand));
        GetParameter = __decorate([
            SPECTOR.Decorators.command("getParameter")
        ], GetParameter);
        Commands.GetParameter = GetParameter;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var BaseRecorder = (function () {
            function BaseRecorder(options, logger) {
                this.options = options;
                this.createCommandNames = this.getCreateCommandNames();
                this.updateCommandNames = this.getUpdateCommandNames();
                this.deleteCommandNames = this.getDeleteCommandNames();
                this.objectName = options.objectName;
            }
            BaseRecorder.prototype.registerCallbacks = function (onFunctionCallbacks) {
                for (var _i = 0, _a = this.createCommandNames; _i < _a.length; _i++) {
                    var command = _a[_i];
                    onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                    onFunctionCallbacks[command].push(this.create.bind(this));
                }
                ;
                for (var _b = 0, _c = this.updateCommandNames; _b < _c.length; _b++) {
                    var command = _c[_b];
                    onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                    onFunctionCallbacks[command].push(this.update.bind(this));
                }
                ;
                for (var _d = 0, _e = this.deleteCommandNames; _d < _e.length; _d++) {
                    var command = _e[_d];
                    onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                    onFunctionCallbacks[command].push(this.delete.bind(this));
                }
                ;
            };
            BaseRecorder.prototype.create = function (functionInformation) {
                return undefined;
            };
            BaseRecorder.prototype.update = function (functionInformation) {
                return undefined;
            };
            BaseRecorder.prototype.delete = function (functionInformation) {
                return undefined;
            };
            BaseRecorder.prototype.createWithoutSideEffects = function (functionInformation) {
                this.options.toggleCapture(false);
                var result = this.create(functionInformation);
                this.options.toggleCapture(true);
                return result;
            };
            BaseRecorder.prototype.updateWithoutSideEffects = function (functionInformation) {
                this.options.toggleCapture(false);
                var result = this.update(functionInformation);
                this.options.toggleCapture(true);
                return result;
            };
            BaseRecorder.prototype.deleteWithoutSideEffects = function (functionInformation) {
                this.options.toggleCapture(false);
                var result = this.delete(functionInformation);
                this.options.toggleCapture(true);
                return result;
            };
            return BaseRecorder;
        }());
        Recorders.BaseRecorder = BaseRecorder;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var BufferRecorder = BufferRecorder_1 = (function (_super) {
            __extends(BufferRecorder, _super);
            function BufferRecorder() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BufferRecorder.prototype.getCreateCommandNames = function () {
                return ["createBuffer"];
            };
            BufferRecorder.prototype.getUpdateCommandNames = function () {
                return ["bufferData", "bufferSubData"];
            };
            BufferRecorder.prototype.getDeleteCommandNames = function () {
                return ["deleteBuffer"];
            };
            BufferRecorder.prototype.getBoundObject = function (target) {
                var bindingPoint = BufferRecorder_1.targetBindings[target];
                var object = this.options.context.getParameter(bindingPoint);
                return object;
            };
            return BufferRecorder;
        }(Recorders.BaseRecorder));
        BufferRecorder.targetBindings = (_a = {},
            _a[SPECTOR.WebGlConstants.ARRAY_BUFFER.value] = SPECTOR.WebGlConstants.ARRAY_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.ELEMENT_ARRAY_BUFFER.value] = SPECTOR.WebGlConstants.ELEMENT_ARRAY_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.COPY_READ_BUFFER.value] = SPECTOR.WebGlConstants.COPY_READ_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.COPY_WRITE_BUFFER.value] = SPECTOR.WebGlConstants.COPY_WRITE_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER.value] = SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.UNIFORM_BUFFER.value] = SPECTOR.WebGlConstants.UNIFORM_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.PIXEL_PACK_BUFFER.value] = SPECTOR.WebGlConstants.PIXEL_PACK_BUFFER_BINDING.value,
            _a[SPECTOR.WebGlConstants.PIXEL_UNPACK_BUFFER.value] = SPECTOR.WebGlConstants.PIXEL_UNPACK_BUFFER_BINDING.value,
            _a);
        BufferRecorder = BufferRecorder_1 = __decorate([
            SPECTOR.Decorators.recorder("WebGLBuffer")
        ], BufferRecorder);
        Recorders.BufferRecorder = BufferRecorder;
        var BufferRecorder_1;
        var _a;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var RecorderSpy = (function () {
            function RecorderSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.recorders = {};
                this.recorderConstructors = {};
                this.onCommandCallbacks = {};
                this.contextInformation = options.contextInformation;
                this.initAvailableRecorders();
                this.initRecorders();
            }
            RecorderSpy.prototype.recordCommand = function (functionInformation) {
                var callbacks = this.onCommandCallbacks[functionInformation.name];
                if (callbacks) {
                    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                        var callback = callbacks_1[_i];
                        callback(functionInformation);
                    }
                }
            };
            RecorderSpy.prototype.initAvailableRecorders = function () {
                for (var recorder in this.options.recorderNamespace) {
                    var recorderCtor = this.options.recorderNamespace[recorder];
                    var objectName = SPECTOR.Decorators.getRecorderName(recorderCtor);
                    if (objectName) {
                        this.recorderConstructors[objectName] = recorderCtor;
                    }
                }
            };
            RecorderSpy.prototype.initRecorders = function () {
                for (var objectName in this.recorderConstructors) {
                    var options = SPECTOR.merge({ objectName: objectName }, this.contextInformation);
                    var recorder = new this.recorderConstructors[objectName](options, this.logger);
                    this.recorders[objectName] = recorder;
                    recorder.registerCallbacks(this.onCommandCallbacks);
                }
            };
            return RecorderSpy;
        }());
        Spies.RecorderSpy = RecorderSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var StateSpy = (function () {
            function StateSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.stateTrackers = {};
                this.onCommandCapturedCallbacks = {};
                this.stateConstructors = {};
                this.contextInformation = options.contextInformation;
                this.initAvailableStateTrackers();
                this.initStateTrackers();
            }
            StateSpy.prototype.startCapture = function (currentCapture) {
                for (var stateTrackerName in this.stateTrackers) {
                    var stateTracker = this.stateTrackers[stateTrackerName];
                    var state = stateTracker.startCapture();
                    if (stateTracker.requireStartAndStopStates) {
                        currentCapture.initState[stateTrackerName] = state;
                    }
                }
            };
            StateSpy.prototype.stopCapture = function (currentCapture) {
                for (var stateTrackerName in this.stateTrackers) {
                    var stateTracker = this.stateTrackers[stateTrackerName];
                    var state = stateTracker.stopCapture();
                    if (stateTracker.requireStartAndStopStates) {
                        currentCapture.endState[stateTrackerName] = state;
                    }
                }
            };
            StateSpy.prototype.captureState = function (commandCapture) {
                var callbacks = this.onCommandCapturedCallbacks[commandCapture.name];
                if (callbacks) {
                    for (var _i = 0, callbacks_2 = callbacks; _i < callbacks_2.length; _i++) {
                        var callback = callbacks_2[_i];
                        callback(commandCapture);
                    }
                }
            };
            StateSpy.prototype.initAvailableStateTrackers = function () {
                for (var state in this.options.stateNamespace) {
                    var stateCtor = this.options.stateNamespace[state];
                    var stateName = SPECTOR.Decorators.getStateName(stateCtor);
                    if (stateName) {
                        this.stateConstructors[stateName] = stateCtor;
                    }
                }
            };
            StateSpy.prototype.initStateTrackers = function () {
                for (var stateName in this.stateConstructors) {
                    var options = SPECTOR.merge({ stateName: stateName }, this.contextInformation);
                    var stateTracker = new this.stateConstructors[stateName](options, this.logger);
                    this.stateTrackers[stateName] = stateTracker;
                    stateTracker.registerCallbacks(this.onCommandCapturedCallbacks);
                }
            };
            return StateSpy;
        }());
        Spies.StateSpy = StateSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var WebGlObjectSpy = (function () {
            function WebGlObjectSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.webGlObjectConstructors = {};
                this.webGlObjects = {};
                this.contextInformation = options.contextInformation;
                this.initAvailableWebglObjects();
                this.initWebglObjects();
            }
            WebGlObjectSpy.prototype.tagWebGlObjects = function (functionInformation) {
                for (var typeName in this.webGlObjects) {
                    var webGlObject = this.webGlObjects[typeName];
                    for (var i = 0; i < functionInformation.arguments.length; i++) {
                        var arg = functionInformation.arguments[i];
                        if (webGlObject.tagWebGlObject(arg)) {
                            break;
                        }
                    }
                    if (webGlObject.tagWebGlObject(functionInformation.result)) {
                        break;
                    }
                }
            };
            WebGlObjectSpy.prototype.tagWebGlObject = function (object) {
                for (var typeName in this.webGlObjects) {
                    var webGlObject = this.webGlObjects[typeName];
                    var tag = webGlObject.tagWebGlObject(object);
                    if (tag) {
                        return tag;
                    }
                }
                return undefined;
            };
            WebGlObjectSpy.prototype.initAvailableWebglObjects = function () {
                for (var webGlObject in this.options.webGlObjectNamespace) {
                    var webGlObjectCtor = this.options.webGlObjectNamespace[webGlObject];
                    var typeName = SPECTOR.Decorators.getWebGlObjectName(webGlObjectCtor);
                    var type = SPECTOR.Decorators.getWebGlObjectType(webGlObjectCtor);
                    if (typeName && type) {
                        this.webGlObjectConstructors[typeName] = {
                            ctor: webGlObjectCtor,
                            type: type
                        };
                    }
                }
            };
            WebGlObjectSpy.prototype.initWebglObjects = function () {
                for (var typeName in this.webGlObjectConstructors) {
                    var options = SPECTOR.merge({
                        typeName: typeName,
                        type: this.webGlObjectConstructors[typeName].type
                    }, this.contextInformation);
                    var webglObject = new this.webGlObjectConstructors[typeName].ctor(options, this.logger);
                    this.webGlObjects[typeName] = webglObject;
                }
            };
            return WebGlObjectSpy;
        }());
        Spies.WebGlObjectSpy = WebGlObjectSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        States.drawCommands = [
            "drawArrays",
            "drawElements",
            "drawArraysInstanced",
            "drawBuffers",
            "drawElementsInstanced",
            "drawRangeElements"
        ];
        var BaseState = (function () {
            function BaseState(options, logger) {
                this.options = options;
                this.logger = logger;
                this.context = options.context;
                this.contextVersion = options.contextVersion;
                this.extensions = options.extensions;
                this.toggleCapture = options.toggleCapture;
                this.stateName = options.stateName;
                this.consumeCommands = this.getConsumeCommands();
                this.changeCommandsByState = this.getChangeCommandsByState();
                this.commandNameToStates = this.getCommandNameToStates();
            }
            Object.defineProperty(BaseState.prototype, "requireStartAndStopStates", {
                get: function () {
                    return true;
                },
                enumerable: true,
                configurable: true
            });
            BaseState.prototype.startCapture = function (loadFromContext) {
                if (loadFromContext === void 0) { loadFromContext = true; }
                this.capturedCommandsByState = {};
                if (loadFromContext && this.requireStartAndStopStates) {
                    this.currentState = {};
                    this.readFromContextNoSideEffects();
                }
                this.copyCurrentStateToPrevious();
                this.currentState = {};
                return this.previousState;
            };
            BaseState.prototype.stopCapture = function () {
                if (this.requireStartAndStopStates) {
                    this.readFromContextNoSideEffects();
                }
                this.analyse(undefined);
                return this.currentState;
            };
            BaseState.prototype.registerCallbacks = function (callbacks) {
                for (var stateName in this.changeCommandsByState) {
                    for (var _i = 0, _a = this.changeCommandsByState[stateName]; _i < _a.length; _i++) {
                        var changeCommand = _a[_i];
                        callbacks[changeCommand] = callbacks[changeCommand] || [];
                        callbacks[changeCommand].push(this.onChangeCommand.bind(this));
                    }
                }
                for (var _b = 0, _c = this.consumeCommands; _b < _c.length; _b++) {
                    var commandName = _c[_b];
                    callbacks[commandName] = callbacks[commandName] || [];
                    callbacks[commandName].push(this.onConsumeCommand.bind(this));
                }
            };
            BaseState.prototype.getStateData = function () {
                return this.currentState;
            };
            BaseState.prototype.getConsumeCommands = function () {
                return [];
            };
            BaseState.prototype.getChangeCommandsByState = function () {
                return {};
            };
            BaseState.prototype.copyCurrentStateToPrevious = function () {
                if (!this.currentState) {
                    return;
                }
                this.previousState = this.currentState;
            };
            BaseState.prototype.onChangeCommand = function (command) {
                var stateNames = this.commandNameToStates[command.name];
                for (var _i = 0, stateNames_1 = stateNames; _i < stateNames_1.length; _i++) {
                    var stateName = stateNames_1[_i];
                    if (!this.isValidChangeCommand(command, stateName)) {
                        return;
                    }
                    this.capturedCommandsByState[stateName] = this.capturedCommandsByState[stateName] || [];
                    this.capturedCommandsByState[stateName].push(command);
                }
            };
            BaseState.prototype.isValidChangeCommand = function (command, stateName) {
                return true;
            };
            BaseState.prototype.onConsumeCommand = function (command) {
                if (!this.isValidConsumeCommand(command)) {
                    return;
                }
                this.readFromContextNoSideEffects();
                this.analyse(command);
                this.storeCommandIds();
                command[this.stateName] = this.currentState;
                this.startCapture(false);
            };
            BaseState.prototype.isValidConsumeCommand = function (command) {
                return true;
            };
            BaseState.prototype.analyse = function (consumeCommand) {
                for (var stateName in this.capturedCommandsByState) {
                    var commands = this.capturedCommandsByState[stateName];
                    var lengthM1 = commands.length - 1;
                    if (lengthM1 >= 0) {
                        if (consumeCommand) {
                            for (var i = 0; i < lengthM1; i++) {
                                var command_1 = commands[i];
                                command_1.consumeCommandId = consumeCommand.id;
                                this.changeCommandCaptureStatus(command_1, 30 /* Redundant */);
                            }
                            var isStateEnabled = this.isStateEnableNoSideEffects(stateName, consumeCommand.commandArguments);
                            var command = commands[lengthM1];
                            command.consumeCommandId = consumeCommand.id;
                            if (!this.areStatesEquals(this.currentState[stateName], this.previousState[stateName])) {
                                if (isStateEnabled) {
                                    this.changeCommandCaptureStatus(command, 40 /* Valid */);
                                }
                                else {
                                    this.changeCommandCaptureStatus(command, 20 /* Disabled */);
                                }
                            }
                            else {
                                this.changeCommandCaptureStatus(command, 30 /* Redundant */);
                            }
                        }
                        else {
                            for (var i = 0; i < commands.length; i++) {
                                var command = commands[i];
                                this.changeCommandCaptureStatus(command, 10 /* Unused */);
                            }
                        }
                    }
                }
            };
            BaseState.prototype.storeCommandIds = function () {
                var commandIdsStates = ["unusedCommandIds", "disabledCommandIds", "redundantCommandIds", "validCommandIds"];
                for (var _i = 0, commandIdsStates_1 = commandIdsStates; _i < commandIdsStates_1.length; _i++) {
                    var commandIdsStatus = commandIdsStates_1[_i];
                    this.currentState[commandIdsStatus] = [];
                }
                for (var stateName in this.capturedCommandsByState) {
                    var commands = this.capturedCommandsByState[stateName];
                    for (var _a = 0, commands_1 = commands; _a < commands_1.length; _a++) {
                        var command = commands_1[_a];
                        switch (command.status) {
                            case 10 /* Unused */:
                                this.currentState["unusedCommandIds"].push(command.id);
                                break;
                            case 20 /* Disabled */:
                                this.currentState["disabledCommandIds"].push(command.id);
                                break;
                            case 30 /* Redundant */:
                                this.currentState["redundantCommandIds"].push(command.id);
                                break;
                            case 40 /* Valid */:
                                this.currentState["validCommandIds"].push(command.id);
                                break;
                        }
                    }
                }
                for (var _b = 0, commandIdsStates_2 = commandIdsStates; _b < commandIdsStates_2.length; _b++) {
                    var commandIdsStatus = commandIdsStates_2[_b];
                    if (!this.currentState[commandIdsStatus].length) {
                        delete this.currentState[commandIdsStatus];
                    }
                }
            };
            BaseState.prototype.changeCommandCaptureStatus = function (capture, status) {
                if (capture.status < status) {
                    capture.status = status;
                    return true;
                }
                return false;
            };
            BaseState.prototype.areStatesEquals = function (a, b) {
                if (typeof a !== typeof b) {
                    return false;
                }
                if (a && !b) {
                    return false;
                }
                if (b && !a) {
                    return false;
                }
                if (a === undefined || a === null) {
                    return true;
                }
                if (a.length && b.length && typeof a !== "string") {
                    if (a.length !== b.length) {
                        return false;
                    }
                    for (var i = 0; i < a.length; i++) {
                        if (a[i] !== b[i]) {
                            return false;
                        }
                    }
                    return true;
                }
                return a === b;
            };
            BaseState.prototype.isStateEnable = function (stateName, args) {
                return true;
            };
            BaseState.prototype.readFromContextNoSideEffects = function () {
                this.toggleCapture(false);
                this.readFromContext();
                this.toggleCapture(true);
            };
            BaseState.prototype.isStateEnableNoSideEffects = function (stateName, args) {
                this.toggleCapture(false);
                var enable = this.isStateEnable(stateName, args);
                this.toggleCapture(true);
                return enable;
            };
            BaseState.prototype.getCommandNameToStates = function () {
                var result = {};
                for (var stateName in this.changeCommandsByState) {
                    for (var _i = 0, _a = this.changeCommandsByState[stateName]; _i < _a.length; _i++) {
                        var changeCommand = _a[_i];
                        result[changeCommand] = result[changeCommand] || [];
                        result[changeCommand].push(stateName);
                    }
                }
                return result;
            };
            return BaseState;
        }());
        States.BaseState = BaseState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ParameterState = (function (_super) {
            __extends(ParameterState, _super);
            function ParameterState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ParameterState.prototype.getWebgl1Parameters = function () {
                return [];
            };
            ;
            ParameterState.prototype.getWebgl2Parameters = function () {
                return [];
            };
            ;
            ParameterState.prototype.getChangeCommandsByState = function () {
                this.parameters = [];
                this.parameters.push(this.getWebgl1Parameters());
                if (this.contextVersion > 1) {
                    this.parameters.push(this.getWebgl2Parameters());
                }
                var changeCommandsByState = {};
                for (var version = 1; version <= this.contextVersion; version++) {
                    if (version > this.parameters.length) {
                        break;
                    }
                    if (!this.parameters[version - 1]) {
                        continue;
                    }
                    for (var _i = 0, _a = this.parameters[version - 1]; _i < _a.length; _i++) {
                        var parameter = _a[_i];
                        if (parameter.changeCommands) {
                            for (var _b = 0, _c = parameter.changeCommands; _b < _c.length; _b++) {
                                var command = _c[_b];
                                changeCommandsByState[parameter.constant.name] = changeCommandsByState[parameter.constant.name] || [];
                                changeCommandsByState[parameter.constant.name].push(command);
                            }
                        }
                    }
                }
                return changeCommandsByState;
            };
            ParameterState.prototype.readFromContext = function () {
                for (var version = 1; version <= this.contextVersion; version++) {
                    if (version > this.parameters.length) {
                        break;
                    }
                    for (var _i = 0, _a = this.parameters[version - 1]; _i < _a.length; _i++) {
                        var parameter = _a[_i];
                        var value = this.readParameterFromContext(parameter);
                        var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(value);
                        if (tag) {
                            this.currentState[parameter.constant.name] = tag;
                        }
                        else {
                            var stringValue = this.stringifyParameterValue(value, parameter);
                            this.currentState[parameter.constant.name] = stringValue;
                        }
                    }
                }
            };
            ParameterState.prototype.readParameterFromContext = function (parameter) {
                if (parameter.constant.extensionName && !this.extensions[parameter.constant.extensionName]) {
                    return "Extension " + parameter.constant.extensionName + " is unavailble.";
                }
                var value = this.context.getParameter(parameter.constant.value);
                return value;
            };
            ParameterState.prototype.stringifyParameterValue = function (value, parameter) {
                if (value === null) {
                    return "null";
                }
                if (value === undefined) {
                    return "undefined";
                }
                if (parameter.returnType === 30 /* GlUint */) {
                    value = value.toString(2);
                    value = "00000000000000000000000000000000".substr(value.length) + value;
                    return value;
                }
                if (typeof value === 'number' && SPECTOR.WebGlConstants.isWebGlConstant(value)) {
                    if (parameter.returnType === 20 /* GlEnum */) {
                        var commandName = parameter.changeCommands ? parameter.changeCommands[0] || "" : "";
                        value = SPECTOR.WebGlConstants.stringifyWebGlConstant(value, commandName);
                        return value;
                    }
                    else {
                        return value;
                    }
                }
                else if (value.length && typeof value !== "string") {
                    var newValue = [];
                    for (var i = 0; i < value.length; i++) {
                        newValue.push(value[i]);
                    }
                    return newValue;
                }
                return value;
            };
            return ParameterState;
        }(States.BaseState));
        States.ParameterState = ParameterState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var Information;
        (function (Information) {
            var Capabilities = (function (_super) {
                __extends(Capabilities, _super);
                function Capabilities(options, logger) {
                    var _this = _super.call(this, options, logger) || this;
                    _this.currentState = _this.startCapture();
                    return _this;
                }
                Capabilities.prototype.getWebgl1Parameters = function () {
                    return [{ constant: SPECTOR.WebGlConstants.RENDERER },
                        { constant: SPECTOR.WebGlConstants.VENDOR },
                        { constant: SPECTOR.WebGlConstants.VERSION },
                        { constant: SPECTOR.WebGlConstants.SHADING_LANGUAGE_VERSION },
                        { constant: SPECTOR.WebGlConstants.SAMPLES },
                        { constant: SPECTOR.WebGlConstants.SAMPLE_BUFFERS },
                        { constant: SPECTOR.WebGlConstants.RED_BITS },
                        { constant: SPECTOR.WebGlConstants.GREEN_BITS },
                        { constant: SPECTOR.WebGlConstants.BLUE_BITS },
                        { constant: SPECTOR.WebGlConstants.ALPHA_BITS },
                        { constant: SPECTOR.WebGlConstants.DEPTH_BITS },
                        { constant: SPECTOR.WebGlConstants.STENCIL_BITS },
                        { constant: SPECTOR.WebGlConstants.SUBPIXEL_BITS },
                        { constant: SPECTOR.WebGlConstants.LINE_WIDTH },
                        { constant: SPECTOR.WebGlConstants.ALIASED_LINE_WIDTH_RANGE },
                        { constant: SPECTOR.WebGlConstants.ALIASED_POINT_SIZE_RANGE },
                        { constant: SPECTOR.WebGlConstants.IMPLEMENTATION_COLOR_READ_FORMAT },
                        { constant: SPECTOR.WebGlConstants.IMPLEMENTATION_COLOR_READ_TYPE },
                        //{ constant: WebGlConstants.UNIFORM_BUFFER_OFFSET_ALIGNMENT },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS },
                        { constant: SPECTOR.WebGlConstants.MAX_CUBE_MAP_TEXTURE_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_UNIFORM_VECTORS },
                        { constant: SPECTOR.WebGlConstants.MAX_RENDERBUFFER_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_IMAGE_UNITS },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_VARYING_VECTORS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_ATTRIBS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_UNIFORM_VECTORS },
                        { constant: SPECTOR.WebGlConstants.MAX_VIEWPORT_DIMS },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_MAX_ANISOTROPY_EXT },
                        { constant: SPECTOR.WebGlConstants.MAX_COLOR_ATTACHMENTS_WEBGL },
                        { constant: SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL }];
                };
                Capabilities.prototype.getWebgl2Parameters = function () {
                    return [{ constant: SPECTOR.WebGlConstants.MAX_3D_TEXTURE_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_ARRAY_TEXTURE_LAYERS },
                        { constant: SPECTOR.WebGlConstants.MAX_CLIENT_WAIT_TIMEOUT_WEBGL },
                        { constant: SPECTOR.WebGlConstants.MAX_COLOR_ATTACHMENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_UNIFORM_BLOCKS },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS },
                        { constant: SPECTOR.WebGlConstants.MAX_ELEMENT_INDEX },
                        { constant: SPECTOR.WebGlConstants.MAX_ELEMENTS_INDICES },
                        { constant: SPECTOR.WebGlConstants.MAX_ELEMENTS_VERTICES },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_INPUT_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_UNIFORM_BLOCKS },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_PROGRAM_TEXEL_OFFSET },
                        { constant: SPECTOR.WebGlConstants.MAX_SAMPLES },
                        { constant: SPECTOR.WebGlConstants.MAX_SERVER_WAIT_TIMEOUT },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_LOD_BIAS },
                        { constant: SPECTOR.WebGlConstants.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS },
                        { constant: SPECTOR.WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_UNIFORM_BLOCK_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_UNIFORM_BUFFER_BINDINGS },
                        { constant: SPECTOR.WebGlConstants.MAX_VARYING_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_OUTPUT_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_UNIFORM_BLOCKS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MIN_PROGRAM_TEXEL_OFFSET }];
                };
                return Capabilities;
            }(States.ParameterState));
            Information.Capabilities = Capabilities;
        })(Information = States.Information || (States.Information = {}));
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var Information;
        (function (Information) {
            var CompressedTextures = (function (_super) {
                __extends(CompressedTextures, _super);
                function CompressedTextures(options, logger) {
                    var _this = _super.call(this, options, logger) || this;
                    _this.currentState = _this.startCapture();
                    return _this;
                }
                CompressedTextures.prototype.getWebgl1Parameters = function () {
                    return [{ constant: SPECTOR.WebGlConstants.COMPRESSED_TEXTURE_FORMATS }];
                };
                CompressedTextures.prototype.stringifyParameterValue = function (value, parameter) {
                    var formats = [];
                    for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                        var format = value_1[_i];
                        formats.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(format, "getParameter"));
                    }
                    return formats;
                };
                return CompressedTextures;
            }(States.ParameterState));
            Information.CompressedTextures = CompressedTextures;
        })(Information = States.Information || (States.Information = {}));
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var Information;
        (function (Information) {
            var Extensions = (function (_super) {
                __extends(Extensions, _super);
                function Extensions(options, logger) {
                    var _this = _super.call(this, options, logger) || this;
                    _this.extensionDefinition = [
                        [{ name: "ANGLE_instanced_arrays", description: "" },
                            { name: "EXT_blend_minmax", description: "" },
                            { name: "EXT_color_buffer_float", description: "" },
                            { name: "EXT_color_buffer_half_float", description: "" },
                            { name: "EXT_disjoint_timer_query", description: "" },
                            { name: "EXT_frag_depth", description: "" },
                            { name: "EXT_sRGB", description: "" },
                            { name: "EXT_shader_texture_lod", description: "" },
                            { name: "EXT_texture_filter_anisotropic", description: "" },
                            { name: "OES_element_index_uint", description: "" },
                            { name: "OES_standard_derivatives", description: "" },
                            { name: "OES_texture_float", description: "" },
                            { name: "OES_texture_float_linear", description: "" },
                            { name: "OES_texture_half_float", description: "" },
                            { name: "OES_texture_half_float_linear", description: "" },
                            { name: "OES_vertex_array_object", description: "" },
                            { name: "WEBGL_color_buffer_float", description: "" },
                            { name: "WEBGL_compressed_texture_astc", description: "" },
                            { name: "WEBGL_compressed_texture_atc", description: "" },
                            { name: "WEBGL_compressed_texture_etc", description: "" },
                            { name: "WEBGL_compressed_texture_etc1", description: "" },
                            { name: "WEBGL_compressed_texture_s3tc", description: "" },
                            //{ name: "WEBGL_debug_renderer_info", description: "" },
                            //{ name: "WEBGL_debug_shaders", description: "" },
                            { name: "WEBGL_depth_texture", description: "" },
                            { name: "WEBGL_draw_buffers", description: "" }]
                        // , 
                        // WebGl2  
                        // []
                    ];
                    _this.currentState = _this.startCapture();
                    return _this;
                }
                Extensions.prototype.readFromContext = function () {
                    for (var version = 1; version <= this.contextVersion; version++) {
                        if (version > this.extensionDefinition.length) {
                            break;
                        }
                        for (var _i = 0, _a = this.extensionDefinition[version - 1]; _i < _a.length; _i++) {
                            var parameter = _a[_i];
                            var value = this.context.getExtension(parameter.name);
                            if (value) {
                                this.currentState[parameter.name] = true;
                                this.extensions[parameter.name] = value;
                            }
                            else {
                                this.currentState[parameter.name] = false;
                            }
                        }
                    }
                };
                ;
                Extensions.prototype.getExtensions = function () {
                    return this.extensions;
                };
                ;
                return Extensions;
            }(States.BaseState));
            Information.Extensions = Extensions;
        })(Information = States.Information || (States.Information = {}));
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var AlignmentState = (function (_super) {
            __extends(AlignmentState, _super);
            function AlignmentState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AlignmentState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.PACK_ALIGNMENT, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_ALIGNMENT, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_COLORSPACE_CONVERSION_WEBGL, returnType: 20 /* GlEnum */, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_FLIP_Y_WEBGL, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_PREMULTIPLY_ALPHA_WEBGL, changeCommands: ["pixelStorei"] }];
            };
            AlignmentState.prototype.getWebgl2Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.PACK_ROW_LENGTH, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.PACK_SKIP_PIXELS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.PACK_SKIP_ROWS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_IMAGE_HEIGHT, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_SKIP_PIXELS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_SKIP_ROWS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_SKIP_IMAGES, changeCommands: ["pixelStorei"] }];
            };
            AlignmentState.prototype.getConsumeCommands = function () {
                return ["readPixels", "texImage2D", "texSubImage2D"];
            };
            AlignmentState.prototype.isValidChangeCommand = function (command, stateName) {
                return SPECTOR.WebGlConstantsByName[stateName].value == command.commandArguments[0];
            };
            return AlignmentState;
        }(States.ParameterState));
        AlignmentState = __decorate([
            SPECTOR.Decorators.state("AlignmentState")
        ], AlignmentState);
        States.AlignmentState = AlignmentState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var BlendState = (function (_super) {
            __extends(BlendState, _super);
            function BlendState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BlendState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.BLEND, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_COLOR, changeCommands: ["blendColor"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_DST_ALPHA, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_DST_RGB, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] },
                    // { constant: WebGlConstants.BLEND_EQUATION, returnType: ParameterReturnType.GlEnum, changeCommands: ["blendEquation", "blendEquationSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_EQUATION_ALPHA, returnType: 20 /* GlEnum */, changeCommands: ["blendEquation", "blendEquationSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_EQUATION_RGB, returnType: 20 /* GlEnum */, changeCommands: ["blendEquation", "blendEquationSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_SRC_ALPHA, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_SRC_RGB, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] }];
            };
            BlendState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] == SPECTOR.WebGlConstants.BLEND.value;
                }
                return true;
            };
            BlendState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            BlendState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.BLEND.value);
            };
            return BlendState;
        }(States.ParameterState));
        BlendState = __decorate([
            SPECTOR.Decorators.state("BlendState")
        ], BlendState);
        States.BlendState = BlendState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ClearState = (function (_super) {
            __extends(ClearState, _super);
            function ClearState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ClearState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.COLOR_CLEAR_VALUE, changeCommands: ["clearColor"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_CLEAR_VALUE, changeCommands: ["clearDepth"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_CLEAR_VALUE, changeCommands: ["clearStencil"] }];
            };
            ClearState.prototype.getConsumeCommands = function () {
                return ["clear"];
            };
            ClearState.prototype.isStateEnable = function (stateName, args) {
                switch (stateName) {
                    case SPECTOR.WebGlConstants.COLOR_CLEAR_VALUE.name:
                        return SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value === (args[0] & SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value);
                    case SPECTOR.WebGlConstants.DEPTH_CLEAR_VALUE.name:
                        return SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value === (args[0] & SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value);
                    case SPECTOR.WebGlConstants.STENCIL_CLEAR_VALUE.name:
                        return SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value === (args[0] & SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value);
                }
                return false;
            };
            return ClearState;
        }(States.ParameterState));
        ClearState = __decorate([
            SPECTOR.Decorators.state("ClearState")
        ], ClearState);
        States.ClearState = ClearState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ColorState = (function (_super) {
            __extends(ColorState, _super);
            function ColorState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ColorState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.COLOR_WRITEMASK, changeCommands: ["colorMask"] }];
            };
            ColorState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            return ColorState;
        }(States.ParameterState));
        ColorState = __decorate([
            SPECTOR.Decorators.state("ColorState")
        ], ColorState);
        States.ColorState = ColorState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var CoverageState = (function (_super) {
            __extends(CoverageState, _super);
            function CoverageState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CoverageState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.SAMPLE_COVERAGE_VALUE, changeCommands: ["sampleCoverage"] },
                    { constant: SPECTOR.WebGlConstants.SAMPLE_COVERAGE_INVERT, changeCommands: ["sampleCoverage"] }];
            };
            CoverageState.prototype.getWebgl2Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.SAMPLE_COVERAGE, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE, changeCommands: ["enable", "disable"] }];
            };
            CoverageState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    if (command.commandArguments[0] == SPECTOR.WebGlConstants.SAMPLE_COVERAGE.value) {
                        return stateName === SPECTOR.WebGlConstants.SAMPLE_COVERAGE.name;
                    }
                    if (command.commandArguments[0] == SPECTOR.WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE.value) {
                        return stateName === SPECTOR.WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE.name;
                    }
                    return false;
                }
                return true;
            };
            CoverageState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            CoverageState.prototype.isStateEnable = function (stateName, args) {
                if (this.contextVersion === 2) {
                    return this.context.isEnabled(SPECTOR.WebGlConstants.SAMPLE_COVERAGE.value);
                }
                return false;
            };
            return CoverageState;
        }(States.ParameterState));
        CoverageState = __decorate([
            SPECTOR.Decorators.state("CoverageState")
        ], CoverageState);
        States.CoverageState = CoverageState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var CullState = (function (_super) {
            __extends(CullState, _super);
            function CullState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CullState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.CULL_FACE, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.CULL_FACE_MODE, returnType: 20 /* GlEnum */, changeCommands: ["cullFace"] }];
            };
            CullState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            CullState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] == SPECTOR.WebGlConstants.CULL_FACE.value;
                }
                return true;
            };
            CullState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.CULL_FACE.value);
            };
            return CullState;
        }(States.ParameterState));
        CullState = __decorate([
            SPECTOR.Decorators.state("CullState")
        ], CullState);
        States.CullState = CullState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DepthState = (function (_super) {
            __extends(DepthState, _super);
            function DepthState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DepthState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.DEPTH_TEST, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_FUNC, returnType: 20 /* GlEnum */, changeCommands: ["depthFunc"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_RANGE, changeCommands: ["depthMask"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_WRITEMASK, changeCommands: ["depthRange"] }];
            };
            DepthState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            DepthState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] == SPECTOR.WebGlConstants.DEPTH_TEST.value;
                }
                return true;
            };
            DepthState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.DEPTH_TEST.value);
            };
            return DepthState;
        }(States.ParameterState));
        DepthState = __decorate([
            SPECTOR.Decorators.state("DepthState")
        ], DepthState);
        States.DepthState = DepthState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DrawState = (function (_super) {
            __extends(DrawState, _super);
            function DrawState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.DITHER, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.VIEWPORT, changeCommands: ["viewPort"] },
                    { constant: SPECTOR.WebGlConstants.FRONT_FACE, returnType: 20 /* GlEnum */, changeCommands: ["frontFace"] },
                    { constant: SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES, changeCommands: ["hint"] }];
            };
            DrawState.prototype.getWebgl2Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.RASTERIZER_DISCARD, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT, changeCommands: ["hint"] }];
            };
            DrawState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    if (command.commandArguments[0] == SPECTOR.WebGlConstants.DITHER.value) {
                        return stateName === SPECTOR.WebGlConstants.DITHER.name;
                    }
                    if (command.commandArguments[0] == SPECTOR.WebGlConstants.RASTERIZER_DISCARD.value) {
                        return stateName === SPECTOR.WebGlConstants.RASTERIZER_DISCARD.name;
                    }
                    return false;
                }
                if (command.name === "hint") {
                    if (command.commandArguments[0] == SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES.value) {
                        return stateName === SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES.name;
                    }
                    if (command.commandArguments[0] == SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT.value) {
                        return stateName === SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT.name;
                    }
                    return false;
                }
                return true;
            };
            DrawState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            DrawState.prototype.isStateEnable = function (stateName, args) {
                switch (stateName) {
                    case SPECTOR.WebGlConstants.DITHER.name:
                        return this.context.isEnabled(SPECTOR.WebGlConstants.DITHER.value);
                    case SPECTOR.WebGlConstants.RASTERIZER_DISCARD.name:
                        return this.context.isEnabled(SPECTOR.WebGlConstants.RASTERIZER_DISCARD.value);
                }
                return true;
            };
            return DrawState;
        }(States.ParameterState));
        DrawState = __decorate([
            SPECTOR.Decorators.state("DrawState")
        ], DrawState);
        States.DrawState = DrawState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var MipmapHintState = (function (_super) {
            __extends(MipmapHintState, _super);
            function MipmapHintState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            MipmapHintState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.GENERATE_MIPMAP_HINT, changeCommands: ["hint"] }];
            };
            MipmapHintState.prototype.getConsumeCommands = function () {
                return ["generateMipmap"];
            };
            return MipmapHintState;
        }(States.ParameterState));
        MipmapHintState = __decorate([
            SPECTOR.Decorators.state("MipmapHintState")
        ], MipmapHintState);
        States.MipmapHintState = MipmapHintState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var PolygonOffsetState = (function (_super) {
            __extends(PolygonOffsetState, _super);
            function PolygonOffsetState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            PolygonOffsetState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.POLYGON_OFFSET_FILL, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.POLYGON_OFFSET_FACTOR, changeCommands: ["polygonOffset"] },
                    { constant: SPECTOR.WebGlConstants.POLYGON_OFFSET_UNITS, changeCommands: ["polygonOffset"] }];
            };
            PolygonOffsetState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] == SPECTOR.WebGlConstants.POLYGON_OFFSET_FILL.value;
                }
                return true;
            };
            PolygonOffsetState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            PolygonOffsetState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.POLYGON_OFFSET_FILL.value);
            };
            return PolygonOffsetState;
        }(States.ParameterState));
        PolygonOffsetState = __decorate([
            SPECTOR.Decorators.state("PolygonOffsetState")
        ], PolygonOffsetState);
        States.PolygonOffsetState = PolygonOffsetState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ScissorState = (function (_super) {
            __extends(ScissorState, _super);
            function ScissorState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ScissorState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.SCISSOR_TEST, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.SCISSOR_BOX, changeCommands: ["scissor"] }];
            };
            ScissorState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] == SPECTOR.WebGlConstants.SCISSOR_TEST.value;
                }
                return true;
            };
            ScissorState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            ScissorState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.SCISSOR_TEST.value);
            };
            return ScissorState;
        }(States.ParameterState));
        ScissorState = __decorate([
            SPECTOR.Decorators.state("ScissorState")
        ], ScissorState);
        States.ScissorState = ScissorState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var StencilState = StencilState_1 = (function (_super) {
            __extends(StencilState, _super);
            function StencilState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            StencilState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.STENCIL_TEST, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_FUNC, returnType: 20 /* GlEnum */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_REF, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_VALUE_MASK, returnType: 30 /* GlUint */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_WRITEMASK, returnType: 30 /* GlUint */, changeCommands: ["stencilMask", "stencilMaskSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_FUNC, returnType: 20 /* GlEnum */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_PASS, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_REF, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_VALUE_MASK, returnType: 30 /* GlUint */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_WRITEMASK, returnType: 30 /* GlUint */, changeCommands: ["stencilMask", "stencilMaskSeparate"] }];
            };
            StencilState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] == SPECTOR.WebGlConstants.STENCIL_TEST.value;
                }
                if (command.name === "stencilOp" || command.name === "stencilOpSeparate") {
                    return StencilState_1.stencilOpStates.indexOf(command.commandArguments[0]) > 0;
                }
                if (command.name === "stencilFunc" || command.name === "stencilFuncSeparate") {
                    return StencilState_1.stencilFuncStates.indexOf(command.commandArguments[0]) > 0;
                }
                if (command.name === "stencilMask" || command.name === "stencilMaskSeparate") {
                    return StencilState_1.stencilMaskStates.indexOf(command.commandArguments[0]) > 0;
                }
                return true;
            };
            StencilState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            StencilState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.STENCIL_TEST.value);
            };
            return StencilState;
        }(States.ParameterState));
        StencilState.stencilOpStates = [SPECTOR.WebGlConstants.STENCIL_BACK_FAIL.value,
            SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL.value,
            SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS.value,
            SPECTOR.WebGlConstants.STENCIL_FAIL.value,
            SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_FAIL.value,
            SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_PASS.value,];
        StencilState.stencilFuncStates = [SPECTOR.WebGlConstants.STENCIL_BACK_FUNC.value,
            SPECTOR.WebGlConstants.STENCIL_BACK_REF.value,
            SPECTOR.WebGlConstants.STENCIL_BACK_VALUE_MASK.value,
            SPECTOR.WebGlConstants.STENCIL_FUNC.value,
            SPECTOR.WebGlConstants.STENCIL_REF.value,
            SPECTOR.WebGlConstants.STENCIL_VALUE_MASK.value];
        StencilState.stencilMaskStates = [SPECTOR.WebGlConstants.STENCIL_BACK_WRITEMASK.value,
            SPECTOR.WebGlConstants.STENCIL_WRITEMASK.value,];
        StencilState = StencilState_1 = __decorate([
            SPECTOR.Decorators.state("StencilState")
        ], StencilState);
        States.StencilState = StencilState;
        var StencilState_1;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var VisualState = VisualState_1 = (function (_super) {
            __extends(VisualState, _super);
            function VisualState(options, logger) {
                var _this = _super.call(this, options, logger) || this;
                _this.captureFrameBuffer = options.context.createFramebuffer();
                _this.workingCanvas = document.createElement('canvas');
                _this.workingContext2D = _this.workingCanvas.getContext('2d');
                _this.captureCanvas = document.createElement('canvas');
                _this.captureContext2D = _this.captureCanvas.getContext('2d');
                _this.captureContext2D.imageSmoothingEnabled = true;
                _this.captureContext2D.mozImageSmoothingEnabled = true;
                _this.captureContext2D.oImageSmoothingEnabled = true;
                _this.captureContext2D.webkitImageSmoothingEnabled = true;
                _this.captureContext2D.msImageSmoothingEnabled = true;
                return _this;
            }
            VisualState.prototype.getConsumeCommands = function () {
                return ["clear", "clearBufferfv", "clearBufferiv", "clearBufferuiv", "clearBufferfi"].concat(States.drawCommands);
            };
            VisualState.prototype.readFromContext = function () {
                var gl = this.context;
                this.currentState["Attachments"] = [];
                // Get FrameBuffer Viewport size to adapt the created screenshot.
                var viewport = gl.getParameter(gl.VIEWPORT);
                var width = viewport[2];
                var height = viewport[3];
                // Check the framebuffer status.
                var frameBuffer = this.context.getParameter(SPECTOR.WebGlConstants.FRAMEBUFFER_BINDING.value);
                if (!frameBuffer) {
                    this.currentState["FrameBuffer"] = null;
                    this.getCapture(gl, "Canvas COLOR_ATTACHMENT", width, height);
                    return;
                }
                this.getTag(frameBuffer);
                this.currentState["FrameBuffer"] = frameBuffer;
                // Check FBO status.
                var status = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                this.currentState["FrameBufferStatus"] = SPECTOR.WebGlConstantsByValue[status].name;
                if (status !== SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                    return;
                }
                // Capture all the attachments.
                var drawBuffersExtension = this.extensions[SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
                if (drawBuffersExtension) {
                    var maxDrawBuffers = this.context.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"], width, height);
                    }
                }
                else if (this.contextVersion > 1) {
                    var context2 = this.context;
                    var maxDrawBuffers = context2.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i], width, height);
                    }
                }
                else {
                    this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT0"], width, height);
                }
            };
            VisualState.prototype.readFrameBufferAttachmentFromContext = function (gl, frameBuffer, webglConstant, width, height) {
                var target = SPECTOR.WebGlConstants.FRAMEBUFFER.value;
                var type = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
                if (type === SPECTOR.WebGlConstants.NONE.value) {
                    return;
                }
                var storage = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
                if (type === SPECTOR.WebGlConstants.RENDERBUFFER.value) {
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                    gl.framebufferRenderbuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, SPECTOR.WebGlConstants.RENDERBUFFER.value, storage);
                    this.getCapture(gl, webglConstant.name, width, height);
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, frameBuffer);
                }
                else if (type === SPECTOR.WebGlConstants.TEXTURE.value) {
                    var textureLayer = 0;
                    if (this.contextVersion > 1) {
                        textureLayer = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
                    }
                    var textureLevel = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
                    var textureCubeMapFace = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value);
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                    if (textureLayer === 0) {
                        gl.framebufferTexture2D(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, textureCubeMapFace ? textureCubeMapFace : SPECTOR.WebGlConstants.TEXTURE_2D.value, storage, textureLevel);
                    }
                    else {
                        gl.framebufferTextureLayer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, storage, textureLevel, textureLayer);
                    }
                    var status_1 = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                    if (status_1 === SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                        this.getCapture(gl, webglConstant.name, width, height);
                    }
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, frameBuffer);
                }
            };
            VisualState.prototype.getCapture = function (gl, name, width, height) {
                // Read the pixels from the frame buffer.
                var size = width * height * 4;
                var pixels = new Uint8Array(size);
                gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
                // Copy the pixels to a working 2D canvas same size.            
                this.workingCanvas.width = width;
                this.workingCanvas.height = height;
                var imageData = this.workingContext2D.createImageData(width, height);
                imageData.data.set(pixels);
                this.workingContext2D.putImageData(imageData, 0, 0);
                // Copy the pixels to a resized capture 2D canvas.
                var imageAspectRatio = width / height;
                if (imageAspectRatio < 1) {
                    this.captureCanvas.width = VisualState_1.captureBaseSize * imageAspectRatio;
                    this.captureCanvas.height = VisualState_1.captureBaseSize;
                }
                else if (imageAspectRatio > 1) {
                    this.captureCanvas.width = VisualState_1.captureBaseSize;
                    this.captureCanvas.height = VisualState_1.captureBaseSize / imageAspectRatio;
                }
                else {
                    this.captureCanvas.width = VisualState_1.captureBaseSize;
                    this.captureCanvas.height = VisualState_1.captureBaseSize;
                }
                // Scale and draw to flip Y to reorient readPixels.
                this.captureContext2D.globalCompositeOperation = 'copy';
                this.captureContext2D.scale(1, -1); // Y flip
                this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
                this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
                this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
                this.captureContext2D.globalCompositeOperation = 'source-over';
                // get the screen capture
                this.currentState["Attachments"].push({
                    attachmentName: name,
                    src: this.captureCanvas.toDataURL()
                });
            };
            VisualState.prototype.analyse = function (consumeCommand) {
            };
            VisualState.prototype.getTag = function (object) {
                if (!object) {
                    return undefined;
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(object);
                if (!tag) {
                    this.options.tagWebGlObject(object);
                }
                return object;
            };
            return VisualState;
        }(States.BaseState));
        VisualState.captureBaseSize = 512;
        VisualState = VisualState_1 = __decorate([
            SPECTOR.Decorators.state("VisualState")
        ], VisualState);
        States.VisualState = VisualState;
        var VisualState_1;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DrawCallState = DrawCallState_1 = (function (_super) {
            __extends(DrawCallState, _super);
            function DrawCallState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Object.defineProperty(DrawCallState.prototype, "requireStartAndStopStates", {
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            DrawCallState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            DrawCallState.prototype.getChangeCommandsByState = function () {
                return {};
            };
            DrawCallState.prototype.readFromContext = function () {
                var program = this.context.getParameter(SPECTOR.WebGlConstants.CURRENT_PROGRAM.value);
                if (!program) {
                    return;
                }
                this.currentState.frameBuffer = this.readFrameBufferFromContext();
                this.currentState.program = this.getTag(program);
                this.currentState.programStatus = {
                    DELETE_STATUS: this.context.getProgramParameter(program, SPECTOR.WebGlConstants.DELETE_STATUS.value),
                    LINK_STATUS: this.context.getProgramParameter(program, SPECTOR.WebGlConstants.LINK_STATUS.value),
                    VALIDATE_STATUS: this.context.getProgramParameter(program, SPECTOR.WebGlConstants.VALIDATE_STATUS.value)
                };
                var shaders = this.context.getAttachedShaders(program);
                this.currentState.shaders = [];
                for (var _i = 0, shaders_1 = shaders; _i < shaders_1.length; _i++) {
                    var shader = shaders_1[_i];
                    var shaderState = this.readShaderFromContext(shader);
                    this.currentState.shaders.push(shaderState);
                }
                var attributes = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.ACTIVE_ATTRIBUTES.value);
                this.currentState.attributes = [];
                for (var i = 0; i < attributes; i++) {
                    var attributeState = this.readAttributeFromContext(program, i);
                    this.currentState.attributes.push(attributeState);
                }
                var uniforms = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.ACTIVE_UNIFORMS.value);
                this.currentState.uniforms = [];
                var uniformIndices = [];
                for (var i = 0; i < uniforms; i++) {
                    uniformIndices.push(i);
                    var uniformState = this.readUniformFromContext(program, i);
                    this.currentState.uniforms.push(uniformState);
                }
                if (this.contextVersion > 1) {
                    this.readUniformsFromContextIntoState(program, uniformIndices, this.currentState.uniforms);
                    var uniformBlocks = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.ACTIVE_UNIFORM_BLOCKS.value);
                    this.currentState.uniformBlocks = [];
                    for (var i = 0; i < uniformBlocks; i++) {
                        var uniformBlockState = this.readUniformBlockFromContext(program, i);
                        this.currentState.uniformBlocks.push(uniformBlockState);
                    }
                    var transformFeedbackActive = this.context.getParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_ACTIVE.value);
                    this.currentState.transformFeedbacks = [];
                    if (transformFeedbackActive) {
                        var transformFeedbackModeValue = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_MODE.value);
                        var transformFeedbackMode = this.getWebGlConstant(transformFeedbackModeValue);
                        var transformFeedbacks = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_VARYINGS.value);
                        for (var i = 0; i < transformFeedbacks; i++) {
                            var transformFeedbackState = this.readTransformFeedbackFromContext(program, i);
                            this.currentState.transformFeedbacks.push(transformFeedbackState);
                        }
                    }
                }
            };
            DrawCallState.prototype.readFrameBufferFromContext = function () {
                var frameBuffer = this.context.getParameter(SPECTOR.WebGlConstants.FRAMEBUFFER_BINDING.value);
                if (!frameBuffer) {
                    return null;
                }
                var frameBufferState = {};
                frameBufferState.frameBuffer = this.getTag(frameBuffer);
                frameBufferState.depthAttachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstants.DEPTH_ATTACHMENT.value);
                frameBufferState.stencilAttachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstants.STENCIL_ATTACHMENT.value);
                var drawBuffersExtension = this.extensions[SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
                if (drawBuffersExtension) {
                    frameBufferState.colorAttachments = [];
                    var maxDrawBuffers = this.context.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        frameBufferState.colorAttachments.push(this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"].value));
                    }
                }
                else if (this.contextVersion > 1) {
                    var context2 = this.context;
                    // Already covered ny the introspection of depth and stencil.
                    // frameBufferState.depthStencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_STENCIL_ATTACHMENT.value);
                    frameBufferState.colorAttachments = [];
                    var maxDrawBuffers = context2.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        frameBufferState.colorAttachments.push(this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i].value));
                    }
                }
                return frameBufferState;
            };
            DrawCallState.prototype.readFrameBufferAttachmentFromContext = function (attachment) {
                var target = SPECTOR.WebGlConstants.FRAMEBUFFER.value;
                var attachmentState = {};
                var type = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
                if (type === SPECTOR.WebGlConstants.NONE.value) {
                    attachmentState.type = "NONE";
                    return attachmentState;
                }
                var storage = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
                if (type === SPECTOR.WebGlConstants.RENDERBUFFER.value) {
                    attachmentState.type = "RENDERBUFFER";
                    attachmentState.buffer = this.options.tagWebGlObject(storage);
                }
                else if (type === SPECTOR.WebGlConstants.TEXTURE.value) {
                    attachmentState.type = "TEXTURE";
                    attachmentState.texture = this.options.tagWebGlObject(storage);
                    attachmentState.textureLevel = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
                    attachmentState.textureCubeMapFace = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value));
                }
                if (this.extensions["EXT_sRGB"]) {
                    attachmentState.encoding = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT.value));
                }
                if (this.contextVersion > 1) {
                    attachmentState.alphaSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE.value);
                    attachmentState.blueSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE.value);
                    attachmentState.encoding = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING.value));
                    attachmentState.componentType = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE.value));
                    attachmentState.depthSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE.value);
                    attachmentState.greenSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE.value);
                    attachmentState.redSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_RED_SIZE.value);
                    attachmentState.stencilSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE.value);
                    if (type === SPECTOR.WebGlConstants.TEXTURE.value) {
                        attachmentState.textureLayer = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
                    }
                }
                return attachmentState;
            };
            DrawCallState.prototype.readShaderFromContext = function (shader) {
                return {
                    shader: this.getTag(shader),
                    COMPILE_STATUS: this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.COMPILE_STATUS.value),
                    DELETE_STATUS: this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.DELETE_STATUS.value),
                    SHADER_TYPE: this.getWebGlConstant(this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.SHADER_TYPE.value)),
                    source: this.context.getShaderSource(shader)
                };
            };
            DrawCallState.prototype.readAttributeFromContext = function (program, activeAttributeIndex) {
                var info = this.context.getActiveAttrib(program, activeAttributeIndex);
                var location = this.context.getAttribLocation(program, info.name);
                var attributeState = {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    location: location,
                    offsetPointer: this.context.getVertexAttribOffset(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_POINTER.value),
                    bufferBinding: this.getTag(this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING.value)),
                    enabled: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_ENABLED.value),
                    arraySize: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_SIZE.value),
                    stride: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_STRIDE.value),
                    arrayType: this.getWebGlConstant(this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_TYPE.value)),
                    normalized: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED.value),
                    vertexAttrib: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.CURRENT_VERTEX_ATTRIB.value),
                };
                if (this.extensions[SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.extensionName]) {
                    attributeState.divisor = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.value);
                }
                else if (this.contextVersion > 1) {
                    attributeState.integer = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_INTEGER.value);
                    attributeState.divisor = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR.value);
                }
                return attributeState;
            };
            DrawCallState.prototype.readUniformFromContext = function (program, activeUniformIndex) {
                var info = this.context.getActiveUniform(program, activeUniformIndex);
                var location = this.context.getUniformLocation(program, info.name);
                if (location) {
                    var value = this.context.getUniform(program, location);
                    var uniformState = {
                        name: info.name,
                        size: info.size,
                        type: this.getWebGlConstant(info.type),
                        location: this.getTag(location),
                        value: value
                    };
                    var textureTarget = DrawCallState_1.samplerTypes[info.type];
                    if (textureTarget) {
                        uniformState.texture = this.readTextureFromContext(value, textureTarget);
                    }
                    return uniformState;
                }
                else {
                    var uniformState = {
                        name: info.name,
                        size: info.size,
                        type: this.getWebGlConstant(info.type),
                        location: null,
                        value: null
                    };
                    return uniformState;
                }
            };
            DrawCallState.prototype.readTextureFromContext = function (textureUnit, target) {
                var activeTexture = this.context.getParameter(SPECTOR.WebGlConstants.ACTIVE_TEXTURE.value);
                this.context.activeTexture(SPECTOR.WebGlConstants.TEXTURE0.value + textureUnit);
                var textureState = {
                    magFilter: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_MAG_FILTER.value)),
                    minFilter: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_MIN_FILTER.value)),
                    wrapS: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_WRAP_S.value)),
                    wrapT: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_WRAP_T.value)),
                };
                if (this.extensions[SPECTOR.WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.extensionName]) {
                    textureState.anisotropy = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.value);
                }
                if (this.contextVersion > 1) {
                    textureState.baseLevel = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_BASE_LEVEL.value);
                    textureState.immutable = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_FORMAT.value);
                    textureState.immutableLevels = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    textureState.maxLevel = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    var sampler = this.context.getParameter(SPECTOR.WebGlConstants.SAMPLER_BINDING.value);
                    if (sampler) {
                        textureState.sampler = this.getTag(sampler);
                        var context2 = this.context;
                        textureState.samplerMaxLod = context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.samplerMinLod = context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.samplerCompareFunc = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                        textureState.samplerCompareMode = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_COMPARE_MODE.value));
                        textureState.samplerWrapS = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_WRAP_S.value));
                        textureState.samplerWrapT = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_WRAP_T.value));
                        textureState.samplerWrapR = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value));
                        textureState.samplerMagFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_MAG_FILTER.value));
                        textureState.samplerMinFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_MIN_FILTER.value));
                    }
                    else {
                        textureState.maxLod = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.minLod = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.compareFunc = this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                        textureState.compareMode = this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_COMPARE_MODE.value));
                        textureState.wrapR = this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value));
                    }
                }
                this.context.activeTexture(activeTexture);
                return textureState;
            };
            DrawCallState.prototype.readUniformsFromContextIntoState = function (program, uniformIndices, uniformsState) {
                var context2 = this.context;
                var typeValues = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_TYPE.value);
                var sizes = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_SIZE.value);
                var blockIndices = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_BLOCK_INDEX.value);
                var offsets = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_OFFSET.value);
                var arrayStrides = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_ARRAY_STRIDE.value);
                var matrixStrides = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_MATRIX_STRIDE.value);
                var rowMajors = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_IS_ROW_MAJOR.value);
                for (var i = 0; i < uniformIndices.length; i++) {
                    var uniformState = uniformsState[i];
                    uniformState.type = this.getWebGlConstant(typeValues[i]);
                    uniformState.size = sizes[i];
                    uniformState.blockIndice = blockIndices[i];
                    if (uniformState.blockIndice > -1) {
                        uniformState.blockName = context2.getActiveUniformBlockName(program, uniformState.blockIndice);
                    }
                    uniformState.offset = offsets[i];
                    uniformState.arrayStride = arrayStrides[i];
                    uniformState.matrixStride = matrixStrides[i];
                    uniformState.rowMajor = rowMajors[i];
                }
            };
            DrawCallState.prototype.readTransformFeedbackFromContext = function (program, index) {
                var context2 = this.context;
                var info = context2.getTransformFeedbackVarying(program, index);
                return {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    buffer: this.getTag(context2.getIndexedParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value, index)),
                    bufferSize: context2.getIndexedParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_SIZE.value, index),
                    bufferStart: context2.getIndexedParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_START.value, index),
                };
            };
            DrawCallState.prototype.readUniformBlockFromContext = function (program, index) {
                var context2 = this.context;
                var bindingPoint = context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_BINDING.value);
                return {
                    name: context2.getActiveUniformBlockName(program, index),
                    bindingPoint: bindingPoint,
                    size: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_DATA_SIZE.value),
                    activeUniformCount: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORMS.value),
                    vertex: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER.value),
                    fragment: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER.value),
                    buffer: this.getTag(context2.getIndexedParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_BINDING.value, bindingPoint)),
                    bufferSize: context2.getIndexedParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_SIZE.value, bindingPoint),
                    bufferStart: context2.getIndexedParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_START.value, bindingPoint),
                };
            };
            DrawCallState.prototype.getWebGlConstant = function (value) {
                return SPECTOR.WebGlConstantsByValue[value].name;
            };
            DrawCallState.prototype.getTag = function (object) {
                if (!object) {
                    return undefined;
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(object);
                if (!tag) {
                    this.options.tagWebGlObject(object);
                }
                return object;
            };
            return DrawCallState;
        }(States.BaseState));
        DrawCallState.samplerTypes = (_a = {},
            _a[SPECTOR.WebGlConstants.SAMPLER_2D.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
            _a[SPECTOR.WebGlConstants.SAMPLER_CUBE.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
            _a[SPECTOR.WebGlConstants.SAMPLER_3D.value] = SPECTOR.WebGlConstants.TEXTURE_3D,
            _a[SPECTOR.WebGlConstants.SAMPLER_2D_SHADOW.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
            _a[SPECTOR.WebGlConstants.SAMPLER_2D_ARRAY.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
            _a[SPECTOR.WebGlConstants.SAMPLER_2D_ARRAY_SHADOW.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
            _a[SPECTOR.WebGlConstants.SAMPLER_CUBE_SHADOW.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
            _a[SPECTOR.WebGlConstants.INT_SAMPLER_2D.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
            _a[SPECTOR.WebGlConstants.INT_SAMPLER_3D.value] = SPECTOR.WebGlConstants.TEXTURE_3D,
            _a[SPECTOR.WebGlConstants.INT_SAMPLER_CUBE.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
            _a[SPECTOR.WebGlConstants.INT_SAMPLER_2D_ARRAY.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
            _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_2D.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
            _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_3D.value] = SPECTOR.WebGlConstants.TEXTURE_3D,
            _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_CUBE.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
            _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_2D_ARRAY.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
            _a);
        DrawCallState = DrawCallState_1 = __decorate([
            SPECTOR.Decorators.state("DrawCall")
        ], DrawCallState);
        States.DrawCallState = DrawCallState;
        var DrawCallState_1;
        var _a;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var WebGlObjects;
    (function (WebGlObjects) {
        var SPECTOROBJECTTAGKEY = "__SPECTOR_Object_TAG";
        function getWebGlObjectTag(object) {
            return object[SPECTOROBJECTTAGKEY];
        }
        WebGlObjects.getWebGlObjectTag = getWebGlObjectTag;
        function attachWebGlObjectTag(object, tag) {
            tag.displayText = stringifyWebGlObjectTag(tag);
            object[SPECTOROBJECTTAGKEY] = tag;
        }
        WebGlObjects.attachWebGlObjectTag = attachWebGlObjectTag;
        function stringifyWebGlObjectTag(tag) {
            if (!tag) {
                return 'No tag available.';
            }
            return tag.typeName + " - ID: " + tag.id + " - Version: " + tag.version;
        }
        WebGlObjects.stringifyWebGlObjectTag = stringifyWebGlObjectTag;
    })(WebGlObjects = SPECTOR.WebGlObjects || (SPECTOR.WebGlObjects = {}));
})(SPECTOR || (SPECTOR = {}));
(function (SPECTOR) {
    var WebGlObjects;
    (function (WebGlObjects) {
        var BaseWebGlObject = (function () {
            function BaseWebGlObject(options, logger) {
                this.options = options;
                this.typeName = options.typeName;
                this.type = options.type;
                this.id = 0;
            }
            BaseWebGlObject.prototype.tagWebGlObject = function (webGlObject) {
                if (!this.type) {
                    return undefined;
                }
                var tag;
                if (!webGlObject) {
                    return tag;
                }
                tag = WebGlObjects.getWebGlObjectTag(webGlObject);
                if (tag) {
                    return tag;
                }
                if (webGlObject instanceof this.type) {
                    var id = this.getNextId();
                    tag = {
                        typeName: this.typeName,
                        id: id,
                        version: 0
                    };
                    WebGlObjects.attachWebGlObjectTag(webGlObject, tag);
                    return tag;
                }
                return tag;
            };
            BaseWebGlObject.prototype.getNextId = function () {
                return this.id++;
            };
            return BaseWebGlObject;
        }());
        WebGlObjects.BaseWebGlObject = BaseWebGlObject;
    })(WebGlObjects = SPECTOR.WebGlObjects || (SPECTOR.WebGlObjects = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var WebGlObjects;
    (function (WebGlObjects) {
        var Buffer = (function (_super) {
            __extends(Buffer, _super);
            function Buffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Buffer;
        }(WebGlObjects.BaseWebGlObject));
        Buffer = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLBuffer")
        ], Buffer);
        WebGlObjects.Buffer = Buffer;
        var FrameBuffer = (function (_super) {
            __extends(FrameBuffer, _super);
            function FrameBuffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return FrameBuffer;
        }(WebGlObjects.BaseWebGlObject));
        FrameBuffer = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLFramebuffer")
        ], FrameBuffer);
        WebGlObjects.FrameBuffer = FrameBuffer;
        var Program = (function (_super) {
            __extends(Program, _super);
            function Program() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Program;
        }(WebGlObjects.BaseWebGlObject));
        Program = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLProgram")
        ], Program);
        WebGlObjects.Program = Program;
        var Query = (function (_super) {
            __extends(Query, _super);
            function Query() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Query;
        }(WebGlObjects.BaseWebGlObject));
        Query = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLQuery")
        ], Query);
        WebGlObjects.Query = Query;
        var Renderbuffer = (function (_super) {
            __extends(Renderbuffer, _super);
            function Renderbuffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Renderbuffer;
        }(WebGlObjects.BaseWebGlObject));
        Renderbuffer = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLRenderbuffer")
        ], Renderbuffer);
        WebGlObjects.Renderbuffer = Renderbuffer;
        var Sampler = (function (_super) {
            __extends(Sampler, _super);
            function Sampler() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Sampler;
        }(WebGlObjects.BaseWebGlObject));
        Sampler = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLSampler")
        ], Sampler);
        WebGlObjects.Sampler = Sampler;
        var Shader = (function (_super) {
            __extends(Shader, _super);
            function Shader() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Shader;
        }(WebGlObjects.BaseWebGlObject));
        Shader = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLShader")
        ], Shader);
        WebGlObjects.Shader = Shader;
        var Sync = (function (_super) {
            __extends(Sync, _super);
            function Sync() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Sync;
        }(WebGlObjects.BaseWebGlObject));
        Sync = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLSync")
        ], Sync);
        WebGlObjects.Sync = Sync;
        var Texture = (function (_super) {
            __extends(Texture, _super);
            function Texture() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return Texture;
        }(WebGlObjects.BaseWebGlObject));
        Texture = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLTexture")
        ], Texture);
        WebGlObjects.Texture = Texture;
        var TransformFeedback = (function (_super) {
            __extends(TransformFeedback, _super);
            function TransformFeedback() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return TransformFeedback;
        }(WebGlObjects.BaseWebGlObject));
        TransformFeedback = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLTransformFeedback")
        ], TransformFeedback);
        WebGlObjects.TransformFeedback = TransformFeedback;
        var UniformLocation = (function (_super) {
            __extends(UniformLocation, _super);
            function UniformLocation() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return UniformLocation;
        }(WebGlObjects.BaseWebGlObject));
        UniformLocation = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLUniformLocation")
        ], UniformLocation);
        WebGlObjects.UniformLocation = UniformLocation;
        var VertexArrayObject = (function (_super) {
            __extends(VertexArrayObject, _super);
            function VertexArrayObject() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            return VertexArrayObject;
        }(WebGlObjects.BaseWebGlObject));
        VertexArrayObject = __decorate([
            SPECTOR.Decorators.webGlObject("WebGLVertexArrayObject")
        ], VertexArrayObject);
        WebGlObjects.VertexArrayObject = VertexArrayObject;
    })(WebGlObjects = SPECTOR.WebGlObjects || (SPECTOR.WebGlObjects = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var BaseNoneGenericComponent = (function () {
            function BaseNoneGenericComponent(eventConstructor, logger) {
                this.eventConstructor = eventConstructor;
                this.logger = logger;
                this.dummyElement = document.createElement("div");
            }
            BaseNoneGenericComponent.prototype.createFromHtml = function (html) {
                this.dummyElement.innerHTML = html;
                return this.dummyElement.firstElementChild;
            };
            // THX to http://2ality.com/2015/01/template-strings-html.html
            BaseNoneGenericComponent.prototype.htmlTemplate = function (literalSections) {
                var _this = this;
                var substs = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    substs[_i - 1] = arguments[_i];
                }
                // Use raw literal sections: we don’t want
                // backslashes (\n etc.) to be interpreted
                var raw = literalSections.raw;
                var result = '';
                substs.forEach(function (subst, i) {
                    // Retrieve the literal section preceding
                    // the current substitution
                    var lit = raw[i];
                    // In the example, map() returns an array:
                    // If substitution is an array (and not a string),
                    // we turn it into a string
                    if (Array.isArray(subst)) {
                        subst = subst.join('');
                    }
                    // If the substitution is preceded by a dollar sign,
                    // we escape special characters in it
                    if (lit && lit.length > 0 && lit[lit.length - 1] === '$') {
                        subst = _this.htmlEscape(subst);
                        lit = lit.slice(0, -1);
                    }
                    result += lit;
                    result += subst;
                });
                // Take care of last literal section
                // (Never fails, because an empty template string
                // produces one literal section, an empty string)
                result += raw[raw.length - 1]; // (A)
                return result;
            };
            // THX to http://2ality.com/2015/01/template-strings-html.html
            BaseNoneGenericComponent.prototype.htmlEscape = function (str) {
                return str.replace(/&/g, '&amp;') // first!
                    .replace(/>/g, '&gt;')
                    .replace(/</g, '&lt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;')
                    .replace(/`/g, '&#96;');
            };
            return BaseNoneGenericComponent;
        }());
        EmbeddedFrontend.BaseNoneGenericComponent = BaseNoneGenericComponent;
        var BaseComponent = (function (_super) {
            __extends(BaseComponent, _super);
            function BaseComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.events = {};
                return _this;
            }
            BaseComponent.prototype.renderElementFromTemplate = function (template, state, stateId) {
                var element = this.createFromHtml(template);
                this.bindCommands(element, state, stateId);
                return element;
            };
            BaseComponent.prototype.bindCommands = function (domNode, state, stateId) {
                var commandContainers = domNode.querySelectorAll("[commandName]");
                for (var i = 0; i < commandContainers.length; i++) {
                    var commandContainer = commandContainers[i];
                    var commandName = commandContainer.getAttribute("commandname");
                    var commandEventBinding = commandContainer.getAttribute("commandeventbinding") || "";
                    if (commandEventBinding.length === 0) {
                        commandEventBinding = "click";
                    }
                    var commandCapture = commandContainer.getAttribute("usecapture") === "true";
                    this.createEvent(commandName);
                    this.mapEventListener(commandContainer, commandEventBinding, commandName, state, stateId, commandCapture);
                }
            };
            BaseComponent.prototype.mapEventListener = function (domElement, domEvent, eventName, state, stateId, commandCapture) {
                var self = this;
                domElement.addEventListener(domEvent, function () { self.triggerEvent(eventName, this, state, stateId); }, commandCapture);
            };
            BaseComponent.prototype.createEvent = function (commandName) {
                if (!this.events[commandName]) {
                    var event_1 = new this.eventConstructor();
                    this.events[commandName] = event_1;
                }
                return this.events[commandName];
            };
            BaseComponent.prototype.triggerEvent = function (commandName, element, state, stateId) {
                this.events[commandName].trigger({
                    sender: element,
                    stateId: stateId,
                    state: state
                });
            };
            BaseComponent.prototype.addEventListener = function (command, callback, context) {
                if (context === void 0) { context = null; }
                if (this.events[command]) {
                    return this.events[command].add(callback, context);
                }
                return -1;
            };
            BaseComponent.prototype.removeEventListener = function (command, listenerId) {
                if (this.events[command]) {
                    this.events[command].remove(listenerId);
                }
            };
            return BaseComponent;
        }(BaseNoneGenericComponent));
        EmbeddedFrontend.BaseComponent = BaseComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var Compositor = (function () {
            function Compositor(placeHolder, stateStore, logger) {
                this.logger = logger;
                this.placeHolder = placeHolder;
                this.stateStore = stateStore;
            }
            Compositor.prototype.compose = function (rootStateId) {
                // First pass to render each dirty node.
                var dirtyStates = this.stateStore.getStatesToProcess();
                var render = false;
                for (var dirtyStateKey in dirtyStates) {
                    var dirtyStateId = dirtyStates[dirtyStateKey];
                    var lastOperation_1 = this.stateStore.getLastOperation(dirtyStateId);
                    var componentInstance = this.stateStore.getComponentInstance(dirtyStateId);
                    var state = this.stateStore.getData(dirtyStateId);
                    componentInstance.render(state, dirtyStateId, lastOperation_1);
                    render = true;
                }
                // early exist if nothing was touched.
                if (!render) {
                    return;
                }
                // Recursively apply the new rendered nodes to the dom.
                var lastOperation = this.stateStore.getLastOperation(rootStateId);
                this.composeInContainer(this.placeHolder, Number.MAX_VALUE, rootStateId, lastOperation);
            };
            Compositor.prototype.composeChildren = function (stateId, container) {
                if (!container) {
                    return;
                }
                var children = this.stateStore.getChildrenIds(stateId);
                var currentChildIndexInDom = 0;
                for (var i = 0; i < children.length; i++) {
                    var childId = children[i];
                    var lastOperation = this.stateStore.getLastOperation(childId);
                    // Recurse.
                    this.composeInContainer(container, currentChildIndexInDom, childId, lastOperation);
                    // Reindex in case of deleted nodes.
                    if (lastOperation !== 50 /* Delete */) {
                        currentChildIndexInDom++;
                    }
                }
            };
            Compositor.prototype.composeInContainer = function (parentContainer, indexInContainer, stateId, lastOperation) {
                var componentInstance = this.stateStore.getComponentInstance(stateId);
                var childrenContainer = componentInstance.composeInContainer(parentContainer, indexInContainer, lastOperation);
                // Recursion path.
                this.composeChildren(stateId, childrenContainer);
            };
            return Compositor;
        }());
        EmbeddedFrontend.Compositor = Compositor;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var MVX = (function () {
            function MVX(placeHolder, logger) {
                this.logger = logger;
                this.stateStore = new EmbeddedFrontend.StateStore(logger);
                this.compositor = new EmbeddedFrontend.Compositor(placeHolder, this.stateStore, logger);
                this.willRender = false;
                this.rootStateId = -1;
            }
            MVX.prototype.addRootState = function (data, component) {
                this.setForRender();
                var componentInstance = new EmbeddedFrontend.ComponentInstance(component, this.logger);
                var stateId = this.stateStore.add(data, componentInstance);
                this.rootStateId = stateId;
                return stateId;
            };
            MVX.prototype.addChildState = function (parentId, data, component) {
                this.setForRender();
                return this.insertChildState(parentId, data, Number.MAX_VALUE, component);
            };
            MVX.prototype.insertChildState = function (parentId, data, index, component) {
                this.setForRender();
                var componentInstance = new EmbeddedFrontend.ComponentInstance(component, this.logger);
                return this.stateStore.insertChildAt(parentId, index, data, componentInstance);
            };
            MVX.prototype.updateState = function (id, data) {
                this.setForRender();
                this.stateStore.update(id, data);
            };
            MVX.prototype.removeState = function (id) {
                this.setForRender();
                this.stateStore.remove(id);
            };
            MVX.prototype.removeChildrenStates = function (id) {
                this.setForRender();
                this.stateStore.removeChildren(id);
            };
            MVX.prototype.getState = function (id) {
                return this.stateStore.getData(id);
            };
            MVX.prototype.getGenericState = function (id) {
                return this.getState(id);
            };
            MVX.prototype.getChildrenState = function (id) {
                var _this = this;
                return this.stateStore.getChildrenIds(id).map(function (childId) { return _this.stateStore.getData(id); });
            };
            MVX.prototype.getChildrenGenericState = function (id) {
                return this.getChildrenState(id);
            };
            MVX.prototype.updateAllChildrenState = function (id, updateCallback) {
                var childrenIds = this.stateStore.getChildrenIds(id);
                for (var _i = 0, childrenIds_1 = childrenIds; _i < childrenIds_1.length; _i++) {
                    var childId = childrenIds_1[_i];
                    var state = this.getGenericState(childId);
                    updateCallback(state);
                    this.updateState(childId, state);
                }
            };
            MVX.prototype.updateAllChildrenGenericState = function (id, updateCallback) {
                this.updateAllChildrenState(id, updateCallback);
            };
            MVX.prototype.setForRender = function () {
                if (!this.willRender) {
                    this.willRender = true;
                    setTimeout(this.compose.bind(this), MVX.REFRESHRATEINMILLISECONDS);
                }
            };
            MVX.prototype.compose = function () {
                // Render once.
                this.willRender = false;
                // Render and compose. 
                this.compositor.compose(this.rootStateId);
                // Clean up the pending list of processed states.
                this.stateStore.flushPendingOperations();
            };
            return MVX;
        }());
        MVX.REFRESHRATEINMILLISECONDS = 100;
        EmbeddedFrontend.MVX = MVX;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ComponentInstance = (function () {
            function ComponentInstance(component, logger) {
                this.logger = logger;
                this.component = component;
            }
            ComponentInstance.prototype.render = function (state, stateId, lastOperation) {
                if (lastOperation === 0 /* Processed */) {
                    return;
                }
                if (lastOperation === 50 /* Delete */) {
                    this.removeNode();
                    return;
                }
                this.domNode = this.component.render(state, stateId);
            };
            ComponentInstance.prototype.composeInContainer = function (parentContainer, indexInContainer, lastOperation) {
                if (lastOperation === 50 /* Delete */) {
                    this.removeNode();
                    return null;
                }
                var currentChildrenContainer = this.__cachedCurrentChildrenContainer;
                if (lastOperation === 0 /* Processed */) {
                    return currentChildrenContainer;
                }
                var element = this.domNode;
                var newChildrenContainer;
                if (element.getAttribute("childrencontainer")) {
                    newChildrenContainer = element;
                }
                else {
                    newChildrenContainer = element.querySelector("[childrenContainer]");
                }
                if (newChildrenContainer && currentChildrenContainer) {
                    var children = currentChildrenContainer.children;
                    while (children.length > 0) {
                        newChildrenContainer.appendChild(children[0]);
                    }
                }
                this.__cachedCurrentChildrenContainer = newChildrenContainer;
                if (indexInContainer >= parentContainer.children.length) {
                    parentContainer.appendChild(element);
                    if (this.__cachedCurrentDomNode && lastOperation === 40 /* Update */) {
                        this.__cachedCurrentDomNode.remove();
                    }
                }
                else {
                    var currentElement = parentContainer.children[indexInContainer];
                    parentContainer.insertBefore(element, currentElement);
                    if (lastOperation === 40 /* Update */) {
                        parentContainer.removeChild(currentElement);
                    }
                }
                this.__cachedCurrentDomNode = this.domNode;
                return newChildrenContainer;
            };
            ComponentInstance.prototype.removeNode = function () {
                if (this.domNode && this.domNode.parentElement) {
                    this.domNode.remove();
                }
                if (this.__cachedCurrentDomNode && this.__cachedCurrentDomNode.parentElement) {
                    this.__cachedCurrentDomNode.remove();
                }
            };
            return ComponentInstance;
        }());
        ComponentInstance.idGenerator = 0;
        EmbeddedFrontend.ComponentInstance = ComponentInstance;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var StateStore = (function () {
            function StateStore(logger) {
                this.logger = logger;
                this.store = {};
                this.idGenerator = 0;
                this.pendingOperation = {};
            }
            StateStore.prototype.getLastOperation = function (id) {
                return this.store[id].lastOperation;
            };
            StateStore.prototype.getData = function (id) {
                return this.store[id].data;
            };
            StateStore.prototype.getComponentInstance = function (id) {
                return this.store[id].componentInstance;
            };
            StateStore.prototype.getParentId = function (id) {
                if (this.store[id].parent) {
                    return this.store[id].parent.id;
                }
                return -1;
            };
            StateStore.prototype.getChildrenIds = function (id) {
                var result = [];
                for (var _i = 0, _a = this.store[id].children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    result.push(child.id);
                }
                return result;
            };
            StateStore.prototype.getNewId = function () {
                return ++this.idGenerator;
            };
            StateStore.prototype.add = function (data, componentInstance) {
                var id = this.getNewId();
                this.pendingOperation[id] = id;
                this.store[id] = {
                    data: data,
                    id: id,
                    parent: null,
                    children: [],
                    componentInstance: componentInstance,
                    lastOperation: 20 /* Add */,
                };
                return id;
            };
            StateStore.prototype.update = function (id, data) {
                var currentState = this.store[id];
                this.pendingOperation[id] = id;
                this.store[id] = {
                    data: data,
                    id: id,
                    parent: currentState.parent,
                    children: currentState.children,
                    componentInstance: currentState.componentInstance,
                    lastOperation: 40 /* Update */,
                };
            };
            StateStore.prototype.addChild = function (parentId, data, componentInstance) {
                var parent = this.store[parentId];
                var id = this.add(data, componentInstance);
                this.pendingOperation[id] = id;
                var child = this.store[id];
                child.parent = parent;
                parent.children.push(child);
                return id;
            };
            StateStore.prototype.insertChildAt = function (parentId, index, data, componentInstance) {
                var parent = this.store[parentId];
                var id = this.add(data, componentInstance);
                this.pendingOperation[id] = id;
                var child = this.store[id];
                child.parent = parent;
                if (index >= parent.children.length) {
                    parent.children.push(child);
                }
                else if (index >= 0) {
                    parent.children.splice(index, 0, child);
                }
                else {
                    parent.children.unshift(child);
                }
                return id;
            };
            StateStore.prototype.removeChildById = function (parentId, id) {
                var parent = this.store[parentId];
                for (var i = parent.children.length - 1; i >= 0; i--) {
                    var state = parent.children[i];
                    if (state.id === id) {
                        this.removeChildAt(parentId, i);
                        break;
                    }
                }
            };
            StateStore.prototype.removeChildAt = function (parentId, index) {
                var parent = this.store[parentId];
                var child;
                if (index > (parent.children.length - 1)) {
                    child = parent.children[parent.children.length - 1];
                    parent.children[parent.children.length - 1].parent = null;
                    parent.children.splice(parent.children.length - 1, 1);
                }
                else if (index >= 0) {
                    child = parent.children[index];
                    parent.children[index].parent = null;
                    parent.children.splice(index, 1);
                }
                else {
                    child = parent.children[0];
                    parent.children[0].parent = null;
                    parent.children.splice(0, 1);
                }
                child.parent = null;
                this.remove(child.id);
            };
            StateStore.prototype.remove = function (id) {
                var child = this.store[id];
                if (child.parent) {
                    var parent_1 = this.store[child.parent.id];
                    this.removeChildById(child.parent.id, id);
                }
                else {
                    this.removeChildren(id);
                    this.store[id].lastOperation = 50 /* Delete */;
                    this.pendingOperation[id] = id;
                }
            };
            StateStore.prototype.removeChildren = function (id) {
                var state = this.store[id];
                while (state.children.length) {
                    this.remove(state.children[0].id);
                }
            };
            StateStore.prototype.getStatesToProcess = function () {
                return this.pendingOperation;
            };
            StateStore.prototype.flushPendingOperations = function () {
                for (var id in this.pendingOperation) {
                    if (this.pendingOperation[id]) {
                        if (this.store[id].lastOperation === 50 /* Delete */) {
                            delete this.store[id];
                        }
                        else {
                            this.store[id].lastOperation = 0 /* Processed */;
                        }
                    }
                }
                this.pendingOperation = {};
            };
            return StateStore;
        }());
        EmbeddedFrontend.StateStore = StateStore;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureMenuComponent = (function (_super) {
            __extends(CaptureMenuComponent, _super);
            function CaptureMenuComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CaptureMenuComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["<div childrenContainer=\"true\" class=\"captureMenuComponent ", "\">\n            </div>"], _a.raw = ["<div childrenContainer=\"true\" class=\"captureMenuComponent ", "\">\n            </div>"], this.htmlTemplate(_a, state ? "active" : ""));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CaptureMenuComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureMenuComponent = CaptureMenuComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureMenuActionsComponent = (function (_super) {
            __extends(CaptureMenuActionsComponent, _super);
            function CaptureMenuActionsComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCaptureRequested = _this.createEvent("onCaptureRequested");
                _this.onPlayRequested = _this.createEvent("onPlayRequested");
                _this.onPauseRequested = _this.createEvent("onPauseRequested");
                _this.onPlayNextFrameRequested = _this.createEvent("onPlayNextFrameRequested");
                return _this;
            }
            CaptureMenuActionsComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"captureMenuActionsComponent\">\n                <div commandName=\"onCaptureRequested\">\n                </div>\n                ", "\n            </div>"], _a.raw = ["\n            <div class=\"captureMenuActionsComponent\">\n                <div commandName=\"onCaptureRequested\">\n                </div>\n                ",
                    "\n            </div>"], this.htmlTemplate(_a, !state ?
                    "<div commandName=\"onPlayRequested\">\n                    </div>\n                    <div commandName=\"onPlayNextFrameRequested\">\n                    </div>"
                    :
                        "<div commandName=\"onPauseRequested\">\n                    </div>"));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CaptureMenuActionsComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureMenuActionsComponent = CaptureMenuActionsComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CanvasListComponent = (function (_super) {
            __extends(CanvasListComponent, _super);
            function CanvasListComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCanvasSelection = _this.createEvent("onCanvasSelection");
                return _this;
            }
            CanvasListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"canvasListComponent\">\n                <span commandName=\"onCanvasSelection\">", "</span>\n                <ul childrenContainer=\"true\" style=\"", "\"></ul>                \n            </div>"], _a.raw = ["\n            <div class=\"canvasListComponent\">\n                <span commandName=\"onCanvasSelection\">", "</span>\n                <ul childrenContainer=\"true\" style=\"", "\"></ul>                \n            </div>"], this.htmlTemplate(_a, state.currentCanvas ? state.currentCanvas.id + " (" + state.currentCanvas.width + "*" + state.currentCanvas.height + ")" : "Choose Canvas...", state.showList ? "display:block;visibility:visible" : "display:none;visibility:hidden"));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CanvasListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CanvasListComponent = CanvasListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CanvasListItemComponent = (function (_super) {
            __extends(CanvasListItemComponent, _super);
            function CanvasListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCanvasSelected = _this.createEvent("onCanvasSelected");
                return _this;
            }
            CanvasListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                var textHolder = document.createElement("span");
                textHolder.innerText = "Id: " + state.id + " - Size: " + state.width + "*" + state.height;
                liHolder.appendChild(textHolder);
                this.mapEventListener(liHolder, "click", "onCanvasSelected", state, stateId);
                return liHolder;
            };
            return CanvasListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CanvasListItemComponent = CanvasListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var FpsCounterComponent = (function (_super) {
            __extends(FpsCounterComponent, _super);
            function FpsCounterComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            FpsCounterComponent.prototype.render = function (state, stateId) {
                var textHolder = document.createElement("span");
                textHolder.className = "fpsCounterComponent";
                textHolder.innerText = state.toFixed(2) + " Fps";
                return textHolder;
            };
            return FpsCounterComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.FpsCounterComponent = FpsCounterComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureMenu = (function () {
            function CaptureMenu(options, logger) {
                var _this = this;
                this.options = options;
                this.logger = logger;
                this.rootPlaceHolder = options.rootPlaceHolder || document.body;
                this.mvx = new EmbeddedFrontend.MVX(this.rootPlaceHolder, logger);
                this.visible = true;
                this.onCaptureRequested = new options.eventConstructor();
                this.onPauseRequested = new options.eventConstructor();
                this.onPlayRequested = new options.eventConstructor();
                this.onPlayNextFrameRequested = new options.eventConstructor();
                this.captureMenuComponent = new EmbeddedFrontend.CaptureMenuComponent(options.eventConstructor, logger);
                this.canvasListComponent = new EmbeddedFrontend.CanvasListComponent(options.eventConstructor, logger);
                this.canvasListItemComponent = new EmbeddedFrontend.CanvasListItemComponent(this.options.eventConstructor, this.logger);
                this.actionsComponent = new EmbeddedFrontend.CaptureMenuActionsComponent(options.eventConstructor, logger);
                this.fpsCounterComponent = new EmbeddedFrontend.FpsCounterComponent(options.eventConstructor, logger);
                this.rootStateId = this.mvx.addRootState(null, this.captureMenuComponent);
                this.canvasListStateId = this.mvx.addChildState(this.rootStateId, { currentCanvas: null, showList: false }, this.canvasListComponent);
                this.actionsStateId = this.mvx.addChildState(this.rootStateId, true, this.actionsComponent);
                this.fpsStateId = this.mvx.addChildState(this.rootStateId, 0, this.fpsCounterComponent);
                this.actionsComponent.onCaptureRequested.add(function () {
                    var canvasListState = _this.mvx.getGenericState(_this.canvasListStateId);
                    if (canvasListState.currentCanvas) {
                        _this.onCaptureRequested.trigger(canvasListState.currentCanvas);
                    }
                });
                this.actionsComponent.onPauseRequested.add(function () {
                    _this.onPauseRequested.trigger(_this);
                    _this.mvx.updateState(_this.actionsStateId, false);
                });
                this.actionsComponent.onPlayRequested.add(function () {
                    _this.onPlayRequested.trigger(_this);
                    _this.mvx.updateState(_this.actionsStateId, true);
                });
                this.actionsComponent.onPlayNextFrameRequested.add(function () {
                    _this.onPlayNextFrameRequested.trigger(_this);
                });
                this.canvasListComponent.onCanvasSelection.add(function (eventArgs) {
                    _this.mvx.updateState(_this.canvasListStateId, {
                        currentCanvas: null,
                        showList: !eventArgs.state.showList
                    });
                });
                this.canvasListItemComponent.onCanvasSelected.add(function (eventArgs) {
                    _this.mvx.updateState(_this.canvasListStateId, {
                        currentCanvas: eventArgs.state,
                        showList: false
                    });
                });
                this.displayCanvases();
                this.updateMenuState();
            }
            CaptureMenu.prototype.displayCanvases = function () {
                var canvases = document.body.querySelectorAll("canvas");
                this.mvx.removeChildrenStates(this.canvasListStateId);
                var currentList = this.mvx.getChildrenState(this.canvasListStateId);
                for (var i = 0; i < canvases.length; i++) {
                    var canvas = canvases[i];
                    if (currentList.indexOf(canvas) === -1) {
                        this.mvx.addChildState(this.canvasListStateId, canvas, this.canvasListItemComponent);
                    }
                }
                setTimeout(this.displayCanvases.bind(this), 5000);
            };
            CaptureMenu.prototype.display = function () {
                this.visible = true;
                this.updateMenuState();
            };
            CaptureMenu.prototype.hide = function () {
                this.visible = false;
                this.updateMenuState();
            };
            CaptureMenu.prototype.setFPS = function (fps) {
                this.mvx.updateState(this.fpsStateId, fps);
            };
            CaptureMenu.prototype.updateMenuState = function () {
                this.mvx.updateState(this.rootStateId, this.visible);
            };
            return CaptureMenu;
        }());
        EmbeddedFrontend.CaptureMenu = CaptureMenu;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureListComponent = (function (_super) {
            __extends(CaptureListComponent, _super);
            function CaptureListComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CaptureListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"captureListComponent ", "\">\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], _a.raw = ["\n            <div class=\"captureListComponent ", "\">\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], this.htmlTemplate(_a, state ? "active" : ""));
                var element = this.renderElementFromTemplate(htmlString, state, stateId);
                return element;
                var _a;
            };
            return CaptureListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureListComponent = CaptureListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureListItemComponent = (function (_super) {
            __extends(CaptureListItemComponent, _super);
            function CaptureListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCaptureSelected = _this.createEvent("onCaptureSelected");
                return _this;
            }
            CaptureListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                if (state.active) {
                    liHolder.className = "active";
                }
                if (state.capture.endState.VisualState.Attachments) {
                    for (var _i = 0, _a = state.capture.endState.VisualState.Attachments; _i < _a.length; _i++) {
                        var imageState = _a[_i];
                        var img = document.createElement("img");
                        img.src = imageState.src;
                        liHolder.appendChild(img);
                    }
                }
                else {
                    var status_2 = document.createElement("span");
                    status_2.innerText = state.capture.endState.VisualState.FrameBufferStatus;
                    liHolder.appendChild(status_2);
                }
                var text = document.createElement("span");
                text.innerText = new Date(state.capture.startTime).toTimeString().split(' ')[0];
                liHolder.appendChild(text);
                this.mapEventListener(liHolder, "click", "onCaptureSelected", state, stateId);
                return liHolder;
            };
            return CaptureListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureListItemComponent = CaptureListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var VisualStateListComponent = (function (_super) {
            __extends(VisualStateListComponent, _super);
            function VisualStateListComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            VisualStateListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"visualStateListComponent\">\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], _a.raw = ["\n            <div class=\"visualStateListComponent\">\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return VisualStateListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.VisualStateListComponent = VisualStateListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var VisualStateListItemComponent = (function (_super) {
            __extends(VisualStateListItemComponent, _super);
            function VisualStateListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onVisualStateSelected = _this.createEvent("onVisualStateSelected");
                return _this;
            }
            VisualStateListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                if (state.active) {
                    liHolder.className = "active";
                    setTimeout(function () { liHolder.scrollIntoView(); }, 1);
                }
                if (state.VisualState.Attachments) {
                    for (var _i = 0, _a = state.VisualState.Attachments; _i < _a.length; _i++) {
                        var imageState = _a[_i];
                        var img = document.createElement("img");
                        img.src = imageState.src;
                        liHolder.appendChild(img);
                        if (state.VisualState.Attachments.length > 1) {
                            var attachment = document.createElement("span");
                            attachment.innerText = imageState.attachmentName;
                            liHolder.appendChild(attachment);
                        }
                    }
                }
                else {
                    var status_3 = document.createElement("span");
                    status_3.innerText = state.VisualState.FrameBufferStatus;
                    liHolder.appendChild(status_3);
                }
                var fbo = document.createElement("span");
                fbo.innerText = state.VisualState.FrameBuffer ? "Frame buffer: " + state.VisualState.FrameBuffer.__SPECTOR_Object_TAG.id : "Canvas Frame buffer";
                liHolder.appendChild(fbo);
                this.mapEventListener(liHolder, "click", "onVisualStateSelected", state, stateId);
                return liHolder;
            };
            return VisualStateListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.VisualStateListItemComponent = VisualStateListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CommandListComponent = (function (_super) {
            __extends(CommandListComponent, _super);
            function CommandListComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"commandListComponent\">\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], _a.raw = ["\n            <div class=\"commandListComponent\">\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CommandListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CommandListComponent = CommandListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CommandListItemComponent = (function (_super) {
            __extends(CommandListItemComponent, _super);
            function CommandListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCommandSelected = _this.createEvent("onCommandSelected");
                return _this;
            }
            CommandListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                var status = "unknown";
                switch (state.capture.status) {
                    case 50 /* Deprecated */:
                        status = "deprecated";
                        break;
                    case 10 /* Unused */:
                        status = "unused";
                        break;
                    case 20 /* Disabled */:
                        status = "disabled";
                        break;
                    case 30 /* Redundant */:
                        status = "redundant";
                        break;
                    case 40 /* Valid */:
                        status = "valid";
                        break;
                }
                if (state.active) {
                    liHolder.className = " active";
                    setTimeout(function () { liHolder.scrollIntoView(); }, 1);
                }
                var textElement = document.createElement("span");
                var text = state.capture.text;
                text = text.replace(state.capture.name, "<span class=\" " + status + " important\">" + state.capture.name + "</span>");
                textElement.innerHTML = text;
                liHolder.appendChild(textElement);
                this.mapEventListener(liHolder, "click", "onCommandSelected", state, stateId);
                return liHolder;
            };
            return CommandListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CommandListItemComponent = CommandListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CommandDetailComponent = (function (_super) {
            __extends(CommandDetailComponent, _super);
            function CommandDetailComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandDetailComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"commandDetailComponent\" childrenContainer=\"true\">\n            </div>"], _a.raw = ["\n            <div class=\"commandDetailComponent\" childrenContainer=\"true\">\n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CommandDetailComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CommandDetailComponent = CommandDetailComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONContentComponent = (function (_super) {
            __extends(JSONContentComponent, _super);
            function JSONContentComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONContentComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"jsonContentComponent\" childrenContainer=\"true\">                \n            </div>"], _a.raw = ["\n            <div class=\"jsonContentComponent\" childrenContainer=\"true\">                \n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONContentComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONContentComponent = JSONContentComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONGroupComponent = (function (_super) {
            __extends(JSONGroupComponent, _super);
            function JSONGroupComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONGroupComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"jsonGroupComponent\">\n                <div class=\"jsonGroupComponentTitle\">", "</div>\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], _a.raw = ["\n            <div class=\"jsonGroupComponent\">\n                <div class=\"jsonGroupComponentTitle\">", "</div>\n                <ul childrenContainer=\"true\"></ul>                \n            </div>"], this.htmlTemplate(_a, state ? state.replace(/([A-Z])/g, ' $1').trim() : ""));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONGroupComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONGroupComponent = JSONGroupComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONVisualStateItemComponent = (function (_super) {
            __extends(JSONVisualStateItemComponent, _super);
            function JSONVisualStateItemComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONVisualStateItemComponent.prototype.render = function (state, stateId) {
                var divHolder = document.createElement("div");
                divHolder.className = "jsonVisualStateItemComponent";
                if (state.Attachments) {
                    for (var _i = 0, _a = state.Attachments; _i < _a.length; _i++) {
                        var imageState = _a[_i];
                        var img = document.createElement("img");
                        img.src = imageState.src;
                        divHolder.appendChild(img);
                        if (state.Attachments.length > 1) {
                            var attachment = document.createElement("span");
                            attachment.innerText = imageState.attachmentName;
                            divHolder.appendChild(attachment);
                        }
                    }
                }
                else {
                    var status_4 = document.createElement("span");
                    status_4.innerText = state.FrameBufferStatus;
                    divHolder.appendChild(status_4);
                }
                var fbo = document.createElement("span");
                fbo.innerText = state.FrameBuffer ? state.FrameBuffer.__SPECTOR_Object_TAG.displayText : "Canvas Frame buffer";
                divHolder.appendChild(fbo);
                return divHolder;
            };
            return JSONVisualStateItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONVisualStateItemComponent = JSONVisualStateItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONItemComponent = (function (_super) {
            __extends(JSONItemComponent, _super);
            function JSONItemComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONItemComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <li><span class=\"jsonItemComponentKey\">", ": </span><span class=\"jsonItemComponentValue\">", "</span><li>"], _a.raw = ["\n            <li><span class=\"jsonItemComponentKey\">", ": </span><span class=\"jsonItemComponentValue\">", "</span><li>"], this.htmlTemplate(_a, state.key, state.value));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONItemComponent = JSONItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultViewMenuComponent = (function (_super) {
            __extends(ResultViewMenuComponent, _super);
            function ResultViewMenuComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCapturesClicked = _this.createEvent("onCapturesClicked");
                _this.onCommandsClicked = _this.createEvent("onCommandsClicked");
                _this.onInformationClicked = _this.createEvent("onInformationClicked");
                _this.onInitStateClicked = _this.createEvent("onInitStateClicked");
                _this.onEndStateClicked = _this.createEvent("onEndStateClicked");
                _this.onCloseClicked = _this.createEvent("onCloseClicked");
                return _this;
            }
            ResultViewMenuComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <ul class=\"resultViewMenuComponent\">\n                <li><a class=\"", " href=\"#\" commandName=\"onCapturesClicked\">Captures</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onInformationClicked\">Information</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onInitStateClicked\">Init State</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onCommandsClicked\">Commands</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onEndStateClicked\">End State</a></li>\n                <li><a href=\"#\" commandName=\"onCloseClicked\">Close</a></li>\n            </ul>"], _a.raw = ["\n            <ul class=\"resultViewMenuComponent\">\n                <li><a class=\"", " href=\"#\" commandName=\"onCapturesClicked\">Captures</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onInformationClicked\">Information</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onInitStateClicked\">Init State</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onCommandsClicked\">Commands</a></li>\n                <li><a class=\"", " href=\"#\" commandName=\"onEndStateClicked\">End State</a></li>\n                <li><a href=\"#\" commandName=\"onCloseClicked\">Close</a></li>\n            </ul>"], this.htmlTemplate(_a, state === 0 /* Captures */ ? "active" : "", state === 10 /* Information */ ? "active" : "", state === 20 /* InitState */ ? "active" : "", state === 40 /* Commands */ ? "active" : "", state === 30 /* EndState */ ? "active" : ""));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return ResultViewMenuComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.ResultViewMenuComponent = ResultViewMenuComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultViewContentComponent = (function (_super) {
            __extends(ResultViewContentComponent, _super);
            function ResultViewContentComponent(eventConstructor, logger) {
                return _super.call(this, eventConstructor, logger) || this;
            }
            ResultViewContentComponent.prototype.render = function (state, stateId) {
                var htmlString = '<div childrenContainer="true" class="resultViewContentComponent"></div>';
                return this.renderElementFromTemplate(htmlString, state, stateId);
            };
            return ResultViewContentComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.ResultViewContentComponent = ResultViewContentComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultViewComponent = (function (_super) {
            __extends(ResultViewComponent, _super);
            function ResultViewComponent(eventConstructor, logger) {
                return _super.call(this, eventConstructor, logger) || this;
            }
            ResultViewComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div childrenContainer=\"true\" class=\"resultViewComponent ", "\">\n            </div>"], _a.raw = ["\n            <div childrenContainer=\"true\" class=\"resultViewComponent ", "\">\n            </div>"], this.htmlTemplate(_a, state ? "active" : ""));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return ResultViewComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.ResultViewComponent = ResultViewComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultView = (function () {
            function ResultView(options, logger) {
                var _this = this;
                this.options = options;
                this.logger = logger;
                this.rootPlaceHolder = options.rootPlaceHolder || document.body;
                this.mvx = new EmbeddedFrontend.MVX(this.rootPlaceHolder, logger);
                this.visible = false;
                this.commandListStateId = -1;
                this.commandDetailStateId = -1;
                this.currentCaptureStateId = -1;
                this.currentCommandStateId = -1;
                this.currentVisualStateId = -1;
                this.visualStateListStateId = -1;
                this.initVisualStateId = -1;
                this.captureListComponent = new EmbeddedFrontend.CaptureListComponent(options.eventConstructor, logger);
                this.captureListItemComponent = new EmbeddedFrontend.CaptureListItemComponent(options.eventConstructor, logger);
                this.visualStateListComponent = new EmbeddedFrontend.VisualStateListComponent(options.eventConstructor, logger);
                this.visualStateListItemComponent = new EmbeddedFrontend.VisualStateListItemComponent(options.eventConstructor, logger);
                this.commandListComponent = new EmbeddedFrontend.CommandListComponent(options.eventConstructor, logger);
                this.commandListItemComponent = new EmbeddedFrontend.CommandListItemComponent(options.eventConstructor, logger);
                this.commandDetailComponent = new EmbeddedFrontend.CommandDetailComponent(options.eventConstructor, logger);
                this.jsonContentComponent = new EmbeddedFrontend.JSONContentComponent(options.eventConstructor, logger);
                this.jsonGroupComponent = new EmbeddedFrontend.JSONGroupComponent(options.eventConstructor, logger);
                this.jsonItemComponent = new EmbeddedFrontend.JSONItemComponent(options.eventConstructor, logger);
                this.jsonVisualStateItemComponent = new EmbeddedFrontend.JSONVisualStateItemComponent(options.eventConstructor, logger);
                this.resultViewMenuComponent = new EmbeddedFrontend.ResultViewMenuComponent(options.eventConstructor, logger);
                this.resultViewContentComponent = new EmbeddedFrontend.ResultViewContentComponent(options.eventConstructor, logger);
                this.resultViewComponent = new EmbeddedFrontend.ResultViewComponent(options.eventConstructor, logger);
                this.rootStateId = this.mvx.addRootState(null, this.resultViewComponent);
                this.menuStateId = this.mvx.addChildState(this.rootStateId, 0 /* Captures */, this.resultViewMenuComponent);
                this.contentStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewContentComponent);
                this.captureListStateId = this.mvx.addChildState(this.rootStateId, false, this.captureListComponent);
                this.initMenuComponent();
                this.captureListItemComponent.onCaptureSelected.add(function (captureEventArgs) {
                    _this.selectCapture(captureEventArgs.stateId);
                });
                this.commandListItemComponent.onCommandSelected.add(function (commandEventArgs) {
                    _this.selectCommand(commandEventArgs.stateId);
                });
                this.visualStateListItemComponent.onVisualStateSelected.add(function (visualStateEventArgs) {
                    _this.selectVisualState(visualStateEventArgs.stateId);
                });
                this.updateViewState();
            }
            ResultView.prototype.selectCapture = function (captureStateId) {
                this.currentCaptureStateId = captureStateId;
                this.displayCurrentCapture();
            };
            ResultView.prototype.selectCommand = function (commandStateId) {
                this.currentCommandStateId = commandStateId;
                this.currentVisualStateId = this.displayCurrentCommand();
                this.displayCurrentVisualState();
            };
            ResultView.prototype.selectVisualState = function (visualStateId) {
                this.currentVisualStateId = visualStateId;
                this.currentCommandStateId = this.displayCurrentVisualState();
                this.displayCurrentCommand();
            };
            ResultView.prototype.display = function () {
                this.visible = true;
                this.updateViewState();
            };
            ResultView.prototype.hide = function () {
                this.visible = false;
                this.updateViewState();
            };
            ResultView.prototype.addCapture = function (capture) {
                var captureSateId = this.mvx.insertChildState(this.captureListStateId, {
                    capture: capture,
                    active: false
                }, 0, this.captureListItemComponent);
                this.selectCapture(captureSateId);
                return captureSateId;
            };
            ResultView.prototype.initMenuComponent = function () {
                var _this = this;
                this.mvx.updateState(this.menuStateId, 0 /* Captures */);
                this.resultViewMenuComponent.onCloseClicked.add(function (_) {
                    _this.hide();
                });
                this.resultViewMenuComponent.onCapturesClicked.add(function (_) {
                    _this.mvx.updateState(_this.menuStateId, 0 /* Captures */);
                    _this.mvx.updateState(_this.captureListStateId, true);
                });
                this.resultViewMenuComponent.onCommandsClicked.add(function (_) {
                    _this.displayCurrentCapture();
                });
                this.resultViewMenuComponent.onInformationClicked.add(function (_) {
                    _this.displayInformation();
                });
                this.resultViewMenuComponent.onInitStateClicked.add(function (_) {
                    _this.displayInitState();
                });
                this.resultViewMenuComponent.onEndStateClicked.add(function (_) {
                    _this.displayEndState();
                });
            };
            ResultView.prototype.onCaptureRelatedAction = function (menuStatus) {
                this.mvx.removeChildrenStates(this.contentStateId);
                this.mvx.updateState(this.menuStateId, menuStatus);
                if (this.mvx.getGenericState(this.captureListStateId)) {
                    this.mvx.updateState(this.captureListStateId, false);
                }
                var captureState = this.mvx.getGenericState(this.currentCaptureStateId);
                return captureState.capture;
            };
            ResultView.prototype.displayInformation = function () {
                var capture = this.onCaptureRelatedAction(10 /* Information */);
                var jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
                this.displayJSONGroup(jsonContentStateId, "Canvas", capture.canvas);
                this.displayJSONGroup(jsonContentStateId, "Context", capture.context);
            };
            ResultView.prototype.displayJSON = function (parentGroupId, json) {
                if (json.VisualState) {
                    this.mvx.addChildState(parentGroupId, json.VisualState, this.jsonVisualStateItemComponent);
                }
                for (var key in json) {
                    if (key === "VisualState") {
                        continue;
                    }
                    else {
                        var value = json[key];
                        var result = this.getJSONAsString(parentGroupId, key, value);
                        if (result === null) {
                            continue;
                        }
                        this.mvx.addChildState(parentGroupId, {
                            key: key,
                            value: result
                        }, this.jsonItemComponent);
                    }
                }
            };
            ResultView.prototype.getJSONAsString = function (parentGroupId, key, json) {
                if (json === null) {
                    return "null";
                }
                if (json === undefined) {
                    return "undefined";
                }
                if (typeof json === "number") {
                    return json.toFixed(4);
                }
                if (typeof json === "string") {
                    return json;
                }
                if (typeof json === "boolean") {
                    return json ? "true" : "false";
                }
                if (json.length === 0) {
                    return "Empty Array";
                }
                if (json.length) {
                    var arrayResult = [];
                    for (var i = 0; i < json.length; i++) {
                        var resultItem = this.getJSONAsString(parentGroupId, key + "(" + i.toFixed(0) + ")", json[i]);
                        if (resultItem !== null) {
                            arrayResult.push(resultItem);
                        }
                    }
                    return arrayResult.length == 0 ? null : arrayResult.join(", ");
                }
                if (json.__SPECTOR_Object_TAG) {
                    return json.__SPECTOR_Object_TAG.displayText;
                }
                if (json.displayText) {
                    return json.displayText;
                }
                if (typeof json === "object") {
                    this.displayJSONGroup(parentGroupId, key, json);
                }
                return null;
            };
            ResultView.prototype.displayJSONGroup = function (parentGroupId, title, json) {
                if (!json) {
                    return;
                }
                var groupId = this.mvx.addChildState(parentGroupId, title, this.jsonGroupComponent);
                this.displayJSON(groupId, json);
            };
            ResultView.prototype.displayInitState = function () {
                var capture = this.onCaptureRelatedAction(20 /* InitState */);
                var jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
                this.displayJSON(jsonContentStateId, capture.initState);
            };
            ResultView.prototype.displayEndState = function () {
                var capture = this.onCaptureRelatedAction(30 /* EndState */);
                var jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
                this.displayJSON(jsonContentStateId, capture.endState);
            };
            ResultView.prototype.displayCurrentCapture = function () {
                var capture = this.onCaptureRelatedAction(40 /* Commands */);
                this.mvx.updateAllChildrenGenericState(this.captureListStateId, function (state) { state.active = false; return state; });
                this.mvx.updateState(this.currentCaptureStateId, {
                    capture: capture,
                    active: true,
                });
                this.createVisualStates(capture);
                this.commandListStateId = this.mvx.addChildState(this.contentStateId, null, this.commandListComponent);
                this.commandDetailStateId = this.mvx.addChildState(this.contentStateId, null, this.commandDetailComponent);
                this.createCommands(capture);
            };
            ResultView.prototype.displayCurrentCommand = function () {
                if (this.mvx.getGenericState(this.menuStateId) !== 40 /* Commands */) {
                    return -1;
                }
                var commandState = this.mvx.getGenericState(this.currentCommandStateId);
                var command = commandState.capture;
                this.mvx.updateAllChildrenGenericState(this.commandListStateId, function (state) { state.active = false; return state; });
                this.mvx.updateState(this.currentCommandStateId, {
                    capture: command,
                    visualStateId: commandState.visualStateId,
                    active: true,
                });
                this.mvx.removeChildrenStates(this.commandDetailStateId);
                var visualState = this.mvx.getGenericState(commandState.visualStateId);
                this.mvx.addChildState(this.commandDetailStateId, visualState.VisualState, this.jsonVisualStateItemComponent);
                var status = "Unknown";
                switch (command.status) {
                    case 50 /* Deprecated */:
                        status = "Deprecated";
                        break;
                    case 10 /* Unused */:
                        status = "Unused";
                        break;
                    case 20 /* Disabled */:
                        status = "Disabled";
                        break;
                    case 30 /* Redundant */:
                        status = "Redundant";
                        break;
                    case 40 /* Valid */:
                        status = "Valid";
                        break;
                }
                if (command.result) {
                    this.displayJSONGroup(this.commandDetailStateId, "Global", {
                        name: command.name,
                        duration: command.commandEndTime - command.startTime,
                        result: command.result,
                        status: status
                    });
                }
                else {
                    this.displayJSONGroup(this.commandDetailStateId, "Global", {
                        name: command.name,
                        duration: command.commandEndTime - command.startTime,
                        status: status
                    });
                }
                for (var key in command) {
                    if (key === "VisualState" || key === "result") {
                        continue;
                    }
                    else if (typeof command[key] === "object") {
                        this.displayJSONGroup(this.commandDetailStateId, key, command[key]);
                    }
                }
                return commandState.visualStateId;
            };
            ResultView.prototype.displayCurrentVisualState = function () {
                if (this.mvx.getGenericState(this.menuStateId) !== 40 /* Commands */) {
                    return null;
                }
                var visualState = this.mvx.getGenericState(this.currentVisualStateId);
                if (visualState.commandStateId === Number.MIN_VALUE) {
                    this.displayInitState();
                }
                else if (visualState.commandStateId === Number.MAX_VALUE) {
                    this.displayEndState();
                }
                this.mvx.updateAllChildrenGenericState(this.visualStateListStateId, function (state) { state.active = false; return state; });
                visualState.active = true;
                this.mvx.updateState(this.currentVisualStateId, visualState);
                return visualState.commandStateId;
            };
            ResultView.prototype.createVisualStates = function (capture) {
                this.visualStateListStateId = this.mvx.addChildState(this.contentStateId, null, this.visualStateListComponent);
                this.mvx.removeChildrenStates(this.visualStateListStateId);
                this.initVisualStateId = this.mvx.addChildState(this.visualStateListStateId, {
                    VisualState: capture.initState.VisualState,
                    time: capture.startTime,
                    commandStateId: Number.MIN_VALUE,
                    active: false,
                }, this.visualStateListItemComponent);
            };
            ResultView.prototype.createCommands = function (capture) {
                this.mvx.removeChildrenStates(this.commandListStateId);
                var tempVisualStateId = this.initVisualStateId;
                for (var i = 0; i < capture.commands.length; i++) {
                    var commandCapture = capture.commands[i];
                    var commandStateId = this.mvx.addChildState(this.commandListStateId, {
                        capture: commandCapture,
                        active: false
                    }, this.commandListItemComponent);
                    if (commandCapture.VisualState) {
                        tempVisualStateId = this.mvx.addChildState(this.visualStateListStateId, {
                            VisualState: commandCapture.VisualState,
                            time: commandCapture.endTime,
                            commandStateId: commandStateId,
                            active: false,
                        }, this.visualStateListItemComponent);
                    }
                    else if (i == 0) {
                        var initVisualState = this.mvx.getGenericState(this.initVisualStateId);
                        initVisualState.commandStateId = commandStateId;
                        this.mvx.updateState(this.initVisualStateId, initVisualState);
                    }
                    this.mvx.updateState(commandStateId, {
                        capture: commandCapture,
                        active: false,
                        visualStateId: tempVisualStateId
                    });
                    if (i === 0) {
                        this.currentCommandStateId = commandStateId;
                        this.displayCurrentCommand();
                        this.currentVisualStateId = tempVisualStateId;
                        this.displayCurrentVisualState();
                    }
                }
            };
            ResultView.prototype.updateViewState = function () {
                this.mvx.updateState(this.rootStateId, this.visible);
            };
            return ResultView;
        }());
        EmbeddedFrontend.ResultView = ResultView;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var ProvidedInjection;
    (function (ProvidedInjection) {
        ProvidedInjection.DefaultInjection = {
            WebGlObjectNamespace: SPECTOR.WebGlObjects,
            RecorderNamespace: SPECTOR.Recorders,
            CommandNamespace: SPECTOR.Commands,
            StateNamespace: SPECTOR.States,
            StackTraceCtor: SPECTOR.Utils.StackTrace,
            LoggerCtor: SPECTOR.Utils.ConsoleLogger,
            EventCtor: SPECTOR.Utils.Event,
            TimeCtor: SPECTOR.Utils.Time,
            CanvasSpyCtor: SPECTOR.Spies.CanvasSpy,
            CommandSpyCtor: SPECTOR.Spies.CommandSpy,
            ContextSpyCtor: SPECTOR.Spies.ContextSpy,
            RecorderSpyCtor: SPECTOR.Spies.RecorderSpy,
            StateSpyCtor: SPECTOR.Spies.StateSpy,
            TimeSpyCtor: SPECTOR.Spies.TimeSpy,
            WebGlObjectSpyCtor: SPECTOR.Spies.WebGlObjectSpy,
            ExtensionsCtor: SPECTOR.States.Information.Extensions,
            CapabilitiesCtor: SPECTOR.States.Information.Capabilities,
            CompressedTexturesCtor: SPECTOR.States.Information.CompressedTextures,
            DefaultCommandCtor: SPECTOR.Commands.DefaultCommand,
            CaptureMenuConstructor: SPECTOR.EmbeddedFrontend.CaptureMenu,
            ResultViewConstructor: SPECTOR.EmbeddedFrontend.ResultView,
        };
    })(ProvidedInjection = SPECTOR.ProvidedInjection || (SPECTOR.ProvidedInjection = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spector = (function () {
        function Spector(options) {
            if (options === void 0) { options = {}; }
            this.options = options;
            this.injection = options.injection || SPECTOR.ProvidedInjection.DefaultInjection;
            this.captureNextFrames = 0;
            this.contexts = [];
            this.logger = new this.injection.LoggerCtor();
            this.time = new this.injection.TimeCtor();
            this.timeSpy = new this.injection.TimeSpyCtor({
                eventConstructor: this.injection.EventCtor,
                timeConstructor: this.injection.TimeCtor
            }, this.logger);
            this.onCapture = new this.injection.EventCtor();
            this.timeSpy.onFrameStart.add(this.onFrameStart, this);
            this.timeSpy.onFrameEnd.add(this.onFrameEnd, this);
        }
        Spector.prototype.displayUI = function () {
            var _this = this;
            if (!this.resultView) {
                this.resultView = new this.injection.ResultViewConstructor({
                    eventConstructor: this.injection.EventCtor,
                }, this.logger);
                this.onCapture.add(function (capture) {
                    _this.resultView.display();
                    _this.resultView.addCapture(capture);
                });
            }
            if (!this.captureMenu) {
                this.captureMenu = new this.injection.CaptureMenuConstructor({
                    eventConstructor: this.injection.EventCtor,
                }, this.logger);
                this.captureMenu.onPauseRequested.add(this.pause, this);
                this.captureMenu.onPlayRequested.add(this.play, this);
                this.captureMenu.onPlayNextFrameRequested.add(this.playNextFrame, this);
                this.captureMenu.onCaptureRequested.add(this.captureCanvas, this);
                setInterval(function () { _this.captureMenu.setFPS(_this.timeSpy.getFps()); }, 1000);
            }
            this.captureMenu.display();
        };
        Spector.prototype.pause = function () {
            this.timeSpy.changeSpeedRatio(0);
        };
        Spector.prototype.play = function () {
            this.timeSpy.changeSpeedRatio(1);
        };
        Spector.prototype.playNextFrame = function () {
            this.timeSpy.playNextFrame();
        };
        Spector.prototype.drawOnlyEveryXFrame = function (x) {
            this.timeSpy.changeSpeedRatio(x);
        };
        Spector.prototype.spyCanvases = function () {
            if (this.canvasSpy) {
                this.logger.error("Already spying canvas.");
                return;
            }
            this.canvasSpy = new this.injection.CanvasSpyCtor({ eventConstructor: this.injection.EventCtor }, this.logger);
            this.canvasSpy.onContextRequested.add(this.spyContext, this);
        };
        Spector.prototype.spyCanvas = function (canvas) {
            if (this.canvasSpy) {
                this.logger.error("Already spying canvas.");
                return;
            }
            this.canvasSpy = new this.injection.CanvasSpyCtor({
                eventConstructor: this.injection.EventCtor,
                canvas: canvas
            }, this.logger);
            this.canvasSpy.onContextRequested.add(this.spyContext, this);
        };
        Spector.prototype.getAvailableContexts = function () {
            return this.getAvailableContexts();
        };
        Spector.prototype.captureCanvas = function (canvas) {
            var contextSpy = this.getAvailableContextSpyByCanvas(canvas);
            if (!contextSpy) {
                var context = void 0;
                try {
                    context = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2");
                }
                catch (e) {
                    this.logger.error(e);
                }
                if (!context) {
                    try {
                        context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                    }
                    catch (e) {
                        this.logger.error(e);
                    }
                }
                if (context) {
                    this.captureContext(context);
                }
                else {
                    this.logger.error("No webgl context available on the chosen canvas.");
                }
            }
            else {
                this.captureContextSpy(contextSpy);
            }
        };
        Spector.prototype.captureContext = function (context) {
            var contextSpy = this.getAvailableContextSpyByCanvas(context.canvas);
            if (!contextSpy) {
                if (context.getIndexedParameter) {
                    contextSpy = new this.injection.ContextSpyCtor({
                        context: context,
                        version: 2,
                        recordAlways: false,
                        injection: this.injection
                    }, this.time, this.logger);
                }
                else {
                    contextSpy = new this.injection.ContextSpyCtor({
                        context: context,
                        version: 1,
                        recordAlways: false,
                        injection: this.injection
                    }, this.time, this.logger);
                }
                this.contexts.push({
                    canvas: contextSpy.context.canvas,
                    contextSpy: contextSpy
                });
            }
            if (contextSpy) {
                this.captureContextSpy(contextSpy);
            }
        };
        Spector.prototype.captureContextSpy = function (contextSpy) {
            if (this.capturingContext) {
                this.logger.error("Already capturing a context.");
            }
            else {
                this.capturingContext = contextSpy;
                this.capture();
            }
        };
        Spector.prototype.capture = function (frameCount) {
            if (frameCount === void 0) { frameCount = 1; }
            this.captureNextFrames = frameCount;
            this.playNextFrame();
        };
        Spector.prototype.spyContext = function (contextInformation) {
            var contextSpy = this.getAvailableContextSpyByCanvas(contextInformation.context.canvas);
            if (!contextSpy) {
                contextSpy = new this.injection.ContextSpyCtor({
                    context: contextInformation.context,
                    version: contextInformation.contextVersion,
                    recordAlways: true,
                    injection: this.injection
                }, this.time, this.logger);
                this.contexts.push({
                    canvas: contextSpy.context.canvas,
                    contextSpy: contextSpy
                });
            }
            contextSpy.spy();
        };
        Spector.prototype.getAvailableContextSpyByCanvas = function (canvas) {
            for (var _i = 0, _a = this.contexts; _i < _a.length; _i++) {
                var availableContext = _a[_i];
                if (availableContext.canvas === canvas) {
                    return availableContext.contextSpy;
                }
            }
            return undefined;
        };
        Spector.prototype.onFrameStart = function () {
            if (this.captureNextFrames > 0) {
                if (this.capturingContext) {
                    this.capturingContext.startCapture();
                }
                this.captureNextFrames--;
            }
            else {
                this.capturingContext = undefined;
            }
        };
        Spector.prototype.onFrameEnd = function () {
            if (this.capturingContext && this.captureNextFrames === 0) {
                var capture = this.capturingContext.stopCapture();
                this.onCapture.trigger(capture);
            }
        };
        return Spector;
    }());
    SPECTOR.Spector = Spector;
})(SPECTOR || (SPECTOR = {}));
//# sourceMappingURL=spector.js.map