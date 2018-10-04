module.exports = function(data, options) {
    var str = "" + data;

    // Start process
    let lines = str.split('\n');
    var firstIndex = lines.findIndex((line => { return line.indexOf(`'${options.packageName}/'`) !== -1 }));
    var lastIndex = lines.findIndex(((line, idx) => { return line.trim() === '}' && idx > firstIndex }));
    lines.splice(firstIndex, lastIndex - firstIndex + 1);

    // Let's go line by line and check if we have special folder replacements
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

    str = lines.join('\n');

    str = str.replace("import * as BABYLON from 'babylonjs';", "");
    let regexp = new RegExp(`import {(.*)} from ['"]${options.packageName}(.*)['"];`, 'g');
    str = str.replace(regexp, '');

    if (options.importsToRemove) {
        while (options.importsToRemove.length) {
            let remove = options.importsToRemove.pop();
            str = str.replace(new RegExp(`import '${remove}';`), '');
        }
    }

    // Find all used BABYLON and BABYLON-Loaders classes:
    if ((options.classMap)) {
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
        })
    }

    str = str.replace(/export {(.*)};/g, '');

    str = str.replace(/import (.*);/g, "");

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

    if (options.moduleSpecifics) {
        options.moduleSpecifics.forEach(function(specific) {
            str = cleanEmptyNamespace(str, specific.namespace);
        });
    }

    return str;
}