import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { GeneralPropertyTabComponent } from "./genericNodePropertyComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import type { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import { NodeRenderGraphBlockConnectionPointTypes } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";
import type { FrameGraphTextureCreationOptions } from "core/FrameGraph/frameGraphTypes";
import { Constants } from "core/Engines/constants";

const textureFormatList = [
    { label: "rgba", value: Constants.TEXTUREFORMAT_RGBA },
    { label: "r", value: Constants.TEXTUREFORMAT_RED },
    { label: "rg", value: Constants.TEXTUREFORMAT_RG },
    { label: "bgra", value: Constants.TEXTUREFORMAT_BGRA },
    { label: "rgba integer", value: Constants.TEXTUREFORMAT_RGBA_INTEGER },
    { label: "r integer", value: Constants.TEXTUREFORMAT_RED_INTEGER },
    { label: "rg Integer", value: Constants.TEXTUREFORMAT_RG_INTEGER },
];

const textureTypeList = [
    { label: "Unsigned Byte", value: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    { label: "Signed Byte", value: Constants.TEXTURETYPE_BYTE },
    { label: "Unsigned Short", value: Constants.TEXTURETYPE_UNSIGNED_SHORT },
    { label: "Short", value: Constants.TEXTURETYPE_SHORT },
    { label: "Unsigned Integer", value: Constants.TEXTURETYPE_UNSIGNED_INTEGER },
    { label: "Integer", value: Constants.TEXTURETYPE_INT },
    { label: "Float", value: Constants.TEXTURETYPE_FLOAT },
    { label: "Half Float", value: Constants.TEXTURETYPE_HALF_FLOAT },
];

const textureDepthStencilFormatList = [
    { label: "Depth 24/Stencil 8", value: Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 },
    { label: "Depth 24 Unorm/Stencil 8", value: Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 },
    { label: "Depth 32 float/Stencil 8", value: Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 },
    { label: "Depth 16", value: Constants.TEXTUREFORMAT_DEPTH16 },
    { label: "Depth 24", value: Constants.TEXTUREFORMAT_DEPTH24 },
    { label: "Depth 32 float", value: Constants.TEXTUREFORMAT_DEPTH32_FLOAT },
];

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
                const creationOptions = inputBlock.creationOptions as FrameGraphTextureCreationOptions;
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
                                <OptionsLine
                                    label="Format"
                                    options={textureFormatList}
                                    target={creationOptions.options}
                                    propertyName="format"
                                    onSelect={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <OptionsLine
                                    label="Type"
                                    options={textureTypeList}
                                    target={creationOptions.options}
                                    propertyName="type"
                                    onSelect={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
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
                                    label="Use sRGB buffer"
                                    target={creationOptions.options}
                                    propertyName="useSRGBBuffer"
                                    onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                            </>
                        )}
                    </>
                );
            }
            case NodeRenderGraphBlockConnectionPointTypes.TextureDepthStencilAttachment: {
                const creationOptions = inputBlock.creationOptions as FrameGraphTextureCreationOptions;
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
                                <OptionsLine
                                    label="Format"
                                    options={textureDepthStencilFormatList}
                                    target={creationOptions.options}
                                    propertyName="format"
                                    onSelect={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
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
                                    label="Generate depth buffer"
                                    target={creationOptions.options}
                                    propertyName="generateDepthBuffer"
                                    onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                                <CheckBoxLineComponent
                                    label="Generate stencil buffer"
                                    target={creationOptions.options}
                                    propertyName="generateStencilBuffer"
                                    onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                                />
                            </>
                        )}
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
