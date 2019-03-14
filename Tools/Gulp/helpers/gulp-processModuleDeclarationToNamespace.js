// Gulp Tools
var fs = require("fs");

var processData = function(data, packageName, options) {
    var str = "" + data;

    // Start process by extracting all lines.
    let lines = str.split('\n');

    // Let's go line by line and check if we have special folder replacements
    // Replaces declare module 'babylonjs'; by declare module BABYLON for instance
    for (var index = 0; index < lines.length; index++) {
        var namespace = options.moduleName;
        var regex = /declare module ["'](.*)["'] {/g;

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

    // Replace module augmentation blocks
    for (var index = 0; index < lines.length; index++) {
        var namespace = options.moduleName;
        var regex = /\smodule ["'](.*)["'] {/g;
        var match = regex.exec(lines[index]);
        if (!match) {
            continue;
        }
        lines[index] = "";

        // Find matching closing curly }
        var opened = 0;
        for (let endIndex = index; endIndex < lines.length; endIndex++) {
            let scanLine = lines[endIndex].trim();
            if (scanLine.length === 0) {
                continue;
            }
            // Skip comments
            if (scanLine[0] === "*" || scanLine[0] === "/") {
                continue;
            }

            // Count open curly
            if (scanLine.indexOf("{") != -1) {
                opened++;
            }
            // And closing ones
            if (scanLine.indexOf("}") != -1) {
                opened--;

                // until the closing module
                if (opened < 0) {
                    lines[endIndex] = "";
                    index = endIndex;
                    break;
                }
            }
        }
    }

    // Recreate the file.
    str = lines.join('\n');

    // First let s deal with internal aliased imports.
    if (options.moduleSpecifics) {
        // Find all imported classes and aliased classes.
        var babylonRegex = new RegExp(`import {(.*)} from ['"](.*)['"];`, "g");
        var match = babylonRegex.exec(str);
        let aliasedClasses = new Set();
        while (match != null) {
            if (match[1]) {
                match[1].split(",").forEach(element => {
                    // Filter only aliased classes
                    if (element.indexOf(" as ") > -1) {
                        aliasedClasses.add(element.trim() + " as " + match[2]);
                    }
                });
            }
            match = babylonRegex.exec(str);
        }
        str = str.replace(babylonRegex, '');

        // For every aliased.
        aliasedClasses.forEach(cls => {
            const tokens = cls.split(" as ");
            const className = tokens[0];
            const alias = tokens[1];
            const package = tokens[2];

            // Use the default module name.
            let namespace = options.moduleName;
            // If they are part of a specific module.
            options.moduleSpecifics.forEach(function(specific) {
                if (package.indexOf(specific.path) > -1) {
                    namespace = specific.namespace;
                }
            });

            // Replace
            const rg = new RegExp(`([ <])(${alias})([^\\w])`, "g")
            str = str.replace(rg, `$1${namespace}.${className}$3`);
        });
    }

    // Let s clean up all the import * from BABYLON or the package itself as we know it is part of
    // the same namespace... Should be
    str = str.replace("import * as BABYLON from 'babylonjs';", "");
    let regexp = new RegExp(`import {(.*)} from ['"]${packageName}(.*)['"];`, 'g');
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
            var babylonRegex = new RegExp(`import {(.*)} from ['"](${package})[\/'"](.*);`, "g");

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
                let className = cls;
                let alias = cls;

                // Deal with import { foo as A, bar as B } from ...
                if (cls.indexOf(" as ") > -1) {
                    const tokens = cls.split(" as ");
                    className = tokens[0];
                    alias = tokens[1];
                }

                // !!! Be carefull
                // Could cause issues if this appears in several import scope
                // with different aliases.
                // !!! Be carefull multiline not managed.
                // False is a special case to remove all the lines.
                if (options.classMap[package] === false) {
                    const rg = new RegExp(`.*[ <]${alias}[^\\w].*`, "g")
                    str = str.replace(rg, "");
                }
                // Else replace with the namespace prefix.
                else {
                    const rg = new RegExp(`([ <])(${alias})([^\\w])`, "g")
                    str = str.replace(rg, `$1${options.classMap[package]}.${className}$3`);
                }
            });
        });

        // Replace import * as ...
        Object.keys(options.classMap).forEach(package => {
            var babylonRegex = new RegExp(`import \\* as (.*) from ['"](${package})['"];`, "g");

            var match = babylonRegex.exec(str);
            let localNamespace = "";
            if (match && match[1]) {
                localNamespace = match[1].trim();
                str = str.replace(babylonRegex, '');

                let rg = new RegExp(`([ <])(${localNamespace}.)([A-Za-z])`, "g")
                str = str.replace(rg, `$1${options.classMap[package]}.$3`);
            }
        });
    }

    // Clean up named export.
    str = str.replace(/export {(.*)};/g, '');
    // Clean up left import.
    str = str.replace(/import (.*);/g, "");
    // Clean up export * from.
    str = str.split("\n").filter(line => line.trim()).filter(line => line.indexOf("export * from") === -1).join("\n");

    // Remove empty module declaration
    var cleanEmptyNamespace = function(str, moduleName) {
        let emptyDeclareRegexp = new RegExp("declare module " + moduleName + " {\\s*}\\s*", "gm");
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

    // Remove Empty Lines
    str = str.replace(/^\s*$/gm, "");

    // Remove Inlined Import
    str = str.replace(/import\("[A-Za-z0-9\/]*"\)\./g, "");

    return str;
}

module.exports = function(fileLocation, packageName, options, cb) {
    options = options || { };

    fs.readFile(fileLocation, function(err, data) {
        if (err) throw err;

        data += "";
        if (options.replacements) {
            for (let replacement of options.replacements) {
                data = data.replace(replacement.from, replacement.to);
            }
        }

        if (options.prependText) {
            data = options.prependText + '\n' + data.toString();
        }

        var newData = "";
        if (options) {
            newData = processData(data, packageName, options);

            var namespaceData = newData;
            fs.writeFileSync(fileLocation.replace('.module', ''), namespaceData);
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