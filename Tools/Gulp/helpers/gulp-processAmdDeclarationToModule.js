// Gulp Tools
var fs = require("fs");

var processData = function(data, options) {
    var moduleName = options.moduleName;
    var entryPoint = options.entryPoint;

    var str = "" + data;

    // Start process by extracting all lines.
    let lines = str.split('\n');

    // Let's go line by line and check if we have special folder replacements
    // Replaces declare module '...'; by declare module 'babylonjs/...'; for instance
    for (let index = 0; index < lines.length; index++) {
        let line = lines[index];

        // Replace Type Imports
        var regex = /(.*)type ([A-Za-z0-9]*) = import\("(.*)"\)\.(.*);/g;
        var match = regex.exec(line);
        if (match) {
            var spaces = match[1]
            var module = match[3];
            var type = match[4];
            line = `${spaces}import { ${type} } from "${module}";`;
        }

        // Checks if line is about external module
        var externalModule = false;
        if (options.externals) {
            for (let ext in options.externals) {
                externalModule = line.indexOf(ext) > -1;
                if (externalModule) {
                    break;
                }
            }
        }
        // If not Append Module Name
        if (!externalModule) {
            // Declaration
            line = line.replace(/declare module "/g, `declare module "${moduleName}/`);
            // From
            line = line.replace(/ from "/g, ` from "${moduleName}/`);
            // Module augmentation
            line = line.replace(/    module "/g, `    module "${moduleName}/`);
            // Inlined Import
            line = line.replace(/import\("/g, `import("${moduleName}/`);
            // Side Effect Import
            line = line.replace(/import "/g, `import "${moduleName}/`);
        }

        lines[index] = line;
    }

    // Recreate the file.
    str = lines.join('\n');

    // Add Entry point.
    str += `declare module "${moduleName}" {
    export * from "${moduleName}/${entryPoint.replace(/\.\//g,"").replace(".ts", "")}";
}`;

    return str;
}

module.exports = function(fileLocation, options, cb) {
    options = options || { };

    var data = fs.readFileSync(fileLocation);

    newData = processData(data, options);

    fs.writeFileSync(options.output || fileLocation, newData);
}