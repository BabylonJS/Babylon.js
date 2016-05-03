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
            let catInline = categories.join(";");
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
            var curOffset = 0;
            var curBase = this._baseInfo;
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
            return;
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
            }
        }
    }

    export function instanceData<T>(category?: string, shaderAttributeName?: string): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {

            let dic = ClassTreeInfo.getOrRegister<InstanceClassInfo, InstancePropInfo>(target, (base) => new InstanceClassInfo(base));
            var node = dic.getLevelOf(target);
            let instanceDataName = <string>propName;
            shaderAttributeName = shaderAttributeName || instanceDataName;


            let info = node.levelContent.get(instanceDataName);
            if (info) {
                throw new Error(`The ID ${instanceDataName} is already taken by another instance data`);
            }

            info = new InstancePropInfo();
            info.attributeName = shaderAttributeName;
            info.category = category;

            node.levelContent.add(instanceDataName, info);

            descriptor.get = function () {
                return null;
            }

            descriptor.set = function (val) {
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info, true);
                } else if (!info.instanceOffset.contains(InstanceClassInfo._CurCategories)) {
                    node.classContent.mapProperty(info, false);
                }

                var obj: InstanceDataBase = this;
                if (obj._dataBuffer) {
                    let offset = obj._dataElement.offset + info.instanceOffset.get(InstanceClassInfo._CurCategories);
                    info.writeData(obj._dataBuffer.buffer, offset, val);
                }
            }

        }
    }

    export class InstanceDataBase {
        constructor(partId: number) {
            this.id = partId;
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
            if (!this._typeInfo) {
                this._typeInfo = ClassTreeInfo.get<InstanceClassInfo, InstancePropInfo>(Object.getPrototypeOf(this));
            }
            return this._typeInfo;
        }

        _dataElement: DynamicFloatArrayElementInfo;
        _dataBuffer: DynamicFloatArray;
        _typeInfo: ClassTreeInfo<InstanceClassInfo, InstancePropInfo>;
    }

    @className("RenderablePrim2D")
    export class RenderablePrim2D extends Prim2DBase {
        static RENDERABLEPRIM2D_PROPCOUNT: number = Prim2DBase.PRIM2DBASE_PROPCOUNT + 5;

        setupRenderablePrim2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, isVisible: boolean, fill: IBrush2D, border: IBrush2D) {
            this.setupPrim2DBase(owner, parent, id, position);
            this._isTransparent = false;
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
                this._modelRenderCache = SmartPropertyPrim.GetOrAddModelCache(this.modelKey, (key: string) => this.createModelRenderCache());
                this._modelDirty = false;
                setupModelRenderCache = true;
            }

            // Need to create the instance?
            let gii: GroupInstanceInfo;
            let newInstance = false;
            if (!this._modelRenderInstanceID) {
                newInstance = true;
                let parts = this.createInstanceDataParts();
                this._instanceDataParts = parts;

                if (!this._modelRenderCache._partsDataStride) {
                    let ctiArray = new Array<ClassTreeInfo<InstanceClassInfo, InstancePropInfo>>();
                    var dataStrides = new Array<number>();
                    var usedCatList = new Array<string[]>();

                    for (var dataPart of parts) {
                        let cat = this.getUsedShaderCategories(dataPart);
                        let cti = dataPart.getClassTreeInfo();
                        // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                        let curVisible = this.isVisible;
                        this.isVisible = true;
                        // We manually trigger refreshInstanceData for the only sake of evaluating each isntance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                        //console.log("Build Prop Layout for " + Tools.getClassName(this._instanceDataParts[0]));
                        InstanceClassInfo._CurCategories = cat.join(";");
                        this.refreshInstanceDataParts(dataPart);
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
                    }
                    this._modelRenderCache._partsDataStride = dataStrides;
                    this._modelRenderCache._partsUsedCategories = usedCatList;
                    this._modelRenderCache._partsClassInfo = ctiArray;
                }

                gii = this.renderGroup.groupRenderInfo.getOrAddWithFactory(this.modelKey, k => new GroupInstanceInfo(this.renderGroup, this._modelRenderCache));

                if (gii._instancesPartsData.length===0) {
                    for (let stride of this._modelRenderCache._partsDataStride) {
                        // instanceDataStride's unit is byte but DynamicFloatArray is float32, so div by four to get the correct number
                        gii._instancesPartsData.push(new DynamicFloatArray(stride / 4, 50));
                    }
                }

                for (let i = 0; i < parts.length; i++) {
                    let part = parts[i];
                    part._dataBuffer = gii._instancesPartsData[i];
                    part._dataElement = part._dataBuffer.allocElement();
                }

                this._modelRenderInstanceID = this._modelRenderCache.addInstanceDataParts(this._instanceDataParts);
            }

            if (setupModelRenderCache) {
                this.setupModelRenderCache(this._modelRenderCache);
            }

            if (context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformPreviousStep !== this._globalTransformStep)) {
                for (let part of this._instanceDataParts) {
                    let cat = this.getUsedShaderCategories(part);
                    InstanceClassInfo._CurCategories = cat.join(";");

                    // Will return false if the instance should not be rendered (not visible or other any reasons)
                    if (!this.refreshInstanceDataParts(part)) {
                        // Free the data element
                        if (part._dataElement) {
                            part._dataBuffer.freeElement(part._dataElement);
                            part._dataElement = null;
                        }
                    }
                }
                this._instanceDirtyFlags = 0;

                if (!gii) {
                    gii = this.renderGroup.groupRenderInfo.get(this.modelKey);
                }

                gii._dirtyInstancesData = true;
            }
        }

        protected getDataPartEffectInfo(dataPartId: number, vertexBufferAttributes: string[]): {attributes: string[], defines: string} {
            var dataPart = Tools.first(this._instanceDataParts, i => i.id === dataPartId);
            if (!dataPart) {
                return null;
            }

            var cti = dataPart.getClassTreeInfo();
            var categories = this.getUsedShaderCategories(dataPart);
            var attributes = vertexBufferAttributes.concat(cti.classContent.getShaderAttributes(categories));
            var defines = "";
            categories.forEach(c => { defines += `#define ${c}\n`});

            return { attributes: attributes, defines: defines };
        }

        public get isTransparent(): boolean {
            return this._isTransparent;
        }

        protected createModelRenderCache(): ModelRenderCache {
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

        protected refreshInstanceDataParts(part: InstanceDataBase): boolean {
            if (!this.isVisible) {
                return false;
            }

            part.isVisible = this.isVisible;
            let t = this.renderGroup.invGlobalTransform.multiply(this._globalTransform);
            let size = (<Size>this.renderGroup.viewportSize);
            let zBias = this.getActualZOffset();

            // Have to convert the coordinates to clip space which is ranged between [-1;1] on X and Y axis, with 0,0 being the left/bottom corner
            // Current coordinates are expressed in renderGroup coordinates ([0, renderGroup.actualSize.width|height]) with 0,0 being at the left/top corner
            // RenderGroup Width and Height are multiplied by zBias because the VertexShader will multiply X and Y by W, which is 1/zBias. Has we divide our coordinate by these Width/Height, we will also divide by the zBias to compensate the operation made by the VertexShader.
            // So for X: 
            //  - tx.x = value * 2 / width: is to switch from [0, renderGroup.width] to [0, 2]
            //  - tx.w = (value * 2 / width) - 1: w stores the translation in renderGroup coordinates so (value * 2 / width) to switch to a clip space translation value. - 1 is to offset the overall [0;2] to [-1;1]. Don't forget it's -(1/zBias) and not -1 because everything need to be scaled by 1/zBias.
            // Same thing for Y, except the "* -2" instead of "* 2" to switch the origin from top to bottom (has expected by the clip space)
            let w = size.width * zBias;
            let h = size.height * zBias;
            let invZBias = 1 / zBias;
            let tx = new Vector4(t.m[0] * 2 / w, t.m[4] * 2 / w, t.m[8], (t.m[12] * 2 / w) - (invZBias));
            let ty = new Vector4(t.m[1] * -2 / h, t.m[5] * -2 / h, t.m[9], ((t.m[13] * 2 / h) - (invZBias)) * -1);
            part.transformX = tx;
            part.transformY = ty;
            part.origin = this.origin;

            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            part.zBias = new Vector2(zBias, invZBias);

            return true;
        }

        private _modelRenderCache: ModelRenderCache;
        private _modelRenderInstanceID: string;

        protected _instanceDataParts: InstanceDataBase[];
        protected _isTransparent: boolean;
    }


}