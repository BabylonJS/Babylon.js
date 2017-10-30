module BABYLON {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    export class SceneInstrumentation implements IDisposable {
        private _captureActiveMeshesEvaluationTime = false;
        private _activeMeshesEvaluationTime = new PerfCounter();  

        private _captureRenderTargetsRenderTime = false;
        private _renderTargetsRenderTime = new PerfCounter();    
        
        private _captureFrameTime = false;
        private _frameTime = new PerfCounter();        

        private _captureInterFrameTime = false;
        private _interFrameTime = new PerfCounter();              

        // Observers
        private _onBeforeActiveMeshesEvaluationObserver: Nullable<Observer<Scene>> = null;
        private _onAfterActiveMeshesEvaluationObserver: Nullable<Observer<Scene>> = null;
        private _onBeforeRenderTargetsRenderObserver: Nullable<Observer<Scene>> = null;
        private _onAfterRenderTargetsRenderObserver: Nullable<Observer<Scene>> = null;

        private _onBeforeRenderObserver: Nullable<Observer<Scene>> = null;
        private _onAfterRenderObserver: Nullable<Observer<Scene>> = null;
        
        private _onBeforeAnimationsObserver: Nullable<Observer<Scene>> = null;
                
        // Properties
        /**
         * Gets the perf counter used for active meshes evaluation time
         */
        public get activeMeshesEvaluationTimeCounter(): PerfCounter {
            return this._activeMeshesEvaluationTime;
        }

        /**
         * Gets the active meshes evaluation time capture status
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

            this._captureActiveMeshesEvaluationTime = value;            

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

        /**
         * Gets the perf counter used for render targets render time
         */
        public get renderTargetsRenderTimeCounter(): PerfCounter {
            return this._renderTargetsRenderTime;
        }

        /**
         * Gets the render targets render time capture status
         */
        public get captureRenderTargetsRenderTime(): boolean {
            return this._captureRenderTargetsRenderTime;
        }        

        /**
         * Enable or disable the render targets render time capture
         */        
        public set captureRenderTargetsRenderTime(value: boolean) {
            if (value === this._captureRenderTargetsRenderTime) {
                return;
            }

            this._captureRenderTargetsRenderTime = value;

            if (value) {
                this._onBeforeRenderTargetsRenderObserver = this.scene.OnBeforeRenderTargetsRenderObservable.add(()=>{
                    Tools.StartPerformanceCounter("Render targets rendering");
                    this._renderTargetsRenderTime.beginMonitoring();
                });

                this._onAfterRenderTargetsRenderObserver = this.scene.OnAfterRenderTargetsRenderObservable.add(()=>{                    
                    Tools.EndPerformanceCounter("Render targets rendering");
                    this._renderTargetsRenderTime.endMonitoring(false);
                });
            } else {
                this.scene.OnBeforeRenderTargetsRenderObservable.remove(this._onBeforeRenderTargetsRenderObserver);
                this._onBeforeRenderTargetsRenderObserver = null;

                this.scene.OnAfterRenderTargetsRenderObservable.remove(this._onAfterRenderTargetsRenderObserver);
                this._onAfterRenderTargetsRenderObserver = null;
            }
        }        

        /**
         * Gets the perf counter used for frame time capture
         */
        public get frameTimeCounter(): PerfCounter {
            return this._frameTime;
        }               
       
        /**
         * Gets the frame time capture status
         */        
        public get captureFrameTime(): boolean {
            return this._captureFrameTime;
        }        

        /**
         * Enable or disable the frame time capture
         */        
        public set captureFrameTime(value: boolean) {
            this._captureFrameTime = value;
        }       
     
        /**
         * Gets the perf counter used for inter-frames time capture
         */
        public get frameInterTimeCounter(): PerfCounter {
            return this._interFrameTime;
        }               
       
        /**
         * Gets the inter-frames time capture status
         */        
        public get captureInterFrameTime(): boolean {
            return this._captureInterFrameTime;
        }        

        /**
         * Enable or disable the inter-frames time capture
         */        
        public set captureInterFrameTime(value: boolean) {
            if (value === this._captureInterFrameTime) {
                return;
            }

            this._captureInterFrameTime = value;

            if (value) {
                this._onBeforeAnimationsObserver = this.scene.onBeforeAnimationsObservable.add(()=>{
                    this._interFrameTime.endMonitoring(); 
                });
            } else {
                this.scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
                this._onBeforeAnimationsObserver = null;
            }
        }     
    
        public constructor(public scene: Scene) {
            // Before render
            this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
                if (this._captureActiveMeshesEvaluationTime) {
                    this._activeMeshesEvaluationTime.fetchNewFrame();
                }

                if (this._captureRenderTargetsRenderTime) {
                    this._renderTargetsRenderTime.fetchNewFrame();
                }

                if (this._captureFrameTime) {
                    Tools.StartPerformanceCounter("Scene rendering");
                    this._frameTime.beginMonitoring();
                }   
            });

            // After render
            this._onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                if (this._captureFrameTime) {
                    Tools.EndPerformanceCounter("Scene rendering");
                    this._frameTime.endMonitoring();                    
                }

                if (this._captureInterFrameTime) {
                    this._interFrameTime.beginMonitoring();  
                }                
            });
        }

        public dispose() {
            this.scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
            this._onBeforeRenderObserver = null;

            this.scene.onAfterRenderObservable.remove(this._onAfterRenderObserver);
            this._onAfterRenderObserver = null;

            this.scene.onBeforeActiveMeshesEvaluationObservable.remove(this._onBeforeActiveMeshesEvaluationObserver);
            this._onBeforeActiveMeshesEvaluationObserver = null;

            this.scene.onAfterActiveMeshesEvaluationObservable.remove(this._onAfterActiveMeshesEvaluationObserver);
            this._onAfterActiveMeshesEvaluationObserver = null;

            this.scene.OnBeforeRenderTargetsRenderObservable.remove(this._onBeforeRenderTargetsRenderObserver);
            this._onBeforeRenderTargetsRenderObserver = null;   
            
            this.scene.OnAfterRenderTargetsRenderObservable.remove(this._onAfterRenderTargetsRenderObserver);
            this._onAfterRenderTargetsRenderObserver = null;      
            
            this.scene.onBeforeAnimationsObservable.remove(this._onBeforeAnimationsObserver);
            this._onBeforeAnimationsObserver = null;
                
            (<any>this.scene) = null;
        }
    }
}