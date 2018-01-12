module BABYLON {
    /**
     * This class can be used to get instrumentation data from a Babylon engine
     */
    export class EngineInstrumentation implements IDisposable {
        private _captureGPUFrameTime = false;
        private _gpuFrameTimeToken: Nullable<_TimeToken>;
        private _gpuFrameTime = new PerfCounter();

        private _captureShaderCompilationTime = false;
        private _shaderCompilationTime = new PerfCounter();        

        // Observers
        private _onBeginFrameObserver: Nullable<Observer<Engine>> = null;
        private _onEndFrameObserver: Nullable<Observer<Engine>> = null;
        private _onBeforeShaderCompilationObserver: Nullable<Observer<Engine>> = null;
        private _onAfterShaderCompilationObserver: Nullable<Observer<Engine>> = null;

        // Properties
        /**
         * Gets the perf counter used for GPU frame time
         */
        public get gpuFrameTimeCounter(): PerfCounter {
            return this._gpuFrameTime;
        }

        /**
         * Gets the GPU frame time capture status
         */
        public get captureGPUFrameTime(): boolean {
            return this._captureGPUFrameTime;
        }

        /**
         * Enable or disable the GPU frame time capture
         */        
        public set captureGPUFrameTime(value: boolean) {
            if (value === this._captureGPUFrameTime) {
                return;
            }

            this._captureGPUFrameTime = value;                 

            if (value) {
                this._onBeginFrameObserver = this.engine.onBeginFrameObservable.add(()=>{
                    if (!this._gpuFrameTimeToken) {
                        this._gpuFrameTimeToken = this.engine.startTimeQuery();
                    }
                });

                this._onEndFrameObserver = this.engine.onEndFrameObservable.add(()=>{
                    if (!this._gpuFrameTimeToken) {
                        return;
                    }
                    let time = this.engine.endTimeQuery(this._gpuFrameTimeToken);

                    if (time > -1) {
                        this._gpuFrameTimeToken = null;
                        this._gpuFrameTime.fetchNewFrame();
                        this._gpuFrameTime.addCount(time, true);
                    }
                });
            } else {
                this.engine.onBeginFrameObservable.remove(this._onBeginFrameObserver);
                this._onBeginFrameObserver = null;
                this.engine.onEndFrameObservable.remove(this._onEndFrameObserver);
                this._onEndFrameObserver = null;
            }
        }

        /**
         * Gets the perf counter used for shader compilation time
         */
        public get shaderCompilationTimeCounter(): PerfCounter {
            return this._shaderCompilationTime;
        }

        /**
         * Gets the shader compilation time capture status
         */
        public get captureShaderCompilationTime(): boolean {
            return this._captureShaderCompilationTime;
        }

        /**
         * Enable or disable the shader compilation time capture
         */        
        public set captureShaderCompilationTime(value: boolean) {
            if (value === this._captureShaderCompilationTime) {
                return;
            }

            this._captureShaderCompilationTime = value;                

            if (value) {
                this._onBeforeShaderCompilationObserver = this.engine.onBeforeShaderCompilationObservable.add(()=>{
                    this._shaderCompilationTime.fetchNewFrame();
                    this._shaderCompilationTime.beginMonitoring();                    
                });

                this._onAfterShaderCompilationObserver = this.engine.onAfterShaderCompilationObservable.add(()=>{
                    this._shaderCompilationTime.endMonitoring();       
                });
            } else {
                this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
                this._onBeforeShaderCompilationObserver = null;
                this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
                this._onAfterShaderCompilationObserver = null;
            }
        }

        public constructor(public engine: Engine) {
        }

        public dispose() {
            this.engine.onBeginFrameObservable.remove(this._onBeginFrameObserver);
            this._onBeginFrameObserver = null;

            this.engine.onEndFrameObservable.remove(this._onEndFrameObserver);
            this._onEndFrameObserver = null;

            this.engine.onBeforeShaderCompilationObservable.remove(this._onBeforeShaderCompilationObserver);
            this._onBeforeShaderCompilationObserver = null;

            this.engine.onAfterShaderCompilationObservable.remove(this._onAfterShaderCompilationObserver);
            this._onAfterShaderCompilationObserver = null;     

            (<any>this.engine) = null;
        }
    }
}