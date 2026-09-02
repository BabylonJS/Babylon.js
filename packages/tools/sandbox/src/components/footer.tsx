import * as React from "react";
import { type GlobalState, type SandboxSceneLoadedInfo, type SandboxSceneLoadKind } from "../globalState";
import { FooterButton } from "./footerButton";
import { DropUpButton } from "./dropUpButton";
import { EnvironmentTools } from "../tools/environmentTools";
import { FooterFileButton } from "./footerFileButton";
import { AnimationBar } from "./animationBar";
import { type Nullable } from "core/types";
import { type KHR_materials_variants } from "loaders/glTF/2.0/Extensions/KHR_materials_variants";
import { type Mesh } from "core/Meshes/mesh";
import { type Camera } from "core/Cameras/camera";
import { type Observer } from "core/Misc/observable";
import { DefaultCameraPresetOption } from "../tools/cameraPresetManager";

import "../scss/footer.scss";
import babylonIdentity from "../img/babylon-identity.svg";
import iconEdit from "../img/icon-edit.svg";
import iconOpen from "../img/icon-open.svg";
import iconIBL from "../img/icon-ibl.svg";
import iconCameras from "../img/icon-cameras.svg";
import iconCameraPreset from "../img/icon-camera-preset.svg";
import iconVariants from "../img/icon-variants.svg";

interface IFooterProps {
    globalState: GlobalState;
}

interface IFooterState {}

/**
 * Footer
 */
export class Footer extends React.Component<IFooterProps, IFooterState> {
    private _cameras: Camera[] = [];
    private _sceneHadCameras = false;
    private _sceneLoadKind: SandboxSceneLoadKind = "scene";
    private readonly _onSceneLoadedObserver: Nullable<Observer<SandboxSceneLoadedInfo>>;
    private readonly _onCameraChangedObserver: Nullable<Observer<Camera>>;
    private readonly _onCameraPresetChangedObserver: Nullable<Observer<void>>;

    public constructor(props: IFooterProps) {
        super(props);
        this._onSceneLoadedObserver = props.globalState.onSceneLoaded.add((info) => {
            this._sceneHadCameras = info.scene.cameras.length > 0;
            this._sceneLoadKind = info.loadKind;
            this._updateCameras(info.scene);
            this.forceUpdate();
        });
        this._onCameraChangedObserver = props.globalState.onCameraChanged.add(() => {
            this._updateCameras();
            this.forceUpdate();
        });
        this._onCameraPresetChangedObserver = props.globalState.cameraPresetManager.onChanged.add(() => {
            this.forceUpdate();
        });
        if (props.globalState.currentScene) {
            this._sceneHadCameras = props.globalState.currentSceneHadCameras;
            this._sceneLoadKind = props.globalState.currentSceneLoadKind;
            this._updateCameras(props.globalState.currentScene);
        }
    }

    override componentWillUnmount() {
        this._onSceneLoadedObserver?.remove();
        this._onCameraChangedObserver?.remove();
        this._onCameraPresetChangedObserver?.remove();
    }

    showInspector() {
        if (this.props.globalState.currentScene) {
            if (this.props.globalState.isDebugLayerEnabled) {
                this.props.globalState.hideDebugLayer();
            } else {
                this.props.globalState.showDebugLayer();
            }
        }
    }

    switchCamera(index: number) {
        const scene = this.props.globalState.currentScene;
        const camera = this._cameras[index];

        if (scene && camera) {
            const activeCamera = this.props.globalState.cameraPresetManager.deactivatePreset(scene, camera);
            if (activeCamera) {
                this.props.globalState.onCameraChanged.notifyObservers(activeCamera);
            }
        }
    }

    switchCameraPreset(index: number) {
        const scene = this.props.globalState.currentScene;
        if (!scene) {
            return;
        }

        if (index === 0) {
            const camera = this.props.globalState.cameraPresetManager.deactivatePreset(scene);
            if (camera) {
                this.props.globalState.onCameraChanged.notifyObservers(camera);
            }
            return;
        }

        const preset = this.props.globalState.cameraPresetManager.presets[index - 1];
        if (preset && this._sceneLoadKind === "scene") {
            const camera = this.props.globalState.cameraPresetManager.activatePreset(preset.id, scene);
            if (camera) {
                this.props.globalState.onCameraChanged.notifyObservers(camera);
            }
        }
    }

    private _updateCameras(scene = this.props.globalState.currentScene): void {
        this._cameras = scene ? scene.cameras.filter((camera) => !this.props.globalState.cameraPresetManager.isPresetCamera(camera)) : [];
    }

    private _getVariantsExtension(): Nullable<KHR_materials_variants> {
        return this.props.globalState?.glTFLoaderExtensions["KHR_materials_variants"] as KHR_materials_variants;
    }

