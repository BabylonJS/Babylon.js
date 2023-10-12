import type { IFlowGraphContextConfiguration } from "./flowGraphContext";
import { FlowGraphContext } from "./flowGraphContext";

/**
 * @experimental
 * This class represents the definition of a variable, with a name and
 * a default value. It can be used to create a context.
 */
export class FlowGraphVariableDefinitions {
    private _definitions: Map<string, any> = new Map<string, any>();

    /**
     * Defines a variable
     * @param name
     * @param defaultValue
     */
    public defineVariable(name: string, defaultValue: any) {
        this._definitions.set(name, defaultValue);
    }

    /**
     * Generate a context object from the definitions
     * @param params
     * @returns
     */
    public generateContext(params: IFlowGraphContextConfiguration): FlowGraphContext {
        const context = new FlowGraphContext(params);
        this._definitions.forEach((value, key) => {
            context.setVariable(key, value);
        });
        return context;
    }

    /**
     * Serializes the definitions
     * @param serializationObject
     */
    public serialize(serializationObject: any) {
        this._definitions.forEach((value, key) => {
            serializationObject[key] = value;
        });
    }

    /**
     * Deserialize definitions to this object
     * @param serializationObject
     */
    public deserialize(serializationObject: any) {
        this._definitions.clear();
        for (const key in serializationObject) {
            this._definitions.set(key, serializationObject[key]);
        }
    }
}
