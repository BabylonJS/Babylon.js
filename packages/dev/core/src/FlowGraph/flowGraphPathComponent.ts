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
    /**
     * The path that this component is associated with.
     */
    path: FlowGraphPath;
    /**
     * The list of numeric data inputs that fill in the template strings in the path.
     */
    templateStringInputs: FlowGraphDataConnection<number>[] = [];
    /**
     * The block that owns this component.
     */
    ownerBlock: FlowGraphBlock;

    constructor(path: FlowGraphPath, ownerBlock: FlowGraphBlock) {
        this.path = path;
        this.ownerBlock = ownerBlock;
        for (const templateString of path.getTemplateStrings()) {
            this.templateStringInputs.push(this.ownerBlock.registerDataInput(templateString, RichTypeNumber));
        }
    }

    /**
     * Get the inputs of all of the numeric data inputs and use them to fill in the
     * template strings in the path.
     * @param context the context to use to get the values of the numeric data inputs
     * @returns the path with the template strings filled in
     */
    substitutePath(context: FlowGraphContext): FlowGraphPath {
        for (const templateStringInput of this.templateStringInputs) {
            const templateStringValue = templateStringInput.getValue(context);
            const templateString = templateStringInput.name;
            this.path.setTemplateSubstitution(templateString, templateStringValue);
        }
        return this.path;
    }

    /**
     * Substitutes the template strings in the path and gets the property on the target object.
     * @param context
     * @returns
     */
    getProperty(context: FlowGraphContext): any {
        this.substitutePath(context);
        return this.path.getProperty(context);
    }

    /**
     * Substitutes the template strings in the path and sets the property on the target object.
     * @param context
     * @param value
     */
    setProperty(context: FlowGraphContext, value: any) {
        this.substitutePath(context);
        this.path.setProperty(context, value);
    }
}
