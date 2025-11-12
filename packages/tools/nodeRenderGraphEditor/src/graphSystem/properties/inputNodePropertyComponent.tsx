import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { GeneralPropertyTabComponent, textureDepthStencilFormatList, textureFormatList, textureTypeList } from "./genericNodePropertyComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import type { FrameGraphObjectList } from "core/FrameGraph/frameGraphObjectList";
import type { Camera } from "core/Cameras/camera";
import type { IShadowLight } from "core/Lights/shadowLight";
import { Constants } from "core/Engines/constants";

export class InputPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    private _onValueChangedObserver: Nullable<Observer<NodeRenderGraphInputBlock>>;

    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override componentDidMount() {
        const inputBlock = this.props.nodeData.data as NodeRenderGraphInputBlock;
        this._onValueChangedObserver = inputBlock.onValueChangedObservable.add(() => {
            this.forceUpdate();
            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(inputBlock);
        });
    }

    override componentWillUnmount() {
        const inputBlock = this.props.nodeData.data as NodeRenderGraphInputBlock;
        if (this._onValueChangedObserver) {
            inputBlock.onValueChangedObservable.remove(this._onValueChangedObserver);
            this._onValueChangedObserver = null;
        }
    }

    renderValue(_globalState: GlobalState) {
        const inputBlock = this.props.nodeData.data as NodeRenderGraphInputBlock;
        switch (inputBlock.type) {
            case NodeRenderGraphBlockConnectionPointTypes.Texture: {
                const isExternal = inputBlock.isExternal;
                const creationOptions = inputBlock.creationOptions;
                if (!isExternal && !inputBlock.creationOptions) {
                    inputBlock.setDefaultValue();
                }
                if (!creationOptions.options.creationFlags) {
                    creationOptions.options.creationFlags = [0];
                }
                return (
                    <>
                        <CheckBoxLineComponent
                            label="Is external"
                            target={inputBlock}
                            propertyName="isExternal"
                            onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                        ></CheckBoxLineComponent>
                        {!isExternal && (
                            <>
                                <CheckBoxLineComponent
                                    label="Size is in percentage"
                                    target={creationOptions}
                                    propertyName="sizeIsPercentage"
                                    onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <FloatLineComponent
                                    lockObject={this.props.stateManager.lockObject}
                                    digits={0}
                                    step={"1"}
                                    isInteger={true}
                                    label="Width"
                                    propertyName="width"
                                    target={creationOptions.size}
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <FloatLineComponent
                                    lockObject={this.props.stateManager.lockObject}
                                    digits={0}
                                    step={"1"}
                                    isInteger={true}
                                    label="Height"
                                    propertyName="height"
                                    target={creationOptions.size}
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                {creationOptions.options.formats && (
                                    <OptionsLine
                                        label="Format"
                                        options={textureFormatList}
                                        target={creationOptions}
                                        propertyName=""
                                        onSelect={(value: number | string) => {
                                            creationOptions.options.formats![0] = value as number;
                                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                        }}
                                        extractValue={() => creationOptions.options.formats![0]}
                                        noDirectUpdate={true}
                                    />
                                )}
                                {creationOptions.options.types && (
                                    <OptionsLine
                                        label="Type"
                                        options={textureTypeList}
                                        target={creationOptions}
                                        propertyName=""
                                        onSelect={(value: number | string) => {
                                            creationOptions.options.types![0] = value as number;
                                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                        }}
                                        extractValue={() => creationOptions.options.types![0]}
                                        noDirectUpdate={true}
                                    />
                                )}
                                <FloatLineComponent
                                    lockObject={this.props.stateManager.lockObject}
                                    digits={0}
                                    step={"1"}
                                    isInteger={true}
                                    label="Samples"
                                    propertyName="samples"
                                    target={creationOptions.options}
                                    min={1}
                                    max={8}
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <CheckBoxLineComponent
                                    label="Create as storage texture"
                                    target={creationOptions}
                                    propertyName=""
                                    onSelect={(value: boolean) => {
                                        creationOptions.options.creationFlags![0] = value ? Constants.TEXTURE_CREATIONFLAG_STORAGE : 0;
                                        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                    }}
                                    isSelected={() => creationOptions.options.creationFlags![0] === Constants.TEXTURE_CREATIONFLAG_STORAGE}
                                />
                                <CheckBoxLineComponent
                                    label="Create mipmaps"
                                    target={creationOptions.options}
                                    propertyName="createMipMaps"
                                    onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <CheckBoxLineComponent
                                    label="Use sRGB buffer"
                                    target={creationOptions}
                                    propertyName=""
                                    onSelect={(value: boolean) => {
                                        creationOptions.options.useSRGBBuffers![0] = value;
                                        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                    }}
                                    isSelected={() => creationOptions.options.useSRGBBuffers![0]}
                                />
                                <CheckBoxLineComponent
                                    label="History texture"
                                    target={creationOptions}
                                    propertyName=""
                                    onSelect={(value: boolean) => {
                                        creationOptions.isHistoryTexture = value;
                                        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                    }}
                                    isSelected={() => creationOptions.isHistoryTexture!}
                                />
                            </>
                        )}
                    </>
                );
            }
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment: {
                const creationOptions = inputBlock.creationOptions;
                const isExternal = inputBlock.isExternal;
                if (!isExternal && !inputBlock.creationOptions) {
                    inputBlock.setDefaultValue();
                }
                return (
                    <>
                        <CheckBoxLineComponent
                            label="Is external"
                            target={inputBlock}
                            propertyName="isExternal"
                            onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                        ></CheckBoxLineComponent>
                        {!isExternal && (
                            <>
                                <CheckBoxLineComponent
                                    label="Size is in percentage"
                                    target={creationOptions}
                                    propertyName="sizeIsPercentage"
                                    onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <FloatLineComponent
                                    lockObject={this.props.stateManager.lockObject}
                                    digits={0}
                                    step={"1"}
                                    isInteger={true}
                                    label="Width"
                                    propertyName="width"
                                    target={creationOptions.size}
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <FloatLineComponent
                                    lockObject={this.props.stateManager.lockObject}
                                    digits={0}
                                    step={"1"}
                                    isInteger={true}
                                    label="Height"
                                    propertyName="height"
                                    target={creationOptions.size}
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                {creationOptions.options.formats && (
                                    <OptionsLine
                                        label="Format"
                                        options={textureDepthStencilFormatList}
                                        target={creationOptions}
                                        propertyName=""
                                        onSelect={(value: number | string) => {
                                            creationOptions.options.formats![0] = value as number;
                                            this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                                        }}
                                        extractValue={() => creationOptions.options.formats![0]}
                                        noDirectUpdate={true}
                                    />
                                )}
                                <FloatLineComponent
                                    lockObject={this.props.stateManager.lockObject}
                                    digits={0}
                                    step={"1"}
                                    isInteger={true}
                                    label="Samples"
                                    propertyName="samples"
                                    target={creationOptions.options}
                                    min={1}
                                    max={8}
                                    onChange={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                            </>
                        )}
                    </>
                );
            }
            case NodeRenderGraphBlockConnectionPointTypes.ObjectList: {
                const objectList = inputBlock.value as FrameGraphObjectList;
                return (
                    <>
                        <TextLineComponent label="Number of meshes" value={objectList.meshes ? "" + objectList.meshes.length : "Unknown (meshes from the scene)"} />
                        <TextLineComponent
                            label="Number of particle systems"
                            value={objectList.particleSystems ? "" + objectList.particleSystems.length : "Unknown (particle systems from the scene)"}
                        />
                    </>
                );
            }
            case NodeRenderGraphBlockConnectionPointTypes.Camera: {
                const camera = inputBlock.value as Camera;
                return (
                    <>
                        <TextLineComponent label="Name" value={camera?.name ?? ""} />
                        <TextLineComponent label="Type" value={camera?.getClassName() ?? ""} />
                    </>
                );
            }
            case NodeRenderGraphBlockConnectionPointTypes.ShadowLight: {
                const shadowLight = inputBlock.value as IShadowLight;
                return (
                    <>
                        <TextLineComponent label="Name" value={shadowLight?.name ?? ""} />
                        <TextLineComponent label="Type" value={shadowLight?.getClassName() ?? ""} />
                    </>
                );
            }
        }

        return null;
    }

    setDefaultValue() {
        const inputBlock = this.props.nodeData.data as NodeRenderGraphInputBlock;
        inputBlock.setDefaultValue();
    }

    override render() {
        const inputBlock = this.props.nodeData.data as NodeRenderGraphInputBlock;

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    {this.renderValue(this.props.stateManager.data as GlobalState)}
                    <CheckBoxLineComponent label="Visible on frame" target={inputBlock} propertyName={"visibleOnFrame"}></CheckBoxLineComponent>
                </LineContainerComponent>
            </div>
        );
    }
}
