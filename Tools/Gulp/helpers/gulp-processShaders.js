var through = require('through2');
var PluginError = require('gulp-util').PluginError;
let path = require('path');
let fs = require('fs');

let tsShaderTemplate = 
`import { Effect } from "babylonjs";

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

function main() {
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

            const shaderStore = directory.indexOf("ShadersInclude") > -1 ? "IncludesShadersStore" : "ShadersStore";

            let tsContent = tsShaderTemplate.replace('##NAME_PLACEHOLDER##', shaderName);
            tsContent = tsContent.replace('##SHADER_PLACEHOLDER##', fxData);
            tsContent = tsContent.replace('##SHADERSTORE_PLACEHOLDER##', shaderStore);

            fs.writeFileSync(directory + '/' + tsFilename, tsContent);

            return cb();
        });
}

module.exports = main;