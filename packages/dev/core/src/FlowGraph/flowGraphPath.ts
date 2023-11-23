import type { FlowGraphContext } from "./flowGraphContext";

export interface IFlowGraphPathAnimationConfig {}

const SEPARATORS = /\/|\./;
/*
 * This class represents a path of type /x/{y}/z/.../w that is evaluated
 * on a target object. The string between curly braces ({y} in the example)
 * is a special template string that is replaced during runtime.
 */
export class FlowGraphPath {
    private path: string;
    private templateSubstitutions: {
        [key: string]: number;
    } = {}; // this is a map of template strings to values that are substituted during runtime
    public hasTemplateStrings: boolean = false;

    constructor(path: string) {
        this.path = path;
        const templateStrings = this._getTemplateStringsInPath(path);
        this.hasTemplateStrings = templateStrings.length > 0;
        for (const templateString of templateStrings) {
            // Part of the path enclosed in curly braces = template string, we'll set a default
            // value on the template substitutions for now
            this.templateSubstitutions[templateString] = -1;
        }
    }

    getTemplateStrings(): string[] {
        return Object.keys(this.templateSubstitutions);
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
        this.templateSubstitutions[template] = value;
    }

    private _evaluateTemplates(): string {
        let finalPath = this.path.slice(0); // copy the path so we don't replace on it.
        for (const template in this.templateSubstitutions) {
            if (this.templateSubstitutions[template] === -1) {
                throw new Error(`Template string ${template} has no value`);
            }
            finalPath = finalPath.replace(`{${template}}`, this.templateSubstitutions[template].toString());
        }
        return finalPath;
    }

    private _evaluatePath(context: FlowGraphContext, setValue = false, value?: any): any {
        const finalPath = this._evaluateTemplates();
        const splitPath = finalPath.split(SEPARATORS).filter((part) => part !== "");
        let currentTarget = context._userVariables;
        for (let i = 0; i < (setValue ? splitPath.length - 1 : splitPath.length); i++) {
            if (currentTarget === undefined) {
                throw new Error(`Could not find path ${finalPath} in target context`);
            }
            const pathPart = splitPath[i];
            currentTarget = currentTarget[pathPart];
        }
        if (setValue) {
            currentTarget[splitPath[splitPath.length - 1]] = value;
            currentTarget = value;
        }
        return currentTarget;
    }

    getProperty(context: FlowGraphContext): any {
        return this._evaluatePath(context);
    }

    setProperty(context: FlowGraphContext, value: any) {
        this._evaluatePath(context, true, value);
    }

    animateProperty(context: FlowGraphContext, config: IFlowGraphPathAnimationConfig) {
        //const {from, to, value, easing, duration} = config;
        //todo
    }
}
