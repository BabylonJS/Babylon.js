import * as React from "react";
import { PaneComponent, IPaneComponentProps } from "../paneComponent";
import { LineContainerComponent } from "../lineContainerComponent";
import { CheckBoxLineComponent } from "../lines/checkBoxLineComponent";
import { RenderGridPropertyGridComponent } from "./propertyGrids/renderGridPropertyGridComponent";

export class DebugTabComponent extends PaneComponent {
    private _skeletonViewersEnabled = false;
    private _physicsViewersEnabled = false;
    private _skeletonViewers = new Array<BABYLON.Debug.SkeletonViewer>();

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
                    var viewer = new BABYLON.Debug.SkeletonViewer(mesh.skeleton, mesh, scene, true, 0);
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
            const physicsViewer = new BABYLON.Debug.PhysicsViewer(scene);
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
                <LineContainerComponent title="HELPERS">
                    <RenderGridPropertyGridComponent scene={scene} />
                    <CheckBoxLineComponent label="Bones" isSelected={() => this._skeletonViewersEnabled} onSelect={() => this.switchSkeletonViewers()} />
                    <CheckBoxLineComponent label="Physics" isSelected={() => this._physicsViewersEnabled} onSelect={() => this.switchPhysicsViewers()} />
                </LineContainerComponent>
                <LineContainerComponent title="TEXTURE CHANNELS">
                    <CheckBoxLineComponent label="Diffuse" isSelected={() => BABYLON.StandardMaterial.DiffuseTextureEnabled} onSelect={() => BABYLON.StandardMaterial.DiffuseTextureEnabled = !BABYLON.StandardMaterial.DiffuseTextureEnabled} />
                    <CheckBoxLineComponent label="Ambient" isSelected={() => BABYLON.StandardMaterial.AmbientTextureEnabled} onSelect={() => BABYLON.StandardMaterial.AmbientTextureEnabled = !BABYLON.StandardMaterial.AmbientTextureEnabled} />
                    <CheckBoxLineComponent label="Specular" isSelected={() => BABYLON.StandardMaterial.SpecularTextureEnabled} onSelect={() => BABYLON.StandardMaterial.SpecularTextureEnabled = !BABYLON.StandardMaterial.SpecularTextureEnabled} />
                    <CheckBoxLineComponent label="Emissive" isSelected={() => BABYLON.StandardMaterial.EmissiveTextureEnabled} onSelect={() => BABYLON.StandardMaterial.EmissiveTextureEnabled = !BABYLON.StandardMaterial.EmissiveTextureEnabled} />
                    <CheckBoxLineComponent label="Bump" isSelected={() => BABYLON.StandardMaterial.BumpTextureEnabled} onSelect={() => BABYLON.StandardMaterial.BumpTextureEnabled = !BABYLON.StandardMaterial.BumpTextureEnabled} />
                    <CheckBoxLineComponent label="Opacity" isSelected={() => BABYLON.StandardMaterial.OpacityTextureEnabled} onSelect={() => BABYLON.StandardMaterial.OpacityTextureEnabled = !BABYLON.StandardMaterial.OpacityTextureEnabled} />
                    <CheckBoxLineComponent label="Reflection" isSelected={() => BABYLON.StandardMaterial.ReflectionTextureEnabled} onSelect={() => BABYLON.StandardMaterial.ReflectionTextureEnabled = !BABYLON.StandardMaterial.ReflectionTextureEnabled} />
                    <CheckBoxLineComponent label="Refraction" isSelected={() => BABYLON.StandardMaterial.RefractionTextureEnabled} onSelect={() => BABYLON.StandardMaterial.RefractionTextureEnabled = !BABYLON.StandardMaterial.RefractionTextureEnabled} />
                    <CheckBoxLineComponent label="ColorGrading" isSelected={() => BABYLON.StandardMaterial.ColorGradingTextureEnabled} onSelect={() => BABYLON.StandardMaterial.ColorGradingTextureEnabled = !BABYLON.StandardMaterial.ColorGradingTextureEnabled} />
                    <CheckBoxLineComponent label="Lightmap" isSelected={() => BABYLON.StandardMaterial.LightmapTextureEnabled} onSelect={() => BABYLON.StandardMaterial.LightmapTextureEnabled = !BABYLON.StandardMaterial.LightmapTextureEnabled} />
                    <CheckBoxLineComponent label="Fresnel" isSelected={() => BABYLON.StandardMaterial.FresnelEnabled} onSelect={() => BABYLON.StandardMaterial.FresnelEnabled = !BABYLON.StandardMaterial.FresnelEnabled} />
                </LineContainerComponent>
                <LineContainerComponent title="FEATURES">
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
