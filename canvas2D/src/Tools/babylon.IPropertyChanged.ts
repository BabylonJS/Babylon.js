module BABYLON {
    export class PropertyChangedInfo {
        /**
         * Previous value of the property
         */
        oldValue: any;
        /**
         * New value of the property
         */
        newValue: any;

        /**
         * Name of the property that changed its value
         */
        propertyName: string;
    }

    /**
     * Custom type of the propertyChanged observable
     */

    /**
     * Property Changed interface
     */
    export interface IPropertyChanged {
        /**
         * PropertyChanged observable
         */
        propertyChanged: Observable<PropertyChangedInfo>;
    }

    /**
     * The purpose of this class is to provide a base implementation of the IPropertyChanged interface for the user to avoid rewriting a code needlessly.
     * Typical use of this class is to check for equality in a property set(), then call the onPropertyChanged method if values are different after the new value is set. The protected method will notify observers of the change.
     * Remark: onPropertyChanged detects reentrant code and acts in a way to make sure everything is fine, fast and allocation friendly (when there no reentrant code which should be 99% of the time)
     */
    export abstract class PropertyChangedBase implements IPropertyChanged {

        /**
         * Protected method to call when there's a change of value in a property set
         * @param propName the name of the concerned property
         * @param oldValue its old value
         * @param newValue its new value
         * @param mask an optional observable mask
         */
        protected onPropertyChanged<T>(propName: string, oldValue: T, newValue: T, mask?: number) {
            if (this.propertyChanged.hasObservers()) {

                let pci = PropertyChangedBase.calling ? new PropertyChangedInfo() : PropertyChangedBase.pci;

                pci.oldValue = oldValue;
                pci.newValue = newValue;
                pci.propertyName = propName;

                try {
                    PropertyChangedBase.calling = true;
                    this.propertyChanged.notifyObservers(pci, mask);
                } finally {
                    PropertyChangedBase.calling = false;
                }
            }
        }

        /**
         * An observable that is triggered when a property (using of the XXXXLevelProperty decorator) has its value changing.
         * You can add an observer that will be triggered only for a given set of Properties using the Mask feature of the Observable and the corresponding Prim2DPropInfo.flagid value (e.g. Prim2DBase.positionProperty.flagid|Prim2DBase.rotationProperty.flagid to be notified only about position or rotation change)
         */
        public get propertyChanged(): Observable<PropertyChangedInfo> {
            if (!this._propertyChanged) {
                this._propertyChanged = new Observable<PropertyChangedInfo>();
            }
            return this._propertyChanged;
        }

        public _propertyChanged: Observable<PropertyChangedInfo> = null;
        private static pci = new PropertyChangedInfo();
        private static calling: boolean = false;
    }

}