import { type FlowGraphContext } from "./flowGraphContext";
import { type IPathToObjectConverter, type IObjectInfo } from "../ObjectModel/objectModelInterfaces";
import { type IObjectAccessor } from "./typeDefinitions";

/**
 * @deprecated Avoid using this on the flow-graph (glTF only)
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

        const root = parts[0];
        if (root === "__proto__" || root === "prototype" || root === "constructor") {
            throw new Error(`Path ${path} is invalid`);
        }
        let currentObject = this._context.getVariable(root);
        const property = parts[parts.length - 1];
        for (let i = 1; i < parts.length - 1; i++) {
            const part = parts[i];
            if (part === "__proto__" || part === "prototype" || part === "constructor") {
                throw new Error(`Path ${path} is invalid`);
            }
            currentObject = currentObject[part];
        }
        if (property === "__proto__" || property === "prototype" || property === "constructor") {
            throw new Error(`Path ${path} is invalid`);
        }
        return {
            object: currentObject,
            info: {
                type: "object",
                get: () => currentObject[property],
                set: (value: any) => (currentObject[property] = value),
                getTarget: () => currentObject,
                getPropertyName: [() => property],
            },
        };
    }
}
