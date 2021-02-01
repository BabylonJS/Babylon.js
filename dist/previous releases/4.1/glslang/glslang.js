
var Module = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  return (
function(Module) {
  Module = Module || {};

var d;d||(d=typeof Module !== 'undefined' ? Module : {});d.compileGLSLZeroCopy=function(a,b,c){c=!!c;if("vertex"===b)var e=0;else if("fragment"===b)e=4;else if("compute"===b)e=5;else throw Error("shader_stage must be 'vertex', 'fragment', or 'compute'");b=d._malloc(4);var f=d._malloc(4),g=ba([a,e,c,b,f]);c=ca(b);a=ca(f);d._free(b);d._free(f);if(0===g)throw Error("GLSL compilation failed");b={};f=c/4;b.data=d.HEAPU32.subarray(f,f+a);b.fa=function(){d._destroy_output_buffer(g)};return b};
d.compileGLSL=function(a,b,c){a=d.compileGLSLZeroCopy(a,b,c);b=a.data.slice();a.fa();return b};var m={},p;for(p in d)d.hasOwnProperty(p)&&(m[p]=d[p]);var da=!1,r=!1;da="object"===typeof window;r="function"===typeof importScripts;var t="",ea;
if(da||r)r?t=self.location.href:document.currentScript&&(t=document.currentScript.src),_scriptDir&&(t=_scriptDir),0!==t.indexOf("blob:")?t=t.substr(0,t.lastIndexOf("/")+1):t="",r&&(ea=function(a){var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)});var fa=d.print||console.log.bind(console),u=d.printErr||console.warn.bind(console);for(p in m)m.hasOwnProperty(p)&&(d[p]=m[p]);m=null;
var ha={"f64-rem":function(a,b){return a%b},"debugger":function(){}},v;d.wasmBinary&&(v=d.wasmBinary);"object"!==typeof WebAssembly&&u("no native wasm support detected");function ca(a){var b="i32";"*"===b.charAt(b.length-1)&&(b="i32");switch(b){case "i1":return w[a>>0];case "i8":return w[a>>0];case "i16":return x[a>>1];case "i32":return y[a>>2];case "i64":return y[a>>2];case "float":return ia[a>>2];case "double":return ja[a>>3];default:z("invalid type for getValue: "+b)}return null}var A,ka=!1;
function la(){var a=d._convert_glsl_to_spirv;a||z("Assertion failed: Cannot call unknown function convert_glsl_to_spirv, make sure it is exported");return a}
function ba(a){var b=["string","number","boolean","number","number"],c={string:function(a){var b=0;if(null!==a&&void 0!==a&&0!==a){var c=(a.length<<2)+1;b=ma(c);B(a,C,b,c)}return b},array:function(a){var b=ma(a.length);w.set(a,b);return b}},e=la(),f=[],g=0;if(a)for(var h=0;h<a.length;h++){var k=c[b[h]];k?(0===g&&(g=na()),f[h]=k(a[h])):f[h]=a[h]}a=e.apply(null,f);0!==g&&oa(g);return a}var pa="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;
function qa(a,b,c){var e=b+c;for(c=b;a[c]&&!(c>=e);)++c;if(16<c-b&&a.subarray&&pa)return pa.decode(a.subarray(b,c));for(e="";b<c;){var f=a[b++];if(f&128){var g=a[b++]&63;if(192==(f&224))e+=String.fromCharCode((f&31)<<6|g);else{var h=a[b++]&63;f=224==(f&240)?(f&15)<<12|g<<6|h:(f&7)<<18|g<<12|h<<6|a[b++]&63;65536>f?e+=String.fromCharCode(f):(f-=65536,e+=String.fromCharCode(55296|f>>10,56320|f&1023))}}else e+=String.fromCharCode(f)}return e}function D(a){return a?qa(C,a,void 0):""}
function B(a,b,c,e){if(0<e){e=c+e-1;for(var f=0;f<a.length;++f){var g=a.charCodeAt(f);if(55296<=g&&57343>=g){var h=a.charCodeAt(++f);g=65536+((g&1023)<<10)|h&1023}if(127>=g){if(c>=e)break;b[c++]=g}else{if(2047>=g){if(c+1>=e)break;b[c++]=192|g>>6}else{if(65535>=g){if(c+2>=e)break;b[c++]=224|g>>12}else{if(c+3>=e)break;b[c++]=240|g>>18;b[c++]=128|g>>12&63}b[c++]=128|g>>6&63}b[c++]=128|g&63}}b[c]=0}}
function ra(a){for(var b=0,c=0;c<a.length;++c){var e=a.charCodeAt(c);55296<=e&&57343>=e&&(e=65536+((e&1023)<<10)|a.charCodeAt(++c)&1023);127>=e?++b:b=2047>=e?b+2:65535>=e?b+3:b+4}return b}"undefined"!==typeof TextDecoder&&new TextDecoder("utf-16le");function sa(a){0<a%65536&&(a+=65536-a%65536);return a}var E,w,C,x,ta,y,F,ia,ja;
function ua(){d.HEAP8=w=new Int8Array(E);d.HEAP16=x=new Int16Array(E);d.HEAP32=y=new Int32Array(E);d.HEAPU8=C=new Uint8Array(E);d.HEAPU16=ta=new Uint16Array(E);d.HEAPU32=F=new Uint32Array(E);d.HEAPF32=ia=new Float32Array(E);d.HEAPF64=ja=new Float64Array(E)}var va=d.TOTAL_MEMORY||16777216;d.wasmMemory?A=d.wasmMemory:A=new WebAssembly.Memory({initial:va/65536});A&&(E=A.buffer);va=E.byteLength;ua();y[87504]=5592928;
function G(a){for(;0<a.length;){var b=a.shift();if("function"==typeof b)b();else{var c=b.ga;"number"===typeof c?void 0===b.da?d.dynCall_v(c):d.dynCall_vi(c,b.da):c(void 0===b.da?null:b.da)}}}var wa=[],xa=[],ya=[],za=[];function Aa(){var a=d.preRun.shift();wa.unshift(a)}var H=0,Ba=null,I=null;d.preloadedImages={};d.preloadedAudios={};
function Ca(){var a=K;return String.prototype.startsWith?a.startsWith("data:application/octet-stream;base64,"):0===a.indexOf("data:application/octet-stream;base64,")}var K="glslang.wasm";if(!Ca()){var Da=K;K=d.locateFile?d.locateFile(Da,t):t+Da}function Ea(){try{if(v)return new Uint8Array(v);if(ea)return ea(K);throw"both async and sync fetching of the wasm failed";}catch(a){z(a)}}
function Fa(){return v||!da&&!r||"function"!==typeof fetch?new Promise(function(a){a(Ea())}):fetch(K,{credentials:"same-origin"}).then(function(a){if(!a.ok)throw"failed to load wasm binary file at '"+K+"'";return a.arrayBuffer()}).catch(function(){return Ea()})}
function Ga(a){function b(a){d.asm=a.exports;H--;d.monitorRunDependencies&&d.monitorRunDependencies(H);0==H&&(null!==Ba&&(clearInterval(Ba),Ba=null),I&&(a=I,I=null,a()))}function c(a){b(a.instance)}function e(a){return Fa().then(function(a){return WebAssembly.instantiate(a,f)}).then(a,function(a){u("failed to asynchronously prepare wasm: "+a);z(a)})}var f={env:a,global:{NaN:NaN,Infinity:Infinity},"global.Math":Math,asm2wasm:ha};H++;d.monitorRunDependencies&&d.monitorRunDependencies(H);if(d.instantiateWasm)try{return d.instantiateWasm(f,
b)}catch(g){return u("Module.instantiateWasm callback failed with error: "+g),!1}(function(){if(v||"function"!==typeof WebAssembly.instantiateStreaming||Ca()||"function"!==typeof fetch)return e(c);fetch(K,{credentials:"same-origin"}).then(function(a){return WebAssembly.instantiateStreaming(a,f).then(c,function(a){u("wasm streaming compile failed: "+a);u("falling back to ArrayBuffer instantiation");e(c)})})})();return{}}
d.asm=function(a,b){b.memory=A;b.table=new WebAssembly.Table({initial:1064,maximum:1064,element:"anyfunc"});b.__memory_base=1024;b.__table_base=0;return Ga(b)};xa.push({ga:function(){Ha()}});function Ia(a){d.___errno_location&&(y[d.___errno_location()>>2]=a);return a}var Ja=[null,[],[]],L=0;function M(){L+=4;return y[L-4>>2]}var N={};function Ka(a){switch(a){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+a);}}var La=void 0;
function O(a){for(var b="";C[a];)b+=La[C[a++]];return b}var Ma={},Na={},Oa={};function Pa(a,b){if(void 0===a)a="_unknown";else{a=a.replace(/[^a-zA-Z0-9_]/g,"$");var c=a.charCodeAt(0);a=48<=c&&57>=c?"_"+a:a}return(new Function("body","return function "+a+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n'))(b)}
function Ra(a){var b=Error,c=Pa(a,function(b){this.name=a;this.message=b;b=Error(b).stack;void 0!==b&&(this.stack=this.toString()+"\n"+b.replace(/^Error(:[^\n]*)?\n/,""))});c.prototype=Object.create(b.prototype);c.prototype.constructor=c;c.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message};return c}var Sa=void 0;function P(a){throw new Sa(a);}
function Q(a,b,c){c=c||{};if(!("argPackAdvance"in b))throw new TypeError("registerType registeredInstance requires argPackAdvance");var e=b.name;a||P('type "'+e+'" must have a positive integer typeid pointer');if(Na.hasOwnProperty(a)){if(c.ia)return;P("Cannot register type '"+e+"' twice")}Na[a]=b;delete Oa[a];Ma.hasOwnProperty(a)&&(b=Ma[a],delete Ma[a],b.forEach(function(a){a()}))}var Ta=[],R=[{},{value:void 0},{value:null},{value:!0},{value:!1}];
function Ua(a){switch(a){case void 0:return 1;case null:return 2;case !0:return 3;case !1:return 4;default:var b=Ta.length?Ta.pop():R.length;R[b]={ka:1,value:a};return b}}function Va(a){return this.fromWireType(F[a>>2])}function Wa(a){if(null===a)return"null";var b=typeof a;return"object"===b||"array"===b||"function"===b?a.toString():""+a}
function Xa(a,b){switch(b){case 2:return function(a){return this.fromWireType(ia[a>>2])};case 3:return function(a){return this.fromWireType(ja[a>>3])};default:throw new TypeError("Unknown float type: "+a);}}
function Ya(a,b,c){switch(b){case 0:return c?function(a){return w[a]}:function(a){return C[a]};case 1:return c?function(a){return x[a>>1]}:function(a){return ta[a>>1]};case 2:return c?function(a){return y[a>>2]}:function(a){return F[a>>2]};default:throw new TypeError("Unknown integer type: "+a);}}function Za(){return w.length}var $a={};function S(a){if(0===a)return 0;a=D(a);if(!$a.hasOwnProperty(a))return 0;S.X&&T(S.X);a=$a[a];var b=ra(a)+1,c=ab(b);c&&B(a,w,c,b);S.X=c;return S.X}
function U(){U.X||(U.X=[]);U.X.push(na());return U.X.length-1}function bb(a){a=sa(a);var b=E.byteLength;try{return-1!==A.grow((a-b)/65536)?(E=A.buffer,!0):!1}catch(c){return!1}}function V(a){return 0===a%4&&(0!==a%100||0===a%400)}function cb(a,b){for(var c=0,e=0;e<=b;c+=a[e++]);return c}var W=[31,29,31,30,31,30,31,31,30,31,30,31],X=[31,28,31,30,31,30,31,31,30,31,30,31];
function Y(a,b){for(a=new Date(a.getTime());0<b;){var c=a.getMonth(),e=(V(a.getFullYear())?W:X)[c];if(b>e-a.getDate())b-=e-a.getDate()+1,a.setDate(1),11>c?a.setMonth(c+1):(a.setMonth(0),a.setFullYear(a.getFullYear()+1));else{a.setDate(a.getDate()+b);break}}return a}
function db(a,b,c,e){function f(a,b,c){for(a="number"===typeof a?a.toString():a||"";a.length<b;)a=c[0]+a;return a}function g(a,b){return f(a,b,"0")}function h(a,b){function c(a){return 0>a?-1:0<a?1:0}var aa;0===(aa=c(a.getFullYear()-b.getFullYear()))&&0===(aa=c(a.getMonth()-b.getMonth()))&&(aa=c(a.getDate()-b.getDate()));return aa}function k(a){switch(a.getDay()){case 0:return new Date(a.getFullYear()-1,11,29);case 1:return a;case 2:return new Date(a.getFullYear(),0,3);case 3:return new Date(a.getFullYear(),
0,2);case 4:return new Date(a.getFullYear(),0,1);case 5:return new Date(a.getFullYear()-1,11,31);case 6:return new Date(a.getFullYear()-1,11,30)}}function q(a){a=Y(new Date(a.W+1900,0,1),a.ca);var b=k(new Date(a.getFullYear()+1,0,4));return 0>=h(k(new Date(a.getFullYear(),0,4)),a)?0>=h(b,a)?a.getFullYear()+1:a.getFullYear():a.getFullYear()-1}var l=y[e+40>>2];e={na:y[e>>2],ma:y[e+4>>2],aa:y[e+8>>2],$:y[e+12>>2],Y:y[e+16>>2],W:y[e+20>>2],ba:y[e+24>>2],ca:y[e+28>>2],ya:y[e+32>>2],la:y[e+36>>2],oa:l?
D(l):""};c=D(c);l={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var n in l)c=c.replace(new RegExp(n,"g"),l[n]);var J="Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
Qa="January February March April May June July August September October November December".split(" ");l={"%a":function(a){return J[a.ba].substring(0,3)},"%A":function(a){return J[a.ba]},"%b":function(a){return Qa[a.Y].substring(0,3)},"%B":function(a){return Qa[a.Y]},"%C":function(a){return g((a.W+1900)/100|0,2)},"%d":function(a){return g(a.$,2)},"%e":function(a){return f(a.$,2," ")},"%g":function(a){return q(a).toString().substring(2)},"%G":function(a){return q(a)},"%H":function(a){return g(a.aa,
2)},"%I":function(a){a=a.aa;0==a?a=12:12<a&&(a-=12);return g(a,2)},"%j":function(a){return g(a.$+cb(V(a.W+1900)?W:X,a.Y-1),3)},"%m":function(a){return g(a.Y+1,2)},"%M":function(a){return g(a.ma,2)},"%n":function(){return"\n"},"%p":function(a){return 0<=a.aa&&12>a.aa?"AM":"PM"},"%S":function(a){return g(a.na,2)},"%t":function(){return"\t"},"%u":function(a){return a.ba||7},"%U":function(a){var b=new Date(a.W+1900,0,1),c=0===b.getDay()?b:Y(b,7-b.getDay());a=new Date(a.W+1900,a.Y,a.$);return 0>h(c,a)?
g(Math.ceil((31-c.getDate()+(cb(V(a.getFullYear())?W:X,a.getMonth()-1)-31)+a.getDate())/7),2):0===h(c,b)?"01":"00"},"%V":function(a){var b=k(new Date(a.W+1900,0,4)),c=k(new Date(a.W+1901,0,4)),e=Y(new Date(a.W+1900,0,1),a.ca);return 0>h(e,b)?"53":0>=h(c,e)?"01":g(Math.ceil((b.getFullYear()<a.W+1900?a.ca+32-b.getDate():a.ca+1-b.getDate())/7),2)},"%w":function(a){return a.ba},"%W":function(a){var b=new Date(a.W,0,1),c=1===b.getDay()?b:Y(b,0===b.getDay()?1:7-b.getDay()+1);a=new Date(a.W+1900,a.Y,a.$);
return 0>h(c,a)?g(Math.ceil((31-c.getDate()+(cb(V(a.getFullYear())?W:X,a.getMonth()-1)-31)+a.getDate())/7),2):0===h(c,b)?"01":"00"},"%y":function(a){return(a.W+1900).toString().substring(2)},"%Y":function(a){return a.W+1900},"%z":function(a){a=a.la;var b=0<=a;a=Math.abs(a)/60;return(b?"+":"-")+String("0000"+(a/60*100+a%60)).slice(-4)},"%Z":function(a){return a.oa},"%%":function(){return"%"}};for(n in l)0<=c.indexOf(n)&&(c=c.replace(new RegExp(n,"g"),l[n](e)));n=eb(c);if(n.length>b)return 0;w.set(n,
a);return n.length-1}for(var fb=Array(256),gb=0;256>gb;++gb)fb[gb]=String.fromCharCode(gb);La=fb;Sa=d.BindingError=Ra("BindingError");d.InternalError=Ra("InternalError");d.count_emval_handles=function(){for(var a=0,b=5;b<R.length;++b)void 0!==R[b]&&++a;return a};d.get_first_emval=function(){for(var a=5;a<R.length;++a)if(void 0!==R[a])return R[a];return null};function eb(a){var b=Array(ra(a)+1);B(a,b,0,b.length);return b}
var ib=d.asm({},{c:z,I:function(){ka=!0;throw"Pure virtual function called!";},C:function(){return hb.pa},v:function(){},q:function(){Ia(1);return-1},j:Ia,p:function(a,b){L=b;try{return N.ha(),M(),M(),M(),M(),0}catch(c){return z(c),-c.ea}},i:function(a,b){L=b;try{var c=M(),e=M(),f=M();for(b=a=0;b<f;b++){for(var g=y[e+8*b>>2],h=y[e+(8*b+4)>>2],k=0;k<h;k++){var q=C[g+k],l=Ja[c];0===q||10===q?((1===c?fa:u)(qa(l,0)),l.length=0):l.push(q)}a+=h}return a}catch(n){return z(n),-n.ea}},o:function(a,b){L=b;
return 0},n:function(a,b){L=b;try{return N.ha(),0}catch(c){return z(c),-c.ea}},H:function(a,b){L=b;try{var c=M();var e=M();if(-1===c||0===e)var f=-22;else{var g=N.ja[c];if(g&&e===g.va){var h=(void 0).ta(g.sa);N.ra(c,h,e,g.flags);(void 0).xa(h);N.ja[c]=null;g.qa&&T(g.wa)}f=0}return f}catch(k){return z(k),-k.ea}},m:function(){},G:function(a,b,c,e,f){var g=Ka(c);b=O(b);Q(a,{name:b,fromWireType:function(a){return!!a},toWireType:function(a,b){return b?e:f},argPackAdvance:8,readValueFromPointer:function(a){if(1===
c)var e=w;else if(2===c)e=x;else if(4===c)e=y;else throw new TypeError("Unknown boolean type size: "+b);return this.fromWireType(e[a>>g])},Z:null})},F:function(a,b){b=O(b);Q(a,{name:b,fromWireType:function(a){var b=R[a].value;4<a&&0===--R[a].ka&&(R[a]=void 0,Ta.push(a));return b},toWireType:function(a,b){return Ua(b)},argPackAdvance:8,readValueFromPointer:Va,Z:null})},l:function(a,b,c){c=Ka(c);b=O(b);Q(a,{name:b,fromWireType:function(a){return a},toWireType:function(a,b){if("number"!==typeof b&&"boolean"!==
typeof b)throw new TypeError('Cannot convert "'+Wa(b)+'" to '+this.name);return b},argPackAdvance:8,readValueFromPointer:Xa(b,c),Z:null})},e:function(a,b,c,e,f){function g(a){return a}b=O(b);-1===f&&(f=4294967295);var h=Ka(c);if(0===e){var k=32-8*c;g=function(a){return a<<k>>>k}}var q=-1!=b.indexOf("unsigned");Q(a,{name:b,fromWireType:g,toWireType:function(a,c){if("number"!==typeof c&&"boolean"!==typeof c)throw new TypeError('Cannot convert "'+Wa(c)+'" to '+this.name);if(c<e||c>f)throw new TypeError('Passing a number "'+
Wa(c)+'" from JS side to C/C++ side to an argument of type "'+b+'", which is outside the valid range ['+e+", "+f+"]!");return q?c>>>0:c|0},argPackAdvance:8,readValueFromPointer:Ya(b,h,0!==e),Z:null})},d:function(a,b,c){function e(a){a>>=2;var b=F;return new f(b.buffer,b[a+1],b[a])}var f=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][b];c=O(c);Q(a,{name:c,fromWireType:e,argPackAdvance:8,readValueFromPointer:e},{ia:!0})},k:function(a,b){b=O(b);var c="std::string"===
b;Q(a,{name:b,fromWireType:function(a){var b=F[a>>2];if(c){var e=C[a+4+b],h=0;0!=e&&(h=e,C[a+4+b]=0);var k=a+4;for(e=0;e<=b;++e){var q=a+4+e;if(0==C[q]){k=D(k);if(void 0===l)var l=k;else l+=String.fromCharCode(0),l+=k;k=q+1}}0!=h&&(C[a+4+b]=h)}else{l=Array(b);for(e=0;e<b;++e)l[e]=String.fromCharCode(C[a+4+e]);l=l.join("")}T(a);return l},toWireType:function(a,b){b instanceof ArrayBuffer&&(b=new Uint8Array(b));var e="string"===typeof b;e||b instanceof Uint8Array||b instanceof Uint8ClampedArray||b instanceof
Int8Array||P("Cannot pass non-string to std::string");var f=(c&&e?function(){return ra(b)}:function(){return b.length})(),k=ab(4+f+1);F[k>>2]=f;if(c&&e)B(b,C,k+4,f+1);else if(e)for(e=0;e<f;++e){var q=b.charCodeAt(e);255<q&&(T(k),P("String has UTF-16 code units that do not fit in 8 bits"));C[k+4+e]=q}else for(e=0;e<f;++e)C[k+4+e]=b[e];null!==a&&a.push(T,k);return k},argPackAdvance:8,readValueFromPointer:Va,Z:function(a){T(a)}})},E:function(a,b,c){c=O(c);if(2===b){var e=function(){return ta};var f=
1}else 4===b&&(e=function(){return F},f=2);Q(a,{name:c,fromWireType:function(a){for(var b=e(),c=F[a>>2],g=Array(c),l=a+4>>f,n=0;n<c;++n)g[n]=String.fromCharCode(b[l+n]);T(a);return g.join("")},toWireType:function(a,c){var g=e(),h=c.length,l=ab(4+h*b);F[l>>2]=h;for(var n=l+4>>f,J=0;J<h;++J)g[n+J]=c.charCodeAt(J);null!==a&&a.push(T,l);return l},argPackAdvance:8,readValueFromPointer:Va,Z:function(a){T(a)}})},D:function(a,b){b=O(b);Q(a,{ua:!0,name:b,argPackAdvance:0,fromWireType:function(){},toWireType:function(){}})},
b:function(){d.abort()},B:Za,A:function(a,b,c){C.set(C.subarray(b,b+c),a)},z:function(a){if(2147418112<a)return!1;for(var b=Math.max(Za(),16777216);b<a;)536870912>=b?b=sa(2*b):b=Math.min(sa((3*b+2147483648)/4),2147418112);if(!bb(b))return!1;ua();return!0},h:S,y:function(a){return Math.log(a)/Math.LN2},g:function(a){var b=U.X[a];U.X.splice(a,1);oa(b)},f:U,x:function(){z("trap!")},w:function(){return 0},u:function(){},t:function(){},s:function(a,b,c,e){return db(a,b,c,e)},r:function(){z("OOM")},a:350016},
E);d.asm=ib;var Ha=d.__GLOBAL__sub_I_bind_cpp=function(){return d.asm.J.apply(null,arguments)},hb=d.__ZSt18uncaught_exceptionv=function(){return d.asm.K.apply(null,arguments)};d.___embind_register_native_and_builtin_types=function(){return d.asm.L.apply(null,arguments)};d.___getTypeName=function(){return d.asm.M.apply(null,arguments)};d._convert_glsl_to_spirv=function(){return d.asm.N.apply(null,arguments)};d._destroy_output_buffer=function(){return d.asm.O.apply(null,arguments)};
var T=d._free=function(){return d.asm.P.apply(null,arguments)},ab=d._malloc=function(){return d.asm.Q.apply(null,arguments)},ma=d.stackAlloc=function(){return d.asm.T.apply(null,arguments)},oa=d.stackRestore=function(){return d.asm.U.apply(null,arguments)},na=d.stackSave=function(){return d.asm.V.apply(null,arguments)};d.dynCall_v=function(){return d.asm.R.apply(null,arguments)};d.dynCall_vi=function(){return d.asm.S.apply(null,arguments)};d.asm=ib;var Z;
d.then=function(a){if(Z)a(d);else{var b=d.onRuntimeInitialized;d.onRuntimeInitialized=function(){b&&b();a(d)}}return d};I=function jb(){Z||kb();Z||(I=jb)};
function kb(){function a(){if(!Z&&(Z=!0,!ka)){G(xa);G(ya);if(d.onRuntimeInitialized)d.onRuntimeInitialized();if(d.postRun)for("function"==typeof d.postRun&&(d.postRun=[d.postRun]);d.postRun.length;){var a=d.postRun.shift();za.unshift(a)}G(za)}}if(!(0<H)){if(d.preRun)for("function"==typeof d.preRun&&(d.preRun=[d.preRun]);d.preRun.length;)Aa();G(wa);0<H||(d.setStatus?(d.setStatus("Running..."),setTimeout(function(){setTimeout(function(){d.setStatus("")},1);a()},1)):a())}}d.run=kb;
function z(a){if(d.onAbort)d.onAbort(a);fa(a);u(a);ka=!0;throw"abort("+a+"). Build with -s ASSERTIONS=1 for more info.";}d.abort=z;if(d.preInit)for("function"==typeof d.preInit&&(d.preInit=[d.preInit]);0<d.preInit.length;)d.preInit.pop()();d.noExitRuntime=!0;kb();


  return Module
}
);
})();
// if (typeof exports === 'object' && typeof module === 'object')
//       module.exports = Module;
//     else if (typeof define === 'function' && define['amd'])
//       define([], function() { return Module; });
//     else if (typeof exports === 'object')
//       exports["Module"] = Module;
//     export default (() => {
//     const initialize = () => {
//         return new Promise(resolve => {
//             Module({
//                 locateFile() {
//                     const i = import.meta.url.lastIndexOf('/')
//                     return import.meta.url.substring(0, i) + '/glslang.wasm';
//                 },
//                 onRuntimeInitialized() {
//                     resolve({
//                         compileGLSLZeroCopy: this.compileGLSLZeroCopy,
//                         compileGLSL: this.compileGLSL,
//                     });
//                 },
//             });
//         });
//     };

//     let instance;
//     return () => {
//         if (!instance) {
//             instance = initialize();
//         }
//         return instance;
//     };
// })();
(function tryToExport(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory();
  else if (typeof define === 'function' && define.amd)
    define("glslang", [], factory);
  else if (typeof exports === 'object')
    exports["glslang"] = factory();
  else
    root["glslang"] = factory();
})(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this, () => {
  const initialize = (wasmPath) => {
    wasmPath = wasmPath || 'glslang.wasm'
    return new Promise(resolve => {
        Module({
            locateFile() {
                return wasmPath;
            },
            onRuntimeInitialized() {
                resolve({
                    compileGLSLZeroCopy: this.compileGLSLZeroCopy,
                    compileGLSL: this.compileGLSL,
                });
            },
        });
    });
  };

  let instance;
  return (wasmPath) => {
      if (!instance) {
          instance = initialize(wasmPath);
      }
      return instance;
  };
});