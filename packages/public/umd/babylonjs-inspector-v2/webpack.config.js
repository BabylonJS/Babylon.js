const path = require("path");
const { commonUMDWebpackConfiguration: commonConfigGenerator, externalsFunction } = require("@dev/build-tools").webpackTools;

const inspectorDefaultExternals = externalsFunction(["inspector-v2"], "umd");

module.exports = (env) => {
    const commonConfig = commonConfigGenerator({
        mode: env.production ? "production" : "development",
        devPackageAliasPath: `../../../dev/inspector-v2/dist`,
        devPackageName: "inspector-v2",
        namespace: "INSPECTOR",
        outputPath: path.resolve(__dirname),
        maxMode: true,
        minToMax: true,
        alias: {
            "shared-ui-components": path.resolve("../../../dev/sharedUiComponents/dist"),
        },
    });

    // TODO: The default mappings logic results in externalizing `const { NodeEditor } = await import("node-editor/nodeEditor");`
    //       effectively as `const { NodeEditor } = BABYLON.NodeEditor;`, which is incorrect. But changing the default mappings
    //       breaks the module.d.ts generation in that it results in internal common dependencies being put in the BABYLON namespace,
    //       which then creates namespace conflicts when multiple tools are imported. Most likely those module.d.ts files should
    //       not include all the internals, but we need to investigate more. Is it just a d.ts issue, or do we need duplicated internals
    //       to actually be in different namespaces in the runtime bundle as well? For now, just patch the UMD externals here.
    commonConfig.externals = ({ context, request }, callback) => {
        if (request === "node-editor/nodeEditor") {
            return callback(null, {
                root: ["BABYLON"],
                commonjs: "babylonjs-node-editor",
                commonjs2: "babylonjs-node-editor",
                amd: "babylonjs-node-editor",
            });
        } else if (request === "node-geometry-editor/nodeGeometryEditor") {
            return callback(null, {
                root: ["BABYLON"],
                commonjs: "babylonjs-node-geometry-editor",
                commonjs2: "babylonjs-node-geometry-editor",
                amd: "babylonjs-node-geometry-editor",
            });
        } else if (request === "node-particle-editor/nodeParticleEditor") {
            return callback(null, {
                root: ["BABYLON"],
                commonjs: "babylonjs-node-particle-editor",
                commonjs2: "babylonjs-node-particle-editor",
                amd: "babylonjs-node-particle-editor",
            });
        } else if (request === "node-render-graph-editor/nodeRenderGraphEditor") {
            return callback(null, {
                root: ["BABYLON"],
                commonjs: "babylonjs-node-render-graph-editor",
                commonjs2: "babylonjs-node-render-graph-editor",
                amd: "babylonjs-node-render-graph-editor",
            });
        }

        return inspectorDefaultExternals({ context, request }, callback);
    };

    return commonConfig;
};
