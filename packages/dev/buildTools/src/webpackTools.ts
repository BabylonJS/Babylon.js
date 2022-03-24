import type ts from "typescript";
import transformer from "./pathTransform";
import type { BuildType, DevPackageName, UMDPackageName } from "./packageMapping";
import { getPackageMappingByDevName, getPublicPackageName, isValidDevPackageName, umdPackageMapping } from "./packageMapping";
import * as path from "path";
import { camelize } from "./utils";
import type { RuleSetRule, Configuration } from "webpack";

export const externalsFunction = (excludePackages: string[] = [], type: BuildType = "umd") => {
    return function ({ request }: { request: string }, callback: (err: Error | null, result?: any) => void) {
        const importParts = request.split("/");
        const devPackageName = importParts[0].replace(/^babylonjs/, "") || "core";
        // check if this request needs to be ignored or transformed
        if (excludePackages.indexOf(devPackageName) === -1 && isValidDevPackageName(devPackageName)) {
            const packages = getPackageMappingByDevName(devPackageName);
            const buildTypePackage = getPublicPackageName(packages[type], request);
            const namespaceName = getPublicPackageName(packages.namespace, request);
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
                test: /\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true,
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

export const commonUMDWebpackConfiguration = (options: {
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
    const filename = `${umdPackageMapping[packageMapping.umd as UMDPackageName].baseFilename}${umdPackageMapping[packageMapping.umd as UMDPackageName].isBundle ? ".bundle" : ""}${
        options.maxMode ? (options.mode && options.mode === "development" ? ".max" : "") : options.mode && options.mode === "production" ? ".min" : ""
    }.js`;
    return {
        entry: "./src/index.ts",
        devtool: "source-map",
        mode: options.mode || "development",
        output: {
            path: options.outputPath || path.resolve("./dist"),
            filename,
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
                        return transformer(_program, {
                            basePackage: packageName,
                            buildType: "umd",
                            packageOnly: false,
                            keepDev: true,
                        });
                    },
                },
                sideEffects: true,
                includeAssets: true,
                includeCSS: true,
            }),
        },
        ...options.extendedWebpackConfig,
    } as Configuration;
};
