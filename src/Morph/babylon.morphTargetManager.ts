module BABYLON {
    export class MorphTargetManager {
        private _targets = new Array<MorphTarget>();
        private _targetObservable = new Array<Nullable<Observer<boolean>>>();
        private _activeTargets = new SmartArray<MorphTarget>(16);
        private _scene: Nullable<Scene>;
        private _influences: Float32Array;
        private _supportsNormals = false;
        private _supportsTangents = false;
        private _vertexCount = 0;
        private _uniqueId = 0;
        private _tempInfluences = new Array<number>();

        public constructor(scene: Nullable<Scene> = null) {
            if (!scene) {
                scene = Engine.LastCreatedScene;
            }

            this._scene = scene;

            if (this._scene) {
                this._scene.morphTargetManagers.push(this);

                this._uniqueId = this._scene.getUniqueId();
            }
        }

        public get uniqueId(): number {
            return this._uniqueId;
        }

        public get vertexCount(): number {
            return this._vertexCount
        }

        public get supportsNormals(): boolean {
            return this._supportsNormals;
        }

        public get supportsTangents(): boolean {
            return this._supportsTangents;
        }

        public get numTargets(): number {
            return this._targets.length;
        }

        public get numInfluencers(): number {
            return this._activeTargets.length;
        }

        public get influences(): Float32Array {
            return this._influences;
        }

        public getActiveTarget(index: number): MorphTarget {
            return this._activeTargets.data[index];
        }

        public getTarget(index: number): MorphTarget {
            return this._targets[index];
        }

        public addTarget(target: MorphTarget): void {
            this._targets.push(target);
            this._targetObservable.push(target.onInfluenceChanged.add(needUpdate => {
                this._syncActiveTargets(needUpdate);
            }));
            this._syncActiveTargets(true);
        }

        public removeTarget(target: MorphTarget): void {
            var index = this._targets.indexOf(target);
            if (index >= 0) {
                this._targets.splice(index, 1);

                target.onInfluenceChanged.remove(this._targetObservable.splice(index, 1)[0]);
                this._syncActiveTargets(true);
            }
        }

        /**
         * Serializes the current manager into a Serialization object.  
         * Returns the serialized object.  
         */
        public serialize(): any {
            var serializationObject:any = {};

            serializationObject.id = this.uniqueId;

            serializationObject.targets = [];
            for (var target of this._targets) {
                serializationObject.targets.push(target.serialize());
            }

            return serializationObject;
        }

        private _syncActiveTargets(needUpdate: boolean): void {
            let influenceCount = 0;
            this._activeTargets.reset();
            this._supportsNormals = true;
            this._supportsTangents = true;
            this._vertexCount = 0;
            for (var target of this._targets) {
                if (target.influence > 0) {
                    this._activeTargets.push(target);
                    this._tempInfluences[influenceCount++] = target.influence;

                    this._supportsNormals = this._supportsNormals && target.hasNormals;
                    this._supportsTangents = this._supportsTangents && target.hasTangents;

                    const positions = target.getPositions();
                    if (!positions) {
                        Tools.Error("Invalid target. Target must positions.");
                        return;
                    }

                    const vertexCount = positions.length / 3;
                    if (this._vertexCount === 0) {
                        this._vertexCount = vertexCount;
                    }
                    else if (this._vertexCount !== vertexCount) {
                        Tools.Error("Incompatible target. Targets must all have the same vertices count.");
                        return;
                    }
                }
            }

            if (!this._influences || this._influences.length !== influenceCount) {
                this._influences = new Float32Array(influenceCount);
            }

            for (var index = 0; index < influenceCount; index++) {
                this._influences[index] = this._tempInfluences[index];
            }

            if (needUpdate && this._scene) {
                // Flag meshes as dirty to resync with the active targets
                for (var mesh of this._scene.meshes) {
                    if ((<any>mesh).morphTargetManager === this) {
                        (<Mesh>mesh)._syncGeometryWithMorphTargetManager();
                    }
                }
            }
        }

        // Statics
        public static Parse(serializationObject: any, scene: Scene): MorphTargetManager {
            var result = new MorphTargetManager(scene);

            result._uniqueId = serializationObject.id;

            for (var targetData of serializationObject.targets) {
                result.addTarget(MorphTarget.Parse(targetData));
            }

            return result;
        }
    }
}