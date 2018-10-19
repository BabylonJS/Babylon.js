let glob = require('glob');
let path = require('path');
let fs = require('fs');
// Usage - node .\processShaders.js ../../gui/
let shaderProcessor = require('./parser');
let shadersPath = process.argv[2] || '../../';

let tsTemplate = `import { Effect } from "babylonjs";

let shader = '';
let name = '';
let registerShader = false;
##PLACEHOLDER##
if(registerShader && name && shader) {
    Effect.ShadersStore[name] = shader;
}

export { shader, name };
`;

glob(shadersPath + '/**/*.fx', (err, shaderFiles) => {
    if (err) {
        console.log('error', err);
    } else {
        console.log('processing shaders');
        shaderFiles.forEach(file => {
            let filename = path.basename(file);
            let normalized = path.normalize(file);
            let directory = path.dirname(normalized);
            let shaderName = getShaderName(filename);
            let tsFilename = filename.replace('.fx', '.ts');
             let shaderContent = fs.readFileSync(file).toString();
             //TODO - take care of includes!!!
             shaderProcessor(undefined, shaderContent, undefined, (err, data) => {
                let tsContent = tsTemplate.replace('##PLACEHOLDER##', `name = '${shaderName}'; shader = \`${data}\`;  `);
                fs.writeFileSync(directory + '/' + tsFilename, tsContent);
            });
        });
    }
})

function getShaderName(filename) {
    let parts = filename.split('.');
    if (parts[1] !== 'fx') {
        return parts[0] + (parts[1] === 'fragment' ? 'Pixel' : 'Vertex') + "Shader";
    } else {
        return parts[0];
    }
}