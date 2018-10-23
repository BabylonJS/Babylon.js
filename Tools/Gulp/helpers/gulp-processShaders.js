var through = require('through2');
var PluginError = require('gulp-util').PluginError;
let path = require('path');
let fs = require('fs');

let tsShaderTemplate = 
`import { Effect } from "babylonjs";
##INCLUDES_PLACEHOLDER##
let name = '##NAME_PLACEHOLDER##';
let shader = \`##SHADER_PLACEHOLDER##\`;

Effect.##SHADERSTORE_PLACEHOLDER##[name] = shader;

export { shader, name };
`;

function getShaderName(filename) {
    let parts = filename.split('.');
    if (parts[1] !== 'fx') {
        return parts[0] + (parts[1] === 'fragment' ? 'Pixel' : 'Vertex') + "Shader";
    } else {
        return parts[0];
    }
}

function getIncludes(sourceCode) {
    var regex = /#include<(.+)>(\((.*)\))*(\[(.*)\])*/g;
    var match = regex.exec(sourceCode);

    var includes = new Set();

    while (match != null) {
        let includeFile = match[1];

        // Uniform declaration
        if (includeFile.indexOf("__decl__") !== -1) {
            includeFile = includeFile.replace(/__decl__/, "");

            // Add non UBO import
            const noUBOFile = includeFile + "Declaration";
            includes.add(noUBOFile);

            includeFile = includeFile.replace(/Vertex/, "Ubo");
            includeFile = includeFile.replace(/Fragment/, "Ubo");
            const uBOFile = includeFile + "Declaration";
            includes.add(uBOFile);
        }
        else {
            includes.add(includeFile);
        }

        match = regex.exec(sourceCode);
    }

    return includes;
}

function main(isCore) {
    return through.obj(function (file, enc, cb) {
            if (file.isNull()) {
                cb(null, file);
                return;
            }
            if (file.isStream()) {
                cb(new PluginError("Process Shader", "Streaming not supported."));
            }
    
            const filename = path.basename(file.path);
            const normalized = path.normalize(file.path);
            const directory = path.dirname(normalized);
            const shaderName = getShaderName(filename);
            const tsFilename = filename.replace('.fx', '.ts');

            let fxData = file.contents.toString();
            // Trailing whitespace...
            fxData = fxData.replace(/[^\S\r\n]+$/gm, "");

            let includeText = "";
            const includes = getIncludes(fxData);
            includes.forEach((entry) => {
                if (isCore) {
                    includeText = includeText + `import "./ShadersInclude/${entry}";
`;
                }
                else {
                    includeText = includeText + `import "babylonjs/Shaders/ShadersInclude/${entry}";
`;
                }
            });

            const shaderStore = directory.indexOf("ShadersInclude") > -1 ? "IncludesShadersStore" : "ShadersStore";

            let tsContent = tsShaderTemplate.replace('##INCLUDES_PLACEHOLDER##', includeText);
            tsContent = tsContent.replace('##NAME_PLACEHOLDER##', shaderName);
            tsContent = tsContent.replace('##SHADER_PLACEHOLDER##', fxData);
            tsContent = tsContent.replace('##SHADERSTORE_PLACEHOLDER##', shaderStore);

            fs.writeFileSync(directory + '/' + tsFilename, tsContent);

            return cb();
        });
}

module.exports = main;