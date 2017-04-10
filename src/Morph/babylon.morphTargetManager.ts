module BABYLON {
    export class MorphTargetManager {
        private _targets = new Array<MorphTarget>();
        private _targetObservable = new Array<Observer<boolean>>();
        private _activeTargets = new SmartArray<MorphTarget>(16);
        private _scene: Scene;
        private _influences: Float32Array;
        private _supportsNormals = false;
        private _vertexCount = 0;

        public constructor(scene?: Scene) {
            if (!scene) {
                scene = Engine.LastCreatedScene;
            }

            this._scene = scene;
        }

        public get vertexCount(): number {
            return this._vertexCount
        }

        public get supportsNormals(): boolean {
            return this._supportsNormals;
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
       
        public addTarget(target: MorphTarget): void {
            if (this._vertexCount) {
                if (this._vertexCount !== target.getPositions().length / 3) {
                    Tools.Error("Incompatible target. Targets must all have the same vertices count.");
                    return;
                }
            }

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
                this._vertexCount = 0;
                this._syncActiveTargets(true);
            }
        }

        private _onInfluenceChanged(needUpdate: boolean): void {
            this._syncActiveTargets(needUpdate);
        }

        private _syncActiveTargets(needUpdate: boolean): void {
            this._activeTargets.reset();
            var tempInfluences = [];
            this._supportsNormals = true;
            for (var target of this._targets) {
                if (target.influence > 0) {
                    this._activeTargets.push(target);
                    tempInfluences.push(target.influence);

                    this._supportsNormals = this._supportsNormals && target.hasNormals;

                    if (this._vertexCount === 0) {
                        this._vertexCount = target.getPositions().length / 3;
                    }
                }
            }

            this._influences = new Float32Array(tempInfluences);

            if (needUpdate) {
                // Flag meshes as dirty to resync with the active targets
                for (var mesh of this._scene.meshes) {
                    if ((<any>mesh).morphTargetManager === this) {
                        (<Mesh>mesh)._syncGeometryWithMorphTargetManager();
                    }
                }
            }
        }
    }
}