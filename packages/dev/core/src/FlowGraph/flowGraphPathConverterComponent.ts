import type { IObjectInfo, IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { FlowGraphInteger } from "./flowGraphInteger";
import { RichTypeFlowGraphInteger } from "./flowGraphRichTypes";
import type { IObjectAccessor } from "./typeDefinitions";

const pathHasTemplatesRegex = new RegExp(/\{(\w+)\}/g);

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
        let match = pathHasTemplatesRegex.exec(path);
        while (match) {
            const [, matchGroup] = match;
            this.templatedInputs.push(ownerBlock.registerDataInput(matchGroup, RichTypeFlowGraphInteger));
            match = pathHasTemplatesRegex.exec(path);
        }
    }

    public getAccessor(pathConverter: IPathToObjectConverter<IObjectAccessor>, context: FlowGraphContext): IObjectInfo<IObjectAccessor> {
        let finalPath = this.path;
        for (const templatedInput of this.templatedInputs) {
            const valueToReplace = templatedInput.getValue(context).value;
            finalPath = finalPath.replace(`{${templatedInput.name}}`, valueToReplace.toString());
        }
        return pathConverter.convert(finalPath);
    }
}
