import * as ts from "typescript";
import * as path from "path";
import * as fs from "fs";
import type { BuildType, PublicPackageVariable } from "./packageMapping.js";
import { getDevPackagesByBuildType, getPublicPackageName, isValidDevPackageName, declarationsOnlyPackages } from "./packageMapping.js";

const addJS = (to: string, forceAppend?: boolean | string): string => (forceAppend && !to.endsWith(".js") ? to + (forceAppend === true ? ".js" : forceAppend) : to);

// This function was adjusted for generated/src process
const getPathForComputed = (computedPath: string, sourceFilename: string) => {
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
const getRelativePath = (computedPath: string, sourceFilename: string) => {
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
export const transformPackageLocation = (location: string, options: ITransformerOptions, sourceFilename?: string) => {
    const directoryParts = location.split("/");
    const basePackage = directoryParts[0] === "@" ? `${directoryParts.shift()}/${directoryParts.shift()}` : directoryParts.shift();
    if (basePackage === "tslib" && sourceFilename && options.buildType === "es6") {
        let computedPath = "./tslib.es6.js";
        const result = getPathForComputed(computedPath, sourceFilename);
        if (options.basePackage === "@babylonjs/core") {
            storeTsLib();
            computedPath = getRelativePath(result, sourceFilename);
        } else {
            computedPath = "@babylonjs/core/tslib.es6";
        }
        return addJS(computedPath, options.appendJS);
    }
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
            const result = getPathForComputed(computedPath, sourceFilename);
            computedPath = getRelativePath(result, sourceFilename);
        }
        return addJS(computedPath, options.appendJS);
    } else {
        return addJS(options.packageOnly ? returnPackage : `${returnPackage}/${directoryParts.join("/")}`, options.appendJS);
    }
};

type TransformerNode = ts.Bundle | ts.SourceFile;

/**
 * Options to pass for the transform function
 */
interface ITransformerOptions {
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

export default function transformer(_program: ts.Program, options: ITransformerOptions) {
    function optionsFactory<T extends TransformerNode>(context: ts.TransformationContext): ts.Transformer<T> {
        return transformerFactory(context, options);
    }

    return optionsFactory;
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

function transformerFactory<T extends TransformerNode>(context: ts.TransformationContext, options: ITransformerOptions): ts.Transformer<T> {
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

export const storeTsLib = () => {
    const tsLibPath = path.resolve(path.resolve(".", "tslib.es6.js"));
    if (!fs.existsSync(tsLibPath)) {
        fs.writeFileSync(tsLibPath, tslibContent);
    }
};

// tslib 2.4.0
const tslibContent = `
/******************************************************************************
Copyright (c) Microsoft Corporation.
Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

export function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

export var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

export function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

export function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

export function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

export function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

export function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

export function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

export var __createBinding = Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
});

export function __exportStar(m, o) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

export function __values(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

export function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

/** @deprecated */
export function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

/** @deprecated */
export function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

export function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

export function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

export function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

export function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

export function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

export function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
};

export function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
}

export function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}

export function __classPrivateFieldGet(receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

export function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

export function __classPrivateFieldIn(state, receiver) {
    if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
    return typeof state === "function" ? receiver === state : state.has(receiver);
}
`;
