import { Debug, StandardMaterial } from "babylonjs";
import { DetailPanel } from "../details/DetailPanel";
import { Property } from "../details/Property";
import { PropertyLine } from "../details/PropertyLine";
import { Helpers } from "../helpers/Helpers";
import { Inspector } from "../Inspector";
import { Tab } from "./Tab";
import { TabBar } from "./TabBar";

import * as Split from "Split";

export class SceneTab extends Tab {

    private _inspector: Inspector;
    /** The list of  channels/options that can be activated/deactivated */
    private _actions: HTMLDivElement;

    /** The list of skeleton viewer */
    private _skeletonViewers: Array<any> = [];

    /** The detail of the scene */
    private _detailsPanel: DetailPanel;

    constructor(tabbar: TabBar, insp: Inspector) {
        super(tabbar, 'Scene');
        this._inspector = insp;

        // Build the properties panel : a div that will contains the tree and the detail panel
        this._panel = Helpers.CreateDiv('tab-panel') as HTMLDivElement;

        this._actions = Helpers.CreateDiv('scene-actions', this._panel, '') as HTMLDivElement;

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

            // --------------------- Rendering mode ---------------------

            let title = Helpers.CreateDiv('actions-title', this._actions, 'Choose the way of rendering the scene.');
            title.textContent = 'Rendering mode';
            let point = Helpers.CreateDiv('action-radio', this._actions, 'Force scene rendering to points cloud : scene.forcePointsCloud');
            point.textContent = 'Point';
            let wireframe = Helpers.CreateDiv('action-radio', this._actions, 'Force scene rendering to wireframe : scene.forceWireframe');
            wireframe.textContent = 'Wireframe';
            let solid = Helpers.CreateDiv('action-radio', this._actions, 'Force scene rendering to solid.');
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

            // --------------------- Textures ---------------------

            title = Helpers.CreateDiv('actions-title', this._actions, 'Choose which textures channels to display or not on materials. (Check to display)');
            title.textContent = 'Textures channels';
            this._generateActionLine('Diffuse Texture', StandardMaterial.DiffuseTextureEnabled, (b: boolean) => { StandardMaterial.DiffuseTextureEnabled = b; }, 'StandardMaterial.DiffuseTextureEnabled');
            this._generateActionLine('Ambient Texture', StandardMaterial.AmbientTextureEnabled, (b: boolean) => { StandardMaterial.AmbientTextureEnabled = b; }, 'StandardMaterial.AmbientTextureEnabled');
            this._generateActionLine('Specular Texture', StandardMaterial.SpecularTextureEnabled, (b: boolean) => { StandardMaterial.SpecularTextureEnabled = b; }, 'StandardMaterial.SpecularTextureEnabled');
            this._generateActionLine('Emissive Texture', StandardMaterial.EmissiveTextureEnabled, (b: boolean) => { StandardMaterial.EmissiveTextureEnabled = b; }, 'StandardMaterial.EmissiveTextureEnabled');
            this._generateActionLine('Bump Texture', StandardMaterial.BumpTextureEnabled, (b: boolean) => { StandardMaterial.BumpTextureEnabled = b; }, 'StandardMaterial.BumpTextureEnabled');
            this._generateActionLine('Opacity Texture', StandardMaterial.OpacityTextureEnabled, (b: boolean) => { StandardMaterial.OpacityTextureEnabled = b; }, 'StandardMaterial.OpacityTextureEnabled');
            this._generateActionLine('Reflection Texture', StandardMaterial.ReflectionTextureEnabled, (b: boolean) => { StandardMaterial.ReflectionTextureEnabled = b; }, 'StandardMaterial.ReflectionTextureEnabled');
            this._generateActionLine('Refraction Texture', StandardMaterial.RefractionTextureEnabled, (b: boolean) => { StandardMaterial.RefractionTextureEnabled = b; }, 'StandardMaterial.RefractionTextureEnabled');
            this._generateActionLine('ColorGrading', StandardMaterial.ColorGradingTextureEnabled, (b: boolean) => { StandardMaterial.ColorGradingTextureEnabled = b; }, 'StandardMaterial.ColorGradingTextureEnabled');
            this._generateActionLine('Lightmap Texture', StandardMaterial.LightmapTextureEnabled, (b: boolean) => { StandardMaterial.LightmapTextureEnabled = b; }, 'StandardMaterial.LightmapTextureEnabled');
            this._generateActionLine('Fresnel', StandardMaterial.FresnelEnabled, (b: boolean) => { StandardMaterial.FresnelEnabled = b; }, 'StandardMaterial.FresnelEnabled');

            // --------------------- Options ---------------------

            title = Helpers.CreateDiv('actions-title', this._actions, 'Choose which options to enable / disable on the scene. (Uncheck to disable).');
            title.textContent = 'Options';
            this._generateActionLine('Animations', this._inspector.scene.animationsEnabled, (b: boolean) => { this._inspector.scene.animationsEnabled = b; }, 'scene.animationsEnabled');
            this._generateActionLine('Collisions', this._inspector.scene.collisionsEnabled, (b: boolean) => { this._inspector.scene.collisionsEnabled = b; }, 'scene.collisionsEnabled');
            this._generateActionLine('Fog', this._inspector.scene.fogEnabled, (b: boolean) => { this._inspector.scene.fogEnabled = b; }, 'scene.fogEnabled(boolean)');
            this._generateActionLine('Lens flares', this._inspector.scene.lensFlaresEnabled, (b: boolean) => { this._inspector.scene.lensFlaresEnabled = b; }, 'scene.lensFlaresEnabled');
            this._generateActionLine('Lights', this._inspector.scene.lightsEnabled, (b: boolean) => { this._inspector.scene.lightsEnabled = b; }, 'scene.lightsEnabled');
            this._generateActionLine('Particles', this._inspector.scene.particlesEnabled, (b: boolean) => { this._inspector.scene.particlesEnabled = b; }, 'scene.particlesEnabled');
            this._generateActionLine('Post-processes', this._inspector.scene.postProcessesEnabled, (b: boolean) => { this._inspector.scene.postProcessesEnabled = b; }, 'scene.postProcessesEnabled');
            this._generateActionLine('Probes', this._inspector.scene.probesEnabled, (b: boolean) => { this._inspector.scene.probesEnabled = b; }, 'scene.probesEnabled');
            this._generateActionLine('Procedural textures', this._inspector.scene.proceduralTexturesEnabled, (b: boolean) => { this._inspector.scene.proceduralTexturesEnabled = b; }, 'scene.proceduralTexturesEnabled');
            this._generateActionLine('Render targets', this._inspector.scene.renderTargetsEnabled, (b: boolean) => { this._inspector.scene.renderTargetsEnabled = b; }, 'scene.renderTargetsEnabled');
            this._generateActionLine('Shadows', this._inspector.scene.shadowsEnabled, (b: boolean) => { this._inspector.scene.shadowsEnabled = b; }, 'scene.shadowsEnabled');
            this._generateActionLine('Skeletons', this._inspector.scene.skeletonsEnabled, (b: boolean) => { this._inspector.scene.skeletonsEnabled = b; }, 'scene.skeletonsEnabled');
            this._generateActionLine('Sprites', this._inspector.scene.spritesEnabled, (b: boolean) => { this._inspector.scene.spritesEnabled = b; }, 'scene.spritesEnabled');
            this._generateActionLine('Textures', this._inspector.scene.texturesEnabled, (b: boolean) => { this._inspector.scene.texturesEnabled = b; }, 'scene.texturesEnabled');

            // --------------------- Audio ---------------------

            title = Helpers.CreateDiv('actions-title', this._actions, 'Choose which audio rendering should be used.');
            title.textContent = 'Audio';
            let headphones = Helpers.CreateDiv('action-radio', this._actions, 'Use Headphones mode.');
            headphones.textContent = 'Headphones';
            let normalSpeaker = Helpers.CreateDiv('action-radio', this._actions, 'Use Normal speakers mode.');
            normalSpeaker.textContent = 'Normal speakers';
            this._generateActionLine('Disable audio', !this._inspector.scene.audioEnabled, (b: boolean) => { this._inspector.scene.audioEnabled = !b; }, 'Disable audio on the scene.');

            this._generateRadioAction([headphones, normalSpeaker]);
            if (this._inspector.scene.headphone) {
                headphones.classList.add('active');
            } else {
                normalSpeaker.classList.add('active');
            }
            headphones.addEventListener('click', () => { this._inspector.scene.headphone = true; });
            normalSpeaker.addEventListener('click', () => { this._inspector.scene.headphone = false; });

            // --------------------- Viewer ---------------------

            title = Helpers.CreateDiv('actions-title', this._actions, 'Viewer');
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
                            var viewer = new Debug.SkeletonViewer(mesh.skeleton, mesh, this._inspector.scene);
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
            }, 'Enable to see Skeletons on the scene : Debug.SkeletonViewer');
        }
    }

    /** Overrides super.dispose */
    public dispose() {
        this._detailsPanel.dispose();
    }

    /** generates a div which correspond to an option that can be activated/deactivated */
    private _generateActionLine(name: string, initValue: boolean, action: (b: boolean) => void, tooltip?: string) {
        let div = Helpers.CreateDiv('scene-actions', this._actions, tooltip);
        div.textContent = name;
        div.classList.add('action');
        if (initValue) {
            div.classList.add('active');
        }
        div.addEventListener('click', (e) => {
            div.classList.toggle('active');
            let isActivated = div.classList.contains('active');
            action(isActivated);
        });
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
        };
        for (let elem of arr) {
            elem.addEventListener('click', active.bind(this, elem));
        }
    }
}
