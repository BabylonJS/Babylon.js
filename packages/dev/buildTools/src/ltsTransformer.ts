/* eslint-disable no-console */
import * as path from "path";
import * as ts from "typescript";
import * as fs from "fs";
import * as glob from "glob";
import * as chokidar from "chokidar";

import { removeDir, checkDirectorySync, checkArgs, copyFile } from "./utils.js";
import { transformPackageLocation } from "./pathTransform.js";
import { getPackageMappingByDevName, getPublicPackageName, isValidDevPackageName } from "./packageMapping.js";

const printer = ts.createPrinter();

// the function that processes the file
const processSourceFile = (packageName: string, relativeLTSFile: any, program: { getSourceFile: (arg0: any) => any }, checker: { getSymbolAtLocation: (arg0: any) => any }) => {
    console.log(`Processing ${relativeLTSFile}...`);
    const ltsFile = path.resolve(relativeLTSFile);
    const sourceFile = path.resolve(ltsFile.replace("lts", "dev"));
    const relativeToSource = path.relative(path.dirname(ltsFile), "./src");
    const srcFileExists = fs.existsSync(sourceFile);
    const source = program.getSourceFile(sourceFile);
    const sourceLTS = program.getSourceFile(ltsFile);

    const importedSource: any[] = [];
    let inLTS = false;
    const ltsTransformer = (context: any) => {
        function visit(node: ts.Node | undefined): ts.Node | undefined {
            if (!node) {
                return;
            }
            node = ts.visitEachChild(node, visit, context);
            if (!inLTS) {
                // get all exported elements
                const exported = ts.canHaveModifiers(node) && ts.getModifiers(node)?.find((m: { kind: any }) => m.kind === ts.SyntaxKind.ExportKeyword);
                // const exported2 = node.modifiers && node.modifiers.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
                if (exported) {
                    // find the first identifier (name of class/function/enum)
                    const found = node.getChildren().find((c: { kind: any }) => c.kind === ts.SyntaxKind.Identifier);
                    if (found) {
                        // console.log(found.getText());
                        importedSource.push(found.getText());
                    } else {
                        // check for declarations
                        const found3 = node.getChildren().find((c: { kind: any }) => c.kind === ts.SyntaxKind.VariableDeclarationList) as ts.VariableDeclarationList;
                        if (found3 && (found3 as ts.VariableDeclarationList).declarations) {
                            const foundIdentifier = found3.declarations[0].getChildren().find((c: { kind: any }) => c.kind === ts.SyntaxKind.Identifier) as ts.Identifier;
                            importedSource.push(foundIdentifier.getText());
                        }
                    }
                } else if (ts.isImportSpecifier(node)) {
                    importedSource.push(node.getText());
                    // } else if (ts.isImportTypeNode(node)) {
                    //     const found = node.getChildren().find((c) => c.kind === ts.SyntaxKind.Identifier);
                    //     if (found) {
                    //         // console.log(found.getText());
                    //         importedSource.push(found.getText());
                    //     }
                } else if (ts.isTypeAliasDeclaration(node)) {
                    const symbol = checker.getSymbolAtLocation(node.name);
                    importedSource.push(symbol.getName());
                }
            }
            if (inLTS) {
                // is it an import declaration?
                if (ts.isImportDeclaration(node)) {
                    // check import clause
                    const clause = node.importClause;
                    const leftImports: any[] = [];
                    // check if there are needed imports
                    if (clause && clause.namedBindings && clause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
                        const imports = clause.namedBindings.elements;
                        const leftOvers = imports.filter((i) => !importedSource.includes(i.getText()));
                        // const empty = imports.every((i) => importedSource.includes(i.getText()));
                        if (leftOvers.length === 0) {
                            // remove this import clause, it is empty.
                            return;
                        } else {
                            leftOvers.forEach((i) => {
                                leftImports.push(ts.factory.updateImportSpecifier(i, false, i.propertyName, i.name));
                            });
                        }
                    }
                    const transformed = transformLocation(packageName, (node.moduleSpecifier as any).text); // TODO any is still needed
                    // check if we are loading from the same source
                    if (!transformed) {
                        return node;
                    }
                    if (clause && clause.namedBindings && clause.namedBindings.kind === ts.SyntaxKind.NamedImports) {
                        // update the import declaration
                        const newClause = ts.factory.updateImportClause(clause, clause.isTypeOnly, clause.name, ts.factory.createNamedImports(leftImports));
                        return ts.factory.updateImportDeclaration(node, node.modifiers, newClause, ts.factory.createStringLiteral(transformed), node.assertClause);
                    } else {
                        return ts.factory.updateImportDeclaration(node, node.modifiers, node.importClause, ts.factory.createStringLiteral(transformed), node.assertClause); // TODO what is the assert clause?
                    }
                } else if (ts.isExportDeclaration(node)) {
                    // check import clause
                    const clause = node.exportClause;
                    if (!node.moduleSpecifier) {
                        return node;
                    }
                    const transformed = transformLocation(packageName, (node.moduleSpecifier as any).text); // TODO any is still needed
                    // check if we are loading from the same source
                    if (!transformed) {
                        return node;
                    }
                    // update the import declaration
                    // const newClause = ts.factory.updateExport(clause, clause.isTypeOnly, clause.name, ts.factory.createNamedImports(leftImports));
                    return ts.factory.updateExportDeclaration(node, node.modifiers, false, clause, ts.factory.createStringLiteral(transformed), undefined); // TODO what is the assert clause?
                } else if (ts.isModuleDeclaration(node)) {
                    const symbol = checker.getSymbolAtLocation(node.name);
                    // is it a module declaration of a file and not an actual module (i.e. 'declare module "./scene"')
                    if (
                        symbol.getName().includes('"') ||
                        symbol.getName().includes("'") ||
                        (ts.canHaveDecorators(node) && ts.getDecorators(node)?.find((c: { kind: any }) => c.kind === ts.SyntaxKind.DeclareKeyword))
                    ) {
                        const transformed = transformLocation(packageName, node.name.text, true);
                        if (transformed) {
                            const literal = ts.factory.createStringLiteral(transformed);
                            return ts.factory.updateModuleDeclaration(node, node.modifiers, literal, node.body);
                        }
                    }
                } else if (ts.isImportTypeNode(node)) {
                    const transformedText = transformLocation(packageName, ((node.argument as ts.LiteralTypeNode).literal as any).text /* TODO any is needed... */);
                    if (transformedText) {
                        // if it is an import type (for type aliases) apply the new transformed location
                        const newArgument = ts.factory.updateLiteralTypeNode(node.argument as ts.LiteralTypeNode, ts.factory.createStringLiteral(transformedText, true));
                        return ts.factory.updateImportTypeNode(node, newArgument, node.assertions, node.qualifier, node.typeArguments, node.isTypeOf);
                    }
                } else if (ts.isTypeAliasDeclaration(node)) {
                    // check if the type alias is already declared in the original source file
                    const symbol = checker.getSymbolAtLocation(node.name);
                    if (importedSource.includes(symbol.getName())) {
                        return;
                    }
                }
            }
            return node;
        }

        return (node: any) => ts.visitNode(node, visit);
    };

    const transformLocation = (packageName: string, sourceLocation: any, relativeSourceOnly?: boolean) => {
        const transformed = transformPackageLocation(sourceLocation, {
            basePackage: packageName,
            buildType: "es6", // TODO - was LTS!
            packageOnly: false,
        });
        if (!transformed) {
            console.log("Error transforming location: " + sourceLocation);
            return;
        }
        // get the relative directory
        const relativeLocation = relativeToSource ? transformed.replace(/^.\//g, relativeToSource + "/") : transformed;
        if (relativeSourceOnly) {
            return relativeLocation;
        }
        // from relative to absolute to relative to unix style! FTW :-)
        const abs = path.join(path.dirname(sourceFile), relativeLocation);
        let resolved = path.relative(path.dirname(sourceFile), abs);
        resolved = resolved[0] === "." ? resolved : "./" + resolved;
        // return unix-style relative path of the source location
        return resolved.split(path.sep).join(path.posix.sep);
    };
    const newLocation = ltsFile.replace("src", "generated");
    if (srcFileExists) {
        // Run source file through the transformer
        const result = ts.transform(source, [ltsTransformer]);
        inLTS = true;
        // run the LTS file through the transformer
        const resultLTS = ts.transform(sourceLTS, [ltsTransformer]);

        // generate the LTS source that will be added to the original source
        const ltsVersion = printer.printFile(resultLTS.transformed[0]);
        // save the LTS source to the generated folder
        checkDirectorySync(path.dirname(newLocation));
        fs.writeFileSync(
            path.resolve(newLocation),
            `${printer.printFile(result.transformed[0])}
    ${ltsVersion}`
        );
    } else {
        console.log(ltsFile, "no corresponding file in base package. copying.");
        inLTS = true;
        // run the LTS file through the transformer
        const resultLTS = ts.transform(sourceLTS, [ltsTransformer]);

        // generate the LTS source that will be added to the original source
        const ltsVersion = printer.printFile(resultLTS.transformed[0]);
        // save the LTS source to the generated folder
        checkDirectorySync(path.dirname(newLocation));
        fs.writeFileSync(path.resolve(newLocation), `${ltsVersion}`);
    }
    console.log(`LTS source saved to ${newLocation}`);
};

export const transformLtsCommand = () => {
    const baseDir = path.basename(path.resolve("."));
    const sourceBaseDir = `./../../dev/${baseDir}/src`;

    // all LTS source files
    const sourceFiles = glob.sync("./src/**/*.ts");
    // all original sources
    const baseSources = glob.sync(`${sourceBaseDir}/**/*.ts`);
    const sourceToGenerated = (filePath: any, silent?: boolean) => {
        // check if not in base sources
        const relative = path.relative(sourceBaseDir, filePath);
        const newLocation = path.resolve("./generated", relative);
        const srcLocation = path.resolve("./src", relative);
        if (!fs.existsSync(srcLocation)) {
            copyFile(filePath, newLocation, silent);
            return true;
        }
        return false;
    };
    // the project directory we are working in
    // const baseDir = path.basename(path.resolve("."));
    if (!isValidDevPackageName(baseDir)) {
        return;
    }
    const packages = getPackageMappingByDevName(baseDir);
    const packageName = getPublicPackageName(packages.es6);

    // TODO - setting these variables here will force us to restart the watch if a new file was added.
    // This should be inside the watch function as well, but then it'll take a long time to process.
    // TODO - check if it is quicker to only keep the base sources that will be processed.
    const program = ts.createProgram([...sourceFiles, ...baseSources], {});
    const checker = program.getTypeChecker();
    console.log(`Generating LTS sources for ${baseDir}`);
    removeDir("./generated");
    // copy all original sources to the generated folder. If they have an LTS file it will be overwritten
    baseSources.forEach((src) => sourceToGenerated(src, true));
    // run the LTS transforming
    sourceFiles.forEach((file: string) => {
        processSourceFile(packageName, file, program, checker);
    });

    if (checkArgs("--watch")) {
        chokidar.watch(baseSources, { ignoreInitial: true, awaitWriteFinish: true }).on("all", (_event: string, filePath: any) => {
            const copied = sourceToGenerated(filePath, false);
            // is this file in the lts version?
            if (!copied && _event !== "add") {
                const relative = path.relative(sourceBaseDir, filePath);
                const srcLocation = path.relative("./", path.resolve("./src", relative));
                processSourceFile(packageName, srcLocation, program, checker);
            }
        });
        // TODO: check why this is executed 3 times
        chokidar.watch(sourceFiles, { ignoreInitial: true, awaitWriteFinish: true }).on("all", (_event: any, filePath: any) => {
            processSourceFile(packageName, filePath, program, checker);
        });
    }
};
