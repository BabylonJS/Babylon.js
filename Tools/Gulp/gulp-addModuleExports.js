var gutil = require('gulp-util');
var through = require('through2');

module.exports = function (varName, subModule, extendsRoot) {
    return through.obj(function (file, enc, cb) {

        var optionalRequire = `var babylonDependency; try { babylonDependency = BABYLON || (typeof require !== 'undefined' && require("../babylon.max")); } catch (e) { babylonDependency = BABYLON || (typeof require !== 'undefined' && require("babylonjs")); } 
var BABYLON = babylonDependency;
`;
        function moduleExportAddition(varName) {

            let basicInit = `root["BABYLON"]${(subModule && !extendsRoot) ? '["' + varName + '"]' : ''} = factory();`;
            /*if (extendsRoot) {
                basicInit = `__extends(root["BABYLON"], factory()); `
            }*/

            return `\n\n(function universalModuleDefinition(root, factory) {
                if (root && root["BABYLON"]) {
                    return;
                }
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory();
    else if(typeof define === 'function' && define.amd)
        define([], factory);
    else if(typeof exports === 'object')
        exports["${varName}"] = factory();
    else {
        ${basicInit}
    }
})(this, function() {
    return BABYLON${(subModule && !extendsRoot) ? '.' + varName : ''};
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
            let pretext = subModule ? optionalRequire : '';
            file.contents = new Buffer(pretext.concat(decorateAddition).concat(new Buffer(extendsAddition.concat(String(file.contents)).concat(moduleExportAddition(varName)))));
            this.push(file);

        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};
