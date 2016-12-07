(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define("INSPECTOR", [], factory);
	else if(typeof exports === 'object')
		exports["INSPECTOR"] = factory();
	else
		root["INSPECTOR"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(1);
	window.Split = __webpack_require__(5);
	module.exports = __webpack_require__(6);

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(2);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(4)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../../node_modules/css-loader/index.js!./main.css", function() {
				var newContent = require("!!./../../node_modules/css-loader/index.js!./main.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(3)();
	// imports
	exports.push([module.id, "@import url(https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css);", ""]);
	exports.push([module.id, "@import url(http://fonts.googleapis.com/css?family=Inconsolata);", ""]);

	// module
	exports.push([module.id, ".insp-wrapper{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;display:-ms-flexbox;display:flex;font-size:.9em;font-family:Inconsolata,sans-serif}.insp-wrapper .gutter{background-color:#2c2c2c}.insp-wrapper .gutter.gutter-vertical{cursor:ns-resize}.insp-wrapper .gutter.gutter-horizontal{cursor:ew-resize}.insp-wrapper .insp-right-panel{width:750px;display:-ms-flexbox;display:flex;-ms-flex-direction:column;flex-direction:column;-ms-flex-negative:0;flex-shrink:0}.insp-wrapper .insp-right-panel .top-panel{width:100%;height:100%;position:relative;background-color:#242424;color:#ccc;font-size:1em}.insp-wrapper .insp-right-panel .top-panel .tab-panel-content{width:100%;height:100%}.insp-wrapper .insp-right-panel .top-panel .more-tabs-panel{position:absolute;z-index:2;top:30px;right:0;width:100px;display:none;-ms-flex-direction:column;flex-direction:column;-ms-flex-align:center;align-items:center;-ms-flex-pack:center;justify-content:center;border:1px solid #454545;background-color:#242424}.insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab{height:25px;width:100%;line-height:25px;text-align:center;background-color:#2c2c2c;cursor:pointer}.insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab:hover{background-color:#383838}.insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab:active{background-color:#454545}.insp-wrapper .tooltip{position:absolute;bottom:0;right:0;color:#ccc;transform:translateX(100%) translateY(100%);display:none;z-index:1;font-family:Inconsolata,sans-serif;width:120px;padding:5px 5px 5px 15px;line-height:25px;background-color:#242424;border:1px solid #454545}.insp-wrapper .treeTool{margin:3px 8px 3px 3px;cursor:pointer;position:relative}.insp-wrapper .treeTool.active,.insp-wrapper .treeTool:hover{color:#5db0d7}.insp-wrapper .tab-panel{height:100%}.insp-wrapper .tab-panel .scene-actions{overflow-y:auto}.insp-wrapper .tab-panel .scene-actions .actions-title{font-size:1.1em;padding-bottom:10px;border-bottom:1px solid #5db0d7;margin:10px 0}.insp-wrapper .tab-panel .scene-actions .action,.insp-wrapper .tab-panel .scene-actions .action-radio,.insp-wrapper .tab-panel .scene-actions .defaut-action{height:20px;line-height:20px;width:100%;cursor:pointer}.insp-wrapper .tab-panel .scene-actions .action-radio:hover,.insp-wrapper .tab-panel .scene-actions .action:hover,.insp-wrapper .tab-panel .scene-actions .defaut-action:hover{background-color:#2c2c2c}.insp-wrapper .tab-panel .scene-actions .action-radio:active,.insp-wrapper .tab-panel .scene-actions .action:active,.insp-wrapper .tab-panel .scene-actions .defaut-action:active{background-color:#383838}.insp-wrapper .tab-panel .scene-actions .action-radio:before{width:1em;height:1em;line-height:1em;display:inline-block;font-family:FontAwesome,sans-serif;content:\"\\F10C\";margin-right:10px}.insp-wrapper .tab-panel .scene-actions .action-radio.active:before{width:1em;height:1em;line-height:1em;display:inline-block;font-family:FontAwesome,sans-serif;content:\"\\F192\";color:#5db0d7;margin-right:10px}.insp-wrapper .tab-panel .scene-actions .action:before{width:1em;height:1em;line-height:1em;display:inline-block;font-family:FontAwesome,sans-serif;content:\"\\F096\";margin-right:10px}.insp-wrapper .tab-panel .scene-actions .action.active:before{width:1em;height:1em;line-height:1em;display:inline-block;font-family:FontAwesome,sans-serif;content:\"\\F14A\";color:#5db0d7;margin-right:10px}.insp-wrapper .tab-panel .shader-tree-panel{height:30px}.insp-wrapper .tab-panel .shader-tree-panel select{background-color:transparent;color:#ccc;height:30px;width:100%;max-width:300px;padding-left:15px;border:1px solid #2c2c2c;outline:1px solid #454545}.insp-wrapper .tab-panel .shader-tree-panel select option{padding:5px;color:gray}.insp-wrapper .tab-panel .shader-panel{min-height:100px;-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text;box-sizing:border-box;padding:0 15px}.insp-wrapper .tab-panel .shader-panel pre{margin:0;white-space:pre-wrap}.insp-wrapper .tab-panel .shader-panel pre code{background-color:#242424!important;padding:0;margin:0}.insp-wrapper .tab-panel .shader-panel .shader-panel-title{height:25px;border-bottom:1px solid #383838;text-transform:uppercase;line-height:25px;margin-bottom:10px}.insp-wrapper .property-type{color:#5db0d7}.insp-wrapper .insp-details .base-row .prop-name,.insp-wrapper .insp-details .header-row .prop-name,.insp-wrapper .insp-details .row .prop-name,.insp-wrapper .property-name{color:#f29766}.insp-wrapper .insp-tree{overflow-y:auto;overflow-x:hidden;height:calc(50% - 30px - 30px)}.insp-wrapper .insp-tree .line{cursor:pointer}.insp-wrapper .insp-tree .line:hover{background-color:#2c2c2c}.insp-wrapper .insp-tree .line.active{background-color:#454545}.insp-wrapper .insp-tree .line.active .line-content{background-color:#242424}.insp-wrapper .insp-tree .line.unfolded:before{content:\"\\F078\"}.insp-wrapper .insp-tree .line.folded:before,.insp-wrapper .insp-tree .line.unfolded:before{width:1em;height:1em;line-height:1em;display:inline-block;font-family:FontAwesome,sans-serif}.insp-wrapper .insp-tree .line.folded:before{content:\"\\F054\"}.insp-wrapper .insp-tree .line .line-content{padding-left:15px}.insp-wrapper .insp-tree .line .line-content:hover{background-color:#242424}.insp-wrapper .insp-tree .line .line-content .line:hover:first-child{background-color:#383838}.insp-wrapper .insp-details{background-color:#242424;overflow-y:auto;overflow-x:hidden;color:#ccc;font-family:Inconsolata,sans-serif}.insp-wrapper .insp-details .base-row,.insp-wrapper .insp-details .header-row,.insp-wrapper .insp-details .row{display:-ms-flexbox;display:flex;width:100%}.insp-wrapper .insp-details .base-row .base-property,.insp-wrapper .insp-details .base-row .prop-name,.insp-wrapper .insp-details .base-row .prop-value,.insp-wrapper .insp-details .header-row .base-property,.insp-wrapper .insp-details .header-row .prop-name,.insp-wrapper .insp-details .header-row .prop-value,.insp-wrapper .insp-details .row .base-property,.insp-wrapper .insp-details .row .prop-name,.insp-wrapper .insp-details .row .prop-value{word-wrap:break-word;padding:2px 0}.insp-wrapper .insp-details .base-row .prop-name,.insp-wrapper .insp-details .header-row .prop-name,.insp-wrapper .insp-details .row .prop-name{width:35%}.insp-wrapper .insp-details .base-row .prop-value,.insp-wrapper .insp-details .header-row .prop-value,.insp-wrapper .insp-details .row .prop-value{width:59%;padding-left:10px}.insp-wrapper .insp-details .base-row .prop-value.clickable,.insp-wrapper .insp-details .header-row .prop-value.clickable,.insp-wrapper .insp-details .row .prop-value.clickable{cursor:pointer}.insp-wrapper .insp-details .base-row .prop-value.clickable:hover,.insp-wrapper .insp-details .header-row .prop-value.clickable:hover,.insp-wrapper .insp-details .row .prop-value.clickable:hover{background-color:#383838}.insp-wrapper .insp-details .base-row .prop-value.clickable:after,.insp-wrapper .insp-details .header-row .prop-value.clickable:after,.insp-wrapper .insp-details .row .prop-value.clickable:after{font-family:FontAwesome,sans-serif;content:\"\\A0   \\A0   \\A0   \\F054\"}.insp-wrapper .insp-details .row:nth-child(even){background-color:#2c2c2c}.insp-wrapper .insp-details .row.unfolded .prop-value.clickable:after{font-family:FontAwesome,sans-serif;content:\"\\A0   \\A0   \\A0   \\F078\"}.insp-wrapper .insp-details .header-row{background-color:#2c2c2c;color:#ccc;width:100%}.insp-wrapper .insp-details .header-row>*{color:#ccc!important;padding:5px 0 5px 5px!important;cursor:pointer}.insp-wrapper .insp-details .header-row>:hover{background-color:#383838}.insp-wrapper .insp-details .header-row .header-col{display:-ms-flexbox;display:flex;-ms-flex-pack:justify;justify-content:space-between;-ms-flex-align:center;align-items:center}.insp-wrapper .insp-details .header-row .header-col .sort-direction{margin-right:5px}.insp-wrapper .insp-details .color-element,.insp-wrapper .insp-details .element-viewer,.insp-wrapper .insp-details .texture-element{position:relative;width:10px;height:10px;display:inline-block;margin-left:5px}.insp-wrapper .insp-details .texture-element{color:#f29766;margin-left:10px}.insp-wrapper .insp-details .texture-element .texture-viewer{color:#ccc;position:absolute;z-index:2;bottom:0;right:0;display:block;width:150px;height:150px;border:1px solid #454545;background-color:#242424;transform:translateX(100%) translateY(100%);display:none;-ms-flex-direction:column;flex-direction:column;-ms-flex-pack:start;justify-content:flex-start;-ms-flex-align:center;align-items:center}.insp-wrapper .insp-details .texture-element .texture-viewer .texture-viewer-img{margin:10px 0;max-width:110px;max-height:110px}.insp-wrapper .tabbar{height:30px;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;border-bottom:1px solid #383838;width:100%;overflow-x:auto;overflow-y:hidden}.insp-wrapper .tabbar .tab{height:30px;width:auto;padding:0 10px;color:#ccc;line-height:30px;text-align:center;cursor:pointer;margin:0 5px}.insp-wrapper .tabbar .tab:hover{border-bottom:1px solid #f29766;background-color:#2c2c2c}.insp-wrapper .tabbar .tab:active{background-color:#383838}.insp-wrapper .tabbar .tab.active{border-bottom:1px solid #f29766}.insp-wrapper .tabbar .more-tabs{width:30px;height:30px;display:-ms-flexbox;display:flex;-ms-flex-pack:center;justify-content:center;-ms-flex-align:center;align-items:center;cursor:pointer;position:relative;border-right:1px solid #383838}.insp-wrapper .tabbar .more-tabs:hover{background-color:#383838}.insp-wrapper .tabbar .more-tabs:active{color:#f29766;background-color:#454545}.insp-wrapper .tabbar .more-tabs.active{color:#f29766}.insp-wrapper .toolbar,.insp-wrapper .toolbar .tool{display:-ms-flexbox;display:flex}.insp-wrapper .toolbar .tool{width:30px;height:30px;-ms-flex-pack:center;justify-content:center;-ms-flex-align:center;align-items:center;cursor:pointer;position:relative;border-right:1px solid #383838}.insp-wrapper .toolbar .tool:hover{background-color:#383838}.insp-wrapper .toolbar .tool:active{color:#f29766;background-color:#454545}.insp-wrapper .toolbar .tool.active{color:#f29766}.insp-wrapper .searchbar{border:1px solid #2c2c2c;margin-bottom:5px;display:-ms-flexbox;display:flex;-ms-flex-align:center;align-items:center;color:#b3b3b3}.insp-wrapper .searchbar input{background-color:#242424;border:none;width:100%;outline:none;font-family:Inconsolata,sans-serif;color:#b3b3b3;padding:3px 0 3px 10px;margin:6px 0}", ""]);

	// exports


/***/ },
/* 3 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// The programming goals of Split.js are to deliver readable, understandable and
	// maintainable code, while at the same time manually optimizing for tiny minified file size,
	// browser compatibility without additional requirements, graceful fallback (IE8 is supported)
	// and very few assumptions about the user's page layout.
	//
	// Make sure all browsers handle this JS library correctly with ES5.
	// More information here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
	'use strict';

	// A wrapper function that does a couple things:
	//
	// 1. Doesn't pollute the global namespace. This is important for a library.
	// 2. Allows us to mount the library in different module systems, as well as
	//    directly in the browser.
	(function() {

	// Save the global `this` for use later. In this case, since the library only
	// runs in the browser, it will refer to `window`. Also, figure out if we're in IE8
	// or not. IE8 will still render correctly, but will be static instead of draggable.
	//
	// Save a couple long function names that are used frequently.
	// This optimization saves around 400 bytes.
	var global = this
	  , isIE8 = global.attachEvent && !global[addEventListener]
	  , document = global.document
	  , addEventListener = 'addEventListener'
	  , removeEventListener = 'removeEventListener'
	  , getBoundingClientRect = 'getBoundingClientRect'

	  // This library only needs two helper functions:
	  //
	  // The first determines which prefixes of CSS calc we need.
	  // We only need to do this once on startup, when this anonymous function is called.
	  // 
	  // Tests -webkit, -moz and -o prefixes. Modified from StackOverflow:
	  // http://stackoverflow.com/questions/16625140/js-feature-detection-to-detect-the-usage-of-webkit-calc-over-calc/16625167#16625167
	  , calc = (function () {
	        var el
	          , prefixes = ["", "-webkit-", "-moz-", "-o-"]

	        for (var i = 0; i < prefixes.length; i++) {
	            el = document.createElement('div')
	            el.style.cssText = "width:" + prefixes[i] + "calc(9px)"

	            if (el.style.length) {
	                return prefixes[i] + "calc"
	            }
	        }
	    })()

	  // The second helper function allows elements and string selectors to be used
	  // interchangeably. In either case an element is returned. This allows us to
	  // do `Split(elem1, elem2)` as well as `Split('#id1', '#id2')`.
	  , elementOrSelector = function (el) {
	        if (typeof el === 'string' || el instanceof String) {
	            return document.querySelector(el)
	        } else {
	            return el
	        }
	    }

	  // The main function to initialize a split. Split.js thinks about each pair
	  // of elements as an independant pair. Dragging the gutter between two elements
	  // only changes the dimensions of elements in that pair. This is key to understanding
	  // how the following functions operate, since each function is bound to a pair.
	  // 
	  // A pair object is shaped like this:
	  // 
	  // {
	  //     a: DOM element,
	  //     b: DOM element,
	  //     aMin: Number,
	  //     bMin: Number,
	  //     dragging: Boolean,
	  //     parent: DOM element,
	  //     isFirst: Boolean,
	  //     isLast: Boolean,
	  //     direction: 'horizontal' | 'vertical'
	  // }
	  //
	  // The basic sequence:
	  // 
	  // 1. Set defaults to something sane. `options` doesn't have to be passed at all.
	  // 2. Initialize a bunch of strings based on the direction we're splitting.
	  //    A lot of the behavior in the rest of the library is paramatized down to
	  //    rely on CSS strings and classes.
	  // 3. Define the dragging helper functions, and a few helpers to go with them.
	  // 4. Define a few more functions that "balance" the entire split instance.
	  //    Split.js tries it's best to cope with min sizes that don't add up.
	  // 5. Loop through the elements while pairing them off. Every pair gets an
	  //    `pair` object, a gutter, and special isFirst/isLast properties.
	  // 6. Actually size the pair elements, insert gutters and attach event listeners.
	  // 7. Balance all of the pairs to accomodate min sizes as best as possible.
	  , Split = function (ids, options) {
	    var dimension
	      , i
	      , clientDimension
	      , clientAxis
	      , position
	      , gutterClass
	      , paddingA
	      , paddingB
	      , pairs = []

	    // 1. Set defaults to something sane. `options` doesn't have to be passed at all,
	    // so create an options object if none exists. Pixel values 10, 100 and 30 are
	    // arbitrary but feel natural.
	    options = typeof options !== 'undefined' ?  options : {}

	    if (typeof options.gutterSize === 'undefined') options.gutterSize = 10
	    if (typeof options.minSize === 'undefined') options.minSize = 100
	    if (typeof options.snapOffset === 'undefined') options.snapOffset = 30
	    if (typeof options.direction === 'undefined') options.direction = 'horizontal'

	    // 2. Initialize a bunch of strings based on the direction we're splitting.
	    // A lot of the behavior in the rest of the library is paramatized down to
	    // rely on CSS strings and classes.
	    if (options.direction == 'horizontal') {
	        dimension = 'width'
	        clientDimension = 'clientWidth'
	        clientAxis = 'clientX'
	        position = 'left'
	        gutterClass = 'gutter gutter-horizontal'
	        paddingA = 'paddingLeft'
	        paddingB = 'paddingRight'
	        if (!options.cursor) options.cursor = 'ew-resize'
	    } else if (options.direction == 'vertical') {
	        dimension = 'height'
	        clientDimension = 'clientHeight'
	        clientAxis = 'clientY'
	        position = 'top'
	        gutterClass = 'gutter gutter-vertical'
	        paddingA = 'paddingTop'
	        paddingB = 'paddingBottom'
	        if (!options.cursor) options.cursor = 'ns-resize'
	    }

	    // 3. Define the dragging helper functions, and a few helpers to go with them.
	    // Each helper is bound to a pair object that contains it's metadata. This
	    // also makes it easy to store references to listeners that that will be
	    // added and removed.
	    // 
	    // Even though there are no other functions contained in them, aliasing
	    // this to self saves 50 bytes or so since it's used so frequently.
	    //
	    // The pair object saves metadata like dragging state, position and
	    // event listener references.
	    //
	    // startDragging calls `calculateSizes` to store the inital size in the pair object.
	    // It also adds event listeners for mouse/touch events,
	    // and prevents selection while dragging so avoid the selecting text.
	    var startDragging = function (e) {
	            // Alias frequently used variables to save space. 200 bytes.
	            var self = this
	              , a = self.a
	              , b = self.b

	            // Call the onDragStart callback.
	            if (!self.dragging && options.onDragStart) {
	                options.onDragStart()
	            }

	            // Don't actually drag the element. We emulate that in the drag function.
	            e.preventDefault()

	            // Set the dragging property of the pair object.
	            self.dragging = true

	            // Create two event listeners bound to the same pair object and store
	            // them in the pair object.
	            self.move = drag.bind(self)
	            self.stop = stopDragging.bind(self)

	            // All the binding. `window` gets the stop events in case we drag out of the elements.
	            global[addEventListener]('mouseup', self.stop)
	            global[addEventListener]('touchend', self.stop)
	            global[addEventListener]('touchcancel', self.stop)

	            self.parent[addEventListener]('mousemove', self.move)
	            self.parent[addEventListener]('touchmove', self.move)

	            // Disable selection. Disable!
	            a[addEventListener]('selectstart', noop)
	            a[addEventListener]('dragstart', noop)
	            b[addEventListener]('selectstart', noop)
	            b[addEventListener]('dragstart', noop)

	            a.style.userSelect = 'none'
	            a.style.webkitUserSelect = 'none'
	            a.style.MozUserSelect = 'none'
	            a.style.pointerEvents = 'none'

	            b.style.userSelect = 'none'
	            b.style.webkitUserSelect = 'none'
	            b.style.MozUserSelect = 'none'
	            b.style.pointerEvents = 'none'

	            // Set the cursor, both on the gutter and the parent element.
	            // Doing only a, b and gutter causes flickering.
	            self.gutter.style.cursor = options.cursor
	            self.parent.style.cursor = options.cursor

	            // Cache the initial sizes of the pair.
	            calculateSizes.call(self)
	        }

	      // stopDragging is very similar to startDragging in reverse.
	      , stopDragging = function () {
	            var self = this
	              , a = self.a
	              , b = self.b

	            if (self.dragging && options.onDragEnd) {
	                options.onDragEnd()
	            }

	            self.dragging = false

	            // Remove the stored event listeners. This is why we store them.
	            global[removeEventListener]('mouseup', self.stop)
	            global[removeEventListener]('touchend', self.stop)
	            global[removeEventListener]('touchcancel', self.stop)

	            self.parent[removeEventListener]('mousemove', self.move)
	            self.parent[removeEventListener]('touchmove', self.move)

	            // Delete them once they are removed. I think this makes a difference
	            // in memory usage with a lot of splits on one page. But I don't know for sure.
	            delete self.stop
	            delete self.move

	            a[removeEventListener]('selectstart', noop)
	            a[removeEventListener]('dragstart', noop)
	            b[removeEventListener]('selectstart', noop)
	            b[removeEventListener]('dragstart', noop)

	            a.style.userSelect = ''
	            a.style.webkitUserSelect = ''
	            a.style.MozUserSelect = ''
	            a.style.pointerEvents = ''

	            b.style.userSelect = ''
	            b.style.webkitUserSelect = ''
	            b.style.MozUserSelect = ''
	            b.style.pointerEvents = ''

	            self.gutter.style.cursor = ''
	            self.parent.style.cursor = ''
	        }

	      // drag, where all the magic happens. The logic is really quite simple:
	      // 
	      // 1. Ignore if the pair is not dragging.
	      // 2. Get the offset of the event.
	      // 3. Snap offset to min if within snappable range (within min + snapOffset).
	      // 4. Actually adjust each element in the pair to offset.
	      // 
	      // ---------------------------------------------------------------------
	      // |    | <- this.aMin               ||              this.bMin -> |    |
	      // |    |  | <- this.snapOffset      ||     this.snapOffset -> |  |    |
	      // |    |  |                         ||                        |  |    |
	      // |    |  |                         ||                        |  |    |
	      // ---------------------------------------------------------------------
	      // | <- this.start                                        this.size -> |
	      , drag = function (e) {
	            var offset

	            if (!this.dragging) return

	            // Get the offset of the event from the first side of the
	            // pair `this.start`. Supports touch events, but not multitouch, so only the first
	            // finger `touches[0]` is counted.
	            if ('touches' in e) {
	                offset = e.touches[0][clientAxis] - this.start
	            } else {
	                offset = e[clientAxis] - this.start
	            }

	            // If within snapOffset of min or max, set offset to min or max.
	            // snapOffset buffers aMin and bMin, so logic is opposite for both.
	            // Include the appropriate gutter sizes to prevent overflows.
	            if (offset <= this.aMin + options.snapOffset + this.aGutterSize) {
	                offset = this.aMin + this.aGutterSize
	            } else if (offset >= this.size - (this.bMin + options.snapOffset + this.bGutterSize)) {
	                offset = this.size - (this.bMin + this.bGutterSize)
	            }

	            // Actually adjust the size.
	            adjust.call(this, offset)

	            // Call the drag callback continously. Don't do anything too intensive
	            // in this callback.
	            if (options.onDrag) {
	                options.onDrag()
	            }
	        }

	      // Cache some important sizes when drag starts, so we don't have to do that
	      // continously:
	      // 
	      // `size`: The total size of the pair. First element + second element + first gutter + second gutter.
	      // `percentage`: The percentage between 0-100 that the pair occupies in the parent.
	      // `start`: The leading side of the first element.
	      //
	      // ------------------------------------------------ - - - - - - - - - - -
	      // |      aGutterSize -> |||                      |                     |
	      // |                     |||                      |                     |
	      // |                     |||                      |                     |
	      // |                     ||| <- bGutterSize       |                     |
	      // ------------------------------------------------ - - - - - - - - - - -
	      // | <- start                             size -> |       parentSize -> |
	      , calculateSizes = function () {
	            // Figure out the parent size minus padding.
	            var computedStyle = global.getComputedStyle(this.parent)
	              , parentSize = this.parent[clientDimension] - parseFloat(computedStyle[paddingA]) - parseFloat(computedStyle[paddingB])

	            this.size = this.a[getBoundingClientRect]()[dimension] + this.b[getBoundingClientRect]()[dimension] + this.aGutterSize + this.bGutterSize
	            this.percentage = Math.min(this.size / parentSize * 100, 100)
	            this.start = this.a[getBoundingClientRect]()[position]
	        }

	      // Actually adjust the size of elements `a` and `b` to `offset` while dragging.
	      // calc is used to allow calc(percentage + gutterpx) on the whole split instance,
	      // which allows the viewport to be resized without additional logic.
	      // Element a's size is the same as offset. b's size is total size - a size.
	      // Both sizes are calculated from the initial parent percentage, then the gutter size is subtracted.
	      , adjust = function (offset) {
	            this.a.style[dimension] = calc + '(' + (offset / this.size * this.percentage) + '% - ' + this.aGutterSize + 'px)'
	            this.b.style[dimension] = calc + '(' + (this.percentage - (offset / this.size * this.percentage)) + '% - ' + this.bGutterSize + 'px)'
	        }

	      // 4. Define a few more functions that "balance" the entire split instance.
	      // Split.js tries it's best to cope with min sizes that don't add up.
	      // At some point this should go away since it breaks out of the calc(% - px) model.
	      // Maybe it's a user error if you pass uncomputable minSizes.
	      , fitMin = function () {
	            var self = this
	              , a = self.a
	              , b = self.b

	            if (a[getBoundingClientRect]()[dimension] < self.aMin) {
	                a.style[dimension] = (self.aMin - self.aGutterSize) + 'px'
	                b.style[dimension] = (self.size - self.aMin - self.aGutterSize) + 'px'
	            } else if (b[getBoundingClientRect]()[dimension] < self.bMin) {
	                a.style[dimension] = (self.size - self.bMin - self.bGutterSize) + 'px'
	                b.style[dimension] = (self.bMin - self.bGutterSize) + 'px'
	            }
	        }
	      , fitMinReverse = function () {
	            var self = this
	              , a = self.a
	              , b = self.b

	            if (b[getBoundingClientRect]()[dimension] < self.bMin) {
	                a.style[dimension] = (self.size - self.bMin - self.bGutterSize) + 'px'
	                b.style[dimension] = (self.bMin - self.bGutterSize) + 'px'
	            } else if (a[getBoundingClientRect]()[dimension] < self.aMin) {
	                a.style[dimension] = (self.aMin - self.aGutterSize) + 'px'
	                b.style[dimension] = (self.size - self.aMin - self.aGutterSize) + 'px'
	            }
	        }
	      , balancePairs = function (pairs) {
	            for (var i = 0; i < pairs.length; i++) {
	                calculateSizes.call(pairs[i])
	                fitMin.call(pairs[i])
	            }

	            for (i = pairs.length - 1; i >= 0; i--) {
	                calculateSizes.call(pairs[i])
	                fitMinReverse.call(pairs[i])
	            }
	        }
	      , setElementSize = function (el, size, gutterSize) {
	            // Split.js allows setting sizes via numbers (ideally), or if you must,
	            // by string, like '300px'. This is less than ideal, because it breaks
	            // the fluid layout that `calc(% - px)` provides. You're on your own if you do that,
	            // make sure you calculate the gutter size by hand.
	            if (typeof size !== 'string' && !(size instanceof String)) {
	                if (!isIE8) {
	                    size = calc + '(' + size + '% - ' + gutterSize + 'px)'
	                } else {
	                    size = options.sizes[i] + '%'
	                }
	            }

	            el.style[dimension] = size
	        }

	      // No-op function to prevent default. Used to prevent selection.
	      , noop = function () { return false }

	      // All DOM elements in the split should have a common parent. We can grab
	      // the first elements parent and hope users read the docs because the
	      // behavior will be whacky otherwise.
	      , parent = elementOrSelector(ids[0]).parentNode

	    // Set default options.sizes to equal percentages of the parent element.
	    if (!options.sizes) {
	        var percent = 100 / ids.length

	        options.sizes = []

	        for (i = 0; i < ids.length; i++) {
	            options.sizes.push(percent)
	        }
	    }

	    // Standardize minSize to an array if it isn't already. This allows minSize
	    // to be passed as a number.
	    if (!Array.isArray(options.minSize)) {
	        var minSizes = []

	        for (i = 0; i < ids.length; i++) {
	            minSizes.push(options.minSize)
	        }

	        options.minSize = minSizes
	    }

	    // 5. Loop through the elements while pairing them off. Every pair gets a
	    // `pair` object, a gutter, and isFirst/isLast properties.
	    //
	    // Basic logic:
	    //
	    // - Starting with the second element `i > 0`, create `pair` objects with
	    //   `a = ids[i - 1]` and `b = ids[i]`
	    // - Set gutter sizes based on the _pair_ being first/last. The first and last
	    //   pair have gutterSize / 2, since they only have one half gutter, and not two.
	    // - Create gutter elements and add event listeners.
	    // - Set the size of the elements, minus the gutter sizes.
	    //
	    // -----------------------------------------------------------------------
	    // |     i=0     |         i=1         |        i=2       |      i=3     |
	    // |             |       isFirst       |                  |     isLast   |
	    // |           pair 0                pair 1             pair 2           |
	    // |             |                     |                  |              |
	    // -----------------------------------------------------------------------
	    for (i = 0; i < ids.length; i++) {
	        var el = elementOrSelector(ids[i])
	          , isFirstPair = (i == 1)
	          , isLastPair = (i == ids.length - 1)
	          , size = options.sizes[i]
	          , gutterSize = options.gutterSize
	          , pair

	        if (i > 0) {
	            // Create the pair object with it's metadata.
	            pair = {
	                a: elementOrSelector(ids[i - 1]),
	                b: el,
	                aMin: options.minSize[i - 1],
	                bMin: options.minSize[i],
	                dragging: false,
	                parent: parent,
	                isFirst: isFirstPair,
	                isLast: isLastPair,
	                direction: options.direction
	            }

	            // For first and last pairs, first and last gutter width is half.
	            pair.aGutterSize = options.gutterSize
	            pair.bGutterSize = options.gutterSize

	            if (isFirstPair) {
	                pair.aGutterSize = options.gutterSize / 2
	            }

	            if (isLastPair) {
	                pair.bGutterSize = options.gutterSize / 2
	            }
	        }

	        // Determine the size of the current element. IE8 is supported by
	        // staticly assigning sizes without draggable gutters. Assigns a string
	        // to `size`.
	        // 
	        // IE9 and above
	        if (!isIE8) {
	            // Create gutter elements for each pair.
	            if (i > 0) {
	                var gutter = document.createElement('div')

	                gutter.className = gutterClass
	                gutter.style[dimension] = options.gutterSize + 'px'

	                gutter[addEventListener]('mousedown', startDragging.bind(pair))
	                gutter[addEventListener]('touchstart', startDragging.bind(pair))

	                parent.insertBefore(gutter, el)

	                pair.gutter = gutter
	            }

	            // Half-size gutters for first and last elements.
	            if (i === 0 || i == ids.length - 1) {
	                gutterSize = options.gutterSize / 2
	            }
	        }

	        // Set the element size to our determined size.
	        setElementSize(el, size, gutterSize)

	        // After the first iteration, and we have a pair object, append it to the
	        // list of pairs.
	        if (i > 0) {
	            pairs.push(pair)
	        }
	    }

	    // Balance the pairs to try to accomodate min sizes.
	    //balancePairs(pairs)

	    return {
	        setSizes: function (sizes) {
	            for (var i = 0; i < sizes.length; i++) {
	                if (i > 0) {
	                    var pair = pairs[i - 1]

	                    setElementSize(pair.a, sizes[i - 1], pair.aGutterSize)
	                    setElementSize(pair.b, sizes[i], pair.bGutterSize)
	                }
	            }
	        },
	        collapse: function (i) {
	            var pair

	            if (i === pairs.length) {
	                pair = pairs[i - 1]

	                calculateSizes.call(pair)
	                adjust.call(pair, pair.size - pair.bGutterSize)
	            } else {
	                pair = pairs[i]

	                calculateSizes.call(pair)
	                adjust.call(pair, pair.aGutterSize)
	            }
	        },
	        destroy: function () {
	            for (var i = 0; i < pairs.length; i++) {
	                pairs[i].parent.removeChild(pairs[i].gutter)
	                pairs[i].a.style[dimension] = ''
	                pairs[i].b.style[dimension] = ''
	            }
	        }
	    }
	}

	// Play nicely with module systems, and the browser too if you include it raw.
	if (true) {
	    if (typeof module !== 'undefined' && module.exports) {
	        exports = module.exports = Split
	    }
	    exports.Split = Split
	} else {
	    global.Split = Split
	}

	// Call our wrapper function with the current global. In this case, `window`.
	}).call(window);


/***/ },
/* 6 */
/***/ function(module, exports) {

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b() {
	            this._div = a.Helpers.CreateDiv();
	        }
	        b.prototype.toHtml = function() {
	            return this._div;
	        };
	        b.prototype._build = function() {};
	        b.prototype.dispose = function() {};
	        return b;
	    }();
	    a.BasicElement = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c) {
	            b.call(this);
	            this._pause = false;
	            this._div.className = "fa fa-search texture-element";
	            this._textureDiv = a.Helpers.CreateDiv("texture-viewer", this._div);
	            this._canvas = a.Helpers.CreateElement("canvas", "texture-viewer-img", this._textureDiv);
	            if (c) {
	                this._textureUrl = c.name;
	            }
	            this._div.addEventListener("mouseover", this._showViewer.bind(this, "flex"));
	            this._div.addEventListener("mouseout", this._showViewer.bind(this, "none"));
	        }
	        c.prototype.update = function(a) {
	            if (a && a.url === this._textureUrl) {} else {
	                if (a) {
	                    this._textureUrl = a.name;
	                }
	                if (this._engine) {
	                    this._cube.material.dispose(true, true);
	                    this._cube.dispose();
	                } else {
	                    this._initEngine();
	                }
	                this._populateScene();
	            }
	        };
	        c.prototype._populateScene = function() {
	            var a = this;
	            var b = new BABYLON.CubeTexture(this._textureUrl, this._scene);
	            b.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	            this._cube = BABYLON.Mesh.CreateBox("hdrSkyBox", 10, this._scene);
	            var c = new BABYLON.StandardMaterial("skyBox", this._scene);
	            c.backFaceCulling = false;
	            c.reflectionTexture = b;
	            c.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	            c.disableLighting = true;
	            this._cube.material = c;
	            this._cube.registerBeforeRender(function() {
	                a._cube.rotation.y += .01;
	            });
	        };
	        c.prototype._initEngine = function() {
	            var a = this;
	            this._engine = new BABYLON.Engine(this._canvas);
	            this._scene = new BABYLON.Scene(this._engine);
	            this._scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
	            var b = new BABYLON.FreeCamera("cam", new BABYLON.Vector3(0, 0, -20), this._scene);
	            var c = new BABYLON.HemisphericLight("", new BABYLON.Vector3(0, 1, 0), this._scene);
	            this._engine.runRenderLoop(function() {
	                if (!a._pause) {
	                    a._scene.render();
	                }
	            });
	            this._canvas.setAttribute("width", "110");
	            this._canvas.setAttribute("height", "110");
	        };
	        c.prototype._showViewer = function(a) {
	            if (a != "none") {
	                if (!this._engine) {
	                    this._initEngine();
	                    this._populateScene();
	                }
	                this._pause = false;
	            } else {
	                this._pause = true;
	            }
	            this._textureDiv.style.display = a;
	        };
	        c.prototype.dispose = function() {
	            if (this._engine) {
	                this._engine.dispose();
	                this._engine = null;
	            }
	        };
	        return c;
	    }(a.BasicElement);
	    a.CubeTextureElement = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function a(a) {
	            this._obj = a;
	        }
	        Object.defineProperty(a.prototype, "actualObject", {
	            get: function() {
	                return this._obj;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        a.prototype.correspondsTo = function(a) {
	            return a === this._obj;
	        };
	        Object.defineProperty(a.prototype, "name", {
	            get: function() {
	                return a._name;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        a.prototype.highlight = function(a) {};
	        a._name = BABYLON.Geometry.RandomId();
	        return a;
	    }();
	    a.Adapter = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b, c) {
	            a.call(this);
	            this._isActive = false;
	            this._tabbar = b;
	            this.name = c;
	            this._build();
	        }
	        b.prototype.isActive = function() {
	            return this._isActive;
	        };
	        b.prototype._build = function() {
	            var a = this;
	            this._div.className = "tab";
	            this._div.textContent = this.name;
	            this._div.addEventListener("click", function(b) {
	                a._tabbar.switchTab(a);
	            });
	        };
	        b.prototype.active = function(a) {
	            if (a) {
	                this._div.classList.add("active");
	            } else {
	                this._div.classList.remove("active");
	            }
	            this._isActive = a;
	        };
	        b.prototype.update = function() {};
	        b.prototype.getPanel = function() {
	            return this._panel;
	        };
	        b.prototype.filter = function(a) {};
	        b.prototype.getPixelWidth = function() {
	            var a = window.getComputedStyle(this._div);
	            var b = parseFloat(a.marginLeft.substr(0, a.marginLeft.length - 2)) || 0;
	            var c = parseFloat(a.marginRight.substr(0, a.marginRight.length - 2)) || 0;
	            return (this._div.clientWidth || 0) + b + c;
	        };
	        return b;
	    }(a.BasicElement);
	    a.Tab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c, d, e) {
	            b.call(this, c, d);
	            this._treeItems = [];
	            this._inspector = e;
	            this._panel = a.Helpers.CreateDiv("tab-panel");
	            this._searchBar = new a.SearchBar(this);
	            this._panel.appendChild(this._searchBar.toHtml());
	            this._treePanel = a.Helpers.CreateDiv("insp-tree", this._panel);
	            this._detailsPanel = new a.DetailPanel();
	            this._panel.appendChild(this._detailsPanel.toHtml());
	            Split([ this._treePanel, this._detailsPanel.toHtml() ], {
	                direction: "vertical"
	            });
	            this.update();
	        }
	        c.prototype.dispose = function() {
	            this._detailsPanel.dispose();
	        };
	        c.prototype.update = function(b) {
	            var c;
	            if (b) {
	                c = b;
	            } else {
	                this._treeItems = this._getTree();
	                c = this._treeItems;
	            }
	            a.Helpers.CleanDiv(this._treePanel);
	            this._detailsPanel.clean();
	            c.sort(function(a, b) {
	                return a.compareTo(b);
	            });
	            for (var d = 0, e = c; d < e.length; d++) {
	                var f = e[d];
	                this._treePanel.appendChild(f.toHtml());
	            }
	        };
	        c.prototype.displayDetails = function(a) {
	            this.activateNode(a);
	            this._detailsPanel.details = a.getDetails();
	        };
	        c.prototype.select = function(a) {
	            this.highlightNode();
	            this.activateNode(a);
	            this.displayDetails(a);
	        };
	        c.prototype.highlightNode = function(a) {
	            if (this._treeItems) {
	                for (var b = 0, c = this._treeItems; b < c.length; b++) {
	                    var d = c[b];
	                    d.highlight(false);
	                }
	            }
	            if (a) {
	                a.highlight(true);
	            }
	        };
	        c.prototype.activateNode = function(a) {
	            if (this._treeItems) {
	                for (var b = 0, c = this._treeItems; b < c.length; b++) {
	                    var d = c[b];
	                    d.active(false);
	                }
	            }
	            a.active(true);
	        };
	        c.prototype.getItemFor = function(a) {
	            var b = a;
	            for (var c = 0, d = this._treeItems; c < d.length; c++) {
	                var e = d[c];
	                if (e.correspondsTo(b)) {
	                    return e;
	                }
	            }
	            return null;
	        };
	        c.prototype.filter = function(a) {
	            var b = [];
	            for (var c = 0, d = this._treeItems; c < d.length; c++) {
	                var e = d[c];
	                if (e.id.toLowerCase().indexOf(a.toLowerCase()) != -1) {
	                    b.push(e);
	                }
	            }
	            this.update(b);
	        };
	        return c;
	    }(a.Tab);
	    a.PropertyTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b(b, c, d, e) {
	            var f = this;
	            this._inspector = d;
	            this._elem = a.Inspector.DOCUMENT.createElement("i");
	            this._elem.className = "tool fa " + b;
	            c.appendChild(this._elem);
	            this._elem.addEventListener("click", function(a) {
	                f.action();
	            });
	            new a.Tooltip(this._elem, e);
	        }
	        b.prototype.toHtml = function() {
	            return this._elem;
	        };
	        b.prototype.getPixelWidth = function() {
	            var a = window.getComputedStyle(this._elem);
	            var b = parseFloat(a.marginLeft.substr(0, a.marginLeft.length - 2)) || 0;
	            var c = parseFloat(a.marginRight.substr(0, a.marginRight.length - 2)) || 0;
	            return (this._elem.clientWidth || 0) + b + c;
	        };
	        b.prototype._updateIcon = function(a) {
	            this._elem.className = "tool fa " + a;
	        };
	        return b;
	    }();
	    a.AbstractTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b() {
	            this._on = false;
	            this._elem = a.Inspector.DOCUMENT.createElement("i");
	            this._elem.className = "treeTool fa";
	            this._addEvents();
	        }
	        b.prototype.toHtml = function() {
	            return this._elem;
	        };
	        b.prototype._addEvents = function() {
	            var a = this;
	            this._elem.addEventListener("click", function(b) {
	                a.action();
	                b.stopPropagation();
	            });
	        };
	        b.prototype.action = function() {
	            this._on = !this._on;
	        };
	        return b;
	    }();
	    a.AbstractTreeTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a) {
	            b.call(this, a);
	        }
	        c.prototype.id = function() {
	            var a = "";
	            if (this._obj.id) {
	                a = this._obj.id;
	            }
	            return a;
	        };
	        c.prototype.type = function() {
	            return a.Helpers.GET_TYPE(this._obj);
	        };
	        c.prototype.getProperties = function() {
	            var b = this;
	            var c = [];
	            if (this._obj.propDic) {
	                var d = this._obj.propDic;
	                d.forEach(function(d, e) {
	                    var f = new a.Property(d, b.actualObject);
	                    c.push(new a.PropertyLine(f));
	                });
	            }
	            var e = [ "actualZOffset", "isSizeAuto", "layoutArea", "layoutAreaPos", "contentArea", "marginOffset", "paddingOffset", "isPickable", "isContainer", "boundingInfo", "levelBoundingInfo", "isSizedByContent", "isPositionAuto", "actualScale", "layoutBoundingInfo" ];
	            for (var f = 0, g = e; f < g.length; f++) {
	                var h = g[f];
	                var i = new a.Property(h, this.actualObject);
	                c.push(new a.PropertyLine(i));
	            }
	            return c;
	        };
	        c.prototype.getTools = function() {
	            var b = [];
	            b.push(new a.Checkbox(this));
	            b.push(new a.DebugArea(this));
	            return b;
	        };
	        c.prototype.setVisible = function(a) {
	            this._obj.levelVisible = a;
	        };
	        c.prototype.isVisible = function() {
	            return this._obj.levelVisible;
	        };
	        c.prototype.debug = function(a) {
	            this._obj["displayDebugAreas"] = a;
	        };
	        c.prototype.highlight = function(a) {};
	        return c;
	    }(a.Adapter);
	    a.Canvas2DAdapter = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a) {
	            b.call(this, a);
	        }
	        c.prototype.id = function() {
	            var a = "";
	            if (this._obj.name) {
	                a = this._obj.name;
	            }
	            return a;
	        };
	        c.prototype.type = function() {
	            return a.Helpers.GET_TYPE(this._obj);
	        };
	        c.prototype.getProperties = function() {
	            var b = [];
	            for (var d = 0, e = c._PROPERTIES; d < e.length; d++) {
	                var f = e[d];
	                var g = new a.Property(f, this._obj);
	                b.push(new a.PropertyLine(g));
	            }
	            return b;
	        };
	        c.prototype.getTools = function() {
	            var b = [];
	            b.push(new a.Checkbox(this));
	            return b;
	        };
	        c.prototype.setVisible = function(a) {
	            this._obj.setEnabled(a);
	        };
	        c.prototype.isVisible = function() {
	            return this._obj.isEnabled();
	        };
	        c.prototype.highlight = function(a) {
	            this.actualObject.renderOutline = a;
	            this.actualObject.outlineWidth = .25;
	            this.actualObject.outlineColor = BABYLON.Color3.Yellow();
	        };
	        c._PROPERTIES = [ "position", "diffuse", "intensity", "radius", "range", "specular" ];
	        return c;
	    }(a.Adapter);
	    a.LightAdapter = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a) {
	            b.call(this, a);
	        }
	        c.prototype.id = function() {
	            var a = "";
	            if (this._obj.name) {
	                a = this._obj.name;
	            }
	            return a;
	        };
	        c.prototype.type = function() {
	            return a.Helpers.GET_TYPE(this._obj);
	        };
	        c.prototype.getProperties = function() {
	            var b = [];
	            var c = a.PROPERTIES[this.type()].properties;
	            for (var d = 0, e = c; d < e.length; d++) {
	                var f = e[d];
	                var g = new a.Property(f, this._obj);
	                b.push(new a.PropertyLine(g));
	            }
	            return b;
	        };
	        c.prototype.getTools = function() {
	            return [];
	        };
	        c.prototype.highlight = function(a) {
	            var b = this.actualObject;
	            var c = b.getBindedMeshes();
	            for (var d = 0, e = c; d < e.length; d++) {
	                var f = e[d];
	                f.renderOutline = a;
	                f.outlineWidth = .25;
	                f.outlineColor = BABYLON.Color3.Yellow();
	            }
	        };
	        return c;
	    }(a.Adapter);
	    a.MaterialAdapter = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a) {
	            b.call(this, a);
	            this._axis = [];
	        }
	        c.prototype.id = function() {
	            var a = "";
	            if (this._obj.name) {
	                a = this._obj.name;
	            }
	            return a;
	        };
	        c.prototype.type = function() {
	            return a.Helpers.GET_TYPE(this._obj);
	        };
	        c.prototype.getProperties = function() {
	            var b = [];
	            for (var c = 0, d = a.PROPERTIES["Mesh"].properties; c < d.length; c++) {
	                var e = d[c];
	                var f = new a.Property(e, this._obj);
	                b.push(new a.PropertyLine(f));
	            }
	            return b;
	        };
	        c.prototype.getTools = function() {
	            var b = [];
	            b.push(new a.Checkbox(this));
	            b.push(new a.DebugArea(this));
	            b.push(new a.BoundingBox(this));
	            b.push(new a.Info(this));
	            return b;
	        };
	        c.prototype.setVisible = function(a) {
	            this._obj.setEnabled(a);
	            this._obj.isVisible = a;
	        };
	        c.prototype.isVisible = function() {
	            return this._obj.isEnabled() && this._obj.isVisible;
	        };
	        c.prototype.isBoxVisible = function() {
	            return this._obj.showBoundingBox;
	        };
	        c.prototype.setBoxVisible = function(a) {
	            return this._obj.showBoundingBox = a;
	        };
	        c.prototype.debug = function(a) {
	            if (this._axis.length == 0) {
	                this._drawAxis();
	            }
	            for (var b = 0, c = this._axis; b < c.length; b++) {
	                var d = c[b];
	                d.setEnabled(a);
	            }
	        };
	        c.prototype.getInfo = function() {
	            return this._obj.getTotalVertices() + " vertices";
	        };
	        c.prototype.highlight = function(a) {
	            this.actualObject.renderOutline = a;
	            this.actualObject.outlineWidth = .25;
	            this.actualObject.outlineColor = BABYLON.Color3.Yellow();
	        };
	        c.prototype._drawAxis = function() {
	            var a = this;
	            this._obj.computeWorldMatrix();
	            var b = this._obj.getWorldMatrix();
	            var c = new BABYLON.Vector3(8, 0, 0);
	            var d = new BABYLON.Vector3(0, 8, 0);
	            var e = new BABYLON.Vector3(0, 0, 8);
	            var f = function(b, c, d) {
	                var e = BABYLON.Mesh.CreateLines("###axis###", [ c, d ], a._obj.getScene());
	                e.color = b;
	                e.renderingGroupId = 1;
	                return e;
	            };
	            var g = f(BABYLON.Color3.Red(), this._obj.getAbsolutePosition(), BABYLON.Vector3.TransformCoordinates(c, b));
	            g.position.subtractInPlace(this._obj.position);
	            g.parent = this._obj;
	            this._axis.push(g);
	            var h = f(BABYLON.Color3.Green(), this._obj.getAbsolutePosition(), BABYLON.Vector3.TransformCoordinates(d, b));
	            h.parent = this._obj;
	            h.position.subtractInPlace(this._obj.position);
	            this._axis.push(h);
	            var i = f(BABYLON.Color3.Blue(), this._obj.getAbsolutePosition(), BABYLON.Vector3.TransformCoordinates(e, b));
	            i.parent = this._obj;
	            i.position.subtractInPlace(this._obj.position);
	            this._axis.push(i);
	        };
	        return c;
	    }(a.Adapter);
	    a.MeshAdapter = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a) {
	            b.call(this);
	            this._detailRows = [];
	            this._sortDirection = {};
	            this._build();
	            if (a) {
	                this._detailRows = a;
	                this.update();
	            }
	        }
	        Object.defineProperty(c.prototype, "details", {
	            set: function(a) {
	                this.clean();
	                this._detailRows = a;
	                this.update();
	            },
	            enumerable: true,
	            configurable: true
	        });
	        c.prototype._build = function() {
	            var a = this;
	            this._div.className = "insp-details";
	            this._div.id = "insp-details";
	            this._createHeaderRow();
	            this._div.appendChild(this._headerRow);
	            window.addEventListener("resize", function(b) {
	                a._headerRow.style.maxWidth = a._headerRow.parentElement.clientWidth + "px";
	            });
	        };
	        c.prototype.update = function() {
	            this._sortDetails("name", 1);
	            this._addDetails();
	        };
	        c.prototype._addDetails = function() {
	            var b = a.Helpers.CreateDiv("details", this._div);
	            for (var c = 0, d = this._detailRows; c < d.length; c++) {
	                var e = d[c];
	                b.appendChild(e.toHtml());
	            }
	        };
	        c.prototype._sortDetails = function(b, c) {
	            var d = a.Inspector.DOCUMENT.querySelectorAll(".sort-direction");
	            for (var e = 0; e < d.length; e++) {
	                d[e].classList.remove("fa-chevron-up");
	                d[e].classList.remove("fa-chevron-down");
	            }
	            if (c || !this._sortDirection[b]) {
	                this._sortDirection[b] = c || 1;
	            } else {
	                this._sortDirection[b] *= -1;
	            }
	            var f = this._sortDirection[b];
	            if (f == 1) {
	                this._headerRow.querySelector("#sort-direction-" + b).classList.remove("fa-chevron-down");
	                this._headerRow.querySelector("#sort-direction-" + b).classList.add("fa-chevron-up");
	            } else {
	                this._headerRow.querySelector("#sort-direction-" + b).classList.remove("fa-chevron-up");
	                this._headerRow.querySelector("#sort-direction-" + b).classList.add("fa-chevron-down");
	            }
	            var g = function(a) {
	                return typeof a === "string" || a instanceof String;
	            };
	            this._detailRows.sort(function(a, c) {
	                var d = String(a[b]);
	                var e = String(c[b]);
	                if (!g(d)) {
	                    d = a[b].toString();
	                }
	                if (!g(e)) {
	                    e = c[b].toString();
	                }
	                return d.localeCompare(e, [], {
	                    numeric: true
	                }) * f;
	            });
	        };
	        c.prototype.clean = function() {
	            for (var b = 0, c = this._detailRows; b < c.length; b++) {
	                var d = c[b];
	                d.dispose();
	            }
	            a.Helpers.CleanDiv(this._div);
	            this._div.appendChild(this._headerRow);
	        };
	        c.prototype.dispose = function() {
	            for (var a = 0, b = this._detailRows; a < b.length; a++) {
	                var c = b[a];
	                c.dispose();
	            }
	        };
	        c.prototype._createHeaderRow = function() {
	            var b = this;
	            this._headerRow = a.Helpers.CreateDiv("header-row");
	            var c = function(c, d) {
	                var e = a.Helpers.CreateDiv(d + " header-col");
	                var f = a.Inspector.DOCUMENT.createElement("span");
	                f.textContent = c.charAt(0).toUpperCase() + c.slice(1);
	                var g = a.Inspector.DOCUMENT.createElement("i");
	                g.className = "sort-direction fa";
	                g.id = "sort-direction-" + c;
	                e.appendChild(f);
	                e.appendChild(g);
	                e.addEventListener("click", function(a) {
	                    b._sortDetails(c);
	                    b._addDetails();
	                });
	                return e;
	            };
	            this._headerRow.appendChild(c("name", "prop-name"));
	            this._headerRow.appendChild(c("value", "prop-value"));
	        };
	        return c;
	    }(a.BasicElement);
	    a.DetailPanel = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b(a, b) {
	            this._property = a;
	            this._obj = b;
	        }
	        Object.defineProperty(b.prototype, "name", {
	            get: function() {
	                return this._property;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        Object.defineProperty(b.prototype, "value", {
	            get: function() {
	                return this._obj[this._property];
	            },
	            set: function(a) {
	                this._obj[this._property] = a;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        Object.defineProperty(b.prototype, "type", {
	            get: function() {
	                return a.Helpers.GET_TYPE(this.value);
	            },
	            enumerable: true,
	            configurable: true
	        });
	        Object.defineProperty(b.prototype, "obj", {
	            get: function() {
	                return this._obj;
	            },
	            set: function(a) {
	                this._obj = a;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        return b;
	    }();
	    a.Property = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function a() {}
	        a.format = function(a, b) {
	            var c = a[b];
	            if (a instanceof BABYLON.PrimitiveAlignment) {
	                if (b === "horizontal") {
	                    switch (c) {
	                      case BABYLON.PrimitiveAlignment.AlignLeft:
	                        return "left";

	                      case BABYLON.PrimitiveAlignment.AlignRight:
	                        return "right";

	                      case BABYLON.PrimitiveAlignment.AlignCenter:
	                        return "center";

	                      case BABYLON.PrimitiveAlignment.AlignStretch:
	                        return "stretch";
	                    }
	                } else if (b === "vertical") {
	                    switch (c) {
	                      case BABYLON.PrimitiveAlignment.AlignTop:
	                        return "top";

	                      case BABYLON.PrimitiveAlignment.AlignBottom:
	                        return "bottom";

	                      case BABYLON.PrimitiveAlignment.AlignCenter:
	                        return "center";

	                      case BABYLON.PrimitiveAlignment.AlignStretch:
	                        return "stretch";
	                    }
	                }
	            }
	            return c;
	        };
	        return a;
	    }();
	    a.PropertyFormatter = b;
	    var c = function() {
	        function c(b, c, d) {
	            if (d === void 0) {
	                d = 0;
	            }
	            this._children = [];
	            this._elements = [];
	            this._property = b;
	            this._level = d;
	            this._parent = c;
	            this._div = a.Helpers.CreateDiv("row");
	            this._div.style.marginLeft = this._level + "px";
	            var e = a.Helpers.CreateDiv("prop-name", this._div);
	            e.textContent = "" + this.name;
	            this._valueDiv = a.Helpers.CreateDiv("prop-value", this._div);
	            this._valueDiv.textContent = this._displayValueContent() || "-";
	            this._createElements();
	            for (var f = 0, g = this._elements; f < g.length; f++) {
	                var h = g[f];
	                this._valueDiv.appendChild(h.toHtml());
	            }
	            this._updateValue();
	            if (!this._isSimple()) {
	                this._valueDiv.classList.add("clickable");
	                this._valueDiv.addEventListener("click", this._addDetails.bind(this));
	            } else {
	                this._initInput();
	                this._valueDiv.addEventListener("click", this._displayInputHandler);
	                this._input.addEventListener("keypress", this._validateInputHandler);
	            }
	            a.Scheduler.getInstance().add(this);
	        }
	        c.prototype._initInput = function() {
	            this._input = document.createElement("input");
	            this._input.setAttribute("type", "text");
	            this._displayInputHandler = this._displayInput.bind(this);
	            this._validateInputHandler = this._validateInput.bind(this);
	        };
	        c.prototype._validateInput = function(b) {
	            if (b.keyCode == 13) {
	                var c = this._input.value;
	                this.updateObject();
	                this._property.value = c;
	                this.update();
	                a.Scheduler.getInstance().pause = false;
	            } else if (b.keyCode == 27) {
	                this.update();
	            }
	        };
	        c.prototype._removeInputWithoutValidating = function() {
	            a.Helpers.CleanDiv(this._valueDiv);
	            this._valueDiv.textContent = "-";
	            for (var b = 0, c = this._elements; b < c.length; b++) {
	                var d = c[b];
	                this._valueDiv.appendChild(d.toHtml());
	            }
	            this._valueDiv.addEventListener("click", this._displayInputHandler);
	        };
	        c.prototype._displayInput = function(b) {
	            this._valueDiv.removeEventListener("click", this._displayInputHandler);
	            var c = this._valueDiv.textContent;
	            this._valueDiv.textContent = "";
	            this._input.value = c;
	            this._valueDiv.appendChild(this._input);
	            a.Scheduler.getInstance().pause = true;
	        };
	        c.prototype.updateObject = function() {
	            if (!this._parent) {
	                return this._property.value;
	            } else {
	                this._property.obj = this._parent.updateObject();
	            }
	        };
	        Object.defineProperty(c.prototype, "name", {
	            get: function() {
	                return this._property.name;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        Object.defineProperty(c.prototype, "value", {
	            get: function() {
	                return b.format(this._property.obj, this._property.name);
	            },
	            enumerable: true,
	            configurable: true
	        });
	        Object.defineProperty(c.prototype, "type", {
	            get: function() {
	                return this._property.type;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        c.prototype._createElements = function() {
	            if (this.type == "Color3" || this.type == "Color4") {
	                this._elements.push(new a.ColorElement(this.value));
	            }
	            if (this.type == "Texture") {
	                this._elements.push(new a.TextureElement(this.value));
	            }
	            if (this.type == "HDRCubeTexture") {
	                this._elements.push(new a.HDRCubeTextureElement(this.value));
	            }
	            if (this.type == "CubeTexture") {
	                this._elements.push(new a.CubeTextureElement(this.value));
	            }
	        };
	        c.prototype._displayValueContent = function() {
	            var b = this.value;
	            if (typeof b === "number") {
	                return a.Helpers.Trunc(b);
	            }
	            if (typeof b === "string" || typeof b === "boolean") {
	                return b;
	            }
	            return a.PROPERTIES.format(b);
	        };
	        c.prototype.dispose = function() {
	            a.Scheduler.getInstance().remove(this);
	            for (var b = 0, c = this._children; b < c.length; b++) {
	                var d = c[b];
	                a.Scheduler.getInstance().remove(d);
	            }
	            for (var e = 0, f = this._elements; e < f.length; e++) {
	                var g = f[e];
	                g.dispose();
	            }
	            this._elements = [];
	        };
	        c.prototype._updateValue = function() {
	            this.updateObject();
	            this._valueDiv.childNodes[0].nodeValue = this._displayValueContent();
	            for (var a = 0, b = this._elements; a < b.length; a++) {
	                var c = b[a];
	                c.update(this.value);
	            }
	        };
	        c.prototype.update = function() {
	            this._removeInputWithoutValidating();
	            this._updateValue();
	        };
	        c._IS_TYPE_SIMPLE = function(b) {
	            var d = a.Helpers.GET_TYPE(b);
	            return c._SIMPLE_TYPE.indexOf(d) != -1;
	        };
	        c.prototype._isSimple = function() {
	            if (this.value != null) {
	                if (c._SIMPLE_TYPE.indexOf(this.type) == -1) {
	                    return false;
	                } else {
	                    return true;
	                }
	            } else {
	                return true;
	            }
	        };
	        c.prototype.toHtml = function() {
	            return this._div;
	        };
	        c.prototype._addDetails = function() {
	            if (this._div.classList.contains("unfolded")) {
	                this._div.classList.remove("unfolded");
	                for (var b = 0, d = this._children; b < d.length; b++) {
	                    var e = d[b];
	                    this._div.parentNode.removeChild(e.toHtml());
	                }
	            } else {
	                this._div.classList.toggle("unfolded");
	                if (this._children.length == 0) {
	                    var f = this.value;
	                    var g = a.PROPERTIES[a.Helpers.GET_TYPE(f)].properties.reverse();
	                    var h = null;
	                    for (var i = 0, j = g; i < j.length; i++) {
	                        var k = j[i];
	                        var l = new a.Property(k, this._property.value);
	                        var e = new c(l, this, this._level + c._MARGIN_LEFT);
	                        this._children.push(e);
	                    }
	                }
	                for (var m = 0, n = this._children; m < n.length; m++) {
	                    var e = n[m];
	                    this._div.parentNode.insertBefore(e.toHtml(), this._div.nextSibling);
	                }
	            }
	        };
	        c._SIMPLE_TYPE = [ "number", "string", "boolean" ];
	        c._MARGIN_LEFT = 15;
	        return c;
	    }();
	    a.PropertyLine = c;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b) {
	            a.call(this);
	            this._div.className = "color-element";
	            this._div.style.backgroundColor = this._toRgba(b);
	        }
	        b.prototype.update = function(a) {
	            if (a) {
	                this._div.style.backgroundColor = this._toRgba(a);
	            }
	        };
	        b.prototype._toRgba = function(a) {
	            if (a) {
	                var b = a.r * 255 | 0;
	                var c = a.g * 255 | 0;
	                var d = a.b * 255 | 0;
	                var e = 1;
	                if (a instanceof BABYLON.Color4) {
	                    var f = a.a;
	                }
	                return "rgba(" + b + ", " + c + ", " + d + ", " + e + ")";
	            } else {
	                return "";
	            }
	        };
	        return b;
	    }(a.BasicElement);
	    a.ColorElement = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b) {
	            a.call(this, b);
	        }
	        b.prototype._populateScene = function() {
	            var a = this;
	            var b = new BABYLON.HDRCubeTexture(this._textureUrl, this._scene, 512);
	            b.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
	            this._cube = BABYLON.Mesh.CreateBox("hdrSkyBox", 10, this._scene);
	            var c = new BABYLON.PBRMaterial("skyBox", this._scene);
	            c.backFaceCulling = false;
	            c.reflectionTexture = b;
	            c.microSurface = 1;
	            c.disableLighting = true;
	            this._cube.material = c;
	            this._cube.registerBeforeRender(function() {
	                a._cube.rotation.y += .01;
	            });
	        };
	        return b;
	    }(a.CubeTextureElement);
	    a.HDRCubeTextureElement = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c) {
	            var d = this;
	            b.call(this);
	            this._tab = c;
	            this._div.classList.add("searchbar");
	            var e = a.Inspector.DOCUMENT.createElement("i");
	            e.className = "fa fa-search";
	            this._div.appendChild(e);
	            this._inputElement = a.Inspector.DOCUMENT.createElement("input");
	            this._inputElement.placeholder = "Filter by name...";
	            this._div.appendChild(this._inputElement);
	            this._inputElement.addEventListener("keyup", function(a) {
	                var b = d._inputElement.value;
	                d._tab.filter(b);
	            });
	        }
	        c.prototype.reset = function() {
	            this._inputElement.value = "";
	        };
	        c.prototype.update = function() {};
	        return c;
	    }(a.BasicElement);
	    a.SearchBar = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c) {
	            b.call(this);
	            this._div.className = "fa fa-search texture-element";
	            this._textureDiv = a.Helpers.CreateDiv("texture-viewer", this._div);
	            var d = a.Helpers.CreateDiv("texture-viewer-img", this._textureDiv);
	            var e = a.Helpers.CreateDiv(null, this._textureDiv);
	            if (c) {
	                e.textContent = c.getBaseSize().width + "px x " + c.getBaseSize().height + "px";
	                d.style.backgroundImage = "url('" + c.url + "')";
	                d.style.width = c.getBaseSize().width + "px";
	                d.style.height = c.getBaseSize().height + "px";
	            }
	            this._div.addEventListener("mouseover", this._showViewer.bind(this, "flex"));
	            this._div.addEventListener("mouseout", this._showViewer.bind(this, "none"));
	        }
	        c.prototype.update = function(a) {};
	        c.prototype._showViewer = function(a) {
	            this._textureDiv.style.display = a;
	        };
	        return c;
	    }(a.BasicElement);
	    a.TextureElement = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b(b, c) {
	            var d = this;
	            this._elem = b;
	            this._infoDiv = a.Helpers.CreateDiv("tooltip", this._elem);
	            this._elem.addEventListener("mouseover", function() {
	                d._infoDiv.textContent = c;
	                d._infoDiv.style.display = "block";
	            });
	            this._elem.addEventListener("mouseout", function() {
	                d._infoDiv.style.display = "none";
	            });
	        }
	        return b;
	    }();
	    a.Tooltip = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b() {}
	        b.GET_TYPE = function(a) {
	            if (a != null && a != undefined) {
	                var b = BABYLON.Tools.getClassName(a);
	                if (!b || b === "object") {
	                    b = a.constructor.name;
	                    if (!b) {
	                        b = this._GetFnName(a.constructor);
	                    }
	                }
	                return b;
	            } else {
	                return "";
	            }
	        };
	        b._GetFnName = function(a) {
	            var b = typeof a == "function";
	            var c = b && (a.name && [ "", a.name ] || a.toString().match(/function ([^\(]+)/));
	            return !b && "not a function" || (c && c[1] || "anonymous");
	        };
	        b.SEND_EVENT = function(b) {
	            var c;
	            if (a.Inspector.DOCUMENT.createEvent) {
	                c = a.Inspector.DOCUMENT.createEvent("HTMLEvents");
	                c.initEvent(b, true, true);
	            } else {
	                c = new Event(b);
	            }
	            window.dispatchEvent(c);
	        };
	        b.Trunc = function(a) {
	            if (Math.round(a) !== a) {
	                return a.toFixed(2);
	            }
	            return a;
	        };
	        b.CreateDiv = function(a, c) {
	            return b.CreateElement("div", a, c);
	        };
	        b.CreateElement = function(b, c, d) {
	            var e = a.Inspector.DOCUMENT.createElement(b);
	            if (c) {
	                e.className = c;
	            }
	            if (d) {
	                d.appendChild(e);
	            }
	            return e;
	        };
	        b.CleanDiv = function(a) {
	            while (a.firstChild) {
	                a.removeChild(a.firstChild);
	            }
	        };
	        b.LoadScript = function() {
	            BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js", function(c) {
	                var d = b.CreateElement("script", "", a.Inspector.DOCUMENT.body);
	                d.textContent = c;
	                BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/languages/glsl.min.js", function(c) {
	                    var d = b.CreateElement("script", "", a.Inspector.DOCUMENT.body);
	                    d.textContent = c;
	                    BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/zenburn.min.css", function(c) {
	                        var d = b.CreateElement("style", "", a.Inspector.DOCUMENT.body);
	                        d.textContent = c;
	                    });
	                }, null, null, null, function() {
	                    console.log("erreur");
	                });
	            }, null, null, null, function() {
	                console.log("erreur");
	            });
	        };
	        return b;
	    }();
	    a.Helpers = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b(c, d) {
	            var e = this;
	            this._popupMode = false;
	            this._scene = c;
	            b.DOCUMENT = window.document;
	            if (d) {
	                this._buildInspector(d);
	            } else {
	                var f = this._scene.getEngine().getRenderingCanvas();
	                var g = f.parentElement;
	                var h = window.getComputedStyle(f);
	                this._canvasSize = {
	                    width: h.width,
	                    height: h.height
	                };
	                this._c2diwrapper = a.Helpers.CreateDiv("insp-wrapper", g);
	                this._c2diwrapper.style.width = this._canvasSize.width;
	                this._c2diwrapper.style.height = this._canvasSize.height;
	                this._c2diwrapper.appendChild(f);
	                var i = a.Helpers.CreateDiv("insp-right-panel", this._c2diwrapper);
	                Split([ f, i ], {
	                    direction: "horizontal",
	                    sizes: [ 75, 25 ],
	                    onDrag: function() {
	                        a.Helpers.SEND_EVENT("resize");
	                        if (e._tabbar) {
	                            e._tabbar.updateWidth();
	                        }
	                    }
	                });
	                this._buildInspector(i);
	                a.Helpers.SEND_EVENT("resize");
	            }
	            this.refresh();
	        }
	        b.prototype._buildInspector = function(b) {
	            this._tabbar = new a.TabBar(this);
	            this._topPanel = a.Helpers.CreateDiv("top-panel", b);
	            this._topPanel.appendChild(this._tabbar.toHtml());
	            this._tabbar.updateWidth();
	            this._tabPanel = a.Helpers.CreateDiv("tab-panel-content", this._topPanel);
	        };
	        Object.defineProperty(b.prototype, "scene", {
	            get: function() {
	                return this._scene;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        Object.defineProperty(b.prototype, "popupMode", {
	            get: function() {
	                return this._popupMode;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        b.prototype.filterItem = function(a) {
	            this._tabbar.getActiveTab().filter(a);
	        };
	        b.prototype.displayObjectDetails = function(a) {
	            this._tabbar.switchMeshTab(a);
	        };
	        b.prototype.refresh = function() {
	            a.Helpers.CleanDiv(this._tabPanel);
	            var b = this._tabbar.getActiveTab();
	            b.update();
	            this._tabPanel.appendChild(b.getPanel());
	            a.Helpers.SEND_EVENT("resize");
	        };
	        b.prototype._disposeInspector = function() {
	            if (!this._popupMode) {
	                var b = this._scene.getEngine().getRenderingCanvas();
	                b.style.width = this._canvasSize.width;
	                b.style.height = this._canvasSize.height;
	                var c = b.parentElement.parentElement;
	                c.appendChild(b);
	                a.Helpers.CleanDiv(this._c2diwrapper);
	                this._c2diwrapper.remove();
	                a.Helpers.SEND_EVENT("resize");
	            }
	        };
	        b.prototype.openPopup = function() {
	            var c = window.open("", "Babylon.js INSPECTOR", "toolbar=no,resizable=yes,menubar=no,width=750,height=1000");
	            c.document.title = "Babylon.js INSPECTOR";
	            var d = b.DOCUMENT.querySelectorAll("style");
	            for (var e = 0; e < d.length; e++) {
	                c.document.body.appendChild(d[e].cloneNode(true));
	            }
	            var f = document.querySelectorAll("link");
	            for (var g = 0; g < f.length; g++) {
	                var h = c.document.createElement("link");
	                h.rel = "stylesheet";
	                h.href = f[g].href;
	                c.document.head.appendChild(h);
	            }
	            this._disposeInspector();
	            this._popupMode = true;
	            b.DOCUMENT = c.document;
	            this._c2diwrapper = a.Helpers.CreateDiv("insp-wrapper", c.document.body);
	            var i = a.Helpers.CreateDiv("insp-right-panel", this._c2diwrapper);
	            this._buildInspector(i);
	            this.refresh();
	        };
	        return b;
	    }();
	    a.Inspector = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    a.PROPERTIES = {
	        format: function(b) {
	            var c = a.Helpers.GET_TYPE(b) || "default";
	            if (a.PROPERTIES[c] && a.PROPERTIES[c].format) {
	                return a.PROPERTIES[c].format(b);
	            } else {
	                return a.Helpers.GET_TYPE(b);
	            }
	        },
	        Vector2: {
	            properties: [ "x", "y" ],
	            format: function(b) {
	                return "x:" + a.Helpers.Trunc(b.x) + ", y:" + a.Helpers.Trunc(b.y);
	            }
	        },
	        Vector3: {
	            properties: [ "x", "y", "z" ],
	            format: function(b) {
	                return "x:" + a.Helpers.Trunc(b.x) + ", y:" + a.Helpers.Trunc(b.y) + ", z:" + a.Helpers.Trunc(b.z);
	            }
	        },
	        Color3: {
	            properties: [ "r", "g", "b" ],
	            format: function(a) {
	                return "R:" + a.r + ", G:" + a.g + ", B:" + a.b;
	            }
	        },
	        Quaternion: {
	            properties: [ "x", "y", "z", "w" ]
	        },
	        Size: {
	            properties: [ "width", "height" ],
	            format: function(b) {
	                return "Size - w:" + a.Helpers.Trunc(b.width) + ", h:" + a.Helpers.Trunc(b.height);
	            }
	        },
	        Texture: {
	            properties: [ "hasAlpha", "level", "name", "wrapU", "wrapV", "uScale", "vScale", "uAng", "vAng", "wAng", "uOffset", "vOffset" ]
	        },
	        ArcRotateCamera: {
	            properties: [ "alpha", "beta", "radius" ]
	        },
	        Scene: {
	            properties: [ "actionManager", "activeCamera", "ambientColor", "clearColor" ]
	        },
	        Mesh: {
	            properties: [ "name", "position", "rotation", "rotationQuaternion", "absolutePosition", "material" ],
	            format: function(a) {
	                return a.name;
	            }
	        },
	        StandardMaterial: {
	            properties: [ "name", "alpha", "alphaMode", "wireframe", "isFrozen", "zOffset", "ambientColor", "emissiveColor", "diffuseColor", "specularColor", "specularPower", "useAlphaFromDiffuseTexture", "linkEmissiveWithDiffuse", "useSpecularOverAlpha", "diffuseFresnelParameters", "opacityFresnelParameters", "reflectionFresnelParameters", "refractionFresnelParameters", "emissiveFresnelParameters", "diffuseTexture", "emissiveTexture", "specularTexture", "ambientTexture", "bumpTexture", "lightMapTexture", "opacityTexture", "reflectionTexture", "refractionTexture" ],
	            format: function(a) {
	                return a.name;
	            }
	        },
	        PrimitiveAlignment: {
	            properties: [ "horizontal", "vertical" ]
	        },
	        PrimitiveThickness: {
	            properties: [ "topPixels", "leftPixels", "rightPixels", "bottomPixels" ]
	        },
	        BoundingInfo2D: {
	            properties: [ "radius", "center", "extent" ]
	        },
	        SolidColorBrush2D: {
	            properties: [ "color" ]
	        },
	        GradientColorBrush2D: {
	            properties: [ "color1", "color2", "translation", "rotation", "scale" ]
	        },
	        PBRMaterial: {
	            properties: [ "name", "albedoColor", "albedoTexture", "opacityTexture", "reflectionTexture", "emissiveTexture", "bumpTexture", "lightmapTexture", "opacityFresnelParameters", "emissiveFresnelParameters", "linkEmissiveWithAlbedo", "useLightmapAsShadowmap", "useAlphaFromAlbedoTexture", "useSpecularOverAlpha", "useAutoMicroSurfaceFromReflectivityMap", "useLogarithmicDepth", "reflectivityColor", "reflectivityTexture", "reflectionTexture", "reflectionColor", "alpha", "linkRefractionWithTransparency", "indexOfRefraction", "microSurface", "useMicroSurfaceFromReflectivityMapAlpha", "directIntensity", "emissiveIntensity", "specularIntensity", "environmentIntensity", "cameraExposure", "cameraContrast", "cameraColorGradingTexture", "cameraColorCurves" ]
	        }
	    };
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function a() {
	            this.pause = false;
	            this._updatableProperties = [];
	            this._timer = setInterval(this._update.bind(this), a.REFRESH_TIME);
	        }
	        a.getInstance = function() {
	            if (!a._instance) {
	                a._instance = new a();
	                console.log("create ");
	            }
	            return a._instance;
	        };
	        a.prototype.add = function(a) {
	            this._updatableProperties.push(a);
	        };
	        a.prototype.remove = function(a) {
	            var b = this._updatableProperties.indexOf(a);
	            if (b != -1) {
	                this._updatableProperties.splice(b, 1);
	            }
	        };
	        a.prototype._update = function() {
	            if (!this.pause) {
	                for (var a = 0, b = this._updatableProperties; a < b.length; a++) {
	                    var c = b[a];
	                    c.update();
	                }
	            }
	        };
	        a.REFRESH_TIME = 250;
	        return a;
	    }();
	    a.Scheduler = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a, c) {
	            b.call(this, a, "Canvas2D", c);
	        }
	        c.prototype._getTree = function() {
	            var b = this;
	            var c = [];
	            var d = BABYLON.Canvas2D.instances || [];
	            var e = function(a) {
	                return a.id && a.id.indexOf("###") == 0 && a.id.lastIndexOf("###", 0) === 0;
	            };
	            var f = function(c) {
	                if (c.children && c.children.length > 0) {
	                    var d = new a.TreeItem(b, new a.Canvas2DAdapter(c));
	                    for (var g = 0, h = c.children; g < h.length; g++) {
	                        var i = h[g];
	                        if (!e(i)) {
	                            var j = f(i);
	                            d.add(j);
	                        }
	                    }
	                    d.update();
	                    return d;
	                } else {
	                    return new a.TreeItem(b, new a.Canvas2DAdapter(c));
	                }
	            };
	            for (var g = 0, h = d; g < h.length; g++) {
	                var i = h[g];
	                var j = i;
	                var k = f(j);
	                c.push(k);
	            }
	            return c;
	        };
	        return c;
	    }(a.PropertyTab);
	    a.Canvas2DTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a, c) {
	            b.call(this, a, "Light", c);
	        }
	        c.prototype._getTree = function() {
	            var b = [];
	            var c = this._inspector.scene;
	            for (var d = 0, e = c.lights; d < e.length; d++) {
	                var f = e[d];
	                b.push(new a.TreeItem(this, new a.LightAdapter(f)));
	            }
	            return b;
	        };
	        return c;
	    }(a.PropertyTab);
	    a.LightTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a, c) {
	            b.call(this, a, "Material", c);
	        }
	        c.prototype._getTree = function() {
	            var b = [];
	            var c = this._inspector.scene;
	            for (var d = 0, e = c.materials; d < e.length; d++) {
	                var f = e[d];
	                b.push(new a.TreeItem(this, new a.MaterialAdapter(f)));
	            }
	            return b;
	        };
	        return c;
	    }(a.PropertyTab);
	    a.MaterialTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a, c) {
	            b.call(this, a, "Mesh", c);
	        }
	        c.prototype._getTree = function() {
	            var b = [];
	            var c = function(a) {
	                return a.name && a.name.indexOf("###") == 0 && a.name.lastIndexOf("###", 0) === 0;
	            };
	            var d = this._inspector.scene;
	            for (var e = 0, f = d.meshes; e < f.length; e++) {
	                var g = f[e];
	                if (!c(g)) {
	                    b.push(new a.TreeItem(this, new a.MeshAdapter(g)));
	                }
	            }
	            return b;
	        };
	        return c;
	    }(a.PropertyTab);
	    a.MeshTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c, d) {
	            var e = this;
	            b.call(this, c, "Scene");
	            this._skeletonViewers = [];
	            this._inspector = d;
	            this._panel = a.Helpers.CreateDiv("tab-panel");
	            this._actions = a.Helpers.CreateDiv("scene-actions", this._panel);
	            this._detailsPanel = new a.DetailPanel();
	            this._panel.appendChild(this._detailsPanel.toHtml());
	            var f = [];
	            for (var g = 0, h = a.PROPERTIES["Scene"].properties; g < h.length; g++) {
	                var i = h[g];
	                f.push(new a.PropertyLine(new a.Property(i, this._inspector.scene)));
	            }
	            this._detailsPanel.details = f;
	            Split([ this._actions, this._detailsPanel.toHtml() ], {
	                sizes: [ 50, 50 ],
	                direction: "vertical"
	            });
	            {
	                var j = a.Helpers.CreateDiv("actions-title", this._actions);
	                j.textContent = "Rendering mode";
	                var k = a.Helpers.CreateDiv("action-radio", this._actions);
	                var l = a.Helpers.CreateDiv("action-radio", this._actions);
	                var m = a.Helpers.CreateDiv("action-radio", this._actions);
	                k.textContent = "Point";
	                l.textContent = "Wireframe";
	                m.textContent = "Solid";
	                if (this._inspector.scene.forcePointsCloud) {
	                    k.classList.add("active");
	                } else if (this._inspector.scene.forceWireframe) {
	                    l.classList.add("active");
	                } else {
	                    m.classList.add("active");
	                }
	                this._generateRadioAction([ k, l, m ]);
	                k.addEventListener("click", function() {
	                    e._inspector.scene.forcePointsCloud = true;
	                    e._inspector.scene.forceWireframe = false;
	                });
	                l.addEventListener("click", function() {
	                    e._inspector.scene.forcePointsCloud = false;
	                    e._inspector.scene.forceWireframe = true;
	                });
	                m.addEventListener("click", function() {
	                    e._inspector.scene.forcePointsCloud = false;
	                    e._inspector.scene.forceWireframe = false;
	                });
	                j = a.Helpers.CreateDiv("actions-title", this._actions);
	                j.textContent = "Textures channels";
	                this._generateActionLine("Diffuse Texture", BABYLON.StandardMaterial.DiffuseTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.DiffuseTextureEnabled = a;
	                });
	                this._generateActionLine("Ambient Texture", BABYLON.StandardMaterial.AmbientTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.AmbientTextureEnabled = a;
	                });
	                this._generateActionLine("Specular Texture", BABYLON.StandardMaterial.SpecularTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.SpecularTextureEnabled = a;
	                });
	                this._generateActionLine("Emissive Texture", BABYLON.StandardMaterial.EmissiveTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.EmissiveTextureEnabled = a;
	                });
	                this._generateActionLine("Bump Texture", BABYLON.StandardMaterial.BumpTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.BumpTextureEnabled = a;
	                });
	                this._generateActionLine("Opacity Texture", BABYLON.StandardMaterial.OpacityTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.OpacityTextureEnabled = a;
	                });
	                this._generateActionLine("Reflection Texture", BABYLON.StandardMaterial.ReflectionTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.ReflectionTextureEnabled = a;
	                });
	                this._generateActionLine("Refraction Texture", BABYLON.StandardMaterial.RefractionTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.RefractionTextureEnabled = a;
	                });
	                this._generateActionLine("ColorGrading", BABYLON.StandardMaterial.ColorGradingTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.ColorGradingTextureEnabled = a;
	                });
	                this._generateActionLine("Lightmap Texture", BABYLON.StandardMaterial.LightmapTextureEnabled, function(a) {
	                    BABYLON.StandardMaterial.LightmapTextureEnabled = a;
	                });
	                this._generateActionLine("Fresnel", BABYLON.StandardMaterial.FresnelEnabled, function(a) {
	                    BABYLON.StandardMaterial.FresnelEnabled = a;
	                });
	                j = a.Helpers.CreateDiv("actions-title", this._actions);
	                j.textContent = "Options";
	                this._generateActionLine("Animations", this._inspector.scene.animationsEnabled, function(a) {
	                    e._inspector.scene.animationsEnabled = a;
	                });
	                this._generateActionLine("Collisions", this._inspector.scene.collisionsEnabled, function(a) {
	                    e._inspector.scene.collisionsEnabled = a;
	                });
	                this._generateActionLine("Fog", this._inspector.scene.fogEnabled, function(a) {
	                    e._inspector.scene.fogEnabled = a;
	                });
	                this._generateActionLine("Lens flares", this._inspector.scene.lensFlaresEnabled, function(a) {
	                    e._inspector.scene.lensFlaresEnabled = a;
	                });
	                this._generateActionLine("Lights", this._inspector.scene.lightsEnabled, function(a) {
	                    e._inspector.scene.lightsEnabled = a;
	                });
	                this._generateActionLine("Particles", this._inspector.scene.particlesEnabled, function(a) {
	                    e._inspector.scene.particlesEnabled = a;
	                });
	                this._generateActionLine("Post-processes", this._inspector.scene.postProcessesEnabled, function(a) {
	                    e._inspector.scene.postProcessesEnabled = a;
	                });
	                this._generateActionLine("Probes", this._inspector.scene.probesEnabled, function(a) {
	                    e._inspector.scene.probesEnabled = a;
	                });
	                this._generateActionLine("Procedural textures", this._inspector.scene.proceduralTexturesEnabled, function(a) {
	                    e._inspector.scene.proceduralTexturesEnabled = a;
	                });
	                this._generateActionLine("Render targets", this._inspector.scene.renderTargetsEnabled, function(a) {
	                    e._inspector.scene.renderTargetsEnabled = a;
	                });
	                this._generateActionLine("Shadows", this._inspector.scene.shadowsEnabled, function(a) {
	                    e._inspector.scene.shadowsEnabled = a;
	                });
	                this._generateActionLine("Skeletons", this._inspector.scene.skeletonsEnabled, function(a) {
	                    e._inspector.scene.skeletonsEnabled = a;
	                });
	                this._generateActionLine("Sprites", this._inspector.scene.spritesEnabled, function(a) {
	                    e._inspector.scene.spritesEnabled = a;
	                });
	                this._generateActionLine("Textures", this._inspector.scene.texturesEnabled, function(a) {
	                    e._inspector.scene.texturesEnabled = a;
	                });
	                j = a.Helpers.CreateDiv("actions-title", this._actions);
	                j.textContent = "Audio";
	                var n = a.Helpers.CreateDiv("action-radio", this._actions);
	                var o = a.Helpers.CreateDiv("action-radio", this._actions);
	                this._generateActionLine("Disable audio", !this._inspector.scene.audioEnabled, function(a) {
	                    e._inspector.scene.audioEnabled = !a;
	                });
	                n.textContent = "Headphones";
	                o.textContent = "Normal speakers";
	                this._generateRadioAction([ n, o ]);
	                if (this._inspector.scene.headphone) {
	                    n.classList.add("active");
	                } else {
	                    o.classList.add("active");
	                }
	                n.addEventListener("click", function() {
	                    e._inspector.scene.headphone = true;
	                });
	                o.addEventListener("click", function() {
	                    e._inspector.scene.headphone = false;
	                });
	                j = a.Helpers.CreateDiv("actions-title", this._actions);
	                j.textContent = "Viewer";
	                this._generateActionLine("Skeletons", false, function(a) {
	                    if (a) {
	                        for (var b = 0; b < e._inspector.scene.meshes.length; b++) {
	                            var c = e._inspector.scene.meshes[b];
	                            if (c.skeleton) {
	                                var d = false;
	                                for (var f = 0; f < e._skeletonViewers.length; f++) {
	                                    if (e._skeletonViewers[f].skeleton === c.skeleton) {
	                                        d = true;
	                                        break;
	                                    }
	                                }
	                                if (d) {
	                                    continue;
	                                }
	                                var g = new BABYLON.Debug.SkeletonViewer(c.skeleton, c, e._inspector.scene);
	                                g.isEnabled = true;
	                                e._skeletonViewers.push(g);
	                            }
	                        }
	                    } else {
	                        for (var b = 0; b < e._skeletonViewers.length; b++) {
	                            e._skeletonViewers[b].dispose();
	                        }
	                        e._skeletonViewers = [];
	                    }
	                });
	            }
	        }
	        c.prototype.dispose = function() {
	            this._detailsPanel.dispose();
	        };
	        c.prototype._generateActionLine = function(b, c, d) {
	            var e = a.Helpers.CreateDiv("scene-actions", this._actions);
	            e.textContent = b;
	            e.classList.add("action");
	            if (c) {
	                e.classList.add("active");
	            }
	            e.addEventListener("click", function(a) {
	                e.classList.toggle("active");
	                var b = e.classList.contains("active");
	                d(b);
	            });
	        };
	        c.prototype._generateRadioAction = function(a) {
	            var b = function(b, c) {
	                for (var d = 0, e = a; d < e.length; d++) {
	                    var f = e[d];
	                    f.classList.remove("active");
	                }
	                b.classList.add("active");
	            };
	            for (var c = 0, d = a; c < d.length; c++) {
	                var e = d[c];
	                e.addEventListener("click", b.bind(this, e));
	            }
	        };
	        return c;
	    }(a.Tab);
	    a.SceneTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c, d) {
	            b.call(this, c, "Shader");
	            this._inspector = d;
	            this._panel = a.Helpers.CreateDiv("tab-panel");
	            var e = a.Helpers.CreateDiv("shader-tree-panel");
	            this._vertexPanel = a.Helpers.CreateDiv("shader-panel");
	            this._fragmentPanel = a.Helpers.CreateDiv("shader-panel");
	            this._panel.appendChild(e);
	            this._panel.appendChild(this._vertexPanel);
	            this._panel.appendChild(this._fragmentPanel);
	            a.Helpers.LoadScript();
	            Split([ this._vertexPanel, this._fragmentPanel ], {
	                sizes: [ 50, 50 ],
	                direction: "vertical"
	            });
	            var f = a.Helpers.CreateElement("select", "", e);
	            f.addEventListener("change", this._selectShader.bind(this));
	            var g = a.Helpers.CreateElement("option", "", f);
	            g.textContent = "Select a shader";
	            g.setAttribute("value", "");
	            g.setAttribute("disabled", "true");
	            g.setAttribute("selected", "true");
	            for (var h = 0, i = this._inspector.scene.materials; h < i.length; h++) {
	                var j = i[h];
	                if (j instanceof BABYLON.ShaderMaterial) {
	                    var k = a.Helpers.CreateElement("option", "", f);
	                    k.setAttribute("value", j.id);
	                    k.textContent = j.name + " - " + j.id;
	                }
	            }
	        }
	        c.prototype._selectShader = function(b) {
	            var c = b.target.value;
	            var d = this._inspector.scene.getMaterialByID(c);
	            a.Helpers.CleanDiv(this._vertexPanel);
	            var e = a.Helpers.CreateDiv("shader-panel-title", this._vertexPanel);
	            e.textContent = "Vertex shader";
	            var f = a.Helpers.CreateElement("code", "glsl", a.Helpers.CreateElement("pre", "", this._vertexPanel));
	            f.textContent = this._beautify(d.getEffect().getVertexShaderSource());
	            a.Helpers.CleanDiv(this._fragmentPanel);
	            e = a.Helpers.CreateDiv("shader-panel-title", this._fragmentPanel);
	            e.textContent = "Frgament shader";
	            f = a.Helpers.CreateElement("code", "glsl", a.Helpers.CreateElement("pre", "", this._fragmentPanel));
	            f.textContent = this._beautify(d.getEffect().getFragmentShaderSource());
	            var g = a.Helpers.CreateElement("script", "", a.Inspector.DOCUMENT.body);
	            g.textContent = "hljs.initHighlighting();";
	        };
	        c.prototype.dispose = function() {};
	        c.prototype._getBracket = function(a) {
	            var b = a.indexOf("{");
	            var c = a.substr(b + 1).split("");
	            var d = 1;
	            var e = b;
	            var f = 0;
	            for (var g = 0, h = c; g < h.length; g++) {
	                var i = h[g];
	                e++;
	                if (i === "{") {
	                    d++;
	                }
	                if (i === "}") {
	                    d--;
	                }
	                if (d == 0) {
	                    f = e;
	                    break;
	                }
	            }
	            return {
	                firstBracket: b,
	                lastBracket: f
	            };
	        };
	        c.prototype._beautify = function(a, b) {
	            if (b === void 0) {
	                b = 0;
	            }
	            var c = this._getBracket(a);
	            var d = c.firstBracket;
	            var e = c.lastBracket;
	            var f = "";
	            for (var g = 0; g < b; g++) {
	                f += "    ";
	            }
	            if (d == -1) {
	                a = f + a;
	                a = a.replace(/;./g, function(a) {
	                    return "\n" + a.substr(1);
	                });
	                a = a.replace(/=/g, " = ");
	                a = a.replace(/\n/g, "\n" + f);
	                return a;
	            } else {
	                var h = a.substr(0, d);
	                var i = a.substr(e + 1, a.length);
	                var j = a.substr(d + 1, e - d - 1);
	                j = this._beautify(j, b + 1);
	                return this._beautify(h, b) + "{\n" + j + "\n" + f + "}\n" + this._beautify(i, b);
	            }
	        };
	        return c;
	    }(a.Tab);
	    a.ShaderTab = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c) {
	            b.call(this);
	            this._tabs = [];
	            this._invisibleTabs = [];
	            this._visibleTabs = [];
	            this._inspector = c;
	            this._tabs.push(new a.SceneTab(this, this._inspector));
	            this._meshTab = new a.MeshTab(this, this._inspector);
	            this._tabs.push(this._meshTab);
	            this._tabs.push(new a.ShaderTab(this, this._inspector));
	            this._tabs.push(new a.LightTab(this, this._inspector));
	            this._tabs.push(new a.Canvas2DTab(this, this._inspector));
	            this._tabs.push(new a.MaterialTab(this, this._inspector));
	            this._toolBar = new a.Toolbar(this._inspector);
	            this._build();
	            this._tabs[0].active(true);
	            for (var d = 0, e = this._tabs; d < e.length; d++) {
	                var f = e[d];
	                this._visibleTabs.push(f);
	            }
	        }
	        c.prototype.update = function() {};
	        c.prototype._build = function() {
	            var b = this;
	            this._div.className = "tabbar";
	            this._div.appendChild(this._toolBar.toHtml());
	            for (var c = 0, d = this._tabs; c < d.length; c++) {
	                var e = d[c];
	                this._div.appendChild(e.toHtml());
	            }
	            this._moreTabsIcon = a.Helpers.CreateElement("i", "fa fa-angle-double-right more-tabs");
	            this._moreTabsPanel = a.Helpers.CreateDiv("more-tabs-panel");
	            this._moreTabsIcon.addEventListener("click", function() {
	                if (b._moreTabsPanel.style.display == "flex") {
	                    b._moreTabsPanel.style.display = "none";
	                } else {
	                    var c = b._div.parentNode;
	                    if (!c.contains(b._moreTabsPanel)) {
	                        c.appendChild(b._moreTabsPanel);
	                    }
	                    a.Helpers.CleanDiv(b._moreTabsPanel);
	                    for (var d = 0, e = b._invisibleTabs; d < e.length; d++) {
	                        var f = e[d];
	                        b._addInvisibleTabToPanel(f);
	                    }
	                    b._moreTabsPanel.style.display = "flex";
	                }
	            });
	        };
	        c.prototype._addInvisibleTabToPanel = function(b) {
	            var c = this;
	            var d = a.Helpers.CreateDiv("invisible-tab", this._moreTabsPanel);
	            d.textContent = b.name;
	            d.addEventListener("click", function() {
	                c._moreTabsPanel.style.display = "none";
	                c.switchTab(b);
	            });
	        };
	        c.prototype.switchTab = function(a) {
	            this.getActiveTab().dispose();
	            for (var b = 0, c = this._tabs; b < c.length; b++) {
	                var d = c[b];
	                d.active(false);
	            }
	            a.active(true);
	            this._inspector.refresh();
	        };
	        c.prototype.switchMeshTab = function(a) {
	            this.switchTab(this._meshTab);
	            if (a) {
	                var b = this._meshTab.getItemFor(a);
	                this._meshTab.select(b);
	            }
	        };
	        c.prototype.getActiveTab = function() {
	            for (var a = 0, b = this._tabs; a < b.length; a++) {
	                var c = b[a];
	                if (c.isActive()) {
	                    return c;
	                }
	            }
	        };
	        Object.defineProperty(c.prototype, "inspector", {
	            get: function() {
	                return this._inspector;
	            },
	            enumerable: true,
	            configurable: true
	        });
	        c.prototype.getPixelWidth = function() {
	            var a = 0;
	            for (var b = 0, c = this._visibleTabs; b < c.length; b++) {
	                var d = c[b];
	                a += d.getPixelWidth();
	            }
	            a += this._toolBar.getPixelWidth();
	            if (this._div.contains(this._moreTabsIcon)) {
	                a += 30;
	            }
	            return a;
	        };
	        c.prototype.updateWidth = function() {
	            var a = this._div.parentElement.clientWidth;
	            var b = 75;
	            var c = this.getPixelWidth();
	            while (this._visibleTabs.length > 0 && c > a) {
	                var d = this._visibleTabs.pop();
	                this._invisibleTabs.push(d);
	                this._div.removeChild(d.toHtml());
	                c = this.getPixelWidth() + b;
	            }
	            if (this._invisibleTabs.length > 0) {
	                if (c + b < a) {
	                    var e = this._invisibleTabs.pop();
	                    this._div.appendChild(e.toHtml());
	                    this._visibleTabs.push(e);
	                    this._div.removeChild(this._moreTabsIcon);
	                }
	            }
	            if (this._invisibleTabs.length > 0 && !this._div.contains(this._moreTabsIcon)) {
	                this._div.appendChild(this._moreTabsIcon);
	            }
	        };
	        return c;
	    }(a.BasicElement);
	    a.TabBar = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a, c) {
	            b.call(this, "fa-pause", a, c, "Pause the automatic update of properties");
	            this._isPause = false;
	        }
	        c.prototype.action = function() {
	            if (this._isPause) {
	                a.Scheduler.getInstance().pause = false;
	                this._updateIcon("fa-pause");
	            } else {
	                a.Scheduler.getInstance().pause = true;
	                this._updateIcon("fa-play");
	            }
	            this._isPause = !this._isPause;
	        };
	        return c;
	    }(a.AbstractTool);
	    a.PauseScheduleTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b, c) {
	            a.call(this, "fa-mouse-pointer", b, c, "Pick a mesh in the scene to display its details");
	            this._isActive = false;
	            this._pickHandler = this._pickMesh.bind(this);
	        }
	        b.prototype.action = function() {
	            if (this._isActive) {
	                this._deactivate();
	            } else {
	                this.toHtml().classList.add("active");
	                this._inspector.scene.getEngine().getRenderingCanvas().addEventListener("click", this._pickHandler);
	                this._isActive = true;
	            }
	        };
	        b.prototype._deactivate = function() {
	            this.toHtml().classList.remove("active");
	            this._inspector.scene.getEngine().getRenderingCanvas().removeEventListener("click", this._pickHandler);
	            this._isActive = false;
	        };
	        b.prototype._pickMesh = function(a) {
	            var b = this._updatePointerPosition(a);
	            var c = this._inspector.scene.pick(b.x, b.y, function(a) {
	                return true;
	            });
	            if (c.pickedMesh) {
	                console.log(c.pickedMesh.name);
	                this._inspector.displayObjectDetails(c.pickedMesh);
	            }
	            this._deactivate();
	        };
	        b.prototype._updatePointerPosition = function(a) {
	            var b = this._inspector.scene.getEngine().getRenderingCanvasClientRect();
	            var c = a.clientX - b.left;
	            var d = a.clientY - b.top;
	            return {
	                x: c,
	                y: d
	            };
	        };
	        return b;
	    }(a.AbstractTool);
	    a.PickTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b, c) {
	            a.call(this, "fa-external-link", b, c, "Creates the inspector in an external popup");
	        }
	        b.prototype.action = function() {
	            this._inspector.openPopup();
	        };
	        return b;
	    }(a.AbstractTool);
	    a.PopupTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b, c) {
	            a.call(this, "fa-refresh", b, c, "Refresh the current tab");
	        }
	        b.prototype.action = function() {
	            this._inspector.refresh();
	        };
	        return b;
	    }(a.AbstractTool);
	    a.RefreshTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a) {
	            b.call(this);
	            this._tools = [];
	            this._inspector = a;
	            this._build();
	            this._addTools();
	        }
	        c.prototype.update = function() {};
	        c.prototype._build = function() {
	            this._div.className = "toolbar";
	        };
	        c.prototype._addTools = function() {
	            this._tools.push(new a.RefreshTool(this._div, this._inspector));
	            this._tools.push(new a.PickTool(this._div, this._inspector));
	            if (!this._inspector.popupMode) {
	                this._tools.push(new a.PopupTool(this._div, this._inspector));
	            }
	            this._tools.push(new a.PauseScheduleTool(this._div, this._inspector));
	        };
	        c.prototype.getPixelWidth = function() {
	            var a = 0;
	            for (var b = 0, c = this._tools; b < c.length; b++) {
	                var d = c[b];
	                a += d.getPixelWidth();
	            }
	            return a;
	        };
	        return c;
	    }(a.BasicElement);
	    a.Toolbar = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(a, c) {
	            b.call(this);
	            this._children = [];
	            this._tab = a;
	            this._adapter = c;
	            this._tools = this._adapter.getTools();
	            this._build();
	        }
	        Object.defineProperty(c.prototype, "id", {
	            get: function() {
	                return this._adapter.id();
	            },
	            enumerable: true,
	            configurable: true
	        });
	        c.prototype.add = function(a) {
	            this._children.push(a);
	            this.update();
	        };
	        c.prototype.compareTo = function(a) {
	            var b = this.id;
	            var c = a.id;
	            return b.localeCompare(c, [], {
	                numeric: true
	            });
	        };
	        c.prototype.correspondsTo = function(a) {
	            return this._adapter.correspondsTo(a);
	        };
	        c.prototype.fold = function() {
	            if (this._children.length > 0) {
	                for (var a = 0, b = this._children; a < b.length; a++) {
	                    var c = b[a];
	                    c.toHtml().style.display = "none";
	                }
	                this._div.classList.add("folded");
	                this._div.classList.remove("unfolded");
	            }
	        };
	        c.prototype.unfold = function() {
	            if (this._children.length > 0) {
	                for (var a = 0, b = this._children; a < b.length; a++) {
	                    var c = b[a];
	                    c.toHtml().style.display = "block";
	                }
	                this._div.classList.add("unfolded");
	                this._div.classList.remove("folded");
	            }
	        };
	        c.prototype._build = function() {
	            this._div.className = "line";
	            for (var b = 0, c = this._tools; b < c.length; b++) {
	                var d = c[b];
	                this._div.appendChild(d.toHtml());
	            }
	            var e = a.Inspector.DOCUMENT.createElement("span");
	            e.textContent = this._adapter.id();
	            this._div.appendChild(e);
	            var f = a.Inspector.DOCUMENT.createElement("span");
	            f.className = "property-type";
	            f.textContent = " - " + this._adapter.type();
	            this._div.appendChild(f);
	            this._lineContent = a.Helpers.CreateDiv("line-content", this._div);
	            this._addEvent();
	        };
	        c.prototype.getDetails = function() {
	            return this._adapter.getProperties();
	        };
	        c.prototype.update = function() {
	            a.Helpers.CleanDiv(this._lineContent);
	            for (var b = 0, c = this._children; b < c.length; b++) {
	                var d = c[b];
	                var e = d.toHtml();
	                this._lineContent.appendChild(e);
	            }
	            if (this._children.length > 0) {
	                if (!this._div.classList.contains("folded") && !this._div.classList.contains("unfolded")) {
	                    this._div.classList.add("folded");
	                }
	            }
	            this.fold();
	        };
	        c.prototype._addEvent = function() {
	            var a = this;
	            this._div.addEventListener("click", function(b) {
	                a._tab.select(a);
	                if (a._isFolded()) {
	                    a.unfold();
	                } else {
	                    a.fold();
	                }
	                b.stopPropagation();
	            });
	            this._div.addEventListener("mouseover", function(b) {
	                a._tab.highlightNode(a);
	                b.stopPropagation();
	            });
	            this._div.addEventListener("mouseout", function(b) {
	                a._tab.highlightNode();
	            });
	        };
	        c.prototype.highlight = function(a) {
	            if (!a) {
	                for (var b = 0, c = this._children; b < c.length; b++) {
	                    var d = c[b];
	                    d._adapter.highlight(a);
	                }
	            }
	            this._adapter.highlight(a);
	        };
	        c.prototype._isFolded = function() {
	            return !this._div.classList.contains("unfolded");
	        };
	        c.prototype.active = function(a) {
	            this._div.classList.remove("active");
	            for (var b = 0, c = this._children; b < c.length; b++) {
	                var d = c[b];
	                d.active(false);
	            }
	            if (a) {
	                this._div.classList.add("active");
	            }
	        };
	        return c;
	    }(a.BasicElement);
	    a.TreeItem = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var INSPECTOR;

	(function(a) {
	    var b = function() {
	        function b() {
	            this._on = false;
	            this._elem = a.Inspector.DOCUMENT.createElement("i");
	            this._elem.className = "treeTool fa";
	            this._addEvents();
	        }
	        b.prototype.toHtml = function() {
	            return this._elem;
	        };
	        b.prototype._addEvents = function() {
	            var a = this;
	            this._elem.addEventListener("click", function(b) {
	                a.action();
	                b.stopPropagation();
	            });
	        };
	        b.prototype.action = function() {
	            this._on = !this._on;
	        };
	        return b;
	    }();
	    a.AbstractTreeTool = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b) {
	            a.call(this);
	            this._obj = b;
	            this._elem.classList.add("fa-square-o");
	            this._on = this._obj.isBoxVisible();
	            this._check();
	        }
	        b.prototype.action = function() {
	            a.prototype.action.call(this);
	            this._check();
	        };
	        b.prototype._check = function() {
	            if (this._on) {
	                this._elem.classList.add("active");
	            } else {
	                this._elem.classList.remove("active");
	            }
	            this._obj.setBoxVisible(this._on);
	        };
	        return b;
	    }(a.AbstractTreeTool);
	    a.BoundingBox = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b) {
	            a.call(this);
	            this._obj = b;
	            this._elem.classList.add("fa-eye");
	            this._on = this._obj.isVisible();
	            this._check();
	        }
	        b.prototype.action = function() {
	            a.prototype.action.call(this);
	            this._check();
	        };
	        b.prototype._check = function() {
	            if (this._on) {
	                this._elem.classList.add("fa-eye");
	                this._elem.classList.add("active");
	                this._elem.classList.remove("fa-eye-slash");
	            } else {
	                this._elem.classList.remove("fa-eye");
	                this._elem.classList.remove("active");
	                this._elem.classList.add("fa-eye-slash");
	            }
	            this._obj.setVisible(this._on);
	        };
	        return b;
	    }(a.AbstractTreeTool);
	    a.Checkbox = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(a) {
	        __extends(b, a);
	        function b(b) {
	            a.call(this);
	            this._obj = b;
	            this._elem.classList.add("fa-wrench");
	        }
	        b.prototype.action = function() {
	            a.prototype.action.call(this);
	            if (this._on) {
	                this._elem.classList.add("active");
	            } else {
	                this._elem.classList.remove("active");
	            }
	            this._obj.debug(this._on);
	        };
	        return b;
	    }(a.AbstractTreeTool);
	    a.DebugArea = b;
	})(INSPECTOR || (INSPECTOR = {}));

	var __extends = this && this.__extends || function(a, b) {
	    for (var c in b) if (b.hasOwnProperty(c)) a[c] = b[c];
	    function d() {
	        this.constructor = a;
	    }
	    a.prototype = b === null ? Object.create(b) : (d.prototype = b.prototype, new d());
	};

	var INSPECTOR;

	(function(a) {
	    var b = function(b) {
	        __extends(c, b);
	        function c(c) {
	            b.call(this);
	            this._obj = c;
	            this._elem.classList.add("fa-info-circle");
	            this._tooltip = new a.Tooltip(this._elem, this._obj.getInfo());
	        }
	        c.prototype.action = function() {
	            b.prototype.action.call(this);
	        };
	        return c;
	    }(a.AbstractTreeTool);
	    a.Info = b;
	})(INSPECTOR || (INSPECTOR = {}));

	/*** EXPORTS FROM exports-loader ***/
	module.exports = INSPECTOR;

/***/ }
/******/ ])
});
;