import { FlowGraphContext } from "./flowGraphContext";

/**
 * This class represents the definition of a variable, with a name and
 * a default value. It can be used to create a context.
 */
export class FlowGraphVariableDefinitions {
    private _definitions: Map<string, any> = new Map<string, any>();

    public defineVariable(name: string, defaultValue: any) {
        this._definitions.set(name, defaultValue);
    }

    public getContext(): FlowGraphContext {
        const context = new FlowGraphContext();
        this._definitions.forEach((value, key) => {
            context.setVariable(key, value);
        });
        return context;
    }
}
