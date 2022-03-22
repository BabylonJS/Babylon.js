import * as glob from "glob";
import * as fs from "fs";
import * as path from "path";
import * as chokidar from "chokidar";

import { camelize, checkArgs, checkDirectorySync, debounce } from "./utils";
import type { BuildType, DevPackageName } from "./packageMapping";
import { getAllPackageMappingsByDevNames, getPackageMappingByDevName, getPublicPackageName, isValidDevPackageName } from "./packageMapping";

export interface IGenerateDeclarationConfig {
    devPackageName: DevPackageName;
    outputDirectory?: string;
    externals?: { [key: string]: string };
    hiddenConsts?: string[];
    namedExportPathsToExclude?: string;
    filename?: string;
    declarationLibs: string[];
    buildType?: BuildType;
}

function getModuleDeclaration(source: string, filename: string, config: IGenerateDeclarationConfig, buildType: BuildType = "umd") {
    const distPosition = filename.indexOf("/dist");
    const packageVariables = getPackageMappingByDevName(config.devPackageName);
    const moduleName = getPublicPackageName(packageVariables[buildType], undefined, filename) + filename.substring(distPosition + 5).replace(".d.ts", "");
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
                    line = line.startsWith("    ") ? "    //" + line.substr(3) : "// " + line;
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
                            Object.keys(mapping).forEach((devPackageName) => {
                                if (match[1].startsWith(devPackageName)) {
                                    line = line.replace(
                                        match[1],
                                        getPublicPackageName(mapping[devPackageName as DevPackageName][buildType], undefined, match[1]) + match[1].substr(devPackageName.length)
                                    );
                                }
                            });
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
    processedLines = processedLines.replace(/export declare /g, "export ");
    return `declare module "${moduleName}" {
${processedLines}
}
`;
}

/**
 *
 * @param source - the source code of the file
 * @returns an array of objects with alias, realClassName and package
 */
function getClassesMap(source: string) {
    const regex = /import {(.*)} from ['"](.*)['"];/g;
    let matches = regex.exec(source);
    const mappingArray: {
        alias: string;
        realClassName: string;
        devPackageName: DevPackageName;
        fullPath: string;
    }[] = [];
    while (matches !== null) {
        const classes = matches[1].split(",");
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
            const devPackageName = matches[2]!.split("/")[0];
            if (alias !== realClassName) {
                console.log(alias, realClassName, devPackageName, matches[2]);
            }
            // only internals
            if (isValidDevPackageName(devPackageName)) {
                mappingArray.push({
                    alias,
                    realClassName,
                    devPackageName,
                    fullPath: matches[2]!,
                });
            }
        });
        matches = regex.exec(source);
    }
    return mappingArray;
}

function getPackageDeclaration(
    source: string,
    sourceFilePath: string,
    classesMappingArray: {
        alias: string;
        realClassName: string;
        devPackageName: DevPackageName;
        fullPath: string;
    }[],
    devPackageName: DevPackageName
) {
    const lines = source.split("\n");
    let i = 0;
    let lastWhitespace = "";
    let removeNext = false;
    const packageMapping = getPackageMappingByDevName(devPackageName);
    const defaultModuleName = getPublicPackageName(packageMapping.namespace);
    const thisFileModuleName = getPublicPackageName(packageMapping.namespace /*, undefined, sourceFilePath*/);
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
    classesMappingArray.forEach((classMapping: { alias: string; realClassName: string; devPackageName: DevPackageName; fullPath: string }) => {
        const { alias, realClassName, devPackageName, fullPath } = classMapping;
        const namespace = getPublicPackageName(getPackageMappingByDevName(devPackageName).namespace, undefined, fullPath);
        const matchRegex = new RegExp(`([ <])(${alias})([^\\w])`, "g");
        processedSource = processedSource.replace(matchRegex, `$1${namespace}.${realClassName}$3`);
    });

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

export function generateCombinedDeclaration(declarationFiles: string[], config: IGenerateDeclarationConfig, loseDeclarations: string[] = [], buildType: BuildType = "umd") {
    let declarations = "";
    let moduleDeclaration = "";
    for (const fileName in declarationFiles) {
        const declarationFile = declarationFiles[fileName];
        // The lines of the files now come as a Function inside declaration file.
        const data = fs.readFileSync(declarationFile, "utf8");
        moduleDeclaration += getModuleDeclaration(data, declarationFile, config, config.buildType);
        if (declarationFile.indexOf("legacy.d.ts") !== -1) {
            continue;
        }
        declarations += getPackageDeclaration(data, declarationFile, getClassesMap(data), config.devPackageName);
    }
    const loseDeclarationsString = loseDeclarations
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
    const output = `
${moduleDeclaration}
declare module "${packageName}" {
    export * from "${packageName}/${legacy ? legacy[1] : "index"}";
}

${
    buildType === "umd"
        ? `
declare module ${defaultModuleName} {
    ${declarations}
}
`
        : ""
}
${loseDeclarationsString}
`;
    return output;
}

export function generateDeclaration() {
    const configFilePath = checkArgs("--config") as string;
    if (!configFilePath) {
        throw new Error("--config path to config file is required");
    }
    const asJSON = checkArgs("--json", true) as boolean;
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
        const files = config.declarationLibs.map((lib: string) => {
            // load the declarations from the root directory of the requested lib
            const p = path.join(__dirname, "../../../", `/${camelize(lib).replace(/@/g, "")}/dist/**/*.d.ts`);
            return glob.sync(p);
        });

        // check if there are .d.ts files in LibDeclaration in the source directory
        const decFiles = config.declarationLibs.map((lib: string) => {
            // load the declarations from the root directory of the requested lib
            const p = path.join(__dirname, "../../../", `/${camelize(lib).replace(/@/g, "")}/**/LibDeclarations/**/*.d.ts`);
            return glob.sync(p);
        });

        const debounced = debounce(() => {
            const output = generateCombinedDeclaration(files.flat(), config, decFiles.flat(), config.buildType);
            fs.writeFileSync(`${outputDir}/${config.filename || "index.d.ts"}`, output);
            console.log("declaration file generated", config.declarationLibs);
        }, 200);

        debounced();
        if (checkArgs("--watch")) {
            chokidar.watch(files.flat(), { ignoreInitial: true, awaitWriteFinish: true }).on("all", () => {
                debounced();
            });
        }
    });
}
