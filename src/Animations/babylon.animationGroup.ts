module BABYLON {
    export class AnimationGroup implements IDisposable {
        private _scene: Scene;

        // private _animations = new Array<Animation>();
        // private _targets = new Array<Object>()
        // private _animatables: Animatable[];
        // private _from: number;
        // private _to: number;

        public onAnimationEndObservable = new Observable<Animation>();

        public constructor(public name: string, scene: Nullable<Scene> = null) {
            this._scene = scene || Engine.LastCreatedScene!;

            this._scene.animationGroups.push(this);
        }

        public normalize(beginFrame: number, endFrame: number): AnimationGroup {
            return this;
        }

        public start(loop = false, speedRatio = 1): AnimationGroup {
            // for (var index = 0; index < this._animations) {
            //     this._scene.beginDirectAnimation(this._targets[index], [this._animations[index]], this._from, this._to, loop, speedRatio, () => {

            //     });
            // }

            return this;
        }

        public pause(): AnimationGroup {
            return this;
        }

        public restart(): AnimationGroup {
            return this;
        }

        public stop(): AnimationGroup {
            return this;
        }

        public dispose(): void {

        }
    }
}