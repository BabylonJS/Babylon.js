import type { FlowGraphContext } from "./flowGraphContext";
import type { IPathToObjectConverter, IObjectInfo } from "../ObjectModel/objectModelInterfaces";
import type { IObjectAccessor } from "./typeDefinitions";

/**
 * @experimental
 * A path converter that converts a path on the flow graph context variables to an object accessor.
 */
export class FlowGraphPathConverter implements IPathToObjectConverter<IObjectAccessor> {
    public constructor(
        private _context: FlowGraphContext,
        private _separator: string = "/"
    ) {}

    public convert(path: string): IObjectInfo<IObjectAccessor> {
        const parts = path.split(this._separator);
        if (parts.length < 2) {
            throw new Error(`Path ${path} is invalid`);
        }
        let currentObject = this._context.getVariable(parts[0]);
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
