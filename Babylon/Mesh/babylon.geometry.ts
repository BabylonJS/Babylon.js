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
        private _indices = [];
        private _vertexBuffers;
        private _isDisposed = false;
        public _delayInfo; //ANY
        private _indexBuffer;
        public _boundingInfo: BoundingInfo;
        public _delayLoadingFunction: (any: any, geometry: Geometry) => void;

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
                mesh.computeWorldMatrix(true);
            }
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

        public setVerticesData(kind: string, data: number[], updatable?: boolean, stride?: number): void {
            this._vertexBuffers = this._vertexBuffers || {};

            if (this._vertexBuffers[kind]) {
                this._vertexBuffers[kind].dispose();
            }

            this._vertexBuffers[kind] = new VertexBuffer(this._engine, data, kind, updatable, this._meshes.length === 0, stride);

            if (kind === VertexBuffer.PositionKind) {
                stride = this._vertexBuffers[kind].getStrideSize();

                this._totalVertices = data.length / stride;

                var extend = Tools.ExtractMinAndMax(data, 0, this._totalVertices);

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    mesh._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
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

        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean): void {
            var vertexBuffer = this.getVertexBuffer(kind);

            if (!vertexBuffer) {
                return;
            }

            vertexBuffer.update(data);

            if (kind === VertexBuffer.PositionKind) {

                var extend;

                var stride = vertexBuffer.getStrideSize();
                this._totalVertices = data.length / stride;

                if (updateExtends) {
                    extend = Tools.ExtractMinAndMax(data, 0, this._totalVertices);
                }

                var meshes = this._meshes;
                var numOfMeshes = meshes.length;

                for (var index = 0; index < numOfMeshes; index++) {
                    var mesh = meshes[index];
                    mesh._resetPointsArrayCache();
                    if (updateExtends) {
                        mesh._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);

                        for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                            var subMesh = mesh.subMeshes[subIndex];

                            subMesh.refreshBoundingInfo();
                        }
                    }
                }
            }
            this.notifyUpdate(kind);
        }

        public getTotalVertices(): number {
            if (!this.isReady()) {
                return 0;
            }

            return this._totalVertices;
        }

        public getVerticesData(kind: string, copyWhenShared?: boolean): number[] {
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

        public getVertexBuffers(): VertexBuffer[] {
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

        public setIndices(indices: number[], totalVertices?: number): void {
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

        public getIndices(copyWhenShared?: boolean): number[] {
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

        private _applyToMesh(mesh: Mesh): void {
            var numOfMeshes = this._meshes.length;

            // vertexBuffers
            for (var kind in this._vertexBuffers) {
                if (numOfMeshes === 1) {
                    this._vertexBuffers[kind].create();
                }
                this._vertexBuffers[kind]._buffer.references = numOfMeshes;

                if (kind === VertexBuffer.PositionKind) {
                    mesh._resetPointsArrayCache();

                    var extend = Tools.ExtractMinAndMax(this._vertexBuffers[kind].getData(), 0, this._totalVertices);
                    mesh._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);

                    mesh._createGlobalSubMesh();

                    //bounding info was just created again, world matrix should be applied again.
                    mesh._updateBoundingInfo();
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
            },() => { }, scene.database);
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
            this._vertexBuffers = [];
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

            this._boundingInfo = null; // todo: .dispose()

            this._scene.removeGeometry(this);
            this._isDisposed = true;
        }

        public copy(id: string): Geometry {
            var vertexData = new VertexData();

            vertexData.indices = [];

            var indices = this.getIndices();
            for (var index = 0; index < indices.length; index++) {
                vertexData.indices.push(indices[index]);
            }

            var updatable = false;
            var stopChecking = false;

            for (var kind in this._vertexBuffers) {
                // using slice() to make a copy of the array and not just reference it
                vertexData.set(this.getVerticesData(kind).slice(0), kind);

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
            var extend = Tools.ExtractMinAndMax(this.getVerticesData(VertexBuffer.PositionKind), 0, this.getTotalVertices());
            geometry._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);

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
                var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
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

        export class Ribbon extends _Primitive {
            // Members
            public pathArray: Vector3[][];
            public closeArray: boolean;
            public closePath: boolean;
            public offset: number;
            public side: number;

            constructor(id: string, scene: Scene, pathArray: Vector3[][], closeArray: boolean, closePath: boolean, offset: number, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.pathArray = pathArray;
                this.closeArray = closeArray;
                this.closePath = closePath;
                this.offset = offset;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateRibbon(this.pathArray, this.closeArray, this.closePath, this.offset, this.side);
            }

            public copy(id: string): Geometry {
                return new Ribbon(id, this.getScene(), this.pathArray, this.closeArray, this.closePath, this.offset, this.canBeRegenerated(), null, this.side);
            }
        }

        export class Box extends _Primitive {
            // Members
            public size: number;
            public side: number;

            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.size = size;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateBox(this.size, this.side);
            }

            public copy(id: string): Geometry {
                return new Box(id, this.getScene(), this.size, this.canBeRegenerated(), null, this.side);
            }
        }

        export class Sphere extends _Primitive {
            // Members
            public segments: number;
            public diameter: number;
            public side: number;

            constructor(id: string, scene: Scene, segments: number, diameter: number, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.segments = segments;
                this.diameter = diameter;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateSphere(this.segments, this.diameter, this.side);
            }

            public copy(id: string): Geometry {
                return new Sphere(id, this.getScene(), this.segments, this.diameter, this.canBeRegenerated(), null, this.side);
            }
        }

        export class Cylinder extends _Primitive {
            // Members
            public height: number;
            public diameterTop: number;
            public diameterBottom: number;
            public tessellation: number;
            public subdivisions: number;
            public side: number;

            constructor(id: string, scene: Scene, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: number = 1, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.height = height;
                this.diameterTop = diameterTop;
                this.diameterBottom = diameterBottom;
                this.tessellation = tessellation;
                this.subdivisions = subdivisions;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateCylinder(this.height, this.diameterTop, this.diameterBottom, this.tessellation, this.subdivisions, this.side);
            }

            public copy(id: string): Geometry {
                return new Cylinder(id, this.getScene(), this.height, this.diameterTop, this.diameterBottom, this.tessellation, this.subdivisions, this.canBeRegenerated(), null, this.side);
            }
        }

        export class Torus extends _Primitive {
            // Members
            public diameter: number;
            public thickness: number;
            public tessellation: number;
            public side: number;

            constructor(id: string, scene: Scene, diameter: number, thickness: number, tessellation: number, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.diameter = diameter;
                this.thickness = thickness;
                this.tessellation = tessellation;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTorus(this.diameter, this.thickness, this.tessellation, this.side);
            }

            public copy(id: string): Geometry {
                return new Torus(id, this.getScene(), this.diameter, this.thickness, this.tessellation, this.canBeRegenerated(), null, this.side);
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

        export class TiledGround extends _Primitive {
            // Members
            public xmin: number;
            public zmin: number;
            public xmax: number;
            public zmax: number;
            public subdivisions: { w: number; h: number; };
            public precision: { w: number; h: number; };

            constructor(id: string, scene: Scene, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: { w: number; h: number; }, precision: { w: number; h: number; }, canBeRegenerated?: boolean, mesh?: Mesh) {
                this.xmin = xmin;
                this.zmin = zmin;
                this.xmax = xmax;
                this.zmax = zmax;
                this.subdivisions = subdivisions;
                this.precision = precision;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTiledGround(this.xmin, this.zmin, this.xmax, this.zmax, this.subdivisions, this.precision);
            }

            public copy(id: string): Geometry {
                return new TiledGround(id, this.getScene(), this.xmin, this.zmin, this.xmax, this.zmax, this.subdivisions, this.precision, this.canBeRegenerated(), null);
            }
        }

        export class Plane extends _Primitive {
            // Members
            public size: number;
            public side: number;

            constructor(id: string, scene: Scene, size: number, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.size = size;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreatePlane(this.size, this.side);
            }

            public copy(id: string): Geometry {
                return new Plane(id, this.getScene(), this.size, this.canBeRegenerated(), null, this.side);
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
            public side: number;

            constructor(id: string, scene: Scene, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, canBeRegenerated?: boolean, mesh?: Mesh, side: number = Mesh.DEFAULTSIDE) {
                this.radius = radius;
                this.tube = tube;
                this.radialSegments = radialSegments;
                this.tubularSegments = tubularSegments;
                this.p = p;
                this.q = q;
                this.side = side;

                super(id, scene, this._regenerateVertexData(), canBeRegenerated, mesh);
            }

            public _regenerateVertexData(): VertexData {
                return VertexData.CreateTorusKnot(this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q, this.side);
            }

            public copy(id: string): Geometry {
                return new TorusKnot(id, this.getScene(), this.radius, this.tube, this.radialSegments, this.tubularSegments, this.p, this.q, this.canBeRegenerated(), null, this.side);
            }
        }
    }
}