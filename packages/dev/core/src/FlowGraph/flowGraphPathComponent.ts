import type { FlowGraphBlock } from "./flowGraphBlock";
import type { FlowGraphContext } from "./flowGraphContext";
import type { FlowGraphDataConnection } from "./flowGraphDataConnection";
import type { FlowGraphPath } from "./flowGraphPath";
import { RichTypeNumber } from "./flowGraphRichTypes";

/**
 * This class represents a component that has a path and a series of numeric
 * data inputs which fill in the template strings in the path.
 */
export class FlowGraphPathComponent {
    path: FlowGraphPath;
    templateStringInputs: FlowGraphDataConnection<number>[] = [];
    ownerBlock: FlowGraphBlock;

    constructor(path: FlowGraphPath, ownerBlock: FlowGraphBlock) {
        this.path = path;
        this.ownerBlock = ownerBlock;
        for (const templateString of path.getTemplateStrings()) {
            this.templateStringInputs.push(this.ownerBlock.registerDataInput(templateString, RichTypeNumber));
        }
    }

    substitutePath(context: FlowGraphContext): FlowGraphPath {
        for (const templateStringInput of this.templateStringInputs) {
            const templateStringValue = templateStringInput.getValue(context);
            const templateString = templateStringInput.name;
            this.path.setTemplateSubstitution(templateString, templateStringValue);
        }
        return this.path;
    }
}
