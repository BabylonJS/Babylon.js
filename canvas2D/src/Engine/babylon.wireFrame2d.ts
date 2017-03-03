module BABYLON {
    export class WireFrame2DRenderCache extends ModelRenderCache {
        effectsReady: boolean = false;
        vb: WebGLBuffer = null;
        vtxCount = 0;
        instancingAttributes: InstancingAttributeInfo[] = null;
        effect: Effect = null;
        effectInstanced: Effect = null;

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effect && (!this.effect.isReady() || (this.effectInstanced && !this.effectInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }

            // Compute the offset locations of the attributes in the vertex shader that will be mapped to the instance buffer data
            let canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;

            var cur = engine.getAlphaMode();
            let effect = context.useInstancing ? this.effectInstanced : this.effect;

            engine.enableEffect(effect);
            engine.bindBuffersDirectly(this.vb, null, [2, 4], 24, effect);

            if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                engine.setAlphaMode(Engine.ALPHA_COMBINE, true);
            }

            let pid = context.groupInfoPartData[0];
            if (context.useInstancing) {
                if (!this.instancingAttributes) {
                    this.instancingAttributes = this.loadInstancingAttributes(WireFrame2D.WIREFRAME2D_MAINPARTID, effect);
                }
                let glBuffer = context.instancedBuffers ? context.instancedBuffers[0] : pid._partBuffer;
                let count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                canvas._addDrawCallCount(1, context.renderMode);
                engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingAttributes);
                engine.drawUnIndexed(false, 0, this.vtxCount, count);
//                engine.draw(true, 0, 6, count);
                engine.unbindInstanceAttributes();
            } else {
                canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                    this.setupUniforms(effect, 0, pid._partData, i);
                    engine.drawUnIndexed(false, 0, this.vtxCount);
  //                  engine.draw(true, 0, 6);
                }
            }

            engine.setAlphaMode(cur, true);

            return true;
        }

        public updateModelRenderCache(prim: Prim2DBase): boolean {
            let w = prim as WireFrame2D;
            w._updateVertexBuffer(this);
            return true;
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this.vb) {
                this._engine._releaseBuffer(this.vb);
                this.vb = null;
            }

            this.effect = null;
            this.effectInstanced = null;

            return true;
        }
    }

    @className("WireFrameVertex2D", "BABYLON")
    export class WireFrameVertex2D {
        x: number;
        y: number;
        r: number;
        g: number;
        b: number;
        a: number;

        constructor(p: Vector2, c: Color4=null) {
            this.fromVector2(p);
            if (c != null) {
                this.fromColor4(c);
            } else {
                this.r = this.g = this.b = this.a = 1;
            }
        }

        fromVector2(p: Vector2) {
            this.x = p.x;
            this.y = p.y;
        }

        fromColor3(c: Color3) {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;
            this.a = 1;
        }

        fromColor4(c: Color4) {
            this.r = c.r;
            this.g = c.g;
            this.b = c.b;
            this.a = c.a;
        }
    }

    @className("WireFrameGroup2D", "BABYLON")
    /**
     * A WireFrameGroup2D has a unique id (among the WireFrame2D primitive) and a collection of WireFrameVertex2D which form a Line list.
     * A Line is defined by two vertices, the storage of vertices doesn't follow the Line Strip convention, so to create consecutive lines the intermediate vertex must be doubled. The best way to build a Line Strip is to use the startLineStrip, pushVertex and endLineStrip methods.
     * You can manually add vertices using the pushVertex method, but mind that the vertices array must be a multiple of 2 as each line are defined with TWO SEPARATED vertices. I hope this is clear enough.
     */
    export class WireFrameGroup2D {
        /**
         * Construct a WireFrameGroup2D object
         * @param id a unique ID among the Groups added to a given WireFrame2D primitive, if you don't specify an id, a random one will be generated. The id is immutable.
         * @param defaultColor specify the default color that will be used when a vertex is pushed, white will be used if not specified.
         */
        constructor(id: string=null, defaultColor: Color4=null) {
            this._id = (id == null) ? Tools.RandomId() : id;
            this._uid = Tools.RandomId();
            this._defaultColor = (defaultColor == null) ? new Color4(1,1,1,1) : defaultColor;
            this._buildingStrip = false;
            this._vertices = new Array<WireFrameVertex2D>();
        }

        public get uid() {
            return this._uid;
        }

        /**
         * Retrieve the ID of the group
         */
        public get id(): string {
            return this._id;
        }

        /**
         * Push a vertex in the array of vertices.
         * If you're previously called startLineStrip, the vertex will be pushed twice in order to describe the end of a line and the start of a new one.
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        public pushVertex(p: Vector2, c: Color4=null) {
            let v = new WireFrameVertex2D(p, (c == null) ? this._defaultColor : c);
            this._vertices.push(v);
            if (this._buildingStrip) {
                let v2 = new WireFrameVertex2D(p, (c == null) ? this._defaultColor : c);
                this._vertices.push(v2);
            }
        }

        /**
         * Start to store a Line Strip. The given vertex will be pushed in the array. The you have to call pushVertex to add subsequent vertices describing the strip and don't forget to call endLineStrip to close the strip!!!
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        public startLineStrip(p: Vector2, c: Color4=null) {
            this.pushVertex(p, (c == null) ? this._defaultColor : c);
            this._buildingStrip = true;
        }

        /**
         * Close the Strip by storing a last vertex
         * @param p Position of the vertex
         * @param c Color of the vertex, if null the default color of the group will be used
         */
        public endLineStrip(p: Vector2, c: Color4=null) {
            this._buildingStrip = false;
            this.pushVertex(p, (c == null) ? this._defaultColor : c);
        }

        /**
         * Access to the array of Vertices, you can manipulate its content but BEWARE of what you're doing!
         */
        public get vertices(): Array<WireFrameVertex2D> {
            return this._vertices;
        }

        private _uid: string;
        private _id: string;
        private _defaultColor: Color4;
        private _vertices: Array<WireFrameVertex2D>;
        private _buildingStrip: boolean;
    }

    @className("WireFrame2D", "BABYLON")
    /**
     * Primitive that displays a WireFrame
     */
    export class WireFrame2D extends RenderablePrim2D {
        static WIREFRAME2D_MAINPARTID = 1;

        public static wireFrameGroupsProperty: Prim2DPropInfo;

        @modelLevelProperty(RenderablePrim2D.RENDERABLEPRIM2D_PROPCOUNT + 1, pi => WireFrame2D.wireFrameGroupsProperty = pi)
        /**
         * Get/set the texture that contains the sprite to display
         */
        public get wireFrameGroups(): StringDictionary<WireFrameGroup2D> {
            return this._wireFrameGroups;
        }

        /**
         * If you change the content of the wireFrameGroups you MUST call this method for the changes to be reflected during rendering
         */
        public wireFrameGroupsDirty() {
            this._setFlags(SmartPropertyPrim.flagModelUpdate);
            this.onPrimBecomesDirty();
        }

        public get size(): Size {
            if (this._size == null) {
                this._computeMinMaxTrans();
            }
            return this._size;
        }

        public set size(value: Size) {
            this.internalSetSize(value);
        }

        protected updateLevelBoundingInfo(): boolean {
            let v = this._computeMinMaxTrans();
            BoundingInfo2D.CreateFromMinMaxToRef(v.x, v.z, v.y, v.w, this._levelBoundingInfo);
            return true;
        }

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            // TODO !
            return true;
        }

        /**
         * Create an WireFrame 2D primitive
         * @param wireFrameGroups an array of WireFrameGroup. 
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y properties can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - size: the size of the sprite displayed in the canvas, if not specified the spriteSize will be used
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - alignToPixel: the rendered lines will be aligned to the rendering device' pixels
         * - isVisible: true if the sprite must be visible, false for hidden. Default is true.
         * - isPickable: if true the Primitive can be used with interaction mode and will issue Pointer Event. If false it will be ignored for interaction/intersection test. Default value is true.
         * - isContainer: if true the Primitive acts as a container for interaction, if the primitive is not pickable or doesn't intersection, no further test will be perform on its children. If set to false, children will always be considered for intersection/interaction. Default value is true.
         * - childrenFlatZOrder: if true all the children (direct and indirect) will share the same Z-Order. Use this when there's a lot of children which don't overlap. The drawing order IS NOT GUARANTED!
         * - levelCollision: this primitive is an actor of the Collision Manager and only this level will be used for collision (i.e. not the children). Use deepCollision if you want collision detection on the primitives and its children.
         * - deepCollision: this primitive is an actor of the Collision Manager, this level AND ALSO its children will be used for collision (note: you don't need to set the children as level/deepCollision).
         * - layoutData: a instance of a class implementing the ILayoutData interface that contain data to pass to the primitive parent's layout engine
         * - marginTop: top margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginLeft: left margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginRight: right margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - marginBottom: bottom margin, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - margin: top, left, right and bottom margin formatted as a single string (see PrimitiveThickness.fromString)
         * - marginHAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginVAlignment: one value of the PrimitiveAlignment type's static properties
         * - marginAlignment: a string defining the alignment, see PrimitiveAlignment.fromString
         * - paddingTop: top padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingLeft: left padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingRight: right padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - paddingBottom: bottom padding, can be a number (will be pixels) or a string (see PrimitiveThickness.fromString)
         * - padding: top, left, right and bottom padding formatted as a single string (see PrimitiveThickness.fromString)
         */
        constructor(wireFrameGroups: Array<WireFrameGroup2D>, settings?: {

            parent                ?: Prim2DBase,
            children              ?: Array<Prim2DBase>,
            id                    ?: string,
            position              ?: Vector2,
            x                     ?: number,
            y                     ?: number,
            rotation              ?: number,
            size                  ?: Size,
            scale                 ?: number,
            scaleX                ?: number,
            scaleY                ?: number,
            dontInheritParentScale?: boolean,
            opacity               ?: number,
            zOrder                ?: number, 
            origin                ?: Vector2,
            alignToPixel          ?: boolean,
            isVisible             ?: boolean,
            isPickable            ?: boolean,
            isContainer           ?: boolean,
            childrenFlatZOrder    ?: boolean,
            levelCollision        ?: boolean,
            deepCollision         ?: boolean,
            layoutData            ?: ILayoutData,
            marginTop             ?: number | string,
            marginLeft            ?: number | string,
            marginRight           ?: number | string,
            marginBottom          ?: number | string,
            margin                ?: number | string,
            marginHAlignment      ?: number,
            marginVAlignment      ?: number,
            marginAlignment       ?: string,
            paddingTop            ?: number | string,
            paddingLeft           ?: number | string,
            paddingRight          ?: number | string,
            paddingBottom         ?: number | string,
            padding               ?: number | string,
        }) {

            if (!settings) {
                settings = {};
            }

            super(settings);

            this._wireFrameGroups = new StringDictionary<WireFrameGroup2D>();
            for (let wfg of wireFrameGroups) {
                this._wireFrameGroups.add(wfg.id, wfg);
            }

            this._vtxTransparent = false;
            if (settings.size != null) {
                this.size = settings.size;
            }

            this.alignToPixel = (settings.alignToPixel == null) ? true : settings.alignToPixel;
        }

        /**
         * Get/set if the sprite rendering should be aligned to the target rendering device pixel or not
         */
        public get alignToPixel(): boolean {
            return this._alignToPixel;
        }

        public set alignToPixel(value: boolean) {
            this._alignToPixel = value;
        }

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new WireFrame2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <WireFrame2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            // Create the VertexBuffer
            this._updateVertexBuffer(renderCache);

            // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
            let ei = this.getDataPartEffectInfo(WireFrame2D.WIREFRAME2D_MAINPARTID, ["pos", "col"], [], true);
            if (ei) {
                renderCache.effectInstanced = engine.createEffect("wireframe2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            ei = this.getDataPartEffectInfo(WireFrame2D.WIREFRAME2D_MAINPARTID, ["pos", "col"], [], false);
            renderCache.effect = engine.createEffect("wireframe2d", ei.attributes, ei.uniforms, [], ei.defines, null);

            return renderCache;
        }

        public _updateVertexBuffer(mrc: WireFrame2DRenderCache) {
            let engine = this.owner.engine;

            if (mrc.vb != null) {
                engine._releaseBuffer(mrc.vb);
            }

            let vtxCount = 0;
            this._wireFrameGroups.forEach((k, v) => vtxCount += v.vertices.length);

            let vb = new Float32Array(vtxCount * 6);
            let i = 0;
            this._wireFrameGroups.forEach((k, v) => {
                for (let vtx of v.vertices) {
                    vb[i++] = vtx.x;
                    vb[i++] = vtx.y;
                    vb[i++] = vtx.r;
                    vb[i++] = vtx.g;
                    vb[i++] = vtx.b;
                    vb[i++] = vtx.a;
                }
            });

            mrc.vb = engine.createVertexBuffer(vb);
            mrc.vtxCount = vtxCount;
        }

        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            if (part.id === WireFrame2D.WIREFRAME2D_MAINPARTID) {
                let d = <WireFrame2DInstanceData>this._instanceDataParts[0];
                d.properties = new Vector3(this.alignToPixel ? 1 : 0, 2/this.renderGroup.actualWidth, 2/this.renderGroup.actualHeight);
            }
            return true;
        }

        private _computeMinMaxTrans(): Vector4 {
            let xmin = Number.MAX_VALUE;
            let xmax = Number.MIN_VALUE;
            let ymin = Number.MAX_VALUE;
            let ymax = Number.MIN_VALUE;
            let transparent = false;

            this._wireFrameGroups.forEach((k, v) => {
                for (let vtx of v.vertices) {
                    xmin = Math.min(xmin, vtx.x);
                    xmax = Math.max(xmax, vtx.x);
                    ymin = Math.min(ymin, vtx.y);
                    ymax = Math.max(ymax, vtx.y);

                    if (vtx.a < 1) {
                        transparent = true;
                    }
                }
            });

            this._vtxTransparent = transparent;
            this._size = new Size(xmax - xmin, ymax - ymin);
            return new Vector4(xmin, ymin, xmax, ymax);
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            return [new WireFrame2DInstanceData(WireFrame2D.WIREFRAME2D_MAINPARTID)];
        }

        private _vtxTransparent: boolean;
        private _wireFrameGroups: StringDictionary<WireFrameGroup2D>;
        private _alignToPixel: boolean;
    }

    export class WireFrame2DInstanceData extends InstanceDataBase {
        constructor(partId: number) {
            super(partId, 1);
        }

        // the properties is for now the alignedToPixel value
        @instanceData()
        get properties(): Vector3 {
            return null;
        }
        set properties(value: Vector3) {
        }
    }
}