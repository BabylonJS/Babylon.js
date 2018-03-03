var gutil = require('gulp-util');
var through = require('through2');

/**
 * The parameters for this function has grown during development.
 * Eventually, this function will need to be reorganized. 
 */
module.exports = function (varName, subModule, extendsRoot, externalUsingBabylon, noBabylonInit) {
    return through.obj(function (file, enc, cb) {
        if (typeof varName === 'string') {
            varName = {
                name: varName,
                module: varName
            }
            if (varName.name === 'BABYLON') {
                varName.module = 'babylonjs';
            }
        }

        function moduleExportAddition(varName) {

            let base = subModule ? 'BABYLON' : varName.name;

            return `\n\n(function universalModuleDefinition(root, factory) {
    if(typeof exports === 'object' && typeof module === 'object')
        module.exports = factory(${subModule || extendsRoot ? 'require("babylonjs")' : ''});
    else if(typeof define === 'function' && define.amd)
        define("${varName.module}", ${subModule || extendsRoot ? '["babylonjs"],' : '[],'} factory);
    else if(typeof exports === 'object')
        exports["${varName.module}"] = factory(${subModule || extendsRoot ? 'require("babylonjs")' : ''});
    else {
        root["${base}"]${(subModule && !extendsRoot) ? '["' + varName.name + '"]' : ''} = factory(root["BABYLON"]);
    }
})(this, function(${varName.name === 'BABYLON' || noBabylonInit ? '' : 'BABYLON'}) {
    ${String(file.contents)}
    ${varName.name === 'BABYLON' || varName.name === 'INSPECTOR' ? `
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
globalObject["${varName.name}"] = ${varName.name}` : ''}
    return ${base}${(subModule && !extendsRoot) ? '.' + varName.name : ''};
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

        var optionalRequire = '';

        try {
            if (externalUsingBabylon) {
                file.contents = new Buffer(optionalRequire.concat(new Buffer(String('').concat(moduleExportAddition(varName)))));
            } else {
                let pretext = subModule ? optionalRequire : '';
                file.contents = new Buffer(pretext.concat(decorateAddition).concat(new Buffer(extendsAddition.concat(String('')).concat(moduleExportAddition(varName)))));
            }
            this.push(file);
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};
