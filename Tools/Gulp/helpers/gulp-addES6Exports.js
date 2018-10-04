var gutil = require('gulp-util');
var through = require('through2');

/**
 * The parameters for this function has grown during development.
 * Eventually, this function will need to be reorganized. 
 */
module.exports = function (baseModule, subModule, extendsRoot, externalUsingBabylon) {
    return through.obj(function (file, enc, cb) {

        var optionalRequire = `var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
var babylonDependency = (globalObject && globalObject.BABYLON) || BABYLON || (typeof require !== 'undefined' && require("babylonjs"));
var BABYLON = babylonDependency;
`;
        let fileContent = file.contents.toString();
        function moduleExportAddition(varName) {

            let base = subModule ? 'BABYLON' : baseModule;

            let sadGlobalPolution = (!subModule) ? `var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
globalObject["${base}"] = ${base}${(subModule && !extendsRoot) ? '.' + varName : ''};` : '';
            /*if (extendsRoot) {
                basicInit = `__extends(root["BABYLON"], factory()); `
            }*/

            let listOfExports = [];
            // find the exported members. es6 exports can NOT be generated dynamically.
            let matcher = new RegExp(base + "\\.(\\w*) = (\\w*);", "g");
            let match = matcher.exec(fileContent);
            while (match != null) {
                if (match[1] && match[2] && match[1] === match[2]) {
                    listOfExports.push(match[1]);
                }
                match = matcher.exec(fileContent);
            }

            let enumMatcher = new RegExp(`\\(${base}\\.([A-Za-z0-9].*)= {}\\)`, "g");
            let enumMatch = enumMatcher.exec(fileContent);
            while (enumMatch != null) {
                if (enumMatch[1] && listOfExports.indexOf(enumMatch[1]) === -1) {
                    listOfExports.push(enumMatch[1]);
                }
                enumMatch = enumMatcher.exec(fileContent);
            }


            let exportsText = '';
            listOfExports.forEach(cls => {
                exportsText += `var ${cls} = ${base}.${cls};`;
            });
            exportsText += `
export { ${listOfExports.join(",")} };`

            return `${sadGlobalPolution}
${exportsText}
`;
        }

        var extendsAddition = `var __extends=this&&this.__extends||function(){var t=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,o){t.__proto__=o}||function(t,o){for(var n in o)o.hasOwnProperty(n)&&(t[n]=o[n])};return function(o,n){function r(){this.constructor=o}t(o,n),o.prototype=null===n?Object.create(n):(r.prototype=n.prototype,new r)}}();
`;

        var decorateAddition = 'var __decorate=this&&this.__decorate||function(e,t,r,c){var o,f=arguments.length,n=f<3?t:null===c?c=Object.getOwnPropertyDescriptor(t,r):c;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(e,t,r,c);else for(var l=e.length-1;l>=0;l--)(o=e[l])&&(n=(f<3?o(n):f>3?o(t,r,n):o(t,r))||n);return f>3&&n&&Object.defineProperty(t,r,n),n};\n';


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
                file.contents = Buffer.from(optionalRequire.concat(Buffer.from(String(file.contents).concat(moduleExportAddition(baseModule)))));
            } else {
                let pretext = subModule ? optionalRequire : '';
                file.contents = Buffer.from(pretext.concat(decorateAddition).concat(Buffer.from(extendsAddition.concat(String(file.contents)).concat(moduleExportAddition(baseModule)))));
            }
            this.push(file);
        } catch (err) {
            this.emit('error', new gutil.PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};
