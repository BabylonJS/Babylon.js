module.exports = function (data) {

    var str = "" + data;

    // this regex is not working on node 6 for some reason:
    // str = str.replace(/declare module 'babylonjs-viewer\/' {((?!(declare))(.|\n))*\n}/g, '');

    let lines = str.split('\n');
    var firstIndex = lines.findIndex((line => { return line.indexOf("'babylonjs-viewer/'") !== -1 }));
    var lastIndex = lines.findIndex(((line, idx) => { return line.trim() === '}' && idx > firstIndex }));
    lines.splice(firstIndex, lastIndex - firstIndex + 1);
    str = lines.join('\n');

    str = str.replace(/declare module (.*) {/g, 'declare module BabylonViewer {').replace("import * as BABYLON from 'babylonjs';", "");
    str = str.replace(/import {(.*)} from ['"]babylonjs-viewer(.*)['"];/g, '').replace(/import 'babylonjs-loaders';/, '').replace(/import 'pep';/, '');

    //find all used BABYLON and BABYLON-Loaders classes:

    var babylonRegex = /import {(.*)} from ['"](babylonjs|babylonjs-loaders)['"];/g

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
        str = str.replace(rg, "$1BABYLON.$2$3");
    });

    str = str.replace(/export {(.*)};/g, '')

    return str;
}