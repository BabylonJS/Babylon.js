import type { IObjectInfo, IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import { FlowGraphInteger } from "./CustomTypes/flowGraphInteger";
import { RichTypeFlowGraphInteger } from "./flowGraphRichTypes";
import type { IObjectAccessor } from "./typeDefinitions";

const PathHasTemplatesRegex = new RegExp(/\/\{(\w+)\}(?=\/|$)/g);

/**
 * @experimental
 * A component that converts a path to an object accessor.
 */
export class FlowGraphPathConverterComponent {
    /**
     * The templated inputs for the provided path.
     */
    public readonly templatedInputs: FlowGraphDataConnection<FlowGraphInteger>[] = [];
    public constructor(
        public path: string,
        public ownerBlock: FlowGraphBlock
    ) {
        let match = PathHasTemplatesRegex.exec(path);
        const templateSet = new Set<string>();
        while (match) {
            const [, matchGroup] = match;
            if (templateSet.has(matchGroup)) {
                throw new Error("Duplicate template variable detected.");
            }
            templateSet.add(matchGroup);
            this.templatedInputs.push(ownerBlock.registerDataInput(matchGroup, RichTypeFlowGraphInteger, new FlowGraphInteger(0)));
            match = PathHasTemplatesRegex.exec(path);
        }
    }

    /**
     * Get the accessor for the path.
     * @param pathConverter the path converter to use to convert the path to an object accessor.
     * @param context the context to use.
     * @returns the accessor for the path.
     * @throws if the value for a templated input is invalid.
     */
    public getAccessor(pathConverter: IPathToObjectConverter<IObjectAccessor>, context: FlowGraphContext): IObjectInfo<IObjectAccessor> {
        let finalPath = this.path;
        for (const templatedInput of this.templatedInputs) {
            const valueToReplace = templatedInput.getValue(context).value;
            if (typeof valueToReplace !== "number" || valueToReplace < 0) {
                throw new Error("Invalid value for templated input.");
            }
            finalPath = finalPath.replace(`{${templatedInput.name}}`, valueToReplace.toString());
        }
        return pathConverter.convert(finalPath);
    }
}
