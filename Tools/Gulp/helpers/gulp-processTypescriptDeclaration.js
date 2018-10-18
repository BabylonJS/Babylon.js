// Gulp Tools
var fs = require("fs");

var processData = function(data, options) {
    var str = "" + data;

    // Start process by extracting all lines.
    let lines = str.split('\n');
    var firstIndex = lines.findIndex((line => { return line.indexOf(`'${options.packageName}/'`) !== -1 }));
    var lastIndex = lines.findIndex(((line, idx) => { return line.trim() === '}' && idx > firstIndex }));
    lines.splice(firstIndex, lastIndex - firstIndex + 1);

    // Let's go line by line and check if we have special folder replacements
    // Replaces declare module 'babylonjs'; by declare module BABYLON for instance
    for (var index = 0; index < lines.length; index++) {
        var namespace = options.moduleName;
        var regex = /declare module '(.*)' {/g;

        if (options.moduleSpecifics) {
            var match = regex.exec(lines[index]);

            if (!match) {
                continue;
            }

            var module = match[1];

            options.moduleSpecifics.forEach(function(specific) {
                if (module.indexOf(specific.path) > -1) {
                    namespace = specific.namespace;
                }
            });
        }

        lines[index] = lines[index].replace(regex, `declare module ${namespace} {`);
    }

    // Recreate the file.
    str = lines.join('\n');

    // Let s clean up all the import * from BABYLON or the package itself as we know it is part of
    // the same namespace... Should be
    str = str.replace("import * as BABYLON from 'babylonjs';", "");
    let regexp = new RegExp(`import {(.*)} from ['"]${options.packageName}(.*)['"];`, 'g');
    str = str.replace(regexp, '');

    // Let s clean other chosen imports from the mix.
    if (options.importsToRemove) {
        while (options.importsToRemove.length) {
            let remove = options.importsToRemove.pop();
            str = str.replace(new RegExp(`import '${remove}';`), '');
        }
    }

    // Find all other imported classes (Part of BABYLON or Loaders for instance)
    // and suffix them by the namespace.
    if ((options.classMap)) {
        // Replace import { foo, bar } from ...
        Object.keys(options.classMap).forEach(package => {
            var babylonRegex = new RegExp(`import {(.*)} from ['"](${package})['"];`, "g");

            var match = babylonRegex.exec(str);
            let classes = new Set();
            while (match != null) {
                if (match[1]) {
                    match[1].split(",").forEach(element => {
                        classes.add(element.trim());
                    });
                }
                match = babylonRegex.exec(str);
            }
            str = str.replace(babylonRegex, '');
            classes.forEach(cls => {
                let rg = new RegExp(`([ <])(${cls})([^\\w])`, "g")
                str = str.replace(rg, `$1${options.classMap[package]}.$2$3`);
            });
        });

        // Replace import { foo as A, bar as B } from ...
        // Object.keys(options.classMap).forEach(package => {
        //     var babylonRegex = new RegExp(`import {(.*)} from ['"](${package})['"];`, "g");

        //     var match = babylonRegex.exec(str);
        //     let classes = new Set();
        //     while (match != null) {
        //         if (match[1]) {
        //             match[1].split(",").forEach(element => {
        //                 classes.add(element.trim());
        //             });
        //         }
        //         match = babylonRegex.exec(str);
        //     }
        //     str = str.replace(babylonRegex, '');
        //     classes.forEach(cls => {
        //         let rg = new RegExp(`([ <])(${cls})([^\\w])`, "g")
        //         str = str.replace(rg, `$1${options.classMap[package]}.$2$3`);
        //     });
        // });

        // Replace import * as ...
        Object.keys(options.classMap).forEach(package => {
            var babylonRegex = new RegExp(`import \\* as (.*) from ['"](${package})['"];`, "g");

            var match = babylonRegex.exec(str);
            let localNamespace = "";
            if (match && match[1]) {
                localNamespace = match[1].trim();
            }
            else {
                return;
            }
            str = str.replace(babylonRegex, '');

            let rg = new RegExp(`([ <])(${localNamespace}.)([A-Za-z])`, "g")
            str = str.replace(rg, `$1${options.classMap[package]}.$3`);
        });
    }

    // Clean up export.
    str = str.replace(/export {(.*)};/g, '');
    // Clean up left import.
    str = str.replace(/import (.*);/g, "");

    // Rearrange the d.ts.
    str = str.split("\n").filter(line => line.trim()).filter(line => line.indexOf("export * from") === -1).join("\n");

    // Remove empty module declaration
    var cleanEmptyNamespace = function(str, moduleName) {
        let emptyDeclareRegexp = new RegExp("declare module " + moduleName + " {\n}\n", "g");
        str = str.replace(emptyDeclareRegexp, "");
        emptyDeclareRegexp = new RegExp("declare module " + moduleName + " {\r\n}\r\n", "g");
        str = str.replace(emptyDeclareRegexp, "");

        return str;
    }
    str = cleanEmptyNamespace(str, options.moduleName);

    // Remove empty module declaration of specific modules
    if (options.moduleSpecifics) {
        options.moduleSpecifics.forEach(function(specific) {
            str = cleanEmptyNamespace(str, specific.namespace);
        });
    }

    return str;
}

module.exports = function(fileLocation, options, cb) {
    options = options || { };

    fs.readFile(fileLocation, function(err, data) {
        if (err) throw err;

        data += "";
        // For Raanan, litteral import hack TO BETTER INTEGRATE
        data = data.replace('import "../sass/main.scss";', "");

        if (options.prependText) {
            data = options.prependText + '\n' + data.toString();
        }
        
        var newData = "";
        if (options) {
            newData = processData(data, options);
            fs.writeFileSync(fileLocation.replace('.module', ''), newData);
        }

        if (options.doNotAppendNamespace) {
            fs.writeFileSync(fileLocation, data);
        }
        else {
            fs.writeFileSync(fileLocation, data + "\n" + newData);
        }

        cb && cb();
    });
}