    override render() {
        let variantNames: string[] = [];
        let hasVariants = false;
        let activeEntry = () => "";
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let switchVariant = (name: string, index: number) => {};
        const variantExtension = this._getVariantsExtension();
        if (variantExtension && this.props.globalState.currentScene) {
            const scene = this.props.globalState.currentScene;
            const rootNode = scene.getMeshByName("__root__") as Mesh;

            if (rootNode) {
                const variants: string[] = variantExtension.getAvailableVariants(rootNode);

                if (variants && variants.length > 0) {
                    hasVariants = true;

                    variants.splice(0, 0, "Original");
                    variantNames = variants;

                    activeEntry = () => {
                        const lastPickedVariant = variantExtension.getLastSelectedVariant(rootNode) || 0;
                        if (lastPickedVariant && Object.prototype.toString.call(lastPickedVariant) === "[object String]") {
                            return lastPickedVariant as string;
                        }

                        return variantNames[0];
                    };

                    switchVariant = (name, index) => {
                        if (index === 0) {
                            variantExtension.reset(rootNode);
                        } else {
                            variantExtension.selectVariant(rootNode, name);
                        }
                    };
                }
            }
        }

        const cameraNames = this._cameras.map((camera) => camera.name);
        const cameraPresets = this.props.globalState.cameraPresetManager.presets;
        const cameraPresetNames = [DefaultCameraPresetOption, ...cameraPresets.map((preset) => preset.name)];
        // A scene that arrived with one embedded camera historically showed this control; a camera-less scene with one generated camera did not.
        const hasCameras = cameraNames.length > 1 || (cameraNames.length === 1 && this._sceneHadCameras);
        const hasCameraPresets = !!this.props.globalState.currentScene && cameraPresets.length > 0 && this._sceneLoadKind === "scene";

        // Determine footer class based on which controls are present
        let footerClass = "footer";
        const optionalControlCount = Number(hasCameras) + Number(hasCameraPresets) + Number(hasVariants);
        if (optionalControlCount === 3) {
            footerClass += " longest";
        } else if (optionalControlCount === 2) {
            footerClass += " longer";
        } else if (optionalControlCount === 1) {
            footerClass += " long";
        }

        return (
            <div id="footer" className={footerClass}>
                <div className="footerLeft">
                    <img id="logoImg" src={babylonIdentity} />
                </div>
                <AnimationBar globalState={this.props.globalState} enabled={!!this.props.globalState.currentScene} />
                <div className={"footerRight"}>
                    <FooterFileButton
                        globalState={this.props.globalState}
                        enabled={true}
                        icon={iconOpen}
                        onFilesPicked={(evt) => {
                            this.props.globalState.currentScene?.getEngine().clearInternalTexturesCache();
                            this.props.globalState.filesInput.loadFiles(evt);
                        }}
                        label="Open your scene from your hard drive (.babylon, .babylonproj, .gltf, .glb, .fbx, .obj)"
                    />
                    <DropUpButton
                        globalState={this.props.globalState}
                        icon={iconIBL}
                        label="Select environment"
                        options={EnvironmentTools.SkyboxesNames}
                        activeEntry={() => EnvironmentTools.GetActiveSkyboxName()}
                        onOptionPicked={(option) => this.props.globalState.onEnvironmentChanged.notifyObservers(option)}
                        enabled={!!this.props.globalState.currentScene}
                        searchPlaceholder="Search environment"
                    />
                    <FooterButton
                        globalState={this.props.globalState}
                        icon={iconEdit}
                        label="Display inspector"
                        onClick={() => this.showInspector()}
                        enabled={!!this.props.globalState.currentScene}
                    />
                    <DropUpButton
                        globalState={this.props.globalState}
                        icon={iconCameras}
                        label="Select camera"
                        options={cameraNames}
                        activeEntry={() => this.props.globalState.currentScene?.activeCamera?.name || ""}
                        onOptionPicked={(option, index) => this.switchCamera(index)}
                        enabled={hasCameras}
                        searchPlaceholder="Search camera"
                    />
                    <DropUpButton
                        globalState={this.props.globalState}
                        icon={iconCameraPreset}
                        label="Select camera preset"
                        options={cameraPresetNames}
                        activeEntry={() => {
                            const activeCamera = this.props.globalState.currentScene?.activeCamera;
                            return activeCamera && this.props.globalState.cameraPresetManager.isPresetCamera(activeCamera)
                                ? (this.props.globalState.cameraPresetManager.activePreset?.name ?? DefaultCameraPresetOption)
                                : DefaultCameraPresetOption;
                        }}
                        onOptionPicked={(option, index) => this.switchCameraPreset(index)}
                        enabled={hasCameraPresets}
                        searchPlaceholder="Search camera preset"
                        dynamicWidth={true}
                    />
                    <DropUpButton
                        globalState={this.props.globalState}
                        icon={iconVariants}
                        label="Select variant"
                        options={variantNames}
                        activeEntry={() => activeEntry()}
                        onOptionPicked={(option, index) => switchVariant(option, index)}
                        enabled={hasVariants}
                        searchPlaceholder="Search variant"
                    />
                </div>
            </div>
        );
    }
}
