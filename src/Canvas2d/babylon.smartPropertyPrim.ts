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
        typeLevelCompare: boolean;
    }

    export class PropertyChangedInfo {
        oldValue: any;
        newValue: any;
        propertyName: string;
    }

    export interface IPropertyChanged {
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

    @className("SmartPropertyPrim")
    export class SmartPropertyPrim implements IPropertyChanged {

        constructor() {
            this._flags = 0;
            this._modelKey = null;
            this._instanceDirtyFlags = 0;
            this._levelBoundingInfo = new BoundingInfo2D();
            this.animations = new Array<Animation>();
        }

        /**
         * An observable that is triggered when a property (using of the XXXXLevelProperty decorator) has its value changing.
         * You can add an observer that will be triggered only for a given set of Properties using the Mask feature of the Observable and the corresponding Prim2DPropInfo.flagid value (e.g. Prim2DBase.positionProperty.flagid|Prim2DBase.rotationProperty.flagid to be notified only about position or rotation change)
         */
        public propertyChanged: Observable<PropertyChangedInfo>;

        /**
         * Check if the object is disposed or not.
         * @returns true if the object is dispose, false otherwise.
         */
        public get isDisposed(): boolean {
            return this._isFlagSet(SmartPropertyPrim.flagIsDisposed);
        }

        /**
         * Disposable pattern, this method must be overloaded by derived types in order to clean up hardware related resources.
         * @returns false if the object is already dispose, true otherwise. Your implementation must call super.dispose() and check for a false return and return immediately if it's the case.
         */
        public dispose(): boolean {
            if (this.isDisposed) {
                return false;
            }

            // Don't set to null, it may upset somebody...
            this.animations.splice(0);

            this._setFlags(SmartPropertyPrim.flagIsDisposed);
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

        /**
         * Access the dictionary of properties metadata. Only properties decorated with XXXXLevelProperty are concerned
         * @returns the dictionary, the key is the property name as declared in Javascript, the value is the metadata object
         */
        private get propDic(): StringDictionary<Prim2DPropInfo> {
            if (!this._propInfo) {
                let cti = ClassTreeInfo.get<Prim2DClassInfo, Prim2DPropInfo>(Object.getPrototypeOf(this));
                if (!cti) {
                    throw new Error("Can't access the propDic member in class definition, is this class SmartPropertyPrim based?");
                }
                this._propInfo = cti.fullContent;
            }

            return this._propInfo;
        }

        private static _createPropInfo(target: Object, propName: string, propId: number, dirtyBoundingInfo: boolean, typeLevelCompare: boolean, kind: number): Prim2DPropInfo {
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
            propInfo.dirtyBoundingInfo = dirtyBoundingInfo;
            propInfo.typeLevelCompare = typeLevelCompare;
            node.levelContent.add(propName, propInfo);

            return propInfo;
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

        public markAsDirty(propertyName: string) {
            if (this.isDisposed) {
                return;
            }

            let i = propertyName.indexOf(".");
            if (i !== -1) {
                propertyName = propertyName.substr(0, i);
            }

            var propInfo = this.propDic.get(propertyName);
            if (!propInfo) {
                return;
            }

            var newValue = this[propertyName];
            this._handlePropChanged(undefined, newValue, propertyName, propInfo, propInfo.typeLevelCompare);
        }

        private _handlePropChanged<T>(curValue: T, newValue: T, propName: string, propInfo: Prim2DPropInfo, typeLevelCompare: boolean) {
            // If the property change also dirty the boundingInfo, update the boundingInfo dirty flags
            if (propInfo.dirtyBoundingInfo) {
                this._setFlags(SmartPropertyPrim.flagLevelBoundingInfoDirty);

                // Escalate the dirty flag in the instance hierarchy, stop when a renderable group is found or at the end
                if (this instanceof Prim2DBase) {
                    let curprim = (<any>this).parent;
                    while (curprim) {
                        curprim._boundingInfoDirty = true;

                        if (curprim instanceof Group2D) {
                            if (curprim.isRenderableGroup) {
                                break;
                            }
                        }

                        curprim = curprim.parent;
                    }
                }
            }

            // Trigger property changed
            let info = SmartPropertyPrim.propChangedInfo;
            info.oldValue = curValue;
            info.newValue = newValue;
            info.propertyName = propName;
            let propMask = propInfo.flagId;
            this.propertyChanged.notifyObservers(info, propMask);

            // If the property belong to a group, check if it's a cached one, and dirty its render sprite accordingly
            if (this instanceof Group2D) {
                this.handleGroupChanged(propInfo);
            }

            // Check if we need to dirty only if the type change and make the test
            var skipDirty = false;
            if (typeLevelCompare && curValue != null && newValue != null) {
                var cvProto = (<any>curValue).__proto__;
                var nvProto = (<any>newValue).__proto__;

                skipDirty = (cvProto === nvProto);
            }

            // Set the dirty flags
            if (!skipDirty) {
                if (propInfo.kind === Prim2DPropInfo.PROPKIND_MODEL) {
                    if (!this.isDirty) {
                        this.onPrimBecomesDirty();
                    }
                    this._setFlags(SmartPropertyPrim.flagModelDirty);
                } else if ((propInfo.kind === Prim2DPropInfo.PROPKIND_INSTANCE) || (propInfo.kind === Prim2DPropInfo.PROPKIND_DYNAMIC)) {
                    if (!this.isDirty) {
                        this.onPrimBecomesDirty();
                    }
                    this._instanceDirtyFlags |= propMask;
                }
            }
        }

        protected handleGroupChanged(prop: Prim2DPropInfo) {

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
         * Retrieve the boundingInfo for this Primitive, computed based on the primitive itself and NOT its children
         * @returns {} 
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

        static _hookProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare: boolean, dirtyBoundingInfo: boolean, kind: number): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
            return (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {

                var propInfo = SmartPropertyPrim._createPropInfo(target, <string>propName, propId, dirtyBoundingInfo, typeLevelCompare, kind);
                if (piStore) {
                    piStore(propInfo);
                }
                let getter = descriptor.get, setter = descriptor.set;

                // Overload the property setter implementation to add our own logic
                descriptor.set = function (val) {
                    // check for disposed first, do nothing
                    if (this.isDisposed) {
                        return;
                    }

                    let curVal = getter.call(this);

                    if (SmartPropertyPrim._checkUnchanged(curVal, val)) {
                        return;
                    }

                    // Cast the object we're working one
                    let prim = <SmartPropertyPrim>this;

                    // Change the value
                    setter.call(this, val);

                    // Notify change, dirty flags update
                    prim._handlePropChanged(curVal, val, <string>propName, propInfo, typeLevelCompare);
                }
            }
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

        public _isFlagSet(flag: number): boolean {
            return (this._flags & flag) !== 0;
        }

        public _areAllFlagsSet(flags: number): boolean {
            return (this._flags & flags) === flags;
        }

        public _areSomeFlagsSet(flags: number): boolean {
            return (this._flags & flags) !== 0;
        }

        public _clearFlags(flags: number) {
            this._flags &= ~flags;
        }

        public _setFlags(flags: number): number {
            let cur = this._flags;
            this._flags |= flags;
            return cur;
        }

        public _changeFlags(flags: number, state: boolean) {
            if (state) {
                this._flags |= flags;
            } else {
                this._flags &= ~flags;
            }
        }

        public static flagIsDisposed             = 0x0000001;    // set if the object is already disposed
        public static flagLevelBoundingInfoDirty = 0x0000002;    // set if the primitive's level bounding box (not including children) is dirty
        public static flagModelDirty             = 0x0000004;    // set if the model must be changed
        public static flagLayoutDirty            = 0x0000008;    // set if the layout must be computed
        public static flagLevelVisible           = 0x0000010;    // set if the primitive is set as visible for its level only
        public static flagBoundingInfoDirty      = 0x0000020;    // set if the primitive's overall bounding box (including children) is dirty
        public static flagIsPickable             = 0x0000040;    // set if the primitive can be picked during interaction
        public static flagIsVisible              = 0x0000080;    // set if the primitive is concretely visible (use the levelVisible of parents)
        public static flagVisibilityChanged      = 0x0000100;    // set if there was a transition between visible/hidden status
        public static flagPositioningDirty       = 0x0000200;    // set if the primitive positioning must be computed

        private   _flags             : number;
        private   _externalData      : StringDictionary<Object>;
        private   _modelKey          : string;
        private   _propInfo          : StringDictionary<Prim2DPropInfo>;
        protected _levelBoundingInfo : BoundingInfo2D;
        protected _boundingInfo      : BoundingInfo2D;
        protected _instanceDirtyFlags: number;
    }

    export function modelLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare = false, dirtyBoundingInfo = false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyPrim._hookProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, Prim2DPropInfo.PROPKIND_MODEL);
    }

    export function instanceLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare = false, dirtyBoundingInfo = false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyPrim._hookProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, Prim2DPropInfo.PROPKIND_INSTANCE);
    }

    export function dynamicLevelProperty<T>(propId: number, piStore: (pi: Prim2DPropInfo) => void, typeLevelCompare = false, dirtyBoundingInfo = false): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return SmartPropertyPrim._hookProperty(propId, piStore, typeLevelCompare, dirtyBoundingInfo, Prim2DPropInfo.PROPKIND_DYNAMIC);
    }
}