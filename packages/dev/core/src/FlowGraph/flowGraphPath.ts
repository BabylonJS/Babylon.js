import { RegisterClass } from "../Misc/typeStore";
import type { FlowGraphContext } from "./flowGraphContext";

// Path: /x/{y}/z/.../w
const PATH_REGEX = /([./])({?\w+}?)/g;

interface IPathPart {
    value: string;
    isTemplate: boolean;
    valueWithoutBraces: string;
    replacedValue?: string;
    separator: string;
}

/**
 * @experimental
 * An extension to add new functionality to path resolution
 */
export interface IPathExtension {
    shouldProcess(path: FlowGraphPath): boolean;
    processGet(path: FlowGraphPath, context: FlowGraphContext): any;
    processSet(path: FlowGraphPath, context: FlowGraphContext, value: any): void;
}

/*
 * @experimental
 * This class represents a path of type /x/{y}/z/.../w that is evaluated
 * on a target object. The string between curly braces ({y} in the example)
 * is a special template string that is replaced during runtime.
 */
export class FlowGraphPath {
    /**
     * Extensions that can be used to extend the functionality of the path.
     */
    static Extensions: IPathExtension[] = [];

    private _path: string;
    private _templateSubstitutions: {
        [key: string]: number;
    } = {}; // this is a map of template strings to values that are substituted during runtime
    private _pathParts: IPathPart[] = []; // this is the path divided into parts, with each part being either a template string or a regular string
    private _templateStrings: string[] = []; // this is the list of template strings in the path
    /**
     * Whether this path has any template strings in it.
     */
    public hasTemplateStrings: boolean = false;

    constructor(path: string) {
        this._path = path;
        const { pathParts, templateStrings } = this._getPathPartsAndTemplateStrings(path);
        this._pathParts = pathParts;
        this._templateStrings = templateStrings;
        this.hasTemplateStrings = templateStrings.length > 0;
    }

    private _getPathPartsAndTemplateStrings(path: string) {
        const allMatches = path.matchAll(PATH_REGEX);

        const pathParts = [];
        const templateStrings = [];
        let nextMatch = allMatches.next();
        while (!nextMatch.done) {
            const singleMatch = nextMatch.value;
            const [, separator, value] = singleMatch;
            let valueWithoutBraces = value;
            let isTemplate = false;
            if (value.startsWith("{") && value.endsWith("}")) {
                isTemplate = true;
                valueWithoutBraces = value.slice(1, value.length - 1);
                if (templateStrings.indexOf(valueWithoutBraces) === -1) {
                    templateStrings.push(valueWithoutBraces);
                }
            }
            pathParts.push({
                value,
                isTemplate,
                valueWithoutBraces,
                separator,
            });
            nextMatch = allMatches.next();
        }
        return { pathParts, templateStrings };
    }

    /**
     * Gets the template strings in this path.
     * @returns an array containing the template strings in this path.
     */
    getTemplateStrings(): string[] {
        return this._templateStrings;
    }

    setTemplateSubstitution(template: string, value: number) {
        if (this._templateStrings.indexOf(template) === -1) {
            throw new Error(`Template string ${template} does not exist in path ${this._path}`);
        }
        this._templateSubstitutions[template] = value;
    }

    private _evaluateTemplates() {
        for (const pathPart of this._pathParts) {
            if (pathPart.isTemplate) {
                const value = this._templateSubstitutions[pathPart.valueWithoutBraces];
                if (value === undefined) {
                    throw new Error(`Template string ${pathPart.value} was not substituted`);
                }
                pathPart.replacedValue = value.toString();
            }
        }
    }

    /**
     * Gets the final path after all template strings have been substituted.
     * @returns a string representing the final path.
     */
    public getFinalPath() {
        let finalPath = "";
        for (const pathPart of this._pathParts) {
            finalPath += pathPart.separator;
            if (pathPart.isTemplate) {
                finalPath += pathPart.replacedValue;
            } else {
                finalPath += pathPart.value;
            }
        }
        return finalPath;
    }

    /*
     * Breaks the path into a chain of entities, for example,
     * /x/y/z would be split into [context._userVariables.x, context._userVariables.x.y, context._userVariables.x.y.z],
     * and the path that was split, i.e. /x/y/z, would be split into ["x", "y", "z"].
     */
    private _evaluatePath(context: FlowGraphContext): { entityChain: any[]; splitPath: string[] } {
        this._evaluateTemplates();

        const entityChain = [];
        const splitPath = [];
        let currentTarget = context.userVariables;
        for (const pathPart of this._pathParts) {
            if (currentTarget === undefined) {
                throw new Error(`Could not find path ${this.getFinalPath()} in target context`);
            }
            const value = pathPart.isTemplate ? pathPart.replacedValue : pathPart.value;
            if (!value) {
                throw new Error(`Invalid path ${this.getFinalPath()}`);
            }
            currentTarget = currentTarget[value];
            entityChain.push(currentTarget);
            splitPath.push(value);
        }

        return { entityChain, splitPath };
    }

    getProperty(context: FlowGraphContext): any {
        for (const extension of FlowGraphPath.Extensions) {
            if (extension.shouldProcess(this)) {
                return extension.processGet(this, context);
            }
        }
        const { entityChain } = this._evaluatePath(context);
        return entityChain[entityChain.length - 1];
    }

    setProperty(context: FlowGraphContext, value: any) {
        for (const extension of FlowGraphPath.Extensions) {
            if (extension.shouldProcess(this)) {
                extension.processSet(this, context, value);
                return;
            }
        }
        const { entityChain, splitPath } = this._evaluatePath(context);
        const target = entityChain[entityChain.length - 2];
        const property = splitPath[splitPath.length - 1];
        target[property] = value;
    }

    getClassName() {
        return FlowGraphPath.ClassName;
    }

    serialize(serializationObject: any = {}) {
        serializationObject.path = this._path;
        serializationObject.className = this.getClassName();
        return serializationObject;
    }

    static Parse(serializationObject: any) {
        return new FlowGraphPath(serializationObject.path);
    }

    public static ClassName = "FGPath";
}
RegisterClass(FlowGraphPath.ClassName, FlowGraphPath);
