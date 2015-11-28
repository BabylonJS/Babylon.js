module BABYLON {

    /**
     * Creates an instance based on a source mesh.
     */
    export class InstancedMesh extends AbstractMesh {
        private _sourceMesh: Mesh;
        private _currentLOD: Mesh;

        constructor(name: string, source: Mesh) {
            super(name, source.getScene());

            source.instances.push(this);

            this._sourceMesh = source;

            this.position.copyFrom(source.position);
            this.rotation.copyFrom(source.rotation);
            this.scaling.copyFrom(source.scaling);

            if (source.rotationQuaternion) {
                this.rotationQuaternion = source.rotationQuaternion.clone();
            }

            this.infiniteDistance = source.infiniteDistance;

            this.setPivotMatrix(source.getPivotMatrix());

            this.refreshBoundingInfo();
            this._syncSubMeshes();
        }

        // Methods
        public get receiveShadows(): boolean {
            return this._sourceMesh.receiveShadows;
        }

        public get material(): Material {
            return this._sourceMesh.material;
        }

        public get visibility(): number {
            return this._sourceMesh.visibility;
        }

        public get skeleton(): Skeleton {
            return this._sourceMesh.skeleton;
        }

        public get renderingGroupId(): number {
            return this._sourceMesh.renderingGroupId;
        }

        public getTotalVertices(): number {
            return this._sourceMesh.getTotalVertices();
        }

        public get sourceMesh(): Mesh {
            return this._sourceMesh;
        }

        public getVerticesData(kind: string): number[] | Float32Array {
            return this._sourceMesh.getVerticesData(kind);
        }

        public isVerticesDataPresent(kind: string): boolean {
            return this._sourceMesh.isVerticesDataPresent(kind);
        }

        public getIndices(): number[] | Int32Array {
            return this._sourceMesh.getIndices();
        }

        public get _positions(): Vector3[] {
            return this._sourceMesh._positions;
        }

        public refreshBoundingInfo(): void {
            var meshBB = this._sourceMesh.getBoundingInfo();

            this._boundingInfo = new BoundingInfo(meshBB.minimum.clone(), meshBB.maximum.clone());

            this._updateBoundingInfo();
        }

        public _preActivate(): void {
            if (this._currentLOD) {
                this._currentLOD._preActivate();
            }
        }

        public _activate(renderId: number): void {
            if (this._currentLOD) {
                this._currentLOD._registerInstanceForRenderId(this, renderId);
            }
        }

        public getLOD(camera: Camera): AbstractMesh {
            this._currentLOD = <Mesh>this.sourceMesh.getLOD(this.getScene().activeCamera, this.getBoundingInfo().boundingSphere);

            if (this._currentLOD === this.sourceMesh) {
                return this;
            }

            return this._currentLOD;
        }

        public _syncSubMeshes(): void {
            this.releaseSubMeshes();
            if (this._sourceMesh.subMeshes) {
                for (var index = 0; index < this._sourceMesh.subMeshes.length; index++) {
                    this._sourceMesh.subMeshes[index].clone(this, this._sourceMesh);
                }
            }
        }

        public _generatePointsArray(): boolean {
            return this._sourceMesh._generatePointsArray();
        }

        // Clone
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh {
            var result = this._sourceMesh.createInstance(name);

            // Deep copy
            Tools.DeepCopy(this, result, ["name"], []);

            // Bounding info
            this.refreshBoundingInfo();

            // Parent
            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                // Children
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];

                    if (mesh.parent === this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }

            result.computeWorldMatrix(true);

            return result;
        }

        // Dispoe
        public dispose(doNotRecurse?: boolean): void {

            // Remove from mesh
            var index = this._sourceMesh.instances.indexOf(this);
            this._sourceMesh.instances.splice(index, 1);

            super.dispose(doNotRecurse);
        }
    }
} 
