import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { LineContainerComponent } from "../lineContainerComponent";
import { CheckBoxLineComponent } from "../lines/checkBoxLineComponent";
import { RenderGridPropertyGridComponent } from "./propertyGrids/renderGridPropertyGridComponent";

import { SkeletonViewer } from "babylonjs/Debug/skeletonViewer";
import { PhysicsViewer } from "babylonjs/Debug/physicsViewer";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";

export class DebugTabComponent extends PaneComponent {
    private _skeletonViewersEnabled = false;
    private _physicsViewersEnabled = false;
    private _skeletonViewers = new Array<SkeletonViewer>();

    constructor(props: IPaneComponentProps) {
        super(props);
    }

    componentWillMount() {
        const scene = this.props.scene;

        if (!scene) {
            return;
        }

        if (!scene.reservedDataStore) {
            scene.reservedDataStore = {};
        }

        for (var mesh of scene.meshes) {
            if (mesh.skeleton && mesh.reservedDataStore && mesh.reservedDataStore.skeletonViewer) {
                this._skeletonViewers.push(mesh.reservedDataStore.skeletonViewer);
            }
        }

        this._skeletonViewersEnabled = (this._skeletonViewers.length > 0);
        this._physicsViewersEnabled = scene.reservedDataStore.physicsViewer != null;
    }

    componentWillUnmount() {
    }

