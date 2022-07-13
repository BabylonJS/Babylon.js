import * as React from "react";
import type { GlobalState } from "../../globalState";
import { DataStorage } from "core/Misc/dataStorage";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import { ParticleSystem } from "core/Particles/particleSystem";

import doubleSided from "./svgs/doubleSided.svg";
import depthPass from "./svgs/depthPass.svg";
import omni from "./svgs/omni.svg";
import directionalRight from "./svgs/directionalRight.svg";
import directionalLeft from "./svgs/directionalLeft.svg";
import { OptionsLineComponent } from "shared-ui-components/lines/optionsLineComponent";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
    width: number;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, { isLoading: boolean }> {
    private _onIsLoadingChangedObserver: Nullable<Observer<boolean>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;

    constructor(props: IPreviewAreaComponentProps) {
        super(props);
        this.state = { isLoading: true };

        this._onIsLoadingChangedObserver = this.props.globalState.onIsLoadingChanged.add((state) => this.setState({ isLoading: state }));

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    componentWillUnmount() {
        this.props.globalState.onIsLoadingChanged.remove(this._onIsLoadingChangedObserver);
        this.props.globalState.onResetRequiredObservable.remove(this._onResetRequiredObserver);
    }

    changeBackFaceCulling(value: boolean) {
        this.props.globalState.backFaceCulling = value;
        DataStorage.WriteBoolean("BackFaceCulling", value);
        this.props.globalState.onBackFaceCullingChanged.notifyObservers();
        this.forceUpdate();
    }

    changeDepthPrePass(value: boolean) {
        this.props.globalState.depthPrePass = value;
        DataStorage.WriteBoolean("DepthPrePass", value);
        this.props.globalState.onDepthPrePassChanged.notifyObservers();
        this.forceUpdate();
    }

    _onPointerOverCanvas = () => {
        this.props.globalState.pointerOverCanvas = true;
    };

    _onPointerOutCanvas = () => {
        this.props.globalState.pointerOverCanvas = false;
    };

    changeParticleSystemBlendMode(newOne: number) {
        if (this.props.globalState.particleSystemBlendMode === newOne) {
            return;
        }

        this.props.globalState.particleSystemBlendMode = newOne;
        this.props.globalState.stateManager.onUpdateRequiredObservable.notifyObservers(null);

        DataStorage.WriteNumber("DefaultParticleSystemBlendMode", newOne);

        this.forceUpdate();
    }

    render() {
        const blendModeOptions = [
            { label: "Add", value: ParticleSystem.BLENDMODE_ADD },
            { label: "Multiply", value: ParticleSystem.BLENDMODE_MULTIPLY },
            { label: "Multiply Add", value: ParticleSystem.BLENDMODE_MULTIPLYADD },
            { label: "OneOne", value: ParticleSystem.BLENDMODE_ONEONE },
            { label: "Standard", value: ParticleSystem.BLENDMODE_STANDARD },
        ];

        return (
            <>
                <div id="preview" style={{ height: this.props.width + "px" }}>
                    <canvas onPointerOver={this._onPointerOverCanvas} onPointerOut={this._onPointerOutCanvas} id="preview-canvas" />
                    {<div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div>}
                </div>
                {this.props.globalState.mode === NodeMaterialModes.Particle && (
                    <div id="preview-config-bar" className="extended">
                        <OptionsLineComponent
                            label="Blend mode"
                            options={blendModeOptions}
                            target={this.props.globalState}
                            propertyName="particleSystemBlendMode"
                            noDirectUpdate={true}
                            onSelect={(value: any) => {
                                this.changeParticleSystemBlendMode(value);
                            }}
                        />
                    </div>
                )}
                {this.props.globalState.mode === NodeMaterialModes.Material && (
                    <>
                        <div id="preview-config-bar">
                            <div
                                title="Render without back face culling"
                                onClick={() => this.changeBackFaceCulling(!this.props.globalState.backFaceCulling)}
                                className={"button back-face" + (!this.props.globalState.backFaceCulling ? " selected" : "")}
                            >
                                <img src={doubleSided} alt="" />
                            </div>
                            <div
                                title="Render with depth pre-pass"
                                onClick={() => this.changeDepthPrePass(!this.props.globalState.depthPrePass)}
                                className={"button depth-pass" + (this.props.globalState.depthPrePass ? " selected" : "")}
                            >
                                <img src={depthPass} alt="" />
                            </div>
                            <div
                                title="Turn on/off hemispheric light"
                                onClick={() => {
                                    this.props.globalState.hemisphericLight = !this.props.globalState.hemisphericLight;
                                    DataStorage.WriteBoolean("HemisphericLight", this.props.globalState.hemisphericLight);
                                    this.props.globalState.onLightUpdated.notifyObservers();
                                    this.forceUpdate();
                                }}
                                className={"button hemispheric-light" + (this.props.globalState.hemisphericLight ? " selected" : "")}
                            >
                                <img src={omni} alt="" />
                            </div>
                            <div
                                title="Turn on/off direction light #1"
                                onClick={() => {
                                    this.props.globalState.directionalLight1 = !this.props.globalState.directionalLight1;
                                    DataStorage.WriteBoolean("DirectionalLight1", this.props.globalState.directionalLight1);
                                    this.props.globalState.onLightUpdated.notifyObservers();
                                    this.forceUpdate();
                                }}
                                className={"button direction-light-1" + (this.props.globalState.directionalLight1 ? " selected" : "")}
                            >
                                <img src={directionalRight} alt="" />
                            </div>
                            <div
                                title="Turn on/off direction light #0"
                                onClick={() => {
                                    this.props.globalState.directionalLight0 = !this.props.globalState.directionalLight0;
                                    DataStorage.WriteBoolean("DirectionalLight0", this.props.globalState.directionalLight0);
                                    this.props.globalState.onLightUpdated.notifyObservers();
                                    this.forceUpdate();
                                }}
                                className={"button direction-light-0" + (this.props.globalState.directionalLight0 ? " selected" : "")}
                            >
                                <img src={directionalLeft} alt="" />
                            </div>
                        </div>
                    </>
                )}
            </>
        );
    }
}
