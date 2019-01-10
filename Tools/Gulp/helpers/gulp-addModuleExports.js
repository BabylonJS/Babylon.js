var through = require('through2');
var PluginError = require('plugin-error');

/**
 * The parameters for this function has grown during development.
 * Eventually, this function will need to be reorganized. 
 */
//  subModule, extendsRoot, externalUsingBabylon, noBabylonInit
module.exports = function (varName, config) {
    return through.obj(function (file, enc, cb) {
        config = config || {};
        if (typeof varName === 'string') {
            varName = {
                name: varName,
                module: varName
            }
            if (varName.name === 'BABYLON') {
                varName.module = 'babylonjs';
            }
        }
        if (!config.dependencies) {
            if (config.subModule || config.extendsRoot) {
                config.dependencies = [
                    {
                        name: "BABYLON",
                        module: "babylonjs",
                        optional: false
                    }
                ]
            }
        }

        function moduleExportAddition(varName) {

            let dependenciesDefinition = `var amdDependencies = [];`;
            let functionVariables = '';
            let requireText = '';
            let amdText = '';
            let afterInitText = '';
            if (config.dependencies) {
                config.dependencies.forEach(dep => {
                    if (functionVariables) functionVariables += ',';
                    functionVariables += dep.name;
                    requireText += `        ${dep.optional ? ' try { ' : ''} ${dep.name} = ${dep.name} || require("${dep.module}"); ${dep.optional ? ' } catch(e) {} ' : ''}
`;
                    amdText += `        ${dep.optional ? ' if(require.specified && require.specified("' + dep.module + '"))' : ''} amdDependencies.push("${dep.module}");
`;
                    dependenciesDefinition += `
    var ${dep.name} = root.${dep.name} || this.${dep.name};`;
                    afterInitText += `  ${dep.name} = ${dep.name} || this.${dep.name};
`
                });

            }

            let base = config.subModule ? 'BABYLON' : varName.name;

            return `\n\n(function universalModuleDefinition(root, factory) {
    ${dependenciesDefinition}
    if(typeof exports === 'object' && typeof module === 'object') {
${requireText}
        module.exports = factory(${functionVariables});
    } else if(typeof define === 'function' && define.amd) {
${amdText}
        define("${varName.module}", amdDependencies, factory);
    } else if(typeof exports === 'object') {
${requireText}
        exports["${varName.module}"] = factory(${functionVariables});
    } else {
        root["${base}"]${(config.subModule && !config.extendsRoot) ? '["' + varName.name + '"]' : ''} = factory(${functionVariables});
    }
})(this, function(${functionVariables}) {
${afterInitText}
${String(file.contents)}
    ${varName.name === 'BABYLON' || varName.name === 'INSPECTOR' ? `
var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
globalObject["${varName.name}"] = ${varName.name};
//backwards compatibility
if(typeof earcut !== 'undefined') {
    globalObject["Earcut"] = {
        earcut: earcut
    };
}` : ''}

    return ${base}${(config.subModule && !config.extendsRoot) ? '.' + varName.name : ''};
});
`;
        }

        if (file.isNull()) {
            cb(null, file);
            return;
        }

        if (file.isStream()) {
            //streams not supported, no need for now.
            return;
        }

        try {
            //if (config.externalUsingBabylon) {
            file.contents = Buffer.from(String('').concat(moduleExportAddition(varName)));
            /*} else {
                let pretext = '';
                file.contents = new Buffer(decorateAddition.concat(new Buffer(extendsAddition.concat(String('')).concat(moduleExportAddition(varName)))));
            }*/
            this.push(file);
        } catch (err) {
            this.emit('error', new PluginError('gulp-add-module-exports', err, { fileName: file.path }));
        }
        cb();
    });
};
