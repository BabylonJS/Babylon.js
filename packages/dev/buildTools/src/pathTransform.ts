import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import {
    type BuildType,
    type PublicPackageVariable,
    getDevPackagesByBuildType,
    getPublicPackageName,
    isValidDevPackageName,
    declarationsOnlyPackages,
    bundledESPackages,
} from "./packageMapping.js";

const AddJS = (to: string, forceAppend?: boolean | string): string => (forceAppend && !to.endsWith(".js") ? to + (forceAppend === true ? ".js" : forceAppend) : to);

// This function was adjusted for generated/src process
const GetPathForComputed = (computedPath: string, sourceFilename: string) => {
    let p = computedPath;
    const generatedIndex = sourceFilename.indexOf("src");
    const srcIndex = sourceFilename.indexOf("src");
    if (generatedIndex !== -1) {
        p = sourceFilename.substring(0, generatedIndex) + "src/" + p;
    } else if (srcIndex !== -1) {
        p = p.substring(0, srcIndex) + "src/" + p;
    }
    return p;
};
const GetRelativePath = (computedPath: string, sourceFilename: string) => {
    let p = path.relative(path.dirname(sourceFilename), computedPath).split(path.sep).join(path.posix.sep);
    p = p[0] === "." ? p : "./" + p;
    return p;
};
/**
 * Transform the source location to the right location according to build type.
 * Used mainly for publishing and generating LTS versions.
 * The idea is to convert 'import { Something } from "location/something";' to 'import { Something } from "package/something";'
 * @param location the source's location
 * @param options the transformer options
 * @param sourceFilename the optional source filename
 * @returns the new location
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const transformPackageLocation = (location: string, options: ITransformerOptions, sourceFilename?: string) => {
    const directoryParts = location.split("/");
    const basePackage = directoryParts[0] === "@" ? `${directoryParts.shift()}/${directoryParts.shift()}` : directoryParts.shift();
    if (basePackage === "tslib" && sourceFilename && options.buildType === "es6") {
        let computedPath = "./tslib.es6.js";
        const result = GetPathForComputed(computedPath, sourceFilename);
        if (options.basePackage === "@babylonjs/core") {
            storeTsLib();
            computedPath = GetRelativePath(result, sourceFilename);
        } else {
            computedPath = "@babylonjs/core/tslib.es6";
        }
        return AddJS(computedPath, options.appendJS);
    }
    if (!basePackage || !isValidDevPackageName(basePackage) || declarationsOnlyPackages.indexOf(basePackage) !== -1) {
        return;
    }

    // local file?
    if (basePackage.startsWith(".")) {
        return AddJS(location, options.appendJS);
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
            const result = GetPathForComputed(computedPath, sourceFilename);
            computedPath = GetRelativePath(result, sourceFilename);
        }
        return AddJS(computedPath, options.appendJS);
    } else {
        if (directoryParts.length === 0) {
            // Do not add .js to imports that reference the root of a package
            return returnPackage;
        }
        // For bundled packages, always return just the package name without sub-paths
        if (bundledESPackages.indexOf(basePackage) !== -1) {
            return returnPackage;
        }
        return AddJS(options.packageOnly ? returnPackage : `${returnPackage}/${directoryParts.join("/")}`, options.appendJS);
    }
};

type TransformerNode = ts.Bundle | ts.SourceFile;

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

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function transformer(_program: ts.Program, options: ITransformerOptions) {
    function optionsFactory<T extends TransformerNode>(context: ts.TransformationContext): ts.Transformer<T> {
        return TransformerFactory(context, options);
    }

    return optionsFactory;
}

function ChainBundle<T extends ts.SourceFile | ts.Bundle>(transformSourceFile: (x: ts.SourceFile) => ts.SourceFile): (x: T) => T {
    function transformBundle(node: ts.Bundle) {
        return ts.factory.createBundle(node.sourceFiles.map(transformSourceFile));
    }

    return function transformSourceFileOrBundle(node: T) {
        return ts.isSourceFile(node) ? (transformSourceFile(node) as T) : (transformBundle(node) as T);
    };
}

function IsImportCall(node: ts.Node): node is ts.CallExpression {
    return ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;
}

function TransformerFactory<T extends TransformerNode>(context: ts.TransformationContext, options: ITransformerOptions): ts.Transformer<T> {
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
            // Skip type literals - they can't contain dynamic imports and their
            // get/set accessor signatures cause lexical environment issues in TS 5.9
            if (ts.isTypeLiteralNode(node)) {
                return node;
            }
            return ts.visitEachChild(node, pathReplacer, context);
        }

        function visitor(node: ts.Node): ts.Node {
            /**
             * e.g.
             * - const x = require('path');
             * - const x = import('path');
             */
            if (IsImportCall(node)) {
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

            /**
             * e.g.
             * - declare module "core/path";
             */
            if (ts.isModuleDeclaration(node)) {
                return ts.visitEachChild(node, pathReplacer, context);
            }

            // Skip type literals - they can't contain dynamic imports and their
            // get/set accessor signatures cause lexical environment issues in TS 5.9
            if (ts.isTypeLiteralNode(node)) {
                return node;
            }

            return ts.visitEachChild(node, visitor, context);
        }

        return ts.visitEachChild(sourceFile, visitor, context);
    }

    return ChainBundle(transformSourceFile);
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const storeTsLib = () => {
    const tsLibPath = path.resolve(path.resolve(".", "tslib.es6.js"));
    if (!fs.existsSync(tsLibPath)) {
        // Read from the installed tslib package instead of using a hardcoded copy,
        // so that the helpers stay in sync with the TypeScript version.
        const tslibSource = require.resolve("tslib/tslib.es6.mjs");
        fs.copyFileSync(tslibSource, tsLibPath);
    }
};
