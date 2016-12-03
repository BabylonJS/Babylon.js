declare module INSPECTOR {
    /**
     * A property is a link between a data (string) and an object.
     */
    class Property {
        /** The property name */
        private _property;
        /** The obj this property refers to */
        private _obj;
        constructor(prop: string, obj: any);
        name: string;
        value: any;
        type: string;
        obj: any;
    }
}
