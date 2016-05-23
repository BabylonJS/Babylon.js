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
            this.dataElementCount = dataElementCount;
        }

        id: number;
        isVisible: boolean;

        @instanceData()
        get zBias(): Vector2 {
            return null;
        }

        @instanceData()
        get transformX(): Vector4 {
            return null;
        }

        @instanceData()
        get transformY(): Vector4 {
            return null;
        }

        @instanceData()
        get origin(): Vector2 {
            return null;
        }

        getClassTreeInfo(): ClassTreeInfo<InstanceClassInfo, InstancePropInfo> {
            if (!this.typeInfo) {
                this.typeInfo = ClassTreeInfo.get<InstanceClassInfo, InstancePropInfo>(Object.getPrototypeOf(this));
            }
            return this.typeInfo;
        }

        allocElements() {
            if (!this.dataBuffer) {
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

            this.freeElements();
            this._dataElementCount = value;
            this.allocElements();
        }

        curElement: number;
        dataElements: DynamicFloatArrayElementInfo[];
        dataBuffer: DynamicFloatArray;
        typeInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>;

        private _dataElementCount: number;

    }

    @className("RenderablePrim2D")
    export class RenderablePrim2D extends Prim2DBase {
        static RENDERABLEPRIM2D_PROPCOUNT: number = Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;

        public static isTransparentProperty: Prim2DPropInfo;

        @modelLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, pi => RenderablePrim2D.isTransparentProperty = pi)
        public get isTransparent(): boolean {
            return this._isTransparent;
        }

        public set isTransparent(value: boolean) {
            this._isTransparent = value;
        }

        setupRenderablePrim2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, isVisible: boolean) {
            this.setupPrim2DBase(owner, parent, id, position);
            this._isTransparent = false;
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this._modelRenderInstanceID) {
                this._modelRenderCache.removeInstanceData(this._modelRenderInstanceID);
                this._modelRenderInstanceID = null;
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

        public _prepareRenderPre(context: Render2DContext) {
            super._prepareRenderPre(context);

            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._modelDirty && this._modelRenderInstanceID) {
                this._modelRenderCache.removeInstanceData(this._modelRenderInstanceID);
                this._modelRenderInstanceID = null;
            }

            // Need to create the model?
            let setupModelRenderCache = false;
            if (!this._modelRenderCache || this._modelDirty) {
                if (this._modelRenderCache) {
                    this._modelRenderCache.dispose();
                }
                this._modelRenderCache = this.owner._engineData.GetOrAddModelCache(this.modelKey, (key: string) => {
                    let mrc = this.createModelRenderCache(key, this.isTransparent);
                    setupModelRenderCache = true;
                    return mrc;
                });
                this._modelDirty = false;

                // if this is still false it means the MRC already exists, so we add a reference to it
                if (!setupModelRenderCache) {
                    this._modelRenderCache.addRef();
                }
            }

            let gii: GroupInstanceInfo;
            let newInstance = false;

            // Need to create the instance data parts?
            if (!this._modelRenderInstanceID) {
                // Yes, flag it for later, more processing will have to be done
                newInstance = true;

                // Create the instance data parts of the primitive and store them
                let parts = this.createInstanceDataParts();
                this._instanceDataParts = parts;

                // Check if the ModelRenderCache for this particular instance is also brand new, initialize it if it's the case
                if (!this._modelRenderCache._partsDataStride) {
                    let ctiArray = new Array<ClassTreeInfo<InstanceClassInfo, InstancePropInfo>>();
                    let dataStrides = new Array<number>();
                    let usedCatList = new Array<string[]>();
                    let partIdList = new Array<number>();
                    let joinedUsedCatList = new Array<string>();

                    for (let dataPart of parts) {
                        var cat = this.getUsedShaderCategories(dataPart);
                        var cti = dataPart.getClassTreeInfo();
                        // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                        let curVisible = this.isVisible;
                        this.isVisible = true;
                        // We manually trigger refreshInstanceData for the only sake of evaluating each instance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                        //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                        let joinCat = ";" + cat.join(";") + ";";
                        joinedUsedCatList.push(joinCat);
                        InstanceClassInfo._CurCategories = joinCat;
                        let obj = this.beforeRefreshForLayoutConstruction(dataPart);
                        this.refreshInstanceDataPart(dataPart);
                        this.afterRefreshForLayoutConstruction(dataPart, obj);
                        this.isVisible = curVisible;

                        var size = 0;
                        cti.fullContent.forEach((k, v) => {
                            if (!v.category || cat.indexOf(v.category) !== -1) {
                                if (!v.size) {
                                    console.log(`ERROR: Couldn't detect the size of the Property ${v.attributeName} from type ${Tools.getClassName(cti.type)}. Property is ignored.`);
                                } else {
                                    size += v.size;
                                }
                            }
                        });
                        dataStrides.push(size);
                        usedCatList.push(cat);
                        ctiArray.push(cti);
                        partIdList.push(dataPart.id);
                    }
                    this._modelRenderCache._partsDataStride = dataStrides;
                    this._modelRenderCache._partsUsedCategories = usedCatList;
                    this._modelRenderCache._partsJoinedUsedCategories = joinedUsedCatList;
                    this._modelRenderCache._partsClassInfo = ctiArray;
                    this._modelRenderCache._partIdList = partIdList;
                }

                // The Rendering resources (Effect, VB, IB, Textures) are stored in the ModelRenderCache
                // But it's the RenderGroup that will store all the Instanced related data to render all the primitive it owns.
                // So for a given ModelKey we getOrAdd a GroupInstanceInfo that will store all these data
                gii = this.renderGroup._renderGroupInstancesInfo.getOrAddWithFactory(this.modelKey, k => new GroupInstanceInfo(this.renderGroup, this._modelRenderCache));

                // First time init of the GroupInstanceInfo
                if (gii._instancesPartsData.length === 0) {
                    for (let j = 0; j < this._modelRenderCache._partsDataStride.length; j++) {
                        let stride = this._modelRenderCache._partsDataStride[j];
                        gii._instancesPartsData.push(new DynamicFloatArray(stride / 4, 50));
                        gii._partIndexFromId.add(this._modelRenderCache._partIdList[j].toString(), j);

                        for (let part of this._instanceDataParts) {
                            gii._instancesPartsUsedShaderCategories[gii._partIndexFromId.get(part.id.toString())] = ";" + this.getUsedShaderCategories(part).join(";") + ";";
                        }
                    }
                }

                // For each instance data part of the primitive, allocate the instanced element it needs for render
                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    part.dataBuffer = gii._instancesPartsData[i];
                    part.allocElements();
                }

                // Add the instance data parts in the ModelRenderCache they belong, track them by storing their ID in the primitive in case we need to change the model later on, so we'll have to release the allocated instance data parts because they won't fit anymore
                this._modelRenderInstanceID = this._modelRenderCache.addInstanceDataParts(this._instanceDataParts);
            }

            // If the ModelRenderCache is brand new, now is the time to call the implementation's specific setup method to create the rendering resources
            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }

            // At this stage we have everything correctly initialized, ModelRenderCache is setup, Model Instance data are good too, they have allocated elements in the Instanced DynamicFloatArray.

            // The last thing to do is check if the instanced related data must be updated because a InstanceLevel property had changed or the primitive visibility changed.
            if (this._visibilityChanged || context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformProcessStep !== this._globalTransformStep)) {

                // Fetch the GroupInstanceInfo if we don't already have it
                if (!gii) {
                    gii = this.renderGroup._renderGroupInstancesInfo.get(this.modelKey);
                }

                // For each Instance Data part, refresh it to update the data in the DynamicFloatArray
                for (let part of this._instanceDataParts) {
                    // Check if we need to allocate data elements (hidden prim which becomes visible again)
                    if (this._visibilityChanged && !part.dataElements) {
                        part.allocElements();
                    }

                    InstanceClassInfo._CurCategories = gii._instancesPartsUsedShaderCategories[gii._partIndexFromId.get(part.id.toString())];

                    // Will return false if the instance should not be rendered (not visible or other any reasons)
                    if (!this.refreshInstanceDataPart(part)) {
                        // Free the data element
                        if (part.dataElements) {
                            part.freeElements();
                        }
                    }
                }
                this._instanceDirtyFlags = 0;

                gii._dirtyInstancesData = true;
                this._visibilityChanged = false;    // Reset the flag as we've handled the case
            }
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

        protected transformPointWithOrigin(p: Vector2, originOffset: Vector2): Vector2 {
            let res = new Vector2(0, 0);
            this.transformPointWithOriginByRef(p, originOffset, res);
            return res;
        }

        protected getDataPartEffectInfo(dataPartId: number, vertexBufferAttributes: string[]): { attributes: string[], uniforms: string[], defines: string } {
            let dataPart = Tools.first(this._instanceDataParts, i => i.id === dataPartId);
            if (!dataPart) {
                return null;
            }

            let instancedArray = this.owner.supportInstancedArray;

            let cti = dataPart.getClassTreeInfo();
            let categories = this.getUsedShaderCategories(dataPart);
            let att = cti.classContent.getShaderAttributes(categories);
            let defines = "";
            categories.forEach(c => { defines += `#define ${c}\n` });
            if (instancedArray) {
                defines += "#define Instanced\n";
            }

            return { attributes: instancedArray ? vertexBufferAttributes.concat(att) : vertexBufferAttributes, uniforms: instancedArray ? [] : att, defines: defines };
        }

        protected get modelRenderCache(): ModelRenderCache {
            return this._modelRenderCache;
        }

        protected createModelRenderCache(modelKey: string, isTransparent: boolean): ModelRenderCache {
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

        /**
         * Update the instanceDataBase level properties of a part
         * @param part the part to update
         * @param positionOffset to use in multi part per primitive (e.g. the Text2D has N parts for N letter to display), this give the offset to apply (e.g. the position of the letter from the bottom/left corner of the text). You MUST also set customSize.
         * @param customSize to use in multi part per primitive, this is the size of the overall primitive to display (the bounding rect's size of the Text, for instance). This is mandatory to compute correct transformation based on the Primitive's origin property.
         */
        protected updateInstanceDataPart(part: InstanceDataBase, positionOffset: Vector2 = null, customSize: Size = null) {
            let t = this._globalTransform.multiply(this.renderGroup.invGlobalTransform);
            let size = (<Size>this.renderGroup.viewportSize);
            let zBias = this.getActualZOffset();

            let offX = 0;
            let offY = 0;
            // If there's an offset, apply the global transformation matrix on it to get a global offset
            if (positionOffset && customSize) {
                offX = (positionOffset.x-(customSize.width*this.origin.x)) * t.m[0] + (positionOffset.y-(customSize.height*this.origin.y)) * t.m[4];
                offY = (positionOffset.x-(customSize.width*this.origin.x)) * t.m[1] + (positionOffset.y-(customSize.height*this.origin.y)) * t.m[5];
            }

            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // RenderGroup Width and Height are multiplied by zBias because the VertexShader will multiply X and Y by W, which is 1/zBias. As we divide our coordinate by these Width/Height, we will also divide by the zBias to compensate the operation made by the VertexShader.
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1]. Don't forget it's -(1/zBias) and not -1 because everything need to be scaled by 1/zBias.
            let w = size.width * zBias;
            let h = size.height * zBias;
            let invZBias = 1 / zBias;
            let tx = new Vector4(t.m[0] * 2 / w, t.m[4] * 2 / w, 0/*t.m[8]*/, ((t.m[12] + offX) * 2 / w) - (invZBias));
            let ty = new Vector4(t.m[1] * 2 / h, t.m[5] * 2 / h, 0/*t.m[9]*/, ((t.m[13] + offY) * 2 / h) - (invZBias));
            part.transformX = tx;
            part.transformY = ty;
            part.origin = this.origin;

            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new Vector2(zBias, invZBias);
        }

        private _modelRenderCache: ModelRenderCache;
        private _modelRenderInstanceID: string;

        protected _instanceDataParts: InstanceDataBase[];
        protected _isTransparent: boolean;
    }


}