/* eslint-disable no-console */
import type ts from "typescript";
import transformer from "./pathTransform.js";
import type { BuildType, DevPackageName, UMDPackageName } from "./packageMapping.js";
import { getPackageMappingByDevName, getPublicPackageName, isValidDevPackageName, umdPackageMapping } from "./packageMapping.js";
import * as path from "path";
import { camelize, copyFile } from "./utils.js";
import type { RuleSetRule, Configuration, Compiler, WebpackPluginInstance } from "webpack";
import * as ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import ReactRefreshTypeScript from "react-refresh-typescript";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const externalsFunction = (excludePackages: string[] = [], type: BuildType = "umd") => {
    return function ({ context, request }: { context: string; request: string }, callback: (err: Error | null, result?: any) => void) {
        if (request.includes("babylonjs-gltf2interface")) {
            return callback(null, {
                root: ["BABYLON", "GLTF2"],
                commonjs: "babylonjs-gltf2interface",
                commonjs2: "babylonjs-gltf2interface",
                amd: "babylonjs-gltf2interface",
            });
        }
        // fix for mac
        if (request.includes("webpack")) {
            return callback(null);
        }
        const importParts = request.split("/");
        const devPackageName = importParts[0].replace(/^babylonjs/, "") || "core";
        // check if this request needs to be ignored or transformed
        if (excludePackages.indexOf(devPackageName) === -1 && isValidDevPackageName(devPackageName, true)) {
            const packages = getPackageMappingByDevName(devPackageName, true);
            const buildTypePackage = getPublicPackageName(packages[type], request);
            const namespaceName = getPublicPackageName(packages.namespace, request);
            // check if the "external"  is actually a local dependency
            const umdPackageName = getPublicPackageName(packages["umd"], request) as UMDPackageName;
            const directoryToExpect = umdPackageMapping[umdPackageName].baseDir || "core";
            if (directoryToExpect && context.replace(/\\/g, "/").includes("/" + directoryToExpect + "/")) {
                return callback(null);
            }
            if (request.indexOf("ktx2decoderTypes") !== -1) {
                return callback(null);
            }
            if (type === "umd" || type === "es6") {
                return callback(null, {
                    root: namespaceName.indexOf(".") !== -1 ? namespaceName.split(".") : namespaceName,
                    commonjs: buildTypePackage,
                    commonjs2: buildTypePackage,
                    amd: buildTypePackage,
                });
            }
        }
        return callback(null); // was ()
    };
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const getRules = (
    options: {
        includeAssets?: boolean;
        includeCSS?: boolean;
        sideEffects?: boolean;
        tsOptions?: {
            configFile?: string;
            getCustomTransformers?: (_program: ts.Program) => Required<Pick<ts.CustomTransformers, "after" | "afterDeclarations">>;
            [key: string]: any;
        };
        resourceType?: "asset/inline" | "asset/resource";
        extraRules?: RuleSetRule[];
        mode?: "development" | "production";
        enableFastRefresh?: boolean; // for react fast refresh
    } = {
        includeAssets: true,
        includeCSS: true,
        sideEffects: true,
    }
) => {
    const getCustomTransformers = options.enableFastRefresh
        ? (program: ts.Program) => {
              const transformers: ts.CustomTransformers = options?.tsOptions?.getCustomTransformers?.(program) ?? {};
              transformers.before = transformers.before ?? [];
              transformers.before.push(ReactRefreshTypeScript());
              return transformers;
          }
        : options?.tsOptions?.getCustomTransformers;

    const rules: RuleSetRule[] = [
        {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
            sideEffects: options.sideEffects,
            options: {
                configFile: "tsconfig.build.json",
                ...{ ...options.tsOptions, getCustomTransformers },
            },
        },
        {
            sideEffects: options.sideEffects,
            test: /\.js$/,
            enforce: "pre",
            use: ["source-map-loader"],
        },
    ];
    if (options.includeAssets) {
        rules.push({
            test: /\.(png|svg|jpg|jpeg|gif|ttf)$/i,
            type: options.resourceType || "asset/inline",
        });
    }
    if (options.includeCSS) {
        rules.push(
            {
                sideEffects: options.sideEffects,
                test: /(?<!module)\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                            modules: "global",
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            api: "modern",
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                sideEffects: options.sideEffects,
                test: /\.module\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                            esModule: true,
                            modules: {
                                localIdentName: options.mode === "production" ? "[hash:base64]" : "[path][name]__[local]",
                            },
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            api: "modern",
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.css$/,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",

                        options: {
                            esModule: true,
                            sourceMap: true,
                        },
                    },
                ],
            }
        );
    }
    rules.push(...(options.extraRules || []));
    return rules;
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const commonDevWebpackConfiguration = (
    env: {
        mode: "development" | "production";
        outputFilename: string;
        dirName: string;
        dirSuffix?: string;
        enableHttps?: boolean;
        enableHotReload?: boolean;
        enableLiveReload?: boolean;
    },
    devServerConfig?: {
        port: number;
        static?: string[];
        showBuildProgress?: boolean;
    },
    additionalPlugins?: WebpackPluginInstance[]
) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
    const enableHotReload = (env.enableHotReload !== undefined || process.env.ENABLE_HOT_RELOAD === "true") && !production ? true : false;

    let plugins: WebpackPluginInstance[] | undefined = additionalPlugins;
    const enableOverlay: boolean = !!process.env.ENABLE_DEV_OVERLAY;
    if (devServerConfig && enableHotReload) {
        plugins = plugins ?? [];
        plugins.push(new ReactRefreshWebpackPlugin({ overlay: enableOverlay }));
    }

    return {
        mode: production ? "production" : "development",
        devtool: production ? "source-map" : "inline-cheap-module-source-map",
        devServer: devServerConfig
            ? {
                  port: devServerConfig.port,
                  static: devServerConfig.static ? devServerConfig.static.map((dir) => path.resolve(dir)) : undefined,
                  webSocketServer: production ? false : "ws",
                  compress: production,
                  server: env.enableHttps !== undefined || process.env.ENABLE_HTTPS === "true" ? "https" : "http",
                  hot: enableHotReload,
                  liveReload: (env.enableLiveReload !== undefined || process.env.ENABLE_LIVE_RELOAD === "true") && !production ? true : false,
                  headers: {
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      "Access-Control-Allow-Origin": "*",
                  },
                  client: {
                      overlay: enableOverlay
                          ? {
                                warnings: false,
                                errors: true,
                            }
                          : false,
                      logging: production ? "error" : "info",
                      progress: devServerConfig.showBuildProgress,
                  },
                  allowedHosts: process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(",") : undefined,
              }
            : undefined,
        output: env.outputFilename
            ? {
                  path: path.resolve(env.dirName, "dist", env.dirSuffix || ""),
                  filename: env.outputFilename,
                  clean: true,
                  devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
              }
            : undefined,
        plugins,
    };
};

