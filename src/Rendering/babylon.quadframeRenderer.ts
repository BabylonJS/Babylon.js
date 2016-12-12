module BABYLON {

    class Quadframe {
        public ib: WebGLBuffer;
        public buffers: { [key: string]: VertexBuffer; } = {};
        public indicesCount: number;
        public mesh: AbstractMesh;
    }

    export class QuadframeRenderer {
        private _scene: Scene;
        private _frames = new Array<Quadframe>();
        private _lineShader: ShaderMaterial;

        public color = BABYLON.Color3.White();

        public constructor(scene: Scene) {
            this._scene = scene;

            scene.quadframeRenderers.push(this);

            this._prepareRessources();
        }

        private _prepareRessources(): void {
            if (this._lineShader) {
                return;
            }

            this._lineShader = new ShaderMaterial("lineShader", this._scene, "simpleLine",
                {
                    attributes: ["position"],
                    uniforms: ["worldViewProjection", "color"]
                });

            this._lineShader.disableDepthWrite = true;
            this._lineShader.backFaceCulling = false;
        }

        public addMesh(mesh: AbstractMesh): void {
            var frame = new Quadframe();
            frame.mesh = mesh;

            this._frames.push(frame);

            this._generateQuadLines(frame);
        }

        public removeMesh(mesh: AbstractMesh): void {       
            for (let index = 0; index < this._frames.length; index++) {

                if (this._frames[index].mesh === mesh) {
                    this._disposeFrame(this._frames[index]);
                    this._frames.splice(index, 1);
                    return;
                }
            }            
        }

        public render(): void {
            if (!this._lineShader.isReady()) {
                return;
            }

            var engine = this._scene.getEngine();
            this._lineShader._preBind();

            for (var index = 0; index < this._frames.length; index++) {
                var frame = this._frames[index];

                // VBOs
                engine.bindBuffers(frame.buffers, frame.ib, this._lineShader.getEffect());

                this._scene.resetCachedMaterial();
                this._lineShader.setColor3("color", this.color);

                this._lineShader.bind(frame.mesh.getWorldMatrix());

                // Draw order
                engine.draw(false, 0, frame.indicesCount);
            }
            this._lineShader.unbind();
            engine.setDepthWrite(true);
        }

        private _disposeFrame(frame: Quadframe) {
            frame.buffers[VertexBuffer.PositionKind].dispose();

            this._scene.getEngine()._releaseBuffer(frame.ib);
        }

        public dispose(): void {
            for (let index = 0; index < this._frames.length; index++) {
                this._disposeFrame(this._frames[index]);
            }
            
            this._lineShader.dispose();

            var index = this._scene.quadframeRenderers.indexOf(this);

            if (index !== -1) {
                this._scene.quadframeRenderers.splice(index, 1);
            }
        }

        private _checkInclusion(sourceIndices: number[], childIndices: number[], positions: number[] | Float32Array): number {
            var includedIndices = [];
            var sourceVector3 = Vector3.Zero();
            var childVector3 = Vector3.Zero();

            for (let index = 0; index < sourceIndices.length; index++) {

                Vector3.FromArrayToRef(positions, sourceIndices[index], sourceVector3);
                
                for (let childIndex = 0; childIndex < childIndices.length; childIndex++) {
                    Vector3.FromArrayToRef(positions, childIndices[childIndex], childVector3);

                    if (childVector3.equalsWithEpsilon(sourceVector3)) {
                        includedIndices.push(sourceIndices[index]);
                    }
                }
            }
            
            if (includedIndices.length === 2) {
                for (let index = 0; index < childIndices.length; index++) {
                    if (includedIndices.indexOf(childIndices[index]) === -1) {
                        return childIndices[index];
                    }
                }
            }

            return -1;
        }

        private _pumpPositions(positions: number[] | Float32Array, index: number, target: number[]) {
            for (var coordinateIndex = 0; coordinateIndex < 3; coordinateIndex++) {
                target.push(positions[index * 3 + coordinateIndex]);
            }
        }

        private _generateQuadLines(frame: Quadframe): void {
            var source = frame.mesh;
            var positions = source.getVerticesData(VertexBuffer.PositionKind);
            var indices = source.getIndices();            
            var linesPositions = new Array<number>();
            var linesIndices = new Array<number>();

            // Go through faces
            for (var index = 0; index < indices.length; index += 3) {
                var sourceIndices = [indices[index], indices[index + 1], indices[index + 2]];

                for (var childIndex = index + 3; childIndex < indices.length; childIndex += 3) {
                    var childIndices = [indices[childIndex], indices[childIndex + 1], indices[childIndex + 2]];

                    var fourthIndex = this._checkInclusion(sourceIndices, childIndices, positions);

                    if (fourthIndex !== -1 && sourceIndices.indexOf(fourthIndex) === -1) {
                        var currentCount = linesPositions.length / 3;

                        this._pumpPositions(positions, indices[index], linesPositions);
                        this._pumpPositions(positions, indices[index + 1], linesPositions);
                        this._pumpPositions(positions, indices[index + 2], linesPositions);
                        this._pumpPositions(positions, fourthIndex, linesPositions);

                        linesIndices.push(currentCount); linesIndices.push(currentCount + 1);
                        linesIndices.push(currentCount + 1); linesIndices.push(currentCount + 2);
                        linesIndices.push(currentCount + 2); linesIndices.push(currentCount + 3);
                        linesIndices.push(currentCount + 3); linesIndices.push(currentCount);
                    }
                }
            }

            // Merge into a single mesh
            var engine = this._scene.getEngine();

            frame.buffers[VertexBuffer.PositionKind] = new VertexBuffer(engine, linesPositions, VertexBuffer.PositionKind, false);
            frame.ib = engine.createIndexBuffer(linesIndices);
            frame.indicesCount = linesIndices.length;
        }
    }
}