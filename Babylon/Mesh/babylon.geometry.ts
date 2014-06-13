module BABYLON {
    export class Geometry implements IGetSetVerticesData {
        // Members
        public id: string;
        public delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
        public delayLoadingFile: string;

        // Private
        private _scene: Scene;
        private _engine: Engine;
        private _meshes: Mesh[];
        private _totalVertices = 0;
        private _indices = [];
        private _vertexBuffers;
        private _delayInfo; //ANY
        private _indexBuffer;
        private _boundingInfo: BoundingInfo;
        private _delayLoadingFunction: (any, Geometry) => void;

        constructor(id: string, scene: Scene, vertexData?: VertexData, updatable?: boolean, mesh?: Mesh) {
            this.id = id;
            this._engine = scene.getEngine();
            this._meshes = [];
            this._scene = scene;
            
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
                this.applyToMesh(mesh);
            }
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getEngine(): Engine {
            return this._engine;
        }

        public isReady(): boolean {
            return this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADED || this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NONE;
        }

        public setAllVerticesData(vertexData: VertexData, updatable?: boolean): void {
            vertexData.applyToGeometry(this, updatable);
        }

        public setVerticesData(kind: string, data: number[], updatable?: boolean): void {
            this._vertexBuffers = this._vertexBuffers || {};

            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].dispose();
            }

            this._vertexBuffers[kind] = new VertexBuffer(this._engine, data, kind, updatable, this._meshes.length === 0);

            if (kind === BABYLON.VertexBuffer.PositionKind) {
                var stride = this._vertexBuffers[kind].getStrideSize();

                this._totalVertices = data.length / stride;

                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    mesh._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
                    mesh._createGlobalSubMesh();
                    mesh.computeWorldMatrix(true);
                }
            }
        }

        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean): void {
            var vertexBuffer = this.getVertexBuffer(kind);

            if (!vertexBuffer) {
                return;
            }

            vertexBuffer.update(data);

            if (kind === BABYLON.VertexBuffer.PositionKind) {

                var extend;

                if (updateExtends) {
                    var stride = vertexBuffer.getStrideSize();
                    this._totalVertices = data.length / stride;
                    extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this._totalVertices);
                }

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    if (updateExtends) {
                        mesh._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
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

        public getVerticesData(kind: string): number[] {
            var vertexBuffer = this.getVertexBuffer(kind);
            if (!vertexBuffer) {
                return null;
            }
            return vertexBuffer.getData();
        }

        public getVertexBuffer(kind: string): VertexBuffer {
            if (!this.isReady()) {
                return null;
            }
            return this._vertexBuffers[kind];
        }

        public getVertexBuffers(): VertexBuffer[]{
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
            if (!this._vertexBuffers && this._delayInfo) {
                for (var kind in this._delayInfo) {
                    result.push(kind);
                }
            } else {
                for (kind in this._vertexBuffers) {
                    result.push(kind);
                }
            }

            return result;
        }

        public setIndices(indices: number[]): void {
            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }

            this._indices = indices;
            if (this._meshes.length !== 0 && this._indices) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }

            var meshes = this._meshes;
            var numOfMeshes = meshes.length;

            for (var index = 0; index < numOfMeshes; index++) {
                meshes[index]._createGlobalSubMesh();
            }
        }

        public getTotalIndices(): number {
            if (!this.isReady()) {
                return 0;
            }
            return this._indices.length;
        }

        public getIndices(): number[] {
            if (!this.isReady()) {
                return null;
            }
            return this._indices;
        }

        public getIndexBuffer(): any {
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

            if (meshes.length == 0 && shouldDispose) {
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

        private _applyToMesh(mesh: Mesh): void {
            var numOfMeshes = this._meshes.length;

            // vertexBuffers
            for (var kind in this._vertexBuffers) {
                if (numOfMeshes === 1) {
                    this._vertexBuffers[kind].create();
                }
                this._vertexBuffers[kind]._buffer.references = numOfMeshes;

                if (kind === BABYLON.VertexBuffer.PositionKind) {
                    mesh._resetPointsArrayCache();

                    var extend = BABYLON.Tools.ExtractMinAndMax(this._vertexBuffers[kind].getData(), 0, this._totalVertices);
                    mesh._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

                    mesh._createGlobalSubMesh();
                }
            }

            // indexBuffer
            if (numOfMeshes === 1 && this._indices) {
                this._indexBuffer = this._engine.createIndexBuffer(this._indices);
            }
            if (this._indexBuffer) {
                this._indexBuffer.references = numOfMeshes;
            }
        }

        public load(scene: Scene, onLoaded?: () => void): void {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return;
            }

            if (this.isReady()) {
                if (onLoaded) {
                    onLoaded();
                }
                return;
            }

            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;

            scene._addPendingData(this);
            BABYLON.Tools.LoadFile(this.delayLoadingFile, data => {
                this._delayLoadingFunction(JSON.parse(data), this);

                this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
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

        public dispose(): void {
            var meshes = this._meshes;
            var numOfMeshes = meshes.length;

            for (var index = 0; index < numOfMeshes; index++) {
                this.releaseForMesh(meshes[index]);
            }
            this._meshes = [];

            for (var kind in this._vertexBuffers) {
                this._vertexBuffers[kind].dispose();
            }
            this._vertexBuffers = [];
            this._totalVertices = 0;

            if (this._indexBuffer) {
                this._engine._releaseBuffer(this._indexBuffer);
            }
            this._indexBuffer = null;
            this._indices = [];

            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
            this.delayLoadingFile = null;
            this._delayLoadingFunction = null;
            this._delayInfo = [];

            this._boundingInfo = null; // todo: .dispose()

            var geometries = this._scene.getGeometries();
            index = geometries.indexOf(this);

            if (index > -1) {
                geometries.splice(index, 1);
            }
        }

        public copy(id: string): Geometry {
            var vertexData = new BABYLON.VertexData();

            vertexData.indices = [];

            var indices = this.getIndices();
            for (var index = 0; index < indices.length; index++) {
                vertexData.indices.push(indices[index]);
            }

            var updatable = false;
            var stopChecking = false;

            for (var kind in this._vertexBuffers) {
                vertexData.set(this.getVerticesData(kind), kind);

                if (!stopChecking) {
                    updatable = this.getVertexBuffer(kind).isUpdatable();
                    stopChecking = !updatable;
                }
            }

            var geometry = new BABYLON.Geometry(id, this._scene, vertexData, updatable, null);

            geometry.delayLoadState = this.delayLoadState;
            geometry.delayLoadingFile = this.delayLoadingFile;
            geometry._delayLoadingFunction = this._delayLoadingFunction;

            for (kind in this._delayInfo) {
                geometry._delayInfo = geometry._delayInfo || [];
                geometry._delayInfo.push(kind);
            }

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this.getTotalVertices());
            geometry._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            return geometry;
        }

        // Statics
        public static ExtractFromMesh(mesh: Mesh, id: string): Geometry {
            var geometry = mesh._geometry;

            if (!geometry) {
                return null;
            }

            return geometry.copy(id);
        }
    
        // from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
        // be aware Math.random() could cause collisions
        public static RandomId(): string {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
    }

    /////// Primitives //////////////////////////////////////////////
    export module Geometry.Primitives {

        /// Abstract class
        export class _Primitive extends Geometry {
            // Private 
            private _beingRegenerated: boolean;
            private _canBeRegenerated: boolean;

            constructor(id: string, scene: Scene, vertexData?: VertexData, canBeRegenerated?: boolean, mesh?: Mesh) {
                this._beingRegenerated = true;
                this._canBeRegenerated = canBeRegenerated;
                super(id, scene, vertexData, false, mesh); // updatable = false to be sure not to update vertices
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

            public setVerticesData(kind: string, data: number[], updatable?: boolean): void {
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
        }

        export class Box extends _Primitive {
            // Members
            public size: number;

            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.size = size;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateBox(this.size);
            }

            public copy(id: string): Geometry {
                return new Box(id, this.getScene(), this.size, this.canBeRegenerated(), null);
            }
        }

        export class Sphere extends _Primitive {
            // Members
            public segments: number;
            public diameter: number;

            constructor(id: string, scene: Scene, segments: number, diameter: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.segments = segments;
                this.diameter = diameter;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateSphere(this.segments, this.diameter);
            }

            public copy(id: string): Geometry {
                return new Sphere(id, this.getScene(), this.segments, this.diameter, this.canBeRegenerated(), null);
            }
        }

        export class Cylinder extends _Primitive {
            // Members
            public height: number;
            public diameterTop: number;
            public diameterBottom: number;
            public tessellation: number;

            constructor(id: string, scene: Scene, height: number, diameterTop: number, diameterBottom: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.height = height;
                this.diameterTop = diameterTop;
                this.diameterBottom = diameterBottom;
                this.tessellation = tessellation;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateCylinder(this.height, this.diameterTop, this.diameterBottom, this.tessellation);
            }

            public copy(id: string): Geometry {
                return new Cylinder(id, this.getScene(), this.height, this.diameterTop, this.diameterBottom, this.tessellation, this.canBeRegenerated(), null);
            }
        }

        export class Torus extends _Primitive {
            // Members
            public diameter: number;
            public thickness: number;
            public tessellation: number;

            constructor(id: string, scene: Scene, diameter: number, thickness: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.diameter = diameter;
                this.thickness = thickness;
                this.tessellation = tessellation;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTorus(this.diameter, this.thickness, this.tessellation);
            }

            public copy(id: string): Geometry {
                return new Torus(id, this.getScene(), this.diameter, this.thickness, this.tessellation, this.canBeRegenerated(), null);
            }
        }

        export class Ground extends _Primitive {
            // Members
            public width: number;
            public height: number;
            public subdivisions: number;

            constructor(id: string, scene: Scene, width: number, height: number, subdivisions: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.width = width;
                this.height = height;
                this.subdivisions = subdivisions;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateGround(this.width, this.height, this.subdivisions);
            }

            public copy(id: string): Geometry {
                return new Ground(id, this.getScene(), this.width, this.height, this.subdivisions, this.canBeRegenerated(), null);
            }
        }

        export class Plane extends _Primitive {
            // Members
            public size: number;

            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.size = size;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreatePlane(this.size);
            }

            public copy(id: string): Geometry {
                return new Plane(id, this.getScene(), this.size, this.canBeRegenerated(), null);
            }
        }

        export class TorusKnot extends _Primitive {
            // Members
            public radius: number;
            public tube: number;
            public radialSegments: number;
            public tubularSegments: number;
            public p: number;
            public q: number;

            constructor(id: string, scene: Scene, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.radius = radius;
                this.tube = tube;
                this.radialSegments = radialSegments;
                this.tubularSegments = tubularSegments;
                this.p = p;
                this.q = q;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTorusKnot(this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q);
            }

            public copy(id: string): Geometry {
                return new TorusKnot(id, this.getScene(), this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q, this.canBeRegenerated(), null);
            }
        }
    }
} 