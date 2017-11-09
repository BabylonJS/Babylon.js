var gutil = require('gulp-util');
var through = require('through2');

/**
 * The parameters for this function has grown during development.
 * Eventually, this function will need to be reorganized. 
 */
module.exports = function (varName, subModule, extendsRoot, externalUsingBabylon) {
    return through.obj(function (file, enc, cb) {

        var optionalRequire = `var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
var babylonDependency = (globalObject && globalObject.BABYLON) || BABYLON || (typeof require !== 'undefined' && require("babylonjs"));
var BABYLON = babylonDependency;
`;
        function moduleExportAddition(varName) {

            let base = subModule ? 'BABYLON' : varName;

            let basicInit = `root["${base}"]${(subModule && !extendsRoot) ? '["' + varName + '"]' : ''} = f;`;
            let sadGlobalPolution = (!subModule) ? `var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
globalObject["${base}"] = f;` : '';
            /*if (extendsRoot) {
                basicInit = `__extends(root["BABYLON"], factory()); `
            }*/

            return `\n\n(function universalModuleDefinition(root, factory) {
                var f = factory();
                if (root && root["${base}"]) {
                    return;
                }
                ${sadGlobalPolution}
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = f;
    else if(typeof define === 'function' && define.amd)
        define(["${varName}"], factory);
    else if(typeof exports === 'object')
        exports["${varName}"] = f;
    else {
        ${basicInit}
    }
})(this, function() {
    return ${base}${(subModule && !extendsRoot) ? '.' + varName : ''};
});
`;
        }

        var extendsAddition =
            `var __extends = (this && this.__extends) || (function () {
            var extendStatics = Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
                function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
            return function (d, b) {
                extendStatics(d, b);
                function __() { this.constructor = d; }
                d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
            };
        })();
        `;

        var decorateAddition =
            'var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {\n' +
            'var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;\n' +
            'if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);\n' +
            'else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;\n' +
            'return c > 3 && r && Object.defineProperty(target, key, r), r;\n' +
            '};\n';

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            //streams not supported, no need for now.
            return;
        }

        try {
            if (externalUsingBabylon) {
                //file.contents = new Buffer(optionalRequire.concat(String(file.contents)));
                file.contents = new Buffer(optionalRequire.concat(new Buffer(String(file.contents).concat(moduleExportAddition(varName)))));
            } else {
                let pretext = subModule ? optionalRequire : '';
                file.contents = new Buffer(pretext.concat(decorateAddition).concat(new Buffer(extendsAddition.concat(String(file.contents)).concat(moduleExportAddition(varName)))));
            }
            this.push(file);
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};
