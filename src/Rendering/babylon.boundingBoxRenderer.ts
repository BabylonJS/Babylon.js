module BABYLON {
    export class BoundingBoxRenderer {
        public frontColor = new Color3(1, 1, 1);
        public backColor = new Color3(0.1, 0.1, 0.1);
        public showBackLines = true;
        public renderList = new SmartArray<BoundingBox>(32);

        private _scene: Scene;
        private _colorShader: ShaderMaterial;
        private _vertexBuffer: VertexBuffer;
        private _vertexBuffers: { [key: string]: IVertexBuffer } = {};
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
                    uniforms: ["worldViewProjection", "color"]
                });


            var engine = this._scene.getEngine();
            var boxdata = VertexData.CreateBox(1.0);
            this._vertexBuffer = new VertexBuffer(engine, boxdata.positions, VertexBuffer.PositionKind, false);
            this._vertexBuffers[VertexBuffer.PositionKind] = this._vertexBuffer;
            this._indexBuffer = engine.createIndexBuffer([0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 7, 1, 6, 2, 5, 3, 4]);
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
                engine.bindBuffers(this._vertexBuffers, this._indexBuffer, this._colorShader.getEffect());

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

        public dispose(): void {
            if (!this._colorShader) {
                return;
            }

            this._colorShader.dispose();
            this._vertexBuffer.dispose();
            this._scene.getEngine()._releaseBuffer(this._indexBuffer);
        }
    }
} 