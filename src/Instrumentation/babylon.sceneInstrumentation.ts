module BABYLON {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    export class SceneInstrumentation implements IDisposable {
        private _captureActiveMeshesEvaluationTime = false;
        private _activeMeshesEvaluationTime = new PerfCounter();  

        // Observers
        private _onBeforeActiveMeshesEvaluationObserver: Nullable<Observer<Scene>> = null;
        private _onAfterActiveMeshesEvaluationObserver: Nullable<Observer<Scene>> = null;
                
        // Properties
        /**
         * Gets the perf counter used for active meshes evaluation time
         */
        public get activeMeshesEvaluationTime(): PerfCounter {
            return this._activeMeshesEvaluationTime;
        }

        /**
         * Gets the current active meshes evaluation time (in milliseconds)
         */
        public get currentActiveMeshesEvaluationTime(): number {
            return this._activeMeshesEvaluationTime.current;
        }

        /**
         * Gets the average active meshes evaluation time (in milliseconds)
         */        
        public get averageActiveMeshesEvaluationTime(): number {
            return this._activeMeshesEvaluationTime.average;
        }

        /**
         * Gets the current active meshes evaluation time capture status
         */
        public get captureActiveMeshesEvaluationTime(): boolean {
            return this._captureActiveMeshesEvaluationTime;
        }

        /**
         * Enable or disable the active meshes evaluation time capture
         */        
        public set captureActiveMeshesEvaluationTime(value: boolean) {
            if (value === this._captureActiveMeshesEvaluationTime) {
                return;
            }

            if (value) {
                this._onBeforeActiveMeshesEvaluationObserver = this.scene.onBeforeActiveMeshesEvaluationObservable.add(()=>{
                    Tools.StartPerformanceCounter("Active meshes evaluation");
                    this._activeMeshesEvaluationTime.beginMonitoring();
                });

                this._onAfterActiveMeshesEvaluationObserver = this.scene.onAfterActiveMeshesEvaluationObservable.add(()=>{                    
                    Tools.EndPerformanceCounter("Active meshes evaluation");
                    this._activeMeshesEvaluationTime.endMonitoring();
                });
            } else {
                this.scene.onBeforeActiveMeshesEvaluationObservable.remove(this._onBeforeActiveMeshesEvaluationObserver);
                this._onBeforeActiveMeshesEvaluationObserver = null;

                this.scene.onAfterActiveMeshesEvaluationObservable.remove(this._onAfterActiveMeshesEvaluationObserver);
                this._onAfterActiveMeshesEvaluationObserver = null;
            }
        }
    
        public constructor(public scene: Scene) {
        }

        public dispose() {
            this.scene.onBeforeActiveMeshesEvaluationObservable.remove(this._onBeforeActiveMeshesEvaluationObserver);
            this._onBeforeActiveMeshesEvaluationObserver = null;

            this.scene.onAfterActiveMeshesEvaluationObservable.remove(this._onAfterActiveMeshesEvaluationObserver);
            this._onAfterActiveMeshesEvaluationObserver = null;
        
            (<any>this.scene) = null;
        }
    }
}