/**
 * Originally our build commands for our tools were running both dev and prod, outputted an unminified max.js file during CI. This impacted memory usage during
 * build and is not necessary for debugging since we offer source maps. We have since removed the dev step from our builds, but in order to preserve
 * backwards compatibility for users who may have been referencing the .max.js file directly, we now copy the minified file to a .max.js file
 * after the build is complete. This plugin will only run if the `minToMax` option is set to true in the webpack configuration.
 */
class CopyMinToMaxWebpackPlugin {
    apply(compiler: Compiler) {
        compiler.hooks.done.tap("CopyToMax", (stats) => {
            if (stats.hasErrors()) {
                console.error("Build had errors, skipping CopyMinToMax plugin");
                return;
            }
            const outputPath = stats.compilation.outputOptions.path;
            if (outputPath) {
                for (const chunk of stats.compilation.chunks) {
                    for (const file of chunk.files) {
                        const from = path.join(outputPath, file);
                        let to;
                        if (file.includes(".min.js")) {
                            // if maxMode is false, the minified file will have .min.js suffix and the max file will have no suffix
                            to = path.join(outputPath, file.replace(/\.min\.js$/, ".js"));
                        } else {
                            // if maxMode is true, the minified file will have no suffix and the max file will have max.js suffix
                            to = path.join(outputPath, file.replace(/\.js$/, ".max.js"));
                        }
                        copyFile(from, to);
                    }
                }
            }
        });
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const commonUMDWebpackConfiguration = (options: {
    entryPoints?: { [name: string]: string };
    overrideFilename?: string | ((chunk: any) => string);
    devPackageName: DevPackageName;
    devPackageAliasPath?: string;
    mode?: "development" | "production";
    namespace?: string;
    outputPath?: string;
    alias?: { [key: string]: string };
    optionalExternalFunctionSkip?: string[];
    extendedWebpackConfig?: Partial<Configuration>;
    es6Mode?: boolean;
    maxMode?: boolean; // if true filename will have .max for the dev version and nothing for the prod version
    extraExternals?: Configuration["externals"]; // see https://webpack.js.org/configuration/externals/#combining-syntaxes
    minToMax?: boolean; // if true, will copy the minified file to a file with max.js suffix. This is for back-compat reasons in case users reference .max.js output directly. For debugging purposes, we expose the sourcemap
}) => {
    const packageMapping = getPackageMappingByDevName(options.devPackageName);
    const packageName = getPublicPackageName(options.es6Mode ? packageMapping.es6 : packageMapping.umd);
    const umdPackageName = getPublicPackageName(packageMapping.umd);
    const filename = `${
        options.overrideFilename && typeof options.overrideFilename === "string" ? options.overrideFilename : umdPackageMapping[umdPackageName as UMDPackageName].baseFilename
    }${umdPackageMapping[umdPackageName as UMDPackageName].isBundle ? ".bundle" : ""}${
        options.maxMode ? (options.mode && options.mode === "development" ? ".max" : "") : options.mode && options.mode === "production" ? ".min" : ""
    }.js`;
    return {
        entry: options.entryPoints ?? "./src/index.ts",
        devtool: options.mode === "production" ? "source-map" : "inline-cheap-module-source-map",
        mode: options.mode || "development",
        plugins: options.minToMax && options.mode === "production" ? [new CopyMinToMaxWebpackPlugin()] : [],
        output: {
            path: options.outputPath || path.resolve("./dist"),
            filename: (typeof options.overrideFilename === "function" && options.overrideFilename) || filename,
            library: {
                name: {
                    root: (options.namespace && options.namespace.split(".")) || [options.devPackageName.toUpperCase()],
                    amd: packageName,
                    commonjs: packageName,
                },
                type: "umd",
            },
            libraryExport: "default",
            umdNamedDefine: true,
            globalObject: '(typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : this)',
            // This disables chunking / code splitting. For UMD, we always want a single output file per entry point.
            // NOTE: The normal way of doing this is by limiting the max chunks, as described here: https://webpack.js.org/plugins/limit-chunk-count-plugin/#maxchunks
            //       However, that didn't work when testing (fewer chunks were created, but still more than 1). There is a long Webpack github issue about this, where
            //       eventually someone suggests the following config option, which apparently worked for many other people, and worked for us too.
            //       https://github.com/webpack/webpack/issues/12464#issuecomment-1911309972
            chunkFormat: false,
        },
        resolve: {
            extensions: [".ts", ".js"],
            alias: {
                // default alias - for its own package to the lts version
                [options.devPackageName]: path.resolve(options.devPackageAliasPath || `../../../lts/${camelize(options.devPackageName)}/dist`),
                ...options.alias,
            },
        },
        externals: [options.extraExternals || {}, externalsFunction([options.devPackageName, ...(options.optionalExternalFunctionSkip || [])], options.es6Mode ? "es6" : "umd")],
        module: {
            rules: getRules({
                tsOptions: {
                    getCustomTransformers: (_program: ts.Program) => {
                        // webpack program
                        return {
                            after: [
                                transformer(_program, {
                                    basePackage: packageName,
                                    buildType: options.es6Mode ? "es6" : "umd",
                                    packageOnly: false,
                                    keepDev: true,
                                }),
                            ],
                            afterDeclarations: [
                                transformer(_program, {
                                    basePackage: packageName,
                                    buildType: options.es6Mode ? "es6" : "umd",
                                    packageOnly: false,
                                    keepDev: true,
                                }),
                            ],
                        };
                    },
                },
                sideEffects: true,
                includeAssets: true,
                includeCSS: true,
                mode: options.mode || "development",
            }),
        },
        ...options.extendedWebpackConfig,
    } as Configuration;
};
