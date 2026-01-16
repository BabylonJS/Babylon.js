import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { Vector2LineComponent } from "shared-ui-components/lines/vector2LineComponent";
import { Vector3LineComponent } from "shared-ui-components/lines/vector3LineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { MatrixLineComponent } from "shared-ui-components/lines/matrixLineComponent";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";
import type { IEditablePropertyListOption, IPropertyDescriptionForEdition } from "core/Decorators/nodeDecorator";
import { PropertyTypeForEdition } from "core/Decorators/nodeDecorator";
import { Constants } from "core/Engines/constants";
import { ForceRebuild } from "shared-ui-components/nodeGraphSystem/automaticProperties";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const samplingModeList = [
    { label: "Nearest/Nearest", value: Constants.TEXTURE_NEAREST_SAMPLINGMODE }, // 1
    { label: "Linear/Nearest", value: Constants.TEXTURE_LINEAR_NEAREST }, // 12
    { label: "Nearest/Linear", value: Constants.TEXTURE_NEAREST_LINEAR }, // 7
    { label: "Linear/Linear", value: Constants.TEXTURE_BILINEAR_SAMPLINGMODE }, // 2

    { label: "Nearest/Nearest & nearest mip", value: Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST }, // 4
    { label: "Linear/Nearest & nearest mip", value: Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST }, // 9
    { label: "Nearest/Linear & nearest mip", value: Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST }, // 5
    { label: "Linear/Linear & nearest mip", value: Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST }, // 11

    { label: "Nearest/Nearest & linear mip", value: Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR }, // 8
    { label: "Linear/Nearest & linear mip", value: Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR }, // 10
    { label: "Nearest/Linear & linear mip", value: Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR }, // 6
    { label: "Linear/Linear & linear mip", value: Constants.TEXTURE_TRILINEAR_SAMPLINGMODE }, // 3
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const textureFormatList = [
    { label: "rgba", value: Constants.TEXTUREFORMAT_RGBA },
    { label: "r", value: Constants.TEXTUREFORMAT_RED },
    { label: "rg", value: Constants.TEXTUREFORMAT_RG },
    { label: "bgra", value: Constants.TEXTUREFORMAT_BGRA },
    { label: "rgba integer", value: Constants.TEXTUREFORMAT_RGBA_INTEGER },
    { label: "r integer", value: Constants.TEXTUREFORMAT_RED_INTEGER },
    { label: "rg Integer", value: Constants.TEXTUREFORMAT_RG_INTEGER },
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const textureTypeList = [
    { label: "Unsigned Byte", value: Constants.TEXTURETYPE_UNSIGNED_BYTE },
    { label: "Signed Byte", value: Constants.TEXTURETYPE_BYTE },
    { label: "Unsigned Short", value: Constants.TEXTURETYPE_UNSIGNED_SHORT },
    { label: "Short", value: Constants.TEXTURETYPE_SHORT },
    { label: "Unsigned Integer", value: Constants.TEXTURETYPE_UNSIGNED_INTEGER },
    { label: "Integer", value: Constants.TEXTURETYPE_INT },
    { label: "Float", value: Constants.TEXTURETYPE_FLOAT },
    { label: "Half Float", value: Constants.TEXTURETYPE_HALF_FLOAT },
];

// eslint-disable-next-line @typescript-eslint/naming-convention
export const textureDepthStencilFormatList = [
    { label: "Depth 24/Stencil 8", value: Constants.TEXTUREFORMAT_DEPTH24_STENCIL8 },
    { label: "Depth 24 Unorm/Stencil 8", value: Constants.TEXTUREFORMAT_DEPTH24UNORM_STENCIL8 },
    { label: "Depth 32 float/Stencil 8", value: Constants.TEXTUREFORMAT_DEPTH32FLOAT_STENCIL8 },
    { label: "Depth 16", value: Constants.TEXTUREFORMAT_DEPTH16 },
    { label: "Depth 24", value: Constants.TEXTUREFORMAT_DEPTH24 },
    { label: "Depth 32 float", value: Constants.TEXTUREFORMAT_DEPTH32_FLOAT },
];

export const TextureTargetTypeList = [
    { label: "2D", value: Constants.TEXTURE_2D },
    { label: "2D Array", value: Constants.TEXTURE_2D_ARRAY },
    { label: "3D", value: Constants.TEXTURE_3D },
    { label: "Cube", value: Constants.TEXTURE_CUBE_MAP },
    { label: "Cube Array", value: Constants.TEXTURE_CUBE_MAP_ARRAY },
];

export class GenericPropertyComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        return (
            <>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </>
        );
    }
}

export class GeneralPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const block = this.props.nodeData.data as NodeRenderGraphBlock;

        return (
            <>
                <LineContainerComponent title="GENERAL">
                    <TextInputLineComponent
                        label="Name"
                        propertyName="name"
                        target={block}
                        lockObject={this.props.stateManager.lockObject}
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                        validator={() => {
                            return true;
                        }}
                    />
                    <TextLineComponent label="Type" value={block.getClassName()} />
                    <TextInputLineComponent
                        label="Comments"
                        propertyName="comments"
                        lockObject={this.props.stateManager.lockObject}
                        target={block}
                        onChange={() => this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block)}
                        throttlePropertyChangedNotification={true}
                    />
                    {!block.isInput && (
                        <CheckBoxLineComponent
                            key={`checkBox-disabled`}
                            label="Disabled"
                            target={block}
                            propertyName="disabled"
                            onValueChanged={() => this.props.stateManager.onRebuildRequiredObservable.notifyObservers()}
                        />
                    )}
                </LineContainerComponent>
            </>
        );
    }
}

