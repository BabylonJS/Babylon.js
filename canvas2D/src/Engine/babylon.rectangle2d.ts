﻿module BABYLON {
    export class Rectangle2DRenderCache extends ModelRenderCache {
        effectsReady: boolean                               = false;
        fillVB: WebGLBuffer                                 = null;
        fillIB: WebGLBuffer                                 = null;
        fillIndicesCount: number                            = 0;
        instancingFillAttributes: InstancingAttributeInfo[] = null;
        effectFill: Effect                                  = null;
        effectFillInstanced: Effect                         = null;

        borderVB: WebGLBuffer                                 = null;
        borderIB: WebGLBuffer                                 = null;
        borderIndicesCount: number                            = 0;
        instancingBorderAttributes: InstancingAttributeInfo[] = null;
        effectBorder: Effect                                  = null;
        effectBorderInstanced: Effect                         = null;

        constructor(engine: Engine, modelKey: string) {
            super(engine, modelKey);
        }

        render(instanceInfo: GroupInstanceInfo, context: Render2DContext): boolean {
            // Do nothing if the shader is still loading/preparing 
            if (!this.effectsReady) {
                if ((this.effectFill && (!this.effectFill.isReady() || (this.effectFillInstanced && !this.effectFillInstanced.isReady()))) ||
                    (this.effectBorder && (!this.effectBorder.isReady() || (this.effectBorderInstanced && !this.effectBorderInstanced.isReady())))) {
                    return false;
                }
                this.effectsReady = true;
            }

            let canvas = instanceInfo.owner.owner;
            var engine = canvas.engine;

            let depthFunction = 0;
            if (this.effectFill && this.effectBorder) {
                depthFunction = engine.getDepthFunction();
                engine.setDepthFunctionToLessOrEqual();
            }

            var curAlphaMode = engine.getAlphaMode();

            if (this.effectFill) {
                let partIndex = instanceInfo.partIndexFromId.get(Shape2D.SHAPE2D_FILLPARTID.toString());
                let pid = context.groupInfoPartData[partIndex];

                if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(Engine.ALPHA_COMBINE, true);
                }

                let effect = context.useInstancing ? this.effectFillInstanced : this.effectFill;

                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.fillVB, this.fillIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingFillAttributes) {
                        this.instancingFillAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_FILLPARTID, effect);
                    }

                    let glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    let count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingFillAttributes);
                    engine.draw(true, 0, this.fillIndicesCount, count);
                    engine.unbindInstanceAttributes();
                } else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.fillIndicesCount);                        
                    }
                }
            }

            if (this.effectBorder) {
                let partIndex = instanceInfo.partIndexFromId.get(Shape2D.SHAPE2D_BORDERPARTID.toString());
                let pid = context.groupInfoPartData[partIndex];

                if (context.renderMode !== Render2DContext.RenderModeOpaque) {
                    engine.setAlphaMode(Engine.ALPHA_COMBINE, true);
                }

                let effect = context.useInstancing ? this.effectBorderInstanced : this.effectBorder;

                engine.enableEffect(effect);
                engine.bindBuffersDirectly(this.borderVB, this.borderIB, [1], 4, effect);
                if (context.useInstancing) {
                    if (!this.instancingBorderAttributes) {
                        this.instancingBorderAttributes = this.loadInstancingAttributes(Shape2D.SHAPE2D_BORDERPARTID, effect);
                    }

                    let glBuffer = context.instancedBuffers ? context.instancedBuffers[partIndex] : pid._partBuffer;
                    let count = context.instancedBuffers ? context.instancesCount : pid._partData.usedElementCount;
                    canvas._addDrawCallCount(1, context.renderMode);
                    engine.updateAndBindInstancesBuffer(glBuffer, null, this.instancingBorderAttributes);
                    engine.draw(true, 0, this.borderIndicesCount, count);
                    engine.unbindInstanceAttributes();
                } else {
                    canvas._addDrawCallCount(context.partDataEndIndex - context.partDataStartIndex, context.renderMode);
                    for (let i = context.partDataStartIndex; i < context.partDataEndIndex; i++) {
                        this.setupUniforms(effect, partIndex, pid._partData, i);
                        engine.draw(true, 0, this.borderIndicesCount);
                    }
                }
            }

            engine.setAlphaMode(curAlphaMode, true);

            if (this.effectFill && this.effectBorder) {
                engine.setDepthFunction(depthFunction);
            }
            return true;
        }

        public dispose(): boolean {
            if (!super.dispose()) {
                return false;
            }

            if (this.fillVB) {
                this._engine._releaseBuffer(this.fillVB);
                this.fillVB = null;
            }

            if (this.fillIB) {
                this._engine._releaseBuffer(this.fillIB);
                this.fillIB = null;
            }

            this.effectFill = null;
            this.effectFillInstanced = null;
            this.effectBorder = null;
            this.effectBorderInstanced = null;

            if (this.borderVB) {
                this._engine._releaseBuffer(this.borderVB);
                this.borderVB = null;
            }

            if (this.borderIB) {
                this._engine._releaseBuffer(this.borderIB);
                this.borderIB = null;
            }


            return true;
        }
    }

    export class Rectangle2DInstanceData extends Shape2DInstanceData {
        constructor(partId: number) {
            super(partId, 1);
        }

        @instanceData()
        get properties(): Vector3 {
            return null;
        }
        set properties(value: Vector3) {
        }
    }

    @className("Rectangle2D", "BABYLON")
    /**
     * The Rectangle Primitive type
     */
    export class Rectangle2D extends Shape2D {

        public static actualSizeProperty: Prim2DPropInfo;
        public static notRoundedProperty: Prim2DPropInfo;
        public static roundRadiusProperty: Prim2DPropInfo;

        @modelLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 2, pi => Rectangle2D.notRoundedProperty = pi)
        /**
         * Get if the rectangle is notRound (returns true) or rounded (returns false).
         * Don't use the setter, it's for internal purpose only
         */
        public get notRounded(): boolean {
            return this._notRounded;
        }

        public set notRounded(value: boolean) {
            this._notRounded = value;
        }

        @instanceLevelProperty(Shape2D.SHAPE2D_PROPCOUNT + 3, pi => Rectangle2D.roundRadiusProperty = pi)
        /**
         * Get/set the round Radius, a value of 0 for a sharp edges rectangle, otherwise the value will be used as the diameter of the round to apply on corder. The Rectangle2D.notRounded property will be updated accordingly.
         */
        public get roundRadius(): number {
            return this._roundRadius;
        }

        public set roundRadius(value: number) {
            this._roundRadius = value;
            this.notRounded = value === 0;
            this._positioningDirty();
        }

        private static _i0 = Vector2.Zero();
        private static _i1 = Vector2.Zero();
        private static _i2 = Vector2.Zero();

        protected levelIntersect(intersectInfo: IntersectInfo2D): boolean {
            // If we got there it mean the boundingInfo intersection succeed, if the rectangle has not roundRadius, it means it succeed!
            if (this.notRounded) {
                return true;
            }

            // If we got so far it means the bounding box at least passed, so we know it's inside the bounding rectangle, but it can be outside the roundedRectangle.
            // The easiest way is to check if the point is inside on of the four corners area (a little square of roundRadius size at the four corners)
            // If it's the case for one, check if the mouse is located in the quarter that we care about (the one who is visible) then finally make a distance check with the roundRadius radius to see if it's inside the circle quarter or outside.

            // First let remove the origin out the equation, to have the rectangle with an origin at bottom/left
            let size = this.size;
            Rectangle2D._i0.x = intersectInfo._localPickPosition.x;
            Rectangle2D._i0.y = intersectInfo._localPickPosition.y;

            let rr = this.roundRadius;
            let rrs = rr * rr;

            // Check if the point is in the bottom/left quarter area
            Rectangle2D._i1.x = rr;
            Rectangle2D._i1.y = rr;
            if (Rectangle2D._i0.x <= Rectangle2D._i1.x && Rectangle2D._i0.y <= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;

                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }

            // Check if the point is in the top/left quarter area
            Rectangle2D._i1.x = rr;
            Rectangle2D._i1.y = size.height - rr;
            if (Rectangle2D._i0.x <= Rectangle2D._i1.x && Rectangle2D._i0.y >= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;

                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }

            // Check if the point is in the top/right quarter area
            Rectangle2D._i1.x = size.width - rr;
            Rectangle2D._i1.y = size.height - rr;
            if (Rectangle2D._i0.x >= Rectangle2D._i1.x && Rectangle2D._i0.y >= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;

                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }


            // Check if the point is in the bottom/right quarter area
            Rectangle2D._i1.x = size.width - rr;
            Rectangle2D._i1.y = rr;
            if (Rectangle2D._i0.x >= Rectangle2D._i1.x && Rectangle2D._i0.y <= Rectangle2D._i1.y) {
                // Compute the intersection point in the quarter local space
                Rectangle2D._i2.x = Rectangle2D._i0.x - Rectangle2D._i1.x;
                Rectangle2D._i2.y = Rectangle2D._i0.y - Rectangle2D._i1.y;

                // It's a hit if the squared distance is less/equal to the squared radius of the round circle
                return Rectangle2D._i2.lengthSquared() <= rrs;
            }

            // At any other locations the point is guarantied to be inside

            return true;
        }

        protected updateLevelBoundingInfo(): boolean {
            BoundingInfo2D.CreateFromSizeToRef(this.actualSize, this._levelBoundingInfo);
            return true;
        }

        /**
         * Create an Rectangle 2D Shape primitive. May be a sharp rectangle (with sharp corners), or a rounded one.
         * @param settings a combination of settings, possible ones are
         * - parent: the parent primitive/canvas, must be specified if the primitive is not constructed as a child of another one (i.e. as part of the children array setting)
         * - children: an array of direct children
         * - id a text identifier, for information purpose
         * - position: the X & Y positions relative to its parent. Alternatively the x and y settings can be set. Default is [0;0]
         * - rotation: the initial rotation (in radian) of the primitive. default is 0
         * - scale: the initial scale of the primitive. default is 1. You can alternatively use scaleX &| scaleY to apply non uniform scale
         * - dontInheritParentScale: if set the parent's scale won't be taken into consideration to compute the actualScale property
         * - alignToPixel: if true the primitive will be aligned to the target rendering device's pixel
         * - opacity: set the overall opacity of the primitive, 1 to be opaque (default), less than 1 to be transparent.
         * - zOrder: override the zOrder with the specified value
         * - origin: define the normalized origin point location, default [0.5;0.5]
         * - size: the size of the group. Alternatively the width and height settings can be set. Default will be [10;10].
         * - roundRadius: if the rectangle has rounded corner, set their radius, default is 0 (to get a sharp edges rectangle).
         * - fill: the brush used to draw the fill content of the rectangle, you can set null to draw nothing (but you will have to set a border brush), default is a SolidColorBrush of plain white. can also be a string value (see Canvas2D.GetBrushFromString)
         * - border: the brush used to draw the border of the rectangle, you can set null to draw nothing (but you will have to set a fill brush), default is null. can also be a string value (see Canvas2D.GetBrushFromString)
         * - borderThickness: the thickness of the drawn border, default is 1.
         * - isVisible: true if the primitive must be visible, false for hidden. Default is true.
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
        constructor(settings      ?: {
            parent                ?: Prim2DBase, 
            children              ?: Array<Prim2DBase>,
            id                    ?: string,
            position              ?: Vector2,
            x                     ?: number,
            y                     ?: number,
            rotation              ?: number,
            scale                 ?: number,
            scaleX                ?: number,
            scaleY                ?: number,
            dontInheritParentScale?: boolean,
            alignToPixel          ?: boolean,
            opacity               ?: number,
            zOrder                ?: number, 
            origin                ?: Vector2,
            size                  ?: Size,
            width                 ?: number,
            height                ?: number,
            roundRadius           ?: number,
            fill                  ?: IBrush2D | string,
            border                ?: IBrush2D | string,
            borderThickness       ?: number,
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

            // Avoid checking every time if the object exists
            if (settings == null) {
                settings = {};
            }

            super(settings);

            if (settings.size != null) {
                this.size = settings.size;
            }
            else if (settings.width || settings.height) {
                let size = new Size(settings.width, settings.height);
                this.size = size;
            }

            //let size            = settings.size || (new Size((settings.width === null) ? null : (settings.width || 10), (settings.height === null) ? null : (settings.height || 10)));
            let roundRadius     = (settings.roundRadius == null) ? 0 : settings.roundRadius;
            let borderThickness = (settings.borderThickness == null) ? 1 : settings.borderThickness;

            //this.size            = size;
            this.roundRadius     = roundRadius;
            this.borderThickness = borderThickness;
        }

        public static roundSubdivisions = 16;

        protected createModelRenderCache(modelKey: string): ModelRenderCache {
            let renderCache = new Rectangle2DRenderCache(this.owner.engine, modelKey);
            return renderCache;
        }

        protected updateTriArray() {
            // Not Rounded = sharp edge rect, the default implementation is the right one!
            if (this.notRounded) {
                super.updateTriArray();
                return;
            }

            // Rounded Corner? It's more complicated! :)

            let subDiv = Rectangle2D.roundSubdivisions * 4;
            if (this._primTriArray == null) {
                this._primTriArray = new Tri2DArray(subDiv);
            } else {
                this._primTriArray.clear(subDiv);
            }

            let size = this.actualSize;
			let w = size.width;
			let h = size.height;
            let r = this.roundRadius;
            let rsub0 = subDiv * 0.25;
            let rsub1 = subDiv * 0.50;
            let rsub2 = subDiv * 0.75;
            let center = new Vector2(0.5 * size.width, 0.5 * size.height);
            let twopi = Math.PI * 2;
			let nru = r / w;
			let nrv = r / h;

            let computePos = (index: number, p: Vector2) => {
			    // right/bottom
			    if (index < rsub0) {
				    p.x = 1.0 - nru;
				    p.y = nrv;
			    }
			    // left/bottom
			    else if (index < rsub1) {
				    p.x = nru;
				    p.y = nrv;
			    }
			    // left/top
			    else if (index < rsub2) {
				    p.x = nru;
				    p.y = 1.0 - nrv;
			    }
			    // right/top
			    else {
				    p.x = 1.0 - nru;
				    p.y = 1.0 - nrv;
			    }

                let angle = twopi - (index * twopi / (subDiv - 0.5));
			    p.x += Math.cos(angle) * nru;
                p.y += Math.sin(angle) * nrv;
                p.x *= w;
                p.y *= h;
            }

            console.log("Genetre TriList for " + this.id);
            let first = Vector2.Zero();
            let cur = Vector2.Zero();
            computePos(0, first);
            let prev = first.clone();
            for (let index = 1; index < subDiv; index++) {
                computePos(index, cur);
                this._primTriArray.storeTriangle(index - 1, center, prev, cur);
                console.log(`${index-1}, ${center}, ${prev}, ${cur}`);
                prev.copyFrom(cur);
            }
            this._primTriArray.storeTriangle(subDiv-1, center, first, prev);
                console.log(`${subDiv-1}, ${center}, ${prev}, ${first}`);

        }

        protected setupModelRenderCache(modelRenderCache: ModelRenderCache) {
            let renderCache = <Rectangle2DRenderCache>modelRenderCache;
            let engine = this.owner.engine;

            // Need to create WebGL resources for fill part?
            if (this.fill) {
                let vbSize = ((this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4) + 1;
                let vb = new Float32Array(vbSize);
                for (let i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.fillVB = engine.createVertexBuffer(vb);

                let triCount = vbSize - 1;
                let ib = new Float32Array(triCount * 3);
                for (let i = 0; i < triCount; i++) {
                    ib[i * 3 + 0] = 0;
                    ib[i * 3 + 2] = i + 1;
                    ib[i * 3 + 1] = i + 2;
                }
                ib[triCount * 3 - 2] = 1;

                renderCache.fillIB = engine.createIndexBuffer(ib);
                renderCache.fillIndicesCount = triCount * 3;

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectFillInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_FILLPARTID, ["index"], null, false);
                renderCache.effectFill = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            // Need to create WebGL resource for border part?
            if (this.border) {
                let vbSize = (this.notRounded ? 1 : Rectangle2D.roundSubdivisions) * 4 * 2;
                let vb = new Float32Array(vbSize);
                for (let i = 0; i < vbSize; i++) {
                    vb[i] = i;
                }
                renderCache.borderVB = engine.createVertexBuffer(vb);

                let triCount = vbSize;
                let rs = triCount / 2;
                let ib = new Float32Array(triCount * 3);
                for (let i = 0; i < rs; i++) {
                    let r0 = i;
                    let r1 = (i + 1) % rs;

                    ib[i * 6 + 0] = rs + r1;
                    ib[i * 6 + 1] = rs + r0;
                    ib[i * 6 + 2] = r0;

                    ib[i * 6 + 3] = r1;
                    ib[i * 6 + 4] = rs + r1;
                    ib[i * 6 + 5] = r0;
                }

                renderCache.borderIB = engine.createIndexBuffer(ib);
                renderCache.borderIndicesCount = triCount * 3;

                // Get the instanced version of the effect, if the engine does not support it, null is return and we'll only draw on by one
                let ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, true);
                if (ei) {
                    renderCache.effectBorderInstanced = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
                }

                // Get the non instanced version
                ei = this.getDataPartEffectInfo(Shape2D.SHAPE2D_BORDERPARTID, ["index"], null, false);
                renderCache.effectBorder = engine.createEffect("rect2d", ei.attributes, ei.uniforms, [], ei.defines, null);
            }

            return renderCache;
        }

        // We override this method because if there's a roundRadius set, we will reduce the initial Content Area to make sure the computed area won't intersect with the shape contour. The formula is simple: we shrink the incoming size by the amount of the roundRadius
        protected _getInitialContentAreaToRef(primSize: Size, initialContentPosition: Vector4, initialContentArea: Size) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                super._getInitialContentAreaToRef(primSize, initialContentPosition, initialContentArea);
            } else {
                let rr = Math.round((this.roundRadius - (this.roundRadius/Math.sqrt(2))) * 1.3);
                initialContentPosition.x = initialContentPosition.y = rr;
                initialContentArea.width = Math.max(0, primSize.width - (rr * 2));
                initialContentArea.height = Math.max(0, primSize.height - (rr * 2));
                initialContentPosition.z = primSize.width - (initialContentPosition.x + initialContentArea.width);
                initialContentPosition.w = primSize.height - (initialContentPosition.y + initialContentArea.height);
            }
        }

        protected _getActualSizeFromContentToRef(primSize: Size, paddingOffset: Vector4, newPrimSize: Size) {
            // Fall back to default implementation if there's no round Radius
            if (this._notRounded) {
                super._getActualSizeFromContentToRef(primSize, paddingOffset, newPrimSize);
            } else {
                let rr = Math.round((this.roundRadius - (this.roundRadius / Math.sqrt(2))) * 1.3);
                newPrimSize.copyFrom(primSize);
                newPrimSize.width  += rr * 2;
                newPrimSize.height += rr * 2;
                paddingOffset.x += rr;
                paddingOffset.y += rr;
                paddingOffset.z += rr;
                paddingOffset.w += rr;
            }
        }

        protected createInstanceDataParts(): InstanceDataBase[] {
            var res = new Array<InstanceDataBase>();
            if (this.border) {
                res.push(new Rectangle2DInstanceData(Shape2D.SHAPE2D_BORDERPARTID));
            }
            if (this.fill) {
                res.push(new Rectangle2DInstanceData(Shape2D.SHAPE2D_FILLPARTID));
            }
            return res;
        }

        private static _riv0 = new Vector2(0,0);
        protected refreshInstanceDataPart(part: InstanceDataBase): boolean {
            if (!super.refreshInstanceDataPart(part)) {
                return false;
            }

            //let s = Rectangle2D._riv0;
            //this.getActualGlobalScaleToRef(s);

            if (part.id === Shape2D.SHAPE2D_BORDERPARTID) {
                let d = <Rectangle2DInstanceData>part;
                let size = this.actualSize;
                d.properties = new Vector3(size.width/* * s.x*/, size.height/* * s.y*/, this.roundRadius || 0);
            }
            else if (part.id === Shape2D.SHAPE2D_FILLPARTID) {
                let d = <Rectangle2DInstanceData>part;
                let size = this.actualSize;
                d.properties = new Vector3(size.width/* * s.x*/, size.height/* * s.y*/, this.roundRadius || 0);
            }
            return true;
        }

        private _notRounded: boolean;
        private _roundRadius: number;
    }
}