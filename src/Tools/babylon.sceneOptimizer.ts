module BABYLON {
    /**
     * Defines the root class used to create scene optimization to use with SceneOptimizer
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         * @returnstrue if everything that can be done was applied
         */
        public apply(scene: Scene): boolean {
            return true;
        };

        /**
         * Creates the SceneOptimization object
         * @param priority defines the priority of this optimization (0 by default which means first in the list)
         * @param desc defines the description associated with the optimization
         */
        constructor(public priority: number = 0) {
        }
    }

    /**
     * Defines an optimization used to reduce the size of render target textures
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class TextureOptimization extends SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Reducing render target texture size to " + this.maximumSize;
        }

        /**
         * Creates the TextureOptimization object
         * @param priority defines the priority of this optimization (0 by default which means first in the list)
         * @param maximumSize defines the maximum sized allowed for textures (1024 is the default value). If a texture is bigger, it will be scaled down using a factor defined by the step parameter
         * @param step defines the factor (0.5 by default) used to scale down textures bigger than maximum sized allowed.
         */
        constructor(public priority: number = 0, public maximumSize: number = 1024, public step = 0.5) {
            super(priority);
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {

            var allDone = true;
            for (var index = 0; index < scene.textures.length; index++) {
                var texture = scene.textures[index];

                if (!texture.canRescale || (<any>texture).getContext) {
                    continue;
                }

                var currentSize = texture.getSize();
                var maxDimension = Math.max(currentSize.width, currentSize.height);

                if (maxDimension > this.maximumSize) {
                    texture.scale(this.step);
                    allDone = false;
                }
            }

            return allDone;
        }
    }

    /**
     * Defines an optimization used to increase or decrease the rendering resolution
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class HardwareScalingOptimization extends SceneOptimization {
        private _currentScale = -1;
        private _directionOffset = 1;

        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Setting hardware scaling level to " + this._currentScale;
        }

        /**
         * Creates the HardwareScalingOptimization object
         * @param priority priority defines the priority of this optimization (0 by default which means first in the list)
         * @param maximumScale 
         * @param step 
         */
        constructor(public priority: number = 0, public maximumScale: number = 2, public step: number = 0.25) {
            super(priority);
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            if (this._currentScale === -1) {
                this._currentScale = scene.getEngine().getHardwareScalingLevel();
                if (this._currentScale > this.maximumScale) {
                    this._directionOffset = -1;
                }
            }

            this._currentScale += this._directionOffset * this.step;

            scene.getEngine().setHardwareScalingLevel(this._currentScale);

            return this._directionOffset === 1 ? this._currentScale >= this.maximumScale : this._currentScale <= this.maximumScale;
        };
    }

    /**
     * Defines an optimization used to remove shadows
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class ShadowsOptimization extends SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Turning shadows off";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            scene.shadowsEnabled = false;
            return true;
        };
    }

    /**
     * Defines an optimization used to turn post-processes off
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class PostProcessesOptimization extends SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Turning post-processes off";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            scene.postProcessesEnabled = false;
            return true;
        };
    }

    /**
     * Defines an optimization used to turn lens flares off
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class LensFlaresOptimization extends SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Turning lens flares off";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            scene.lensFlaresEnabled = false;
            return true;
        };
    }

    /**
     * Defines an optimization based on user defined callback.
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class CustomOptimization extends SceneOptimization {
        /**
         * Callback called to apply the custom optimization.
         * @param scene defines the scene to apply the optimization to
         * @returns a boolean defining if all the optimization was applied or if more options are available (for the next turn)
         */
        public onApply: (scene: Scene) => boolean;

        /**
         * Callback called to get custom description
         */
        public onGetDescription: () => string;

        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            if (this.onGetDescription) {
                return this.onGetDescription();
            }

            return "Running user defined callback";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            if (this.onApply) {
                return this.onApply(scene);
            }
            return true;
        };
    }

    /**
     * Defines an optimization used to turn particles off
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class ParticlesOptimization extends SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Turning particles off";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            scene.particlesEnabled = false;
            return true;
        };
    }

    /**
     * Defines an optimization used to turn render targets off
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class RenderTargetsOptimization extends SceneOptimization {
        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Turning render targets off";
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene): boolean {
            scene.renderTargetsEnabled = false;
            return true;
        };
    }


    /**
     * Defines an optimization used to merge meshes with compatible materials
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class MergeMeshesOptimization extends SceneOptimization {
        static _UpdateSelectionTree = false;

        /**
         * Gets or sets a boolean which defines if optimization octree has to be updated
         */
        public static get UpdateSelectionTree(): boolean {
            return MergeMeshesOptimization._UpdateSelectionTree;
        }

        /**
         * Gets or sets a boolean which defines if optimization octree has to be updated
         */
        public static set UpdateSelectionTree(value: boolean) {
            MergeMeshesOptimization._UpdateSelectionTree = value;
        }

        /**
         * Gets a string describing the action executed by the current optimization
         */
        public getDescription(): string {
            return "Merging similar meshes together";
        }

        private _canBeMerged = (abstractMesh: AbstractMesh): boolean => {
            if (!(abstractMesh instanceof Mesh)) {
                return false;
            }

            var mesh = <Mesh>abstractMesh;

            if (!mesh.isVisible || !mesh.isEnabled()) {
                return false;
            }

            if (mesh.instances.length > 0) {
                return false;
            }

            if (mesh.skeleton || mesh.hasLODLevels) {
                return false;
            }

            if (mesh.parent) {
                return false;
            }

            return true;
        }

        /**
         * This function will be called by the SceneOptimizer when its priority is reached in order to apply the change required by the current optimization
         * @param scene defines the current scene where to apply this optimization
         */
        public apply(scene: Scene, updateSelectionTree?: boolean): boolean {

            var globalPool = scene.meshes.slice(0);
            var globalLength = globalPool.length;

            for (var index = 0; index < globalLength; index++) {
                var currentPool = new Array<Mesh>();
                var current = globalPool[index];

                // Checks
                if (!this._canBeMerged(current)) {
                    continue;
                }

                currentPool.push(<Mesh>current);

                // Find compatible meshes
                for (var subIndex = index + 1; subIndex < globalLength; subIndex++) {
                    var otherMesh = globalPool[subIndex];

                    if (!this._canBeMerged(otherMesh)) {
                        continue;
                    }

                    if (otherMesh.material !== current.material) {
                        continue;
                    }

                    if (otherMesh.checkCollisions !== current.checkCollisions) {
                        continue;
                    }

                    currentPool.push(<Mesh>otherMesh);
                    globalLength--;

                    globalPool.splice(subIndex, 1);

                    subIndex--;
                }

                if (currentPool.length < 2) {
                    continue;
                }

                // Merge meshes
                Mesh.MergeMeshes(currentPool);
            }

            if (updateSelectionTree != undefined) {
                if (updateSelectionTree) {
                    scene.createOrUpdateSelectionOctree();
                }
            }
            else if (MergeMeshesOptimization.UpdateSelectionTree) {
                scene.createOrUpdateSelectionOctree();
            }

            return true;
        };
    }

    /**
     * Defines a list of options used by SceneOptimizer
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class SceneOptimizerOptions {
        /**
         * Gets the list of optimizations to apply
         */
        public optimizations = new Array<SceneOptimization>();

        /**
         * Creates a new list of options used by SceneOptimizer
         * @param targetFrameRate defines the target frame rate to reach (60 by default)
         * @param trackerDuration defines the interval between two checkes (2000ms by default)
         */
        constructor(public targetFrameRate: number = 60, public trackerDuration: number = 2000) {
        }

        /**
         * Add a new optimization
         * @param optimization defines the SceneOptimization to add to the list of active optimizations
         */
        public addOptimization(optimization: SceneOptimization): SceneOptimizerOptions {
            this.optimizations.push(optimization);
            return this;
        }

        /**
         * Add a new custom optimization
         * @param onApply defines the callback called to apply the custom optimization.
         * @param onGetDescription defines the callback called to get the description attached with the optimization.
         * @param priority defines the priority of this optimization (0 by default which means first in the list)
         */
        public addCustomOptimization(onApply: (scene: Scene) => boolean, onGetDescription: () => string, priority: number = 0): SceneOptimizerOptions {
            let optimization = new CustomOptimization(priority);
            optimization.onApply = onApply;
            optimization.onGetDescription = onGetDescription;

            this.optimizations.push(optimization);
            return this;
        }

        /**
         * Creates a list of pre-defined optimizations aimed to reduce the visual impact on the scene
         * @param targetFrameRate defines the target frame rate (60 by default)
         * @returns a SceneOptimizerOptions object
         */
        public static LowDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.addOptimization(new MergeMeshesOptimization(priority));
            result.addOptimization(new ShadowsOptimization(priority));
            result.addOptimization(new LensFlaresOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new PostProcessesOptimization(priority));
            result.addOptimization(new ParticlesOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new TextureOptimization(priority, 1024));

            return result;
        }

        /**
         * Creates a list of pre-defined optimizations aimed to have a moderate impact on the scene visual
         * @param targetFrameRate defines the target frame rate (60 by default)
         * @returns a SceneOptimizerOptions object
         */
        public static ModerateDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.addOptimization(new MergeMeshesOptimization(priority));
            result.addOptimization(new ShadowsOptimization(priority));
            result.addOptimization(new LensFlaresOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new PostProcessesOptimization(priority));
            result.addOptimization(new ParticlesOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new TextureOptimization(priority, 512));

            // Next priority
            priority++;
            result.addOptimization(new RenderTargetsOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new HardwareScalingOptimization(priority, 2));

            return result;
        }

        /**
         * Creates a list of pre-defined optimizations aimed to have a big impact on the scene visual
         * @param targetFrameRate defines the target frame rate (60 by default)
         * @returns a SceneOptimizerOptions object
         */
        public static HighDegradationAllowed(targetFrameRate?: number): SceneOptimizerOptions {
            var result = new SceneOptimizerOptions(targetFrameRate);

            var priority = 0;
            result.addOptimization(new MergeMeshesOptimization(priority));
            result.addOptimization(new ShadowsOptimization(priority));
            result.addOptimization(new LensFlaresOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new PostProcessesOptimization(priority));
            result.addOptimization(new ParticlesOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new TextureOptimization(priority, 256));

            // Next priority
            priority++;
            result.addOptimization(new RenderTargetsOptimization(priority));

            // Next priority
            priority++;
            result.addOptimization(new HardwareScalingOptimization(priority, 4));

            return result;
        }
    }

    /**
     * Class used to run optimizations in order to reach a target frame rate
     * @description More details at http://doc.babylonjs.com/how_to/how_to_use_sceneoptimizer
     */
    export class SceneOptimizer implements IDisposable {
        private _isRunning = false;
        private _options: SceneOptimizerOptions;
        private _scene: Scene;
        private _currentPriorityLevel = 0;
        private _targetFrameRate = 60;
        private _trackerDuration = 2000;
        private _currentFrameRate = 0;

        /**
         * Defines an observable called when the optimizer reaches the target frame rate
         */
        public onSuccessObservable = new Observable<SceneOptimizer>();
        /**
         * Defines an observable called when the optimizer enables an optimization
         */
        public onNewOptimizationAppliedObservable = new Observable<SceneOptimization>();
        /**
         * Defines an observable called when the optimizer is not able to reach the target frame rate
         */
        public onFailureObservable = new Observable<SceneOptimizer>();

        /**
         * Gets the current priority level (0 at start)
         */
        public get currentPriorityLevel(): number {
            return this._currentPriorityLevel;
        }

        /**
         * Gets the current frame rate checked by the SceneOptimizer
         */
        public get currentFrameRate(): number {
            return this._currentFrameRate;
        }

        /**
         * Gets or sets the current target frame rate (60 by default)
         */
        public get targetFrameRate(): number {
            return this._targetFrameRate;
        }

        /**
         * Gets or sets the current target frame rate (60 by default)
         */
        public set targetFrameRate(value: number) {
            this._targetFrameRate = value;
        }

        /**
         * Gets or sets the current interval between two checks (every 2000ms by default)
         */
        public get trackerDuration(): number {
            return this._trackerDuration;
        }

        /**
         * Gets or sets the current interval between two checks (every 2000ms by default)
         */
        public set trackerDuration(value: number) {
            this._trackerDuration = value;
        }

        /**
         * Gets the list of active optimizations
         */
        public get optimizations(): SceneOptimization[] {
            return this._options.optimizations;
        }

        /**
         * Creates a new SceneOptimizer
         * @param scene defines the scene to work on
         * @param options defines the options to use with the SceneOptimizer
         * @param autoGeneratePriorities defines if priorities must be generated and not read from SceneOptimization property (true by default)
         */
        public constructor(scene: Scene, options?: SceneOptimizerOptions, autoGeneratePriorities = true) {
            if (!options) {
                this._options = new SceneOptimizerOptions();
            } else {
                this._options = options;
            }

            if (this._options.targetFrameRate) {
                this._targetFrameRate = this._options.targetFrameRate;
            }

            if (this._options.trackerDuration) {
                this._trackerDuration = this._options.trackerDuration;
            }

            if (autoGeneratePriorities) {
                let priority = 0;
                for (var optim of this._options.optimizations) {
                    optim.priority = priority++;
                }
            }

            this._scene = scene || Engine.LastCreatedScene;
        }

        /**
         * Stops the current optimizer
         */
        public stop() {
            this._isRunning = false;
        }

        public reset() {
            this._currentPriorityLevel = 0;
        }

        public start() {
            if (this._isRunning) {
                return;
            }

            this._isRunning = true;

            // Let's wait for the scene to be ready before running our check
            this._scene.executeWhenReady(() => {
                setTimeout(() => {
                    this._checkCurrentState();
                }, this._trackerDuration);
            });
        }

        private _checkCurrentState() {
            if (!this._isRunning) {
                return;
            }

            let scene = this._scene;
            let options = this._options;

            this._currentFrameRate = Math.round(scene.getEngine().getFps());

            if (this._currentFrameRate >= this._targetFrameRate) {
                this._isRunning = false;
                this.onSuccessObservable.notifyObservers(this);
                return;
            }

            // Apply current level of optimizations
            var allDone = true;
            var noOptimizationApplied = true;
            for (var index = 0; index < options.optimizations.length; index++) {
                var optimization = options.optimizations[index];

                if (optimization.priority === this._currentPriorityLevel) {
                    noOptimizationApplied = false;
                    allDone = allDone && optimization.apply(scene);
                    this.onNewOptimizationAppliedObservable.notifyObservers(optimization);
                }
            }

            // If no optimization was applied, this is a failure :(
            if (noOptimizationApplied) {
                this._isRunning = false;
                this.onFailureObservable.notifyObservers(this);

                return;
            }

            // If all optimizations were done, move to next level
            if (allDone) {
                this._currentPriorityLevel++;
            }

            // Let's the system running for a specific amount of time before checking FPS
            scene.executeWhenReady(() => {
                setTimeout(() => {
                    this._checkCurrentState();
                }, this._trackerDuration);
            });
        }

        /**
         * Release all resources
         */
        public dispose(): void {
            this.onSuccessObservable.clear();
            this.onFailureObservable.clear();
            this.onNewOptimizationAppliedObservable.clear();
        }

        /**
         * Helper function to create a SceneOptimizer with one single line of code
         * @param scene defines the scene to work on
         * @param options defines the options to use with the SceneOptimizer
         * @param onSuccess defines a callback to call on success
         * @param onFailure defines a callback to call on failure
         */
        public static OptimizeAsync(scene: Scene, options?: SceneOptimizerOptions, onSuccess?: () => void, onFailure?: () => void): SceneOptimizer {
            let optimizer = new SceneOptimizer(scene, options || SceneOptimizerOptions.ModerateDegradationAllowed(), false);

            if (onSuccess) {
                optimizer.onSuccessObservable.add(() => {
                    onSuccess();
                });
            }

            if (onFailure) {
                optimizer.onFailureObservable.add(() => {
                    onFailure();
                });
            }

            optimizer.start();

            return optimizer;
        }
    }
} 