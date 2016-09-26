module BABYLON {
    export class Prim2DClassInfo {

    }

    export class Prim2DPropInfo {
        static PROPKIND_MODEL: number = 1;
        static PROPKIND_INSTANCE: number = 2;
        static PROPKIND_DYNAMIC: number = 3;

        id: number;
        flagId: number;
        kind: number;
        name: string;
        dirtyBoundingInfo: boolean;
        dirtyParentBoundingInfo: boolean;
        typeLevelCompare: boolean;
        bindingMode: number;
        bindingUpdateSourceTrigger: number;
    }

    /**
     * Custom type of the propertyChanged observable
     */
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
     * Property Changed interface
     */
    export interface IPropertyChanged {
        /**
         * PropertyChanged observable
         */
        propertyChanged: Observable<PropertyChangedInfo>;
    }

    export class ClassTreeInfo<TClass, TProp>{
        constructor(baseClass: ClassTreeInfo<TClass, TProp>, type: Object, classContentFactory: (base: TClass) => TClass) {
            this._baseClass = baseClass;
            this._type = type;
            this._subClasses = new Array<{ type: Object, node: ClassTreeInfo<TClass, TProp> }>();
            this._levelContent = new StringDictionary<TProp>();
            this._classContentFactory = classContentFactory;
        }

        get classContent(): TClass {
            if (!this._classContent) {
                this._classContent = this._classContentFactory(this._baseClass ? this._baseClass.classContent : null);
            }
            return this._classContent;
        }

        get type(): Object {
            return this._type;
        }

        get levelContent(): StringDictionary<TProp> {
            return this._levelContent;
        }

        get fullContent(): StringDictionary<TProp> {
            if (!this._fullContent) {
                let dic = new StringDictionary<TProp>();
                let curLevel: ClassTreeInfo<TClass, TProp> = this;
                while (curLevel) {
                    curLevel.levelContent.forEach((k, v) => dic.add(k, v));
                    curLevel = curLevel._baseClass;
                }

                this._fullContent = dic;
            }

            return this._fullContent;
        }

        getLevelOf(type: Object): ClassTreeInfo<TClass, TProp> {
            // Are we already there?
            if (type === this._type) {
                return this;
            }

            let baseProto = Object.getPrototypeOf(type);
            let curProtoContent = this.getOrAddType(Object.getPrototypeOf(baseProto), baseProto);
            if (!curProtoContent) {
                this.getLevelOf(baseProto);
            }

            return this.getOrAddType(baseProto, type);
        }

        getOrAddType(baseType: Object, type: Object): ClassTreeInfo<TClass, TProp> {

            // Are we at the level corresponding to the baseType?
            // If so, get or add the level we're looking for
            if (baseType === this._type) {
                for (let subType of this._subClasses) {
                    if (subType.type === type) {
                        return subType.node;
                    }
                }
                let node = new ClassTreeInfo<TClass, TProp>(this, type, this._classContentFactory);
                let info = { type: type, node: node };
                this._subClasses.push(info);
                return info.node;
            }

            // Recurse down to keep looking for the node corresponding to the baseTypeName
            for (let subType of this._subClasses) {
                let info = subType.node.getOrAddType(baseType, type);
                if (info) {
                    return info;
                }
            }
            return null;
        }

        static get<TClass, TProp>(type: Object): ClassTreeInfo<TClass, TProp> {
            let dic = <ClassTreeInfo<TClass, TProp>>type["__classTreeInfo"];
            if (!dic) {
                return null;
            }
            return dic.getLevelOf(type);
        }

        static getOrRegister<TClass, TProp>(type: Object, classContentFactory: (base: TClass) => TClass): ClassTreeInfo<TClass, TProp> {
            let dic = <ClassTreeInfo<TClass, TProp>>type["__classTreeInfo"];
            if (!dic) {
                dic = new ClassTreeInfo<TClass, TProp>(null, type, classContentFactory);
                type["__classTreeInfo"] = dic;
            }
            return dic;
        }

        private _type: Object;
        private _classContent: TClass;
        private _baseClass: ClassTreeInfo<TClass, TProp>;
        private _subClasses: Array<{ type: Object, node: ClassTreeInfo<TClass, TProp> }>;
        private _levelContent: StringDictionary<TProp>;
        private _fullContent: StringDictionary<TProp>;
        private _classContentFactory: (base: TClass) => TClass;
    }

    export class Binding {

        /**
         * Use the mode specified in the SmartProperty declaration
         */
        static MODE_DEFAULT: number = 1;

        /**
         * Update the binding target only once when the Smart Property's value is first accessed
         */
        static MODE_ONETIME: number = 2;

        /**
         * Update the smart property when the source changes.
         * The source won't be updated if the smart property value is set.
         */
        static MODE_ONEWAY: number = 3;

        /**
         * Only update the source when the target's data is changing.
         */
        static MODE_ONEWAYTOSOURCE: number = 4;

        /**
         * Update the bind target when the source changes and update the source when the Smart Property value is set.
         */
        static MODE_TWOWAY: number = 5;

        /**
         * Use the Update Source Trigger defined in the SmartProperty declaration
         */
        static UPDATESOURCETRIGGER_DEFAULT: number = 1;

        /**
         * Update the source as soon as the Smart Property has a value change
         */
        static UPDATESOURCETRIGGER_PROPERTYCHANGED: number = 2;

        /**
         * Update the source when the binding target loses focus
         */
        static UPDATESOURCETRIGGER_LOSTFOCUS: number = 3;

        /**
         * Update the source will be made by explicitly calling the UpdateFromDataSource method
         */
        static UPDATESOURCETRIGGER_EXPLICIT: number = 4;

        constructor() {
            this._converter = null;
            this._mode = Binding.MODE_DEFAULT;
            this._uiElementId = null;
            this._dataSource = null;
            this._currentDataSource = null;
            this._propertyPathName = null;
            this._stringFormat = null;
            this._updateSourceTrigger = Binding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            this._boundTo = null;
            this._owner = null;
            this._updateCounter = 0;
        }

        /**
         * Provide a callback that will convert the value obtained by the Data Binding to the type of the SmartProperty it's bound to.
         * If no value are set, then it's assumed that the sourceValue is of the same type as the SmartProperty's one.
         * If the SmartProperty type is a basic data type (string, boolean or number) and no converter is specified but the sourceValue is of a different type, the conversion will be implicitly made, if possible.
         * @param sourceValue the source object retrieve by the Data Binding mechanism
         * @returns the object of a compatible type with the SmartProperty it's bound to
         */
        public get converter(): (sourceValue: any) => any {
            return this._converter;
        }

        public set converter(value: (sourceValue: any) => any) {
            if (this._converter === value) {
                return;
            }

            this._converter = value;
        }

        /**
         * Set the mode to use for the data flow in the binding. Set one of the MODE_xxx static member of this class. If not specified then MODE_DEFAULT will be used
         */
        public get mode(): number {
            if (this._mode === Binding.MODE_DEFAULT) {
                return this._boundTo.bindingMode;
            }
            return this._mode;
        }

        public set mode(value: number) {
            if (this._mode === value) {
                return;
            }

            this._mode = value;
        }

        /**
         * You can override the Data Source object with this member which is the Id of a uiElement existing in the UI Logical tree.
         * If not set and source no set too, then the dataSource property will be used.
         */
        public get uiElementId(): string {
            return this._uiElementId;
        }

        public set uiElementId(value: string) {
            if (this._uiElementId === value) {
                return;
            }

            this._uiElementId = value;
        }

        /**
         * You can override the Data Source object with this member which is the source object to use directly.
         * If not set and uiElement no set too, then the dataSource property of the SmartPropertyBase object will be used.
         */
        public get dataSource(): IPropertyChanged {
            return this._dataSource;
        }

        public set dataSource(value: IPropertyChanged) {
            if (this._dataSource === value) {
                return;
            }

            this._dataSource = value;
        }

        /**
         * The path & name of the property to get from the source object.
         * Once the Source object is evaluated (it's either the one got from uiElementId, source or dataSource) you can specify which property of this object is the value to bind to the smartProperty.
         * If nothing is set then the source object will be used.
         * You can specify an indirect property using the format "firstProperty.indirectProperty" like "address.postalCode" if the source is a Customer object which contains an address property and the Address class contains a postalCode property.
         * If the property is an Array and you want to address a particular element then use the 'arrayProperty[index]' notation. For example "phoneNumbers[0]" to get the first element of the phoneNumber property which is an array.
         */
        public get propertyPathName(): string {
            return this._propertyPathName;
        }

        public set propertyPathName(value: string) {
            if (this._propertyPathName === value) {
                return;
            }

            if (this._owner) {
                //BindingWatcher.unregisterBinding(this, null);
            }

            this._propertyPathName = value;

            if (this._owner) {
                //let watched = BindingWatcher._getDataSource(this._owner.dataSource, this);
                //BindingWatcher.refreshBinding(watched, this._owner, this, true, null, true);
            }
        }

        /**
         * If the Smart Property is of the string type, you can use the string interpolation notation to provide how the sourceValue will be formatted, reference to the source value must be made via the token: ${value}. For instance `Customer Name: ${value}`
         */
        public get stringFormat(): (value: any) => string {
            return this._stringFormat;
        }

        public set stringFormat(value: (value: any) => string) {
            if (this._stringFormat === value) {
                return;
            }

            this._stringFormat = value;
        }

        /**
         * Specify how the source should be updated, use one of the UPDATESOURCETRIGGER_xxx member of this class, if not specified then UPDATESOURCETRIGGER_DEFAULT will be used.
         */
        public get updateSourceTrigger(): number {
            return this._updateSourceTrigger;
        }

        public set updateSourceTrigger(value: number) {
            if (this._updateSourceTrigger === value) {
                return;
            }

            this._updateSourceTrigger = value;
        }

        canUpdateTarget(resetUpdateCounter: boolean): boolean {
            if (resetUpdateCounter) {
                this._updateCounter = 0;
            }

            let mode = this.mode;
            if (mode === Binding.MODE_ONETIME) {
                return this._updateCounter === 0;
            }

            if (mode === Binding.MODE_ONEWAYTOSOURCE) {
                return false;
            }
            return true;
        }

        updateTarget() {
            let value = this._getActualDataSource();
            let properties = this.propertyPathName.split(".");
            for (let propertyName of properties) {
                value = value[propertyName];
            }
            this._storeBoundValue(this._owner, value);
        }

        public _storeBoundValue(watcher: SmartPropertyBase, value) {
            if ((++this._updateCounter > 1) && (this.mode === Binding.MODE_ONETIME)) {
                return;
            }

            let newValue = value;
            if (this._converter) {
                newValue = this._converter(value);
            }

            if (this._stringFormat) {
                newValue = this._stringFormat(newValue);
            }
            watcher[this._boundTo.name] = newValue;
        }

        private _getActualDataSource() {
            if (this.dataSource) {
                return this.dataSource;
            }

            if (this.uiElementId) {
                // TODO Find UIElement
                return null;
            }

            return this._owner.dataSource;
        }

        public _registerDataSource(updateTarget: boolean) {
            let ds = this._getActualDataSource();
            if (ds === this._currentDataSource) {
                return;
            }

            if (this._currentDataSource) {
                BindingHelper.unregisterDataSource(this._currentDataSource, this, 0);
            }

            if (ds) {
                BindingHelper.registerDataSource(ds, this);
                if (updateTarget && this.canUpdateTarget(true)) {
                    this.updateTarget();
                }
            }

            this._currentDataSource = ds;
        }

        public _unregisterDataSource() {
            let ds = this._getActualDataSource();
            if (ds) {
                BindingHelper.unregisterDataSource(ds, this, 0);
            }
        }
        
        /**
         * The PropInfo of the property the binding is bound to
         */
        public _boundTo: Prim2DPropInfo;

        public _owner: SmartPropertyBase;

        private _converter: (sourceValue: any) => any;
        private _mode: number;
        private _uiElementId: string;
        private _dataSource: IPropertyChanged;
        public _currentDataSource: IPropertyChanged;
        private _propertyPathName: string;
        private _stringFormat: (value: any) => string;
        private _updateSourceTrigger: number;
        private _updateCounter: number;
    }

    @className("SmartPropertyBase", "BABYLON")
    export abstract class SmartPropertyBase implements IPropertyChanged {
        
        constructor() {
            this._dataSource = null;
            this._dataSourceObserver = null;
            this._instanceDirtyFlags = 0;
            this._isDisposed = false;
            this._bindings = null;
            this._hasBinding = 0;
            this._bindingSourceChanged = 0;
            this.propertyChanged = new Observable<PropertyChangedInfo>();
        }

        /**
         * Check if the object is disposed or not.
         * @returns true if the object is dispose, false otherwise.
         */
        public get isDisposed(): boolean {
            return this._isDisposed;
        }

        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        public dispose(): boolean {
            if (this.isDisposed) {
                return false;
            }
            this._isDisposed = true;
            return true;
        }

        /**
         * Check if a given set of properties are dirty or not.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return true if at least one property is dirty, false if none of them are.
         */
        public checkPropertiesDirty(flags: number): boolean {
            return (this._instanceDirtyFlags & flags) !== 0;
        }

        /**
         * Clear a given set of properties.
         * @param flags a ORed combination of Prim2DPropInfo.flagId values
         * @return the new set of property still marked as dirty
         */
        protected clearPropertiesDirty(flags: number): number {
            this._instanceDirtyFlags &= ~flags;
            return this._instanceDirtyFlags;
        }

        public _resetPropertiesDirty() {
            this._instanceDirtyFlags = 0;
        }

        /**
         * Add an externally attached data from its key.
         * This method call will fail and return false, if such key already exists.
         * If you don't care and just want to get the data no matter what, use the more convenient getOrAddExternalDataWithFactory() method.
         * @param key the unique key that identifies the data
         * @param data the data object to associate to the key for this Engine instance
         * @return true if no such key were already present and the data was added successfully, false otherwise
         */
        public addExternalData<T>(key: string, data: T): boolean {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return this._externalData.add(key, data);
        }

        /**
         * Get an externally attached data from its key
         * @param key the unique key that identifies the data
         * @return the associated data, if present (can be null), or undefined if not present
         */
        public getExternalData<T>(key: string): T {
            if (!this._externalData) {
                return null;
            }
            return <T>this._externalData.get(key);
        }

        /**
         * Get an externally attached data from its key, create it using a factory if it's not already present
         * @param key the unique key that identifies the data
         * @param factory the factory that will be called to create the instance if and only if it doesn't exists
         * @return the associated data, can be null if the factory returned null.
         */
        public getOrAddExternalDataWithFactory<T>(key: string, factory: (k: string) => T): T {
            if (!this._externalData) {
                this._externalData = new StringDictionary<Object>();
            }
            return <T>this._externalData.getOrAddWithFactory(key, factory);
        }

        /**
         * Remove an externally attached data from the Engine instance
         * @param key the unique key that identifies the data
         * @return true if the data was successfully removed, false if it doesn't exist
         */
        public removeExternalData(key): boolean {
            if (!this._externalData) {
                return false;
            }
            return this._externalData.remove(key);
        }

        /**
         * An observable that is triggered when a property (using of the XXXXLevelProperty decorator) has its value changing.
         * You can add an observer that will be triggered only for a given set of Properties using the Mask feature of the Observable and the corresponding Prim2DPropInfo.flagid value (e.g. Prim2DBase.positionProperty.flagid|Prim2DBase.rotationProperty.flagid to be notified only about position or rotation change)
         */
        public propertyChanged: Observable<PropertyChangedInfo>;

        static _hookProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, kind: number,
            settings?: {
                bindingMode?: number,
                bindingUpdateSourceTrigger?: number,
                typeLevelCompare?: boolean,
                dirtyBoundingInfo?: boolean,
                dirtyParentBoundingBox?: boolean,
            }): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
            return (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {

                if (!settings) {
                    settings = {};
                }

                var propInfo = SmartPropertyBase._createPropInfo(target, <string>propName, propId, kind, settings);
                if (piStore) {
                    piStore(propInfo);
                }
                let getter = descriptor.get, setter = descriptor.set;

                let typeLevelCompare = (settings.typeLevelCompare!==undefined) ? settings.typeLevelCompare : false;

                // Overload the property setter implementation to add our own logic
                descriptor.set = function (val) {
                    // check for disposed first, do nothing
                    if (this.isDisposed) {
                        return;
                    }

                    let curVal = getter.call(this);

                    if (SmartPropertyBase._checkUnchanged(curVal, val)) {
                        return;
                    }

                    // Cast the object we're working one
                    let prim = <SmartPropertyBase>this;

                    // Change the value
                    setter.call(this, val);

                    // Notify change, dirty flags update
                    prim._handlePropChanged(curVal, val, <string>propName, propInfo, typeLevelCompare);
                }
            }
        }

        private static _createPropInfo(target: Object, propName: string, propId: number, kind: number,
            settings: {
                bindingMode?: number,
                bindingUpdateSourceTrigger?: number,
                typeLevelCompare?: boolean,
                dirtyBoundingInfo?: boolean,
                dirtyParentBoundingBox?: boolean,
            }): Prim2DPropInfo {

            let dic = ClassTreeInfo.getOrRegister<Prim2DClassInfo, Prim2DPropInfo>(target, () => new Prim2DClassInfo());
            var node = dic.getLevelOf(target);

            let propInfo = node.levelContent.get(propId.toString());
            if (propInfo) {
                throw new Error(`The ID ${propId} is already taken by another property declaration named: ${propInfo.name}`);
            }

            // Create, setup and add the PropInfo object to our prop dictionary
            propInfo = new Prim2DPropInfo();
            propInfo.id = propId;
            propInfo.flagId = Math.pow(2, propId);
            propInfo.kind = kind;
            propInfo.name = propName;
            propInfo.bindingMode = (settings.bindingMode !== undefined) ? settings.bindingMode : Binding.MODE_TWOWAY;
            propInfo.bindingUpdateSourceTrigger = (settings.bindingUpdateSourceTrigger !== undefined) ? settings.bindingUpdateSourceTrigger : Binding.UPDATESOURCETRIGGER_PROPERTYCHANGED;
            propInfo.dirtyBoundingInfo = (settings.dirtyBoundingInfo!==undefined) ? settings.dirtyBoundingInfo : false;
            propInfo.dirtyParentBoundingInfo = (settings.dirtyParentBoundingBox!==undefined) ? settings.dirtyParentBoundingBox : false;
            propInfo.typeLevelCompare = (settings.typeLevelCompare!==undefined) ? settings.typeLevelCompare : false;
            node.levelContent.add(propName, propInfo);

            return propInfo;
        }

        /**
         * Access the dictionary of properties metadata. Only properties decorated with XXXXLevelProperty are concerned
         * @returns the dictionary, the key is the property name as declared in Javascript, the value is the metadata object
         */
        protected get propDic(): StringDictionary<Prim2DPropInfo> {
            if (!this._propInfo) {
                let cti = ClassTreeInfo.get<Prim2DClassInfo, Prim2DPropInfo>(Object.getPrototypeOf(this));
                if (!cti) {
                    throw new Error("Can't access the propDic member in class definition, is this class SmartPropertyPrim based?");
                }
                this._propInfo = cti.fullContent;
            }

            return this._propInfo;
        }

        private static _checkUnchanged(curValue, newValue): boolean {
            // Nothing to nothing: nothing to do!
            if ((curValue === null && newValue === null) || (curValue === undefined && newValue === undefined)) {
                return true;
            }

            // Check value unchanged
            if ((curValue != null) && (newValue != null)) {
                if (typeof (curValue.equals) == "function") {
                    if (curValue.equals(newValue)) {
                        return true;
                    }
                } else {
                    if (curValue === newValue) {
                        return true;
                    }
                }
            }

            return false;
        }

        private static propChangedInfo = new PropertyChangedInfo();
        private static propChangeGuarding = false;

        protected _handlePropChanged<T>(curValue: T, newValue: T, propName: string, propInfo: Prim2DPropInfo, typeLevelCompare: boolean) {
            // Trigger property changed
            let info = SmartPropertyBase.propChangeGuarding ? new PropertyChangedInfo() : SmartPropertyPrim.propChangedInfo;
            info.oldValue = curValue;
            info.newValue = newValue;
            info.propertyName = propName;
            let propMask = propInfo ? propInfo.flagId : -1;
            try {
                SmartPropertyBase.propChangeGuarding = true;
                this.propertyChanged.notifyObservers(info, propMask);
            } finally  {
                SmartPropertyBase.propChangeGuarding = false;
            } 
        }

        protected _triggerPropertyChanged(propInfo: Prim2DPropInfo, newValue: any) {
            if (this.isDisposed) {
                return;
            }

            if (!propInfo) {
                return;
            }

            this._handlePropChanged(undefined, newValue, propInfo.name, propInfo, propInfo.typeLevelCompare);
        }

        /**
         * Set the object from which Smart Properties using Binding will take/update their data from/to.
         * When the object is part of a graph (with parent/children relationship) if the dataSource of a given instance is not specified, then the parent's one is used.
         */
        public get dataSource(): IPropertyChanged {
            // Don't access to _dataSource directly but via a call to the _getDataSource method which can be overloaded in inherited classes
            return this._getDataSource();
        }

        public set dataSource(value: IPropertyChanged) {
            if (this._dataSource === value) {
                return;
            }

            let oldValue = this._dataSource;
            this._dataSource = value;

            if (value != null) {
                // Register the bindings
                for (let binding of this._bindings) {
                    if (binding != null) {
                        binding._registerDataSource(true);
                    }
                }
            }

            this._handlePropChanged(oldValue, value, "dataSource", null, false);
        }

        // Inheriting classes can overload this method to provides additional logic for dataSource access
        protected _getDataSource(): IPropertyChanged {
            return this._dataSource;
        }

        public registerSimpleDataBinding(propInfo: Prim2DPropInfo, propertyPathName: string): Binding {
            let binding = new Binding();
            binding.propertyPathName = propertyPathName;
            return this.registerDataBinding(propInfo, binding);
        }

        public registerDataBinding(propInfo: Prim2DPropInfo, binding: Binding): Binding {
            if (!this._bindings) {
                this._bindings = new Array<Binding>();
            }

            if (!binding || binding._owner != null) {
                throw Error("A valid/unused Binding must be passed.");
            }

            // Unregister a potentially existing binding for this property
            this.removeDataBinding(propInfo);

            // register the binding
            binding._owner = this;
            binding._boundTo = propInfo;
            this._bindings[propInfo.id] = binding;
            this._hasBinding |= propInfo.flagId;

            binding._registerDataSource(true);
            
            return binding;
        }

        public removeDataBinding(propInfo: Prim2DPropInfo): boolean {
            if ((this._hasBinding & propInfo.flagId) === 0) {
                return false;
            }

            let curBinding = this._bindings[propInfo.id];
            curBinding._unregisterDataSource();

            this._bindings[propInfo.id] = null;
            this._hasBinding &= ~propInfo.flagId;
            return true;
        }

        public updateFromDataSource() {
            for (let binding of this._bindings) {
                if (binding) {
                    //BindingWatcher.updateFromDataSource(this, binding, false);
                }
            }
        }

        private _dataSource: IPropertyChanged;
        private _dataSourceObserver: Observer<PropertyChangedInfo>;
        private _isDisposed: boolean;
        private _externalData: StringDictionary<Object>;
        protected _instanceDirtyFlags: number;
        private _propInfo: StringDictionary<Prim2DPropInfo>;
        public _bindings: Array<Binding>;
        private _hasBinding: number;
        private _bindingSourceChanged: number;
    }

    class BindingInfo {
        constructor(binding: Binding, level: number, isLast: boolean) {
            this.binding = binding;
            this.level = level;
            this.isLast = isLast;
        }
        binding: Binding;
        level: number;
        isLast: boolean;
    }

    class MonitoredObjectData {
        constructor(monitoredObject: IPropertyChanged) {
            this.monitoredObject = monitoredObject;
            this.monitoredIntermediateProperties = new StringDictionary<MonitoredObjectData>();
            this.observer = this.monitoredObject.propertyChanged.add((e, s) => { this.propertyChangedHandler(e.propertyName, e.oldValue, e.newValue); });
            this.boundProperties = new StringDictionary<Array<BindingInfo>>();
            this.monitoredIntermediateMask = 0;
            this.boundPropertiesMask = 0;
        }

        monitoredObject: IPropertyChanged;
        observer: Observer<PropertyChangedInfo>;
        monitoredIntermediateMask: number;
        monitoredIntermediateProperties: StringDictionary<MonitoredObjectData>;
        boundPropertiesMask;
        boundProperties: StringDictionary<Array<BindingInfo>>;

        propertyChangedHandler(propName: string, oldValue, newValue) {
            let propId = BindingHelper._getPropertyID(this.monitoredObject, propName);
            let propIdStr = propId.toString();

            // Loop through all the registered bindings for this property that had a value change
            if ((this.boundPropertiesMask & propId) !== 0) {
                let bindingInfos = this.boundProperties.get(propIdStr);
                for (let bi of bindingInfos) {
                    if (!bi.isLast) {
                        BindingHelper.unregisterDataSource(this.monitoredObject, bi.binding, bi.level);
                        BindingHelper.registerDataSource(bi.binding._currentDataSource, bi.binding);
                    }
                    if (bi.binding.canUpdateTarget(false)) {
                        bi.binding.updateTarget();
                    }
                }
            }
        }
    }

    class BindingHelper {

        static registerDataSource(dataSource: IPropertyChanged, binding: Binding) {

            let properties = binding.propertyPathName.split(".");

            let ownerMod: MonitoredObjectData = null;
            let ownerInterPropId = 0;
            let propertyOwner = dataSource;
            for (let i = 0; i < properties.length; i++) {
                let propName = properties[i];

                let propId = BindingHelper._getPropertyID(propertyOwner, propName);
                let propIdStr = propId.toString();

                let mod: MonitoredObjectData;
                if (ownerMod) {
                    let o = ownerMod;
                    let po = propertyOwner;
                    let oii = ownerInterPropId;
                    mod = ownerMod.monitoredIntermediateProperties.getOrAddWithFactory(oii.toString(), k => {
                        o.monitoredIntermediateMask |= oii;
                        return BindingHelper._getMonitoredObjectData(po);
                    });
                } else {
                    mod = BindingHelper._getMonitoredObjectData(propertyOwner);
                }

                let m = mod;
                let bindingInfos = mod.boundProperties.getOrAddWithFactory(propIdStr, k => {
                    m.boundPropertiesMask |= propId;
                    return new Array<BindingInfo>();
                });

                let bi = Tools.first(bindingInfos, cbi => cbi.binding === binding);
                if (!bi) {
                    bindingInfos.push(new BindingInfo(binding, i, (i+1) === properties.length));
                }

                ownerMod = mod;
                ownerInterPropId = propId;
                propertyOwner = propertyOwner[propName];
            }
        }

        static unregisterDataSource(dataSource: IPropertyChanged, binding: Binding, level: number) {
            let properties = binding.propertyPathName.split(".");

            let propertyOwner = dataSource;
            let mod = BindingHelper._getMonitoredObjectData(propertyOwner);
            for (let i = 0; i < properties.length; i++) {
                let propName = properties[i];

                let propId = BindingHelper._getPropertyID(propertyOwner, propName);
                let propIdStr = propId.toString();

                if (i >= level) {
                    mod = BindingHelper._unregisterBinding(mod, propId, binding);
                } else {
                    mod = mod.monitoredIntermediateProperties.get(propIdStr);
                }

                propertyOwner = propertyOwner[propName];
            }
        }

        private static _unregisterBinding(mod: MonitoredObjectData, propertyID: number, binding: Binding): MonitoredObjectData {
            let propertyIDStr = propertyID.toString();
            let res: MonitoredObjectData = null;

            // Check if the property is registered as an intermediate and remove it
            if ((mod.monitoredIntermediateMask & propertyID) !== 0) {
                res = mod.monitoredIntermediateProperties.get(propertyIDStr);
                mod.monitoredIntermediateProperties.remove(propertyIDStr);

                // Update the mask
                mod.monitoredIntermediateMask &= ~propertyID;
            }

            // Check if the property is registered as a final property and remove it
            if ((mod.boundPropertiesMask & propertyID) !== 0) {
                let bindingInfos = mod.boundProperties.get(propertyIDStr);

                // Find the binding and remove it
                let bi = Tools.first(bindingInfos, cbi => cbi.binding === binding);
                if (bi) {
                    let bii = bindingInfos.indexOf(bi);
                    bindingInfos.splice(bii, 1);
                }

                // If the array is empty, update the mask
                if (bindingInfos.length === 0) {
                    mod.boundPropertiesMask &= ~propertyID;
                }
            }

            // Check if the MOD is empty and unregister the observer and remove it from the list of MODs
            if (mod.boundPropertiesMask === 0 && mod.monitoredIntermediateMask === 0) {
                // Unregister the observer on Property Change
                mod.monitoredObject.propertyChanged.remove(mod.observer);

                // Remove the MOD from the dic
                let objectId = BindingHelper._getObjectId(mod.monitoredObject);
                BindingHelper._monitoredObjects.remove(objectId);
            }

            return res;
        }

        private static _getMonitoredObjectData(object: IPropertyChanged): MonitoredObjectData {
            let objectId = BindingHelper._getObjectId(object);
            let mod = BindingHelper._monitoredObjects.getOrAddWithFactory(objectId, k => new MonitoredObjectData(object));
            return mod;
        }

        private static _getObjectId(obj: Object): string {
            let id = obj["__bindingHelperObjectId__"];
            if (id == null) {
                id = Tools.RandomId();
                obj["__bindingHelperObjectId__"] = id;
                return id;
            }
            return id;
        }

        public static _getObjectTypePropertyIDs(obj: IPropertyChanged): StringDictionary<number> {
            let fullName = Tools.getFullClassName(obj);
            if (!fullName) {
                throw Error("Types involved in Data Binding must be decorated with the @className decorator");
            }

            let d = BindingHelper._propertiesID.getOrAddWithFactory(fullName, () => new StringDictionary<number>());
            return d;
        }

        public static _getPropertyID(object: IPropertyChanged, propName: string): number {
            let otd = BindingHelper._getObjectTypePropertyIDs(object);

            // Make sure we have a WatchedPropertyData for this property of this object type. This will contains the flagIg of the watched property.
            // We use this flagId to flag for each watched instance which properties are watched, as final or intermediate and which directions are used
            let propData = otd.getOrAddWithFactory(propName, k => 1 << otd.count);

            return propData;
        }

        private static _propertiesID: StringDictionary<StringDictionary<number>> = new StringDictionary<StringDictionary<number>>();
        private static _monitoredObjects: StringDictionary<MonitoredObjectData> = new StringDictionary<MonitoredObjectData>();
    }


    @className("SmartPropertyPrim", "BABYLON")
    /**
     * Base class of the primitives, implementing core crosscutting features
     */
    export abstract class SmartPropertyPrim extends SmartPropertyBase {

        static SMARTPROPERTYPRIM_PROPCOUNT: number = 0;

        constructor() {
            super();
            this._flags = 0;
            this._modelKey = null;
            this._levelBoundingInfo = new BoundingInfo2D();
            this._boundingInfo = new BoundingInfo2D();
            this.animations = new Array<Animation>();
        }

        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        public dispose(): boolean {
            if (this.isDisposed) {
                return false;
            }

            super.dispose();

            // Don't set to null, it may upset somebody...
            this.animations.splice(0);

            return true;
        }

        /**
         * Animation array, more info: http://doc.babylonjs.com/tutorials/Animations
         */
        public animations: Animation[];

        /**
         * Returns as a new array populated with the Animatable used by the primitive. Must be overloaded by derived primitives.
         * Look at Sprite2D for more information
         */
        public getAnimatables(): IAnimatable[] {
            return new Array<IAnimatable>();
        }

        /**
         * Property giving the Model Key associated to the property.
         * This value is constructed from the type of the primitive and all the name/value of its properties declared with the modelLevelProperty decorator
         * @returns the model key string.
         */
        public get modelKey(): string {

            // No need to compute it?
            if (!this._isFlagSet(SmartPropertyPrim.flagModelDirty) && this._modelKey) {
                return this._modelKey;
            }

            let modelKey = `Class:${Tools.getClassName(this)};`;
            let propDic = this.propDic;
            propDic.forEach((k, v) => {
                if (v.kind === Prim2DPropInfo.PROPKIND_MODEL) {
                    let propVal = this[v.name];

                    // Special case, array, this WON'T WORK IN ALL CASES, all entries have to be of the same type and it must be a BJS well known one
                    if (propVal && propVal.constructor === Array) {
                        let firstVal = propVal[0];
                        if (!firstVal) {
                            propVal = 0;
                        } else {
                            propVal = Tools.hashCodeFromStream(Tools.arrayOrStringFeeder(propVal));
                        }
                    }

                    modelKey += v.name + ":" + ((propVal != null) ? ((v.typeLevelCompare) ? Tools.getClassName(propVal) : propVal.toString()) : "[null]") + ";";
                }
            });

            this._clearFlags(SmartPropertyPrim.flagModelDirty);
            this._modelKey = modelKey;

            return modelKey;
        }

        /**
         * States if the Primitive is dirty and should be rendered again next time.
         * @returns true is dirty, false otherwise
         */
        public get isDirty(): boolean {
            return (this._instanceDirtyFlags !== 0) || this._areSomeFlagsSet(SmartPropertyPrim.flagModelDirty | SmartPropertyPrim.flagPositioningDirty | SmartPropertyPrim.flagLayoutDirty);
        }

        protected _boundingBoxDirty() {
            this._setFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);

            // Escalate the dirty flag in the instance hierarchy, stop when a renderable group is found or at the end
            if (this instanceof Prim2DBase) {
                let curprim: Prim2DBase = (<any>this);
                while (curprim) {
                    curprim._setFlags(SmartPropertyPrim.flagBoundingInfoDirty);
                    if (curprim.isSizeAuto) {
                        curprim.onPrimitivePropertyDirty(Prim2DBase.sizeProperty.flagId);
                        curprim._setFlags(SmartPropertyPrim.flagPositioningDirty);
                    }

                    if (curprim instanceof Group2D) {
                        if (curprim.isRenderableGroup) {
                            break;
                        }
                    }

                    curprim = curprim.parent;
                }
            }
        }

        protected _handlePropChanged<T>(curValue: T, newValue: T, propName: string, propInfo: Prim2DPropInfo, typeLevelCompare: boolean) {

            super._handlePropChanged(curValue, newValue, propName, propInfo, typeLevelCompare);

            // If the property change also dirty the boundingInfo, update the boundingInfo dirty flags
            if (propInfo.dirtyBoundingInfo) {
                this._boundingBoxDirty();
            } else if (propInfo.dirtyParentBoundingInfo) {
                let p: SmartPropertyPrim = (<any>this)._parent;
                if (p != null) {
                    p._boundingBoxDirty();
                }
            }

            // If the property belong to a group, check if it's a cached one, and dirty its render sprite accordingly
            if (this instanceof Group2D) {
                this.handleGroupChanged(propInfo);
            }

            // Check for parent layout dirty
            if (this instanceof Prim2DBase) {
                let p = (<any>this)._parent;
                if (p != null && p.layoutEngine && (p.layoutEngine.layoutDirtyOnPropertyChangedMask & propInfo.flagId) !== 0) {
                    p._setLayoutDirty();
                }
            }

            // For type level compare, if there's a change of type it's a change of model, otherwise we issue an instance change
            var instanceDirty = false;
            if (typeLevelCompare && curValue != null && newValue != null) {
                var cvProto = (<any>curValue).__proto__;
                var nvProto = (<any>newValue).__proto__;

                instanceDirty = (cvProto === nvProto);
            }

            // Set the dirty flags
            if (!instanceDirty && (propInfo.kind === Prim2DPropInfo.PROPKIND_MODEL)) {
                if (!this.isDirty) {
                    this._setFlags(SmartPropertyPrim.flagModelDirty);
                }
            } else if (instanceDirty || (propInfo.kind === Prim2DPropInfo.PROPKIND_INSTANCE) || (propInfo.kind === Prim2DPropInfo.PROPKIND_DYNAMIC)) {
                let propMask = propInfo.flagId;
                this.onPrimitivePropertyDirty(propMask);
            }
        }

        protected onPrimitivePropertyDirty(propFlagId: number) {
            this.onPrimBecomesDirty();
            this._instanceDirtyFlags |= propFlagId;
        }

        protected handleGroupChanged(prop: Prim2DPropInfo) {

        }

        public _resetPropertiesDirty() {
            super._resetPropertiesDirty();
            this._clearFlags(SmartPropertyPrim.flagPrimInDirtyList | SmartPropertyPrim.flagNeedRefresh);
        }

        /**
         * Retrieve the boundingInfo for this Primitive, computed based on the primitive itself and NOT its children
         */
        public get levelBoundingInfo(): BoundingInfo2D {
            if (this._isFlagSet(SmartPropertyPrim.flagLevelBoundingInfoDirty)) {
                this.updateLevelBoundingInfo();
                this._clearFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);
            }
            return this._levelBoundingInfo;
        }

        /**
         * This method must be overridden by a given Primitive implementation to compute its boundingInfo
         */
        protected updateLevelBoundingInfo() {

        }

        /**
         * Property method called when the Primitive becomes dirty
         */
        protected onPrimBecomesDirty() {

        }

        /**
         * Check if a given flag is set
         * @param flag the flag value
         * @return true if set, false otherwise
         */
        public _isFlagSet(flag: number): boolean {
            return (this._flags & flag) !== 0;
        }

        /**
         * Check if all given flags are set
         * @param flags the flags ORed
         * @return true if all the flags are set, false otherwise
         */
        public _areAllFlagsSet(flags: number): boolean {
            return (this._flags & flags) === flags;
        }

        /**
         * Check if at least one flag of the given flags is set
         * @param flags the flags ORed
         * @return true if at least one flag is set, false otherwise
         */
        public _areSomeFlagsSet(flags: number): boolean {
            return (this._flags & flags) !== 0;
        }

        /**
         * Clear the given flags
         * @param flags the flags to clear
         */
        public _clearFlags(flags: number) {
            this._flags &= ~flags;
        }

        /**
         * Set the given flags to true state
         * @param flags the flags ORed to set
         * @return the flags state before this call
         */
        public _setFlags(flags: number): number {
            let cur = this._flags;
            this._flags |= flags;
            return cur;
        }

        /**
         * Change the state of the given flags
         * @param flags the flags ORed to change
         * @param state true to set them, false to clear them
         */
        public _changeFlags(flags: number, state: boolean) {
            if (state) {
                this._flags |= flags;
            } else {
                this._flags &= ~flags;
            }
        }

        public static flagFREE001                  = 0x0000001;    // set if the object is already disposed
        public static flagLevelBoundingInfoDirty  = 0x0000002;    // set if the primitive's level bounding box (not including children) is dirty
        public static flagModelDirty              = 0x0000004;    // set if the model must be changed
        public static flagLayoutDirty             = 0x0000008;    // set if the layout must be computed
        public static flagLevelVisible            = 0x0000010;    // set if the primitive is set as visible for its level only
        public static flagBoundingInfoDirty       = 0x0000020;    // set if the primitive's overall bounding box (including children) is dirty
        public static flagIsPickable              = 0x0000040;    // set if the primitive can be picked during interaction
        public static flagIsVisible               = 0x0000080;    // set if the primitive is concretely visible (use the levelVisible of parents)
        public static flagVisibilityChanged       = 0x0000100;    // set if there was a transition between visible/hidden status
        public static flagPositioningDirty        = 0x0000200;    // set if the primitive positioning must be computed
        public static flagTrackedGroup            = 0x0000400;    // set if the group2D is tracking a scene node
        public static flagWorldCacheChanged       = 0x0000800;    // set if the cached bitmap of a world space canvas changed
        public static flagChildrenFlatZOrder      = 0x0001000;    // set if all the children (direct and indirect) will share the same Z-Order
        public static flagZOrderDirty             = 0x0002000;    // set if the Z-Order for this prim and its children must be recomputed
        public static flagActualOpacityDirty      = 0x0004000;    // set if the actualOpactity should be recomputed
        public static flagPrimInDirtyList         = 0x0008000;    // set if the primitive is in the primDirtyList
        public static flagIsContainer             = 0x0010000;    // set if the primitive is a container
        public static flagNeedRefresh             = 0x0020000;    // set if the primitive wasn't successful at refresh
        public static flagActualScaleDirty        = 0x0040000;    // set if the actualScale property needs to be recomputed
        public static flagDontInheritParentScale  = 0x0080000;    // set if the actualScale must not use its parent's scale to be computed
        public static flagGlobalTransformDirty    = 0x0100000;    // set if the global transform must be recomputed due to a local transform change
        public static flagLayoutBoundingInfoDirty = 0x0100000;    // set if the layout bounding info is dirty

        private   _flags              : number;
        private   _modelKey           : string;
        protected _levelBoundingInfo  : BoundingInfo2D;
        protected _boundingInfo       : BoundingInfo2D;
        protected _layoutBoundingInfo : BoundingInfo2D;
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

        propertyChanged = new Observable<PropertyChangedInfo>();

        private static pci = new PropertyChangedInfo();
        private static calling: boolean = false;
    }

    export function dependencyProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, mode = Binding.MODE_TWOWAY, updateSourceTrigger = Binding.UPDATESOURCETRIGGER_PROPERTYCHANGED): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { bindingMode: mode, bindingUpdateSourceTrigger: updateSourceTrigger });
    }

    export function modelLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare = false, dirtyBoundingInfo = false, dirtyParentBoundingBox = false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_MODEL, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }

    export function instanceLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare = false, dirtyBoundingInfo = false, dirtyParentBoundingBox = false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_INSTANCE, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }

    export function dynamicLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare = false, dirtyBoundingInfo = false, dirtyParentBoundingBox = false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyBase._hookProperty(propId, piStore, Prim2DPropInfo.PROPKIND_DYNAMIC, { typeLevelCompare: typeLevelCompare, dirtyBoundingInfo: dirtyBoundingInfo, dirtyParentBoundingBox: dirtyParentBoundingBox });
    }
}