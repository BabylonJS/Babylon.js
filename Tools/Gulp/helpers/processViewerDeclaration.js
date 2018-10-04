module.exports = function (data, options) {

    /*
    {
        packageName: string,
        moduleName: string,
        importsToRemove: Array<string>,
        classMap
    }
    */

    var str = "" + data;

    // this regex is not working on node 6 for some reason:
    // str = str.replace(/declare module 'babylonjs-viewer\/' {((?!(declare))(.|\n))*\n}/g, '');

    let lines = str.split('\n');
    var firstIndex = lines.findIndex((line => { return line.indexOf(`'${options.packageName}/'`) !== -1 }));
    var lastIndex = lines.findIndex(((line, idx) => { return line.trim() === '}' && idx > firstIndex }));
    lines.splice(firstIndex, lastIndex - firstIndex + 1);
    str = lines.join('\n');

    str = str.replace(/declare module (.*) {/g, `declare module ${options.moduleName} {`);

    str = str.replace("import * as BABYLON from 'babylonjs';", "");
    let regexp = new RegExp(`import {(.*)} from ['"]${options.packageName}(.*)['"];`, 'g');
    str = str.replace(regexp, '');

    if (options.importsToRemove) {
        while (options.importsToRemove.length) {
            let remove = options.importsToRemove.pop();
            str = str.replace(new RegExp(`import '${remove}';`), '');
        }
    }

    //find all used BABYLON and BABYLON-Loaders classes:

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

    //empty declare regex
    let emptyDeclareRegexp = new RegExp("declare module " + options.moduleName + " {\n}", "g");

    str = str.replace(emptyDeclareRegexp, "");

    return str;
}