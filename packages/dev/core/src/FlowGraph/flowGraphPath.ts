import { RegisterClass } from "../Misc/typeStore";
import type { FlowGraphContext } from "./flowGraphContext";

const SEPARATORS = /\/|\./;
/*
 * This class represents a path of type /x/{y}/z/.../w that is evaluated
 * on a target object. The string between curly braces ({y} in the example)
 * is a special template string that is replaced during runtime.
 */
export class FlowGraphPath {
    private _path: string;
    private _templateSubstitutions: {
        [key: string]: number;
    } = {}; // this is a map of template strings to values that are substituted during runtime
    public hasTemplateStrings: boolean = false;

    constructor(path: string) {
        this._path = path;
        const templateStrings = this._getTemplateStringsInPath(path);
        this.hasTemplateStrings = templateStrings.length > 0;
        for (const templateString of templateStrings) {
            // Part of the path enclosed in curly braces = template string, we'll set a default
            // value on the template substitutions for now
            this._templateSubstitutions[templateString] = NaN;
        }
    }

    getTemplateStrings(): string[] {
        return Object.keys(this._templateSubstitutions);
    }

    private _getTemplateStringsInPath(path: string): string[] {
        const splitPath = path.split(SEPARATORS).filter((part) => part !== "");
        const templateStrings: string[] = [];
        for (const partPath of splitPath) {
            if (partPath.startsWith("{") && partPath.endsWith("}")) {
                templateStrings.push(partPath.slice(1, partPath.length - 1));
            }
        }
        return templateStrings;
    }

    setTemplateSubstitution(template: string, value: number) {
        this._templateSubstitutions[template] = value;
    }

    private _evaluateTemplates(): string {
        let finalPath = this._path.slice(0); // copy the path so we don't replace on it.
        for (const template in this._templateSubstitutions) {
            if (Number.isNaN(this._templateSubstitutions[template])) {
                throw new Error(`Template string ${template} has no value`);
            }
            finalPath = finalPath.replace(`{${template}}`, this._templateSubstitutions[template].toString());
        }
        return finalPath;
    }

    /*
     * Breaks the path into a chain of entities, for example,
     * /x/y/z would be split into [context._userVariables.x, context._userVariables.x.y, context._userVariables.x.y.z]
     */
    private _evaluatePath(context: FlowGraphContext): any {
        const finalPath = this._evaluateTemplates();
        const splitPath = finalPath.split(SEPARATORS).filter((part) => part !== "");
        const entityChain = [];
        let currentTarget = context._userVariables;
        for (let i = 0; i < splitPath.length; i++) {
            if (currentTarget === undefined) {
                throw new Error(`Could not find path ${finalPath} in target context`);
            }
            const pathPart = splitPath[i];
            currentTarget = currentTarget[pathPart];
            entityChain.push(currentTarget);
        }

        return { entityChain, splitPath };
    }

    getProperty(context: FlowGraphContext): any {
        const { entityChain } = this._evaluatePath(context);
        return entityChain[entityChain.length - 1];
    }

    setProperty(context: FlowGraphContext, value: any) {
        const { entityChain, splitPath } = this._evaluatePath(context);
        const target = entityChain[entityChain.length - 2];
        const property = splitPath[splitPath.length - 1];
        target[property] = value;
    }

    getClassName() {
        return "FGPath";
    }

    serialize(serializationObject: any = {}) {
        serializationObject.path = this._path;
        serializationObject.className = this.getClassName();
        return serializationObject;
    }

    Parse(serializationObject: any) {
        return new FlowGraphPath(serializationObject.path);
    }
}
RegisterClass("FGPath", FlowGraphPath);
