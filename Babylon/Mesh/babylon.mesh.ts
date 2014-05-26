module BABYLON {
    export class Mesh extends AbstractMesh implements IGetSetVerticesData {
        // Members
        public delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
        public instances = new Array<InstancedMesh>();
        public delayLoadingFile: string;

        // Private
        public _geometry: Geometry;
        private _onBeforeRenderCallbacks = [];
        private _delayInfo; //ANY
        private _delayLoadingFunction: (any, Mesh) => void;
        public _visibleInstances: any = {};
        private _renderIdForInstances = -1;

        constructor(name: string, scene: Scene) {
            super(name, scene);
        }

        public getTotalVertices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalVertices();
        }

        public getVerticesData(kind: string): number[] {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind);
        }

        public getVertexBuffer(kind): VertexBuffer {
            if (!this._geometry) {
                return undefined;
            }
            return this._geometry.getVertexBuffer(kind);
        }

        public isVerticesDataPresent(kind: string): boolean {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVerticesDataPresent(kind);
        }

        public getVerticesDataKinds(): string[] {
            if (!this._geometry) {
                var result = [];
                if (this._delayInfo) {
                    for (var kind in this._delayInfo) {
                        result.push(kind);
                    }
                }
                return result;
            }
            return this._geometry.getVerticesDataKinds();
        }

        public getTotalIndices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalIndices();
        }

        public getIndices(): number[] {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices();
        }

        public isReady(): boolean {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            return super.isReady();
        }

        public isDisposed(): boolean {
            return this._isDisposed;
        }

        // Methods  
        public _preActivate(): void {
            this._visibleInstances = null;
        }

        public _registerInstanceForRenderId(instance: InstancedMesh, renderId: number) {
            if (!this._visibleInstances) {
                this._visibleInstances = {};
                this._visibleInstances.defaultRenderId = renderId;
                this._visibleInstances.selfDefaultRenderId = this._renderId;
            }

            if (!this._visibleInstances[renderId]) {
                this._visibleInstances[renderId] = new Array<InstancedMesh>();
            }

            this._visibleInstances[renderId].push(instance);
        }

        public refreshBoundingInfo(): void {
            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (data) {
                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this.getTotalVertices());
                this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
            }

            if (this.subMeshes) {
                for (var index = 0; index < this.subMeshes.length; index++) {
                    this.subMeshes[index].refreshBoundingInfo();
                }
            }

            this._updateBoundingInfo();
        }

        public _createGlobalSubMesh(): SubMesh {
            var totalVertices = this.getTotalVertices();
            if (!totalVertices || !this.getIndices()) {
                return null;
            }

            this.releaseSubMeshes();
            return new BABYLON.SubMesh(0, 0, totalVertices, 0, this.getTotalIndices(), this);
        }

        public subdivide(count: number): void {
            if (count < 1) {
                return;
            }

            var totalIndices = this.getTotalIndices();
            var subdivisionSize = totalIndices / count;
            var offset = 0;

            this.releaseSubMeshes();
            for (var index = 0; index < count; index++) {
                BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, totalIndices - offset), this);

                offset += subdivisionSize;
            }

            this.synchronizeInstances();
        }

        public setVerticesData(data: number[], kind: string, updatable?: boolean): void {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new BABYLON.Geometry(Geometry.RandomId(), scene.getEngine(), vertexData, updatable, this);
            }
            else {
                this._geometry.setVerticesData(data, kind, updatable);
            }
        }

        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
        }

        public makeGeometryUnique() {
            if (!this._geometry) {
                return;
            }
            var geometry = this._geometry.copy(Geometry.RandomId());
            geometry.applyToMesh(this);
        }

        public setIndices(indices: number[]): void {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.indices = indices;

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene.getEngine(), vertexData, false, this);
            }
            else {
                this._geometry.setIndices(indices);
            }
        }

        private _bind(subMesh: SubMesh, effect: Effect, wireframe?: boolean): void {
            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind = this._geometry.getIndexBuffer();

            if (wireframe) {
                indexToBind = subMesh.getLinesIndexBuffer(this.getIndices(), engine);
            }

            // VBOs
            engine.bindMultiBuffers(this._geometry.getVertexBuffers(), indexToBind, effect);
        }

        private _draw(subMesh: SubMesh, useTriangles: boolean): void {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);
        }

        public bindAndDraw(subMesh: SubMesh, effect: Effect, wireframe?: boolean): void {
            this._bind(subMesh, effect, wireframe);

            this._draw(subMesh, !wireframe);
        }

        public registerBeforeRender(func: () => void): void {
            this._onBeforeRenderCallbacks.push(func);
        }

        public unregisterBeforeRender(func: () => void): void {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        }

        public render(subMesh: SubMesh): void {
            var renderSelf = true;
            var scene = this.getScene();

            // Managing instances
            if (this._visibleInstances) {
                var currentRenderId = scene.getRenderId();
                var visibleInstances = this._visibleInstances[currentRenderId];
                var selfRenderId = this._renderId;

                if (!visibleInstances && this._visibleInstances.defaultRenderId) {
                    visibleInstances = this._visibleInstances[this._visibleInstances.defaultRenderId];
                    currentRenderId = this._visibleInstances.defaultRenderId;
                    selfRenderId = this._visibleInstances.selfDefaultRenderId;
                }

                if (visibleInstances && visibleInstances.length) {
                    if (this._renderIdForInstances === currentRenderId) {
                        return;
                    }

                    if (currentRenderId !== selfRenderId) {
                        renderSelf = false;
                    }

                }
                this._renderIdForInstances = currentRenderId;
            }

            // Checking geometry state
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // Material
            var effectiveMaterial = subMesh.getMaterial();

            if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
                return;
            }

            var engine = scene.getEngine();
            var effect = effectiveMaterial.getEffect();

            // Bind
            var wireFrame = engine.forceWireframe || effectiveMaterial.wireframe;
            this._bind(subMesh, effect, wireFrame);
            effectiveMaterial._preBind();

            if (renderSelf) {
                // World
                var world = this.getWorldMatrix();
                effectiveMaterial.bind(world, this);

                // Draw
                this._draw(subMesh, !wireFrame);
            }

            if (visibleInstances) {
                for (var instanceIndex = 0; instanceIndex < visibleInstances.length; instanceIndex++) {
                    var instance = visibleInstances[instanceIndex];

                    // World
                    world = instance.getWorldMatrix();
                    effectiveMaterial.bind(world, this);

                    // Draw
                    this._draw(subMesh, !wireFrame);
                }
            }

            // Unbind
            effectiveMaterial.unbind();
        }

        public getEmittedParticleSystems(): ParticleSystem[] {
            var results = new Array<ParticleSystem>();
            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (particleSystem.emitter === this) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public getHierarchyEmittedParticleSystems(): ParticleSystem[] {
            var results = new Array<ParticleSystem>();
            var descendants = this.getDescendants();
            descendants.push(this);

            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (descendants.indexOf(particleSystem.emitter) !== -1) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public getChildren(): Node[] {
            var results = [];
            for (var index = 0; index < this.getScene().meshes.length; index++) {
                var mesh = this.getScene().meshes[index];
                if (mesh.parent == this) {
                    results.push(mesh);
                }
            }

            return results;
        }

        public _checkDelayState(): void {
            var that = this;
            var scene = this.getScene();

            if (this._geometry) {
                this._geometry.load(scene);
            }
            else if (that.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;

                scene._addPendingData(that);

                BABYLON.Tools.LoadFile(this.delayLoadingFile, data => {
                    this._delayLoadingFunction(JSON.parse(data), this);
                    this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                    scene._removePendingData(this);
                }, () => { }, scene.database);
            }
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            if (!super.isInFrustum(frustumPlanes)) {
                return false;
            }

            this._checkDelayState();

            return true;
        }

        public setMaterialByID(id: string): void {
            var materials = this.getScene().materials;
            for (var index = 0; index < materials.length; index++) {
                if (materials[index].id == id) {
                    this.material = materials[index];
                    return;
                }
            }

            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = 0; index < multiMaterials.length; index++) {
                if (multiMaterials[index].id == id) {
                    this.material = multiMaterials[index];
                    return;
                }
            }
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.material) {
                results.push(this.material);
            }

            return results;
        }

        // Geometry
        public bakeTransformIntoVertices(transform: Matrix): void {
            // Position
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                return;
            }

            this._resetPointsArrayCache();

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var temp = [];
            for (var index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }

            data = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable());
        }



        // Cache
        public _resetPointsArrayCache(): void {
            this._positions = null;
        }

        public _generatePointsArray(): boolean {
            if (this._positions)
                return true;

            this._positions = [];

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (!data) {
                return false;
            }

            for (var index = 0; index < data.length; index += 3) {
                this._positions.push(BABYLON.Vector3.FromArray(data, index));
            }

            return true;
        }

        // Clone
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Mesh {
            var result = new BABYLON.Mesh(name, this.getScene());

            // Geometry
            this._geometry.applyToMesh(result);

            // Deep copy
            BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], []);

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this.getTotalVertices());
            result._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            // Material
            result.material = this.material;

            // Parent
            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                // Children
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];

                    if (mesh.parent == this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }

            // Particles
            for (index = 0; index < this.getScene().particleSystems.length; index++) {
                var system = this.getScene().particleSystems[index];

                if (system.emitter == this) {
                    system.clone(system.name, result);
                }
            }

            result.computeWorldMatrix(true);

            return result;
        }

        // Dispose
        public dispose(doNotRecurse?: boolean): void {
            if (this._geometry) {
                this._geometry.releaseForMesh(this);
            }

            // Instances
            while (this.instances.length) {
                this.instances[0].dispose();
            }

            super.dispose(doNotRecurse);
        }

        // Geometric tools
        public convertToFlatShadedMesh(): void {
            /// <summary>Update normals and vertices to get a flat shading rendering.</summary>
            /// <summary>Warning: This may imply adding vertices to the mesh in order to get exactly 3 vertices per face</summary>

            var kinds = this.getVerticesDataKinds();
            var vbs = [];
            var data = [];
            var newdata = [];
            var updatableNormals = false;
            for (var kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                var kind = kinds[kindIndex];
                var vertexBuffer = this.getVertexBuffer(kind);

                if (kind === BABYLON.VertexBuffer.NormalKind) {
                    updatableNormals = vertexBuffer.isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = vertexBuffer;
                data[kind] = vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = this.getIndices();
            var totalIndices = this.getTotalIndices();

            // Generating unique vertices per face
            for (index = 0; index < totalIndices; index++) {
                var vertexIndex = indices[index];

                for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                    kind = kinds[kindIndex];
                    var stride = vbs[kind].getStrideSize();

                    for (var offset = 0; offset < stride; offset++) {
                        newdata[kind].push(data[kind][vertexIndex * stride + offset]);
                    }
                }
            }

            // Updating faces & normal
            var normals = [];
            var positions = newdata[BABYLON.VertexBuffer.PositionKind];
            for (var index = 0; index < totalIndices; index += 3) {
                indices[index] = index;
                indices[index + 1] = index + 1;
                indices[index + 2] = index + 2;

                var p1 = BABYLON.Vector3.FromArray(positions, index * 3);
                var p2 = BABYLON.Vector3.FromArray(positions, (index + 1) * 3);
                var p3 = BABYLON.Vector3.FromArray(positions, (index + 2) * 3);

                var p1p2 = p1.subtract(p2);
                var p3p2 = p3.subtract(p2);

                var normal = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(p1p2, p3p2));

                // Store same normals for every vertex
                for (var localIndex = 0; localIndex < 3; localIndex++) {
                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z);
                }
            }

            this.setIndices(indices);
            this.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatableNormals);

            // Updating vertex buffers
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(newdata[kind], kind, vbs[kind].isUpdatable());
            }

            // Updating submeshes
            this.releaseSubMeshes();
            for (var submeshIndex = 0; submeshIndex < previousSubmeshes.length; submeshIndex++) {
                var previousOne = previousSubmeshes[submeshIndex];
                var subMesh = new BABYLON.SubMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }

            this.synchronizeInstances();
        }

        // Instances
        public createInstance(name: string): InstancedMesh {
            return new InstancedMesh(name, this);
        }

        public synchronizeInstances(): void {
            for (var instanceIndex = 0; instanceIndex < this.instances.length; instanceIndex++) {
                var instance = this.instances[instanceIndex];
                instance._syncSubMeshes();
            }
        }

        // Statics
        public static CreateBox(name: string, size: number, scene: Scene, updatable?: boolean): Mesh {
            var box = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(size);

            vertexData.applyToMesh(box, updatable);

            return box;
        }

        public static CreateSphere(name: string, segments: number, diameter: number, scene: Scene, updatable?: boolean): Mesh {
            var sphere = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(segments, diameter);

            vertexData.applyToMesh(sphere, updatable);

            return sphere;
        }

        // Cylinder and cone (Code inspired by SharpDX.org)
        public static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, scene: Scene, updatable?: boolean): Mesh {
            var cylinder = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation);

            vertexData.applyToMesh(cylinder, updatable);

            return cylinder;
        }

        // Torus  (Code from SharpDX.org)
        public static CreateTorus(name: string, diameter, thickness: number, tessellation: number, scene: Scene, updatable?: boolean): Mesh {
            var torus = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorus(diameter, thickness, tessellation);

            vertexData.applyToMesh(torus, updatable);

            return torus;
        }

        public static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene: Scene, updatable?: boolean): Mesh {
            var torusKnot = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorusKnot(radius, tube, radialSegments, tubularSegments, p, q);

            vertexData.applyToMesh(torusKnot, updatable);

            return torusKnot;
        }

        // Plane & ground
        public static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean): Mesh {
            var plane = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(size);

            vertexData.applyToMesh(plane, updatable);

            return plane;
        }

        public static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable?: boolean): Mesh {
            var ground = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateGround(width, height, subdivisions);

            vertexData.applyToMesh(ground, updatable);

            return ground;
        }

        public static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean): Mesh {
            var ground = new BABYLON.Mesh(name, scene);

            var onload = img => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;
                var vertexData = VertexData.CreateGroundFromHeightMap(width, height, subdivisions, minHeight, maxHeight, buffer, heightMapWidth, heightMapHeight);

                vertexData.applyToMesh(ground, updatable);

                ground._isReady = true;
            };

            Tools.LoadImage(url, onload, () => { }, scene.database);

            ground._isReady = false;

            return ground;
        }

        // Tools
        public static MinMax(meshes: AbstractMesh[]): { min: Vector3; max: Vector3 } {
            var minVector = null;
            var maxVector = null;
            for (var i in meshes) {
                var mesh = meshes[i];
                var boundingBox = mesh.getBoundingInfo().boundingBox;
                if (!minVector) {
                    minVector = boundingBox.minimumWorld;
                    maxVector = boundingBox.maximumWorld;
                    continue;
                }
                minVector.MinimizeInPlace(boundingBox.minimumWorld);
                maxVector.MaximizeInPlace(boundingBox.maximumWorld);
            }

            return {
                min: minVector,
                max: maxVector
            };
        }

        public static Center(meshesOrMinMaxVector): Vector3 {
            var minMaxVector = meshesOrMinMaxVector.min !== undefined ? meshesOrMinMaxVector : BABYLON.Mesh.MinMax(meshesOrMinMaxVector);
            return BABYLON.Vector3.Center(minMaxVector.min, minMaxVector.max);
        }
    }
} 