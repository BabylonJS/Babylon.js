/**
 * This represents something that will execute
 */
export class BaseAction {
    public constructor() {}

    public execute() {
        /** Overridden in child classes */
    }

    public actionName(): string {
        /** Overridden in child classes */
        return "BaseAction";
    }
}
