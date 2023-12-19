import type { FlowGraphContext } from "./flowGraphContext";
import type { IPathToObjectConverter, IObjectInfo } from "../ObjectModel/objectModelInterfaces";
import type { IObjectAccessor } from "./typeDefinitions";

/**
 * @experimental
 * A path converter that converts a path on the flow graph context variables to an object accessor.
 */
export class FlowGraphPathConverter implements IPathToObjectConverter<IObjectAccessor> {
    constructor(
        public context: FlowGraphContext,
        public separator: string = "/"
    ) {}

    public convert(path: string): IObjectInfo<IObjectAccessor> {
        const parts = path.split(this.separator);
        if (parts.length < 2) {
            throw new Error(`Path ${path} is invalid`);
        }
        let currentObject = this.context.getVariable(parts[0]);
        const property = parts[parts.length - 1];
        for (let i = 1; i < parts.length - 1; i++) {
            currentObject = currentObject[parts[i]];
        }
        return {
            object: currentObject,
            info: {
                type: "object",
                get: () => currentObject[property],
                set: (value: any) => (currentObject[property] = value),
                getObject: () => currentObject,
            },
        };
    }
}
