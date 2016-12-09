var INSPECTOR =
/******/ (function(modules) { // webpackBootstrap
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
	module.exports = __webpack_require__(5);


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
			module.hot.accept("!!./../../../Tools/Gulp/node_modules/css-loader/index.js!./babylon.inspector.css", function() {
				var newContent = require("!!./../../../Tools/Gulp/node_modules/css-loader/index.js!./babylon.inspector.css");
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
	exports.push([module.id, ".insp-wrapper {\n  user-select: none;\n  display: flex;\n  font-size: 0.9em;\n  font-family: \"Inconsolata\", sans-serif;\n  /**\r\n * A tool contained in the tree panel (available for each item of the tree)\r\n */\n  /**\r\n * The toolbar contains : \r\n * - a refresh tool - refresh the whole panel\r\n * - a popup tool - Open the inspector in a new panel\r\n * ...\r\n */ }\n  .insp-wrapper .gutter {\n    background-color: #2c2c2c; }\n    .insp-wrapper .gutter.gutter-vertical {\n      cursor: ns-resize; }\n    .insp-wrapper .gutter.gutter-horizontal {\n      cursor: ew-resize; }\n  .insp-wrapper .insp-right-panel {\n    width: 750px;\n    display: flex;\n    flex-direction: column;\n    flex-shrink: 0; }\n    .insp-wrapper .insp-right-panel .top-panel {\n      width: 100%;\n      height: 100%;\n      position: relative;\n      background-color: #242424;\n      color: #ccc;\n      font-size: 1em; }\n      .insp-wrapper .insp-right-panel .top-panel .tab-panel-content {\n        width: 100%;\n        height: calc(100% - 32px); }\n      .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel {\n        position: absolute;\n        z-index: 10;\n        top: 32px;\n        right: 0;\n        width: 100px;\n        display: none;\n        flex-direction: column;\n        align-items: center;\n        justify-content: center;\n        border: 1px solid #454545;\n        background-color: #242424; }\n        .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab {\n          height: 25px;\n          width: 100%;\n          line-height: 25px;\n          text-align: center;\n          background-color: #2c2c2c;\n          cursor: pointer; }\n          .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab:hover {\n            background-color: #383838; }\n          .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab:active {\n            background-color: #454545; }\n  .insp-wrapper .tooltip {\n    position: absolute;\n    top: 0;\n    right: 0;\n    color: #f29766;\n    display: none;\n    z-index: 4;\n    font-family: \"Inconsolata\", sans-serif;\n    padding: 2px;\n    background-color: #242424;\n    border: 1px solid #454545; }\n  .insp-wrapper .treeTool {\n    margin: 3px 8px 3px 3px;\n    cursor: pointer;\n    position: relative; }\n    .insp-wrapper .treeTool:hover {\n      color: #5db0d7; }\n    .insp-wrapper .treeTool.active {\n      color: #5db0d7; }\n  .insp-wrapper .tab-panel {\n    height: 100%; }\n    .insp-wrapper .tab-panel .scene-actions {\n      overflow-y: auto; }\n      .insp-wrapper .tab-panel .scene-actions .actions-title {\n        font-size: 1.1em;\n        padding-bottom: 10px;\n        border-bottom: 1px solid #5db0d7;\n        margin: 10px 0 10px 0; }\n      .insp-wrapper .tab-panel .scene-actions .defaut-action, .insp-wrapper .tab-panel .scene-actions .action-radio, .insp-wrapper .tab-panel .scene-actions .action {\n        height: 20px;\n        line-height: 20px;\n        width: 100%;\n        cursor: pointer; }\n        .insp-wrapper .tab-panel .scene-actions .defaut-action:hover, .insp-wrapper .tab-panel .scene-actions .action-radio:hover, .insp-wrapper .tab-panel .scene-actions .action:hover {\n          background-color: #2c2c2c; }\n        .insp-wrapper .tab-panel .scene-actions .defaut-action:active, .insp-wrapper .tab-panel .scene-actions .action-radio:active, .insp-wrapper .tab-panel .scene-actions .action:active {\n          background-color: #383838; }\n      .insp-wrapper .tab-panel .scene-actions .action-radio:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F10C\";\n        margin-right: 10px; }\n      .insp-wrapper .tab-panel .scene-actions .action-radio.active:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F192\";\n        color: #5db0d7;\n        margin-right: 10px; }\n      .insp-wrapper .tab-panel .scene-actions .action:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F096\";\n        margin-right: 10px; }\n      .insp-wrapper .tab-panel .scene-actions .action.active:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F14A\";\n        color: #5db0d7;\n        margin-right: 10px; }\n  .insp-wrapper .tab-panel .shader-tree-panel {\n    height: 30px; }\n    .insp-wrapper .tab-panel .shader-tree-panel select {\n      height: 30px;\n      background-color: transparent;\n      color: #ccc;\n      height: 30px;\n      width: 100%;\n      max-width: 300px;\n      padding-left: 15px;\n      border: 1px solid #2c2c2c;\n      outline: 1px solid #454545; }\n      .insp-wrapper .tab-panel .shader-tree-panel select option {\n        padding: 5px;\n        color: gray; }\n  .insp-wrapper .tab-panel .shader-panel {\n    min-height: 100px;\n    user-select: text;\n    box-sizing: border-box;\n    padding: 0 15px; }\n    .insp-wrapper .tab-panel .shader-panel pre {\n      margin: 0;\n      white-space: pre-wrap; }\n      .insp-wrapper .tab-panel .shader-panel pre code {\n        background-color: #242424 !important;\n        padding: 0;\n        margin: 0; }\n    .insp-wrapper .tab-panel .shader-panel .shader-panel-title {\n      height: 25px;\n      border-bottom: 1px solid #383838;\n      text-transform: uppercase;\n      line-height: 25px;\n      margin-bottom: 10px; }\n  .insp-wrapper .tab-panel.stats-panel {\n    overflow-y: auto; }\n  .insp-wrapper .tab-panel .stat-title1 {\n    font-size: 1.1em;\n    padding: 10px; }\n  .insp-wrapper .tab-panel .stat-title2 {\n    margin: 10px 0 10px 0;\n    font-size: 1.05em;\n    border-bottom: 1px solid #5db0d7;\n    box-sizing: border-box; }\n  .insp-wrapper .tab-panel .stat-label {\n    display: inline-block;\n    width: 80%;\n    padding: 2px;\n    background-color: #2c2c2c;\n    border-bottom: 1px solid #242424;\n    border-top: 1px solid #242424;\n    height: 30px;\n    line-height: 30px;\n    box-sizing: border-box; }\n  .insp-wrapper .tab-panel .stat-value {\n    display: inline-block;\n    width: 20%;\n    padding: 2px;\n    background-color: #2c2c2c;\n    border-top: 1px solid #242424;\n    border-bottom: 1px solid #242424;\n    height: 30px;\n    line-height: 30px;\n    box-sizing: border-box; }\n  .insp-wrapper .tab-panel .stat-infos {\n    width: 100%;\n    padding: 4px; }\n  .insp-wrapper .property-type {\n    color: #5db0d7; }\n  .insp-wrapper .property-name, .insp-wrapper .insp-details .base-row .prop-name, .insp-wrapper .insp-details .row .prop-name, .insp-wrapper .insp-details .header-row .prop-name {\n    color: #f29766; }\n  .insp-wrapper .insp-tree {\n    overflow-y: auto;\n    overflow-x: hidden;\n    height: calc(50% - 32px - 30px); }\n    .insp-wrapper .insp-tree .line {\n      cursor: pointer; }\n      .insp-wrapper .insp-tree .line:hover {\n        background-color: #2c2c2c; }\n      .insp-wrapper .insp-tree .line.active {\n        background-color: #454545; }\n        .insp-wrapper .insp-tree .line.active .line-content {\n          background-color: #242424; }\n      .insp-wrapper .insp-tree .line.unfolded:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F078\"; }\n      .insp-wrapper .insp-tree .line.folded:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F054\"; }\n      .insp-wrapper .insp-tree .line .line-content {\n        padding-left: 15px; }\n        .insp-wrapper .insp-tree .line .line-content:hover {\n          background-color: #242424; }\n        .insp-wrapper .insp-tree .line .line-content .line:hover:first-child {\n          background-color: #383838; }\n  .insp-wrapper .insp-details {\n    background-color: #242424;\n    overflow-y: auto;\n    overflow-x: hidden;\n    color: #ccc;\n    font-family: \"Inconsolata\", sans-serif; }\n    .insp-wrapper .insp-details .base-row, .insp-wrapper .insp-details .row, .insp-wrapper .insp-details .header-row {\n      display: flex;\n      width: 100%; }\n      .insp-wrapper .insp-details .base-row .base-property, .insp-wrapper .insp-details .row .base-property, .insp-wrapper .insp-details .header-row .base-property, .insp-wrapper .insp-details .base-row .prop-name, .insp-wrapper .insp-details .row .prop-name, .insp-wrapper .insp-details .header-row .prop-name, .insp-wrapper .insp-details .base-row .prop-value, .insp-wrapper .insp-details .row .prop-value, .insp-wrapper .insp-details .header-row .prop-value {\n        word-wrap: break-word;\n        padding: 2px 0 2px 0; }\n      .insp-wrapper .insp-details .base-row .prop-name, .insp-wrapper .insp-details .row .prop-name, .insp-wrapper .insp-details .header-row .prop-name {\n        width: 35%; }\n      .insp-wrapper .insp-details .base-row .prop-value, .insp-wrapper .insp-details .row .prop-value, .insp-wrapper .insp-details .header-row .prop-value {\n        width: 59%;\n        padding-left: 10px; }\n        .insp-wrapper .insp-details .base-row .prop-value.clickable, .insp-wrapper .insp-details .row .prop-value.clickable, .insp-wrapper .insp-details .header-row .prop-value.clickable {\n          cursor: pointer; }\n          .insp-wrapper .insp-details .base-row .prop-value.clickable:hover, .insp-wrapper .insp-details .row .prop-value.clickable:hover, .insp-wrapper .insp-details .header-row .prop-value.clickable:hover {\n            background-color: #383838; }\n          .insp-wrapper .insp-details .base-row .prop-value.clickable:after, .insp-wrapper .insp-details .row .prop-value.clickable:after, .insp-wrapper .insp-details .header-row .prop-value.clickable:after {\n            font-family: 'FontAwesome', sans-serif;\n            content: \"\\A0   \\A0   \\A0   \\F054\"; }\n    .insp-wrapper .insp-details .row:nth-child(even) {\n      background-color: #2c2c2c; }\n    .insp-wrapper .insp-details .row.unfolded .prop-value.clickable:after {\n      font-family: 'FontAwesome', sans-serif;\n      content: \"\\A0   \\A0   \\A0   \\F078\"; }\n    .insp-wrapper .insp-details .header-row {\n      background-color: #2c2c2c;\n      color: #ccc;\n      width: 100%; }\n      .insp-wrapper .insp-details .header-row > * {\n        color: #ccc !important;\n        padding: 5px 0 5px 5px !important;\n        cursor: pointer; }\n        .insp-wrapper .insp-details .header-row > *:hover {\n          background-color: #383838; }\n      .insp-wrapper .insp-details .header-row .header-col {\n        display: flex;\n        justify-content: space-between;\n        align-items: center; }\n        .insp-wrapper .insp-details .header-row .header-col .sort-direction {\n          margin-right: 5px; }\n    .insp-wrapper .insp-details .element-viewer, .insp-wrapper .insp-details .color-element, .insp-wrapper .insp-details .texture-element {\n      position: relative;\n      width: 10px;\n      height: 10px;\n      display: inline-block;\n      margin-left: 5px; }\n    .insp-wrapper .insp-details .texture-element {\n      color: #f29766;\n      margin-left: 10px; }\n      .insp-wrapper .insp-details .texture-element .texture-viewer {\n        color: #ccc;\n        position: absolute;\n        z-index: 10;\n        bottom: 0;\n        right: 0;\n        display: block;\n        width: 150px;\n        height: 150px;\n        border: 1px solid #454545;\n        background-color: #242424;\n        transform: translateX(100%) translateY(100%);\n        display: none;\n        flex-direction: column;\n        justify-content: flex-start;\n        align-items: center; }\n        .insp-wrapper .insp-details .texture-element .texture-viewer .texture-viewer-img {\n          margin: 10px 0 10px 0;\n          max-width: 110px;\n          max-height: 110px; }\n  .insp-wrapper .tabbar {\n    height: 32px;\n    display: flex;\n    align-items: center;\n    border-bottom: 1px solid #383838;\n    width: 100%;\n    overflow-x: auto;\n    overflow-y: hidden;\n    box-sizing: border-box; }\n    .insp-wrapper .tabbar .tab {\n      height: calc(32px - 2px);\n      width: auto;\n      padding: 0 10px 0 10px;\n      color: #ccc;\n      line-height: 32px;\n      text-align: center;\n      cursor: pointer;\n      margin: 0 5px 0 5px;\n      box-sizing: border-box; }\n      .insp-wrapper .tabbar .tab:hover {\n        border-bottom: 1px solid #f29766;\n        background-color: #2c2c2c; }\n      .insp-wrapper .tabbar .tab:active {\n        background-color: #383838; }\n      .insp-wrapper .tabbar .tab.active {\n        border-bottom: 1px solid #f29766; }\n    .insp-wrapper .tabbar .more-tabs {\n      width: 32px;\n      height: 32px;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      cursor: pointer;\n      position: relative;\n      border-right: 1px solid #383838; }\n      .insp-wrapper .tabbar .more-tabs:hover {\n        background-color: #383838; }\n      .insp-wrapper .tabbar .more-tabs:active {\n        color: #f29766;\n        background-color: #454545; }\n      .insp-wrapper .tabbar .more-tabs.active {\n        color: #f29766; }\n  .insp-wrapper .toolbar {\n    display: flex; }\n    .insp-wrapper .toolbar .tool {\n      width: 32px;\n      height: 32px;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      cursor: pointer;\n      position: relative;\n      border-right: 1px solid #383838; }\n      .insp-wrapper .toolbar .tool:hover {\n        background-color: #383838; }\n      .insp-wrapper .toolbar .tool:active {\n        color: #f29766;\n        background-color: #454545; }\n      .insp-wrapper .toolbar .tool.active {\n        color: #f29766; }\n  .insp-wrapper .searchbar {\n    border: 1px solid #2c2c2c;\n    margin-bottom: 5px;\n    display: flex;\n    align-items: center;\n    color: #b3b3b3; }\n    .insp-wrapper .searchbar input {\n      background-color: #242424;\n      border: none;\n      width: 100%;\n      outline: none;\n      font-family: \"Inconsolata\", sans-serif;\n      color: #b3b3b3;\n      padding: 3px 0 3px 10px;\n      margin: 6px 0 6px 0; }\n", ""]);

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

	/*** IMPORTS FROM imports-loader ***/
	var Split = __webpack_require__(6);

	var INSPECTOR;!(function(e){var t=(function(){function t(i,n){var s=this;if(this._popupMode=!1,this._scene=i,t.DOCUMENT=window.document,n)this._buildInspector(n);else{var r=this._scene.getEngine().getRenderingCanvas(),a=r.parentElement,o=window.getComputedStyle(r);this._canvasSize={width:o.width,height:o.height},this._c2diwrapper=e.Helpers.CreateDiv("insp-wrapper",a),this._c2diwrapper.style.width=this._canvasSize.width,this._c2diwrapper.style.height=this._canvasSize.height,this._c2diwrapper.appendChild(r);var l=e.Helpers.CreateDiv("insp-right-panel",this._c2diwrapper);Split([r,l],{direction:"horizontal",sizes:[75,25],onDrag:function(){e.Helpers.SEND_EVENT("resize"),s._tabbar&&s._tabbar.updateWidth()}}),this._buildInspector(l),e.Helpers.SEND_EVENT("resize")}this.refresh()}return t.prototype._buildInspector=function(t){this._tabbar=new e.TabBar(this),this._topPanel=e.Helpers.CreateDiv("top-panel",t),this._topPanel.appendChild(this._tabbar.toHtml()),this._tabbar.updateWidth(),this._tabPanel=e.Helpers.CreateDiv("tab-panel-content",this._topPanel)},Object.defineProperty(t.prototype,"scene",{get:function(){return this._scene},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"popupMode",{get:function(){return this._popupMode},enumerable:!0,configurable:!0}),t.prototype.filterItem=function(e){this._tabbar.getActiveTab().filter(e)},t.prototype.displayObjectDetails=function(e){this._tabbar.switchMeshTab(e)},t.prototype.refresh=function(){e.Helpers.CleanDiv(this._tabPanel);var t=this._tabbar.getActiveTab();t.update(),this._tabPanel.appendChild(t.getPanel()),e.Helpers.SEND_EVENT("resize")},t.prototype.dispose=function(){if(!this._popupMode){var t=this._scene.getEngine().getRenderingCanvas();t.style.width=this._canvasSize.width,t.style.height=this._canvasSize.height;var i=t.parentElement.parentElement;i.appendChild(t),e.Helpers.CleanDiv(this._c2diwrapper),this._c2diwrapper.remove(),e.Helpers.SEND_EVENT("resize")}},t.prototype.openPopup=function(){var i=window.open("","Babylon.js INSPECTOR","toolbar=no,resizable=yes,menubar=no,width=750,height=1000");i.document.title="Babylon.js INSPECTOR";for(var n=t.DOCUMENT.querySelectorAll("style"),s=0;s<n.length;s++)i.document.body.appendChild(n[s].cloneNode(!0));for(var r=document.querySelectorAll("link"),a=0;a<r.length;a++){var o=i.document.createElement("link");o.rel="stylesheet",o.href=r[a].href,i.document.head.appendChild(o)}this.dispose(),this._popupMode=!0,t.DOCUMENT=i.document,this._c2diwrapper=e.Helpers.CreateDiv("insp-wrapper",i.document.body);var l=e.Helpers.CreateDiv("insp-right-panel",this._c2diwrapper);this._buildInspector(l),this.refresh()},t})();e.Inspector=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){e.PROPERTIES={format:function(t){var i=e.Helpers.GET_TYPE(t)||"default";return e.PROPERTIES[i]&&e.PROPERTIES[i].format?e.PROPERTIES[i].format(t):e.Helpers.GET_TYPE(t)},Vector2:{properties:["x","y"],format:function(t){return"x:"+e.Helpers.Trunc(t.x)+", y:"+e.Helpers.Trunc(t.y)}},Vector3:{properties:["x","y","z"],format:function(t){return"x:"+e.Helpers.Trunc(t.x)+", y:"+e.Helpers.Trunc(t.y)+", z:"+e.Helpers.Trunc(t.z)}},Color3:{properties:["r","g","b"],format:function(e){return"R:"+e.r+", G:"+e.g+", B:"+e.b}},Quaternion:{properties:["x","y","z","w"]},Size:{properties:["width","height"],format:function(t){return"Size - w:"+e.Helpers.Trunc(t.width)+", h:"+e.Helpers.Trunc(t.height)}},Texture:{properties:["hasAlpha","level","name","wrapU","wrapV","uScale","vScale","uAng","vAng","wAng","uOffset","vOffset"]},ArcRotateCamera:{properties:["alpha","beta","radius"]},Scene:{properties:["actionManager","activeCamera","ambientColor","clearColor"]},Mesh:{properties:["name","position","rotation","rotationQuaternion","absolutePosition","material"],format:function(e){return e.name}},StandardMaterial:{properties:["name","alpha","alphaMode","wireframe","isFrozen","zOffset","ambientColor","emissiveColor","diffuseColor","specularColor","specularPower","useAlphaFromDiffuseTexture","linkEmissiveWithDiffuse","useSpecularOverAlpha","diffuseFresnelParameters","opacityFresnelParameters","reflectionFresnelParameters","refractionFresnelParameters","emissiveFresnelParameters","diffuseTexture","emissiveTexture","specularTexture","ambientTexture","bumpTexture","lightMapTexture","opacityTexture","reflectionTexture","refractionTexture"],format:function(e){return e.name}},PrimitiveAlignment:{properties:["horizontal","vertical"]},PrimitiveThickness:{properties:["topPixels","leftPixels","rightPixels","bottomPixels"]},BoundingInfo2D:{properties:["radius","center","extent"]},SolidColorBrush2D:{properties:["color"]},GradientColorBrush2D:{properties:["color1","color2","translation","rotation","scale"]},PBRMaterial:{properties:["name","albedoColor","albedoTexture","opacityTexture","reflectionTexture","emissiveTexture","bumpTexture","lightmapTexture","opacityFresnelParameters","emissiveFresnelParameters","linkEmissiveWithAlbedo","useLightmapAsShadowmap","useAlphaFromAlbedoTexture","useSpecularOverAlpha","useAutoMicroSurfaceFromReflectivityMap","useLogarithmicDepth","reflectivityColor","reflectivityTexture","reflectionTexture","reflectionColor","alpha","linkRefractionWithTransparency","indexOfRefraction","microSurface","useMicroSurfaceFromReflectivityMapAlpha","directIntensity","emissiveIntensity","specularIntensity","environmentIntensity","cameraExposure","cameraContrast","cameraColorGradingTexture","cameraColorCurves"]}}})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(){this._div=e.Helpers.CreateDiv()}return t.prototype.toHtml=function(){return this._div},t.prototype._build=function(){},t.prototype.dispose=function(){},t})();e.BasicElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function e(e){this._obj=e}return Object.defineProperty(e.prototype,"actualObject",{get:function(){return this._obj},enumerable:!0,configurable:!0}),e.prototype.correspondsTo=function(e){return e===this._obj},Object.defineProperty(e.prototype,"name",{get:function(){return e._name},enumerable:!0,configurable:!0}),e.prototype.highlight=function(e){},e._name=BABYLON.Geometry.RandomId(),e})();e.Adapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e){t.call(this,e)}return __extends(i,t),i.prototype.id=function(){var e="";return this._obj.id&&(e=this._obj.id),e},i.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},i.prototype.getProperties=function(){var t=this,i=[];if(this._obj.propDic){var n=this._obj.propDic;n.forEach((function(n,s){var r=new e.Property(n,t.actualObject);i.push(new e.PropertyLine(r))}))}for(var s=["actualZOffset","isSizeAuto","layoutArea","layoutAreaPos","contentArea","marginOffset","paddingOffset","isPickable","isContainer","boundingInfo","levelBoundingInfo","isSizedByContent","isPositionAuto","actualScale","layoutBoundingInfo"],r=0,a=s;r<a.length;r++){var o=a[r],l=new e.Property(o,this.actualObject);i.push(new e.PropertyLine(l))}return i},i.prototype.getTools=function(){var t=[];return t.push(new e.Checkbox(this)),t.push(new e.DebugArea(this)),t},i.prototype.setVisible=function(e){this._obj.levelVisible=e},i.prototype.isVisible=function(){return this._obj.levelVisible},i.prototype.debug=function(e){this._obj.displayDebugAreas=e},i.prototype.highlight=function(e){},i})(e.Adapter);e.Canvas2DAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e){t.call(this,e)}return __extends(i,t),i.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},i.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},i.prototype.getProperties=function(){for(var t=[],n=0,s=i._PROPERTIES;n<s.length;n++){var r=s[n],a=new e.Property(r,this._obj);t.push(new e.PropertyLine(a))}return t},i.prototype.getTools=function(){var t=[];return t.push(new e.Checkbox(this)),t},i.prototype.setVisible=function(e){this._obj.setEnabled(e)},i.prototype.isVisible=function(){return this._obj.isEnabled()},i.prototype.highlight=function(e){this.actualObject.renderOutline=e,this.actualObject.outlineWidth=.25,this.actualObject.outlineColor=BABYLON.Color3.Yellow()},i._PROPERTIES=["position","diffuse","intensity","radius","range","specular"],i})(e.Adapter);e.LightAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e){t.call(this,e)}return __extends(i,t),i.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},i.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},i.prototype.getProperties=function(){var t=[],i=[];this._obj instanceof BABYLON.StandardMaterial?i=e.PROPERTIES.StandardMaterial.properties:this._obj instanceof BABYLON.PBRMaterial&&(i=e.PROPERTIES.PBRMaterial.properties);for(var n=0,s=i;n<s.length;n++){var r=s[n],a=new e.Property(r,this._obj);t.push(new e.PropertyLine(a))}return t},i.prototype.getTools=function(){return[]},i.prototype.highlight=function(e){for(var t=this.actualObject,i=t.getBindedMeshes(),n=0,s=i;n<s.length;n++){var r=s[n];r.renderOutline=e,r.outlineWidth=.25,r.outlineColor=BABYLON.Color3.Yellow()}},i})(e.Adapter);e.MaterialAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e){t.call(this,e),this._axis=[]}return __extends(i,t),i.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},i.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},i.prototype.getProperties=function(){for(var t=[],i=0,n=e.PROPERTIES.Mesh.properties;i<n.length;i++){var s=n[i],r=new e.Property(s,this._obj);t.push(new e.PropertyLine(r))}return t},i.prototype.getTools=function(){var t=[];return t.push(new e.Checkbox(this)),t.push(new e.DebugArea(this)),t.push(new e.BoundingBox(this)),t.push(new e.Info(this)),t},i.prototype.setVisible=function(e){this._obj.setEnabled(e),this._obj.isVisible=e},i.prototype.isVisible=function(){return this._obj.isEnabled()&&this._obj.isVisible},i.prototype.isBoxVisible=function(){return this._obj.showBoundingBox},i.prototype.setBoxVisible=function(e){return this._obj.showBoundingBox=e},i.prototype.debug=function(e){0==this._axis.length&&this._drawAxis();for(var t=0,i=this._axis;t<i.length;t++){var n=i[t];n.setEnabled(e)}},i.prototype.getInfo=function(){return this._obj.getTotalVertices()+" vertices"},i.prototype.highlight=function(e){this.actualObject.renderOutline=e,this.actualObject.outlineWidth=.25,this.actualObject.outlineColor=BABYLON.Color3.Yellow()},i.prototype._drawAxis=function(){var e=this;this._obj.computeWorldMatrix();var t=this._obj.getWorldMatrix(),i=new BABYLON.Vector3(8,0,0),n=new BABYLON.Vector3(0,8,0),s=new BABYLON.Vector3(0,0,8),r=function(t,i,n){var s=BABYLON.Mesh.CreateLines("###axis###",[i,n],e._obj.getScene());return s.color=t,s.renderingGroupId=1,s},a=r(BABYLON.Color3.Red(),this._obj.getAbsolutePosition(),BABYLON.Vector3.TransformCoordinates(i,t));a.position.subtractInPlace(this._obj.position),a.parent=this._obj,this._axis.push(a);var o=r(BABYLON.Color3.Green(),this._obj.getAbsolutePosition(),BABYLON.Vector3.TransformCoordinates(n,t));o.parent=this._obj,o.position.subtractInPlace(this._obj.position),this._axis.push(o);var l=r(BABYLON.Color3.Blue(),this._obj.getAbsolutePosition(),BABYLON.Vector3.TransformCoordinates(s,t));l.parent=this._obj,l.position.subtractInPlace(this._obj.position),this._axis.push(l)},i})(e.Adapter);e.MeshAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e){t.call(this),this._detailRows=[],this._sortDirection={},this._build(),e&&(this._detailRows=e,this.update())}return __extends(i,t),Object.defineProperty(i.prototype,"details",{set:function(e){this.clean(),this._detailRows=e,this.update()},enumerable:!0,configurable:!0}),i.prototype._build=function(){var e=this;this._div.className="insp-details",this._div.id="insp-details",this._createHeaderRow(),this._div.appendChild(this._headerRow),window.addEventListener("resize",(function(t){e._headerRow.style.maxWidth=e._headerRow.parentElement.clientWidth+"px"}))},i.prototype.update=function(){this._sortDetails("name",1),this._addDetails()},i.prototype._addDetails=function(){for(var t=e.Helpers.CreateDiv("details",this._div),i=0,n=this._detailRows;i<n.length;i++){var s=n[i];t.appendChild(s.toHtml())}},i.prototype._sortDetails=function(t,i){for(var n=e.Inspector.DOCUMENT.querySelectorAll(".sort-direction"),s=0;s<n.length;s++)n[s].classList.remove("fa-chevron-up"),n[s].classList.remove("fa-chevron-down");i||!this._sortDirection[t]?this._sortDirection[t]=i||1:this._sortDirection[t]*=-1;var r=this._sortDirection[t];1==r?(this._headerRow.querySelector("#sort-direction-"+t).classList.remove("fa-chevron-down"),this._headerRow.querySelector("#sort-direction-"+t).classList.add("fa-chevron-up")):(this._headerRow.querySelector("#sort-direction-"+t).classList.remove("fa-chevron-up"),this._headerRow.querySelector("#sort-direction-"+t).classList.add("fa-chevron-down"));var a=function(e){return"string"==typeof e||e instanceof String};this._detailRows.sort((function(e,i){var n=String(e[t]),s=String(i[t]);return a(n)||(n=e[t].toString()),a(s)||(s=i[t].toString()),n.localeCompare(s,[],{numeric:!0})*r}))},i.prototype.clean=function(){for(var t=0,i=this._detailRows;t<i.length;t++){var n=i[t];n.dispose()}e.Helpers.CleanDiv(this._div),this._div.appendChild(this._headerRow)},i.prototype.dispose=function(){for(var e=0,t=this._detailRows;e<t.length;e++){var i=t[e];i.dispose()}},i.prototype._createHeaderRow=function(){var t=this;this._headerRow=e.Helpers.CreateDiv("header-row");var i=function(i,n){var s=e.Helpers.CreateDiv(n+" header-col"),r=e.Inspector.DOCUMENT.createElement("span");r.textContent=i.charAt(0).toUpperCase()+i.slice(1);var a=e.Inspector.DOCUMENT.createElement("i");return a.className="sort-direction fa",a.id="sort-direction-"+i,s.appendChild(r),s.appendChild(a),s.addEventListener("click",(function(e){t._sortDetails(i),t._addDetails()})),s};this._headerRow.appendChild(i("name","prop-name")),this._headerRow.appendChild(i("value","prop-value"))},i})(e.BasicElement);e.DetailPanel=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(e,t){this._property=e,this._obj=t}return Object.defineProperty(t.prototype,"name",{get:function(){return this._property},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"value",{get:function(){return this._obj[this._property]},set:function(e){this._obj[this._property]=e},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"type",{get:function(){return e.Helpers.GET_TYPE(this.value)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"obj",{get:function(){return this._obj},set:function(e){this._obj=e},enumerable:!0,configurable:!0}),t})();e.Property=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function e(){}return e.format=function(e,t){var i=e[t];if(e instanceof BABYLON.PrimitiveAlignment)if("horizontal"===t)switch(i){case BABYLON.PrimitiveAlignment.AlignLeft:return"left";case BABYLON.PrimitiveAlignment.AlignRight:return"right";case BABYLON.PrimitiveAlignment.AlignCenter:return"center";case BABYLON.PrimitiveAlignment.AlignStretch:return"stretch"}else if("vertical"===t)switch(i){case BABYLON.PrimitiveAlignment.AlignTop:return"top";case BABYLON.PrimitiveAlignment.AlignBottom:return"bottom";case BABYLON.PrimitiveAlignment.AlignCenter:return"center";case BABYLON.PrimitiveAlignment.AlignStretch:return"stretch"}return i},e})();e.PropertyFormatter=t;var i=(function(){function i(t,i,n){void 0===n&&(n=0),this._children=[],this._elements=[],this._property=t,this._level=n,this._parent=i,this._div=e.Helpers.CreateDiv("row"),this._div.style.marginLeft=this._level+"px";var s=e.Helpers.CreateDiv("prop-name",this._div);s.textContent=""+this.name,this._valueDiv=e.Helpers.CreateDiv("prop-value",this._div),this._valueDiv.textContent=this._displayValueContent()||"-",this._createElements();for(var r=0,a=this._elements;r<a.length;r++){var o=a[r];this._valueDiv.appendChild(o.toHtml())}this._updateValue(),this._isSimple()?(this._initInput(),this._valueDiv.addEventListener("click",this._displayInputHandler),this._input.addEventListener("keypress",this._validateInputHandler)):(this._valueDiv.classList.add("clickable"),this._valueDiv.addEventListener("click",this._addDetails.bind(this))),e.Scheduler.getInstance().add(this)}return i.prototype._initInput=function(){this._input=document.createElement("input"),this._input.setAttribute("type","text"),this._displayInputHandler=this._displayInput.bind(this),this._validateInputHandler=this._validateInput.bind(this)},i.prototype._validateInput=function(t){if(13==t.keyCode){var i=this._input.value;this.updateObject(),this._property.value=i,this.update(),e.Scheduler.getInstance().pause=!1}else 27==t.keyCode&&this.update()},i.prototype._removeInputWithoutValidating=function(){e.Helpers.CleanDiv(this._valueDiv),this._valueDiv.textContent="-";for(var t=0,i=this._elements;t<i.length;t++){var n=i[t];this._valueDiv.appendChild(n.toHtml())}this._valueDiv.addEventListener("click",this._displayInputHandler)},i.prototype._displayInput=function(t){this._valueDiv.removeEventListener("click",this._displayInputHandler);var i=this._valueDiv.textContent;this._valueDiv.textContent="",this._input.value=i,this._valueDiv.appendChild(this._input),e.Scheduler.getInstance().pause=!0},i.prototype.updateObject=function(){return this._parent?void(this._property.obj=this._parent.updateObject()):this._property.value},Object.defineProperty(i.prototype,"name",{get:function(){return this._property.name},enumerable:!0,configurable:!0}),Object.defineProperty(i.prototype,"value",{get:function(){return t.format(this._property.obj,this._property.name)},enumerable:!0,configurable:!0}),Object.defineProperty(i.prototype,"type",{get:function(){return this._property.type},enumerable:!0,configurable:!0}),i.prototype._createElements=function(){"Color3"!=this.type&&"Color4"!=this.type||this._elements.push(new e.ColorElement(this.value)),"Texture"==this.type&&this._elements.push(new e.TextureElement(this.value)),"HDRCubeTexture"==this.type&&this._elements.push(new e.HDRCubeTextureElement(this.value)),"CubeTexture"==this.type&&this._elements.push(new e.CubeTextureElement(this.value))},i.prototype._displayValueContent=function(){var t=this.value;return"number"==typeof t?e.Helpers.Trunc(t):"string"==typeof t||"boolean"==typeof t?t:e.PROPERTIES.format(t)},i.prototype.dispose=function(){e.Scheduler.getInstance().remove(this);for(var t=0,i=this._children;t<i.length;t++){var n=i[t];e.Scheduler.getInstance().remove(n)}for(var s=0,r=this._elements;s<r.length;s++){var a=r[s];a.dispose()}this._elements=[]},i.prototype._updateValue=function(){this.updateObject(),this._valueDiv.childNodes[0].nodeValue=this._displayValueContent();for(var e=0,t=this._elements;e<t.length;e++){var i=t[e];i.update(this.value)}},i.prototype.update=function(){this._removeInputWithoutValidating(),this._updateValue()},i._IS_TYPE_SIMPLE=function(t){var n=e.Helpers.GET_TYPE(t);return i._SIMPLE_TYPE.indexOf(n)!=-1},i.prototype._isSimple=function(){return null==this.value||i._SIMPLE_TYPE.indexOf(this.type)!=-1},i.prototype.toHtml=function(){return this._div},i.prototype._addDetails=function(){if(this._div.classList.contains("unfolded")){this._div.classList.remove("unfolded");for(var t=0,n=this._children;t<n.length;t++){var s=n[t];this._div.parentNode.removeChild(s.toHtml())}}else{if(this._div.classList.toggle("unfolded"),0==this._children.length)for(var r=this.value,a=e.PROPERTIES[e.Helpers.GET_TYPE(r)].properties.reverse(),o=0,l=a;o<l.length;o++){var p=l[o],c=new e.Property(p,this._property.value),s=new i(c,this,this._level+i._MARGIN_LEFT);this._children.push(s)}for(var h=0,u=this._children;h<u.length;h++){var s=u[h];this._div.parentNode.insertBefore(s.toHtml(),this._div.nextSibling)}}},i._SIMPLE_TYPE=["number","string","boolean"],i._MARGIN_LEFT=15,i})();e.PropertyLine=i})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){e.call(this),this._div.className="color-element",this._div.style.backgroundColor=this._toRgba(t)}return __extends(t,e),t.prototype.update=function(e){e&&(this._div.style.backgroundColor=this._toRgba(e))},t.prototype._toRgba=function(e){if(e){var t=255*e.r|0,i=255*e.g|0,n=255*e.b|0,s=1;if(e instanceof BABYLON.Color4){e.a}return"rgba("+t+", "+i+", "+n+", "+s+")"}return""},t})(e.BasicElement);e.ColorElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i){t.call(this),this._pause=!1,this._div.className="fa fa-search texture-element",this._textureDiv=e.Helpers.CreateDiv("texture-viewer",this._div),this._canvas=e.Helpers.CreateElement("canvas","texture-viewer-img",this._textureDiv),i&&(this._textureUrl=i.name),this._div.addEventListener("mouseover",this._showViewer.bind(this,"flex")),this._div.addEventListener("mouseout",this._showViewer.bind(this,"none"))}return __extends(i,t),i.prototype.update=function(e){e&&e.url===this._textureUrl||(e&&(this._textureUrl=e.name),this._engine?(this._cube.material.dispose(!0,!0),this._cube.dispose()):this._initEngine(),this._populateScene())},i.prototype._populateScene=function(){var e=this,t=new BABYLON.CubeTexture(this._textureUrl,this._scene);t.coordinatesMode=BABYLON.Texture.SKYBOX_MODE,this._cube=BABYLON.Mesh.CreateBox("hdrSkyBox",10,this._scene);var i=new BABYLON.StandardMaterial("skyBox",this._scene);i.backFaceCulling=!1,i.reflectionTexture=t,i.reflectionTexture.coordinatesMode=BABYLON.Texture.SKYBOX_MODE,i.disableLighting=!0,this._cube.material=i,this._cube.registerBeforeRender((function(){e._cube.rotation.y+=.01}))},i.prototype._initEngine=function(){var e=this;this._engine=new BABYLON.Engine(this._canvas),this._scene=new BABYLON.Scene(this._engine),this._scene.clearColor=new BABYLON.Color4(0,0,0,0);new BABYLON.FreeCamera("cam",new BABYLON.Vector3(0,0,(-20)),this._scene),new BABYLON.HemisphericLight("",new BABYLON.Vector3(0,1,0),this._scene);this._engine.runRenderLoop((function(){e._pause||e._scene.render()})),this._canvas.setAttribute("width","110"),this._canvas.setAttribute("height","110")},i.prototype._showViewer=function(e){"none"!=e?(this._engine||(this._initEngine(),this._populateScene()),this._pause=!1):this._pause=!0,this._textureDiv.style.display=e},i.prototype.dispose=function(){this._engine&&(this._engine.dispose(),this._engine=null)},i})(e.BasicElement);e.CubeTextureElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){e.call(this,t)}return __extends(t,e),t.prototype._populateScene=function(){var e=this,t=new BABYLON.HDRCubeTexture(this._textureUrl,this._scene,512);t.coordinatesMode=BABYLON.Texture.SKYBOX_MODE,this._cube=BABYLON.Mesh.CreateBox("hdrSkyBox",10,this._scene);var i=new BABYLON.PBRMaterial("skyBox",this._scene);i.backFaceCulling=!1,i.reflectionTexture=t,i.microSurface=1,i.disableLighting=!0,this._cube.material=i,this._cube.registerBeforeRender((function(){e._cube.rotation.y+=.01}))},t})(e.CubeTextureElement);e.HDRCubeTextureElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i){var n=this;t.call(this),this._tab=i,this._div.classList.add("searchbar");var s=e.Inspector.DOCUMENT.createElement("i");s.className="fa fa-search",this._div.appendChild(s),this._inputElement=e.Inspector.DOCUMENT.createElement("input"),this._inputElement.placeholder="Filter by name...",this._div.appendChild(this._inputElement),this._inputElement.addEventListener("keyup",(function(e){var t=n._inputElement.value;n._tab.filter(t)}))}return __extends(i,t),i.prototype.reset=function(){this._inputElement.value=""},i.prototype.update=function(){},i})(e.BasicElement);e.SearchBar=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i){t.call(this),this._div.className="fa fa-search texture-element",this._textureDiv=e.Helpers.CreateDiv("texture-viewer",this._div);var n=e.Helpers.CreateDiv("texture-viewer-img",this._textureDiv),s=e.Helpers.CreateDiv(null,this._textureDiv);i&&(s.textContent=i.getBaseSize().width+"px x "+i.getBaseSize().height+"px",n.style.backgroundImage="url('"+i.url+"')",n.style.width=i.getBaseSize().width+"px",n.style.height=i.getBaseSize().height+"px"),this._div.addEventListener("mouseover",this._showViewer.bind(this,"flex")),this._div.addEventListener("mouseout",this._showViewer.bind(this,"none"))}return __extends(i,t),i.prototype.update=function(e){},i.prototype._showViewer=function(e){this._textureDiv.style.display=e},i})(e.BasicElement);e.TextureElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(t,i){var n=this;this._elem=t,this._infoDiv=e.Helpers.CreateDiv("tooltip",this._elem.parentElement),this._elem.addEventListener("mouseover",(function(){n._infoDiv.textContent=i,n._infoDiv.style.display="block"})),this._elem.addEventListener("mouseout",(function(){n._infoDiv.style.display="none"}))}return t})();e.Tooltip=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(){}return t.GET_TYPE=function(e){if(null!=e&&void 0!=e){var t=BABYLON.Tools.getClassName(e);return t&&"object"!==t||(t=e.constructor.name,t||(t=this._GetFnName(e.constructor))),t}return""},t._GetFnName=function(e){var t="function"==typeof e,i=t&&(e.name&&["",e.name]||e.toString().match(/function ([^\(]+)/));return!t&&"not a function"||i&&i[1]||"anonymous"},t.SEND_EVENT=function(t){var i;e.Inspector.DOCUMENT.createEvent?(i=e.Inspector.DOCUMENT.createEvent("HTMLEvents"),i.initEvent(t,!0,!0)):i=new Event(t),window.dispatchEvent(i)},t.Trunc=function(e){return Math.round(e)!==e?e.toFixed(2):e},t.CreateDiv=function(e,i){return t.CreateElement("div",e,i)},t.CreateElement=function(t,i,n){var s=e.Inspector.DOCUMENT.createElement(t);return i&&(s.className=i),n&&n.appendChild(s),s},t.CleanDiv=function(e){for(;e.firstChild;)e.removeChild(e.firstChild)},t.LoadScript=function(){BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js",(function(i){var n=t.CreateElement("script","",e.Inspector.DOCUMENT.body);n.textContent=i,BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/languages/glsl.min.js",(function(i){var n=t.CreateElement("script","",e.Inspector.DOCUMENT.body);n.textContent=i,BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/zenburn.min.css",(function(i){var n=t.CreateElement("style","",e.Inspector.DOCUMENT.body);n.textContent=i}))}),null,null,null,(function(){console.log("erreur")}))}),null,null,null,(function(){console.log("erreur")}))},t})();e.Helpers=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function e(){this.pause=!1,this._updatableProperties=[],this._timer=setInterval(this._update.bind(this),e.REFRESH_TIME)}return e.getInstance=function(){return e._instance||(e._instance=new e,console.log("create ")),e._instance},e.prototype.add=function(e){this._updatableProperties.push(e)},e.prototype.remove=function(e){var t=this._updatableProperties.indexOf(e);t!=-1&&this._updatableProperties.splice(t,1)},e.prototype._update=function(){if(!this.pause)for(var e=0,t=this._updatableProperties;e<t.length;e++){var i=t[e];i.update()}},e.REFRESH_TIME=250,e})();e.Scheduler=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,i){e.call(this),this._isActive=!1,this._tabbar=t,this.name=i,this._build()}return __extends(t,e),t.prototype.isActive=function(){return this._isActive},t.prototype._build=function(){var e=this;this._div.className="tab",this._div.textContent=this.name,this._div.addEventListener("click",(function(t){e._tabbar.switchTab(e)}))},t.prototype.active=function(e){e?this._div.classList.add("active"):this._div.classList.remove("active"),this._isActive=e},t.prototype.update=function(){},t.prototype.getPanel=function(){return this._panel},t.prototype.filter=function(e){},t.prototype.getPixelWidth=function(){var e=window.getComputedStyle(this._div),t=parseFloat(e.marginLeft.substr(0,e.marginLeft.length-2))||0,i=parseFloat(e.marginRight.substr(0,e.marginRight.length-2))||0;return(this._div.clientWidth||0)+t+i},t})(e.BasicElement);e.Tab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i,n,s){t.call(this,i,n),this._treeItems=[],this._inspector=s,this._panel=e.Helpers.CreateDiv("tab-panel"),this._searchBar=new e.SearchBar(this),this._panel.appendChild(this._searchBar.toHtml()),this._treePanel=e.Helpers.CreateDiv("insp-tree",this._panel),this._detailsPanel=new e.DetailPanel,this._panel.appendChild(this._detailsPanel.toHtml()),Split([this._treePanel,this._detailsPanel.toHtml()],{direction:"vertical"}),this.update()}return __extends(i,t),i.prototype.dispose=function(){this._detailsPanel.dispose()},i.prototype.update=function(t){var i;t?i=t:(this._treeItems=this._getTree(),i=this._treeItems),e.Helpers.CleanDiv(this._treePanel),this._detailsPanel.clean(),i.sort((function(e,t){return e.compareTo(t)}));for(var n=0,s=i;n<s.length;n++){var r=s[n];this._treePanel.appendChild(r.toHtml())}},i.prototype.displayDetails=function(e){this.activateNode(e),this._detailsPanel.details=e.getDetails()},i.prototype.select=function(e){this.highlightNode(),this.activateNode(e),this.displayDetails(e)},i.prototype.highlightNode=function(e){if(this._treeItems)for(var t=0,i=this._treeItems;t<i.length;t++){var n=i[t];n.highlight(!1)}e&&e.highlight(!0)},i.prototype.activateNode=function(e){if(this._treeItems)for(var t=0,i=this._treeItems;t<i.length;t++){var n=i[t];n.active(!1)}e.active(!0)},i.prototype.getItemFor=function(e){for(var t=e,i=0,n=this._treeItems;i<n.length;i++){var s=n[i];if(s.correspondsTo(t))return s}return null},i.prototype.filter=function(e){for(var t=[],i=0,n=this._treeItems;i<n.length;i++){var s=n[i];s.id.toLowerCase().indexOf(e.toLowerCase())!=-1&&t.push(s)}this.update(t)},i})(e.Tab);e.PropertyTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e,i){t.call(this,e,"Canvas2D",i)}return __extends(i,t),i.prototype._getTree=function(){for(var t=this,i=[],n=BABYLON.Canvas2D.instances||[],s=function(e){return e.id&&0==e.id.indexOf("###")&&0===e.id.lastIndexOf("###",0)},r=function(i){if(i.children&&i.children.length>0){for(var n=new e.TreeItem(t,new e.Canvas2DAdapter(i)),a=0,o=i.children;a<o.length;a++){var l=o[a];if(!s(l)){var p=r(l);n.add(p)}}return n.update(),n}return new e.TreeItem(t,new e.Canvas2DAdapter(i))},a=0,o=n;a<o.length;a++){var l=o[a],p=l,c=r(p);i.push(c)}return i},i})(e.PropertyTab);e.Canvas2DTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e,i){t.call(this,e,"Light",i)}return __extends(i,t),i.prototype._getTree=function(){for(var t=[],i=this._inspector.scene,n=0,s=i.lights;n<s.length;n++){var r=s[n];t.push(new e.TreeItem(this,new e.LightAdapter(r)))}return t},i})(e.PropertyTab);e.LightTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e,i){t.call(this,e,"Material",i)}return __extends(i,t),i.prototype._getTree=function(){for(var t=[],i=this._inspector.scene,n=0,s=i.materials;n<s.length;n++){var r=s[n];t.push(new e.TreeItem(this,new e.MaterialAdapter(r)))}return t},i})(e.PropertyTab);e.MaterialTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e,i){t.call(this,e,"Mesh",i)}return __extends(i,t),i.prototype._getTree=function(){for(var t=[],i=function(e){return e.name&&0==e.name.indexOf("###")&&0===e.name.lastIndexOf("###",0)},n=this._inspector.scene,s=0,r=n.meshes;s<r.length;s++){var a=r[s];i(a)||t.push(new e.TreeItem(this,new e.MeshAdapter(a)))}return t},i})(e.PropertyTab);e.MeshTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i,n){var s=this;t.call(this,i,"Scene"),this._skeletonViewers=[],this._inspector=n,this._panel=e.Helpers.CreateDiv("tab-panel"),this._actions=e.Helpers.CreateDiv("scene-actions",this._panel),this._detailsPanel=new e.DetailPanel,this._panel.appendChild(this._detailsPanel.toHtml());
	for(var r=[],a=0,o=e.PROPERTIES.Scene.properties;a<o.length;a++){var l=o[a];r.push(new e.PropertyLine(new e.Property(l,this._inspector.scene)))}this._detailsPanel.details=r,Split([this._actions,this._detailsPanel.toHtml()],{sizes:[50,50],direction:"vertical"});var p=e.Helpers.CreateDiv("actions-title",this._actions);p.textContent="Rendering mode";var c=e.Helpers.CreateDiv("action-radio",this._actions),h=e.Helpers.CreateDiv("action-radio",this._actions),u=e.Helpers.CreateDiv("action-radio",this._actions);c.textContent="Point",h.textContent="Wireframe",u.textContent="Solid",this._inspector.scene.forcePointsCloud?c.classList.add("active"):this._inspector.scene.forceWireframe?h.classList.add("active"):u.classList.add("active"),this._generateRadioAction([c,h,u]),c.addEventListener("click",(function(){s._inspector.scene.forcePointsCloud=!0,s._inspector.scene.forceWireframe=!1})),h.addEventListener("click",(function(){s._inspector.scene.forcePointsCloud=!1,s._inspector.scene.forceWireframe=!0})),u.addEventListener("click",(function(){s._inspector.scene.forcePointsCloud=!1,s._inspector.scene.forceWireframe=!1})),p=e.Helpers.CreateDiv("actions-title",this._actions),p.textContent="Textures channels",this._generateActionLine("Diffuse Texture",BABYLON.StandardMaterial.DiffuseTextureEnabled,(function(e){BABYLON.StandardMaterial.DiffuseTextureEnabled=e})),this._generateActionLine("Ambient Texture",BABYLON.StandardMaterial.AmbientTextureEnabled,(function(e){BABYLON.StandardMaterial.AmbientTextureEnabled=e})),this._generateActionLine("Specular Texture",BABYLON.StandardMaterial.SpecularTextureEnabled,(function(e){BABYLON.StandardMaterial.SpecularTextureEnabled=e})),this._generateActionLine("Emissive Texture",BABYLON.StandardMaterial.EmissiveTextureEnabled,(function(e){BABYLON.StandardMaterial.EmissiveTextureEnabled=e})),this._generateActionLine("Bump Texture",BABYLON.StandardMaterial.BumpTextureEnabled,(function(e){BABYLON.StandardMaterial.BumpTextureEnabled=e})),this._generateActionLine("Opacity Texture",BABYLON.StandardMaterial.OpacityTextureEnabled,(function(e){BABYLON.StandardMaterial.OpacityTextureEnabled=e})),this._generateActionLine("Reflection Texture",BABYLON.StandardMaterial.ReflectionTextureEnabled,(function(e){BABYLON.StandardMaterial.ReflectionTextureEnabled=e})),this._generateActionLine("Refraction Texture",BABYLON.StandardMaterial.RefractionTextureEnabled,(function(e){BABYLON.StandardMaterial.RefractionTextureEnabled=e})),this._generateActionLine("ColorGrading",BABYLON.StandardMaterial.ColorGradingTextureEnabled,(function(e){BABYLON.StandardMaterial.ColorGradingTextureEnabled=e})),this._generateActionLine("Lightmap Texture",BABYLON.StandardMaterial.LightmapTextureEnabled,(function(e){BABYLON.StandardMaterial.LightmapTextureEnabled=e})),this._generateActionLine("Fresnel",BABYLON.StandardMaterial.FresnelEnabled,(function(e){BABYLON.StandardMaterial.FresnelEnabled=e})),p=e.Helpers.CreateDiv("actions-title",this._actions),p.textContent="Options",this._generateActionLine("Animations",this._inspector.scene.animationsEnabled,(function(e){s._inspector.scene.animationsEnabled=e})),this._generateActionLine("Collisions",this._inspector.scene.collisionsEnabled,(function(e){s._inspector.scene.collisionsEnabled=e})),this._generateActionLine("Fog",this._inspector.scene.fogEnabled,(function(e){s._inspector.scene.fogEnabled=e})),this._generateActionLine("Lens flares",this._inspector.scene.lensFlaresEnabled,(function(e){s._inspector.scene.lensFlaresEnabled=e})),this._generateActionLine("Lights",this._inspector.scene.lightsEnabled,(function(e){s._inspector.scene.lightsEnabled=e})),this._generateActionLine("Particles",this._inspector.scene.particlesEnabled,(function(e){s._inspector.scene.particlesEnabled=e})),this._generateActionLine("Post-processes",this._inspector.scene.postProcessesEnabled,(function(e){s._inspector.scene.postProcessesEnabled=e})),this._generateActionLine("Probes",this._inspector.scene.probesEnabled,(function(e){s._inspector.scene.probesEnabled=e})),this._generateActionLine("Procedural textures",this._inspector.scene.proceduralTexturesEnabled,(function(e){s._inspector.scene.proceduralTexturesEnabled=e})),this._generateActionLine("Render targets",this._inspector.scene.renderTargetsEnabled,(function(e){s._inspector.scene.renderTargetsEnabled=e})),this._generateActionLine("Shadows",this._inspector.scene.shadowsEnabled,(function(e){s._inspector.scene.shadowsEnabled=e})),this._generateActionLine("Skeletons",this._inspector.scene.skeletonsEnabled,(function(e){s._inspector.scene.skeletonsEnabled=e})),this._generateActionLine("Sprites",this._inspector.scene.spritesEnabled,(function(e){s._inspector.scene.spritesEnabled=e})),this._generateActionLine("Textures",this._inspector.scene.texturesEnabled,(function(e){s._inspector.scene.texturesEnabled=e})),p=e.Helpers.CreateDiv("actions-title",this._actions),p.textContent="Audio";var d=e.Helpers.CreateDiv("action-radio",this._actions),_=e.Helpers.CreateDiv("action-radio",this._actions);this._generateActionLine("Disable audio",!this._inspector.scene.audioEnabled,(function(e){s._inspector.scene.audioEnabled=!e})),d.textContent="Headphones",_.textContent="Normal speakers",this._generateRadioAction([d,_]),this._inspector.scene.headphone?d.classList.add("active"):_.classList.add("active"),d.addEventListener("click",(function(){s._inspector.scene.headphone=!0})),_.addEventListener("click",(function(){s._inspector.scene.headphone=!1})),p=e.Helpers.CreateDiv("actions-title",this._actions),p.textContent="Viewer",this._generateActionLine("Skeletons",!1,(function(e){if(e)for(var t=0;t<s._inspector.scene.meshes.length;t++){var i=s._inspector.scene.meshes[t];if(i.skeleton){for(var n=!1,r=0;r<s._skeletonViewers.length;r++)if(s._skeletonViewers[r].skeleton===i.skeleton){n=!0;break}if(n)continue;var a=new BABYLON.Debug.SkeletonViewer(i.skeleton,i,s._inspector.scene);a.isEnabled=!0,s._skeletonViewers.push(a)}}else{for(var t=0;t<s._skeletonViewers.length;t++)s._skeletonViewers[t].dispose();s._skeletonViewers=[]}}))}return __extends(i,t),i.prototype.dispose=function(){this._detailsPanel.dispose()},i.prototype._generateActionLine=function(t,i,n){var s=e.Helpers.CreateDiv("scene-actions",this._actions);s.textContent=t,s.classList.add("action"),i&&s.classList.add("active"),s.addEventListener("click",(function(e){s.classList.toggle("active");var t=s.classList.contains("active");n(t)}))},i.prototype._generateRadioAction=function(e){for(var t=function(t,i){for(var n=0,s=e;n<s.length;n++){var r=s[n];r.classList.remove("active")}t.classList.add("active")},i=0,n=e;i<n.length;i++){var s=n[i];s.addEventListener("click",t.bind(this,s))}},i})(e.Tab);e.SceneTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i,n){t.call(this,i,"Shader"),this._inspector=n,this._panel=e.Helpers.CreateDiv("tab-panel");var s=e.Helpers.CreateDiv("shader-tree-panel");this._vertexPanel=e.Helpers.CreateDiv("shader-panel"),this._fragmentPanel=e.Helpers.CreateDiv("shader-panel"),this._panel.appendChild(s),this._panel.appendChild(this._vertexPanel),this._panel.appendChild(this._fragmentPanel),e.Helpers.LoadScript(),Split([this._vertexPanel,this._fragmentPanel],{sizes:[50,50],direction:"vertical"});var r=e.Helpers.CreateElement("select","",s);r.addEventListener("change",this._selectShader.bind(this));var a=e.Helpers.CreateElement("option","",r);a.textContent="Select a shader",a.setAttribute("value",""),a.setAttribute("disabled","true"),a.setAttribute("selected","true");for(var o=0,l=this._inspector.scene.materials;o<l.length;o++){var p=l[o];if(p instanceof BABYLON.ShaderMaterial){var c=e.Helpers.CreateElement("option","",r);c.setAttribute("value",p.id),c.textContent=p.name+" - "+p.id}}}return __extends(i,t),i.prototype._selectShader=function(t){var i=t.target.value,n=this._inspector.scene.getMaterialByID(i);e.Helpers.CleanDiv(this._vertexPanel);var s=e.Helpers.CreateDiv("shader-panel-title",this._vertexPanel);s.textContent="Vertex shader";var r=e.Helpers.CreateElement("code","glsl",e.Helpers.CreateElement("pre","",this._vertexPanel));r.textContent=this._beautify(n.getEffect().getVertexShaderSource()),e.Helpers.CleanDiv(this._fragmentPanel),s=e.Helpers.CreateDiv("shader-panel-title",this._fragmentPanel),s.textContent="Frgament shader",r=e.Helpers.CreateElement("code","glsl",e.Helpers.CreateElement("pre","",this._fragmentPanel)),r.textContent=this._beautify(n.getEffect().getFragmentShaderSource());var a=e.Helpers.CreateElement("script","",e.Inspector.DOCUMENT.body);a.textContent="hljs.initHighlighting();"},i.prototype.dispose=function(){},i.prototype._getBracket=function(e){for(var t=e.indexOf("{"),i=e.substr(t+1).split(""),n=1,s=t,r=0,a=0,o=i;a<o.length;a++){var l=o[a];if(s++,"{"===l&&n++,"}"===l&&n--,0==n){r=s;break}}return{firstBracket:t,lastBracket:r}},i.prototype._beautify=function(e,t){void 0===t&&(t=0);for(var i=this._getBracket(e),n=i.firstBracket,s=i.lastBracket,r="",a=0;a<t;a++)r+="    ";if(n==-1)return e=r+e,e=e.replace(/;./g,(function(e){return"\n"+e.substr(1)})),e=e.replace(/=/g," = "),e=e.replace(/\n/g,"\n"+r);var o=e.substr(0,n),l=e.substr(s+1,e.length),p=e.substr(n+1,s-n-1);return p=this._beautify(p,t+1),this._beautify(o,t)+"{\n"+p+"\n"+r+"}\n"+this._beautify(l,t)},i})(e.Tab);e.ShaderTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i,n){var s=this;t.call(this,i,"Stats"),this._updatableProperties=[],this._inspector=n,this._scene=this._inspector.scene,this._engine=this._scene.getEngine(),this._glInfo=this._engine.getGlInfo(),this._panel=e.Helpers.CreateDiv("tab-panel"),this._panel.classList.add("stats-panel");var r=e.Helpers.CreateDiv("stat-title1",this._panel);r.innerHTML="Babylon.js v"+BABYLON.Engine.Version+" - <b>"+BABYLON.Tools.Format(this._inspector.scene.getEngine().getFps(),0)+" fps</b>",this._updateLoopHandler=this._update.bind(this),r=e.Helpers.CreateDiv("stat-title2",this._panel),r.textContent="Count";var a=this._createStatLabel("Total meshes",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel);this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.meshes.length.toString()}}),a=this._createStatLabel("Draw calls",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.drawCalls.toString()}}),a=this._createStatLabel("Total lights",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.lights.length.toString()}}),a=this._createStatLabel("Total lights",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.lights.length.toString()}}),a=this._createStatLabel("Total vertices",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.getTotalVertices().toString()}}),a=this._createStatLabel("Total materials",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.materials.length.toString()}}),a=this._createStatLabel("Total textures",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.textures.length.toString()}}),a=this._createStatLabel("Active meshes",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.getActiveMeshes().length.toString()}}),a=this._createStatLabel("Active indices",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.getActiveIndices().toString()}}),a=this._createStatLabel("Active bones",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.getActiveBones().toString()}}),a=this._createStatLabel("Active particles",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._scene.getActiveParticles().toString()}}),r=e.Helpers.CreateDiv("stat-title2",this._panel),r.textContent="Duration";var a=this._createStatLabel("Meshes selection",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel);this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(s._scene.getEvaluateActiveMeshesDuration())}}),a=this._createStatLabel("Render targets",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(s._scene.getRenderTargetsDuration())}}),a=this._createStatLabel("Particles",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(s._scene.getParticlesDuration())}}),a=this._createStatLabel("Sprites",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(s._scene.getSpritesDuration())}}),a=this._createStatLabel("Render",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(s._scene.getRenderDuration())}}),a=this._createStatLabel("Frame",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(s._scene.getLastFrameDuration())}}),a=this._createStatLabel("Potential FPS",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return BABYLON.Tools.Format(1e3/s._scene.getLastFrameDuration(),0)}}),a=this._createStatLabel("Resolution",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getRenderWidth()+"x"+s._engine.getRenderHeight()}}),r=e.Helpers.CreateDiv("stat-title2",this._panel),r.textContent="Extensions";var a=this._createStatLabel("Std derivatives",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel);this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().standardDerivatives?"Yes":"No"}}),a=this._createStatLabel("Compressed textures",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().s3tc?"Yes":"No"}}),a=this._createStatLabel("Hardware instances",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().instancedArrays?"Yes":"No"}}),a=this._createStatLabel("Texture float",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().textureFloat?"Yes":"No"}}),a=this._createStatLabel("32bits indices",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().uintIndices?"Yes":"No"}}),a=this._createStatLabel("Fragment depth",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().fragmentDepthSupported?"Yes":"No"}}),a=this._createStatLabel("High precision shaders",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().highPrecisionShaderSupported?"Yes":"No"}}),a=this._createStatLabel("Draw buffers",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().drawBuffersExtension?"Yes":"No"}}),r=e.Helpers.CreateDiv("stat-title2",this._panel),r.textContent="Caps.";var a=this._createStatLabel("Stencil",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel);this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.isStencilEnable?"Enabled":"Disabled"}}),a=this._createStatLabel("Max textures units",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().maxTexturesImageUnits.toString()}}),a=this._createStatLabel("Max textures size",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().maxTextureSize.toString()}}),a=this._createStatLabel("Max anisotropy",this._panel),o=e.Helpers.CreateDiv("stat-value",this._panel),this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.getCaps().maxAnisotropy.toString()}}),r=e.Helpers.CreateDiv("stat-title2",this._panel),r.textContent="Info";var o=e.Helpers.CreateDiv("stat-infos",this._panel);this._updatableProperties.push({elem:o,updateFct:function(){return s._engine.webGLVersion+" - "+s._glInfo.version+" - "+s._glInfo.renderer}}),this._scene.registerAfterRender(this._updateLoopHandler)}return __extends(i,t),i.prototype._createStatLabel=function(t,i){var n=e.Helpers.CreateDiv("stat-label",i);return n.textContent=t,n},i.prototype._update=function(){for(var e=0,t=this._updatableProperties;e<t.length;e++){var i=t[e];i.elem.textContent=i.updateFct()}},i.prototype.dispose=function(){this._scene.unregisterAfterRender(this._updateLoopHandler)},i})(e.Tab);e.StatsTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i){t.call(this),this._tabs=[],this._invisibleTabs=[],this._visibleTabs=[],this._inspector=i,this._tabs.push(new e.SceneTab(this,this._inspector)),this._tabs.push(new e.StatsTab(this,this._inspector)),this._meshTab=new e.MeshTab(this,this._inspector),this._tabs.push(this._meshTab),this._tabs.push(new e.ShaderTab(this,this._inspector)),this._tabs.push(new e.LightTab(this,this._inspector)),this._tabs.push(new e.Canvas2DTab(this,this._inspector)),this._tabs.push(new e.MaterialTab(this,this._inspector)),this._toolBar=new e.Toolbar(this._inspector),this._build(),this._tabs[0].active(!0);for(var n=0,s=this._tabs;n<s.length;n++){var r=s[n];this._visibleTabs.push(r)}}return __extends(i,t),i.prototype.update=function(){},i.prototype._build=function(){var t=this;this._div.className="tabbar",this._div.appendChild(this._toolBar.toHtml());for(var i=0,n=this._tabs;i<n.length;i++){var s=n[i];this._div.appendChild(s.toHtml())}this._moreTabsIcon=e.Helpers.CreateElement("i","fa fa-angle-double-right more-tabs"),this._moreTabsPanel=e.Helpers.CreateDiv("more-tabs-panel"),this._moreTabsIcon.addEventListener("click",(function(){if("flex"==t._moreTabsPanel.style.display)t._moreTabsPanel.style.display="none";else{var i=t._div.parentNode;i.contains(t._moreTabsPanel)||i.appendChild(t._moreTabsPanel),e.Helpers.CleanDiv(t._moreTabsPanel);for(var n=0,s=t._invisibleTabs;n<s.length;n++){var r=s[n];t._addInvisibleTabToPanel(r)}t._moreTabsPanel.style.display="flex"}}))},i.prototype._addInvisibleTabToPanel=function(t){var i=this,n=e.Helpers.CreateDiv("invisible-tab",this._moreTabsPanel);n.textContent=t.name,n.addEventListener("click",(function(){i._moreTabsPanel.style.display="none",i.switchTab(t)}))},i.prototype.switchTab=function(e){this.getActiveTab().dispose();for(var t=0,i=this._tabs;t<i.length;t++){var n=i[t];n.active(!1)}e.active(!0),this._inspector.refresh()},i.prototype.switchMeshTab=function(e){if(this.switchTab(this._meshTab),e){var t=this._meshTab.getItemFor(e);this._meshTab.select(t)}},i.prototype.getActiveTab=function(){for(var e=0,t=this._tabs;e<t.length;e++){var i=t[e];if(i.isActive())return i}},Object.defineProperty(i.prototype,"inspector",{get:function(){return this._inspector},enumerable:!0,configurable:!0}),i.prototype.getPixelWidth=function(){for(var e=0,t=0,i=this._visibleTabs;t<i.length;t++){var n=i[t];e+=n.getPixelWidth()}return e+=this._toolBar.getPixelWidth(),this._div.contains(this._moreTabsIcon)&&(e+=30),e},i.prototype.updateWidth=function(){for(var e=this._div.parentElement.clientWidth,t=75,i=this.getPixelWidth();this._visibleTabs.length>0&&i>e;){var n=this._visibleTabs.pop();this._invisibleTabs.push(n),this._div.removeChild(n.toHtml()),i=this.getPixelWidth()+t}if(this._invisibleTabs.length>0&&i+t<e){var s=this._invisibleTabs.pop();this._div.appendChild(s.toHtml()),this._visibleTabs.push(s),this._div.contains(this._moreTabsIcon)&&this._div.removeChild(this._moreTabsIcon)}this._invisibleTabs.length>0&&!this._div.contains(this._moreTabsIcon)&&this._div.appendChild(this._moreTabsIcon)},i})(e.BasicElement);e.TabBar=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(t,i,n,s){var r=this;this._inspector=n,this._elem=e.Inspector.DOCUMENT.createElement("i"),this._elem.className="tool fa "+t,i.appendChild(this._elem),this._elem.addEventListener("click",(function(e){r.action()})),new e.Tooltip(this._elem,s)}return t.prototype.toHtml=function(){return this._elem},t.prototype.getPixelWidth=function(){var e=window.getComputedStyle(this._elem),t=parseFloat(e.marginLeft.substr(0,e.marginLeft.length-2))||0,i=parseFloat(e.marginRight.substr(0,e.marginRight.length-2))||0;return(this._elem.clientWidth||0)+t+i},t.prototype._updateIcon=function(e){this._elem.className="tool fa "+e},t})();e.AbstractTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e,i){t.call(this,"fa-pause",e,i,"Pause the automatic update of properties"),this._isPause=!1}return __extends(i,t),i.prototype.action=function(){this._isPause?(e.Scheduler.getInstance().pause=!1,this._updateIcon("fa-pause")):(e.Scheduler.getInstance().pause=!0,this._updateIcon("fa-play")),this._isPause=!this._isPause},i})(e.AbstractTool);e.PauseScheduleTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,i){e.call(this,"fa-mouse-pointer",t,i,"Pick a mesh in the scene to display its details"),this._isActive=!1,this._pickHandler=this._pickMesh.bind(this)}return __extends(t,e),t.prototype.action=function(){this._isActive?this._deactivate():(this.toHtml().classList.add("active"),this._inspector.scene.getEngine().getRenderingCanvas().addEventListener("click",this._pickHandler),this._isActive=!0)},t.prototype._deactivate=function(){this.toHtml().classList.remove("active"),this._inspector.scene.getEngine().getRenderingCanvas().removeEventListener("click",this._pickHandler),this._isActive=!1},t.prototype._pickMesh=function(e){var t=this._updatePointerPosition(e),i=this._inspector.scene.pick(t.x,t.y,(function(e){return!0}));i.pickedMesh&&(console.log(i.pickedMesh.name),this._inspector.displayObjectDetails(i.pickedMesh)),this._deactivate()},t.prototype._updatePointerPosition=function(e){var t=this._inspector.scene.getEngine().getRenderingCanvasClientRect(),i=e.clientX-t.left,n=e.clientY-t.top;return{x:i,y:n}},t})(e.AbstractTool);e.PickTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,i){e.call(this,"fa-external-link",t,i,"Creates the inspector in an external popup")}return __extends(t,e),t.prototype.action=function(){this._inspector.openPopup()},t})(e.AbstractTool);e.PopupTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,i){e.call(this,"fa-refresh",t,i,"Refresh the current tab")}return __extends(t,e),t.prototype.action=function(){this._inspector.refresh()},t})(e.AbstractTool);e.RefreshTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e){t.call(this),this._tools=[],this._inspector=e,this._build(),this._addTools()}return __extends(i,t),i.prototype.update=function(){},i.prototype._build=function(){this._div.className="toolbar"},i.prototype._addTools=function(){this._tools.push(new e.RefreshTool(this._div,this._inspector)),this._tools.push(new e.PickTool(this._div,this._inspector)),this._inspector.popupMode||this._tools.push(new e.PopupTool(this._div,this._inspector)),this._tools.push(new e.PauseScheduleTool(this._div,this._inspector)),this._tools.push(new e.DisposeTool(this._div,this._inspector))},i.prototype.getPixelWidth=function(){for(var e=0,t=0,i=this._tools;t<i.length;t++){var n=i[t];e+=n.getPixelWidth()}return e},i})(e.BasicElement);e.Toolbar=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,i){e.call(this,"fa-times",t,i,"Close the inspector panel")}return __extends(t,e),t.prototype.action=function(){this._inspector.dispose()},t})(e.AbstractTool);e.DisposeTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(e,i){t.call(this),this._children=[],this._tab=e,this._adapter=i,this._tools=this._adapter.getTools(),this._build()}return __extends(i,t),Object.defineProperty(i.prototype,"id",{get:function(){return this._adapter.id()},enumerable:!0,configurable:!0}),i.prototype.add=function(e){this._children.push(e),this.update()},i.prototype.compareTo=function(e){var t=this.id,i=e.id;return t.localeCompare(i,[],{numeric:!0})},i.prototype.correspondsTo=function(e){return this._adapter.correspondsTo(e)},i.prototype.fold=function(){if(this._children.length>0){for(var e=0,t=this._children;e<t.length;e++){var i=t[e];i.toHtml().style.display="none"}this._div.classList.add("folded"),this._div.classList.remove("unfolded")}},i.prototype.unfold=function(){if(this._children.length>0){for(var e=0,t=this._children;e<t.length;e++){var i=t[e];i.toHtml().style.display="block"}this._div.classList.add("unfolded"),this._div.classList.remove("folded")}},i.prototype._build=function(){this._div.className="line";for(var t=0,i=this._tools;t<i.length;t++){var n=i[t];this._div.appendChild(n.toHtml())}var s=e.Inspector.DOCUMENT.createElement("span");s.textContent=this._adapter.id(),this._div.appendChild(s);var r=e.Inspector.DOCUMENT.createElement("span");r.className="property-type",r.textContent=" - "+this._adapter.type(),this._div.appendChild(r),this._lineContent=e.Helpers.CreateDiv("line-content",this._div),this._addEvent()},i.prototype.getDetails=function(){return this._adapter.getProperties()},i.prototype.update=function(){e.Helpers.CleanDiv(this._lineContent);for(var t=0,i=this._children;t<i.length;t++){var n=i[t],s=n.toHtml();this._lineContent.appendChild(s)}this._children.length>0&&(this._div.classList.contains("folded")||this._div.classList.contains("unfolded")||this._div.classList.add("folded")),this.fold()},i.prototype._addEvent=function(){var e=this;this._div.addEventListener("click",(function(t){e._tab.select(e),e._isFolded()?e.unfold():e.fold(),t.stopPropagation()})),this._div.addEventListener("mouseover",(function(t){e._tab.highlightNode(e),t.stopPropagation()})),this._div.addEventListener("mouseout",(function(t){e._tab.highlightNode()}))},i.prototype.highlight=function(e){if(!e)for(var t=0,i=this._children;t<i.length;t++){var n=i[t];n._adapter.highlight(e)}this._adapter.highlight(e)},i.prototype._isFolded=function(){return!this._div.classList.contains("unfolded")},i.prototype.active=function(e){this._div.classList.remove("active");for(var t=0,i=this._children;t<i.length;t++){var n=i[t];n.active(!1)}e&&this._div.classList.add("active")},i})(e.BasicElement);e.TreeItem=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(){this._on=!1,this._elem=e.Inspector.DOCUMENT.createElement("i"),this._elem.className="treeTool fa",this._addEvents()}return t.prototype.toHtml=function(){return this._elem},t.prototype._addEvents=function(){var e=this;this._elem.addEventListener("click",(function(t){e.action(),t.stopPropagation()}))},t.prototype.action=function(){this._on=!this._on},t})();e.AbstractTreeTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){e.call(this),this._obj=t,this._elem.classList.add("fa-square-o"),this._on=this._obj.isBoxVisible(),this._check()}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._check()},t.prototype._check=function(){this._on?this._elem.classList.add("active"):this._elem.classList.remove("active"),this._obj.setBoxVisible(this._on)},t})(e.AbstractTreeTool);e.BoundingBox=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){e.call(this),this._obj=t,this._elem.classList.add("fa-eye"),this._on=this._obj.isVisible(),this._check()}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._check()},t.prototype._check=function(){this._on?(this._elem.classList.add("fa-eye"),this._elem.classList.add("active"),this._elem.classList.remove("fa-eye-slash")):(this._elem.classList.remove("fa-eye"),this._elem.classList.remove("active"),this._elem.classList.add("fa-eye-slash")),this._obj.setVisible(this._on)},t})(e.AbstractTreeTool);e.Checkbox=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){e.call(this),this._obj=t,this._elem.classList.add("fa-wrench")}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._on?this._elem.classList.add("active"):this._elem.classList.remove("active"),this._obj.debug(this._on)},t})(e.AbstractTreeTool);e.DebugArea=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function i(i){t.call(this),this._obj=i,this._elem.classList.add("fa-info-circle"),this._tooltip=new e.Tooltip(this._elem,this._obj.getInfo())}return __extends(i,t),i.prototype.action=function(){t.prototype.action.call(this)},i})(e.AbstractTreeTool);e.Info=t})(INSPECTOR||(INSPECTOR={}));

	/*** EXPORTS FROM exports-loader ***/
	module.exports = INSPECTOR;


/***/ },
/* 6 */
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


/***/ }
/******/ ]);