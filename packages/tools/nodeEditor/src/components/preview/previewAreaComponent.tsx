import * as React from "react";
import type { GlobalState } from "../../globalState";
import { DataStorage } from "core/Misc/dataStorage";
import type { Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";

import doubleSided from "./svgs/doubleSided.svg";
import depthPass from "./svgs/depthPass.svg";
import omni from "./svgs/omni.svg";
import directionalRight from "./svgs/directionalRight.svg";
import directionalLeft from "./svgs/directionalLeft.svg";
import background from "./svgs/icon-ibl.svg";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { blendModeOptions } from "shared-ui-components/constToOptionsMaps";

interface IPreviewAreaComponentProps {
    globalState: GlobalState;
}

export class PreviewAreaComponent extends React.Component<IPreviewAreaComponentProps, { isLoading: boolean }> {
    private _onIsLoadingChangedObserver: Nullable<Observer<boolean>>;
    private _onResetRequiredObserver: Nullable<Observer<boolean>>;
    private _consoleRef: React.RefObject<HTMLDivElement>;

    constructor(props: IPreviewAreaComponentProps) {
        super(props);
        this.state = { isLoading: true };
        this._consoleRef = React.createRef();

        this._onIsLoadingChangedObserver = this.props.globalState.onIsLoadingChanged.add((state) => this.setState({ isLoading: state }));

        this._onResetRequiredObserver = this.props.globalState.onResetRequiredObservable.add(() => {
            this.forceUpdate();
        });
    }

    override componentWillUnmount() {
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

    async processPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        if (!e.ctrlKey || !this.props.globalState.pickingTexture) {
            this._consoleRef.current?.classList.add("hidden");
            return;
        }

        const data = (await this.props.globalState.pickingTexture.readPixels()!) as Float32Array;
        const size = this.props.globalState.pickingTexture.getSize();
        const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

        const x = (((e.clientX - rect.left) / rect.width) * size.width) | 0;
        const y = (size.height - 1 - ((e.clientY - rect.top) / rect.height) * size.height) | 0;

        if ((x > 0 && y > 0 && x < size.width && y < size.height, rect.top)) {
            const pixelLocation = (y * size.width + x) * 4;

            this._consoleRef.current!.innerText = `R:${data[pixelLocation].toFixed(2)}, G:${data[pixelLocation + 1].toFixed(2)}, B:${data[pixelLocation + 2].toFixed(2)}, A:${data[pixelLocation + 3].toFixed(2)}`;
            this._consoleRef.current!.classList.remove("hidden");
        }

        e.preventDefault();
    }

    onKeyUp(e: React.KeyboardEvent<HTMLCanvasElement>) {
        this._consoleRef.current?.classList.add("hidden");
        e.preventDefault();
    }

    override render() {
        return (
            <>
                <div id="preview">
                    <canvas
                        onPointerOver={this._onPointerOverCanvas}
                        onPointerOut={this._onPointerOutCanvas}
                        id="preview-canvas"
                        onKeyUp={(evt) => this.onKeyUp(evt)}
                        onPointerMove={(evt) => this.processPointerMove(evt)}
                    />
                    {<div className={"waitPanel" + (this.state.isLoading ? "" : " hidden")}>Please wait, loading...</div>}
                    <div id="preview-color-picker" className="hidden" ref={this._consoleRef} />
                </div>
                {this.props.globalState.mode === NodeMaterialModes.Particle && (
                    <div id="preview-config-bar" className="extended">
                        <OptionsLine
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
                            <div
                                title="Turn on/off environment"
                                onClick={() => {
                                    this.props.globalState.backgroundHDR = !this.props.globalState.backgroundHDR;
                                    DataStorage.WriteBoolean("backgroundHDR", this.props.globalState.backgroundHDR);
                                    this.props.globalState.onBackgroundHDRUpdated.notifyObservers();
                                    this.forceUpdate();
                                }}
                                className={"button " + (this.props.globalState.backgroundHDR ? " selected" : "")}
                            >
                                <img src={background} alt="" />
                            </div>
                        </div>
                    </>
                )}
            </>
        );
    }
}
