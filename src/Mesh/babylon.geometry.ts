module BABYLON {
    export class Geometry implements IGetSetVerticesData {
        // Members
        public id: string;
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;
        public delayLoadingFile: string;
        public onGeometryUpdated: (geometry: Geometry, kind?: string) => void;

        // Private
        private _scene: Scene;
        private _engine: Engine;
        private _meshes: Mesh[];
        private _totalVertices = 0;
        private _indices: number[] | Int32Array;
        private _vertexBuffers: { [key: string]: VertexBuffer; };
        private _isDisposed = false;
        private _extend: { minimum: Vector3, maximum: Vector3 };
        private _boundingBias: Vector2;
        public _delayInfo; //ANY
        private _indexBuffer: WebGLBuffer;
        public _boundingInfo: BoundingInfo;
        public _delayLoadingFunction: (any: any, geometry: Geometry) => void;
        public _softwareSkinningRenderId: number;

        /**
         *  The Bias Vector to apply on the bounding elements (box/sphere), the max extend is computed as v += v * bias.x + bias.y, the min is computed as v -= v * bias.x + bias.y 
         * @returns The Bias Vector 
         */
        public get boundingBias(): Vector2 {
            return this._boundingBias;
        }

        public set boundingBias(value: Vector2) {
            if (this._boundingBias && this._boundingBias.equals(value)) {
                return;
            }

            this._boundingBias = value.clone();

            this.updateBoundingInfo(true, null);
        }

        constructor(id: string, scene: Scene, vertexData?: VertexData, updatable?: boolean, mesh?: Mesh) {
            this.id = id;
            this._engine = scene.getEngine();
            this._meshes = [];
            this._scene = scene;
            //Init vertex buffer cache
            this._vertexBuffers = {};
            this._indices = [];

            // vertexData
            if (vertexData) {
                this.setAllVerticesData(vertexData, updatable);
            }
            else {
                this._totalVertices = 0;
                this._indices = [];
            }

            // applyToMesh
            if (mesh) {
                if (mesh instanceof LinesMesh) {
                    this.boundingBias = new Vector2(0, mesh.intersectionThreshold);
                    this.updateExtend();
                }

                this.applyToMesh(mesh);
                mesh.computeWorldMatrix(true);
            }
        }

        public get extend(): { minimum: Vector3, maximum: Vector3 } {
            return this._extend;
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getEngine(): Engine {
            return this._engine;
        }

        public isReady(): boolean {
            return this.delayLoadState === Engine.DELAYLOADSTATE_LOADED || this.delayLoadState === Engine.DELAYLOADSTATE_NONE;
        }

        public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void {
            vertexData.applyToGeometry(this, updatable);
            this.notifyUpdate();
        }

        public setVerticesData(kind: string, data: number[] | Float32Array, updatable?: boolean, stride?: number): void {
            var buffer = new VertexBuffer(this._engine, data, kind, updatable, this._meshes.length === 0, stride);

            this.setVerticesBuffer(buffer);
        }

        public setVerticesBuffer(buffer: VertexBuffer): void {
            var kind = buffer.getKind();
            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].dispose();
            }

            this._vertexBuffers[kind] = buffer;

            if (kind === VertexBuffer.PositionKind) {
                var data = buffer.getData();
                var stride = buffer.getStrideSize();

                this._totalVertices = data.length / stride;

                this.updateExtend(data, stride);

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    mesh._boundingInfo = new BoundingInfo(this._extend.minimum, this._extend.maximum);
                    mesh._createGlobalSubMesh();
                    mesh.computeWorldMatrix(true);
                }
            }

            this.notifyUpdate(kind);
        }

        public updateVerticesDataDirectly(kind: string, data: Float32Array, offset: number): void {
            var vertexBuffer = this.getVertexBuffer(kind);

            if (!vertexBuffer) {
                return;
            }

            vertexBuffer.updateDirectly(data, offset);
            this.notifyUpdate(kind);
        }

        public updateVerticesData(kind: string, data: number[] | Float32Array, updateExtends?: boolean): void {
            var vertexBuffer = this.getVertexBuffer(kind);

            if (!vertexBuffer) {
                return;
            }

            vertexBuffer.update(data);

            if (kind === VertexBuffer.PositionKind) {

                var stride = vertexBuffer.getStrideSize();
                this._totalVertices = data.length / stride;

                this.updateBoundingInfo(updateExtends, data);
            }
            this.notifyUpdate(kind);
        }

        private updateBoundingInfo(updateExtends: boolean, data: number[] | Float32Array) {
            if (updateExtends) {
                this.updateExtend(data);
            }

            var meshes = this._meshes;
            var numOfMeshes = meshes.length;

            for (var index = 0; index < numOfMeshes; index++) {
                var mesh = meshes[index];
                mesh._resetPointsArrayCache();
                if (updateExtends) {
                    mesh._boundingInfo = new BoundingInfo(this._extend.minimum, this._extend.maximum);

                    for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                        var subMesh = mesh.subMeshes[subIndex];

                        subMesh.refreshBoundingInfo();
                    }
                }
            }
        }

        public getTotalVertices(): number {
            if (!this.isReady()) {
                return 0;
            }

            return this._totalVertices;
        }

        public getVerticesData(kind: string, copyWhenShared?: boolean): number[] | Float32Array {
            var vertexBuffer = this.getVertexBuffer(kind);
            if (!vertexBuffer) {
                return null;
            }
            var orig = vertexBuffer.getData();
            if (!copyWhenShared || this._meshes.length === 1) {
                return orig;
            } else {
                var len = orig.length;
                var copy = [];
                for (var i = 0; i < len; i++) {
                    copy.push(orig[i]);
                }
                return copy;
            }
        }

        public getVertexBuffer(kind: string): VertexBuffer {
            if (!this.isReady()) {
                return null;
            }
            return this._vertexBuffers[kind];
        }

        public getVertexBuffers(): { [key: string]: VertexBuffer; } {
            if (!this.isReady()) {
                return null;
            }
            return this._vertexBuffers;
        }

        public isVerticesDataPresent(kind: string): boolean {
            if (!this._vertexBuffers) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._vertexBuffers[kind] !== undefined;
        }

        public getVerticesDataKinds(): string[] {
            var result = [];
            var kind;
            if (!this._vertexBuffers && this._delayInfo) {
                for (kind in this._delayInfo) {
                    result.push(kind);
                }
            } else {
                for (kind in this._vertexBuffers) {
                    result.push(kind);
                }
            }

            return result;
        }

        public setIndices(indices: number[] | Int32Array, totalVertices?: number): void {
            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }

            this._indices = indices;
            if (this._meshes.length !== 0 && this._indices) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }

            if (totalVertices !== undefined) {
                this._totalVertices = totalVertices;
            }

            var meshes = this._meshes;
            var numOfMeshes = meshes.length;

            for (var index = 0; index < numOfMeshes; index++) {
                meshes[index]._createGlobalSubMesh();
            }
            this.notifyUpdate();
        }

        public getTotalIndices(): number {
            if (!this.isReady()) {
                return 0;
            }
            return this._indices.length;
        }

        public getIndices(copyWhenShared?: boolean): number[] | Int32Array {
            if (!this.isReady()) {
                return null;
            }
            var orig = this._indices;
            if (!copyWhenShared || this._meshes.length === 1) {
                return orig;
            } else {
                var len = orig.length;
                var copy = [];
                for (var i = 0; i < len; i++) {
                    copy.push(orig[i]);
                }
                return copy;
            }
        }

        public getIndexBuffer(): WebGLBuffer {
            if (!this.isReady()) {
                return null;
            }
            return this._indexBuffer;
        }

        public releaseForMesh(mesh: Mesh, shouldDispose?: boolean): void {
            var meshes = this._meshes;
            var index = meshes.indexOf(mesh);

            if (index === -1) {
                return;
            }

            for (var kind in this._vertexBuffers) {
                this._vertexBuffers[kind].dispose();
            }

            if (this._indexBuffer && this._engine._releaseBuffer(this._indexBuffer)) {
                this._indexBuffer = null;
            }

            meshes.splice(index, 1);

            mesh._geometry = null;

            if (meshes.length === 0 && shouldDispose) {
                this.dispose();
            }
        }

        public applyToMesh(mesh: Mesh): void {
            if (mesh._geometry === this) {
                return;
            }

            var previousGeometry = mesh._geometry;
            if (previousGeometry) {
                previousGeometry.releaseForMesh(mesh);
            }

            var meshes = this._meshes;

            // must be done before setting vertexBuffers because of mesh._createGlobalSubMesh()
            mesh._geometry = this;

            this._scene.pushGeometry(this);

            meshes.push(mesh);

            if (this.isReady()) {
                this._applyToMesh(mesh);
            }
            else {
                mesh._boundingInfo = this._boundingInfo;
            }
        }

        private updateExtend(data = null, stride? : number) {
            if (!data) {
                data = this._vertexBuffers[VertexBuffer.PositionKind].getData();
            }

            this._extend = Tools.ExtractMinAndMax(data, 0, this._totalVertices, this.boundingBias, stride);
        }

        private _applyToMesh(mesh: Mesh): void {
            var numOfMeshes = this._meshes.length;

            // vertexBuffers
            for (var kind in this._vertexBuffers) {
                if (numOfMeshes === 1) {
                    this._vertexBuffers[kind].create();
                }
                this._vertexBuffers[kind].getBuffer().references = numOfMeshes;

                if (kind === VertexBuffer.PositionKind) {
                    mesh._resetPointsArrayCache();

                    if (!this._extend) {
                        this.updateExtend(this._vertexBuffers[kind].getData());
                    }
                    mesh._boundingInfo = new BoundingInfo(this._extend.minimum, this._extend.maximum);

                    mesh._createGlobalSubMesh();

                    //bounding info was just created again, world matrix should be applied again.
                    mesh._updateBoundingInfo();
                }
            }

            // indexBuffer
            if (numOfMeshes === 1 && this._indices && this._indices.length > 0) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }
            if (this._indexBuffer) {
                this._indexBuffer.references = numOfMeshes;
            }
        }

        private notifyUpdate(kind?: string) {
            if (this.onGeometryUpdated) {
                this.onGeometryUpdated(this, kind);
            }
        }

        public load(scene: Scene, onLoaded?: () => void): void {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_LOADING) {
                return;
            }

            if (this.isReady()) {
                if (onLoaded) {
                    onLoaded();
                }
                return;
            }

            this.delayLoadState = Engine.DELAYLOADSTATE_LOADING;

            this._queueLoad(scene, onLoaded);
        }

        private _queueLoad(scene: Scene, onLoaded?: () => void): void {
            scene._addPendingData(this);
            Tools.LoadFile(this.delayLoadingFile, data => {
                this._delayLoadingFunction(JSON.parse(data), this);

                this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
                this._delayInfo = [];

                scene._removePendingData(this);

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;
                for (var index = 0; index < numOfMeshes; index++) {
                    this._applyToMesh(meshes[index]);
                }

                if (onLoaded) {
                    onLoaded();
                }
            }, () => { }, scene.database);
        }

        /**
         * Invert the geometry to move from a right handed system to a left handed one.
         */
        public toLeftHanded(): void {

            // Flip faces
            let tIndices = this.getIndices(false);
            if (tIndices != null && tIndices.length > 0) {
                for (let i = 0; i < tIndices.length; i += 3) {
                    let tTemp = tIndices[i + 0];
                    tIndices[i + 0] = tIndices[i + 2];
                    tIndices[i + 2] = tTemp;
                }
                this.setIndices(tIndices);
            }

            // Negate position.z
            let tPositions = this.getVerticesData(VertexBuffer.PositionKind, false);
            if (tPositions != null && tPositions.length > 0) {
                for (let i = 0; i < tPositions.length; i += 3) {
                    tPositions[i + 2] = -tPositions[i + 2];
                }
                this.setVerticesData(VertexBuffer.PositionKind, tPositions, false);
            }

            // Negate normal.z
            let tNormals = this.getVerticesData(VertexBuffer.NormalKind, false);
            if (tNormals != null && tNormals.length > 0) {
                for (let i = 0; i < tNormals.length; i += 3) {
                    tNormals[i + 2] = -tNormals[i + 2];
                }
                this.setVerticesData(VertexBuffer.NormalKind, tNormals, false);
            }
        }

        public isDisposed(): boolean {
            return this._isDisposed;
        }

        public dispose(): void {
            var meshes = this._meshes;
            var numOfMeshes = meshes.length;
            var index: number;
            for (index = 0; index < numOfMeshes; index++) {
                this.releaseForMesh(meshes[index]);
            }
            this._meshes = [];

            for (var kind in this._vertexBuffers) {
                this._vertexBuffers[kind].dispose();
            }
            this._vertexBuffers = {};
            this._totalVertices = 0;

            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }
            this._indexBuffer = null;
            this._indices = [];

            this.delayLoadState = Engine.DELAYLOADSTATE_NONE;
            this.delayLoadingFile = null;
            this._delayLoadingFunction = null;
            this._delayInfo = [];

            this._boundingInfo = null;

            this._scene.removeGeometry(this);
            this._isDisposed = true;
        }

        public copy(id: string): Geometry {
            var vertexData = new VertexData();

            vertexData.indices = [];

            var indices = this.getIndices();
            for (var index = 0; index < indices.length; index++) {
                (<number[]>vertexData.indices).push(indices[index]);
            }

            var updatable = false;
            var stopChecking = false;
            var kind;
            for (kind in this._vertexBuffers) {
                // using slice() to make a copy of the array and not just reference it
                var data = this.getVerticesData(kind);

                if (data instanceof Float32Array) {
                    vertexData.set(new Float32Array(<Float32Array>data), kind);
                } else {
                    vertexData.set((<number[]>data).slice(0), kind);
                }
                if (!stopChecking) {
                    updatable = this.getVertexBuffer(kind).isUpdatable();
                    stopChecking = !updatable;
                }
            }

            var geometry = new Geometry(id, this._scene, vertexData, updatable, null);

            geometry.delayLoadState = this.delayLoadState;
            geometry.delayLoadingFile = this.delayLoadingFile;
            geometry._delayLoadingFunction = this._delayLoadingFunction;

            for (kind in this._delayInfo) {
                geometry._delayInfo = geometry._delayInfo || [];
                geometry._delayInfo.push(kind);
            }

            // Bounding info
            geometry._boundingInfo = new BoundingInfo(this._extend.minimum, this._extend.maximum);

            return geometry;
        }

        public serialize(): any {
            var serializationObject: any = {};

            serializationObject.id = this.id;

            if (Tags.HasTags(this)) {
                serializationObject.tags = Tags.GetTags(this);
            }

            return serializationObject;
        }

        public serializeVerticeData(): any {
            var serializationObject = this.serialize();

            if (this.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                serializationObject.positions = this.getVerticesData(VertexBuffer.PositionKind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                serializationObject.normals = this.getVerticesData(VertexBuffer.NormalKind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.UVKind)) {
                serializationObject.uvs = this.getVerticesData(VertexBuffer.UVKind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                serializationObject.uvs2 = this.getVerticesData(VertexBuffer.UV2Kind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.UV3Kind)) {
                serializationObject.uvs3 = this.getVerticesData(VertexBuffer.UV3Kind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.UV4Kind)) {
                serializationObject.uvs4 = this.getVerticesData(VertexBuffer.UV4Kind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.UV5Kind)) {
                serializationObject.uvs5 = this.getVerticesData(VertexBuffer.UV5Kind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.UV6Kind)) {
                serializationObject.uvs6 = this.getVerticesData(VertexBuffer.UV6Kind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                serializationObject.colors = this.getVerticesData(VertexBuffer.ColorKind);
            }

            if (this.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind)) {
                serializationObject.matricesIndices = this.getVerticesData(VertexBuffer.MatricesIndicesKind);
                serializationObject.matricesIndices._isExpanded = true;
            }

            if (this.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)) {
                serializationObject.matricesWeights = this.getVerticesData(VertexBuffer.MatricesWeightsKind);
            }

            serializationObject.indices = this.getIndices();

            return serializationObject;
        }

        // Statics
        public static ExtractFromMesh(mesh: Mesh, id: string): Geometry {
            var geometry = mesh._geometry;

            if (!geometry) {
                return null;
            }

            return geometry.copy(id);
        }

        /**
         * You should now use Tools.RandomId(), this method is still here for legacy reasons.
         * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
         * Be aware Math.random() could cause collisions, but:
         * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
         */
        public static RandomId(): string {
            return Tools.RandomId();
        }

        public static ImportGeometry(parsedGeometry: any, mesh: Mesh): void {
            var scene = mesh.getScene();

            // Geometry
            var geometryId = parsedGeometry.geometryId;
            if (geometryId) {
                var geometry = scene.getGeometryByID(geometryId);
                if (geometry) {
                    geometry.applyToMesh(mesh);
                }
            } else if (parsedGeometry instanceof ArrayBuffer) {

                var binaryInfo = mesh._binaryInfo;

                if (binaryInfo.positionsAttrDesc && binaryInfo.positionsAttrDesc.count > 0) {
                    var positionsData = new Float32Array(parsedGeometry, binaryInfo.positionsAttrDesc.offset, binaryInfo.positionsAttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.PositionKind, positionsData, false);
                }

                if (binaryInfo.normalsAttrDesc && binaryInfo.normalsAttrDesc.count > 0) {
                    var normalsData = new Float32Array(parsedGeometry, binaryInfo.normalsAttrDesc.offset, binaryInfo.normalsAttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.NormalKind, normalsData, false);
                }

                if (binaryInfo.uvsAttrDesc && binaryInfo.uvsAttrDesc.count > 0) {
                    var uvsData = new Float32Array(parsedGeometry, binaryInfo.uvsAttrDesc.offset, binaryInfo.uvsAttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.UVKind, uvsData, false);
                }

                if (binaryInfo.uvs2AttrDesc && binaryInfo.uvs2AttrDesc.count > 0) {
                    var uvs2Data = new Float32Array(parsedGeometry, binaryInfo.uvs2AttrDesc.offset, binaryInfo.uvs2AttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.UV2Kind, uvs2Data, false);
                }

                if (binaryInfo.uvs3AttrDesc && binaryInfo.uvs3AttrDesc.count > 0) {
                    var uvs3Data = new Float32Array(parsedGeometry, binaryInfo.uvs3AttrDesc.offset, binaryInfo.uvs3AttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.UV3Kind, uvs3Data, false);
                }

                if (binaryInfo.uvs4AttrDesc && binaryInfo.uvs4AttrDesc.count > 0) {
                    var uvs4Data = new Float32Array(parsedGeometry, binaryInfo.uvs4AttrDesc.offset, binaryInfo.uvs4AttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.UV4Kind, uvs4Data, false);
                }

                if (binaryInfo.uvs5AttrDesc && binaryInfo.uvs5AttrDesc.count > 0) {
                    var uvs5Data = new Float32Array(parsedGeometry, binaryInfo.uvs5AttrDesc.offset, binaryInfo.uvs5AttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.UV5Kind, uvs5Data, false);
                }

                if (binaryInfo.uvs6AttrDesc && binaryInfo.uvs6AttrDesc.count > 0) {
                    var uvs6Data = new Float32Array(parsedGeometry, binaryInfo.uvs6AttrDesc.offset, binaryInfo.uvs6AttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.UV6Kind, uvs6Data, false);
                }

                if (binaryInfo.colorsAttrDesc && binaryInfo.colorsAttrDesc.count > 0) {
                    var colorsData = new Float32Array(parsedGeometry, binaryInfo.colorsAttrDesc.offset, binaryInfo.colorsAttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.ColorKind, colorsData, false, binaryInfo.colorsAttrDesc.stride);
                }

                if (binaryInfo.matricesIndicesAttrDesc && binaryInfo.matricesIndicesAttrDesc.count > 0) {
                    var matricesIndicesData = new Int32Array(parsedGeometry, binaryInfo.matricesIndicesAttrDesc.offset, binaryInfo.matricesIndicesAttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, matricesIndicesData, false);
                }

                if (binaryInfo.matricesWeightsAttrDesc && binaryInfo.matricesWeightsAttrDesc.count > 0) {
                    var matricesWeightsData = new Float32Array(parsedGeometry, binaryInfo.matricesWeightsAttrDesc.offset, binaryInfo.matricesWeightsAttrDesc.count);
                    mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, matricesWeightsData, false);
                }

                if (binaryInfo.indicesAttrDesc && binaryInfo.indicesAttrDesc.count > 0) {
                    var indicesData = new Int32Array(parsedGeometry, binaryInfo.indicesAttrDesc.offset, binaryInfo.indicesAttrDesc.count);
                    mesh.setIndices(indicesData);
                }

                if (binaryInfo.subMeshesAttrDesc && binaryInfo.subMeshesAttrDesc.count > 0) {
                    var subMeshesData = new Int32Array(parsedGeometry, binaryInfo.subMeshesAttrDesc.offset, binaryInfo.subMeshesAttrDesc.count * 5);

                    mesh.subMeshes = [];
                    for (var i = 0; i < binaryInfo.subMeshesAttrDesc.count; i++) {
                        var materialIndex = subMeshesData[(i * 5) + 0];
                        var verticesStart = subMeshesData[(i * 5) + 1];
                        var verticesCount = subMeshesData[(i * 5) + 2];
                        var indexStart = subMeshesData[(i * 5) + 3];
                        var indexCount = subMeshesData[(i * 5) + 4];

                        var subMesh = new SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh);
                    }
                }
            } else if (parsedGeometry.positions && parsedGeometry.normals && parsedGeometry.indices) {
                mesh.setVerticesData(VertexBuffer.PositionKind, parsedGeometry.positions, false);
                mesh.setVerticesData(VertexBuffer.NormalKind, parsedGeometry.normals, false);

                if (parsedGeometry.uvs) {
                    mesh.setVerticesData(VertexBuffer.UVKind, parsedGeometry.uvs, false);
                }

                if (parsedGeometry.uvs2) {
                    mesh.setVerticesData(VertexBuffer.UV2Kind, parsedGeometry.uvs2, false);
                }

                if (parsedGeometry.uvs3) {
                    mesh.setVerticesData(VertexBuffer.UV3Kind, parsedGeometry.uvs3, false);
                }

                if (parsedGeometry.uvs4) {
                    mesh.setVerticesData(VertexBuffer.UV4Kind, parsedGeometry.uvs4, false);
                }

                if (parsedGeometry.uvs5) {
                    mesh.setVerticesData(VertexBuffer.UV5Kind, parsedGeometry.uvs5, false);
                }

                if (parsedGeometry.uvs6) {
                    mesh.setVerticesData(VertexBuffer.UV6Kind, parsedGeometry.uvs6, false);
                }

                if (parsedGeometry.colors) {
                    mesh.setVerticesData(VertexBuffer.ColorKind, Color4.CheckColors4(parsedGeometry.colors, parsedGeometry.positions.length / 3), false);
                }

                if (parsedGeometry.matricesIndices) {
                    if (!parsedGeometry.matricesIndices._isExpanded) {
                        var floatIndices = [];

                        for (var i = 0; i < parsedGeometry.matricesIndices.length; i++) {
                            var matricesIndex = parsedGeometry.matricesIndices[i];

                            floatIndices.push(matricesIndex & 0x000000FF);
                            floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                            floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                            floatIndices.push(matricesIndex >> 24);
                        }

                        mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, floatIndices, false);
                    } else {
                        delete parsedGeometry.matricesIndices._isExpanded;
                        mesh.setVerticesData(VertexBuffer.MatricesIndicesKind, parsedGeometry.matricesIndices, false);
                    }
                }

                if (parsedGeometry.matricesIndicesExtra) {
                    if (!parsedGeometry.matricesIndicesExtra._isExpanded) {
                        var floatIndices = [];

                        for (var i = 0; i < parsedGeometry.matricesIndicesExtra.length; i++) {
                            var matricesIndex = parsedGeometry.matricesIndicesExtra[i];

                            floatIndices.push(matricesIndex & 0x000000FF);
                            floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                            floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                            floatIndices.push(matricesIndex >> 24);
                        }

                        mesh.setVerticesData(VertexBuffer.MatricesIndicesExtraKind, floatIndices, false);
                    } else {
                        delete parsedGeometry.matricesIndices._isExpanded;
                        mesh.setVerticesData(VertexBuffer.MatricesIndicesExtraKind, parsedGeometry.matricesIndicesExtra, false);
                    }
                }

                if (parsedGeometry.matricesWeights) {
                    mesh.setVerticesData(VertexBuffer.MatricesWeightsKind, parsedGeometry.matricesWeights, false);
                }

                if (parsedGeometry.matricesWeightsExtra) {
                    mesh.setVerticesData(VertexBuffer.MatricesWeightsExtraKind, parsedGeometry.matricesWeightsExtra, false);
                }

                mesh.setIndices(parsedGeometry.indices);
            }

            // SubMeshes
            if (parsedGeometry.subMeshes) {
                mesh.subMeshes = [];
                for (var subIndex = 0; subIndex < parsedGeometry.subMeshes.length; subIndex++) {
                    var parsedSubMesh = parsedGeometry.subMeshes[subIndex];

                    var subMesh = new SubMesh(parsedSubMesh.materialIndex, parsedSubMesh.verticesStart, parsedSubMesh.verticesCount, parsedSubMesh.indexStart, parsedSubMesh.indexCount, mesh);
                }
            }

            // Flat shading
            if (mesh._shouldGenerateFlatShading) {
                mesh.convertToFlatShadedMesh();
                delete mesh._shouldGenerateFlatShading;
            }

            // Update
            mesh.computeWorldMatrix(true);

            // Octree
            if (scene['_selectionOctree']) {
                scene['_selectionOctree'].addMesh(mesh);
            }
        }

        public static Parse(parsedVertexData: any, scene: Scene, rootUrl: string): Geometry {
            if (scene.getGeometryByID(parsedVertexData.id)) {
                return null; // null since geometry could be something else than a box...
            }

            var geometry = new Geometry(parsedVertexData.id, scene);

            Tags.AddTagsTo(geometry, parsedVertexData.tags);

            if (parsedVertexData.delayLoadingFile) {
                geometry.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                geometry.delayLoadingFile = rootUrl + parsedVertexData.delayLoadingFile;
                geometry._boundingInfo = new BoundingInfo(Vector3.FromArray(parsedVertexData.boundingBoxMinimum), Vector3.FromArray(parsedVertexData.boundingBoxMaximum));

                geometry._delayInfo = [];
                if (parsedVertexData.hasUVs) {
                    geometry._delayInfo.push(VertexBuffer.UVKind);
                }

                if (parsedVertexData.hasUVs2) {
                    geometry._delayInfo.push(VertexBuffer.UV2Kind);
                }

                if (parsedVertexData.hasUVs3) {
                    geometry._delayInfo.push(VertexBuffer.UV3Kind);
                }

                if (parsedVertexData.hasUVs4) {
                    geometry._delayInfo.push(VertexBuffer.UV4Kind);
                }

                if (parsedVertexData.hasUVs5) {
                    geometry._delayInfo.push(VertexBuffer.UV5Kind);
                }

                if (parsedVertexData.hasUVs6) {
                    geometry._delayInfo.push(VertexBuffer.UV6Kind);
                }

                if (parsedVertexData.hasColors) {
                    geometry._delayInfo.push(VertexBuffer.ColorKind);
                }

                if (parsedVertexData.hasMatricesIndices) {
                    geometry._delayInfo.push(VertexBuffer.MatricesIndicesKind);
                }

                if (parsedVertexData.hasMatricesWeights) {
                    geometry._delayInfo.push(VertexBuffer.MatricesWeightsKind);
                }

                geometry._delayLoadingFunction = VertexData.ImportVertexData;
            } else {
                VertexData.ImportVertexData(parsedVertexData, geometry);
            }

            scene.pushGeometry(geometry, true);

            return geometry;
        }
    }

    /////// Primitives //////////////////////////////////////////////
    export module Geometry.Primitives {

        /// Abstract class
        export class _Primitive extends Geometry {

            private _beingRegenerated: boolean;

            constructor(id: string, scene: Scene, private _canBeRegenerated?: boolean, mesh?: Mesh) {
                super(id, scene, null, false, mesh); // updatable = false to be sure not to update vertices
                this._beingRegenerated = true;
                this.regenerate();
                this._beingRegenerated = false;
            }

            public canBeRegenerated(): boolean {
                return this._canBeRegenerated;
            }

            public regenerate(): void {
                if (!this._canBeRegenerated) {
                    return;
                }
                this._beingRegenerated = true;
                this.setAllVerticesData(this._regenerateVertexData(), false);
                this._beingRegenerated = false;
            }

            public asNewGeometry(id: string): Geometry {
                return super.copy(id);
            }

            // overrides
            public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void {
                if (!this._beingRegenerated) {
                    return;
                }
                super.setAllVerticesData(vertexData, false);
            }

            public setVerticesData(kind: string, data: number[] | Int32Array | Float32Array, updatable?: boolean): void {
                if (!this._beingRegenerated) {
                    return;
                }
                super.setVerticesData(kind, data, false);
            }

            // to override
            // protected
            public _regenerateVertexData(): VertexData {
                throw new Error("Abstract method");
            }

            public copy(id: string): Geometry {
                throw new Error("Must be overriden in sub-classes.");
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.canBeRegenerated = this.canBeRegenerated();

                return serializationObject;
            }
        }

        export class Ribbon extends _Primitive {
            // Members

            constructor(id: string, scene: Scene, public pathArray: Vector3[][], public closeArray: boolean, public closePath: boolean, public offset: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateRibbon({ pathArray: this.pathArray, closeArray: this.closeArray, closePath: this.closePath, offset: this.offset, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Ribbon(id, this.getScene(), this.pathArray, this.closeArray, this.closePath, this.offset, this.canBeRegenerated(), null, this.side);
            }
        }

        export class Box extends _Primitive {
            // Members
            constructor(id: string, scene: Scene, public size: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateBox({ size: this.size, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Box(id, this.getScene(), this.size, this.canBeRegenerated(), null, this.side);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.size = this.size;

                return serializationObject;
            }

            public static Parse(parsedBox: any, scene: Scene): Box {
                if (scene.getGeometryByID(parsedBox.id)) {
                    return null; // null since geometry could be something else than a box...
                }

                var box = new Geometry.Primitives.Box(parsedBox.id, scene, parsedBox.size, parsedBox.canBeRegenerated, null);
                Tags.AddTagsTo(box, parsedBox.tags);

                scene.pushGeometry(box, true);

                return box;
            }
        }

        export class Sphere extends _Primitive {

            constructor(id: string, scene: Scene, public segments: number, public diameter: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateSphere({ segments: this.segments, diameter: this.diameter, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Sphere(id, this.getScene(), this.segments, this.diameter, this.canBeRegenerated(), null, this.side);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.segments = this.segments;
                serializationObject.diameter = this.diameter;

                return serializationObject;
            }

            public static Parse(parsedSphere: any, scene: Scene): Geometry.Primitives.Sphere {
                if (scene.getGeometryByID(parsedSphere.id)) {
                    return null; // null since geometry could be something else than a sphere...
                }

                var sphere = new Geometry.Primitives.Sphere(parsedSphere.id, scene, parsedSphere.segments, parsedSphere.diameter, parsedSphere.canBeRegenerated, null);
                Tags.AddTagsTo(sphere, parsedSphere.tags);

                scene.pushGeometry(sphere, true);

                return sphere;
            }
        }

        export class Disc extends _Primitive {
            // Members

            constructor(id: string, scene: Scene, public radius: number, public tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateDisc({ radius: this.radius, tessellation: this.tessellation, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Disc(id, this.getScene(), this.radius, this.tessellation, this.canBeRegenerated(), null, this.side);
            }
        }


        export class Cylinder extends _Primitive {

            constructor(id: string, scene: Scene, public height: number, public diameterTop: number, public diameterBottom: number, public tessellation: number, public subdivisions: number = 1, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateCylinder({ height: this.height, diameterTop: this.diameterTop, diameterBottom: this.diameterBottom, tessellation: this.tessellation, subdivisions: this.subdivisions, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Cylinder(id, this.getScene(), this.height, this.diameterTop, this.diameterBottom, this.tessellation, this.subdivisions, this.canBeRegenerated(), null, this.side);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.height = this.height;
                serializationObject.diameterTop = this.diameterTop;
                serializationObject.diameterBottom = this.diameterBottom;
                serializationObject.tessellation = this.tessellation;

                return serializationObject;
            }

            public static Parse(parsedCylinder: any, scene: Scene): Geometry.Primitives.Cylinder {
                if (scene.getGeometryByID(parsedCylinder.id)) {
                    return null; // null since geometry could be something else than a cylinder...
                }

                var cylinder = new Geometry.Primitives.Cylinder(parsedCylinder.id, scene, parsedCylinder.height, parsedCylinder.diameterTop, parsedCylinder.diameterBottom, parsedCylinder.tessellation, parsedCylinder.subdivisions, parsedCylinder.canBeRegenerated, null);
                Tags.AddTagsTo(cylinder, parsedCylinder.tags);

                scene.pushGeometry(cylinder, true);

                return cylinder;
            }
        }

        export class Torus extends _Primitive {

            constructor(id: string, scene: Scene, public diameter: number, public thickness: number, public tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTorus({ diameter: this.diameter, thickness: this.thickness, tessellation: this.tessellation, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Torus(id, this.getScene(), this.diameter, this.thickness, this.tessellation, this.canBeRegenerated(), null, this.side);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.diameter = this.diameter;
                serializationObject.thickness = this.thickness;
                serializationObject.tessellation = this.tessellation;

                return serializationObject;
            }

            public static Parse(parsedTorus: any, scene: Scene): Geometry.Primitives.Torus {
                if (scene.getGeometryByID(parsedTorus.id)) {
                    return null; // null since geometry could be something else than a torus...
                }

                var torus = new Geometry.Primitives.Torus(parsedTorus.id, scene, parsedTorus.diameter, parsedTorus.thickness, parsedTorus.tessellation, parsedTorus.canBeRegenerated, null);
                Tags.AddTagsTo(torus, parsedTorus.tags);

                scene.pushGeometry(torus, true);

                return torus;
            }
        }

        export class Ground extends _Primitive {

            constructor(id: string, scene: Scene, public width: number, public height: number, public subdivisions: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateGround({ width: this.width, height: this.height, subdivisions: this.subdivisions });
            }

            public copy(id: string): Geometry {
                return new Ground(id, this.getScene(), this.width, this.height, this.subdivisions, this.canBeRegenerated(), null);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.width = this.width;
                serializationObject.height = this.height;
                serializationObject.subdivisions = this.subdivisions;

                return serializationObject;
            }

            public static Parse(parsedGround: any, scene: Scene): Geometry.Primitives.Ground {
                if (scene.getGeometryByID(parsedGround.id)) {
                    return null; // null since geometry could be something else than a ground...
                }

                var ground = new Geometry.Primitives.Ground(parsedGround.id, scene, parsedGround.width, parsedGround.height, parsedGround.subdivisions, parsedGround.canBeRegenerated, null);
                Tags.AddTagsTo(ground, parsedGround.tags);

                scene.pushGeometry(ground, true);

                return ground;
            }
        }

        export class TiledGround extends _Primitive {

            constructor(id: string, scene: Scene, public xmin: number, public zmin: number, public xmax: number, public zmax: number, public subdivisions: { w: number; h: number; }, public precision: { w: number; h: number; }, canBeRegenerated?: boolean, mesh?: Mesh) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTiledGround({ xmin: this.xmin, zmin: this.zmin, xmax: this.xmax, zmax: this.zmax, subdivisions: this.subdivisions, precision: this.precision });
            }

            public copy(id: string): Geometry {
                return new TiledGround(id, this.getScene(), this.xmin, this.zmin, this.xmax, this.zmax, this.subdivisions, this.precision, this.canBeRegenerated(), null);
            }
        }

        export class Plane extends _Primitive {

            constructor(id: string, scene: Scene, public size: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreatePlane({ size: this.size, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new Plane(id, this.getScene(), this.size, this.canBeRegenerated(), null, this.side);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.size = this.size;

                return serializationObject;
            }

            public static Parse(parsedPlane: any, scene: Scene): Geometry.Primitives.Plane {
                if (scene.getGeometryByID(parsedPlane.id)) {
                    return null; // null since geometry could be something else than a ground...
                }

                var plane = new Geometry.Primitives.Plane(parsedPlane.id, scene, parsedPlane.size, parsedPlane.canBeRegenerated, null);
                Tags.AddTagsTo(plane, parsedPlane.tags);

                scene.pushGeometry(plane, true);

                return plane;
            }
        }

        export class TorusKnot extends _Primitive {

            constructor(id: string, scene: Scene, public radius: number, public tube: number, public radialSegments: number, public tubularSegments: number, public p: number, public q: number, canBeRegenerated?: boolean, mesh?: Mesh, public side: number = Mesh.DEFAULTSIDE) {
                super(id, scene, canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTorusKnot({ radius: this.radius, tube: this.tube, radialSegments: this.radialSegments, tubularSegments: this.tubularSegments, p: this.p, q: this.q, sideOrientation: this.side });
            }

            public copy(id: string): Geometry {
                return new TorusKnot(id, this.getScene(), this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q, this.canBeRegenerated(), null, this.side);
            }

            public serialize(): any {
                var serializationObject = super.serialize();

                serializationObject.radius = this.radius;
                serializationObject.tube = this.tube;
                serializationObject.radialSegments = this.radialSegments;
                serializationObject.tubularSegments = this.tubularSegments;
                serializationObject.p = this.p;
                serializationObject.q = this.q;

                return serializationObject;
            };

            public static Parse(parsedTorusKnot: any, scene: Scene): Geometry.Primitives.TorusKnot {
                if (scene.getGeometryByID(parsedTorusKnot.id)) {
                    return null; // null since geometry could be something else than a ground...
                }

                var torusKnot = new Geometry.Primitives.TorusKnot(parsedTorusKnot.id, scene, parsedTorusKnot.radius, parsedTorusKnot.tube, parsedTorusKnot.radialSegments, parsedTorusKnot.tubularSegments, parsedTorusKnot.p, parsedTorusKnot.q, parsedTorusKnot.canBeRegenerated, null);
                Tags.AddTagsTo(torusKnot, parsedTorusKnot.tags);

                scene.pushGeometry(torusKnot, true);

                return torusKnot;
            }
        }
    }
}


