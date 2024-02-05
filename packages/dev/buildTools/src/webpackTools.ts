/* eslint-disable no-console */
import type ts from "typescript";
import transformer from "./pathTransform.js";
import type { BuildType, DevPackageName, UMDPackageName } from "./packageMapping.js";
import { getPackageMappingByDevName, getPublicPackageName, isValidDevPackageName, umdPackageMapping } from "./packageMapping.js";
import * as path from "path";
import { camelize } from "./utils.js";
import type { RuleSetRule, Configuration } from "webpack";

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
    } = {
        includeAssets: true,
        includeCSS: true,
        sideEffects: true,
    }
) => {
    const rules: RuleSetRule[] = [
        {
            test: /\.tsx?$/,
            loader: "ts-loader",
            exclude: /node_modules/,
            sideEffects: options.sideEffects,
            options: {
                configFile: "tsconfig.build.json",
                ...options.tsOptions,
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
                test: /(?<!modules)\.s[ac]ss$/i,
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
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                sideEffects: options.sideEffects,
                test: /\.modules\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
                            modules: {
                                localIdentName: options.mode === "production" ? "[hash:base64]" : "[path][name]__[local]",
                            },
                        },
                    },
                    {
                        loader: "sass-loader",
                        options: {
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

export const commonDevWebpackConfiguration = (
    env: {
        mode: "development" | "production";
        outputFilename: string;
        dirName: string;
        enableHttps?: boolean;
        enableHotReload?: boolean;
        enableLiveReload?: boolean;
    },
    devServerConfig?: {
        port: number;
        static?: string[];
        showBuildProgress?: boolean;
    }
) => {
    const production = env.mode === "production" || process.env.NODE_ENV === "production";
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
                  hot: (env.enableHotReload !== undefined || process.env.ENABLE_HOT_RELOAD === "true") && !production ? true : false,
                  liveReload: (env.enableLiveReload !== undefined || process.env.ENABLE_LIVE_RELOAD === "true") && !production ? true : false,
                  headers: {
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      "Access-Control-Allow-Origin": "*",
                  },
                  client: {
                      overlay: process.env.DISABLE_DEV_OVERLAY
                          ? false
                          : {
                                warnings: false,
                                errors: true,
                            },
                      logging: production ? "error" : "info",
                      progress: devServerConfig.showBuildProgress,
                  },
                  allowedHosts: process.env.ALLOWED_HOSTS ? process.env.ALLOWED_HOSTS.split(",") : undefined,
              }
            : undefined,
        output: env.outputFilename
            ? {
                  path: path.resolve(env.dirName, "dist"),
                  filename: env.outputFilename,
                  devtoolModuleFilenameTemplate: production ? "webpack://[namespace]/[resource-path]?[loaders]" : "file:///[absolute-resource-path]",
              }
            : undefined,
    };
};

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
                        console.log("generating transformers...");
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
