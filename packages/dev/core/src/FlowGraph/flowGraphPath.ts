/*
 * This class represents a path of type /x/{y}/z/.../w that is evaluated
 * on a target object. The string between curly braces ({y} in the example)
 * is a special template string that is replaced during runtime.
 * Possible issue: serializing this structure? it would have to serialize the target too
 */
export class FlowGraphPath {
    path: string;
    // todo: use context instead!
    target: any; // target should be an object where the path is evaluated
    separator: string = "/"; // the separator between path parts
    templateSubstitutions: {
        [key: string]: any;
    } = {}; // this is a map of template strings to values that are substituted during runtime

    addTemplateSubstitution(template: string, value: any) {
        this.templateSubstitutions[template] = value;
    }

    _evaluateTemplates(): string {
        let finalPath = this.path.slice(0); // copy the path so we don't replace on it?
        for (const template in this.templateSubstitutions) {
            finalPath = finalPath.replace(`{${template}}`, this.templateSubstitutions[template]);
        }
        // Should we check here if there is any unsubstituted template left and
        // throw an error/return something?
        return finalPath;
    }

    _evaluatePath(setValue = false, value?: any): any {
        const finalPath = this._evaluateTemplates();
        const splitPath = finalPath.split(this.separator).filter((part) => part !== "");
        let currentTarget = this.target;
        for (let i = 0; i < (setValue ? splitPath.length - 1 : splitPath.length); i++) {
            if (currentTarget === undefined) {
                throw new Error(`Could not find path ${finalPath} in target object`);
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

    getProperty(): any {
        return this._evaluatePath();
    }

    setProperty(value: any) {
        this._evaluatePath(true, value);
    }

    animateProperty(animationParams: {}) {}

    startAnimation() {
        // get gltf animation
        // get the corresponding babylon animation
    }
}
