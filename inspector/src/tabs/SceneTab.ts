declare function Split(elements: HTMLElement[], options: any): void;
module INSPECTOR {

    export class SceneTab extends Tab {

        private _inspector: Inspector;
        /** The list of  channels/options that can be activated/deactivated */
        private _actions: HTMLDivElement;

        /** The list of skeleton viewer */
        private _skeletonViewers: Array<BABYLON.Debug.SkeletonViewer> = [];

        /** The detail of the scene */
        private _detailsPanel: DetailPanel;

        constructor(tabbar: TabBar, insp: Inspector) {
            super(tabbar, 'Scene');
            this._inspector = insp;

            // Build the properties panel : a div that will contains the tree and the detail panel
            this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;

            this._actions = Helpers.CreateDiv('scene-actions', this._panel) as HTMLDivElement;

            this._detailsPanel = new DetailPanel();
            this._panel.appendChild(this._detailsPanel.toHtml());

            // build propertiesline
            let details = [];
            // Remove deprecated properties generating warning in console
            let dontTakeThis = ['interFramePerfCounter', 'lastFramePerfCounter', 'evaluateActiveMeshesDurationPerfCounter', 'renderDurationPerfCounter', 'particlesDurationPerfCounter', 'spriteDuractionPerfCounter'];
            let props = Helpers.GetAllLinesPropertiesAsString(this._inspector.scene, dontTakeThis);

            for (let propString of props) {
                let prop = new PropertyLine(new Property(propString, this._inspector.scene));
                details.push(prop);
            }
            this._detailsPanel.details = details;

            Split([this._actions, this._detailsPanel.toHtml()], {
                blockDrag: this._inspector.popupMode,
                sizes: [50, 50],
                direction: 'vertical'
            });

            // Build actions
            {

                // Rendering mode
                let title = Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Rendering mode';
                let point = Helpers.CreateDiv('action-radio', this._actions);
                let wireframe = Helpers.CreateDiv('action-radio', this._actions);
                let solid = Helpers.CreateDiv('action-radio', this._actions);
                point.textContent = 'Point';
                wireframe.textContent = 'Wireframe';
                solid.textContent = 'Solid';
                if (this._inspector.scene.forcePointsCloud) {
                    point.classList.add('active');
                } else if (this._inspector.scene.forceWireframe) {
                    wireframe.classList.add('active');
                } else {
                    solid.classList.add('active');
                }
                this._generateRadioAction([point, wireframe, solid]);
                point.addEventListener('click', () => { this._inspector.scene.forcePointsCloud = true; this._inspector.scene.forceWireframe = false; });
                wireframe.addEventListener('click', () => { this._inspector.scene.forcePointsCloud = false; this._inspector.scene.forceWireframe = true; });
                solid.addEventListener('click', () => { this._inspector.scene.forcePointsCloud = false; this._inspector.scene.forceWireframe = false; });

                // Textures
                title = Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Textures channels';
                this._generateActionLine('Diffuse Texture', BABYLON.StandardMaterial.DiffuseTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.DiffuseTextureEnabled = b });
                this._generateActionLine('Ambient Texture', BABYLON.StandardMaterial.AmbientTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.AmbientTextureEnabled = b });
                this._generateActionLine('Specular Texture', BABYLON.StandardMaterial.SpecularTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.SpecularTextureEnabled = b });
                this._generateActionLine('Emissive Texture', BABYLON.StandardMaterial.EmissiveTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.EmissiveTextureEnabled = b });
                this._generateActionLine('Bump Texture', BABYLON.StandardMaterial.BumpTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.BumpTextureEnabled = b });
                this._generateActionLine('Opacity Texture', BABYLON.StandardMaterial.OpacityTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.OpacityTextureEnabled = b });
                this._generateActionLine('Reflection Texture', BABYLON.StandardMaterial.ReflectionTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.ReflectionTextureEnabled = b });
                this._generateActionLine('Refraction Texture', BABYLON.StandardMaterial.RefractionTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.RefractionTextureEnabled = b });
                this._generateActionLine('ColorGrading', BABYLON.StandardMaterial.ColorGradingTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.ColorGradingTextureEnabled = b });
                this._generateActionLine('Lightmap Texture', BABYLON.StandardMaterial.LightmapTextureEnabled, (b: boolean) => { BABYLON.StandardMaterial.LightmapTextureEnabled = b });
                this._generateActionLine('Fresnel', BABYLON.StandardMaterial.FresnelEnabled, (b: boolean) => { BABYLON.StandardMaterial.FresnelEnabled = b });

                // Options
                title = Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Options';
                this._generateActionLine('Animations', this._inspector.scene.animationsEnabled, (b: boolean) => { this._inspector.scene.animationsEnabled = b });
                this._generateActionLine('Collisions', this._inspector.scene.collisionsEnabled, (b: boolean) => { this._inspector.scene.collisionsEnabled = b });
                this._generateActionLine('Fog', this._inspector.scene.fogEnabled, (b: boolean) => { this._inspector.scene.fogEnabled = b });
                this._generateActionLine('Lens flares', this._inspector.scene.lensFlaresEnabled, (b: boolean) => { this._inspector.scene.lensFlaresEnabled = b });
                this._generateActionLine('Lights', this._inspector.scene.lightsEnabled, (b: boolean) => { this._inspector.scene.lightsEnabled = b });
                this._generateActionLine('Particles', this._inspector.scene.particlesEnabled, (b: boolean) => { this._inspector.scene.particlesEnabled = b });
                this._generateActionLine('Post-processes', this._inspector.scene.postProcessesEnabled, (b: boolean) => { this._inspector.scene.postProcessesEnabled = b });
                this._generateActionLine('Probes', this._inspector.scene.probesEnabled, (b: boolean) => { this._inspector.scene.probesEnabled = b });
                this._generateActionLine('Procedural textures', this._inspector.scene.proceduralTexturesEnabled, (b: boolean) => { this._inspector.scene.proceduralTexturesEnabled = b });
                this._generateActionLine('Render targets', this._inspector.scene.renderTargetsEnabled, (b: boolean) => { this._inspector.scene.renderTargetsEnabled = b });
                this._generateActionLine('Shadows', this._inspector.scene.shadowsEnabled, (b: boolean) => { this._inspector.scene.shadowsEnabled = b });
                this._generateActionLine('Skeletons', this._inspector.scene.skeletonsEnabled, (b: boolean) => { this._inspector.scene.skeletonsEnabled = b });
                this._generateActionLine('Sprites', this._inspector.scene.spritesEnabled, (b: boolean) => { this._inspector.scene.spritesEnabled = b });
                this._generateActionLine('Textures', this._inspector.scene.texturesEnabled, (b: boolean) => { this._inspector.scene.texturesEnabled = b });

                // Audio
                title = Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Audio';
                let headphones = Helpers.CreateDiv('action-radio', this._actions);
                let normalSpeaker = Helpers.CreateDiv('action-radio', this._actions);
                this._generateActionLine('Disable audio', !this._inspector.scene.audioEnabled, (b: boolean) => { this._inspector.scene.audioEnabled = !b });
                headphones.textContent = 'Headphones';
                normalSpeaker.textContent = 'Normal speakers';
                this._generateRadioAction([headphones, normalSpeaker]);
                if (this._inspector.scene.headphone) {
                    headphones.classList.add('active');
                } else {
                    normalSpeaker.classList.add('active');
                }
                headphones.addEventListener('click', () => { this._inspector.scene.headphone = true; });
                normalSpeaker.addEventListener('click', () => { this._inspector.scene.headphone = false; });

                // Viewers
                title = Helpers.CreateDiv('actions-title', this._actions);
                title.textContent = 'Viewer';
                this._generateActionLine('Skeletons', false, (b: boolean) => {
                    if (b) {
                        for (var index = 0; index < this._inspector.scene.meshes.length; index++) {
                            var mesh = this._inspector.scene.meshes[index];
                            if (mesh.skeleton) {
                                var found = false;
                                for (var sIndex = 0; sIndex < this._skeletonViewers.length; sIndex++) {
                                    if (this._skeletonViewers[sIndex].skeleton === mesh.skeleton) {
                                        found = true;
                                        break;
                                    }
                                }
                                if (found) {
                                    continue;
                                }
                                var viewer = new BABYLON.Debug.SkeletonViewer(mesh.skeleton, mesh, this._inspector.scene);
                                viewer.isEnabled = true;
                                this._skeletonViewers.push(viewer);
                            }
                        }
                    } else {
                        for (var index = 0; index < this._skeletonViewers.length; index++) {
                            this._skeletonViewers[index].dispose();
                        }
                        this._skeletonViewers = [];
                    }
                });
            }
        }

        /** Overrides super.dispose */
        public dispose() {
            this._detailsPanel.dispose();
        }

        /** generates a div which correspond to an option that can be activated/deactivated */
        private _generateActionLine(name: string, initValue: boolean, action: (b: boolean) => void) {
            let div = Helpers.CreateDiv('scene-actions', this._actions);
            div.textContent = name;
            div.classList.add('action');
            if (initValue) {
                div.classList.add('active');
            }
            div.addEventListener('click', (e) => {
                div.classList.toggle('active');
                let isActivated = div.classList.contains('active');
                action(isActivated);
            })
        }

        /** 
         * Add a click action for all given elements : 
         * the clicked element is set as active, all others elements are deactivated
         */
        private _generateRadioAction(arr: Array<HTMLElement>) {
            let active = (elem: HTMLElement, evt: any) => {
                for (let e of arr) {
                    e.classList.remove('active');
                }
                elem.classList.add('active');
            }
            for (let elem of arr) {
                elem.addEventListener('click', active.bind(this, elem));
            }
        }
    }
}