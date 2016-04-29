module BABYLON {
    export class InstanceClassInfo {
        constructor(base: InstanceClassInfo) {
            this._baseInfo = base;
            this._nextOffset = 0;
            this._attributes = new Array<InstancePropInfo>();
        }

        mapProperty(propInfo: InstancePropInfo) {
            propInfo.instanceOffset = (this._baseInfo ? this._baseInfo._nextOffset : 0) + this._nextOffset;
            this._nextOffset += (propInfo.size / 4);
            this._attributes.push(propInfo);
        }

        getInstancingAttributeInfos(effect: Effect): InstancingAttributeInfo[] {
            let res = new Array<InstancingAttributeInfo>();
            let curInfo: InstanceClassInfo = this;
            while (curInfo) {
                for (let attrib of curInfo._attributes) {
                    let index = effect.getAttributeLocationByName(attrib.attributeName);
                    let iai = new InstancingAttributeInfo();
                    iai.index = index;
                    iai.attributeSize = attrib.size / 4; // attrib.size is in byte and we need to store in "component" (i.e float is 1, vec3 is 3)
                    iai.offset = attrib.instanceOffset * 4; // attrub.instanceOffset is in float, iai.offset must be in bytes
                    res.push(iai);
                }

                curInfo = curInfo._baseInfo;
            }
            return res;
        }

        public instanceDataStride;

        private _baseInfo: InstanceClassInfo;
        private _nextOffset;
        private _attributes: Array<InstancePropInfo>;
    }

    export class InstancePropInfo {
        attributeName: string;
        size: number;
        shaderOffset: number;
        instanceOffset: number;
        dataType: ShaderDataType;
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

    export function instanceData<T>(name?: string): (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => void {
        return (target: Object, propName: string | symbol, descriptor: TypedPropertyDescriptor<T>) => {

            let dic = ClassTreeInfo.getOrRegister<InstanceClassInfo, InstancePropInfo>(target, (base) => new InstanceClassInfo(base));
            var node = dic.getLevelOf(target);
            name = name || <string>propName;

            let info = node.levelContent.get(name);
            if (info) {
                throw new Error(`The ID ${name} is already taken by another instance data`);
            }

            info = new InstancePropInfo();
            info.attributeName = name;

            node.levelContent.add(name, info);

            descriptor.get = function () {
                return null;
            }

            descriptor.set = function (val) {
                if (!info.size) {
                    info.setSize(val);
                    node.classContent.mapProperty(info);
                }

                var obj: InstanceDataBase = this;
                if (obj._dataBuffer) {
                    info.writeData(obj._dataBuffer.buffer, obj._dataElement.offset + info.instanceOffset, val);
                }
            }

        }
    }

    export class InstanceDataBase {
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
            return ClassTreeInfo.get<InstanceClassInfo, InstancePropInfo>(this);
        }

        _dataElement: DynamicFloatArrayElementInfo;
        _dataBuffer: DynamicFloatArray;
    }

   export class RenderablePrim2D<TInstData extends InstanceDataBase> extends Prim2DBase {
        static RENDERABLEPRIM2D_PROPCOUNT: number = Prim2DBase.PRIM2DBASE_PROPCOUNT + 10;

        public static borderProperty: Prim2DPropInfo;
        public static fillProperty: Prim2DPropInfo;

        setupRenderablePrim2D(owner: Canvas2D, parent: Prim2DBase, id: string, position: Vector2, isVisible: boolean, fill: IFill2D, border: IBorder2D) {
            this.setupPrim2DBase(owner, parent, id, position);
            this._isTransparent = false;
        }

        @modelLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 1, pi => RenderablePrim2D.borderProperty = pi, true)
        public get border(): IBorder2D {
            return this._border;
        }

        public set border(value: IBorder2D) {
            if (value === this._border) {
                return;
            }

            this._border = value;
        }

        @modelLevelProperty(Prim2DBase.PRIM2DBASE_PROPCOUNT + 2, pi => RenderablePrim2D.fillProperty = pi, true)
        public get fill(): IFill2D {
            return this._fill;
        }

        public set fill(value: IBorder2D) {
            if (value === this._fill) {
                return;
            }

            this._fill = value;
        }

        public _prepareRenderPre(context: Render2DContext) {
            super._prepareRenderPre(context);

            // If the model changed and we have already an instance, we must remove this instance from the obsolete model
            if (this._modelDirty && this._modelRenderInstanceID) {
                this._modelRenderCache.removeInstanceData(this._modelRenderInstanceID);
                this._modelRenderInstanceID = null;
            }

            // Need to create the model?
            if (!this._modelRenderCache || this._modelDirty) {
                this._modelRenderCache = SmartPropertyPrim.GetOrAddModelCache(this.modelKey, (key: string) => this.createModelRenderCache());
                this._modelDirty = false;
            }

            // Need to create the instance?
            let gii: GroupInstanceInfo;
            let newInstance = false;
            if (!this._modelRenderInstanceID) {
                newInstance = true;
                let id = this.createInstanceData();
                this._instanceData = id;

                let cti = id.getClassTreeInfo();
                if (!cti.classContent.instanceDataStride) {
                    // Make sure the instance is visible other the properties won't be set and their size/offset wont be computed
                    let curVisible = this.isVisible;
                    this.isVisible = true;
                    // We manually trigger refreshInstanceData for the only sake of evaluating each isntance property size and offset in the instance data, this can only be made at runtime. Once it's done we have all the information to create the instance data buffer.
                    this.refreshInstanceData();
                    this.isVisible = curVisible;

                    var size = 0;
                    cti.fullContent.forEach((k, v) => {
                        if (!v.size) {
                            console.log(`ERROR: Couldn't detect the size of the Property ${v.attributeName} from type ${cti.typeName}. Property is ignored.`);
                        } else {
                            size += v.size;
                        }
                    });
                    cti.classContent.instanceDataStride = size;
                }

                gii = this.renderGroup.groupRenderInfo.getOrAddWithFactory(this.modelKey, k => new GroupInstanceInfo(this.renderGroup, cti, this._modelRenderCache));
                if (!gii._instancesData) {
                    // instanceDataStride's unit is byte but DynamicFloatArray is float32, so div by four to get the correct number
                    gii._instancesData = new DynamicFloatArray(cti.classContent.instanceDataStride / 4, 50);
                }

                id._dataBuffer = gii._instancesData;
                id._dataElement = id._dataBuffer.allocElement();

                this._modelRenderInstanceID = this._modelRenderCache.addInstanceData(this._instanceData);
            }

            if (context.forceRefreshPrimitive || newInstance || (this._instanceDirtyFlags !== 0) || (this._globalTransformPreviousStep !== this._globalTransformStep)) {
                // Will return false if the instance should not be rendered (not visible or other any reasons)
                if (!this.refreshInstanceData()) {
                    // Free the data element
                    if (this._instanceData._dataElement) {
                        this._instanceData._dataBuffer.freeElement(this._instanceData._dataElement);
                        this._instanceData._dataElement = null;
                    }
                }
                this._instanceDirtyFlags = 0;

                if (!gii) {
                    gii = this.renderGroup.groupRenderInfo.get(this.modelKey);
                }

                gii._dirtyInstancesData = true;
            }
        }

        protected createModelRenderCache(): ModelRenderCache<TInstData> {
            return null;
        }

        protected createInstanceData(): TInstData {
            return null;
        }

        protected refreshInstanceData(): boolean {
            var d = this._instanceData;
            if (!this.isVisible) {
                return false;
            }

            d.isVisible = this.isVisible;
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
            d.transformX = tx;
            d.transformY = ty;
            d.origin = this.origin;

            // Stores zBias and it's inverse value because that's needed to compute the clip space W coordinate (which is 1/Z, so 1/zBias)
            d.zBias = new Vector2(zBias, invZBias);
            return true;
        }

        private _modelRenderCache: ModelRenderCache<TInstData>;
        private _modelRenderInstanceID: string;

        protected _instanceData: TInstData;
        private _border: IBorder2D;
        private _fill: IFill2D;
        private _isTransparent: boolean;
    }


}