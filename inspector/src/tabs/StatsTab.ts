module INSPECTOR {

    export class StatsTab extends Tab {

        private _inspector : Inspector;

        /** 
         * Properties in this array will be updated
         * in a render loop - Mostly stats properties
         */
        private _updatableProperties : Array<{elem:HTMLElement, updateFct : () => string}> = [];

        private _scene : BABYLON.Scene;
        private _engine : BABYLON.Engine;
        private _glInfo : any;

        private _updateLoopHandler : any;

        constructor(tabbar:TabBar, insp:Inspector) {
            super(tabbar, 'Stats');        

            this._inspector         = insp;  

            this._scene             = this._inspector.scene;
            this._engine            = this._scene.getEngine();
            this._glInfo            = this._engine.getGlInfo();

            // Build the stats panel: a div that will contains all stats
            this._panel             = Helpers.CreateDiv('tab-panel') as HTMLDivElement; 
            this._panel.classList.add("stats-panel")
            
            let title               = Helpers.CreateDiv('stat-title1', this._panel);
            let fpsSpan             = Helpers.CreateElement('span', 'stats-fps');
            this._updatableProperties.push({ 
                elem:fpsSpan, 
                updateFct:() => { return BABYLON.Tools.Format(this._inspector.scene.getEngine().getFps(), 0) + " fps"}
            });
                
            let versionSpan = Helpers.CreateElement('span');
            versionSpan.textContent = `Babylon.js v${BABYLON.Engine.Version} - `;
            title.appendChild(versionSpan);
            title.appendChild(fpsSpan);
                        
            this._updateLoopHandler = this._update.bind(this);

            // Count block
            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Count";
            {                
                let elemLabel = this._createStatLabel("Total meshes", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.meshes.length.toString()}
                });

                elemLabel = this._createStatLabel("Draw calls", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._engine.drawCalls.toString()}
                });

                elemLabel = this._createStatLabel("Total lights", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.lights.length.toString()}
                });

                elemLabel = this._createStatLabel("Total vertices", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.getTotalVertices().toString()}
                });

                elemLabel = this._createStatLabel("Total materials", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.materials.length.toString()}
                });

                elemLabel = this._createStatLabel("Total textures", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.textures.length.toString()}
                });

                elemLabel = this._createStatLabel("Active meshes", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.getActiveMeshes().length.toString()}
                });

                elemLabel = this._createStatLabel("Active indices", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.getActiveIndices().toString()}
                });

                elemLabel = this._createStatLabel("Active bones", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.getActiveBones().toString()}
                });

                elemLabel = this._createStatLabel("Active particles", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._scene.getActiveParticles().toString()}
                });
            }            
            
            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Duration";
            {
                let elemLabel = this._createStatLabel("Meshes selection", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getEvaluateActiveMeshesDuration())}
                });
                elemLabel = this._createStatLabel("Render targets", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getRenderTargetsDuration())}
                });
                elemLabel = this._createStatLabel("Particles", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getParticlesDuration())}
                });
                elemLabel = this._createStatLabel("Sprites", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getSpritesDuration())}
                });
                elemLabel = this._createStatLabel("Render", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getRenderDuration())}
                });
                elemLabel = this._createStatLabel("Frame", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getLastFrameDuration())}
                });
                elemLabel = this._createStatLabel("Inter-frame", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(this._scene.getInterFramePerfCounter())}
                });                
                elemLabel = this._createStatLabel("Potential FPS", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return BABYLON.Tools.Format(1000.0 / this._scene.getLastFrameDuration(), 0)}
                });
                elemLabel = this._createStatLabel("Resolution", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._engine.getRenderWidth() + "x" + this._engine.getRenderHeight()}
                });
            }
            
            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Extensions";
            {
                let elemLabel = this._createStatLabel("Std derivatives", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().standardDerivatives ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("Compressed textures", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().s3tc ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("Hardware instances", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().instancedArrays ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("Texture float", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().textureFloat ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("32bits indices", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().uintIndices ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("Fragment depth", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().fragmentDepthSupported ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("High precision shaders", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().highPrecisionShaderSupported ? "Yes" : "No")}
                });
                elemLabel = this._createStatLabel("Draw buffers", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().drawBuffersExtension ? "Yes" : "No")}
                });                 
                elemLabel = this._createStatLabel("Vertex array object", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.getCaps().vertexArrayObject ? "Yes" : "No")}
                }); 
            }

            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Caps.";
            {
                let elemLabel = this._createStatLabel("Stencil", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return (this._engine.isStencilEnable ? "Enabled" : "Disabled")}
                });
                elemLabel = this._createStatLabel("Max textures units", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._engine.getCaps().maxTexturesImageUnits.toString()}
                });
                elemLabel = this._createStatLabel("Max textures size", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._engine.getCaps().maxTextureSize.toString()}
                });
                elemLabel = this._createStatLabel("Max anisotropy", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return this._engine.getCaps().maxAnisotropy.toString()}
                });
            }
            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Info";
            {
                let elemValue = Helpers.CreateDiv('stat-infos', this._panel);
                this._updatableProperties.push({ 
                    elem:elemValue, 
                    updateFct:() => { return "WebGL v" + this._engine.webGLVersion + " - " + this._glInfo.version + " - "+this._glInfo.renderer}
                });
            }
        }
        
        private _createStatLabel(content:string, parent: HTMLElement) : HTMLElement {
            let elem = Helpers.CreateDiv('stat-label', parent);
            elem.textContent = content;
            return elem;
        }

        /** Update each properties of the stats panel */
        private _update() {
            for (let prop of this._updatableProperties) {
                prop.elem.textContent = prop.updateFct();
            }
        }

        public dispose() {
            this._scene.unregisterAfterRender(this._updateLoopHandler);
        }

        public active(b: boolean){
            super.active(b);
            if(b){
                this._scene.registerAfterRender(this._updateLoopHandler);
            }
        }
    }
}