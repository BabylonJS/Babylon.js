module.exports = function nodeExternals(options) {
    options = options || {};

    // return an externals function
    return function(_, request, callback) {
        if (/^babylonjs-serializers.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "babylonjs-serializers",
                commonjs2: "babylonjs-serializers",
                amd: "babylonjs-serializers"
            });
        }
        else if (/^babylonjs-loaders.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "babylonjs-loaders",
                commonjs2: "babylonjs-loaders",
                amd: "babylonjs-loaders"
            });
        }
        else if (/^babylonjs-gui.*$/i.test(request)) {
            callback(null, {
                root: ["BABYLON", "GUI"],
                commonjs: "babylonjs-gui",
                commonjs2: "babylonjs-gui",
                amd: "babylonjs-gui"
            });
        }
        else if (/^babylonjs-materials.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "babylonjs-materials",
                commonjs2: "babylonjs-materials",
                amd: "babylonjs-materials"
            });
        }
        else if (/^babylonjs.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "babylonjs",
                commonjs2: "babylonjs",
                amd: "babylonjs"
            });
        }
        else if (/^@babylonjs\/serializers.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "@babylonjs/serializers",
                commonjs2: "@babylonjs/serializers",
                amd: "@babylonjs/serializers"
            });
        }
        else if (/^@babylonjs\/loaders.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "@babylonjs/loaders",
                commonjs2: "@babylonjs/loaders",
                amd: "@babylonjs/loaders"
            });
        }
        else if (/^@babylonjs\/gui.*$/i.test(request)) {
            callback(null, {
                root: ["BABYLON", "GUI"],
                commonjs: "@babylonjs/gui",
                commonjs2: "@babylonjs/gui",
                amd: "@babylonjs/gui"
            });
        }
        else if (/^@babylonjs\/materials.*$/i.test(request)) {
            callback(null, {
                root: ["BABYLON", "MATERIALS"],
                commonjs: "@babylonjs/materials",
                commonjs2: "@babylonjs/materials",
                amd: "@babylonjs/materials"
            });
        }
        else if (/^@babylonjs\/core.*$/i.test(request)) {
            callback(null, {
                root: "BABYLON",
                commonjs: "@babylonjs/core",
                commonjs2: "@babylonjs/core",
                amd: "@babylonjs/core"
            });
        }
        else {
            callback();
        }
    }
};