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

        private _captureRenderTime = false;
        private _renderTime = new PerfCounter();           

        private _captureInterFrameTime = false;
        private _interFrameTime = new PerfCounter();    
        
        private _captureParticlesRenderTime = false;
        private _particlesRenderTime = new PerfCounter();       
          
        private _captureSpritesRenderTime = false;
        private _spritesRenderTime = new PerfCounter();   

        private _capturePhysicsTime = false;
        private _physicsTime = new PerfCounter();     
        
        private _captureAnimationsTime = false;
        private _animationsTime = new PerfCounter();            

        // Observers
        private _onBeforeActiveMeshesEvaluationObserver: Nullable<Observer<Scene>> = null;
        private _onAfterActiveMeshesEvaluationObserver: Nullable<Observer<Scene>> = null;
        private _onBeforeRenderTargetsRenderObserver: Nullable<Observer<Scene>> = null;
        private _onAfterRenderTargetsRenderObserver: Nullable<Observer<Scene>> = null;

        private _onAfterRenderObserver: Nullable<Observer<Scene>> = null;

        private _onBeforeDrawPhaseObserver: Nullable<Observer<Scene>> = null;
        private _onAfterDrawPhaseObserver: Nullable<Observer<Scene>> = null;        
        
        private _onBeforeAnimationsObserver: Nullable<Observer<Scene>> = null;

        private _onBeforeParticlesRenderingObserver: Nullable<Observer<Scene>> = null;
        private _onAfterParticlesRenderingObserver: Nullable<Observer<Scene>> = null;

        private _onBeforeSpritesRenderingObserver: Nullable<Observer<Scene>> = null;
        private _onAfterSpritesRenderingObserver: Nullable<Observer<Scene>> = null;      
        
        private _onBeforePhysicsObserver: Nullable<Observer<Scene>> = null;
        private _onAfterPhysicsObserver: Nullable<Observer<Scene>> = null;     
        
        private _onAfterAnimationsObserver: Nullable<Observer<Scene>> = null;    
                
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
         * Gets the perf counter used for particles render time
         */
        public get particlesRenderTimeCounter(): PerfCounter {
            return this._particlesRenderTime;
        }

        /**
         * Gets the particles render time capture status
         */
        public get captureParticlesRenderTime(): boolean {
            return this._captureParticlesRenderTime;
        }        

        /**
         * Enable or disable the particles render time capture
         */        
        public set captureParticlesRenderTime(value: boolean) {
            if (value === this._captureParticlesRenderTime) {
                return;
            }

            this._captureParticlesRenderTime = value;

            if (value) {
                this._onBeforeParticlesRenderingObserver = this.scene.onBeforeParticlesRenderingObservable.add(()=>{                    
                    Tools.StartPerformanceCounter("Particles");
                    this._particlesRenderTime.beginMonitoring();
                });

                this._onAfterParticlesRenderingObserver = this.scene.onAfterParticlesRenderingObservable.add(()=>{                                        
                    Tools.EndPerformanceCounter("Particles");
                    this._particlesRenderTime.endMonitoring(false);
                });
            } else {
                this.scene.onBeforeParticlesRenderingObservable.remove(this._onBeforeParticlesRenderingObserver);
                this._onBeforeParticlesRenderingObserver = null;

                this.scene.onAfterParticlesRenderingObservable.remove(this._onAfterParticlesRenderingObserver);
                this._onAfterParticlesRenderingObserver = null;
            }
        }        

        /**
         * Gets the perf counter used for sprites render time
         */
        public get spritesRenderTimeCounter(): PerfCounter {
            return this._spritesRenderTime;
        }

        /**
         * Gets the sprites render time capture status
         */
        public get captureSpritesRenderTime(): boolean {
            return this._captureSpritesRenderTime;
        }        

        /**
         * Enable or disable the sprites render time capture
         */        
        public set captureSpritesRenderTime(value: boolean) {
            if (value === this._captureSpritesRenderTime) {
                return;
            }

            this._captureSpritesRenderTime = value;

            if (value) {
                this._onBeforeSpritesRenderingObserver = this.scene.onBeforeSpritesRenderingObservable.add(()=>{                    
                    Tools.StartPerformanceCounter("Sprites");
                    this._spritesRenderTime.beginMonitoring();
                });

                this._onAfterSpritesRenderingObserver = this.scene.onAfterSpritesRenderingObservable.add(()=>{                                        
                    Tools.EndPerformanceCounter("Sprites");
                    this._spritesRenderTime.endMonitoring(false);
                });
            } else {
                this.scene.onBeforeSpritesRenderingObservable.remove(this._onBeforeSpritesRenderingObserver);
                this._onBeforeSpritesRenderingObserver = null;

                this.scene.onAfterSpritesRenderingObservable.remove(this._onAfterSpritesRenderingObserver);
                this._onAfterSpritesRenderingObserver = null;
            }
        }      

        /**
         * Gets the perf counter used for physics time
         */
        public get physicsTimeCounter(): PerfCounter {
            return this._physicsTime;
        }

        /**
         * Gets the physics time capture status
         */
        public get capturePhysicsTime(): boolean {
            return this._capturePhysicsTime;
        }        

        /**
         * Enable or disable the physics time capture
         */        
        public set capturePhysicsTime(value: boolean) {
            if (value === this._capturePhysicsTime) {
                return;
            }

            this._capturePhysicsTime = value;

            if (value) {
                this._onBeforePhysicsObserver = this.scene.onBeforePhysicsObservable.add(()=>{                    
                    Tools.StartPerformanceCounter("Physics");
                    this._physicsTime.beginMonitoring();
                });

                this._onAfterPhysicsObserver = this.scene.onAfterPhysicsObservable.add(()=>{                                        
                    Tools.EndPerformanceCounter("Physics");
                    this._physicsTime.endMonitoring();
                });
            } else {
                this.scene.onBeforePhysicsObservable.remove(this._onBeforePhysicsObserver);
                this._onBeforePhysicsObserver = null;

                this.scene.onAfterPhysicsObservable.remove(this._onAfterPhysicsObserver);
                this._onAfterPhysicsObserver = null;
            }
        }      


        /**
         * Gets the perf counter used for animations time
         */
        public get animationsTimeCounter(): PerfCounter {
            return this._animationsTime;
        }

        /**
         * Gets the animations time capture status
         */
        public get captureAnimationsTime(): boolean {
            return this._captureAnimationsTime;
        }        

        /**
         * Enable or disable the animations time capture
         */        
        public set captureAnimationsTime(value: boolean) {
            if (value === this._captureAnimationsTime) {
                return;
            }

            this._captureAnimationsTime = value;

            if (value) {
                this._onAfterAnimationsObserver = this.scene.onAfterAnimationsObservable.add(()=>{                    
                    this._animationsTime.endMonitoring();
                });
            } else {
                this.scene.onAfterAnimationsObservable.remove(this._onAfterAnimationsObserver);
                this._onAfterAnimationsObserver = null;
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
        public get interFrameTimeCounter(): PerfCounter {
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
            this._captureInterFrameTime = value;
        }     

        /**
         * Gets the perf counter used for render time capture
         */
        public get renderTimeCounter(): PerfCounter {
            return this._renderTime;
        }               
       
        /**
         * Gets the render time capture status
         */        
        public get captureRenderTime(): boolean {
            return this._captureRenderTime;
        }        

        /**
         * Enable or disable the render time capture
         */        
        public set captureRenderTime(value: boolean) {
            if (value === this._captureRenderTime) {
                return;
            }

            this._captureRenderTime = value;

            if (value) {
                this._onBeforeDrawPhaseObserver = this.scene.onBeforeDrawPhaseObservable.add(()=>{
                    this._renderTime.beginMonitoring(); 
                    Tools.StartPerformanceCounter("Main render");
                });

                this._onAfterDrawPhaseObserver = this.scene.onAfterDrawPhaseObservable.add(()=>{
                    this._renderTime.endMonitoring(false); 
                    Tools.EndPerformanceCounter("Main render");
                });                
            } else {
                this.scene.onBeforeDrawPhaseObservable.remove(this._onBeforeDrawPhaseObserver);
                this._onBeforeDrawPhaseObserver = null;
                this.scene.onAfterDrawPhaseObservable.remove(this._onAfterDrawPhaseObserver);
                this._onAfterDrawPhaseObserver = null;
            }
        }            

        /**
         * Gets the perf counter used for frame time capture
         */
        public get drawCallsCounter(): PerfCounter {
            return this.scene.getEngine()._drawCalls;
        }            
    
        public constructor(public scene: Scene) {
            // Before render
            this._onBeforeAnimationsObserver = scene.onBeforeAnimationsObservable.add(() => {
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

                if (this._captureInterFrameTime) {
                    this._interFrameTime.endMonitoring(); 
                }                   

                if (this._captureParticlesRenderTime) {
                    this._particlesRenderTime.fetchNewFrame();
                }

                if (this._captureSpritesRenderTime) {
                    this._spritesRenderTime.fetchNewFrame();
                }

                if (this._captureAnimationsTime) {
                    this._animationsTime.beginMonitoring();
                }

                this.scene.getEngine()._drawCalls.fetchNewFrame();
            });

            // After render
            this._onAfterRenderObserver = scene.onAfterRenderObservable.add(() => {
                if (this._captureFrameTime) {
                    Tools.EndPerformanceCounter("Scene rendering");
                    this._frameTime.endMonitoring();                    
                }

                if (this._captureRenderTime) {
                    this._renderTime.endMonitoring(false);                    
                }                

                if (this._captureInterFrameTime) {
                    this._interFrameTime.beginMonitoring();  
                }                
            });
        }

        public dispose() {
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

            this.scene.onBeforeParticlesRenderingObservable.remove(this._onBeforeParticlesRenderingObserver);
            this._onBeforeParticlesRenderingObserver = null;

            this.scene.onAfterParticlesRenderingObservable.remove(this._onAfterParticlesRenderingObserver);
            this._onAfterParticlesRenderingObserver = null;         
            
            this.scene.onBeforeSpritesRenderingObservable.remove(this._onBeforeSpritesRenderingObserver);
            this._onBeforeSpritesRenderingObserver = null;

            this.scene.onAfterSpritesRenderingObservable.remove(this._onAfterSpritesRenderingObserver);
            this._onAfterSpritesRenderingObserver = null;       
            
            this.scene.onBeforeDrawPhaseObservable.remove(this._onBeforeDrawPhaseObserver);
            this._onBeforeDrawPhaseObserver = null;

            this.scene.onAfterDrawPhaseObservable.remove(this._onAfterDrawPhaseObserver);
            this._onAfterDrawPhaseObserver = null;    
            
            this.scene.onBeforePhysicsObservable.remove(this._onBeforePhysicsObserver);
            this._onBeforePhysicsObserver = null;

            this.scene.onAfterPhysicsObservable.remove(this._onAfterPhysicsObserver);
            this._onAfterPhysicsObserver = null;    
            
            this.scene.onAfterAnimationsObservable.remove(this._onAfterAnimationsObserver);
            this._onAfterAnimationsObserver = null;            
                
            (<any>this.scene) = null;
        }
    }
}