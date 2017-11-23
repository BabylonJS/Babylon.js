module BABYLON {
    export class BoundingBoxRenderer {
        public frontColor = new Color3(1, 1, 1);
        public backColor = new Color3(0.1, 0.1, 0.1);
        public showBackLines = true;
        public renderList = new SmartArray<BoundingBox>(32);

        private _scene: Scene;
        private _colorShader: ShaderMaterial;
        private _vertexBuffers: { [key: string]: Nullable<VertexBuffer> } = {};
        private _indexBuffer: WebGLBuffer;

        constructor(scene: Scene) {
            this._scene = scene;
        }

        private _prepareRessources(): void {
            if (this._colorShader) {
                return;
            }

            this._colorShader = new ShaderMaterial("colorShader", this._scene, "color",
                {
                    attributes: [VertexBuffer.PositionKind],
                    uniforms: ["world", "viewProjection", "color"]
                });


            var engine = this._scene.getEngine();
            var boxdata = VertexData.CreateBox({ size: 1.0 });
            this._vertexBuffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, <FloatArray>boxdata.positions, VertexBuffer.PositionKind, false);
            this._createIndexBuffer();
        }

        private _createIndexBuffer(): void {
            var engine = this._scene.getEngine();
            this._indexBuffer = engine.createIndexBuffer([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 7, 1, 6, 2, 5, 3, 4]);
        }

        public _rebuild(): void {
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

            var engine = this._scene.getEngine();
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
                    this._scene.resetCachedMaterial();
                    this._colorShader.setColor4("color", this.backColor.toColor4());
                    this._colorShader.bind(worldMatrix);

                    // Draw order
                    engine.draw(false, 0, 24);
                }

                // Front
                engine.setDepthFunctionToLess();
                this._scene.resetCachedMaterial();
                this._colorShader.setColor4("color", this.frontColor.toColor4());
                this._colorShader.bind(worldMatrix);

                // Draw order
                engine.draw(false, 0, 24);
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

            var engine = this._scene.getEngine();
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
            this._scene.resetCachedMaterial();
            this._colorShader.bind(worldMatrix);

            engine.draw(false, 0, 24);

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
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
        }
    }
} 