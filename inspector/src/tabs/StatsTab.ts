module INSPECTOR {

    export class StatsTab extends Tab {

        private _inspector: Inspector;

        /** 
         * Properties in this array will be updated
         * in a render loop - Mostly stats properties
         */
        private _updatableProperties: Array<{ elem: HTMLElement, updateFct: () => string }> = [];

        private _scene: BABYLON.Scene;
        private _engine: BABYLON.Engine;
        private _glInfo: any;

        private _updateLoopHandler: any;

        private _sceneInstrumentation: BABYLON.Nullable<BABYLON.SceneInstrumentation>;
        private _engineInstrumentation: BABYLON.Nullable<BABYLON.EngineInstrumentation>;

        private _connectToInstrumentation() {
            if (this._sceneInstrumentation) {
                return;
            }

            this._sceneInstrumentation = new BABYLON.SceneInstrumentation(this._scene);
            this._sceneInstrumentation.captureActiveMeshesEvaluationTime = true;
            this._sceneInstrumentation.captureRenderTargetsRenderTime = true;
            this._sceneInstrumentation.captureFrameTime = true;
            this._sceneInstrumentation.captureRenderTime = true;
            this._sceneInstrumentation.captureInterFrameTime = true;
            this._sceneInstrumentation.captureParticlesRenderTime = true;
            this._sceneInstrumentation.captureSpritesRenderTime = true;
            this._sceneInstrumentation.capturePhysicsTime = true;
            this._sceneInstrumentation.captureAnimationsTime = true;

            this._engineInstrumentation = new BABYLON.EngineInstrumentation(this._engine);
            this._engineInstrumentation.captureGPUFrameTime = true;
        }

        constructor(tabbar: TabBar, insp: Inspector) {
            super(tabbar, 'Stats');

            this._inspector = insp;

            this._scene = this._inspector.scene;
            this._engine = this._scene.getEngine();
            this._glInfo = this._engine.getGlInfo();

            this._connectToInstrumentation();

            // Build the stats panel: a div that will contains all stats
            this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;
            this._panel.classList.add("stats-panel")

            let title = Helpers.CreateDiv('stat-title1', this._panel);
            let fpsSpan = Helpers.CreateElement('span', 'stats-fps');
            this._updatableProperties.push({
                elem: fpsSpan,
                updateFct: () => { return BABYLON.Tools.Format(this._inspector.scene.getEngine().getFps(), 0) + " fps" }
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
                this._createStatLabel("Total meshes", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.meshes.length.toString() }
                });

                this._createStatLabel("Draw calls", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._sceneInstrumentation!.drawCallsCounter.current.toString() }
                });

                this._createStatLabel("Total lights", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.lights.length.toString() }
                });

                this._createStatLabel("Total vertices", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.getTotalVertices().toString() }
                });

                this._createStatLabel("Total materials", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.materials.length.toString() }
                });

                this._createStatLabel("Total textures", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.textures.length.toString() }
                });

                this._createStatLabel("Active meshes", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.getActiveMeshes().length.toString() }
                });

                this._createStatLabel("Active indices", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.getActiveIndices().toString() }
                });

                this._createStatLabel("Active bones", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.getActiveBones().toString() }
                });

                this._createStatLabel("Active particles", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._scene.getActiveParticles().toString() }
                });
            }

            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Duration";
            {
                this._createStatLabel("Meshes selection", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.activeMeshesEvaluationTimeCounter.current) }
                });
                this._createStatLabel("Render targets", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.renderTargetsRenderTimeCounter.current) }
                });
                this._createStatLabel("Particles", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.particlesRenderTimeCounter.current) }
                });
                this._createStatLabel("Sprites", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.spritesRenderTimeCounter.current) }
                });
                this._createStatLabel("Animations", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.animationsTimeCounter.current) }
                });
                this._createStatLabel("Physics", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.physicsTimeCounter.current) }
                });
                this._createStatLabel("Render", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.renderTimeCounter.current) }
                });
                this._createStatLabel("Frame", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.frameTimeCounter.current) }
                });
                this._createStatLabel("Inter-frame", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._sceneInstrumentation!.interFrameTimeCounter.current) }
                });
                this._createStatLabel("GPU Frame time", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._engineInstrumentation!.gpuFrameTimeCounter.current * 0.000001) }
                });
                this._createStatLabel("GPU Frame time (average)", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(this._engineInstrumentation!.gpuFrameTimeCounter.average * 0.000001) }
                });
                this._createStatLabel("Potential FPS", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return BABYLON.Tools.Format(1000.0 / this._sceneInstrumentation!.frameTimeCounter.current, 0) }
                });
                this._createStatLabel("Resolution", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._engine.getRenderWidth() + "x" + this._engine.getRenderHeight() }
                });
            }

            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Extensions";
            {
                this._createStatLabel("Std derivatives", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().standardDerivatives ? "Yes" : "No") }
                });
                this._createStatLabel("Compressed textures", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().s3tc ? "Yes" : "No") }
                });
                this._createStatLabel("Hardware instances", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().instancedArrays ? "Yes" : "No") }
                });
                this._createStatLabel("Texture float", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().textureFloat ? "Yes" : "No") }
                });
                this._createStatLabel("32bits indices", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().uintIndices ? "Yes" : "No") }
                });
                this._createStatLabel("Fragment depth", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().fragmentDepthSupported ? "Yes" : "No") }
                });
                this._createStatLabel("High precision shaders", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().highPrecisionShaderSupported ? "Yes" : "No") }
                });
                this._createStatLabel("Draw buffers", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().drawBuffersExtension ? "Yes" : "No") }
                });
                this._createStatLabel("Vertex array object", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().vertexArrayObject ? "Yes" : "No") }
                });
                this._createStatLabel("Timer query", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.getCaps().timerQuery ? "Yes" : "No") }
                });
            }

            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Caps.";
            {
                this._createStatLabel("Stencil", this._panel);
                let elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return (this._engine.isStencilEnable ? "Enabled" : "Disabled") }
                });
                this._createStatLabel("Max textures units", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._engine.getCaps().maxTexturesImageUnits.toString() }
                });
                this._createStatLabel("Max textures size", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._engine.getCaps().maxTextureSize.toString() }
                });
                this._createStatLabel("Max anisotropy", this._panel);
                elemValue = Helpers.CreateDiv('stat-value', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return this._engine.getCaps().maxAnisotropy.toString() }
                });
            }
            title = Helpers.CreateDiv('stat-title2', this._panel);
            title.textContent = "Info";
            {
                let elemValue = Helpers.CreateDiv('stat-infos', this._panel);
                this._updatableProperties.push({
                    elem: elemValue,
                    updateFct: () => { return "WebGL v" + this._engine.webGLVersion + " - " + this._glInfo.version + " - " + this._glInfo.renderer }
                });
            }
        }

        private _createStatLabel(content: string, parent: HTMLElement): HTMLElement {
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
            this._sceneInstrumentation!.dispose();
            this._sceneInstrumentation = null;
            this._engineInstrumentation!.dispose();
            this._engineInstrumentation = null;
        }

        public active(b: boolean) {
            super.active(b);
            if (b) {
                this._connectToInstrumentation();
                this._scene.registerAfterRender(this._updateLoopHandler);
            }
        }
    }
}