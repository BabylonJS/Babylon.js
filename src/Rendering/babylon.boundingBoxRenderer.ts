module BABYLON {
    export interface Scene {
        /** @hidden (Backing field) */
        _boundingBoxRenderer: BoundingBoxRenderer;

        /** @hidden (Backing field) */
        _forceShowBoundingBoxes: boolean;

        /**
         * Gets or sets a boolean indicating if all bounding boxes must be rendered
         */    
        forceShowBoundingBoxes: boolean;

        /** 
         * Gets the bounding box renderer associated with the scene
         * @returns a BoundingBoxRenderer
         */
        getBoundingBoxRenderer(): BoundingBoxRenderer;
    }

    Object.defineProperty(Scene.prototype, "forceShowBoundingBoxes", {
        get: function (this:Scene) {
            return this._forceShowBoundingBoxes || false;
        },
        set: function (this:Scene, value: boolean) {
            this._forceShowBoundingBoxes = value;
            // Lazyly creates a BB renderer if needed.
            if (value) {
                this.getBoundingBoxRenderer();
            }
        },
        enumerable: true,
        configurable: true
    });

    Scene.prototype.getBoundingBoxRenderer = function(): BoundingBoxRenderer {

        if (!this._boundingBoxRenderer) {
            this._boundingBoxRenderer = new BoundingBoxRenderer(this);
        }

        return this._boundingBoxRenderer;
    }

    export class BoundingBoxRenderer implements ISceneComponent {
        /**
         * The component name helpfull to identify the component in the list of scene components.
         */
        public readonly name = SceneComponentConstants.NAME_BOUNDINGBOXRENDERER;

        /**
         * The scene the component belongs to.
         */
        public scene: Scene;

        public frontColor = new Color3(1, 1, 1);
        public backColor = new Color3(0.1, 0.1, 0.1);
        public showBackLines = true;
        public renderList = new SmartArray<BoundingBox>(32);

        private _colorShader: ShaderMaterial;
        private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
        private _indexBuffer: WebGLBuffer;

        constructor(scene: Scene) {
            this.scene = scene;
            scene._addComponent(this);
        }

        /**
         * Registers the component in a given scene
         */
        public register(): void {
            this.scene._beforeEvaluateActiveMeshStage.registerStep(SceneComponentConstants.STEP_BEFOREEVALUATEACTIVEMESH_BOUNDINGBOXRENDERER, this, this.reset);

            this.scene._activeMeshStage.registerStep(SceneComponentConstants.STEP_ACTIVEMESH_BOUNDINGBOXRENDERER, this, this._activeMesh);

            this.scene._evaluateSubMeshStage.registerStep(SceneComponentConstants.STEP_EVALUATESUBMESH_BOUNDINGBOXRENDERER, this, this._evaluateSubMesh);

            this.scene._afterCameraDrawStage.registerStep(SceneComponentConstants.STEP_AFTERCAMERADRAW_BOUNDINGBOXRENDERER, this, this.render);
        }

        private _evaluateSubMesh(mesh: AbstractMesh, subMesh: SubMesh): void {
            if (mesh.showSubMeshesBoundingBox) {
                const boundingInfo = subMesh.getBoundingInfo();
                if (boundingInfo !== null && boundingInfo !== undefined) {
                    this.renderList.push(boundingInfo.boundingBox);
                }
            }
        }

        private _activeMesh(sourceMesh: AbstractMesh, mesh: AbstractMesh): void {
            if (sourceMesh.showBoundingBox || this.scene.forceShowBoundingBoxes) {
                let boundingInfo = sourceMesh.getBoundingInfo();

                this.renderList.push(boundingInfo.boundingBox);
            }
        }

        private _prepareRessources(): void {
            if (this._colorShader) {
                return;
            }

            this._colorShader = new ShaderMaterial("colorShader", this.scene, "color",
                {
                    attributes: [VertexBuffer.PositionKind],
                    uniforms: ["world", "viewProjection", "color"]
                });


            var engine = this.scene.getEngine();
            var boxdata = VertexData.CreateBox({ size: 1.0 });
            this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, <FloatArray>boxdata.positions, VertexBuffer.PositionKind, false);
            this._createIndexBuffer();
        }

        private _createIndexBuffer(): void {
            var engine = this.scene.getEngine();
            this._indexBuffer = engine.createIndexBuffer([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 7, 1, 6, 2, 5, 3, 4]);
        }

        /**
         * Rebuilds the elements related to this component in case of
         * context lost for instance.
         */
        public rebuild(): void {
            let vb = this._vertexBuffers[VertexBuffer.PositionKind];
            if (vb) {
                vb._rebuild();
            }
            this._createIndexBuffer();
        }

        public reset(): void {
            this.renderList.reset();
        }

        public render(): void {
            if (this.renderList.length === 0) {
                return;
            }

            this._prepareRessources();

            if (!this._colorShader.isReady()) {
                return;
            }

            var engine = this.scene.getEngine();
            engine.setDepthWrite(false);
            this._colorShader._preBind();
            for (var boundingBoxIndex = 0; boundingBoxIndex < this.renderList.length; boundingBoxIndex++) {
                var boundingBox = this.renderList.data[boundingBoxIndex];
                var min = boundingBox.minimum;
                var max = boundingBox.maximum;
                var diff = max.subtract(min);
                var median = min.add(diff.scale(0.5));

                var worldMatrix = Matrix.Scaling(diff.x, diff.y, diff.z)
                    .multiply(Matrix.Translation(median.x, median.y, median.z))
                    .multiply(boundingBox.getWorldMatrix());

                // VBOs
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, <Effect>this._colorShader.getEffect());

                if (this.showBackLines) {
                    // Back
                    engine.setDepthFunctionToGreaterOrEqual();
                    this.scene.resetCachedMaterial();
                    this._colorShader.setColor4("color", this.backColor.toColor4());
                    this._colorShader.bind(worldMatrix);

                    // Draw order
                    engine.drawElementsType(Material.LineListDrawMode, 0, 24);
                }

                // Front
                engine.setDepthFunctionToLess();
                this.scene.resetCachedMaterial();
                this._colorShader.setColor4("color", this.frontColor.toColor4());
                this._colorShader.bind(worldMatrix);

                // Draw order
                engine.drawElementsType(Material.LineListDrawMode, 0, 24);
            }
            this._colorShader.unbind();
            engine.setDepthFunctionToLessOrEqual();
            engine.setDepthWrite(true);
        }

        public renderOcclusionBoundingBox(mesh: AbstractMesh): void {

            this._prepareRessources();

            if (!this._colorShader.isReady() || !mesh._boundingInfo) {
                return;
            }

            var engine = this.scene.getEngine();
            engine.setDepthWrite(false);
            engine.setColorWrite(false);
            this._colorShader._preBind();

            var boundingBox = mesh._boundingInfo.boundingBox;
            var min = boundingBox.minimum;
            var max = boundingBox.maximum;
            var diff = max.subtract(min);
            var median = min.add(diff.scale(0.5));

            var worldMatrix = Matrix.Scaling(diff.x, diff.y, diff.z)
                .multiply(Matrix.Translation(median.x, median.y, median.z))
                .multiply(boundingBox.getWorldMatrix());

            engine.bindBuffers(this._vertexBuffers, this._indexBuffer, <Effect>this._colorShader.getEffect());

            engine.setDepthFunctionToLess();
            this.scene.resetCachedMaterial();
            this._colorShader.bind(worldMatrix);

            engine.drawElementsType(Material.LineListDrawMode, 0, 24);

            this._colorShader.unbind();
            engine.setDepthFunctionToLessOrEqual();
            engine.setDepthWrite(true);
            engine.setColorWrite(true);
        }

        public dispose(): void {
            if (!this._colorShader) {
                return;
            }

            this.renderList.dispose();

            this._colorShader.dispose();

            var buffer = this._vertexBuffers[VertexBuffer.PositionKind];
            if (buffer) {
                buffer.dispose();
                this._vertexBuffers[VertexBuffer.PositionKind] = null;
            }
            this.scene.getEngine()._releaseBuffer(this._indexBuffer);
        }
    }
} 