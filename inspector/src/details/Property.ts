module INSPECTOR {

    /**
     * A property is a link between a data (string) and an object.
     */
    export class Property {

        /** The property name */
        private _property: string;
        /** The obj this property refers to */
        private _obj: any;
        /** The obj parent  */
        private _parentObj: any;

        constructor(prop: string, obj: any, parentObj?: PropertyLine) {
            this._property = prop;
            this._obj = obj;
            this._parentObj = parentObj || null;
        }

        public get name(): string {
            return this._property;
        }

        public get value(): any {
            return this._obj[this._property];
        }
        public set value(newValue: any) {
            if (newValue != undefined && this._obj[this._property] != undefined) {
                if (this._obj instanceof BABYLON.Scene) {
                    (<BABYLON.Scene>this._obj).debugLayer.onPropertyChangedObservable.notifyObservers({
                        object: this._obj,
                        property: this._property,
                        value: newValue,
                        initialValue: (<any>this._obj)[this._property]
                    });
                }
                else {
                    if(this._parentObj != null) {
                        // Object that have "children" properties : Color, Vector, imageProcessingConfiguration

                        if (this._parentObj instanceof BABYLON.Scene) {
                            (<BABYLON.Scene>this._parentObj).debugLayer.onPropertyChangedObservable.notifyObservers({
                                object: this._parentObj,
                                property: this._property,
                                value: newValue,
                                initialValue: (<any>this._obj)[this._property]
                            });
                        }
                        else {
                            this._parentObj.getScene().debugLayer.onPropertyChangedObservable.notifyObservers({
                                object: this._parentObj,
                                property: this._property,
                                value: newValue,
                                initialValue: this._obj[this._property]
                            });
                        }
                    }
                    else {
                        this._obj.getScene().debugLayer.onPropertyChangedObservable.notifyObservers({
                            object: this._obj,
                            property: this._property,
                            value: newValue,
                            initialValue: this._obj[this._property]
                        });
                    }
                }
            }
            this._obj[this._property] = newValue;
        }

        public get type(): string {
            return Helpers.GET_TYPE(this.value);
        }

        public get obj(): any {
            return this._obj;
        }
        public set obj(newObj: any) {
            this._obj = newObj;
        }

    }
}