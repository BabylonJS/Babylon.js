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
                let info = { type: type, node: node};
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
        private _subClasses: Array<{type: Object, node: ClassTreeInfo<TClass, TProp>}>;
        private _levelContent: StringDictionary<TProp>;
        private _fullContent: StringDictionary<TProp>;
        private _classContentFactory: (base: TClass) => TClass;
    }

    @className("SmartPropertyPrim")
    export class SmartPropertyPrim implements IPropertyChanged {

        protected setupSmartPropertyPrim() {
            this._modelKey = null;
            this._modelDirty = false;
            this._levelBoundingInfoDirty = false;
            this._instanceDirtyFlags = 0;
            this._isDisposed = false;
            this._levelBoundingInfo = new BoundingInfo2D();
        }

        public propertyChanged: Observable<PropertyChangedInfo>;

        public get isDisposed(): boolean {
            return this._isDisposed;
        }

        public dispose(): boolean {
            if (this.isDisposed) {
                return false;
            }

            this._isDisposed = true;
            return true;
        }

        public get modelKey(): string {

            // No need to compute it?
            if (!this._modelDirty && this._modelKey) {
                return this._modelKey;
            }

            let modelKey = `Class:${Tools.getClassName(this)};`;
            let propDic = this.propDic;
            propDic.forEach((k, v) => {
                if (v.kind === Prim2DPropInfo.PROPKIND_MODEL) {
                    let propVal = this[v.name];
                    modelKey += v.name + ":" + ((propVal != null) ? ((v.typeLevelCompare) ? Tools.getClassName(propVal) : propVal.toString()) : "[null]") + ";";
                }
            });

            this._modelDirty = false;
            this._modelKey = modelKey;

            return modelKey;
        }

        public get isDirty(): boolean {
            return (this._instanceDirtyFlags !== 0) || this._modelDirty;
        }

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
            node.levelContent.add(propId.toString(), propInfo);

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

        private _handlePropChanged<T>(curValue: T, newValue: T, propName: string, propInfo: Prim2DPropInfo, typeLevelCompare: boolean) {
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
                    this._modelDirty = true;
                } else if (propInfo.kind === Prim2DPropInfo.PROPKIND_INSTANCE) {
                    if (!this.isDirty) {
                        this.onPrimBecomesDirty();
                    }
                    this._instanceDirtyFlags |= propMask;
                }
            }
        }

        protected handleGroupChanged(prop: Prim2DPropInfo) {

        }

        public checkPropertiesDirty(flags: number): boolean {
            return (this._instanceDirtyFlags & flags) !== 0;
        }

        protected clearPropertiesDirty(flags: number): number {
            this._instanceDirtyFlags &= ~flags;
            return this._instanceDirtyFlags;
        }

        public get levelBoundingInfo(): BoundingInfo2D {
            if (this._levelBoundingInfoDirty) {
                this.updateLevelBoundingInfo();
                this._levelBoundingInfoDirty = false;
            }
            return this._levelBoundingInfo;
        }

        protected updateLevelBoundingInfo() {

        }

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

                    // If the property change also dirty the boundingInfo, update the boundingInfo dirty flags
                    if (propInfo.dirtyBoundingInfo) {
                        prim._levelBoundingInfoDirty = true;

                        // Escalate the dirty flag in the instance hierarchy, stop when a renderable group is found or at the end
                        if (prim instanceof Prim2DBase) {
                            let curprim = prim.parent;
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

                    // Notify change, dirty flags update
                    prim._handlePropChanged(curVal, val, <string>propName, propInfo, typeLevelCompare);
                }
            }
        }

        private _modelKey; string;
        private _propInfo: StringDictionary<Prim2DPropInfo>;
        private _levelBoundingInfoDirty: boolean;
        private _isDisposed: boolean;
        protected _levelBoundingInfo: BoundingInfo2D;
        protected _boundingInfo: BoundingInfo2D;
        protected _modelDirty: boolean;
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