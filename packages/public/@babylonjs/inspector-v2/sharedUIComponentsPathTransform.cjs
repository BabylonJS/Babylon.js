const ts = require("typescript");
const path = require("path");

/**
 * Custom TypeScript transformer that converts shared-ui-components imports
 * to relative paths in declaration files only.
 *
 * NOTE: This is temporary. Once the new shared UI components are moved into a shared tooling package that we actually publish
 *       (e.g. @babylonjs/tools-core or something) it will just become another peer dependency.
 *
 * Transforms:
 *   "shared-ui-components/fluent/hoc/propertyLines/propertyLine"
 * To:
 *   "../../../../sharedUiComponents/src/fluent/hoc/propertyLines/propertyLine"
 */

function transformSharedUIComponentsPath(importPath, sourceFileName) {
    // Only transform imports that start with "shared-ui-components/"
    if (!importPath.startsWith("shared-ui-components/")) {
        return importPath;
    }

    // Remove the "shared-ui-components/" prefix and get the subpath
    const subPath = importPath.substring("shared-ui-components/".length);

    // The source file is in the dev directory structure like:
    // D:\Repos\Babylon.js-2\packages\dev\inspector-v2\src\components\properties\linkToEntityPropertyLine.tsx
    // But the declaration will be generated at:
    // lib/dev/inspector-v2/src/components/properties/linkToEntityPropertyLine.d.ts
    //
    // We need to calculate the relative path from the generated declaration file location
    // to lib/dev/sharedUiComponents/src/[subPath]

    // Extract the path structure after "dev/inspector-v2/"
    const inspectorPattern = /dev[\/\\]inspector-v2[\/\\](.+)/;
    const match = sourceFileName.match(inspectorPattern);

    if (!match) {
        // Fallback if pattern doesn't match
        return importPath;
    }

    // Get the relative path within inspector-v2 (e.g., "src/components/properties/file.tsx")
    const relativePath = match[1].replace(/\\/g, "/"); // Normalize to forward slashes

    // Count directory levels to calculate how many "../" we need
    // Remove the filename and count the remaining directory separators
    const dirPath = path.dirname(relativePath);
    const depth = dirPath === "." ? 0 : dirPath.split("/").length;

    // Generate the correct number of "../" to go back to lib/dev/ level
    const upLevels = "../".repeat(depth + 1); // +1 to get out of inspector-v2 directory

    const result = `${upLevels}sharedUiComponents/src/${subPath}`;

    return result;
}

function transformer(program, options) {
    return function (context) {
        return function (sourceFile) {
            function visitor(node) {
                // Handle import declarations
                if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
                    const importPath = node.moduleSpecifier.text;
                    const transformedPath = transformSharedUIComponentsPath(importPath, sourceFile.fileName);

                    if (transformedPath !== importPath) {
                        return ts.factory.updateImportDeclaration(node, node.modifiers, node.importClause, ts.factory.createStringLiteral(transformedPath), node.attributes);
                    }
                }

                // Handle export declarations
                if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
                    const importPath = node.moduleSpecifier.text;
                    const transformedPath = transformSharedUIComponentsPath(importPath, sourceFile.fileName);

                    if (transformedPath !== importPath) {
                        return ts.factory.updateExportDeclaration(
                            node,
                            node.modifiers,
                            node.isTypeOnly,
                            node.exportClause,
                            ts.factory.createStringLiteral(transformedPath),
                            node.attributes
                        );
                    }
                }

                // Handle import type nodes
                if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
                    const importPath = node.argument.literal.text;
                    const transformedPath = transformSharedUIComponentsPath(importPath, sourceFile.fileName);

                    if (transformedPath !== importPath) {
                        return ts.factory.updateImportTypeNode(
                            node,
                            ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral(transformedPath)),
                            node.qualifier,
                            node.typeArguments,
                            node.isTypeOf
                        );
                    }
                }

                return ts.visitEachChild(node, visitor, context);
            }

            return ts.visitNode(sourceFile, visitor);
        };
    };
}

Object.defineProperty(exports, "__esModule", { value: true });
exports.default = transformer;
