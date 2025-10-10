import * as React from "react";
import type { GlobalState } from "../globalState";
import { FooterButton } from "./footerButton";
import { DropUpButton } from "./dropUpButton";
import { EnvironmentTools } from "../tools/environmentTools";
import { FooterFileButton } from "./footerFileButton";
import { AnimationBar } from "./animationBar";
import type { Nullable } from "core/types";
import type { KHR_materials_variants } from "loaders/glTF/2.0/Extensions/KHR_materials_variants";
import type { Mesh } from "core/Meshes/mesh";

import "../scss/footer.scss";
import babylonIdentity from "../img/babylon-identity.svg";
import iconEdit from "../img/icon-edit.svg";
import iconOpen from "../img/icon-open.svg";
import iconIBL from "../img/icon-ibl.svg";
import iconCameras from "../img/icon-cameras.svg";
import iconVariants from "../img/icon-variants.svg";

interface IFooterProps {
    globalState: GlobalState;
}

interface IFooterState {
    isInspectorV2ModeEnabled: boolean;
}

/**
 * Footer
 */
export class Footer extends React.Component<IFooterProps, IFooterState> {
    private _cameraNames: string[] = [];

    public constructor(props: IFooterProps) {
        super(props);
        props.globalState.onSceneLoaded.add(() => {
            this._updateCameraNames();
            this.forceUpdate();
        });
        if (props.globalState.currentScene) {
            this._updateCameraNames();
            this.forceUpdate();
        }

        const searchParams = new URL(window.location.href).searchParams;
        this.state = {
            isInspectorV2ModeEnabled: searchParams.has("inspectorv2") && searchParams.get("inspectorv2") !== "false",
        };
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
        const camera = this.props.globalState.currentScene.cameras[index];

        if (camera) {
            if (this.props.globalState.currentScene.activeCamera) {
                this.props.globalState.currentScene.activeCamera.detachControl();
            }
            this.props.globalState.currentScene.activeCamera = camera;
            camera.attachControl();
        }
    }

    private _updateCameraNames(): void {
        if (!!this.props.globalState.currentScene && this.props.globalState.currentScene.cameras.length > 0) {
            this._cameraNames = this.props.globalState.currentScene.cameras.map((c) => c.name);
            this._cameraNames.push("default camera");
        }
    }

    private _getVariantsExtension(): Nullable<KHR_materials_variants> {
        return this.props.globalState?.glTFLoaderExtensions["KHR_materials_variants"] as KHR_materials_variants;
    }

    private _onToggleInspectorV2Mode() {
        const newState = !this.state.isInspectorV2ModeEnabled;
        this.setState({ isInspectorV2ModeEnabled: newState }, async () => {
            // Update URL after state is set
            const url = new URL(window.location.href);
            if (this.state.isInspectorV2ModeEnabled) {
                url.searchParams.set("inspectorv2", "true");
                localStorage.setItem("inspectorv2", "true");
            } else {
                url.searchParams.delete("inspectorv2");
                localStorage.removeItem("inspectorv2");
            }
            window.history.pushState({}, "", url.toString());
            await this.props.globalState.refreshDebugLayerAsync();
        });
    }

    override componentDidMount(): void {
        if (!this.state.isInspectorV2ModeEnabled && localStorage.getItem("inspectorv2") === "true") {
            if (new URL(window.location.href).searchParams.get("inspectorv2") === "false") {
                localStorage.removeItem("inspectorv2");
            } else {
                this._onToggleInspectorV2Mode();
            }
        }
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

        const hasCameras = this._cameraNames.length > 1;

        // Determine footer class based on which controls are present
        let footerClass = "footer";
        if (hasCameras && hasVariants) {
            footerClass += " longer";
        } else if (hasCameras || hasVariants) {
            footerClass += " long";
        }

        return (
            <div id="footer" className={footerClass}>
                <div className="footerLeft">
                    <img id="logoImg" src={babylonIdentity} />
                </div>
                <AnimationBar globalState={this.props.globalState} enabled={!!this.props.globalState.currentScene} />
                <div className={"footerRight"}>
                    {!!this.props.globalState.currentScene && (
                        <div className="inspector-toggle" onClick={() => this._onToggleInspectorV2Mode()}>
                            {this.state.isInspectorV2ModeEnabled ? "Back to Old Inspector" : "Try the New Inspector"}
                        </div>
                    )}
                    <FooterFileButton
                        globalState={this.props.globalState}
                        enabled={true}
                        icon={iconOpen}
                        onFilesPicked={(evt) => {
                            this.props.globalState.currentScene?.getEngine().clearInternalTexturesCache();
                            this.props.globalState.filesInput.loadFiles(evt);
                        }}
                        label="Open your scene from your hard drive (.babylon, .gltf, .glb, .obj)"
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
                        options={this._cameraNames}
                        activeEntry={() => this.props.globalState.currentScene?.activeCamera?.name || ""}
                        onOptionPicked={(option, index) => this.switchCamera(index)}
                        enabled={this._cameraNames.length > 1}
                        searchPlaceholder="Search camera"
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
