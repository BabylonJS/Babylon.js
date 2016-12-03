declare module INSPECTOR {
    interface IHighlight {
        highlight: (b: boolean) => void;
    }
    abstract class Adapter implements IHighlight {
        protected _obj: any;
        private static _name;
        constructor(obj: any);
        /** Returns the name displayed in the tree */
        abstract id(): string;
        /** Returns the type of this object - displayed in the tree */
        abstract type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        abstract getProperties(): Array<PropertyLine>;
        /** Returns the actual object behind this adapter */
        actualObject: any;
        /** Returns true if the given object correspond to this  */
        correspondsTo(obj: any): boolean;
        /** Returns the adapter unique name */
        name: string;
        /** Returns the list of tools available for this adapter */
        abstract getTools(): Array<AbstractTreeTool>;
        /** Should be overriden in subclasses */
        highlight(b: boolean): void;
    }
}
