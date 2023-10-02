import type { IFlowGraphContextConfiguration } from "./flowGraphContext";
import { FlowGraphContext } from "./flowGraphContext";

/**
 * @experimental
 * This class represents the definition of a variable, with a name and
 * a default value. It can be used to create a context.
 */
export class FlowGraphVariableDefinitions {
    private _definitions: Map<string, any> = new Map<string, any>();

    public defineVariable(name: string, defaultValue: any) {
        this._definitions.set(name, defaultValue);
    }

    public generateContext(params: IFlowGraphContextConfiguration): FlowGraphContext {
        const context = new FlowGraphContext(params);
        this._definitions.forEach((value, key) => {
            context.setVariable(key, value);
        });
        return context;
    }

    public serialize(serializationObject: any) {
        this._definitions.forEach((value, key) => {
            serializationObject[key] = value;
        });
    }

    public parse(serializationObject: any) {
        this._definitions.clear();
        for (const key in serializationObject) {
            this._definitions.set(key, serializationObject[key]);
        }
    }
}
