/**
 * This represents something that will execute
 */
export class BaseAction {
    public constructor() {}

    public execute() {
        /** Overriden in child classes */
    }

    public actionName(): string {
        /** Overriden in child classes */
        return "BaseAction";
    }
}
