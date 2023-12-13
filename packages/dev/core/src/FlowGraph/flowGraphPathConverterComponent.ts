import type { IObjectAccessor, IObjectAccessorContainer, IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import { RichTypeNumber } from "./flowGraphRichTypes";

const pathHasTemplatesRegex = /\{(\w+)\}/g;

/**
 * @experimental
 * A component that converts a path to an object accessor.
 */
export class FlowGraphPathConverterComponent {
    /**
     * The templated inputs for the provided path.
     */
    public readonly templatedInputs: FlowGraphDataConnection<number>[] = [];
    public constructor(
        public path: string,
        public ownerBlock: FlowGraphBlock
    ) {
        const templateMatches = [...path.matchAll(pathHasTemplatesRegex)];
        if (templateMatches && templateMatches.length > 0) {
            for (const [, matchGroup] of templateMatches) {
                this.templatedInputs.push(ownerBlock.registerDataInput(matchGroup, RichTypeNumber));
            }
        }
    }

    public getAccessor(pathConverter: IPathToObjectConverter<IObjectAccessor>, context: FlowGraphContext): IObjectAccessorContainer<IObjectAccessor> {
        let finalPath = this.path;
        for (const templatedInput of this.templatedInputs) {
            const valueToReplace = templatedInput.getValue(context);
            finalPath = finalPath.replace(`{${templatedInput.name}}`, valueToReplace.toString());
        }
        return pathConverter.convert(finalPath);
    }
}
