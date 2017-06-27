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
			module.hot.accept("!!../../../Tools/Gulp/node_modules/css-loader/index.js!./babylon.inspector.css", function() {
				var newContent = require("!!../../../Tools/Gulp/node_modules/css-loader/index.js!./babylon.inspector.css");
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
	exports.push([module.id, "@import url(https://fonts.googleapis.com/css?family=Inconsolata);", ""]);

	// module
	exports.push([module.id, ".insp-wrapper {\n  user-select: none;\n  display: flex;\n  font-size: 0.9em;\n  font-family: \"Inconsolata\", sans-serif;\n  background-color: #242424;\n  /**\r\n * A tool contained in the tree panel (available for each item of the tree)\r\n */\n  /**\r\n * The toolbar contains : \r\n * - a refresh tool - refresh the whole panel\r\n * - a popup tool - Open the inspector in a new panel\r\n * ...\r\n */ }\n  .insp-wrapper .gutter {\n    background-color: #2c2c2c; }\n    .insp-wrapper .gutter.gutter-vertical:not(.blocked) {\n      cursor: ns-resize; }\n    .insp-wrapper .gutter.gutter-horizontal:not(.blocked) {\n      cursor: ew-resize; }\n  .insp-wrapper .insp-right-panel {\n    width: 750px;\n    display: flex;\n    flex-direction: column;\n    flex-shrink: 0; }\n    .insp-wrapper .insp-right-panel.popupmode {\n      width: 100% !important; }\n    .insp-wrapper .insp-right-panel .top-panel {\n      width: 100%;\n      height: 100%;\n      position: relative;\n      background-color: #242424;\n      color: #ccc;\n      font-size: 1em; }\n      .insp-wrapper .insp-right-panel .top-panel .tab-panel-content {\n        width: 100%;\n        height: calc(100% - 32px); }\n      .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel {\n        position: absolute;\n        z-index: 10;\n        top: 32px;\n        right: 0;\n        width: 100px;\n        display: none;\n        flex-direction: column;\n        align-items: center;\n        justify-content: center;\n        border: 1px solid #454545;\n        background-color: #242424; }\n        .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab {\n          height: 25px;\n          width: 100%;\n          line-height: 25px;\n          text-align: center;\n          background-color: #2c2c2c;\n          cursor: pointer; }\n          .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab:hover {\n            background-color: #383838; }\n          .insp-wrapper .insp-right-panel .top-panel .more-tabs-panel .invisible-tab:active {\n            background-color: #454545; }\n  .insp-wrapper .tooltip {\n    position: absolute;\n    top: 32px;\n    right: 0;\n    color: #f29766;\n    display: none;\n    z-index: 4;\n    font-family: \"Inconsolata\", sans-serif;\n    padding: 2px;\n    background-color: #242424;\n    border: 1px solid #454545; }\n  .insp-wrapper .treeTool {\n    margin: 3px 8px 3px 3px;\n    cursor: pointer;\n    position: relative; }\n    .insp-wrapper .treeTool:hover {\n      color: #5db0d7; }\n    .insp-wrapper .treeTool.active {\n      color: #5db0d7; }\n  .insp-wrapper .tab-panel {\n    height: 100%; }\n    .insp-wrapper .tab-panel.searchable {\n      height: calc(100% - 30px - 10px); }\n    .insp-wrapper .tab-panel .texture-image {\n      max-height: 400px; }\n    .insp-wrapper .tab-panel .scene-actions {\n      overflow-y: auto; }\n      .insp-wrapper .tab-panel .scene-actions .actions-title {\n        font-size: 1.1em;\n        padding-bottom: 10px;\n        border-bottom: 1px solid #5db0d7;\n        margin: 10px 0 10px 0; }\n      .insp-wrapper .tab-panel .scene-actions .defaut-action, .insp-wrapper .tab-panel .scene-actions .action-radio, .insp-wrapper .tab-panel .scene-actions .action {\n        height: 20px;\n        line-height: 20px;\n        width: 100%;\n        cursor: pointer; }\n        .insp-wrapper .tab-panel .scene-actions .defaut-action:hover, .insp-wrapper .tab-panel .scene-actions .action-radio:hover, .insp-wrapper .tab-panel .scene-actions .action:hover {\n          background-color: #2c2c2c; }\n        .insp-wrapper .tab-panel .scene-actions .defaut-action:active, .insp-wrapper .tab-panel .scene-actions .action-radio:active, .insp-wrapper .tab-panel .scene-actions .action:active {\n          background-color: #383838; }\n      .insp-wrapper .tab-panel .scene-actions .action-radio:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F10C\";\n        margin-right: 10px; }\n      .insp-wrapper .tab-panel .scene-actions .action-radio.active:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F192\";\n        color: #5db0d7;\n        margin-right: 10px; }\n      .insp-wrapper .tab-panel .scene-actions .action:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F096\";\n        margin-right: 10px; }\n      .insp-wrapper .tab-panel .scene-actions .action.active:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F14A\";\n        color: #5db0d7;\n        margin-right: 10px; }\n  .insp-wrapper .tab-panel .shader-tree-panel {\n    height: 30px; }\n    .insp-wrapper .tab-panel .shader-tree-panel select {\n      height: 30px;\n      background-color: transparent;\n      color: #ccc;\n      height: 30px;\n      width: 100%;\n      max-width: 300px;\n      padding-left: 15px;\n      border: 1px solid #2c2c2c;\n      outline: 1px solid #454545; }\n      .insp-wrapper .tab-panel .shader-tree-panel select option {\n        padding: 5px;\n        color: gray; }\n  .insp-wrapper .tab-panel .shader-panel {\n    min-height: 100px;\n    user-select: text;\n    box-sizing: border-box;\n    padding: 0 15px; }\n    .insp-wrapper .tab-panel .shader-panel pre {\n      margin: 0;\n      white-space: pre-wrap; }\n      .insp-wrapper .tab-panel .shader-panel pre code {\n        background-color: #242424 !important;\n        padding: 0;\n        margin: 0; }\n    .insp-wrapper .tab-panel .shader-panel .shader-panel-title {\n      height: 25px;\n      border-bottom: 1px solid #383838;\n      text-transform: uppercase;\n      line-height: 25px;\n      margin-bottom: 10px; }\n  .insp-wrapper .tab-panel .console-panel {\n    min-height: 100px;\n    user-select: text;\n    box-sizing: border-box;\n    padding: 0 15px; }\n    .insp-wrapper .tab-panel .console-panel .console-panel-title {\n      height: 25px;\n      border-bottom: 1px solid #383838;\n      text-transform: uppercase;\n      line-height: 25px;\n      margin-bottom: 10px; }\n    .insp-wrapper .tab-panel .console-panel .console-panel-content {\n      overflow-y: auto;\n      overflow-x: hidden;\n      height: calc(100% - 30px); }\n    .insp-wrapper .tab-panel .console-panel .defaut-line, .insp-wrapper .tab-panel .console-panel .log, .insp-wrapper .tab-panel .console-panel .warn, .insp-wrapper .tab-panel .console-panel .error, .insp-wrapper .tab-panel .console-panel .object {\n      word-wrap: break-word;\n      padding: 3px 0 3px 5px; }\n    .insp-wrapper .tab-panel .console-panel .caller {\n      padding: 3px 0 3px 0;\n      color: #349ccd; }\n    .insp-wrapper .tab-panel .console-panel .log {\n      color: white; }\n    .insp-wrapper .tab-panel .console-panel .warn {\n      color: orange; }\n    .insp-wrapper .tab-panel .console-panel .error {\n      color: orangered; }\n    .insp-wrapper .tab-panel .console-panel .object {\n      color: #5db0d7; }\n  .insp-wrapper .tab-panel.stats-panel {\n    overflow-y: auto; }\n  .insp-wrapper .tab-panel .stats-fps {\n    font-weight: 600;\n    color: #f29766; }\n  .insp-wrapper .tab-panel .stat-title1 {\n    font-size: 1.1em;\n    padding: 10px; }\n  .insp-wrapper .tab-panel .stat-title2 {\n    margin: 10px 0 10px 0;\n    font-size: 1.05em;\n    border-bottom: 1px solid #5db0d7;\n    box-sizing: border-box; }\n  .insp-wrapper .tab-panel .stat-label {\n    display: inline-block;\n    width: 80%;\n    padding: 2px;\n    background-color: #2c2c2c;\n    border-bottom: 1px solid #242424;\n    border-top: 1px solid #242424;\n    height: 30px;\n    line-height: 30px;\n    box-sizing: border-box; }\n  .insp-wrapper .tab-panel .stat-value {\n    display: inline-block;\n    width: 20%;\n    padding: 2px;\n    background-color: #2c2c2c;\n    border-top: 1px solid #242424;\n    border-bottom: 1px solid #242424;\n    height: 30px;\n    line-height: 30px;\n    box-sizing: border-box; }\n  .insp-wrapper .tab-panel .stat-infos {\n    width: 100%;\n    padding: 4px; }\n  .insp-wrapper .property-type {\n    color: #5db0d7; }\n  .insp-wrapper .property-name, .insp-wrapper .insp-details .base-row .prop-name, .insp-wrapper .insp-details .row .prop-name, .insp-wrapper .insp-details .header-row .prop-name {\n    color: #f29766; }\n  .insp-wrapper .insp-tree {\n    overflow-y: auto;\n    overflow-x: hidden;\n    height: calc(50% - 32px - 30px); }\n    .insp-wrapper .insp-tree .line {\n      padding: 3px;\n      cursor: pointer; }\n      .insp-wrapper .insp-tree .line:hover {\n        background-color: #2c2c2c; }\n      .insp-wrapper .insp-tree .line.active {\n        background-color: #454545; }\n        .insp-wrapper .insp-tree .line.active .line-content {\n          background-color: #242424; }\n      .insp-wrapper .insp-tree .line.unfolded:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F078\"; }\n      .insp-wrapper .insp-tree .line.folded:before {\n        width: 1em;\n        height: 1em;\n        line-height: 1em;\n        display: inline-block;\n        font-family: 'FontAwesome', sans-serif;\n        content: \"\\F054\"; }\n      .insp-wrapper .insp-tree .line .line-content {\n        padding-left: 15px; }\n        .insp-wrapper .insp-tree .line .line-content:hover {\n          background-color: #242424; }\n        .insp-wrapper .insp-tree .line .line-content .line:hover:first-child {\n          background-color: #383838; }\n  .insp-wrapper .insp-details {\n    background-color: #242424;\n    overflow-y: auto;\n    overflow-x: hidden;\n    color: #ccc;\n    font-family: \"Inconsolata\", sans-serif; }\n    .insp-wrapper .insp-details .base-row, .insp-wrapper .insp-details .row, .insp-wrapper .insp-details .header-row {\n      display: flex;\n      width: 100%; }\n      .insp-wrapper .insp-details .base-row .base-property, .insp-wrapper .insp-details .row .base-property, .insp-wrapper .insp-details .header-row .base-property, .insp-wrapper .insp-details .base-row .prop-name, .insp-wrapper .insp-details .row .prop-name, .insp-wrapper .insp-details .header-row .prop-name, .insp-wrapper .insp-details .base-row .prop-value, .insp-wrapper .insp-details .row .prop-value, .insp-wrapper .insp-details .header-row .prop-value {\n        word-wrap: break-word;\n        padding: 2px 0 2px 0; }\n      .insp-wrapper .insp-details .base-row .prop-name, .insp-wrapper .insp-details .row .prop-name, .insp-wrapper .insp-details .header-row .prop-name {\n        width: 35%; }\n      .insp-wrapper .insp-details .base-row .prop-value, .insp-wrapper .insp-details .row .prop-value, .insp-wrapper .insp-details .header-row .prop-value {\n        width: 59%;\n        padding-left: 10px; }\n        .insp-wrapper .insp-details .base-row .prop-value.clickable, .insp-wrapper .insp-details .row .prop-value.clickable, .insp-wrapper .insp-details .header-row .prop-value.clickable {\n          cursor: pointer; }\n          .insp-wrapper .insp-details .base-row .prop-value.clickable:hover, .insp-wrapper .insp-details .row .prop-value.clickable:hover, .insp-wrapper .insp-details .header-row .prop-value.clickable:hover {\n            background-color: #383838; }\n          .insp-wrapper .insp-details .base-row .prop-value.clickable:after, .insp-wrapper .insp-details .row .prop-value.clickable:after, .insp-wrapper .insp-details .header-row .prop-value.clickable:after {\n            font-family: 'FontAwesome', sans-serif;\n            content: \"\\A0   \\A0   \\A0   \\F054\"; }\n    .insp-wrapper .insp-details .row:nth-child(even) {\n      background-color: #2c2c2c; }\n    .insp-wrapper .insp-details .row.unfolded .prop-value.clickable:after {\n      font-family: 'FontAwesome', sans-serif;\n      content: \"\\A0   \\A0   \\A0   \\F078\"; }\n    .insp-wrapper .insp-details .header-row {\n      background-color: #2c2c2c;\n      color: #ccc;\n      width: 100%;\n      max-width: 100%; }\n      .insp-wrapper .insp-details .header-row > * {\n        color: #ccc !important;\n        padding: 5px 0 5px 5px !important;\n        cursor: pointer; }\n        .insp-wrapper .insp-details .header-row > *:hover {\n          background-color: #383838; }\n      .insp-wrapper .insp-details .header-row .header-col {\n        display: flex;\n        justify-content: space-between;\n        align-items: center; }\n        .insp-wrapper .insp-details .header-row .header-col .sort-direction {\n          margin-right: 5px; }\n    .insp-wrapper .insp-details .element-viewer, .insp-wrapper .insp-details .color-element, .insp-wrapper .insp-details .texture-element {\n      position: relative;\n      width: 10px;\n      height: 10px;\n      display: inline-block;\n      margin-left: 5px; }\n    .insp-wrapper .insp-details .texture-element {\n      color: #f29766;\n      margin-left: 10px; }\n      .insp-wrapper .insp-details .texture-element .texture-viewer {\n        color: #ccc;\n        position: absolute;\n        z-index: 10;\n        bottom: 0;\n        right: 0;\n        display: block;\n        width: 150px;\n        height: 150px;\n        border: 1px solid #454545;\n        background-color: #242424;\n        transform: translateX(100%) translateY(100%);\n        display: none;\n        flex-direction: column;\n        justify-content: flex-start;\n        align-items: center; }\n        .insp-wrapper .insp-details .texture-element .texture-viewer .texture-viewer-img {\n          margin: 10px 0 10px 0;\n          max-width: 110px;\n          max-height: 110px; }\n  .insp-wrapper .tabbar {\n    height: 32px;\n    display: flex;\n    align-items: center;\n    border-bottom: 1px solid #383838;\n    width: 100%;\n    overflow-x: auto;\n    overflow-y: hidden;\n    box-sizing: border-box; }\n    .insp-wrapper .tabbar .tab {\n      height: calc(32px - 2px);\n      width: auto;\n      padding: 0 10px 0 10px;\n      color: #ccc;\n      line-height: 32px;\n      text-align: center;\n      cursor: pointer;\n      margin: 0 5px 0 5px;\n      box-sizing: border-box; }\n      .insp-wrapper .tabbar .tab:hover {\n        border-bottom: 1px solid #f29766;\n        background-color: #2c2c2c; }\n      .insp-wrapper .tabbar .tab:active {\n        background-color: #383838; }\n      .insp-wrapper .tabbar .tab.active {\n        border-bottom: 1px solid #f29766; }\n    .insp-wrapper .tabbar .more-tabs {\n      width: 32px;\n      height: 32px;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      cursor: pointer;\n      position: relative;\n      border-right: 1px solid #383838; }\n      .insp-wrapper .tabbar .more-tabs:hover {\n        background-color: #383838; }\n      .insp-wrapper .tabbar .more-tabs:active {\n        color: #f29766;\n        background-color: #454545; }\n      .insp-wrapper .tabbar .more-tabs.active {\n        color: #f29766; }\n  .insp-wrapper .toolbar {\n    display: flex; }\n    .insp-wrapper .toolbar .tool {\n      width: 32px;\n      height: 32px;\n      display: flex;\n      justify-content: center;\n      align-items: center;\n      cursor: pointer;\n      position: relative;\n      border-right: 1px solid #383838; }\n      .insp-wrapper .toolbar .tool:hover {\n        background-color: #383838; }\n      .insp-wrapper .toolbar .tool:active {\n        color: #f29766;\n        background-color: #454545; }\n      .insp-wrapper .toolbar .tool.active {\n        color: #f29766; }\n  .insp-wrapper .searchbar {\n    border: 1px solid #2c2c2c;\n    margin-bottom: 5px;\n    display: flex;\n    align-items: center;\n    color: #b3b3b3; }\n    .insp-wrapper .searchbar input {\n      background-color: #242424;\n      border: none;\n      width: 100%;\n      outline: none;\n      font-family: \"Inconsolata\", sans-serif;\n      color: #b3b3b3;\n      padding: 3px 0 3px 10px;\n      margin: 6px 0 6px 0; }\n", ""]);

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

	var INSPECTOR;!(function(e){var t=(function(){function t(n,i,r,a,s){var o=this;if(this._popupMode=!1,this._initialTab=r,this._parentElement=a,this._scene=n,t.DOCUMENT=window.document,t.WINDOW=window,i)this.openPopup(!0);else{var l=this._scene.getEngine().getRenderingCanvas(),p=l.parentElement,c=(t.WINDOW.getComputedStyle(p),t.WINDOW.getComputedStyle(l));if(this._canvasStyle={width:e.Helpers.Css(l,"width"),height:e.Helpers.Css(l,"height"),position:c.position,top:c.top,bottom:c.bottom,left:c.left,right:c.right,padding:c.padding,paddingBottom:c.paddingBottom,paddingLeft:c.paddingLeft,paddingTop:c.paddingTop,paddingRight:c.paddingRight,margin:c.margin,marginBottom:c.marginBottom,marginLeft:c.marginLeft,marginTop:c.marginTop,marginRight:c.marginRight},this._parentElement){this._c2diwrapper=e.Helpers.CreateDiv("insp-wrapper",this._parentElement),this._c2diwrapper.style.width="100%",this._c2diwrapper.style.height="100%",this._c2diwrapper.style.paddingLeft="5px";var u=e.Helpers.CreateDiv("insp-right-panel",this._c2diwrapper);u.style.width="100%",u.style.height="100%",this._buildInspector(u)}else{this._c2diwrapper=e.Helpers.CreateDiv("insp-wrapper");for(var h in this._canvasStyle)this._c2diwrapper.style[h]=this._canvasStyle[h];var d=parseFloat(c.width.substr(0,c.width.length-2))||0,_=parseFloat(c.height.substr(0,c.height.length-2))||0;if("absolute"===c.position||"relative"===c.position){var v=parseFloat(c.left.substr(0,c.left.length-2))||0;d+v>=t.WINDOW.innerWidth&&(this._c2diwrapper.style.maxWidth=d-v+"px")}var f=this._getRelativeParent(l),b=f.clientWidth,g=f.clientHeight,m=d/b*100,C=_/g*100;this._c2diwrapper.style.width=m+"%",this._c2diwrapper.style.height=C+"%",l.style.position="static",l.style.width="100%",l.style.height="100%",l.style.paddingBottom="0",l.style.paddingLeft="0",l.style.paddingTop="0",l.style.paddingRight="0",l.style.margin="0",l.style.marginBottom="0",l.style.marginLeft="0",l.style.marginTop="0",l.style.marginRight="0",p.replaceChild(this._c2diwrapper,l),this._c2diwrapper.appendChild(l);var u=e.Helpers.CreateDiv("insp-right-panel",this._c2diwrapper);this._parentElement||Split([l,u],{direction:"horizontal",sizes:[75,25],onDrag:function(){e.Helpers.SEND_EVENT("resize"),o._tabbar&&o._tabbar.updateWidth()}}),this._buildInspector(u)}e.Helpers.SEND_EVENT("resize"),this._tabbar.updateWidth()}if(e.Helpers.IsBrowserEdge()||this.refresh(),s)for(var y=s.backgroundColor||"#242424",T=s.backgroundColorLighter||"#2c2c2c",E=s.backgroundColorLighter2||"#383838",P=s.backgroundColorLighter3||"#454545",O=s.color||"#ccc",L=s.colorTop||"#f29766",S=s.colorBot||"#5db0d7",N=t.DOCUMENT.querySelectorAll("style"),B=0;B<N.length;B++){var D=N[B];D.innerHTML.indexOf("insp-wrapper")!=-1&&(N[B].innerHTML=N[B].innerHTML.replace(/#242424/g,y).replace(/#2c2c2c/g,T).replace(/#383838/g,E).replace(/#454545/g,P).replace(/#ccc/g,O).replace(/#f29766/g,L).replace(/#5db0d7/g,S))}}return t.prototype._getRelativeParent=function(e,n){if(!e.parentElement)return e;var i=t.WINDOW.getComputedStyle(e);return n?"relative"===i.position||"absolute"===i.position?e:this._getRelativeParent(e.parentElement,!0):"static"==i.position?e.parentElement:this._getRelativeParent(e.parentElement,!0)},t.prototype._buildInspector=function(t){this._tabbar=new e.TabBar(this,this._initialTab),this._topPanel=e.Helpers.CreateDiv("top-panel",t),this._topPanel.appendChild(this._tabbar.toHtml()),this._tabbar.updateWidth(),this._tabPanel=e.Helpers.CreateDiv("tab-panel-content",this._topPanel)},Object.defineProperty(t.prototype,"scene",{get:function(){return this._scene},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"popupMode",{get:function(){return this._popupMode},enumerable:!0,configurable:!0}),t.prototype.filterItem=function(e){this._tabbar.getActiveTab().filter(e)},t.prototype.displayObjectDetails=function(e){this._tabbar.switchMeshTab(e)},t.prototype.refresh=function(){e.Helpers.CleanDiv(this._tabPanel);var t=this._tabbar.getActiveTab();t.update(),this._tabPanel.appendChild(t.getPanel()),e.Helpers.SEND_EVENT("resize")},t.prototype.dispose=function(){if(!this._popupMode){var t=this._scene.getEngine().getRenderingCanvas();for(var n in this._canvasStyle)t.style[n]=this._canvasStyle[n];t.parentElement.parentElement.insertBefore(t,this._c2diwrapper),e.Helpers.CleanDiv(this._c2diwrapper),this._c2diwrapper.remove(),e.Helpers.SEND_EVENT("resize")}},t.prototype.openPopup=function(n){var i=this;if(e.Helpers.IsBrowserEdge())console.warn("Inspector - Popup mode is disabled in Edge, as the popup DOM cannot be updated from the main window for security reasons");else{var r=window.open("","Babylon.js INSPECTOR","toolbar=no,resizable=yes,menubar=no,width=750,height=1000");r.document.title="Babylon.js INSPECTOR";for(var a=t.DOCUMENT.querySelectorAll("style"),s=0;s<a.length;s++)r.document.body.appendChild(a[s].cloneNode(!0));for(var o=document.querySelectorAll("link"),l=0;l<o.length;l++){var p=r.document.createElement("link");p.rel="stylesheet",p.href=o[l].href,r.document.head.appendChild(p)}n||this.dispose(),this._popupMode=!0,t.DOCUMENT=r.document,t.WINDOW=r,this._c2diwrapper=e.Helpers.CreateDiv("insp-wrapper",r.document.body);var c=e.Helpers.CreateDiv("insp-right-panel",this._c2diwrapper);c.classList.add("popupmode"),this._buildInspector(c),this.refresh(),r.addEventListener("resize",(function(){i._tabbar&&i._tabbar.updateWidth()}))}},t})();e.Inspector=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){e.PROPERTIES={format:function(t){var n=e.Helpers.GET_TYPE(t)||"type_not_defined";return e.PROPERTIES[n]&&e.PROPERTIES[n].format?e.PROPERTIES[n].format(t):e.Helpers.GET_TYPE(t)},type_not_defined:{properties:[],format:function(){return""}},Vector2:{type:BABYLON.Vector2,properties:["x","y"],format:function(t){return"x:"+e.Helpers.Trunc(t.x)+", y:"+e.Helpers.Trunc(t.y)}},Vector3:{type:BABYLON.Vector3,properties:["x","y","z"],format:function(t){return"x:"+e.Helpers.Trunc(t.x)+", y:"+e.Helpers.Trunc(t.y)+", z:"+e.Helpers.Trunc(t.z)}},Color3:{type:BABYLON.Color3,properties:["r","g","b"],format:function(e){return"R:"+e.r+", G:"+e.g+", B:"+e.b}},Quaternion:{type:BABYLON.Quaternion,properties:["x","y","z","w"]},Size:{type:BABYLON.Size,properties:["width","height"],format:function(t){return"Size - w:"+e.Helpers.Trunc(t.width)+", h:"+e.Helpers.Trunc(t.height)}},Texture:{type:BABYLON.Texture,properties:["hasAlpha","level","name","wrapU","wrapV","uScale","vScale","uAng","vAng","wAng","uOffset","vOffset"],format:function(e){return e.name}},MapTexture:{type:BABYLON.MapTexture},RenderTargetTexture:{type:BABYLON.RenderTargetTexture},DynamicTexture:{type:BABYLON.DynamicTexture},BaseTexture:{type:BABYLON.BaseTexture},FontTexture:{type:BABYLON.FontTexture},Sound:{type:BABYLON.Sound,properties:["name","autoplay","loop","useCustomAttenuation","soundTrackId","spatialSound","refDistance","rolloffFactor","maxDistance","distanceModel","isPlaying","isPaused"]},ArcRotateCamera:{type:BABYLON.ArcRotateCamera,properties:["position","alpha","beta","radius","angularSensibilityX","angularSensibilityY","target","lowerAlphaLimit","lowerBetaLimit","upperAlphaLimit","upperBetaLimit","lowerRadiusLimit","upperRadiusLimit","pinchPrecision","wheelPrecision","allowUpsideDown","checkCollisions"]},FreeCamera:{type:BABYLON.FreeCamera,properties:["position","rotation","rotationQuaternion","cameraDirection","cameraRotation","ellipsoid","applyGravity","angularSensibility","keysUp","keysDown","keysLeft","keysRight","checkCollisions","speed","lockedTarget","noRotationConstraint","fov","inertia","minZ","maxZ","layerMask","mode","orthoBottom","orthoTop","orthoLeft","orthoRight"]},Scene:{type:BABYLON.Scene,properties:["actionManager","activeCamera","ambientColor","clearColor","forceWireframe","forcePointsCloud","forceShowBoundingBoxes","useRightHandedSystem","hoverCursor","cameraToUseForPointers","fogEnabled","fogColor","fogDensity","fogStart","fogEnd","shadowsEnabled","lightsEnabled","collisionsEnabled","gravity","meshUnderPointer","pointerX","pointerY","uid"]},Mesh:{type:BABYLON.Mesh,properties:["name","position","rotation","rotationQuaternion","absolutePosition","material","actionManager","visibility","isVisible","isPickable","renderingGroupId","receiveShadows","renderOutline","outlineColor","outlineWidth","renderOverlay","overlayColor","overlayAlpha","hasVertexAlpha","useVertexColors","layerMask","alwaysSelectAsActiveMesh","ellipsoid","ellipsoidOffset","edgesWidth","edgesColor","checkCollisions","hasLODLevels"],format:function(e){return e.name}},StandardMaterial:{type:BABYLON.StandardMaterial,properties:["name","alpha","alphaMode","wireframe","isFrozen","zOffset","ambientColor","emissiveColor","diffuseColor","specularColor","specularPower","useAlphaFromDiffuseTexture","linkEmissiveWithDiffuse","useSpecularOverAlpha","diffuseFresnelParameters","opacityFresnelParameters","reflectionFresnelParameters","refractionFresnelParameters","emissiveFresnelParameters","diffuseTexture","emissiveTexture","specularTexture","ambientTexture","bumpTexture","lightMapTexture","opacityTexture","reflectionTexture","refractionTexture"],format:function(e){return e.name}},PrimitiveAlignment:{type:BABYLON.PrimitiveAlignment,properties:["horizontal","vertical"]},PrimitiveThickness:{type:BABYLON.PrimitiveThickness,properties:["topPixels","leftPixels","rightPixels","bottomPixels"]},BoundingInfo2D:{type:BABYLON.BoundingInfo2D,properties:["radius","center","extent"]},SolidColorBrush2D:{type:BABYLON.SolidColorBrush2D,properties:["color"]},GradientColorBrush2D:{type:BABYLON.GradientColorBrush2D,properties:["color1","color2","translation","rotation","scale"]},PBRMaterial:{type:BABYLON.PBRMaterial,properties:["name","albedoColor","albedoTexture","opacityTexture","reflectionTexture","emissiveTexture","bumpTexture","lightmapTexture","opacityFresnelParameters","emissiveFresnelParameters","linkEmissiveWithAlbedo","useLightmapAsShadowmap","useAlphaFromAlbedoTexture","useSpecularOverAlpha","useAutoMicroSurfaceFromReflectivityMap","useLogarithmicDepth","reflectivityColor","reflectivityTexture","reflectionTexture","reflectionColor","alpha","linkRefractionWithTransparency","indexOfRefraction","microSurface","useMicroSurfaceFromReflectivityMapAlpha","directIntensity","emissiveIntensity","specularIntensity","environmentIntensity","cameraExposure","cameraContrast","cameraColorGradingTexture","cameraColorCurves"]},Canvas2D:{type:BABYLON.Canvas2D},Canvas2DEngineBoundData:{type:BABYLON.Canvas2DEngineBoundData},Ellipse2D:{type:BABYLON.Ellipse2D},Ellipse2DInstanceData:{type:BABYLON.Ellipse2DInstanceData},Ellipse2DRenderCache:{type:BABYLON.Ellipse2DRenderCache},Group2D:{type:BABYLON.Group2D},IntersectInfo2D:{type:BABYLON.IntersectInfo2D},Lines2D:{type:BABYLON.Lines2D},Lines2DInstanceData:{type:BABYLON.Lines2DInstanceData},Lines2DRenderCache:{type:BABYLON.Lines2DRenderCache},PrepareRender2DContext:{type:BABYLON.PrepareRender2DContext},Prim2DBase:{type:BABYLON.Prim2DBase},Prim2DClassInfo:{type:BABYLON.Prim2DClassInfo},Prim2DPropInfo:{type:BABYLON.Prim2DPropInfo},Rectangle2D:{type:BABYLON.Rectangle2D},Rectangle2DInstanceData:{type:BABYLON.Rectangle2DInstanceData},Rectangle2DRenderCache:{type:BABYLON.Rectangle2DRenderCache},Render2DContext:{type:BABYLON.Render2DContext},RenderablePrim2D:{type:BABYLON.RenderablePrim2D},ScreenSpaceCanvas2D:{type:BABYLON.ScreenSpaceCanvas2D},Shape2D:{type:BABYLON.Shape2D},Shape2DInstanceData:{type:BABYLON.Shape2DInstanceData},Sprite2D:{type:BABYLON.Sprite2D},Sprite2DInstanceData:{type:BABYLON.Sprite2DInstanceData},Sprite2DRenderCache:{type:BABYLON.Sprite2DRenderCache},Text2D:{type:BABYLON.Text2D},Text2DInstanceData:{type:BABYLON.Text2DInstanceData},Text2DRenderCache:{type:BABYLON.Text2DRenderCache},WorldSpaceCanvas2D:{type:BABYLON.WorldSpaceCanvas2D},WorldSpaceCanvas2DNode:{type:BABYLON.WorldSpaceCanvas2DNode}}})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(){this._div=e.Helpers.CreateDiv()}return t.prototype.toHtml=function(){return this._div},t.prototype._build=function(){},t.prototype.dispose=function(){},t})();e.BasicElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function e(e){this._obj=e}return Object.defineProperty(e.prototype,"actualObject",{get:function(){return this._obj},enumerable:!0,configurable:!0}),e.prototype.correspondsTo=function(e){return e===this._obj},Object.defineProperty(e.prototype,"name",{get:function(){return e._name},enumerable:!0,configurable:!0}),Object.defineProperty(e.prototype,"object",{get:function(){return this._obj},enumerable:!0,configurable:!0}),e.prototype.highlight=function(e){},e})();t._name=BABYLON.Geometry.RandomId(),e.Adapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){return t.call(this,e)||this}return __extends(n,t),n.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},n.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},n.prototype.getProperties=function(){var t=[],n=[];this._obj instanceof BABYLON.ArcRotateCamera?n=e.PROPERTIES.ArcRotateCamera.properties:this._obj instanceof BABYLON.FreeCamera&&(n=e.PROPERTIES.FreeCamera.properties);for(var i=0,r=n;i<r.length;i++){var a=r[i],s=new e.Property(a,this._obj);t.push(new e.PropertyLine(s))}return t},n.prototype.getTools=function(){var t=[];return t.push(new e.CameraPOV(this)),t},n.prototype.setPOV=function(){this._obj.getScene().activeCamera=this._obj},n})(e.Adapter);e.CameraAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){return t.call(this,e)||this}return __extends(n,t),n.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},n.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},n.prototype.getProperties=function(){for(var t=[],n=e.PROPERTIES.Sound.properties,i=0,r=n;i<r.length;i++){var a=r[i],s=new e.Property(a,this._obj);t.push(new e.PropertyLine(s))}return t},n.prototype.getTools=function(){var t=[];return t.push(new e.SoundInteractions(this)),t},n.prototype.setPlaying=function(e){this._obj.isPlaying?this._obj.pause():this._obj.play(),this._obj.onended=function(){e()}},n})(e.Adapter);e.SoundAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){return t.call(this,e)||this}return __extends(n,t),n.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},n.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},n.prototype.getProperties=function(){return[]},n.prototype.getTools=function(){return[]},n})(e.Adapter);e.TextureAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){return t.call(this,e)||this}return __extends(n,t),n.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},n.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},n.prototype.getProperties=function(){for(var t=[],i=0,r=n._PROPERTIES;i<r.length;i++){var a=r[i],s=new e.Property(a,this._obj);t.push(new e.PropertyLine(s))}return t},n.prototype.getTools=function(){var t=[];return t.push(new e.Checkbox(this)),t},n.prototype.setVisible=function(e){this._obj.setEnabled(e)},n.prototype.isVisible=function(){return this._obj.isEnabled()},n.prototype.highlight=function(e){this.actualObject.renderOutline=e,this.actualObject.outlineWidth=.25,this.actualObject.outlineColor=BABYLON.Color3.Yellow()},n})(e.Adapter);t._PROPERTIES=["position","diffuse","intensity","radius","range","specular"],e.LightAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){return t.call(this,e)||this}return __extends(n,t),n.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},n.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},n.prototype.getProperties=function(){var t=[],n=[];this._obj instanceof BABYLON.StandardMaterial?n=e.PROPERTIES.StandardMaterial.properties:this._obj instanceof BABYLON.PBRMaterial&&(n=e.PROPERTIES.PBRMaterial.properties);for(var i=0,r=n;i<r.length;i++){var a=r[i],s=new e.Property(a,this._obj);t.push(new e.PropertyLine(s))}return t},n.prototype.getTools=function(){return[]},n.prototype.highlight=function(e){for(var t=this.actualObject,n=t.getBindedMeshes(),i=0,r=n;i<r.length;i++){var a=r[i];a.renderOutline=e,a.outlineWidth=.25,a.outlineColor=BABYLON.Color3.Yellow()}},n})(e.Adapter);e.MaterialAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){var n=t.call(this,e)||this;return n._axis=[],n}return __extends(n,t),n.prototype.id=function(){var e="";return this._obj.name&&(e=this._obj.name),e},n.prototype.type=function(){return e.Helpers.GET_TYPE(this._obj)},n.prototype.getProperties=function(){for(var t=[],n=0,i=e.PROPERTIES.Mesh.properties;n<i.length;n++){var r=i[n],a=new e.Property(r,this._obj);t.push(new e.PropertyLine(a))}return t},n.prototype.getTools=function(){var t=[];return t.push(new e.Checkbox(this)),t.push(new e.DebugArea(this)),this._obj.getTotalVertices()>0&&t.push(new e.BoundingBox(this)),t.push(new e.Info(this)),t},n.prototype.setVisible=function(e){this._obj.setEnabled(e),this._obj.isVisible=e},n.prototype.isVisible=function(){return this._obj.isEnabled()&&this._obj.isVisible},n.prototype.isBoxVisible=function(){return this._obj.showBoundingBox},n.prototype.setBoxVisible=function(e){return this._obj.showBoundingBox=e},n.prototype.debug=function(e){0==this._axis.length&&this._drawAxis();for(var t=0,n=this._axis;t<n.length;t++){n[t].setEnabled(e)}},n.prototype.getInfo=function(){return this._obj.getTotalVertices()+" vertices"},n.prototype.highlight=function(e){this.actualObject.renderOutline=e,this.actualObject.outlineWidth=.25,this.actualObject.outlineColor=BABYLON.Color3.Yellow()},n.prototype._drawAxis=function(){var e=this;this._obj.computeWorldMatrix();var t=(this._obj.getWorldMatrix(),new BABYLON.Vector3(8,0,0)),n=new BABYLON.Vector3(0,8,0),i=new BABYLON.Vector3(0,0,8),r=function(t,n,i){var r=BABYLON.Mesh.CreateLines("###axis###",[n,i],e._obj.getScene());return r.color=t,r.renderingGroupId=1,r},a=r(BABYLON.Color3.Red(),BABYLON.Vector3.Zero(),t);a.parent=this._obj,this._axis.push(a);var s=r(BABYLON.Color3.Green(),BABYLON.Vector3.Zero(),n);s.parent=this._obj,this._axis.push(s);var o=r(BABYLON.Color3.Blue(),BABYLON.Vector3.Zero(),i);o.parent=this._obj,this._axis.push(o)},n})(e.Adapter);e.MeshAdapter=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){var n=t.call(this)||this;return n._detailRows=[],n._sortDirection={},n._build(),e&&(n._detailRows=e,n.update()),n}return __extends(n,t),Object.defineProperty(n.prototype,"details",{set:function(e){this.clean(),this._detailRows=e,this.update()},enumerable:!0,configurable:!0}),n.prototype._build=function(){this._div.className="insp-details",this._div.id="insp-details",this._createHeaderRow(),this._div.appendChild(this._headerRow)},n.prototype.update=function(){this._sortDetails("name",1),this._addDetails()},n.prototype._addDetails=function(){for(var t=e.Helpers.CreateDiv("details",this._div),n=0,i=this._detailRows;n<i.length;n++){var r=i[n];t.appendChild(r.toHtml())}},n.prototype._sortDetails=function(t,n){for(var i=e.Inspector.DOCUMENT.querySelectorAll(".sort-direction"),r=0;r<i.length;r++)i[r].classList.remove("fa-chevron-up"),i[r].classList.remove("fa-chevron-down");n||!this._sortDirection[t]?this._sortDirection[t]=n||1:this._sortDirection[t]*=-1;var a=this._sortDirection[t];1==a?(this._headerRow.querySelector("#sort-direction-"+t).classList.remove("fa-chevron-down"),this._headerRow.querySelector("#sort-direction-"+t).classList.add("fa-chevron-up")):(this._headerRow.querySelector("#sort-direction-"+t).classList.remove("fa-chevron-up"),this._headerRow.querySelector("#sort-direction-"+t).classList.add("fa-chevron-down"));var s=function(e){return"string"==typeof e||e instanceof String};this._detailRows.sort((function(e,n){var i=String(e[t]),r=String(n[t]);return s(i)||(i=e[t].toString()),s(r)||(r=n[t].toString()),i.localeCompare(r,[],{numeric:!0})*a}))},n.prototype.clean=function(){for(var t=0,n=this._detailRows;t<n.length;t++){n[t].dispose()}e.Helpers.CleanDiv(this._div),this._div.appendChild(this._headerRow)},n.prototype.dispose=function(){for(var e=0,t=this._detailRows;e<t.length;e++){t[e].dispose()}},n.prototype._createHeaderRow=function(){var t=this;this._headerRow=e.Helpers.CreateDiv("header-row");var n=function(n,i){var r=e.Helpers.CreateDiv(i+" header-col"),a=e.Inspector.DOCUMENT.createElement("span");a.textContent=n.charAt(0).toUpperCase()+n.slice(1);var s=e.Inspector.DOCUMENT.createElement("i");return s.className="sort-direction fa",s.id="sort-direction-"+n,r.appendChild(a),r.appendChild(s),r.addEventListener("click",(function(e){t._sortDetails(n),t._addDetails()})),r};this._headerRow.appendChild(n("name","prop-name")),this._headerRow.appendChild(n("value","prop-value"))},n})(e.BasicElement);e.DetailPanel=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(e,t){this._property=e,this._obj=t}return Object.defineProperty(t.prototype,"name",{get:function(){return this._property},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"value",{get:function(){return this._obj[this._property]},set:function(e){this._obj[this._property]=e},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"type",{get:function(){return e.Helpers.GET_TYPE(this.value)},enumerable:!0,configurable:!0}),Object.defineProperty(t.prototype,"obj",{get:function(){return this._obj},set:function(e){this._obj=e},enumerable:!0,configurable:!0}),t})();e.Property=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function e(){}return e.format=function(e,t){var n=e[t];if(BABYLON.PrimitiveAlignment&&e instanceof BABYLON.PrimitiveAlignment)if("horizontal"===t)switch(n){case BABYLON.PrimitiveAlignment.AlignLeft:return"left";case BABYLON.PrimitiveAlignment.AlignRight:return"right";case BABYLON.PrimitiveAlignment.AlignCenter:return"center";case BABYLON.PrimitiveAlignment.AlignStretch:return"stretch"}else if("vertical"===t)switch(n){case BABYLON.PrimitiveAlignment.AlignTop:return"top";case BABYLON.PrimitiveAlignment.AlignBottom:return"bottom";case BABYLON.PrimitiveAlignment.AlignCenter:return"center";case BABYLON.PrimitiveAlignment.AlignStretch:return"stretch"}return n},e})();e.PropertyFormatter=t;var n=(function(){function n(t,n,i){void 0===i&&(i=0),this._children=[],this._elements=[],this._property=t,this._level=i,this._parent=n,this._div=e.Helpers.CreateDiv("row"),this._div.style.marginLeft=this._level+"px",e.Helpers.CreateDiv("prop-name",this._div).textContent=""+this.name,this._valueDiv=e.Helpers.CreateDiv("prop-value",this._div),this._valueDiv.textContent=this._displayValueContent()||"-",this._createElements();for(var r=0,a=this._elements;r<a.length;r++){var s=a[r];this._valueDiv.appendChild(s.toHtml())}this._updateValue(),this._isSimple()?(this._initInput(),this._valueDiv.addEventListener("click",this._displayInputHandler),this._input.addEventListener("keypress",this._validateInputHandler),this._input.addEventListener("keydown",this._escapeInputHandler)):(this._valueDiv.classList.add("clickable"),this._valueDiv.addEventListener("click",this._addDetails.bind(this))),e.Scheduler.getInstance().add(this)}return n.prototype._initInput=function(){this._input=document.createElement("input"),this._input.setAttribute("type","text"),this._displayInputHandler=this._displayInput.bind(this),this._validateInputHandler=this._validateInput.bind(this),this._escapeInputHandler=this._escapeInput.bind(this)},n.prototype._validateInput=function(t){if(13==t.keyCode){var n=this._input.value;this.updateObject(),this._property.value=n,this.update(),e.Scheduler.getInstance().pause=!1}else 27==t.keyCode&&this.update()},n.prototype._escapeInput=function(e){27==e.keyCode&&this.update()},n.prototype._removeInputWithoutValidating=function(){e.Helpers.CleanDiv(this._valueDiv),this._valueDiv.textContent="-";for(var t=0,n=this._elements;t<n.length;t++){var i=n[t];this._valueDiv.appendChild(i.toHtml())}this._valueDiv.addEventListener("click",this._displayInputHandler)},n.prototype._displayInput=function(t){this._valueDiv.removeEventListener("click",this._displayInputHandler);var n=this._valueDiv.textContent;this._valueDiv.textContent="",this._input.value=n,this._valueDiv.appendChild(this._input),e.Scheduler.getInstance().pause=!0},n.prototype.updateObject=function(){return this._parent&&(this._property.obj=this._parent.updateObject()),this._property.value},Object.defineProperty(n.prototype,"name",{get:function(){return this._property.name},enumerable:!0,configurable:!0}),Object.defineProperty(n.prototype,"value",{get:function(){return t.format(this._property.obj,this._property.name)},enumerable:!0,configurable:!0}),Object.defineProperty(n.prototype,"type",{get:function(){return this._property.type},enumerable:!0,configurable:!0}),n.prototype._createElements=function(){"Color3"!=this.type&&"Color4"!=this.type||this._elements.push(new e.ColorElement(this.value)),"Texture"==this.type&&this._elements.push(new e.TextureElement(this.value)),"HDRCubeTexture"==this.type&&this._elements.push(new e.HDRCubeTextureElement(this.value)),"CubeTexture"==this.type&&this._elements.push(new e.CubeTextureElement(this.value))},n.prototype._displayValueContent=function(){var t=this.value;return"number"==typeof t?e.Helpers.Trunc(t):"string"==typeof t||"boolean"==typeof t?t:e.PROPERTIES.format(t)},n.prototype.dispose=function(){e.Scheduler.getInstance().remove(this);for(var t=0,n=this._children;t<n.length;t++){var i=n[t];e.Scheduler.getInstance().remove(i)}for(var r=0,a=this._elements;r<a.length;r++){a[r].dispose()}this._elements=[]},n.prototype._updateValue=function(){this.updateObject(),this._valueDiv.childNodes[0].nodeValue=this._displayValueContent();for(var e=0,t=this._elements;e<t.length;e++){t[e].update(this.value)}},n.prototype.update=function(){this._removeInputWithoutValidating(),this._updateValue()},n._IS_TYPE_SIMPLE=function(t){var i=e.Helpers.GET_TYPE(t);return n._SIMPLE_TYPE.indexOf(i)!=-1},n.prototype._isSimple=function(){return null==this.value||"type_not_defined"===this.type||n._SIMPLE_TYPE.indexOf(this.type)!=-1},n.prototype.toHtml=function(){return this._div},n.prototype._addDetails=function(){if(this._div.classList.contains("unfolded")){this._div.classList.remove("unfolded");for(var t=0,i=this._children;t<i.length;t++){var r=i[t];this._div.parentNode.removeChild(r.toHtml())}}else{if(this._div.classList.toggle("unfolded"),0==this._children.length)for(var a=this.value,s=e.PROPERTIES[e.Helpers.GET_TYPE(a)].properties.reverse(),o=0,l=s;o<l.length;o++){var p=l[o],c=new e.Property(p,this._property.value),r=new n(c,this,this._level+n._MARGIN_LEFT);this._children.push(r)}for(var u=0,h=this._children;u<h.length;u++){var r=h[u];this._div.parentNode.insertBefore(r.toHtml(),this._div.nextSibling)}}},n})();n._SIMPLE_TYPE=["number","string","boolean"],n._MARGIN_LEFT=15,e.PropertyLine=n})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){var n=e.call(this)||this;return n._div.className="color-element",n._div.style.backgroundColor=n._toRgba(t),n}return __extends(t,e),t.prototype.update=function(e){e&&(this._div.style.backgroundColor=this._toRgba(e))},t.prototype._toRgba=function(e){if(e){var t=255*e.r|0,n=255*e.g|0,i=255*e.b|0;if(e instanceof BABYLON.Color4){e.a}return"rgba("+t+", "+n+", "+i+", 1)"}return""},t})(e.BasicElement);e.ColorElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n){var i=t.call(this)||this;return i._pause=!1,i._div.className="fa fa-search texture-element",i._textureDiv=e.Helpers.CreateDiv("texture-viewer",i._div),i._canvas=e.Helpers.CreateElement("canvas","texture-viewer-img",i._textureDiv),n&&(i._textureUrl=n.name),i._div.addEventListener("mouseover",i._showViewer.bind(i,"flex")),i._div.addEventListener("mouseout",i._showViewer.bind(i,"none")),i}return __extends(n,t),n.prototype.update=function(e){e&&e.url===this._textureUrl||(e&&(this._textureUrl=e.name),this._engine?(this._cube.material.dispose(!0,!0),this._cube.dispose()):this._initEngine(),this._populateScene())},n.prototype._populateScene=function(){var e=this,t=new BABYLON.CubeTexture(this._textureUrl,this._scene);t.coordinatesMode=BABYLON.Texture.SKYBOX_MODE,this._cube=BABYLON.Mesh.CreateBox("hdrSkyBox",10,this._scene);var n=new BABYLON.StandardMaterial("skyBox",this._scene);n.backFaceCulling=!1,n.reflectionTexture=t,n.reflectionTexture.coordinatesMode=BABYLON.Texture.SKYBOX_MODE,n.disableLighting=!0,this._cube.material=n,this._cube.registerBeforeRender((function(){e._cube.rotation.y+=.01}))},n.prototype._initEngine=function(){var e=this;this._engine=new BABYLON.Engine(this._canvas),this._scene=new BABYLON.Scene(this._engine),this._scene.clearColor=new BABYLON.Color4(0,0,0,0);new BABYLON.FreeCamera("cam",new BABYLON.Vector3(0,0,-20),this._scene),new BABYLON.HemisphericLight("",new BABYLON.Vector3(0,1,0),this._scene);this._engine.runRenderLoop((function(){e._pause||e._scene.render()})),this._canvas.setAttribute("width","110"),this._canvas.setAttribute("height","110")},n.prototype._showViewer=function(e){"none"!=e?(this._engine||(this._initEngine(),this._populateScene()),this._pause=!1):this._pause=!0,this._textureDiv.style.display=e},n.prototype.dispose=function(){this._engine&&(this._engine.dispose(),this._engine=null)},n})(e.BasicElement);e.CubeTextureElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){return e.call(this,t)||this}return __extends(t,e),t.prototype._populateScene=function(){var e=this,t=new BABYLON.HDRCubeTexture(this._textureUrl,this._scene,512);t.coordinatesMode=BABYLON.Texture.SKYBOX_MODE,this._cube=BABYLON.Mesh.CreateBox("hdrSkyBox",10,this._scene);var n=new BABYLON.PBRMaterial("skyBox",this._scene);n.backFaceCulling=!1,n.reflectionTexture=t,n.microSurface=1,n.disableLighting=!0,this._cube.material=n,this._cube.registerBeforeRender((function(){e._cube.rotation.y+=.01}))},t})(e.CubeTextureElement);e.HDRCubeTextureElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n){var i=t.call(this)||this;i._tab=n,i._div.classList.add("searchbar");var r=e.Inspector.DOCUMENT.createElement("i");return r.className="fa fa-search",i._div.appendChild(r),i._inputElement=e.Inspector.DOCUMENT.createElement("input"),i._inputElement.placeholder="Filter by name...",i._div.appendChild(i._inputElement),i._inputElement.addEventListener("keyup",(function(e){var t=i._inputElement.value;i._tab.filter(t)})),i}return __extends(n,t),n.prototype.reset=function(){this._inputElement.value=""},n.prototype.update=function(){},n})(e.BasicElement);e.SearchBar=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n){var i=t.call(this)||this;i._div.className="fa fa-search texture-element",i._textureDiv=e.Helpers.CreateDiv("texture-viewer",i._div);var r=e.Helpers.CreateDiv("texture-viewer-img",i._textureDiv),a=e.Helpers.CreateDiv(null,i._textureDiv);return n&&(a.textContent=n.getBaseSize().width+"px x "+n.getBaseSize().height+"px",r.style.backgroundImage="url('"+n.url+"')",r.style.width=n.getBaseSize().width+"px",r.style.height=n.getBaseSize().height+"px"),i._div.addEventListener("mouseover",i._showViewer.bind(i,"flex")),i._div.addEventListener("mouseout",i._showViewer.bind(i,"none")),i}return __extends(n,t),n.prototype.update=function(e){},n.prototype._showViewer=function(e){this._textureDiv.style.display=e},n})(e.BasicElement);e.TextureElement=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(t,n,i){var r=this;this._elem=t,i||(i=this._elem.parentElement),this._infoDiv=e.Helpers.CreateDiv("tooltip",i),this._elem.addEventListener("mouseover",(function(){r._infoDiv.textContent=n,r._infoDiv.style.display="block"})),this._elem.addEventListener("mouseout",(function(){r._infoDiv.style.display="none"}))}return t})();e.Tooltip=t
	})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(){}return t.GET_TYPE=function(e){if(null!=e&&void 0!=e){var t=BABYLON.Tools.getClassName(e);return t&&"object"!==t||(t=e.constructor.name)||(t=this._GetFnName(e.constructor)),this._CheckIfTypeExists(t)?t:this._GetTypeFor(e)}return"type_not_defined"},t._CheckIfTypeExists=function(t){return!!e.PROPERTIES[t]},t.IsBrowserEdge=function(){return/Edge/.test(navigator.userAgent)},t._GetTypeFor=function(t){for(var n in e.PROPERTIES){var i=e.PROPERTIES[n];if(i.type&&t instanceof i.type)return n}return"type_not_defined"},t._GetFnName=function(e){var t="function"==typeof e,n=t&&(e.name&&["",e.name]||e.toString().match(/function ([^\(]+)/));return!t&&"not a function"||n&&n[1]||"anonymous"},t.SEND_EVENT=function(t){var n;e.Inspector.DOCUMENT.createEvent?(n=e.Inspector.DOCUMENT.createEvent("HTMLEvents"),n.initEvent(t,!0,!0)):n=new Event(t),window.dispatchEvent(n)},t.Trunc=function(e){return Math.round(e)!==e?e.toFixed(2):e},t.CreateDiv=function(e,n){return t.CreateElement("div",e,n)},t.CreateElement=function(t,n,i){var r=e.Inspector.DOCUMENT.createElement(t);return n&&(r.className=n),i&&i.appendChild(r),r},t.CleanDiv=function(e){for(;e.firstChild;)e.removeChild(e.firstChild)},t.Css=function(n,i){var r=n.cloneNode(!0),a=t.CreateDiv("",e.Inspector.DOCUMENT.body);a.style.display="none",a.appendChild(r);var s=e.Inspector.WINDOW.getComputedStyle(r)[i];return a.parentNode.removeChild(a),s},t.LoadScript=function(){BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/highlight.min.js",(function(n){t.CreateElement("script","",e.Inspector.DOCUMENT.body).textContent=n,BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/languages/glsl.min.js",(function(n){t.CreateElement("script","",e.Inspector.DOCUMENT.body).textContent=n,BABYLON.Tools.LoadFile("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.7.0/styles/zenburn.min.css",(function(n){t.CreateElement("style","",e.Inspector.DOCUMENT.body).textContent=n}))}),null,null,null,(function(){console.log("erreur")}))}),null,null,null,(function(){console.log("erreur")}))},t.IsSystemName=function(e){return null!=e&&(0===e.indexOf("###")&&e.lastIndexOf("###")===e.length-3)},t})();e.Helpers=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function e(){this.pause=!1,this._updatableProperties=[],this._timer=setInterval(this._update.bind(this),e.REFRESH_TIME)}return e.getInstance=function(){return e._instance||(e._instance=new e),e._instance},e.prototype.add=function(e){this._updatableProperties.push(e)},e.prototype.remove=function(e){var t=this._updatableProperties.indexOf(e);t!=-1&&this._updatableProperties.splice(t,1)},e.prototype._update=function(){if(!this.pause)for(var e=0,t=this._updatableProperties;e<t.length;e++){var n=t[e];n.update()}},e})();t.REFRESH_TIME=250,e.Scheduler=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){var i=t.call(this)||this;return i._isActive=!1,i._tabbar=e,i.name=n,i._build(),i}return __extends(n,t),n.prototype.isActive=function(){return this._isActive},n.prototype._build=function(){var e=this;this._div.className="tab",this._div.textContent=this.name,this._div.addEventListener("click",(function(t){e._tabbar.switchTab(e)}))},n.prototype.active=function(e){e?this._div.classList.add("active"):this._div.classList.remove("active"),this._isActive=e},n.prototype.update=function(){},n.prototype.getPanel=function(){return this._panel},n.prototype.filter=function(e){},n.prototype.select=function(e){},n.prototype.highlightNode=function(e){},n.prototype.getPixelWidth=function(){var t=e.Inspector.WINDOW.getComputedStyle(this._div),n=parseFloat(t.marginLeft.substr(0,t.marginLeft.length-2))||0,i=parseFloat(t.marginRight.substr(0,t.marginRight.length-2))||0;return(this._div.clientWidth||0)+n+i},n})(e.BasicElement);e.Tab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i,r){var a=t.call(this,n,i)||this;return a._treeItems=[],a._inspector=r,a._panel=e.Helpers.CreateDiv("tab-panel"),a._panel.classList.add("searchable"),a._searchBar=new e.SearchBar(a),a._panel.appendChild(a._searchBar.toHtml()),a._treePanel=e.Helpers.CreateDiv("insp-tree",a._panel),a._detailsPanel=new e.DetailPanel,a._panel.appendChild(a._detailsPanel.toHtml()),Split([a._treePanel,a._detailsPanel.toHtml()],{blockDrag:a._inspector.popupMode,direction:"vertical"}),a.update(),a}return __extends(n,t),n.prototype.dispose=function(){this._detailsPanel.dispose()},n.prototype.update=function(t){var n;t?n=t:(this._treeItems=this._getTree(),n=this._treeItems),e.Helpers.CleanDiv(this._treePanel),this._detailsPanel.clean(),n.sort((function(e,t){return e.compareTo(t)}));for(var i=0,r=n;i<r.length;i++){var a=r[i];this._treePanel.appendChild(a.toHtml())}},n.prototype.displayDetails=function(e){this.activateNode(e),this._detailsPanel.details=e.getDetails()},n.prototype.select=function(e){this.highlightNode(),this.activateNode(e),this.displayDetails(e)},n.prototype.highlightNode=function(e){if(this._treeItems)for(var t=0,n=this._treeItems;t<n.length;t++){var i=n[t];i.highlight(!1)}e&&e.highlight(!0)},n.prototype.activateNode=function(e){if(this._treeItems)for(var t=0,n=this._treeItems;t<n.length;t++){var i=n[t];i.active(!1)}e.active(!0)},n.prototype.getItemFor=function(e){for(var t=e,n=0,i=this._treeItems;n<i.length;n++){var r=i[n];if(r.correspondsTo(t))return r}return null},n.prototype.filter=function(e){for(var t=[],n=0,i=this._treeItems;n<i.length;n++){var r=i[n];r.id.toLowerCase().indexOf(e.toLowerCase())!=-1&&t.push(r);for(var a=0,s=r.children;a<s.length;a++){s[a].id.toLowerCase().indexOf(e.toLowerCase())!=-1&&t.push(r)}}this.update(t)},n})(e.Tab);e.PropertyTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){return t.call(this,e,"Camera",n)||this}return __extends(n,t),n.prototype._getTree=function(){for(var t=[],n=this._inspector.scene,i=0,r=n.cameras;i<r.length;i++){var a=r[i];t.push(new e.TreeItem(this,new e.CameraAdapter(a)))}return t},n})(e.PropertyTab);e.CameraTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){return t.call(this,e,"Audio",n)||this}return __extends(n,t),n.prototype._getTree=function(){for(var t=this,n=[],i=this._inspector.scene,r=0,a=i.soundTracks;r<a.length;r++){a[r].soundCollection.forEach((function(i){n.push(new e.TreeItem(t,new e.SoundAdapter(i)))}))}return n},n})(e.PropertyTab);e.SoundTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i){var r=t.call(this,n,"Textures")||this;return r._treeItems=[],r._inspector=i,r._panel=e.Helpers.CreateDiv("tab-panel"),r._treePanel=e.Helpers.CreateDiv("insp-tree",r._panel),r._imagePanel=e.Helpers.CreateDiv("image-panel",r._panel),Split([r._treePanel,r._imagePanel],{blockDrag:r._inspector.popupMode,direction:"vertical"}),r.update(),r}return __extends(n,t),n.prototype.dispose=function(){},n.prototype.update=function(t){var n;t?n=t:(this._treeItems=this._getTree(),n=this._treeItems),e.Helpers.CleanDiv(this._treePanel),e.Helpers.CleanDiv(this._imagePanel),n.sort((function(e,t){return e.compareTo(t)}));for(var i=0,r=n;i<r.length;i++){var a=r[i];this._treePanel.appendChild(a.toHtml())}},n.prototype._getTree=function(){for(var t=[],n=this._inspector.scene,i=0,r=n.textures;i<r.length;i++){var a=r[i];t.push(new e.TreeItem(this,new e.TextureAdapter(a)))}return t},n.prototype.displayDetails=function(t){this.activateNode(t),e.Helpers.CleanDiv(this._imagePanel);var n=t.adapter.object,i=e.Helpers.CreateElement("img","texture-image",this._imagePanel);if(n instanceof BABYLON.MapTexture)n.bindTextureForPosSize(new BABYLON.Vector2(0,0),new BABYLON.Size(n.getSize().width,n.getSize().height),!1),BABYLON.Tools.DumpFramebuffer(n.getSize().width,n.getSize().height,this._inspector.scene.getEngine(),(function(e){return i.src=e})),n.unbindTexture();else if(n instanceof BABYLON.RenderTargetTexture)BABYLON.Tools.CreateScreenshotUsingRenderTarget(this._inspector.scene.getEngine(),n.activeCamera,{precision:1},(function(e){return i.src=e}));else if(n.url)i.src=n.url;else if(n._canvas){var r=n._canvas.toDataURL("image/png");i.src=r}},n.prototype.select=function(e){this.highlightNode(),this.activateNode(e),this.displayDetails(e)},n.prototype.activateNode=function(e){if(this._treeItems)for(var t=0,n=this._treeItems;t<n.length;t++){var i=n[t];i.active(!1)}e.active(!0)},n.prototype.highlightNode=function(e){if(this._treeItems)for(var t=0,n=this._treeItems;t<n.length;t++){var i=n[t];i.highlight(!1)}e&&e.highlight(!0)},n})(e.Tab);e.TextureTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){return t.call(this,e,"Light",n)||this}return __extends(n,t),n.prototype._getTree=function(){for(var t=[],n=this._inspector.scene,i=0,r=n.lights;i<r.length;i++){var a=r[i];t.push(new e.TreeItem(this,new e.LightAdapter(a)))}return t},n})(e.PropertyTab);e.LightTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){return t.call(this,e,"Material",n)||this}return __extends(n,t),n.prototype._getTree=function(){for(var t=[],n=this._inspector.scene,i=0,r=n.materials;i<r.length;i++){var a=r[i];t.push(new e.TreeItem(this,new e.MaterialAdapter(a)))}return t},n})(e.PropertyTab);e.MaterialTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){return t.call(this,e,"Mesh",n)||this}return __extends(n,t),n.prototype._getTree=function(){for(var t=this,n=[],i=[],r=function(n){var a=n.getDescendants(!0);if(a.length>0){var s=new e.TreeItem(t,new e.MeshAdapter(n));i.push(s);for(var o=0,l=a;o<l.length;o++){var p=l[o];if(p instanceof BABYLON.AbstractMesh&&!e.Helpers.IsSystemName(p.name)){var c=r(p);s.add(c)}}return s.update(),s}return i.push(n),new e.TreeItem(t,new e.MeshAdapter(n))},a=this._inspector.scene,s=0,o=a.meshes;s<o.length;s++){var l=o[s];if(i.indexOf(l)==-1&&!e.Helpers.IsSystemName(l.name)){var p=r(l);n.push(p)}}return n},n})(e.PropertyTab);e.MeshTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i){var r=t.call(this,n,"Scene")||this;r._skeletonViewers=[],r._inspector=i,r._panel=e.Helpers.CreateDiv("tab-panel"),r._actions=e.Helpers.CreateDiv("scene-actions",r._panel),r._detailsPanel=new e.DetailPanel,r._panel.appendChild(r._detailsPanel.toHtml());for(var a=[],s=0,o=e.PROPERTIES.Scene.properties;s<o.length;s++){var l=o[s];a.push(new e.PropertyLine(new e.Property(l,r._inspector.scene)))}r._detailsPanel.details=a,Split([r._actions,r._detailsPanel.toHtml()],{blockDrag:r._inspector.popupMode,sizes:[50,50],direction:"vertical"});var p=e.Helpers.CreateDiv("actions-title",r._actions);p.textContent="Rendering mode";var c=e.Helpers.CreateDiv("action-radio",r._actions),u=e.Helpers.CreateDiv("action-radio",r._actions),h=e.Helpers.CreateDiv("action-radio",r._actions);c.textContent="Point",u.textContent="Wireframe",h.textContent="Solid",r._inspector.scene.forcePointsCloud?c.classList.add("active"):r._inspector.scene.forceWireframe?u.classList.add("active"):h.classList.add("active"),r._generateRadioAction([c,u,h]),c.addEventListener("click",(function(){r._inspector.scene.forcePointsCloud=!0,r._inspector.scene.forceWireframe=!1})),u.addEventListener("click",(function(){r._inspector.scene.forcePointsCloud=!1,r._inspector.scene.forceWireframe=!0})),h.addEventListener("click",(function(){r._inspector.scene.forcePointsCloud=!1,r._inspector.scene.forceWireframe=!1})),p=e.Helpers.CreateDiv("actions-title",r._actions),p.textContent="Textures channels",r._generateActionLine("Diffuse Texture",BABYLON.StandardMaterial.DiffuseTextureEnabled,(function(e){BABYLON.StandardMaterial.DiffuseTextureEnabled=e})),r._generateActionLine("Ambient Texture",BABYLON.StandardMaterial.AmbientTextureEnabled,(function(e){BABYLON.StandardMaterial.AmbientTextureEnabled=e})),r._generateActionLine("Specular Texture",BABYLON.StandardMaterial.SpecularTextureEnabled,(function(e){BABYLON.StandardMaterial.SpecularTextureEnabled=e})),r._generateActionLine("Emissive Texture",BABYLON.StandardMaterial.EmissiveTextureEnabled,(function(e){BABYLON.StandardMaterial.EmissiveTextureEnabled=e})),r._generateActionLine("Bump Texture",BABYLON.StandardMaterial.BumpTextureEnabled,(function(e){BABYLON.StandardMaterial.BumpTextureEnabled=e})),r._generateActionLine("Opacity Texture",BABYLON.StandardMaterial.OpacityTextureEnabled,(function(e){BABYLON.StandardMaterial.OpacityTextureEnabled=e})),r._generateActionLine("Reflection Texture",BABYLON.StandardMaterial.ReflectionTextureEnabled,(function(e){BABYLON.StandardMaterial.ReflectionTextureEnabled=e})),r._generateActionLine("Refraction Texture",BABYLON.StandardMaterial.RefractionTextureEnabled,(function(e){BABYLON.StandardMaterial.RefractionTextureEnabled=e})),r._generateActionLine("ColorGrading",BABYLON.StandardMaterial.ColorGradingTextureEnabled,(function(e){BABYLON.StandardMaterial.ColorGradingTextureEnabled=e})),r._generateActionLine("Lightmap Texture",BABYLON.StandardMaterial.LightmapTextureEnabled,(function(e){BABYLON.StandardMaterial.LightmapTextureEnabled=e})),r._generateActionLine("Fresnel",BABYLON.StandardMaterial.FresnelEnabled,(function(e){BABYLON.StandardMaterial.FresnelEnabled=e})),p=e.Helpers.CreateDiv("actions-title",r._actions),p.textContent="Options",r._generateActionLine("Animations",r._inspector.scene.animationsEnabled,(function(e){r._inspector.scene.animationsEnabled=e})),r._generateActionLine("Collisions",r._inspector.scene.collisionsEnabled,(function(e){r._inspector.scene.collisionsEnabled=e})),r._generateActionLine("Fog",r._inspector.scene.fogEnabled,(function(e){r._inspector.scene.fogEnabled=e})),r._generateActionLine("Lens flares",r._inspector.scene.lensFlaresEnabled,(function(e){r._inspector.scene.lensFlaresEnabled=e})),r._generateActionLine("Lights",r._inspector.scene.lightsEnabled,(function(e){r._inspector.scene.lightsEnabled=e})),r._generateActionLine("Particles",r._inspector.scene.particlesEnabled,(function(e){r._inspector.scene.particlesEnabled=e})),r._generateActionLine("Post-processes",r._inspector.scene.postProcessesEnabled,(function(e){r._inspector.scene.postProcessesEnabled=e})),r._generateActionLine("Probes",r._inspector.scene.probesEnabled,(function(e){r._inspector.scene.probesEnabled=e})),r._generateActionLine("Procedural textures",r._inspector.scene.proceduralTexturesEnabled,(function(e){r._inspector.scene.proceduralTexturesEnabled=e})),r._generateActionLine("Render targets",r._inspector.scene.renderTargetsEnabled,(function(e){r._inspector.scene.renderTargetsEnabled=e})),r._generateActionLine("Shadows",r._inspector.scene.shadowsEnabled,(function(e){r._inspector.scene.shadowsEnabled=e})),r._generateActionLine("Skeletons",r._inspector.scene.skeletonsEnabled,(function(e){r._inspector.scene.skeletonsEnabled=e})),r._generateActionLine("Sprites",r._inspector.scene.spritesEnabled,(function(e){r._inspector.scene.spritesEnabled=e})),r._generateActionLine("Textures",r._inspector.scene.texturesEnabled,(function(e){r._inspector.scene.texturesEnabled=e})),p=e.Helpers.CreateDiv("actions-title",r._actions),p.textContent="Audio";var d=e.Helpers.CreateDiv("action-radio",r._actions),_=e.Helpers.CreateDiv("action-radio",r._actions);return r._generateActionLine("Disable audio",!r._inspector.scene.audioEnabled,(function(e){r._inspector.scene.audioEnabled=!e})),d.textContent="Headphones",_.textContent="Normal speakers",r._generateRadioAction([d,_]),r._inspector.scene.headphone?d.classList.add("active"):_.classList.add("active"),d.addEventListener("click",(function(){r._inspector.scene.headphone=!0})),_.addEventListener("click",(function(){r._inspector.scene.headphone=!1})),p=e.Helpers.CreateDiv("actions-title",r._actions),p.textContent="Viewer",r._generateActionLine("Skeletons",!1,(function(e){if(e)for(var t=0;t<r._inspector.scene.meshes.length;t++){var n=r._inspector.scene.meshes[t];if(n.skeleton){for(var i=!1,a=0;a<r._skeletonViewers.length;a++)if(r._skeletonViewers[a].skeleton===n.skeleton){i=!0;break}if(i)continue;var s=new BABYLON.Debug.SkeletonViewer(n.skeleton,n,r._inspector.scene);s.isEnabled=!0,r._skeletonViewers.push(s)}}else{for(var t=0;t<r._skeletonViewers.length;t++)r._skeletonViewers[t].dispose();r._skeletonViewers=[]}})),r}return __extends(n,t),n.prototype.dispose=function(){this._detailsPanel.dispose()},n.prototype._generateActionLine=function(t,n,i){var r=e.Helpers.CreateDiv("scene-actions",this._actions);r.textContent=t,r.classList.add("action"),n&&r.classList.add("active"),r.addEventListener("click",(function(e){r.classList.toggle("active");var t=r.classList.contains("active");i(t)}))},n.prototype._generateRadioAction=function(e){for(var t=function(t,n){for(var i=0,r=e;i<r.length;i++){r[i].classList.remove("active")}t.classList.add("active")},n=0,i=e;n<i.length;n++){var r=i[n];r.addEventListener("click",t.bind(this,r))}},n})(e.Tab);e.SceneTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i){var r=t.call(this,n,"Shader")||this;r._inspector=i,r._panel=e.Helpers.CreateDiv("tab-panel");var a=e.Helpers.CreateDiv("shader-tree-panel");r._vertexPanel=e.Helpers.CreateDiv("shader-panel"),r._fragmentPanel=e.Helpers.CreateDiv("shader-panel"),r._panel.appendChild(a),r._panel.appendChild(r._vertexPanel),r._panel.appendChild(r._fragmentPanel),e.Helpers.LoadScript(),Split([r._vertexPanel,r._fragmentPanel],{blockDrag:r._inspector.popupMode,sizes:[50,50],direction:"vertical"});var s=e.Helpers.CreateElement("select","",a);s.addEventListener("change",r._selectShader.bind(r));var o=e.Helpers.CreateElement("option","",s);o.textContent="Select a shader",o.setAttribute("value",""),o.setAttribute("disabled","true"),o.setAttribute("selected","true");for(var l=0,p=r._inspector.scene.materials;l<p.length;l++){var c=p[l];if(c instanceof BABYLON.ShaderMaterial){var u=e.Helpers.CreateElement("option","",s);u.setAttribute("value",c.id),u.textContent=c.name+" - "+c.id}}return r}return __extends(n,t),n.prototype._selectShader=function(t){var n=t.target.value,i=this._inspector.scene.getMaterialByID(n);e.Helpers.CleanDiv(this._vertexPanel);var r=e.Helpers.CreateDiv("shader-panel-title",this._vertexPanel);r.textContent="Vertex shader";var a=e.Helpers.CreateElement("code","glsl",e.Helpers.CreateElement("pre","",this._vertexPanel));a.textContent=this._beautify(i.getEffect().getVertexShaderSource()),e.Helpers.CleanDiv(this._fragmentPanel),r=e.Helpers.CreateDiv("shader-panel-title",this._fragmentPanel),r.textContent="Frgament shader",a=e.Helpers.CreateElement("code","glsl",e.Helpers.CreateElement("pre","",this._fragmentPanel)),a.textContent=this._beautify(i.getEffect().getFragmentShaderSource()),e.Helpers.CreateElement("script","",e.Inspector.DOCUMENT.body).textContent="hljs.initHighlighting();"},n.prototype.dispose=function(){},n.prototype._getBracket=function(e){for(var t=e.indexOf("{"),n=e.substr(t+1).split(""),i=1,r=t,a=0,s=0,o=n;s<o.length;s++){var l=o[s];if(r++,"{"===l&&i++,"}"===l&&i--,0==i){a=r;break}}return{firstBracket:t,lastBracket:a}},n.prototype._beautify=function(e,t){void 0===t&&(t=0);for(var n=this._getBracket(e),i=n.firstBracket,r=n.lastBracket,a="",s=0;s<t;s++)a+="    ";if(i==-1)return e=a+e,e=e.replace(/;./g,(function(e){return"\n"+e.substr(1)})),e=e.replace(/=/g," = "),e=e.replace(/\n/g,"\n"+a);var o=e.substr(0,i),l=e.substr(r+1,e.length),p=e.substr(i+1,r-i-1);return p=this._beautify(p,t+1),this._beautify(o,t)+"{\n"+p+"\n"+a+"}\n"+this._beautify(l,t)},n})(e.Tab);e.ShaderTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i){var r=t.call(this,n,"Console")||this;r._inspector=i,r._panel=e.Helpers.CreateDiv("tab-panel");var a=e.Helpers.CreateDiv("console-panel"),s=e.Helpers.CreateDiv("console-panel");r._panel.appendChild(a),r._panel.appendChild(s),Split([a,s],{blockDrag:r._inspector.popupMode,sizes:[50,50],direction:"vertical"});var o=e.Helpers.CreateDiv("console-panel-title",a);return o.textContent="Console logs",o=e.Helpers.CreateDiv("console-panel-title",s),o.textContent="Babylon.js logs",r._consolePanelContent=e.Helpers.CreateDiv("console-panel-content",a),r._bjsPanelContent=e.Helpers.CreateDiv("console-panel-content",s),r._oldConsoleLog=console.log,r._oldConsoleWarn=console.warn,r._oldConsoleError=console.error,console.log=r._addConsoleLog.bind(r),console.warn=r._addConsoleWarn.bind(r),console.error=r._addConsoleError.bind(r),r._bjsPanelContent.innerHTML=BABYLON.Tools.LogCache,BABYLON.Tools.OnNewCacheEntry=function(e){r._bjsPanelContent.innerHTML+=e,r._bjsPanelContent.scrollTop=r._bjsPanelContent.scrollHeight},r}return __extends(n,t),n.prototype.dispose=function(){console.log=this._oldConsoleLog,console.warn=this._oldConsoleWarn,console.error=this._oldConsoleError},n.prototype._message=function(t,n,i){e.Helpers.CreateDiv("caller",this._consolePanelContent).textContent=i,e.Helpers.CreateDiv(t,this._consolePanelContent).textContent+=n,this._consolePanelContent.scrollTop=this._consolePanelContent.scrollHeight},n.prototype._addConsoleLog=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];for(var i=this._addConsoleLog.caller,r=null==i?"Window":"Function "+i.name+": ",a=0;a<t.length;a++)this._message("log",t[a],r),e.Helpers.IsBrowserEdge()||this._oldConsoleLog(t[a])},n.prototype._addConsoleWarn=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];for(var i=this._addConsoleLog.caller,r=null==i?"Window":i.name,a=0;a<t.length;a++)this._message("warn",t[a],r),e.Helpers.IsBrowserEdge()||this._oldConsoleWarn(t[a])},n.prototype._addConsoleError=function(){for(var t=[],n=0;n<arguments.length;n++)t[n]=arguments[n];for(var i=this._addConsoleLog.caller,r=null==i?"Window":i.name,a=0;a<t.length;a++)this._message("error",t[a],r),e.Helpers.IsBrowserEdge()||this._oldConsoleError(t[a])},n})(e.Tab);e.ConsoleTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i){var r=t.call(this,n,"Stats")||this;r._updatableProperties=[],r._inspector=i,r._scene=r._inspector.scene,r._engine=r._scene.getEngine(),r._glInfo=r._engine.getGlInfo(),r._panel=e.Helpers.CreateDiv("tab-panel"),r._panel.classList.add("stats-panel");var a=e.Helpers.CreateDiv("stat-title1",r._panel),s=e.Helpers.CreateElement("span","stats-fps");r._updatableProperties.push({elem:s,updateFct:function(){return BABYLON.Tools.Format(r._inspector.scene.getEngine().getFps(),0)+" fps"}});var o=e.Helpers.CreateElement("span");o.textContent="Babylon.js v"+BABYLON.Engine.Version+" - ",a.appendChild(o),a.appendChild(s),r._updateLoopHandler=r._update.bind(r),a=e.Helpers.CreateDiv("stat-title2",r._panel),a.textContent="Count";var l=(r._createStatLabel("Total meshes",r._panel),e.Helpers.CreateDiv("stat-value",r._panel));r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.meshes.length.toString()}}),r._createStatLabel("Draw calls",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.drawCalls.toString()}}),r._createStatLabel("Total lights",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.lights.length.toString()}}),r._createStatLabel("Total vertices",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.getTotalVertices().toString()}}),r._createStatLabel("Total materials",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.materials.length.toString()}}),r._createStatLabel("Total textures",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.textures.length.toString()}}),r._createStatLabel("Active meshes",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.getActiveMeshes().length.toString()}}),r._createStatLabel("Active indices",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.getActiveIndices().toString()}}),r._createStatLabel("Active bones",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.getActiveBones().toString()}}),r._createStatLabel("Active particles",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._scene.getActiveParticles().toString()}}),a=e.Helpers.CreateDiv("stat-title2",r._panel),a.textContent="Duration";var l=(r._createStatLabel("Meshes selection",r._panel),e.Helpers.CreateDiv("stat-value",r._panel));r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(r._scene.getEvaluateActiveMeshesDuration())}}),r._createStatLabel("Render targets",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(r._scene.getRenderTargetsDuration())}}),r._createStatLabel("Particles",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(r._scene.getParticlesDuration())}}),r._createStatLabel("Sprites",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(r._scene.getSpritesDuration())}}),r._createStatLabel("Render",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(r._scene.getRenderDuration())}}),r._createStatLabel("Frame",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(r._scene.getLastFrameDuration())}}),r._createStatLabel("Potential FPS",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return BABYLON.Tools.Format(1e3/r._scene.getLastFrameDuration(),0)}}),r._createStatLabel("Resolution",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getRenderWidth()+"x"+r._engine.getRenderHeight()}}),a=e.Helpers.CreateDiv("stat-title2",r._panel),a.textContent="Extensions";var l=(r._createStatLabel("Std derivatives",r._panel),e.Helpers.CreateDiv("stat-value",r._panel));r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().standardDerivatives?"Yes":"No"}}),r._createStatLabel("Compressed textures",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().s3tc?"Yes":"No"}}),r._createStatLabel("Hardware instances",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().instancedArrays?"Yes":"No"}}),r._createStatLabel("Texture float",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().textureFloat?"Yes":"No"}}),r._createStatLabel("32bits indices",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().uintIndices?"Yes":"No"}}),r._createStatLabel("Fragment depth",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().fragmentDepthSupported?"Yes":"No"}}),r._createStatLabel("High precision shaders",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().highPrecisionShaderSupported?"Yes":"No"}}),r._createStatLabel("Draw buffers",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().drawBuffersExtension?"Yes":"No"}}),r._createStatLabel("Vertex array object",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().vertexArrayObject?"Yes":"No"}}),a=e.Helpers.CreateDiv("stat-title2",r._panel),a.textContent="Caps.";var l=(r._createStatLabel("Stencil",r._panel),e.Helpers.CreateDiv("stat-value",r._panel));r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.isStencilEnable?"Enabled":"Disabled"}}),r._createStatLabel("Max textures units",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().maxTexturesImageUnits.toString()}}),r._createStatLabel("Max textures size",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().maxTextureSize.toString()}}),r._createStatLabel("Max anisotropy",r._panel),l=e.Helpers.CreateDiv("stat-value",r._panel),r._updatableProperties.push({elem:l,updateFct:function(){return r._engine.getCaps().maxAnisotropy.toString()}}),a=e.Helpers.CreateDiv("stat-title2",r._panel),a.textContent="Info";var l=e.Helpers.CreateDiv("stat-infos",r._panel);return r._updatableProperties.push({elem:l,updateFct:function(){return"WebGL v"+r._engine.webGLVersion+" - "+r._glInfo.version+" - "+r._glInfo.renderer}}),r._scene.registerAfterRender(r._updateLoopHandler),r}return __extends(n,t),n.prototype._createStatLabel=function(t,n){var i=e.Helpers.CreateDiv("stat-label",n);return i.textContent=t,i},n.prototype._update=function(){for(var e=0,t=this._updatableProperties;e<t.length;e++){var n=t[e];n.elem.textContent=n.updateFct()}},n.prototype.dispose=function(){this._scene.unregisterAfterRender(this._updateLoopHandler)},n})(e.Tab);e.StatsTab=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n,i){var r=t.call(this)||this;r._tabs=[],r._invisibleTabs=[],r._visibleTabs=[],r._inspector=n,r._tabs.push(new e.SceneTab(r,r._inspector)),r._tabs.push(new e.ConsoleTab(r,r._inspector)),r._tabs.push(new e.StatsTab(r,r._inspector)),r._meshTab=new e.MeshTab(r,r._inspector),r._tabs.push(new e.TextureTab(r,r._inspector)),r._tabs.push(r._meshTab),r._tabs.push(new e.ShaderTab(r,r._inspector)),r._tabs.push(new e.LightTab(r,r._inspector)),r._tabs.push(new e.MaterialTab(r,r._inspector)),r._tabs.push(new e.CameraTab(r,r._inspector)),r._tabs.push(new e.SoundTab(r,r._inspector)),r._toolBar=new e.Toolbar(r._inspector),r._build(),(!i||i<0||i>=r._tabs.length)&&(i=0,console.warn("")),r._tabs[i].active(!0);for(var a=0,s=r._tabs;a<s.length;a++){var o=s[a];r._visibleTabs.push(o)}return r}return __extends(n,t),n.prototype.update=function(){},n.prototype._build=function(){var t=this;this._div.className="tabbar",this._div.appendChild(this._toolBar.toHtml());for(var n=0,i=this._tabs;n<i.length;n++){var r=i[n];this._div.appendChild(r.toHtml())}this._moreTabsIcon=e.Helpers.CreateElement("i","fa fa-angle-double-right more-tabs"),this._moreTabsPanel=e.Helpers.CreateDiv("more-tabs-panel"),this._moreTabsIcon.addEventListener("click",(function(){if("flex"==t._moreTabsPanel.style.display)t._moreTabsPanel.style.display="none";else{var n=t._div.parentNode;n.contains(t._moreTabsPanel)||n.appendChild(t._moreTabsPanel),e.Helpers.CleanDiv(t._moreTabsPanel);for(var i=0,r=t._invisibleTabs;i<r.length;i++){var a=r[i];t._addInvisibleTabToPanel(a)}t._moreTabsPanel.style.display="flex"}}))},n.prototype._addInvisibleTabToPanel=function(t){var n=this,i=e.Helpers.CreateDiv("invisible-tab",this._moreTabsPanel);i.textContent=t.name,i.addEventListener("click",(function(){n._moreTabsPanel.style.display="none",n.switchTab(t)}))},n.prototype.switchTab=function(e){this.getActiveTab().dispose();for(var t=0,n=this._tabs;t<n.length;t++){n[t].active(!1)}e.active(!0),this._inspector.refresh()},n.prototype.switchMeshTab=function(e){
	if(this.switchTab(this._meshTab),e){var t=this._meshTab.getItemFor(e);this._meshTab.select(t)}},n.prototype.getActiveTab=function(){for(var e=0,t=this._tabs;e<t.length;e++){var n=t[e];if(n.isActive())return n}},Object.defineProperty(n.prototype,"inspector",{get:function(){return this._inspector},enumerable:!0,configurable:!0}),n.prototype.getPixelWidth=function(){for(var e=0,t=0,n=this._visibleTabs;t<n.length;t++){e+=n[t].getPixelWidth()}return e+=this._toolBar.getPixelWidth(),this._div.contains(this._moreTabsIcon)&&(e+=30),e},n.prototype.updateWidth=function(){for(var e=this._div.parentElement.clientWidth,t=this.getPixelWidth();this._visibleTabs.length>0&&t>e;){var n=this._visibleTabs.pop();this._invisibleTabs.push(n),this._div.removeChild(n.toHtml()),t=this.getPixelWidth()+75}if(this._invisibleTabs.length>0&&t+75<e){var i=this._invisibleTabs.pop();this._div.appendChild(i.toHtml()),this._visibleTabs.push(i),this._div.contains(this._moreTabsIcon)&&this._div.removeChild(this._moreTabsIcon)}this._invisibleTabs.length>0&&!this._div.contains(this._moreTabsIcon)&&this._div.appendChild(this._moreTabsIcon)},n})(e.BasicElement);e.TabBar=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(t,n,i,r){var a=this;this._inspector=i,this._elem=e.Inspector.DOCUMENT.createElement("i"),this._elem.className="tool fa "+t,n.appendChild(this._elem),this._elem.addEventListener("click",(function(e){a.action()})),new e.Tooltip(this._elem,r)}return t.prototype.toHtml=function(){return this._elem},t.prototype.getPixelWidth=function(){var t=e.Inspector.WINDOW.getComputedStyle(this._elem),n=parseFloat(t.marginLeft.substr(0,t.marginLeft.length-2))||0,i=parseFloat(t.marginRight.substr(0,t.marginRight.length-2))||0;return(this._elem.clientWidth||0)+n+i},t.prototype._updateIcon=function(e){this._elem.className="tool fa "+e},t})();e.AbstractTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){var i=t.call(this,"fa-pause",e,n,"Pause the automatic update of properties")||this;return i._isPause=!1,i}return __extends(n,t),n.prototype.action=function(){this._isPause?(e.Scheduler.getInstance().pause=!1,this._updateIcon("fa-pause")):(e.Scheduler.getInstance().pause=!0,this._updateIcon("fa-play")),this._isPause=!this._isPause},n})(e.AbstractTool);e.PauseScheduleTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,n){var i=e.call(this,"fa-mouse-pointer",t,n,"Select a mesh in the scene")||this;return i._isActive=!1,i._pickHandler=i._pickMesh.bind(i),i}return __extends(t,e),t.prototype.action=function(){this._isActive?this._deactivate():(this.toHtml().classList.add("active"),this._inspector.scene.getEngine().getRenderingCanvas().addEventListener("click",this._pickHandler),this._isActive=!0)},t.prototype._deactivate=function(){this.toHtml().classList.remove("active"),this._inspector.scene.getEngine().getRenderingCanvas().removeEventListener("click",this._pickHandler),this._isActive=!1},t.prototype._pickMesh=function(e){var t=this._updatePointerPosition(e),n=this._inspector.scene.pick(t.x,t.y,(function(e){return!0}));n.pickedMesh&&(console.log(n.pickedMesh.name),this._inspector.displayObjectDetails(n.pickedMesh)),this._deactivate()},t.prototype._updatePointerPosition=function(e){var t=this._inspector.scene.getEngine().getRenderingCanvasClientRect();return{x:e.clientX-t.left,y:e.clientY-t.top}},t})(e.AbstractTool);e.PickTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,n){return e.call(this,"fa-external-link",t,n,"Open the inspector in a popup")||this}return __extends(t,e),t.prototype.action=function(){this._inspector.openPopup()},t})(e.AbstractTool);e.PopupTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,n){return e.call(this,"fa-refresh",t,n,"Refresh the current tab")||this}return __extends(t,e),t.prototype.action=function(){this._inspector.refresh()},t})(e.AbstractTool);e.RefreshTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){var i=t.call(this,"fa-tags",e,n,"Display mesh names on the canvas")||this;return i._isDisplayed=!1,i._canvas=null,i._labelInitialized=!1,i._scene=null,i._canvas2DLoaded=!1,i._newMeshObserver=null,i._removedMeshObserver=null,i._newLightObserver=null,i._removedLightObserver=null,i._newCameraObserver=null,i._removedCameraObserver=null,i._scene=n.scene,i}return __extends(n,t),n.prototype.dispose=function(){this._newMeshObserver&&(this._scene.onNewMeshAddedObservable.remove(this._newMeshObserver),this._scene.onMeshRemovedObservable.remove(this._removedMeshObserver),this._scene.onNewLightAddedObservable.remove(this._newLightObserver),this._scene.onLightRemovedObservable.remove(this._removedLightObserver),this._scene.onNewCameraAddedObservable.remove(this._newCameraObserver),this._scene.onCameraRemovedObservable.remove(this._removedCameraObserver),this._newMeshObserver=this._newLightObserver=this._newCameraObserver=this._removedMeshObserver=this._removedLightObserver=this._removedCameraObserver=null),this._canvas.dispose(),this._canvas=null},n.prototype._checkC2DLoaded=function(){return this._canvas2DLoaded===!0||(BABYLON.Canvas2D&&(this._canvas2DLoaded=!0),this._canvas2DLoaded)},n.prototype._initializeLabels=function(){var e=this;if(!this._labelInitialized&&this._checkC2DLoaded()){this._canvas=new BABYLON.ScreenSpaceCanvas2D(this._scene,{id:"###Label Canvas###"});for(var t=0,n=this._scene.meshes;t<n.length;t++){var i=n[t];this._createLabel(i)}for(var r=0,a=this._scene.lights;r<a.length;r++){var s=a[r];this._createLabel(s)}for(var o=0,l=this._scene.cameras;o<l.length;o++){var p=l[o];this._createLabel(p)}this._newMeshObserver=this._scene.onNewMeshAddedObservable.add((function(t,n){e._createLabel(t)})),this._removedMeshObserver=this._scene.onMeshRemovedObservable.add((function(t,n){e._removeLabel(t)})),this._newLightObserver=this._scene.onNewLightAddedObservable.add((function(t,n){e._createLabel(t)})),this._removedLightObserver=this._scene.onLightRemovedObservable.add((function(t,n){e._removeLabel(t)})),this._newCameraObserver=this._scene.onNewCameraAddedObservable.add((function(t,n){e._createLabel(t)})),this._removedCameraObserver=this._scene.onCameraRemovedObservable.add((function(t,n){e._removeLabel(t)})),this._labelInitialized=!0}},n.prototype._createLabel=function(t){var n=t.name;if(!e.Helpers.IsSystemName(n)){var i=new BABYLON.Group2D({parent:this._canvas,id:"Label of "+t.name,trackNode:t,origin:BABYLON.Vector2.Zero(),children:[new BABYLON.Rectangle2D({id:"LabelRect",x:0,y:0,width:100,height:30,origin:BABYLON.Vector2.Zero(),border:"#FFFFFFFF",fill:"#808080B0",children:[new BABYLON.Text2D(t.name,{x:10,y:4,fontName:"bold 16px Arial",fontSignedDistanceField:!0})]})]}),r=i.children[0],a=r.children[0],s=a.textSize.width;return r.width=s+20,r.height=a.textSize.height+12,i.addExternalData("owner",t),i}},n.prototype._removeLabel=function(e){for(var t=0,n=this._canvas.children;t<n.length;t++){var i=n[t];if(i.getExternalData("owner")===e){i.dispose();break}}},n.prototype.action=function(){this._checkC2DLoaded()&&(this._isDisplayed=!this._isDisplayed,this._isDisplayed?(this._initializeLabels(),this._canvas.levelVisible=!0):this._canvas.levelVisible=!1)},n})(e.AbstractTool);e.LabelTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){var n=t.call(this)||this;return n._tools=[],n._inspector=e,n._build(),n._addTools(),n}return __extends(n,t),n.prototype.update=function(){},n.prototype._build=function(){this._div.className="toolbar"},n.prototype._addTools=function(){this._tools.push(new e.RefreshTool(this._div,this._inspector)),this._tools.push(new e.LabelTool(this._div,this._inspector)),this._tools.push(new e.PickTool(this._div,this._inspector)),this._inspector.popupMode||e.Helpers.IsBrowserEdge()||this._tools.push(new e.PopupTool(this._div,this._inspector)),this._tools.push(new e.PauseScheduleTool(this._div,this._inspector)),this._tools.push(new e.DisposeTool(this._div,this._inspector))},n.prototype.getPixelWidth=function(){for(var e=0,t=0,n=this._tools;t<n.length;t++){e+=n[t].getPixelWidth()}return e},n})(e.BasicElement);e.Toolbar=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t,n){return e.call(this,"fa-times",t,n,"Close the inspector panel")||this}return __extends(t,e),t.prototype.action=function(){this._inspector.dispose()},t})(e.AbstractTool);e.DisposeTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e,n){var i=t.call(this)||this;return i.children=[],i._tab=e,i._adapter=n,i._tools=i._adapter.getTools(),i._build(),i}return __extends(n,t),Object.defineProperty(n.prototype,"id",{get:function(){return this._adapter.id()},enumerable:!0,configurable:!0}),n.prototype.add=function(e){this.children.push(e),this.update()},Object.defineProperty(n.prototype,"adapter",{get:function(){return this._adapter},enumerable:!0,configurable:!0}),n.prototype.compareTo=function(e){var t=this.id,n=e.id;return t.localeCompare(n,[],{numeric:!0})},n.prototype.correspondsTo=function(e){return this._adapter.correspondsTo(e)},n.prototype.fold=function(){if(this.children.length>0){for(var e=0,t=this.children;e<t.length;e++){t[e].toHtml().style.display="none"}this._div.classList.add("folded"),this._div.classList.remove("unfolded")}},n.prototype.unfold=function(){if(this.children.length>0){for(var e=0,t=this.children;e<t.length;e++){t[e].toHtml().style.display="block"}this._div.classList.add("unfolded"),this._div.classList.remove("folded")}},n.prototype._build=function(){this._div.className="line";for(var t=0,n=this._tools;t<n.length;t++){var i=n[t];this._div.appendChild(i.toHtml())}var r=e.Inspector.DOCUMENT.createElement("span");r.textContent=this._adapter.id(),this._div.appendChild(r);var a=e.Inspector.DOCUMENT.createElement("span");a.className="property-type","type_not_defined"!==this._adapter.type()&&(a.textContent=" - "+this._adapter.type()),this._div.appendChild(a),this._lineContent=e.Helpers.CreateDiv("line-content",this._div),this._addEvent()},n.prototype.getDetails=function(){return this._adapter.getProperties()},n.prototype.update=function(){e.Helpers.CleanDiv(this._lineContent);for(var t=0,n=this.children;t<n.length;t++){var i=n[t],r=i.toHtml();this._lineContent.appendChild(r)}this.children.length>0&&(this._div.classList.contains("folded")||this._div.classList.contains("unfolded")||this._div.classList.add("folded")),this.fold()},n.prototype._addEvent=function(){var e=this;this._div.addEventListener("click",(function(t){e._tab.select(e),e._isFolded()?e.unfold():e.fold(),t.stopPropagation()})),this._div.addEventListener("mouseover",(function(t){e._tab.highlightNode(e),t.stopPropagation()})),this._div.addEventListener("mouseout",(function(t){e._tab.highlightNode()}))},n.prototype.highlight=function(e){if(!e)for(var t=0,n=this.children;t<n.length;t++){var i=n[t];i._adapter.highlight(e)}this._adapter.highlight(e)},n.prototype._isFolded=function(){return!this._div.classList.contains("unfolded")},n.prototype.active=function(e){this._div.classList.remove("active");for(var t=0,n=this.children;t<n.length;t++){n[t].active(!1)}e&&this._div.classList.add("active")},n})(e.BasicElement);e.TreeItem=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(){function t(){this._on=!1,this._elem=e.Inspector.DOCUMENT.createElement("i"),this._elem.className="treeTool fa",this._addEvents()}return t.prototype.toHtml=function(){return this._elem},t.prototype._addEvents=function(){var e=this;this._elem.addEventListener("click",(function(t){e.action(),t.stopPropagation()}))},t.prototype.action=function(){this._on=!this._on},t})();e.AbstractTreeTool=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){var n=e.call(this)||this;return n._obj=t,n._elem.classList.add("fa-square-o"),n._on=n._obj.isBoxVisible(),n._check(),n}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._check()},t.prototype._check=function(){this._on?this._elem.classList.add("active"):this._elem.classList.remove("active"),this._obj.setBoxVisible(this._on)},t})(e.AbstractTreeTool);e.BoundingBox=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(e){var n=t.call(this)||this;return n.cameraPOV=e,n._elem.classList.add("fa-video-camera"),n}return __extends(n,t),n.prototype.action=function(){t.prototype.action.call(this),this._gotoPOV()},n.prototype._gotoPOV=function(){var t=e.Inspector.DOCUMENT.querySelectorAll(".fa-video-camera.active");console.log(t);for(var n=0;n<t.length;n++)t[n].classList.remove("active");this._elem.classList.add("active"),this.cameraPOV.setPOV()},n})(e.AbstractTreeTool);e.CameraPOV=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){var n=e.call(this)||this;return n.playSound=t,n.b=!1,n._elem.classList.add("fa-play"),n}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._playSound()},t.prototype._playSound=function(){var e=this;this._elem.classList.contains("fa-play")?(this._elem.classList.remove("fa-play"),this._elem.classList.add("fa-pause")):(this._elem.classList.remove("fa-pause"),this._elem.classList.add("fa-play")),this.playSound.setPlaying((function(){e._elem.classList.remove("fa-pause"),e._elem.classList.add("fa-play")}))},t})(e.AbstractTreeTool);e.SoundInteractions=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){var n=e.call(this)||this;return n._obj=t,n._elem.classList.add("fa-eye"),n._on=n._obj.isVisible(),n._check(!0),n}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._check()},t.prototype._check=function(e){this._on?(this._elem.classList.add("fa-eye"),this._elem.classList.add("active"),this._elem.classList.remove("fa-eye-slash")):(this._elem.classList.remove("fa-eye"),this._elem.classList.remove("active"),this._elem.classList.add("fa-eye-slash")),e||this._obj.setVisible(this._on)},t})(e.AbstractTreeTool);e.Checkbox=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(e){function t(t){var n=e.call(this)||this;return n._obj=t,n._elem.classList.add("fa-wrench"),n}return __extends(t,e),t.prototype.action=function(){e.prototype.action.call(this),this._on?this._elem.classList.add("active"):this._elem.classList.remove("active"),this._obj.debug(this._on)},t})(e.AbstractTreeTool);e.DebugArea=t})(INSPECTOR||(INSPECTOR={}));var INSPECTOR;!(function(e){var t=(function(t){function n(n){var i=t.call(this)||this;return i._obj=n,i._elem.classList.add("fa-info-circle"),i._tooltip=new e.Tooltip(i._elem,i._obj.getInfo(),i._elem),i}return __extends(n,t),n.prototype.action=function(){t.prototype.action.call(this)},n})(e.AbstractTreeTool);e.Info=t})(INSPECTOR||(INSPECTOR={}));

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
	    if (options.blockDrag) gutterClass += ' blocked'

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
	            if (!options.blockDrag) {
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
	        }

	      // stopDragging is very similar to startDragging in reverse.
	      , stopDragging = function () {          
	            if (!options.blockDrag) {
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
	            for (i = pairs.length - 1; i >= 0; i--) {
	                adjust.call(pairs[i],pairs[i].a[getBoundingClientRect]()[dimension])
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