import type { IObjectAccessorContainer } from "../ObjectModel/objectModelInterfaces";
import { isTemplated, type IPathToObjectConverter } from "../ObjectModel/objectModelInterfaces";
import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import { RichTypeNumber } from "./flowGraphRichTypes";

export class FlowGraphPathConverterComponent {
    public readonly templatedInputs: FlowGraphDataConnection<number>[] = [];
    constructor(
        public pathConverter: IPathToObjectConverter,
        public path: string,
        public ownerBlock: FlowGraphBlock
    ) {
        if (isTemplated(pathConverter)) {
            for (const key in pathConverter.substitutionTemplates) {
                this.templatedInputs.push(ownerBlock.registerDataInput(key, RichTypeNumber));
            }
        }
    }

    getAccessor(context: FlowGraphContext): IObjectAccessorContainer | undefined {
        for (const templatedInput of this.templatedInputs) {
            (this.pathConverter as any).substitutionTemplates[templatedInput.name] = templatedInput.getValue(context);
        }
        if (this.pathConverter) {
            return this.pathConverter.convert(this.path);
        }
        return undefined;
    }
}
