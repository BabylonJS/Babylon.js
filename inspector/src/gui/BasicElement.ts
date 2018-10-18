import { Helpers } from "../helpers/Helpers";

/**
 * Represents a html div element.
 * The div is built when an instance of BasicElement is created.
 */
export abstract class BasicElement {

    protected _div: HTMLDivElement;

    constructor() {
        this._div = Helpers.CreateDiv();
    }

    /**
     * Returns the div element
     */
    public toHtml(): HTMLDivElement {
        return this._div;
    }

    /**
     * Build the html element
     */
    protected _build() { }

    public abstract update(data?: any): void;

    /** Default dispose method if needed */
    public dispose() { }

}
