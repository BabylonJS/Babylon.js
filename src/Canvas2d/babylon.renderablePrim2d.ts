module BABYLON {
    export class InstanceClassInfo {
        constructor(base: InstanceClassInfo) {
            this._baseInfo = base;
            this._nextOffset = new StringDictionary<number>();
            this._attributes = new Array<InstancePropInfo>();
        }

        mapProperty(propInfo: InstancePropInfo, push: boolean) {
            let curOff = this._nextOffset.getOrAdd(InstanceClassInfo._CurCategories, 0);
            propInfo.instanceOffset.add(InstanceClassInfo._CurCategories, this._getBaseOffset(InstanceClassInfo._CurCategories) + curOff);
            //console.log(`[${InstanceClassInfo._CurCategories}] New PropInfo. Category: ${propInfo.category}, Name: ${propInfo.attributeName}, Offset: ${propInfo.instanceOffset.get(InstanceClassInfo._CurCategories)}, Size: ${propInfo.size / 4}`);

            this._nextOffset.set(InstanceClassInfo._CurCategories, curOff + (propInfo.size / 4));

            if (push) {
                this._attributes.push(propInfo);
            }
        }

        getInstancingAttributeInfos(effect: Effect, categories: string[]): InstancingAttributeInfo[] {
            let catInline = ";" + categories.join(";") + ";";
            let res = new Array<InstancingAttributeInfo>();
            let curInfo: InstanceClassInfo = this;
            while (curInfo) {
                for (let attrib of curInfo._attributes) {
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        let index = effect.getAttributeLocationByName(attrib.attributeName);
                        let iai = new InstancingAttributeInfo();
                        iai.index = index;
                        iai.attributeSize = attrib.size / 4; // attrib.size is in byte and we need to store in "component" (i.e float is 1, vec3 is 3)
                        iai.offset = attrib.instanceOffset.get(catInline) * 4; // attrib.instanceOffset is in float, iai.offset must be in bytes
                        iai.attributeName = attrib.attributeName;
                        res.push(iai);
                    }
                }

                curInfo = curInfo._baseInfo;
            }
            return res;
        }

        getShaderAttributes(categories: string[]): string[] {
            let res = new Array<string>();
            let curInfo: InstanceClassInfo = this;
            while (curInfo) {
                for (let attrib of curInfo._attributes) {
                    // Only map if there's no category assigned to the instance data or if there's a category and it's in the given list
                    if (!attrib.category || categories.indexOf(attrib.category) !== -1) {
                        res.push(attrib.attributeName);
                    }
                }

                curInfo = curInfo._baseInfo;
            }
            return res;
        }

        private _getBaseOffset(categories: string): number {
            let curOffset = 0;
            let curBase = this._baseInfo;
            while (curBase) {
                curOffset += curBase._nextOffset.getOrAdd(categories, 0);
                curBase = curBase._baseInfo;
            }
            return curOffset;
        }

        static _CurCategories: string;
        private _baseInfo: InstanceClassInfo;
        private _nextOffset: StringDictionary<number>;
        private _attributes: Array<InstancePropInfo>;
    }

    export class InstancePropInfo {
        attributeName: string;
        category: string;
        size: number;
        shaderOffset: number;
        instanceOffset: StringDictionary<number>;
        dataType: ShaderDataType;
        //uniformLocation: WebGLUniformLocation;

        delimitedCategory: string;

        constructor() {
            this.instanceOffset = new StringDictionary<number>();
        }

        setSize(val) {
            if (val instanceof Vector2) {
                this.size = 8;
                this.dataType = ShaderDataType.Vector2;
                return;
            }
            if (val instanceof Vector3) {
                this.size = 12;
                this.dataType = ShaderDataType.Vector3;
                return;
            }
            if (val instanceof Vector4) {
                this.size = 16;
                this.dataType = ShaderDataType.Vector4;
                return;
            }
            if (val instanceof Matrix) {
                throw new Error("Matrix type is not supported by WebGL Instance Buffer, you have to use four Vector4 properties instead");
            }
            if (typeof (val) === "number") {
                this.size = 4;
                this.dataType = ShaderDataType.float;
                return;
            }
            if (val instanceof Color3) {
                this.size = 12;
                this.dataType = ShaderDataType.Color3;
                return;
            }
            if (val instanceof Color4) {
                this.size = 16;
                this.dataType = ShaderDataType.Color4;
                return;
            }
            if (val instanceof Size) {
                this.size = 8;
                this.dataType = ShaderDataType.Size;
                return;
            }            return;
        }

        writeData(array: Float32Array, offset: number, val) {
            switch (this.dataType) {
                case ShaderDataType.Vector2:
                    {
                        let v = <Vector2>val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        break;
                    }
                case ShaderDataType.Vector3:
                    {
                        let v = <Vector3>val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        break;
                    }
                case ShaderDataType.Vector4:
                    {
                        let v = <Vector4>val;
                        array[offset + 0] = v.x;
                        array[offset + 1] = v.y;
                        array[offset + 2] = v.z;
                        array[offset + 3] = v.w;
                        break;
                    }
                case ShaderDataType.Color3:
                    {
                        let v = <Color3>val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        break;
                    }
                case ShaderDataType.Color4:
                    {
                        let v = <Color4>val;
                        array[offset + 0] = v.r;
                        array[offset + 1] = v.g;
                        array[offset + 2] = v.b;
                        array[offset + 3] = v.a;
                        break;
                    }
                case ShaderDataType.float:
                    {
                        let v = <number>val;
                        array[offset] = v;
                        break;
                    }
                case ShaderDataType.Matrix:
                    {
                        let v = <Matrix>val;
                        for (let i = 0; i < 16; i++) {
                            array[offset + i] = v.m[i];
                        }
                        break;
                    }
                case ShaderDataType.Size:
                    {
                        let s = <Size>val;
                        array[offset + 0] = s.width;
                        array[offset + 1] = s.height;
                        break;
                    }
            }
        }
    }

    export function instanceData<T>(category?: string, shaderAttributeName?: string): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {

            let dic = ClassTreeInfo.getOrRegister<InstanceClassInfo, InstancePropInfo>(target, (base) => new InstanceClassInfo(base));
            let node = dic.getLevelOf(target);
            let instanceDataName = <string>propName;
            shaderAttributeName = shaderAttributeName || instanceDataName;


            let info = node.levelContent.get(instanceDataName);
            if (info) {
                throw new Error(`The ID ${instanceDataName} is already taken by another instance data`);
            }

            info = new InstancePropInfo();
            info.attributeName = shaderAttributeName;
            info.category = category || null;
            if (info.category) {
                info.delimitedCategory = ";" + info.category + ";";
            }

            node.levelContent.add(instanceDataName, info);

            descriptor.get = function () {
                return null;
            }

            descriptor.set = function (val) {
                // Check that we're not trying to set a property that belongs to a category that is not allowed (current)
                // Quit if it's the case, otherwise we could overwrite data somewhere...
                if (info.category && InstanceClassInfo._CurCategories.indexOf(info.delimitedCategory) === -1) {
                    return;
                }
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info, true);
                } else if (!info.instanceOffset.contains(InstanceClassInfo._CurCategories)) {
                    node.classContent.mapProperty(info, false);
                }

                let obj: InstanceDataBase = this;
                if (obj.dataBuffer && obj.dataElements) {
                    let offset = obj.dataElements[obj.curElement].offset + info.instanceOffset.get(InstanceClassInfo._CurCategories);
                    info.writeData(obj.dataBuffer.buffer, offset, val);
                }
            }

        }
    }

    export class InstanceDataBase {
        constructor(partId: number, dataElementCount: number) {
            this.id = partId;
            this.curElement = 0;
            this._dataElementCount = dataElementCount;
            this.renderMode = 0;
            this.arrayLengthChanged = false;
        }

        id: number;
        isVisible: boolean;

        @instanceData()
        get zBias(): Vector2 {
            return null;
        }
        set zBias(value: Vector2) {
        }


        @instanceData()
        get transformX(): Vector4 {
            return null;
        }
        set transformX(value: Vector4) {
        }

        @instanceData()
        get transformY(): Vector4 {
            return null;
        }
        set transformY(value: Vector4) {
        }

        @instanceData()
        get opacity(): number {
            return null;
        }
        set opacity(value: number) {
        }

        getClassTreeInfo(): ClassTreeInfo<InstanceClassInfo, InstancePropInfo> {
            if (!this.typeInfo) {
                this.typeInfo = ClassTreeInfo.get<InstanceClassInfo, InstancePropInfo>(Object.getPrototypeOf(this));
            }
            return this.typeInfo;
        }

        allocElements() {
            if (!this.dataBuffer || this.dataElements) {
                return;
            }
            let res = new Array<DynamicFloatArrayElementInfo>(this.dataElementCount);
            for (let i = 0; i < this.dataElementCount; i++) {
                res[i] = this.dataBuffer.allocElement();
            }
            this.dataElements = res;
        }

        freeElements() {
            if (!this.dataElements) {
                return;
            }
            for (let ei of this.dataElements) {
                this.dataBuffer.freeElement(ei);
            }
            this.dataElements = null;
        }

        get dataElementCount(): number {
            return this._dataElementCount;
        }

        set dataElementCount(value: number) {
            if (value === this._dataElementCount) {
                return;
            }

            this.arrayLengthChanged = true;
            this.freeElements();
            this._dataElementCount = value;
            this.allocElements();
        }
        groupInstanceInfo: GroupInstanceInfo;
        arrayLengthChanged: boolean;
        curElement: number;
        renderMode: number;
        dataElements: DynamicFloatArrayElementInfo[];
        dataBuffer: DynamicFloatArray;
        typeInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>;

        private _dataElementCount: number;
    }

    @className("RenderablePrim2D")
    /**
     * The abstract class for primitive that render into the Canvas2D
     */
    export abstract class RenderablePrim2D extends Prim2DBase {
        static RENDERABLEPRIM2D_PROPCOUNT: number = Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;

        public static isAlphaTestProperty: Prim2DPropInfo;
        public static isTransparentProperty: Prim2DPropInfo;

        @dynamicLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 0, pi => RenderablePrim2D.isAlphaTestProperty = pi)
        /**
         * Get/set if the Primitive is from the AlphaTest rendering category.
         * The AlphaTest category is the rendering pass with alpha blend, depth compare and write activated.
         * Primitives that render with an alpha mask should be from this category.
         * The setter should be used only by implementers of new primitive type.
         */
        public get isAlphaTest(): boolean {
            return this._useTextureAlpha() || this._isPrimAlphaTest();
        }

        @dynamicLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, pi => RenderablePrim2D.isTransparentProperty = pi)
        /**
         * Get/set if the Primitive is from the Transparent rendering category.
         * The setter should be used only by implementers of new primitive type.
         */
        public get isTransparent(): boolean {
            return (this.actualOpacity<1) || this._shouldUseAlphaFromTexture() || this._isPrimTransparent();
        }

        public get renderMode(): number {
            return this._renderMode;
        }

        constructor(settings?: {
            parent       ?: Prim2DBase, 
            id           ?: string,
            origin       ?: Vector2,
            isVisible    ?: boolean,
        }) {
            super(settings);

            this._transparentPrimitiveInfo = null;
        }

        /**
         * Dispose the primitive and its resources, remove it from its parent
         */
        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this.renderGroup) {
                this.renderGroup._setCacheGroupDirty();
            }

            if (this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                this._transparentPrimitiveInfo = null;
            }

            if (this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }

            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
                this._modelRenderCache = null;
            }

            if (this._instanceDataParts) {
                this._instanceDataParts.forEach(p => {
                    p.freeElements();
                });
                this._instanceDataParts = null;
            }

            return true;
        }

        private _cleanupInstanceDataParts() {
            let gii: GroupInstanceInfo = null;
            for (let part of this._instanceDataParts) {
                part.freeElements();
                gii = part.groupInstanceInfo;
            }
            if (gii) {
                let usedCount = 0;
                if (gii.hasOpaqueData) {
                    let od = gii.opaqueData[0];
                    usedCount += od._partData.usedElementCount;
                    gii.opaqueDirty = true;
                }
                if (gii.hasAlphaTestData) {
                    let atd = gii.alphaTestData[0];
                    usedCount += atd._partData.usedElementCount;
                    gii.alphaTestDirty = true;
                }
                if (gii.hasTransparentData) {
                    let td = gii.transparentData[0];
                    usedCount += td._partData.usedElementCount;
                    gii.transparentDirty = true;
                }

                if (usedCount === 0 && gii.modelRenderCache!=null) {
                    this.renderGroup._renderableData._renderGroupInstancesInfo.remove(gii.modelRenderCache.modelKey);
                    gii.dispose();
                }

                if (this._modelRenderCache) {
                    this._modelRenderCache.dispose();
                    this._modelRenderCache = null;
                }

            }
            this._instanceDataParts = null;
        }

        public _prepareRenderPre(context: PrepareRender2DContext) {
            super._prepareRenderPre(context);

            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._isFlagSet(SmartPropertyPrim.flagModelDirty) && this._instanceDataParts) {
                this._cleanupInstanceDataParts();
            }

            // Need to create the model?
            let setupModelRenderCache = false;
            if (!this._modelRenderCache || this._isFlagSet(SmartPropertyPrim.flagModelDirty)) {
                setupModelRenderCache = this._createModelRenderCache();
            }

            let gii: GroupInstanceInfo = null;
            let newInstance = false;

            // Need to create the instance data parts?
            if (!this._instanceDataParts) {
                // Yes, flag it for later, more processing will have to be done
                newInstance = true;
                gii = this._createModelDataParts();
            }

            // If the ModelRenderCache is brand new, now is the time to call the implementation's specific setup method to create the rendering resources
            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }

            // At this stage we have everything correctly initialized, ModelRenderCache is setup, Model Instance data are good too, they have allocated elements in the Instanced DynamicFloatArray.

            // The last thing to do is check if the instanced related data must be updated because a InstanceLevel property had changed or the primitive visibility changed.
            if (this._areSomeFlagsSet(SmartPropertyPrim.flagVisibilityChanged | SmartPropertyPrim.flagNeedRefresh) || context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep) || this._mustUpdateInstance()) {

                this._updateInstanceDataParts(gii);
            }
        }

        private _createModelRenderCache(): boolean {
            let setupModelRenderCache = false;

            if (this._modelRenderCache) {
                this._modelRenderCache.dispose();
            }
            this._modelRenderCache = this.owner._engineData.GetOrAddModelCache(this.modelKey, (key: string) => {
                let mrc = this.createModelRenderCache(key);
                setupModelRenderCache = true;
                return mrc;
            });
            this._clearFlags(SmartPropertyPrim.flagModelDirty);

            // if this is still false it means the MRC already exists, so we add a reference to it
            if (!setupModelRenderCache) {
                this._modelRenderCache.addRef();
            }

            return setupModelRenderCache;
        }

        private _createModelDataParts(): GroupInstanceInfo {
            // Create the instance data parts of the primitive and store them
            let parts = this.createInstanceDataParts();
            this._instanceDataParts = parts;

            // Check if the ModelRenderCache for this particular instance is also brand new, initialize it if it's the case
            if (!this._modelRenderCache._partData) {
                this._setupModelRenderCache(parts);
            }

            // The Rendering resources (Effect, VB, IB, Textures) are stored in the ModelRenderCache
            // But it's the RenderGroup that will store all the Instanced related data to render all the primitive it owns.
            // So for a given ModelKey we getOrAdd a GroupInstanceInfo that will store all these data
            let gii = this.renderGroup._renderableData._renderGroupInstancesInfo.getOrAddWithFactory(this.modelKey, k => {

                let res = new GroupInstanceInfo(this.renderGroup, this._modelRenderCache, this._modelRenderCache._partData.length);

                for (let j = 0; j < this._modelRenderCache._partData.length; j++) {
                    let part = this._instanceDataParts[j];
                    res.partIndexFromId.add(part.id.toString(), j);
                    res.usedShaderCategories[j] = ";" + this.getUsedShaderCategories(part).join(";") + ";";
                    res.strides[j] = this._modelRenderCache._partData[j]._partDataStride;
                }

                return res;
            });

            // Get the GroupInfoDataPart corresponding to the render category of the part
            let rm = 0;
            let gipd: GroupInfoPartData[] = null;
            if (this.isTransparent) {
                gipd = gii.transparentData;
                rm = Render2DContext.RenderModeTransparent;
            } else if (this.isAlphaTest) {
                gipd = gii.alphaTestData;
                rm = Render2DContext.RenderModeAlphaTest;
            } else {
                gipd = gii.opaqueData;
                rm = Render2DContext.RenderModeOpaque;
            }

            // For each instance data part of the primitive, allocate the instanced element it needs for render
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i];
                part.dataBuffer = gipd[i]._partData;
                part.allocElements();
                part.renderMode = rm;
                part.groupInstanceInfo = gii;
            }

            return gii;
        }

        private _setupModelRenderCache(parts: InstanceDataBase[]) {
            let ctiArray = new Array<ClassTreeInfo<InstanceClassInfo, InstancePropInfo>>();
            this._modelRenderCache._partData = new Array<ModelRenderCachePartData>();
            for (let dataPart of parts) {
                var pd = new ModelRenderCachePartData();
                this._modelRenderCache._partData.push(pd)
                var cat = this.getUsedShaderCategories(dataPart);
                var cti = dataPart.getClassTreeInfo();
                // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                let curVisible = this.isVisible;
                this.isVisible = true;
                // We manually trigger refreshInstanceData for the only sake of evaluating each instance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                var joinCat = ";" + cat.join(";") + ";";
                pd._partJoinedUsedCategories = joinCat;
                InstanceClassInfo._CurCategories = joinCat;
                let obj = this.beforeRefreshForLayoutConstruction(dataPart);
                if (!this.refreshInstanceDataPart(dataPart)) {
                    console.log(`Layout construction for ${Tools.getClassName(this._instanceDataParts[0])} failed because refresh returned false`);
                }
                this.afterRefreshForLayoutConstruction(dataPart, obj);
                this.isVisible = curVisible;

                var size = 0;
                cti.fullContent.forEach((k, v) => {
                    if (!v.category || cat.indexOf(v.category) !== -1) {
                        if (v.attributeName === "zBias") {
                            pd._zBiasOffset = v.instanceOffset.get(joinCat);
                        }
                        if (!v.size) {
                            console.log(`ERROR: Couldn't detect the size of the Property ${v.attributeName} from type ${Tools.getClassName(cti.type)}. Property is ignored.`);
                        } else {
                            size += v.size;
                        }
                    }
                });
                pd._partDataStride = size;
                pd._partUsedCategories = cat;
                pd._partId = dataPart.id;
                ctiArray.push(cti);
            }
            this._modelRenderCache._partsClassInfo = ctiArray;
        }

        protected onZOrderChanged() {
            if (this.isTransparent && this._transparentPrimitiveInfo) {
                this.renderGroup._renderableData.transparentPrimitiveZChanged(this._transparentPrimitiveInfo);
                let gii = this.renderGroup._renderableData._renderGroupInstancesInfo.get(this.modelKey);

                // Flag the transparentData dirty has will have to sort it again
                gii.transparentOrderDirty = true;
            }
        }

        protected _mustUpdateInstance(): boolean {
            return false;
        }

        protected _useTextureAlpha(): boolean {
            return false;
        }

        protected _shouldUseAlphaFromTexture(): boolean {
            return false;
        }

        protected _isPrimAlphaTest(): boolean {
            return false;
        }

        protected _isPrimTransparent(): boolean {
            return false;
        }

        private _updateInstanceDataParts(gii: GroupInstanceInfo) {
            // Fetch the GroupInstanceInfo if we don't already have it
            let rd = this.renderGroup._renderableData;
            if (!gii) {
                gii = rd._renderGroupInstancesInfo.get(this.modelKey);
            }

            let isTransparent = this.isTransparent;
            let isAlphaTest = this.isAlphaTest;
            let wereTransparent = false;

            // Check a render mode change
            let rmChanged = false;
            if (this._instanceDataParts.length>0) {
                let firstPart = this._instanceDataParts[0];
                let partRM = firstPart.renderMode;
                let curRM = this.renderMode;

                if (partRM !== curRM) {
                    wereTransparent = partRM === Render2DContext.RenderModeTransparent;
                    rmChanged = true;
                    let gipd: TransparentGroupInfoPartData[];
                    switch (curRM) {
                        case Render2DContext.RenderModeTransparent:
                            gipd = gii.transparentData;
                            break;
                        case Render2DContext.RenderModeAlphaTest:
                            gipd = gii.alphaTestData;
                            break;
                        default:
                            gipd = gii.opaqueData;
                    }

                    for (let i = 0; i < this._instanceDataParts.length; i++) {
                        let part = this._instanceDataParts[i];
                        part.freeElements();
                        part.dataBuffer = gipd[i]._partData;
                        part.renderMode = curRM;
                    }

                }
            }

            // Handle changes related to ZOffset
            let visChanged = this._isFlagSet(SmartPropertyPrim.flagVisibilityChanged);

            if (isTransparent || wereTransparent) {
                // Handle visibility change, which is also triggered when the primitive just got created
                if (visChanged || rmChanged) {
                    if (this.isVisible && !wereTransparent) {
                        if (!this._transparentPrimitiveInfo) {
                            // Add the primitive to the list of transparent ones in the group that render is
                            this._transparentPrimitiveInfo = rd.addNewTransparentPrimitiveInfo(this, gii);
                        }
                    } else {
                        if (this._transparentPrimitiveInfo) {
                            rd.removeTransparentPrimitiveInfo(this._transparentPrimitiveInfo);
                            this._transparentPrimitiveInfo = null;
                        }
                    }
                    gii.transparentOrderDirty = true;
                }
            }

            let rebuildTrans = false;

            // For each Instance Data part, refresh it to update the data in the DynamicFloatArray
            for (let part of this._instanceDataParts) {
                let justAllocated = false;
                // Check if we need to allocate data elements (hidden prim which becomes visible again)
                if (!part.dataElements && (visChanged || rmChanged || this.isVisible)) {
                    part.allocElements();
                    justAllocated = true;
                }

                InstanceClassInfo._CurCategories = gii.usedShaderCategories[gii.partIndexFromId.get(part.id.toString())];

                // Will return false if the instance should not be rendered (not visible or other any reasons)
                part.arrayLengthChanged = false;
                if (!this.refreshInstanceDataPart(part)) {
                    // Free the data element
                    if (part.dataElements) {
                        part.freeElements();
                    }

                    // The refresh couldn't succeed, push the primitive to be dirty again for the next render
                    if (this.isVisible) {
                        rd._primNewDirtyList.push(this);
                    }
                }

                rebuildTrans = rebuildTrans || part.arrayLengthChanged || justAllocated;
            }
            this._instanceDirtyFlags = 0;

            // Make the appropriate data dirty
            if (isTransparent) {
                gii.transparentDirty = true;
                if (rebuildTrans) {
                    rd._transparentListChanged = true;
                }
            } else if (isAlphaTest) {
                gii.alphaTestDirty = true;
            } else {
                gii.opaqueDirty = true;
            }

            this._clearFlags(SmartPropertyPrim.flagVisibilityChanged);    // Reset the flag as we've handled the case            
        }

        _updateTransparentSegmentIndices(ts: TransparentSegment) {
            let minOff = Prim2DBase._bigInt;
            let maxOff = 0;

            for (let part of this._instanceDataParts) {
                if (part && part.dataElements) {
                    part.dataBuffer.pack();
                    for (let el of part.dataElements) {
                        minOff = Math.min(minOff, el.offset);
                        maxOff = Math.max(maxOff, el.offset);
                    }
                    ts.startDataIndex = Math.min(ts.startDataIndex, minOff / part.dataBuffer.stride);
                    ts.endDataIndex = Math.max(ts.endDataIndex, (maxOff / part.dataBuffer.stride) + 1); // +1 for exclusive
                }
            }
        }


        // This internal method is mainly used for transparency processing
        public _getNextPrimZOrder(): number {
            let length = this._instanceDataParts.length;
            for (let i = 0; i < length; i++) {
                let part = this._instanceDataParts[i];
                if (part) {
                    let stride = part.dataBuffer.stride;
                    let lastElementOffset = part.dataElements[part.dataElements.length - 1].offset;

                    // check if it's the last in the DFA
                    if (part.dataBuffer.totalElementCount * stride <= lastElementOffset) {
                        return null;
                    }

                    // Return the Z of the next primitive that lies in the DFA
                    return part.dataBuffer[lastElementOffset + stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        }

        // This internal method is mainly used for transparency processing
        public _getPrevPrimZOrder(): number {
            let length = this._instanceDataParts.length;
            for (let i = 0; i < length; i++) {
                let part = this._instanceDataParts[i];
                if (part) {
                    let stride = part.dataBuffer.stride;
                    let firstElementOffset = part.dataElements[0].offset;

                    // check if it's the first in the DFA
                    if (firstElementOffset === 0) {
                        return null;
                    }

                    // Return the Z of the previous primitive that lies in the DFA
                    return part.dataBuffer[firstElementOffset - stride + this.modelRenderCache._partData[i]._zBiasOffset];
                }
            }
            return null;
        }

        /**
         * Transform a given point using the Primitive's origin setting.
         * This method requires the Primitive's actualSize to be accurate
         * @param p the point to transform
         * @param originOffset an offset applied on the current origin before performing the transformation. Depending on which frame of reference your data is expressed you may have to apply a offset. (if you data is expressed from the bottom/left, no offset is required. If it's expressed from the center the a [-0.5;-0.5] offset has to be applied.
         * @param res an allocated Vector2 that will receive the transformed content
         */
        protected transformPointWithOriginByRef(p: Vector2, originOffset:Vector2, res: Vector2) {
            let actualSize = this.actualSize;
            res.x = p.x - ((this.origin.x + (originOffset ? originOffset.x : 0)) * actualSize.width);
            res.y = p.y - ((this.origin.y + (originOffset ? originOffset.y : 0)) * actualSize.height);
        }

        protected transformPointWithOriginToRef(p: Vector2, originOffset: Vector2, res: Vector2) {
            this.transformPointWithOriginByRef(p, originOffset, res);
            return res;
        }

        /**
         * Get the info for a given effect based on the dataPart metadata
         * @param dataPartId partId in part list to get the info
         * @param vertexBufferAttributes vertex buffer attributes to manually add
         * @param uniforms uniforms to manually add
         * @param useInstanced specified if Instanced Array should be used, if null the engine caps will be used (so true if WebGL supports it, false otherwise), but you have the possibility to override the engine capability. However, if you manually set true but the engine does not support Instanced Array, this method will return null
         */
        protected getDataPartEffectInfo(dataPartId: number, vertexBufferAttributes: string[], uniforms: string[] = null, useInstanced: boolean = null): { attributes: string[], uniforms: string[], defines: string } {
            let dataPart = Tools.first(this._instanceDataParts, i => i.id === dataPartId);
            if (!dataPart) {
                return null;
            }

            let instancedArray = this.owner.supportInstancedArray;
            if (useInstanced != null) {
                // Check if the caller ask for Instanced Array and the engine does not support it, return null if it's the case
                if (useInstanced && instancedArray === false) {
                    return null;
                }

                // Use the caller's setting
                instancedArray = useInstanced;
            }

            let cti = dataPart.getClassTreeInfo();
            let categories = this.getUsedShaderCategories(dataPart);
            let att = cti.classContent.getShaderAttributes(categories);
            let defines = "";
            categories.forEach(c => { defines += `#define ${c}\n` });
            if (instancedArray) {
                defines += "#define Instanced\n";
            }

            return {
                attributes: instancedArray ? vertexBufferAttributes.concat(att) : vertexBufferAttributes,
                uniforms: instancedArray ? (uniforms != null ? uniforms : []) : ((uniforms != null) ? att.concat(uniforms) : (att!=null ? att : [])),
                defines: defines
            };
        }

        protected get modelRenderCache(): ModelRenderCache {
            return this._modelRenderCache;
        }

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            return null;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return null;
        }

        protected getUsedShaderCategories(dataPart: InstanceDataBase): string[] {
            return [];
        }

        protected beforeRefreshForLayoutConstruction(part: InstanceDataBase): any {

        }

        protected afterRefreshForLayoutConstruction(part: InstanceDataBase, obj: any) {

        }

        protected applyActualScaleOnTransform(): boolean {
            return true;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!this.isVisible) {
                return false;
            }
            part.isVisible = this.isVisible;

            // Which means, if there's only one data element, we're update it from this method, otherwise it is the responsibility of the derived class to call updateInstanceDataPart as many times as needed, properly (look at Text2D's implementation for more information)
            if (part.dataElementCount === 1) {
                part.curElement = 0;
                this.updateInstanceDataPart(part);
            }
            return true;
        }

        private static _uV = new Vector2(1, 1);

        /**
         * Update the instanceDataBase level properties of a part
         * @param part the part to update
         * @param positionOffset to use in multi part per primitive (e.g. the Text2D has N parts for N letter to display), this give the offset to apply (e.g. the position of the letter from the bottom/left corner of the text).
         */
        protected updateInstanceDataPart(part: InstanceDataBase, positionOffset: Vector2 = null) {
            let t = this._globalTransform.multiply(this.renderGroup.invGlobalTransform);    // Compute the transformation into the renderGroup's space
            let rgScale = this._areSomeFlagsSet(SmartPropertyPrim.flagDontInheritParentScale) ? RenderablePrim2D._uV : this.renderGroup.actualScale;         // We still need to apply the scale of the renderGroup to our rendering, so get it.
            let size = (<Size>this.renderGroup.viewportSize);
            let zBias = this.actualZOffset;

            let offX = 0;
            let offY = 0;
            // If there's an offset, apply the global transformation matrix on it to get a global offset
            if (positionOffset) {
                offX = positionOffset.x * t.m[0] + positionOffset.y * t.m[4];
                offY = positionOffset.x * t.m[1] + positionOffset.y * t.m[5];
            }

            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1].
            // At last we don't forget to apply the actualScale of the Render Group to tx[0] and ty[1] to propagate scaling correctly
            let w = size.width;
            let h = size.height;
            let invZBias = 1 / zBias;
            let tx = new Vector4(t.m[0] * rgScale.x * 2 / w, t.m[4] * 2 / w, 0/*t.m[8]*/, ((t.m[12] + offX) * rgScale.x * 2 / w) - 1);
            let ty = new Vector4(t.m[1] * 2 / h, t.m[5] * rgScale.y * 2 / h, 0/*t.m[9]*/, ((t.m[13] + offY) * rgScale.y * 2 / h) - 1);

            if (!this.applyActualScaleOnTransform()) {
                let las = this.actualScale;
                tx.x /= las.x;
                ty.y /= las.y;
            }

            part.transformX = tx;
            part.transformY = ty;
            part.opacity = this.actualOpacity;

            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new Vector2(zBias, invZBias);
        }

        protected _updateRenderMode() {
            if (this.isTransparent) {
                this._renderMode = Render2DContext.RenderModeTransparent;
            } else if (this.isAlphaTest) {
                this._renderMode = Render2DContext.RenderModeAlphaTest;
            } else {
                this._renderMode = Render2DContext.RenderModeOpaque;
            }
        }

        private _modelRenderCache: ModelRenderCache;
        private _transparentPrimitiveInfo: TransparentPrimitiveInfo;

        protected _instanceDataParts: InstanceDataBase[];
        private _renderMode: number;
    }


}