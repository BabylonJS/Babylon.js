var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');

module.exports = function (moduleName, dependencyTree, generateIndex, perFile, shaders, shaderIncludes) {
    return through.obj(function (file, enc, cb) {

        let basename = (path.basename(file.path, ".js"));

        //console.log("Compiling module: " + moduleName + "/" + basename.replace("babylon.", ""));

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
if(typeof require !== 'undefined'){
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    var BABYLON = globalObject["BABYLON"] || {}; 
    var EXPORTS = {};
`;
        let exportsText = '';
        if (!generateIndex) {
            let loadedFiles = [];
            dependencyTree[basename].forEach(function (d, idx) {
                if (d.module.indexOf("core") !== -1) return;
                let name = d.file.split(".").pop();

                if (loadedFiles.indexOf(name) === -1) {
                    if (d.main)
                        dependenciesText += `var ${name}Module = require('babylonjs/${d.module[0]}/${name}');
`;
                    else
                        exportsText += `var ${name}Module = require('babylonjs/${d.module[0]}/${name}');
`;
                    loadedFiles.push(name);
                }

                dependenciesText += `BABYLON["${d.name}"] = ${name}Module["${d.name}"];
`;
                //dependenciesText += `if(BABYLON !== BABYLON${idx}) __extends(BABYLON, BABYLON${idx});
            });
            perFile[basename].declarations.forEach(dec => {
                exportsText += `EXPORTS['${dec}'] = BABYLON["${dec}"];
`;
            });
            if (shaders) {
                dependenciesText += `require("babylonjs/${moduleName}/shaders");
`;
            }
            if (shaderIncludes) {
                dependenciesText += `require("babylonjs/${moduleName}/shaderIncludes");
`;
            }
        } else {
            content = '';
            let basenames = Object.keys(perFile).filter(basefilename => {
                return perFile[basefilename].module.indexOf(moduleName) !== -1;
            });

            basenames.forEach(bname => {
                let name = bname.split(".").pop();
                dependenciesText += `var ${name} = require("babylonjs/${moduleName}/${name}");
`;
                // now add the internal dependencies to EXPORTS
                perFile[bname].declarations.forEach(dec => {
                    dependenciesText += `EXPORTS['${dec}'] = BABYLON["${dec}"] = ${name}["${dec}"];
`;
                });
            })
        }

        exportsText += `(function() {
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = EXPORTS;
    })();
}`;



        /*let exportRegex = /BABYLON.([0-9A-Za-z-_]*) = .*;\n/g

        var match = exportRegex.exec(content);

        let exportsArray = [];
        while (match != null) {
            if (match[1]) {
                exportsArray.push(match[1])
            }
            match = exportRegex.exec(content);
        }*/


        /*if (moduleName === "core") {
            exportsText = `(function() {
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = BABYLON; 
})();
}`
        }*/

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
            this.emit('error', new gutil.PluginError('gulp-add-babylon-module', err, { fileName: file.path }));
        }
        cb();
    });
}