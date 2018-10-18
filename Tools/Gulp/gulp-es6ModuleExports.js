var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

module.exports = function (moduleName, dependencyTree, generateIndex, perFile, shaders, shaderIncludes) {
    return through.obj(function (file, enc, cb) {

        let basename = (path.basename(file.path, ".js"));

        //console.log("Compiling es6 module: " + moduleName + "/" + basename.replace("babylon.", ""));

        var extendsAddition =
            `var __extends=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var n in o)o.hasOwnProperty(n)&&(t[n]=o[n])};return function(o,n){function r(){this.constructor=o}t(o,n),o.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();
`;

        var decorateAddition =
            'var __decorate=this&&this.__decorate||function(e,t,r,c){var o,f=arguments.length,n=f<3?t:null===c?c=Object.getOwnPropertyDescriptor(t,r):c;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,c);else for(var l=e.length-1;l>=0;l--)(o=e[l])&&(n=(f<3?o(n):f>3?o(t,r,n):o(t,r))||n);return f>3&&n&&Object.defineProperty(t,r,n),n};\n';

        let content = file.contents.toString();
        if (content.indexOf('__extends') === -1 && !dependencyTree.length) {
            extendsAddition = '';
        }

        if (content.indexOf('__decorate') === -1) {
            decorateAddition = '';
        }

        let dependenciesText = `${extendsAddition}
${decorateAddition}
`;
        //if (moduleName !== 'core') {
        dependenciesText += `var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
            var BABYLON = globalObject["BABYLON"] || {};
`;
        /*} else {
            dependenciesText += `var BABYLON;
`;
        }*/

        let exportsText = '';
        if (!generateIndex) {

            // process parenting!
            let parentRegex = /__extends\(([A-Z]\w*), _super\)/g;
            var match = parentRegex.exec(content);
            while (match != null) {
                let extendingClass = match[1];
                // find the first row
                let extendedMatcher = new RegExp("}\\([BABYLON\\.]*([A-Z]\\w*)\\)\\);\\n\\s*BABYLON." + extendingClass + " = " + extendingClass + ";");

                let extendedArray = extendedMatcher.exec(content);
                if (extendedArray) {
                    let firstRowReg = new RegExp("var " + extendingClass + " = .* \\(function");
                    content = content.replace(firstRowReg, "var " + extendingClass + " = function");

                    extended = extendedArray[1];
                    content = content.replace(extendedMatcher, `};
    var CLS${extendingClass};
    BABYLON.__${extendingClass} = function() {
        CLS${extendingClass} = CLS${extendingClass} || ${extendingClass}.call(null, BABYLON.__${extended} && BABYLON.__${extended}() || BABYLON.${extended});
    }
    Object.defineProperty(BABYLON, "${extendingClass}", {
        get: function () {
            BABYLON.__${extendingClass}();
            return CLS${extendingClass};
        },
        enumerable: true,
        configurable: true
    });`);
                    console.log(extendingClass, extended);
                } else {
                    console.log(extendingClass + " is not exported");
                }

                match = parentRegex.exec(content);
            }

            let loadedFiles = [];
            dependencyTree[basename].forEach(function (d, idx) {
                //if (d.module.indexOf("core") !== -1) return;
                let name = d.file.split(".").pop();

                if (loadedFiles.indexOf(name) === -1/* && !d.newDec*/) {
                    let regexp = new RegExp("BABYLON." + d.name);
                    let match = regexp.exec(content);
                    if (!match) return;
                    if (d.main)
                        dependenciesText += `import {${d.name}} from 'babylonjs/${d.module[0]}/es6/${name}';
`;
                    else
                        exportsText += `import {${d.name}} from 'babylonjs/${d.module[0]}/es6/${name}';
`;
                    loadedFiles.push(name);
                }
                //dependenciesText += `if(BABYLON !== BABYLON${idx}) __extends(BABYLON, BABYLON${idx});
            });
            let exported = [];
            perFile[basename].declarations.forEach(dec => {
                if (exported.indexOf(dec) !== -1) return;
                exported.push(dec);
                exportsText += `var ${dec} = BABYLON.${dec}; export {${dec}};
`;
            });
            if (shaders) {
                dependenciesText += `import * as Shaders from "babylonjs/${moduleName}/es6/shaders";
if(BABYLON.Effect) Object.keys(Shaders).forEach(function(shaderName) {BABYLON.Effect.ShadersStore[shaderName] = Shaders[shaderName]})
`;
            }
            if (shaderIncludes) {
                dependenciesText += `import * as ShaderIncludes from "babylonjs/${moduleName}/es6/shaderIncludes";
if(BABYLON.Effect) Object.keys(ShaderIncludes).forEach(function(shaderName) {BABYLON.Effect.IncludesShadersStore[shaderName] = ShaderIncludes[shaderName]})
`;
            }

            //if (moduleName === "core") {
            exportsText += `(function() {
    //var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
})();
`;
            //}
        } else {
            content = '';
            let basenames = Object.keys(perFile).filter(basefilename => {
                return perFile[basefilename].module.indexOf(moduleName) !== -1;
            });

            basenames.forEach(bname => {
                let name = bname.split(".").pop();
                dependenciesText += `export * from "babylonjs/${moduleName}/es6/${name}";
`;
            })
        }



        /*exportsText += `(function() {
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    })();
`;*/

        /*if (dependencies) {
            dependencies.forEach(function (d, idx) {
                if (d === 'core') return;
                dependenciesText += `import * as ${d} from 'babylonjs/${d}/es6';
`;
                //if (idx > 0) {
                dependenciesText += `__extends(BABYLON, ${d});
`;
                //}
            });
        }
 
 
 
        let exportRegex = /BABYLON.([0-9A-Za-z-_]*) = .*;\n/g
 
        var match = exportRegex.exec(content);
 
        let exportsArray = [];
        while (match != null) {
            if (match[1]) {
                exportsArray.push(match[1])
            }
            match = exportRegex.exec(content);
        }
 
        let exportsText = '';
        if (moduleName === "core") {
            exportsText = `(function() {
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    globalObject["BABYLON"] = BABYLON;
})();
`
        }
 
        let exportedItems = '';
        exportsArray.forEach((e, idx) => {
            if (e.indexOf('.') === -1) {
                exportedItems += `${idx ? ',' : ''}${e}`
                exportsText += `var ${e} = BABYLON.${e};
`
            }
        });
 
        exportsText += `
export { ${exportedItems} };`*/

        /*if (moduleName === "core") {
            exportsText = `(function() {
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
globalObject["BABYLON"] = BABYLON;
})();
`*/

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            //streams not supported, no need for now.
            return;
        }

        try {
            file.contents = Buffer.from(dependenciesText.concat(Buffer.from(String(content).concat(exportsText))));
            this.push(file);
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-es6-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
}