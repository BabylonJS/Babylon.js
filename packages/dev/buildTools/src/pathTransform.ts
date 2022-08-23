import * as ts from "typescript";
import * as path from "path";
import type { BuildType, PublicPackageVariable } from "./packageMapping";
import { getDevPackagesByBuildType, getPublicPackageName, isValidDevPackageName, declarationsOnlyPackages } from "./packageMapping";

const addJS = (to: string, forceAppend?: boolean | string): string => (forceAppend && !to.endsWith(".js") ? to + (forceAppend === true ? ".js" : forceAppend) : to);

/**
 * Transform the source location to the right location according to build type.
 * Used mainly for publishing and generating LTS versions.
 * The idea is to convert 'import { Something } from "location/something";' to 'import { Something } from "package/something";'
 * @param location the source's location
 * @param options
 * @param sourceFilename 
 */
export const transformPackageLocation = (location: string, options: ITransformerOptions, sourceFilename?: string) => {
    const directoryParts = location.split("/");
    const basePackage = directoryParts[0] === "@" ? `${directoryParts.shift()}/${directoryParts.shift()}` : directoryParts.shift();
    if (!basePackage || !isValidDevPackageName(basePackage, true) || declarationsOnlyPackages.indexOf(basePackage) !== -1) {
        return;
    }

    // local file?
    if (basePackage.startsWith(".")) {
        return addJS(location, options.appendJS);
    }

    const returnPackageVariable: PublicPackageVariable = getDevPackagesByBuildType(options.buildType)[basePackage];
    const returnPackage = getPublicPackageName(returnPackageVariable);
    // not found? probably an external library. return the same location
    if (!returnPackage) {
        return location;
    }
    if (returnPackage === options.basePackage) {
        if (options.keepDev) {
            return location;
        }
        let computedPath = "./" + directoryParts.join("/");
        if (sourceFilename) {
            const generatedIndex = sourceFilename.indexOf("generated");
            const srcIndex = sourceFilename.indexOf("src");
            if (generatedIndex !== -1) {
                computedPath = sourceFilename.substring(0, generatedIndex) + "generated/" + computedPath;
            } else if (srcIndex !== -1) {
                computedPath = sourceFilename.substring(0, srcIndex) + "src/" + computedPath;
            }
            computedPath = path.relative(path.dirname(sourceFilename), computedPath).split(path.sep).join(path.posix.sep);
            computedPath = computedPath[0] === "." ? computedPath : "./" + computedPath;
        }
        return addJS(computedPath, options.appendJS);
    } else {
        return addJS(options.packageOnly ? returnPackage : `${returnPackage}/${directoryParts.join("/")}`, options.appendJS);
    }
};

export type Transformer = Required<Pick<ts.CustomTransformers, "after" | "afterDeclarations">>;
export type TransformerNode = ts.Bundle | ts.SourceFile;

/**
 * Options to pass for the transform function
 */
export interface ITransformerOptions {
    /**
     * can be lts, esm, umd and es6
     */
    buildType: BuildType;
    /**
     * the current package being processed. Whether abstract (core, gui) or concrete (@babylonjs/core, babylonjs and so on)
     */
    basePackage: string;
    /**
     * do not return full path but only the package
     */
    packageOnly: boolean;
    /**
     * Should we append ".js" to the end of the import
     * can either be a boolean or the actual extension to add (like ".mjs")
     */
    appendJS?: boolean | string;

    keepDev?: boolean;
}

// inspired by https://github.com/OniVe/ts-transform-paths

export default function transformer(_program: ts.Program, options: ITransformerOptions): Transformer {
    function optionsFactory<T extends TransformerNode>(context: ts.TransformationContext): ts.Transformer<T> {
        return transformerFactory(context, options);
    }

    return {
        after: [optionsFactory],
        afterDeclarations: [optionsFactory],
    };
}

function chainBundle<T extends ts.SourceFile | ts.Bundle>(transformSourceFile: (x: ts.SourceFile) => ts.SourceFile): (x: T) => T {
    function transformBundle(node: ts.Bundle) {
        return ts.factory.createBundle(node.sourceFiles.map(transformSourceFile), node.prepends);
    }

    return function transformSourceFileOrBundle(node: T) {
        return ts.isSourceFile(node) ? (transformSourceFile(node) as T) : (transformBundle(node as ts.Bundle) as T);
    };
}

function isImportCall(node: ts.Node): node is ts.CallExpression {
    return ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;
}

export function transformerFactory<T extends TransformerNode>(context: ts.TransformationContext, options: ITransformerOptions): ts.Transformer<T> {
    // const aliasResolver = new AliasResolver(context.getCompilerOptions());
    function transformSourceFile(sourceFile: ts.SourceFile) {
        function getResolvedPathNode(node: ts.StringLiteral) {
            const resolvedPath = transformPackageLocation(/*sourceFile.fileName*/ node.text, options, sourceFile.fileName);
            return resolvedPath && resolvedPath !== node.text ? ts.factory.createStringLiteral(resolvedPath) : null;
        }

        function pathReplacer(node: ts.Node): ts.Node {
            if (ts.isStringLiteral(node)) {
                return getResolvedPathNode(node) || node;
            }
            return ts.visitEachChild(node, pathReplacer, context);
        }

        function visitor(node: ts.Node): ts.Node {
            /**
             * e.g.
             * - const x = require('path');
             * - const x = import('path');
             */
            if (isImportCall(node)) {
                return ts.visitEachChild(node, pathReplacer, context);
            }

            /**
             * e.g.
             * - type Foo = import('path').Foo;
             */
            if (ts.isImportTypeNode(node)) {
                return ts.visitEachChild(node, pathReplacer, context);
            }

            /**
             * e.g.
             * - import * as x from 'path';
             * - import { x } from 'path';
             */
            if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                return ts.visitEachChild(node, pathReplacer, context);
            }

            /**
             * e.g.
             * - export { x } from 'path';
             */
            if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                return ts.visitEachChild(node, pathReplacer, context);
            }

            return ts.visitEachChild(node, visitor, context);
        }

        return ts.visitEachChild(sourceFile, visitor, context);
    }

    return chainBundle(transformSourceFile);
}
