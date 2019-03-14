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
        var regexTypeImport = /(.*)type ([A-Za-z0-9]*) = import\("(.*)"\)\.(.*);/g;
        var match = regexTypeImport.exec(line);
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

        // Replace Static Readonly declaration for UMD TS Version compat
        var regexVar = /(.*)readonly (.*) = (.*);/g;
        match = regexVar.exec(line);
        if (match) {
            let spaces = match[1];
            let name = match[2];
            let value = match[3];
            if (value === "true" || value === "false") {
                line = `${spaces}readonly ${name}: boolean;`;
            }
            else if (value.startsWith('"')) {
                line = `${spaces}readonly ${name}: string;`;    
            }
            else {
                line = `${spaces}readonly ${name}: number;`;
            }
        }

        lines[index] = line;
    }

    // Recreate the file.
    str = lines.join('\n');

    // !!! Be carefull
    // Could cause issues if this appears in several import scope
    // with different aliases.
    // !!! Be carefull multiline not managed.
    // Remove unmanaged externals Appears as classMap false in the config.
    if (options.externals) {
        for (let ext in options.externals) {
            // Need to remove the module and dependencies if false.
            if (options.externals[ext] === false) {
                // Replace import { foo, bar } from ...
                const package = ext;
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

                    // !!! Be carefull multiline not managed.
                    const rg = new RegExp(`.*[ <]${alias}[^\\w].*`, "g")
                    str = str.replace(rg, "");
                });
            }
        }

        // Remove Empty Lines
        str = str.replace(/^\s*$/gm, "");
    }

    // Hide Exported Consts if necessary
    if (options.hiddenConsts) {
        for (let toHide of options.hiddenConsts) {
            var constStart = str.indexOf(`export const ${toHide}`);
            if (constStart > -1) {
                for (let i = constStart; i < str.length; i++) {
                    if (str[i] === "}") {
                        // +1 to enroll the last }
                        // +2 to enroll the trailing ;
                        str = str.substr(0, constStart) + str.substr(i + 2);
                        break;
                    }
                }
            }
        }
    }

    // Add Entry point.
    str += `
declare module "${moduleName}" {
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