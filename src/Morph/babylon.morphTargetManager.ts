module BABYLON {
    export class MorphTargetManager {
        private _targets = new Array<MorphTarget>();
        private _activeTargets = new SmartArray<MorphTarget>(16);
        private _scene: Scene;
        private _influences: Float32Array;
        private _supportsNormals = false;

        public constructor(scene?: Scene) {
            if (!scene) {
                scene = Engine.LastCreatedScene;
            }

            this._scene = scene;
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
            this._targets.push(target);
            target.onInfluenceChanged.add(this._onInfluenceChanged.bind(this));
            this._syncActiveTargets();        
        }

        public removeTarget(target: MorphTarget): void {
            var index = this._targets.indexOf(target);
            if (index >= 0) {
                this._targets.splice(index, 1);
                target.onInfluenceChanged.removeCallback(this._onInfluenceChanged);
                this._syncActiveTargets();
            }
        }

        private _onInfluenceChanged(target: MorphTarget): void {
            this._syncActiveTargets();
        }

        private _syncActiveTargets(): void {
            this._activeTargets.reset();
            var tempInfluences = [];
            this._supportsNormals = true;
            for (var target of this._targets) {
                if (target.influence > 0) {
                    this._activeTargets.push(target);
                    tempInfluences.push(target.influence);

                    this._supportsNormals = this._supportsNormals && target.hasNormals;
                }
            }

            this._influences = new Float32Array(tempInfluences);

            // Flag meshes as dirty to resync with the active targets
            for (var mesh of this._scene.meshes) {
                if ((<any>mesh).morphTargetManager === this) {
                    (<Mesh>mesh)._syncGeometryWithMorphTargetManager();
                }
            }
        }
    }
}