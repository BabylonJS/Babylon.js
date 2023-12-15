/* eslint-disable no-console */
import * as glob from "glob";
import * as fs from "fs";
import * as path from "path";
import * as chokidar from "chokidar";

import { camelize, checkArgs, checkDirectorySync, debounce, findRootDirectory, getHashOfContent, getHashOfFile, kebabize } from "./utils.js";
import type { BuildType, DevPackageName } from "./packageMapping.js";
import { getAllPackageMappingsByDevNames, getPackageMappingByDevName, getPublicPackageName, isValidDevPackageName } from "./packageMapping.js";

export interface IGenerateDeclarationConfig {
    devPackageName: DevPackageName;
    outputDirectory?: string;
    externals?: { [key: string]: string };
    hiddenConsts?: string[];
    namedExportPathsToExclude?: string;
    filename?: string;
    declarationLibs: string[];
    buildType?: BuildType;
    addToDocumentation?: boolean;
    initDocumentation?: boolean;
    fileFilterRegex?: string;
}

function getModuleDeclaration(
    source: string,
    filename: string,
    config: IGenerateDeclarationConfig,
    buildType: BuildType = "umd",
    classesMappingArray: {
        alias: string;
        realClassName: string;
        devPackageName?: DevPackageName;
        externalName?: string;
        fullPath: string;
    }[]
) {
    const distPosition = filename.indexOf("/dist");
    const packageVariables = getPackageMappingByDevName(config.devPackageName);
    const moduleName = getPublicPackageName(packageVariables[buildType], filename) + filename.substring(distPosition + 5).replace(".d.ts", "");
    const sourceDir = path.dirname(moduleName);
    const lines = source.split("\n");
    const namedExportPathsToExcludeRegExp = config.namedExportPathsToExclude !== undefined ? new RegExp(`export {.*} from ".*${config.namedExportPathsToExclude}"`) : undefined;
    const mapping = getAllPackageMappingsByDevNames();
    let processedLines = lines
        .map((line: string) => {
            line = line.replace("import type ", "import ");
            // Replace Type Imports
            const regexTypeImport = /(.*)type ([A-Za-z0-9]*) = import\("(.*)"\)\.(.*);/g;
            let match = regexTypeImport.exec(line);
            if (match) {
                // var spaces = match[1];
                const module = match[3];
                const type = match[4];
                line = `import { ${type} } from "${module}";`;
            }
            // Checks if line is about external module
            let externalModule = false;
            if (config.externals) {
                for (const ext in config.externals) {
                    externalModule = line.indexOf(ext) > -1;
                    if (externalModule) {
                        break;
                    }
                }
            }
            // If not Append Module Name
            if (!externalModule) {
                // SKIP known named exports that are for backwards compatibility
                if (namedExportPathsToExcludeRegExp && namedExportPathsToExcludeRegExp.test(line)) {
                    line = line.startsWith("    ") ? "    //" + line.substring(3) : "// " + line;
                }

                [
                    // Declaration
                    /declare module ['"](.*)['"]/,
                    // From
                    / from ['"](.*)['"]/,
                    // Module augmentation
                    / {4}module ['"](.*)['"]/,
                    // Inlined Import
                    /import\(['"](.*)['"]/,
                    // Side Effect Import
                    /import ['"](.*)['"]/,
                ].forEach((regex) => {
                    const match = line.match(regex);
                    if (match) {
                        if (match[1][0] === ".") {
                            const newLocation = path.join(sourceDir, match[1]).replace(/\\/g, "/");
                            line = line.replace(match[1], newLocation);
                        } else {
                            let found = false;
                            Object.keys(mapping).forEach((devPackageName) => {
                                if (match[1].startsWith(devPackageName)) {
                                    line = line.replace(
                                        match[1],
                                        getPublicPackageName(
                                            mapping[(isValidDevPackageName(devPackageName, true) ? devPackageName : kebabize(config.devPackageName)) as DevPackageName][buildType],
                                            match[1]
                                        ) + match[1].substring(devPackageName.length)
                                    );
                                    found = true;
                                }
                            });
                            if (!found) {
                                // not a dev dependency
                                // TODO - make a list of external dependencies per package
                                // for now - we support react
                                if (match[1] !== "react") {
                                    // check what the line imports
                                    line = "";
                                }
                            }
                        }
                    }
                    line = line.replace("declare ", "");
                });
            }

            // Replace Static Readonly declaration for UMD/ES6 TS Version compat
            const regexVar = /(.*)readonly (.*) = (.*);/g;
            match = regexVar.exec(line);
            if (match) {
                const spaces = match[1];
                const name = match[2];
                const value = match[3];
                if (value === "true" || value === "false") {
                    line = `${spaces}readonly ${name}: boolean;`;
                } else if (value.startsWith('"')) {
                    line = `${spaces}readonly ${name}: string;`;
                } else {
                    line = `${spaces}readonly ${name}: number;`;
                }
            }
            return line;
        })
        .join("\n");
    // Hide Exported Consts if needed
    if (config.hiddenConsts) {
        for (const toHide of config.hiddenConsts) {
            const constStart = processedLines.indexOf(`export const ${toHide}`);
            if (constStart > -1) {
                for (let i = constStart; i < processedLines.length; i++) {
                    if (processedLines[i] === "}") {
                        // +1 to enroll the last }
                        // +2 to enroll the trailing ;
                        processedLines = processedLines.substr(0, constStart) + processedLines.substr(i + 2);
                        break;
                    }
                }
            }
        }
    }
    // replaces classes definitions with namespace definitions
    classesMappingArray.forEach((classMapping: { alias: string; realClassName: string; devPackageName?: DevPackageName; externalName?: string; fullPath: string }) => {
        const { alias, devPackageName, externalName } = classMapping;
        // TODO - make a list of dependencies that are accepted by each package
        if (!devPackageName) {
            if (externalName) {
                if (externalName === "@fortawesome" || externalName === "react-contextmenu") {
                    // replace with any
                    const matchRegex = new RegExp(`([ <])(${alias}[^;\n ]*)([^\\w])`, "g");
                    processedLines = processedLines.replace(matchRegex, `$1any$3`);
                    return;
                }
            }

            return;
        }
    });
    processedLines = processedLines.replace(/export declare /g, "export ");
    return `declare module "${moduleName}" {
${processedLines}
}
`;
}

/**
 *
 * @param source - the source code of the file
 * @param originalDevPackageName - the dev package name of the file
 * @param originalSourcefilePath
 * @returns an array of objects with alias, realClassName and package
 */
function getClassesMap(source: string, originalDevPackageName: string, originalSourcefilePath: string) {
    const regex = /import .*{([^}]*)} from ['"](.*)['"];/g;
    let matches = regex.exec(source);
    const mappingArray: {
        alias: string;
        realClassName: string;
        devPackageName?: DevPackageName;
        externalName?: string;
        fullPath: string;
        exported?: boolean;
    }[] = [];
    while (matches !== null) {
        const classes = matches[1].split(","); //.map((className) => className.trim());
        classes.forEach((className) => {
            // just a typescript thing...
            if (!matches) {
                return;
            }
            const parts = className.split(" as ");
            if (parts.length === 2) {
                console.log(`${parts[0]} as ${parts[1]}`);
            }
            const realClassName = parts[0].trim();
            const alias = parts[1] ? parts[1].trim() : realClassName;
            const firstSplit = matches[2]!.split("/")[0];
            const devPackageName = firstSplit[0] === "." ? originalDevPackageName : firstSplit;
            // if (alias !== realClassName) {
            //     console.log(
            //         alias,
            //         realClassName,
            //         devPackageName,
            //         matches[2],
            //         isValidDevPackageName(devPackageName),
            //         path.resolve(path.dirname(originalSourcefilePath), matches[2]!).replace(/\\/g, "/")
            //     );
            // }
            // only internals
            if (isValidDevPackageName(devPackageName)) {
                mappingArray.push({
                    alias,
                    realClassName,
                    devPackageName,
                    fullPath: firstSplit[0] === "." ? path.resolve(path.dirname(originalSourcefilePath), matches[2]!).replace(/\\/g, "/") : matches[2]!,
                });
            } else {
                if (!devPackageName.startsWith("babylonjs")) {
                    // console.log(`Not a Dev Package Name: ${devPackageName}`);
                    mappingArray.push({
                        alias,
                        externalName: devPackageName,
                        realClassName,
                        fullPath: firstSplit[0] === "." ? path.resolve(path.dirname(originalSourcefilePath), matches[2]!).replace(/\\/g, "/") : matches[2]!,
                    });
                }
            }
        });
        matches = regex.exec(source);
    }
    // check if the index exports it as something else

    // fist check if an index exists on the same directory
    let indexFilePath = path.resolve(path.dirname(originalSourcefilePath), "index.js");
    if (!fs.existsSync(indexFilePath)) {
        indexFilePath = path.resolve(path.dirname(originalSourcefilePath), "..", "index.js");
    }
    if (fs.existsSync(indexFilePath)) {
        const indexSource = fs.readFileSync(indexFilePath, "utf-8");
        // get relative path
        const relativePath = path
            .relative(path.dirname(indexFilePath), originalSourcefilePath)
            .replace(/\\/g, "/")
            .replace(/\.d\.ts$/, "");
        const indexRegex = new RegExp(`export {(.*)} from ['"]./${relativePath}['"];`, "g");
        let indexMatches = indexRegex.exec(indexSource);
        while (indexMatches !== null) {
            const classes = indexMatches[1].split(","); //.map((className) => className.trim());
            classes.forEach((className) => {
                // just a typescript thing...
                if (!indexMatches) {
                    return;
                }
                const parts = className.split(" as ");
                if (parts.length === 2) {
                    console.log(`aliasing ${parts[0]} as ${parts[1]}`);
                    const realClassName = parts[1].trim();
                    const alias = parts[0] ? parts[0].trim() : realClassName;
                    const devPackageName = originalDevPackageName;
                    if (isValidDevPackageName(devPackageName)) {
                        mappingArray.push({
                            alias,
                            realClassName,
                            devPackageName,
                            fullPath: path.resolve(path.dirname(originalSourcefilePath)).replace(/\\/g, "/"),
                            exported: true,
                        });
                    }
                }
            });
            indexMatches = indexRegex.exec(indexSource);
        }
    }

    return mappingArray;
}

function getPackageDeclaration(
    source: string,
    sourceFilePath: string,
    classesMappingArray: {
        alias: string;
        realClassName: string;
        devPackageName?: DevPackageName;
        externalName?: string;
        fullPath: string;
        exported?: boolean;
    }[],
    devPackageName: DevPackageName
) {
    const lines = source.split("\n");
    let i = 0;
    let lastWhitespace = "";
    let removeNext = false;
    const packageMapping = getPackageMappingByDevName(devPackageName);
    const defaultModuleName = getPublicPackageName(packageMapping.namespace);
    const thisFileModuleName = getPublicPackageName(packageMapping.namespace, sourceFilePath);
    while (i < lines.length) {
        let line = lines[i];

        if (/import\("\.(.*)\)./g.test(line) && !/^declare type (.*) import/g.test(line)) {
            line = line.replace(/import\((.*)\)./, "");
        }

        if (!line.includes("const enum") && !line.includes("=")) {
            line = line.replace("const ", "var ");
        }

        //Exclude empty lines
        let excludeLine /*:boolean */ = line === "";

        //Exclude export statements
        excludeLine = excludeLine || line.indexOf("export =") !== -1;

        //Exclude import statements
        excludeLine = excludeLine || /^import[ (]/.test(line);
        excludeLine = excludeLine || /export \{/.test(line);
        excludeLine = excludeLine || /export default/.test(line);
        excludeLine = excludeLine || /export \* from "/.test(line);
        excludeLine = excludeLine || /^declare type (.*) import/.test(line);

        const match = line.match(/(\s*)declare module "(.*)" \{/);
        if (match) {
            lastWhitespace = match[1];
            removeNext = true;
            excludeLine = true;
        }

        if (removeNext && line.indexOf(`${lastWhitespace}}`) === 0) {
            removeNext = false;
            excludeLine = true;
        }

        if (/namespace (.*) \{/.test(line)) {
            if (line.indexOf("export") === -1) {
                line = line.replace("namespace", "export namespace");
            }
        }

        if (excludeLine) {
            lines[i] = "";
        } else {
            if (line.indexOf("declare ") !== -1) {
                lines[i] = line.replace("declare ", "");
            } else {
                lines[i] = line;
            }
            //Add tab
            lines[i] = "    " + lines[i];
        }
        i++;
    }

    let processedSource = lines.join("\n").replace(/^(?:[\t ]*(?:\r?\n|\r))+/gm, "") + "\n\n";

    // replaces classes definitions with namespace definitions
    classesMappingArray.forEach(
        (classMapping: { alias: string; realClassName: string; devPackageName?: DevPackageName; externalName?: string; fullPath: string; exported?: boolean }) => {
            const { alias, realClassName, devPackageName: localDevPackageMap, fullPath, externalName, exported } = classMapping;
            // TODO - make a list of dependencies that are accepted by each package
            if (!localDevPackageMap) {
                if (externalName) {
                    if (externalName === "@fortawesome" || externalName === "react-contextmenu") {
                        // replace with any
                        const matchRegex = new RegExp(`([ <])(${alias}[^;\n ]*)([^\\w])`, "g");
                        processedSource = processedSource.replace(matchRegex, `$1any$3`);
                        return;
                    } else if (externalName === "react") {
                        const matchRegex = new RegExp(`([ <])(${alias})([^\\w])`, "g");
                        processedSource = processedSource.replace(matchRegex, `$1React.${realClassName}$3`);
                    }
                }

                return;
            }
            const devPackageToUse = isValidDevPackageName(localDevPackageMap, true) ? localDevPackageMap : devPackageName;
            const originalNamespace = getPublicPackageName(getPackageMappingByDevName(devPackageToUse).namespace);
            const namespace = getPublicPackageName(getPackageMappingByDevName(devPackageToUse).namespace, fullPath /*, fullPath*/);
            if (namespace !== defaultModuleName || originalNamespace !== namespace || alias !== realClassName) {
                const matchRegex = new RegExp(`([ <])(${alias})([^\\w])`, "g");
                if (exported) {
                    processedSource = processedSource.replace(matchRegex, `$1${realClassName}$3`);
                } else {
                    processedSource = processedSource.replace(matchRegex, `$1${namespace}.${realClassName}$3`);
                }
            }
        }
    );

    processedSource = processedSource.replace(
        / global {([^}]*)}/gm,
        `
}
$1
declare module ${thisFileModuleName} {
    `
    );

    if (defaultModuleName !== thisFileModuleName) {
        return `
}
declare module ${thisFileModuleName} {
    ${processedSource}
}
declare module ${defaultModuleName} {
`;
    }

    return processedSource;
}

// export function generateDefaultModuleDeclaration(declarationFiles: string[], devPackageName: DevPackageName) {
//     let declarations = "";
//     for (const fileName in declarationFiles) {
//         const declarationFile = declarationFiles[fileName];
//         // The lines of the files now come as a Function inside declaration file.
//         const data = fs.readFileSync(declarationFile, "utf8");
//         declarations += getPackageDeclaration(data, declarationFile, getClassesMap(data), devPackageName);
//     }
//     const packageVariables = getPackageMappingByDevName(devPackageName);
//     const defaultModuleName = getPublicPackageName(packageVariables.namespace);

//     return `
// declare module ${defaultModuleName} {
//     ${declarations}
// }
// `;
// }

export function generateCombinedDeclaration(declarationFiles: string[], config: IGenerateDeclarationConfig, looseDeclarations: string[] = [], buildType: BuildType = "umd") {
    let declarations = "";
    let moduleDeclaration = "";
    const filterRegex = config.fileFilterRegex ? new RegExp(config.fileFilterRegex) : null;
    declarationFiles.forEach((declarationFile) => {
        // check if filter applies to this file
        if (filterRegex && filterRegex.test(declarationFile)) {
            return;
        }
        // The lines of the files now come as a Function inside declaration file.
        const data = fs.readFileSync(declarationFile, "utf8");
        const classMap = getClassesMap(data, config.devPackageName, declarationFile);
        moduleDeclaration += getModuleDeclaration(data, declarationFile, config, config.buildType, classMap);
        if (declarationFile.indexOf("legacy.d.ts") !== -1) {
            return;
        }
        // const packageMapping = getPackageMappingByDevName(config.devPackageName);
        // const thisFileModuleName = getPublicPackageName(packageMapping.namespace, declarationFile);
        declarations += getPackageDeclaration(data, declarationFile, classMap, config.devPackageName);
    });
    const looseDeclarationsString = looseDeclarations
        .map((declarationFile) => {
            const data = fs.readFileSync(declarationFile, "utf8");
            return `\n${data}`;
        })
        .join("\n");
    const packageVariables = getPackageMappingByDevName(config.devPackageName);
    const defaultModuleName = getPublicPackageName(packageVariables.namespace);
    const packageName = getPublicPackageName(packageVariables[buildType]);
    // search for legacy export
    const legacyRegex = new RegExp(`${packageName}/(legacy/legacy)`, "mi");
    const legacy = moduleDeclaration.match(legacyRegex);
    const namespaceDeclaration =
        buildType === "umd"
            ? `
declare module ${defaultModuleName} {
${declarations}
}
`
            : "";
    const output = `
${moduleDeclaration}
declare module "${packageName}" {
    export * from "${packageName}/${legacy ? legacy[1] : "index"}";
}

${namespaceDeclaration}
${looseDeclarationsString}
`;
    return {
        output,
        namespaceDeclaration,
        looseDeclarationsString,
    };
}

export function generateDeclaration() {
    const configFilePath = checkArgs("--config") as string;
    if (!configFilePath) {
        throw new Error("--config path to config file is required");
    }
    const asJSON = checkArgs("--json", true) as boolean;
    const rootDir = findRootDirectory();
    // import { createRequire } from "module";
    // const requireRequest = createRequire(import.meta.url);
    // // a hack to load JSON!
    // const config = requireRequest(path.join(path.resolve("."), configFilePath));
    const config: IGenerateDeclarationConfig | IGenerateDeclarationConfig[] = JSON.parse(
        asJSON ? configFilePath : fs.readFileSync(path.join(path.resolve("."), configFilePath), "utf8")
    );
    if (!config) {
        throw new Error("No config file found");
    }
    const configArray = Array.isArray(config) ? config : [config];
    const filter = checkArgs("--filter") as string;
    configArray.forEach((config: IGenerateDeclarationConfig) => {
        if (filter) {
            if (filter.indexOf(config.declarationLibs[0]) === -1) {
                return;
            }
        }
        const outputDir = config.outputDirectory || "./dist";
        checkDirectorySync(outputDir);
        const directoriesToWatch = config.declarationLibs.map((lib: string) => path.join(rootDir, "packages", `${camelize(lib).replace(/@/g, "")}/dist/**/*.d.ts`));
        const looseDeclarations = config.declarationLibs.map((lib: string) => path.join(rootDir, "packages", `${camelize(lib).replace(/@/g, "")}/**/LibDeclarations/**/*.d.ts`));

        const debounced = debounce(() => {
            const { output, namespaceDeclaration, looseDeclarationsString } = generateCombinedDeclaration(
                directoriesToWatch.map((dir) => glob.sync(dir)).flat(),
                config,
                looseDeclarations.map((dir) => glob.sync(dir)).flat(),
                config.buildType
            );
            const filename = `${outputDir}/${config.filename || "index.d.ts"}`;
            if (!checkArgs("--watch") && namespaceDeclaration && config.filename?.includes(".module.d.ts")) {
                fs.writeFileSync(
                    filename.replace(".module", ""),
                    `${namespaceDeclaration}
${looseDeclarationsString || ""}
                `
                );
                // check documentation flags
                if (config.addToDocumentation) {
                    // make sure snapshot directory exists
                    checkDirectorySync(path.join(rootDir, ".snapshot"));
                    const documentationFile = path.join(rootDir, ".snapshot", "documentation.d.ts");
                    const originalFile =
                        fs.existsSync(documentationFile) && !config.initDocumentation
                            ? fs.readFileSync(documentationFile, "utf8")
                            : fs.readFileSync(path.resolve(rootDir, "packages/public/glTF2Interface", "babylon.glTF2Interface.d.ts"), "utf8");
                    fs.writeFileSync(
                        documentationFile,
                        `${originalFile}
${namespaceDeclaration}
${looseDeclarationsString || ""}`
                    );
                }
            }
            // check hash
            if (fs.existsSync(filename)) {
                const hash = getHashOfFile(filename);
                const newHash = getHashOfContent(output);
                if (hash === newHash) {
                    return;
                }
            }
            fs.writeFileSync(filename, output);
            console.log("declaration file generated", config.declarationLibs);
        }, 250);

        // debounced();
        if (checkArgs("--watch")) {
            const watchSize: { [path: string]: number } = {};
            chokidar
                .watch(directoriesToWatch, {
                    ignoreInitial: false,
                    awaitWriteFinish: {
                        stabilityThreshold: 300,
                        pollInterval: 100,
                    },
                    alwaysStat: true,
                })
                .on("all", (e, p, stats) => {
                    if (stats) {
                        if (watchSize[p] === stats.size) {
                            return;
                        }
                        watchSize[p] = stats.size;
                    }
                    debounced();
                });
        } else {
            debounced();
        }
    });
}
