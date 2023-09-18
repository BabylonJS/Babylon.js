import type { RichType } from "./flowGraphRichTypes";

// Represents a value with a rich type.
export class FlowGraphValueWithRichType<T, RT extends RichType<T>> {
    public value: T;
    constructor(public richType: RT, value?: T) {
        this.value = value ?? richType.defaultValueBuilder();
    }
}
