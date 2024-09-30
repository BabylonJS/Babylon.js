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

/**
 * Footer
 */
export class Footer extends React.Component<IFooterProps> {
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
    }

    showInspector() {
        if (this.props.globalState.currentScene) {
            if (this.props.globalState.currentScene.debugLayer.isVisible()) {
                this.props.globalState.hideDebugLayer();
            } else {
                this.props.globalState.showDebugLayer();
            }
        }
    }

    switchCamera(index: number) {
        const camera = this.props.globalState.currentScene!.cameras[index];

        if (camera) {
            if (this.props.globalState.currentScene!.activeCamera) {
                this.props.globalState.currentScene!.activeCamera.detachControl();
            }
            this.props.globalState.currentScene!.activeCamera = camera;
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
                        const lastPickedVariant = variantExtension!.getLastSelectedVariant(rootNode) || 0;
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

        return (
            <div id="footer" className={"footer" + (hasCameras || hasVariants ? " long" : hasCameras && hasVariants ? " longer" : "")}>
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