    switchSkeletonViewers() {
        this._skeletonViewersEnabled = !this._skeletonViewersEnabled;
        const scene = this.props.scene;

        if (this._skeletonViewersEnabled) {
            for (var mesh of scene.meshes) {
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
                    var viewer = new SkeletonViewer(mesh.skeleton, mesh, scene, true, 0);
                    viewer.isEnabled = true;
                    this._skeletonViewers.push(viewer);
                    if (!mesh.reservedDataStore) {
                        mesh.reservedDataStore = {};
                    }
                    mesh.reservedDataStore.skeletonViewer = viewer;
                }
            }
        } else {
            for (var index = 0; index < this._skeletonViewers.length; index++) {
                this._skeletonViewers[index].mesh.reservedDataStore.skeletonViewer = null;
                this._skeletonViewers[index].dispose();
            }
            this._skeletonViewers = [];

        }
    }

    switchPhysicsViewers() {
        this._physicsViewersEnabled = !this._physicsViewersEnabled;
        const scene = this.props.scene;

        if (this._physicsViewersEnabled) {
            const physicsViewer = new PhysicsViewer(scene);
            scene.reservedDataStore.physicsViewer = physicsViewer;

            for (var mesh of scene.meshes) {
                if (mesh.physicsImpostor) {
                    let debugMesh = physicsViewer.showImpostor(mesh.physicsImpostor);

                    if (debugMesh) {
                        debugMesh.reservedDataStore = { hidden: true };
                        debugMesh.material!.reservedDataStore = { hidden: true };
                    }
                }
            }
        } else {
            scene.reservedDataStore.physicsViewer.dispose();
            scene.reservedDataStore.physicsViewer = null;
        }
    }

    render() {
        const scene = this.props.scene;

        if (!scene) {
            return null;
        }

        return (
            <div className="pane">
                <LineContainerComponent globalState={this.props.globalState} title="HELPERS">
                    <RenderGridPropertyGridComponent globalState={this.props.globalState} scene={scene} />
                    <CheckBoxLineComponent label="Bones" isSelected={() => this._skeletonViewersEnabled} onSelect={() => this.switchSkeletonViewers()} />
                    <CheckBoxLineComponent label="Physics" isSelected={() => this._physicsViewersEnabled} onSelect={() => this.switchPhysicsViewers()} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="TEXTURE CHANNELS">
                    <CheckBoxLineComponent label="Diffuse" isSelected={() => StandardMaterial.DiffuseTextureEnabled} onSelect={() => StandardMaterial.DiffuseTextureEnabled = !StandardMaterial.DiffuseTextureEnabled} />
                    <CheckBoxLineComponent label="Ambient" isSelected={() => StandardMaterial.AmbientTextureEnabled} onSelect={() => StandardMaterial.AmbientTextureEnabled = !StandardMaterial.AmbientTextureEnabled} />
                    <CheckBoxLineComponent label="Specular" isSelected={() => StandardMaterial.SpecularTextureEnabled} onSelect={() => StandardMaterial.SpecularTextureEnabled = !StandardMaterial.SpecularTextureEnabled} />
                    <CheckBoxLineComponent label="Emissive" isSelected={() => StandardMaterial.EmissiveTextureEnabled} onSelect={() => StandardMaterial.EmissiveTextureEnabled = !StandardMaterial.EmissiveTextureEnabled} />
                    <CheckBoxLineComponent label="Bump" isSelected={() => StandardMaterial.BumpTextureEnabled} onSelect={() => StandardMaterial.BumpTextureEnabled = !StandardMaterial.BumpTextureEnabled} />
                    <CheckBoxLineComponent label="Opacity" isSelected={() => StandardMaterial.OpacityTextureEnabled} onSelect={() => StandardMaterial.OpacityTextureEnabled = !StandardMaterial.OpacityTextureEnabled} />
                    <CheckBoxLineComponent label="Reflection" isSelected={() => StandardMaterial.ReflectionTextureEnabled} onSelect={() => StandardMaterial.ReflectionTextureEnabled = !StandardMaterial.ReflectionTextureEnabled} />
                    <CheckBoxLineComponent label="Refraction" isSelected={() => StandardMaterial.RefractionTextureEnabled} onSelect={() => StandardMaterial.RefractionTextureEnabled = !StandardMaterial.RefractionTextureEnabled} />
                    <CheckBoxLineComponent label="ColorGrading" isSelected={() => StandardMaterial.ColorGradingTextureEnabled} onSelect={() => StandardMaterial.ColorGradingTextureEnabled = !StandardMaterial.ColorGradingTextureEnabled} />
                    <CheckBoxLineComponent label="Lightmap" isSelected={() => StandardMaterial.LightmapTextureEnabled} onSelect={() => StandardMaterial.LightmapTextureEnabled = !StandardMaterial.LightmapTextureEnabled} />
                    <CheckBoxLineComponent label="Fresnel" isSelected={() => StandardMaterial.FresnelEnabled} onSelect={() => StandardMaterial.FresnelEnabled = !StandardMaterial.FresnelEnabled} />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="FEATURES">
                    <CheckBoxLineComponent label="Animations" isSelected={() => scene.animationsEnabled} onSelect={() => scene.animationsEnabled = !scene.animationsEnabled} />
                    <CheckBoxLineComponent label="Collisions" isSelected={() => scene.collisionsEnabled} onSelect={() => scene.collisionsEnabled = !scene.collisionsEnabled} />
                    <CheckBoxLineComponent label="Fog" isSelected={() => scene.fogEnabled} onSelect={() => scene.fogEnabled = !scene.fogEnabled} />
                    <CheckBoxLineComponent label="Lens flares" isSelected={() => scene.lensFlaresEnabled} onSelect={() => scene.lensFlaresEnabled = !scene.lensFlaresEnabled} />
                    <CheckBoxLineComponent label="Lights" isSelected={() => scene.lightsEnabled} onSelect={() => scene.lightsEnabled = !scene.lightsEnabled} />
                    <CheckBoxLineComponent label="Particles" isSelected={() => scene.particlesEnabled} onSelect={() => scene.particlesEnabled = !scene.particlesEnabled} />
                    <CheckBoxLineComponent label="Post-processes" isSelected={() => scene.postProcessesEnabled} onSelect={() => scene.postProcessesEnabled = !scene.postProcessesEnabled} />
                    <CheckBoxLineComponent label="Probes" isSelected={() => scene.probesEnabled} onSelect={() => scene.probesEnabled = !scene.probesEnabled} />
                    <CheckBoxLineComponent label="Textures" isSelected={() => scene.texturesEnabled} onSelect={() => scene.texturesEnabled = !scene.texturesEnabled} />
                    <CheckBoxLineComponent label="Procedural textures" isSelected={() => scene.proceduralTexturesEnabled} onSelect={() => scene.proceduralTexturesEnabled = !scene.proceduralTexturesEnabled} />
                    <CheckBoxLineComponent label="Render targets" isSelected={() => scene.renderTargetsEnabled} onSelect={() => scene.renderTargetsEnabled = !scene.renderTargetsEnabled} />
                    <CheckBoxLineComponent label="Shadows" isSelected={() => scene.shadowsEnabled} onSelect={() => scene.shadowsEnabled = !scene.shadowsEnabled} />
                    <CheckBoxLineComponent label="Skeletons" isSelected={() => scene.skeletonsEnabled} onSelect={() => scene.skeletonsEnabled = !scene.skeletonsEnabled} />
                    <CheckBoxLineComponent label="Sprites" isSelected={() => scene.spritesEnabled} onSelect={() => scene.spritesEnabled = !scene.spritesEnabled} />
                </LineContainerComponent>
            </div>
        );
    }
}