export class GenericPropertyTabComponent extends React.Component<IPropertyComponentProps> {
    constructor(props: IPropertyComponentProps) {
        super(props);
    }

    override render() {
        const block = this.props.nodeData.data as NodeRenderGraphBlock,
            propStore: IPropertyDescriptionForEdition[] = (block as any)._propStore;

        if (!propStore) {
            return <></>;
        }

        const componentList: { [groupName: string]: JSX.Element[] } = {},
            groups: string[] = [];

        const classes: string[] = [];

        let proto = Object.getPrototypeOf(block);
        while (proto && proto.getClassName) {
            classes.push(proto.getClassName());
            proto = Object.getPrototypeOf(proto);
        }

        for (const { propertyName, displayName, type, groupName, options, className } of propStore) {
            let components = componentList[groupName];

            if (classes.indexOf(className) === -1) {
                continue;
            }

            if (!components) {
                components = [];
                componentList[groupName] = components;
                groups.push(groupName);
            }

            switch (type) {
                case PropertyTypeForEdition.Boolean: {
                    components.push(
                        <CheckBoxLineComponent
                            key={`checkBox-${propertyName}`}
                            label={displayName}
                            target={block}
                            propertyName={propertyName}
                            onValueChanged={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Float: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <FloatLineComponent
                                key={`float-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                propertyName={propertyName}
                                target={block}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent
                                key={`slider-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                target={block}
                                propertyName={propertyName}
                                step={Math.abs((options.max as number) - (options.min as number)) / 100.0}
                                minimum={Math.min(options.min as number, options.max as number)}
                                maximum={options.max as number}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Int: {
                    const cantDisplaySlider = isNaN(options.min as number) || isNaN(options.max as number) || options.min === options.max;
                    if (cantDisplaySlider) {
                        components.push(
                            <FloatLineComponent
                                key={`int-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                digits={0}
                                step={"1"}
                                isInteger={true}
                                label={displayName}
                                propertyName={propertyName}
                                target={block}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    } else {
                        components.push(
                            <SliderLineComponent
                                key={`slider-${propertyName}`}
                                lockObject={this.props.stateManager.lockObject}
                                label={displayName}
                                target={block}
                                propertyName={propertyName}
                                decimalCount={0}
                                step={1}
                                minimum={Math.min(options.min as number, options.max as number)}
                                maximum={options.max as number}
                                onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                            />
                        );
                    }
                    break;
                }
                case PropertyTypeForEdition.Vector2: {
                    components.push(
                        <Vector2LineComponent
                            key={`vector2-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Vector3: {
                    components.push(
                        <Vector3LineComponent
                            key={`vector3-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.List: {
                    components.push(
                        <OptionsLine
                            key={`options-${propertyName}`}
                            label={displayName}
                            options={options.options as IEditablePropertyListOption[]}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Color3: {
                    components.push(
                        <Color3LineComponent
                            key={`color3-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Color4: {
                    components.push(
                        <Color4LineComponent
                            key={`color4-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.SamplingMode: {
                    components.push(
                        <OptionsLine
                            key={`samplingmode-${propertyName}`}
                            className="samplingMode"
                            label={displayName}
                            options={samplingModeList}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.TextureFormat: {
                    components.push(
                        <OptionsLine
                            key={`textureformat-${propertyName}`}
                            label={displayName}
                            options={textureFormatList}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.TextureType: {
                    components.push(
                        <OptionsLine
                            key={`texturetype-${propertyName}`}
                            label={displayName}
                            options={textureTypeList}
                            target={block}
                            propertyName={propertyName}
                            onSelect={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.String: {
                    components.push(
                        <TextInputLineComponent
                            key={`string-${propertyName}`}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            throttlePropertyChangedNotification={true}
                            throttlePropertyChangedNotificationDelay={1000}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Matrix: {
                    components.push(
                        <MatrixLineComponent
                            key={`matrix-${propertyName}`}
                            label={displayName}
                            propertyName={propertyName}
                            target={block}
                            lockObject={this.props.stateManager.lockObject}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
                case PropertyTypeForEdition.Viewport: {
                    components.push(
                        <SliderLineComponent
                            key={`viewportx-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName + " X"}
                            target={(block as any)[propertyName]}
                            propertyName={"x"}
                            step={0.001}
                            minimum={0}
                            maximum={1}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    components.push(
                        <SliderLineComponent
                            key={`viewporty-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName + " Y"}
                            target={(block as any)[propertyName]}
                            propertyName={"y"}
                            step={0.001}
                            minimum={0}
                            maximum={1}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    components.push(
                        <SliderLineComponent
                            key={`viewportw-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName + " Width"}
                            target={(block as any)[propertyName]}
                            propertyName={"width"}
                            step={0.001}
                            minimum={0}
                            maximum={1}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    components.push(
                        <SliderLineComponent
                            key={`viewporth-${propertyName}`}
                            lockObject={this.props.stateManager.lockObject}
                            label={displayName + " Height"}
                            target={(block as any)[propertyName]}
                            propertyName={"height"}
                            step={0.001}
                            minimum={0}
                            maximum={1}
                            onChange={() => ForceRebuild(block, this.props.stateManager, propertyName, options.notifiers)}
                        />
                    );
                    break;
                }
            }
        }

        return (
            <>
                {groups.map((group) => (
                    <LineContainerComponent key={`group-${group}`} title={group}>
                        {componentList[group]}
                    </LineContainerComponent>
                ))}
            </>
        );
    }
}
