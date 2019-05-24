import * as React from "react";
import { Observable } from "babylonjs/Misc/observable";
import { IShadowLight } from "babylonjs/Lights/shadowLight";
import { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "../../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../../lines/checkBoxLineComponent";
import { FloatLineComponent } from "../../../lines/floatLineComponent";
import { LockObject } from "../lockObject";
import { GlobalState } from '../../../../globalState';
import { OptionsLineComponent } from '../../../lines/optionsLineComponent';
import { ShadowGenerator } from 'babylonjs/Lights/Shadows/shadowGenerator';
import { SliderLineComponent } from '../../../lines/sliderLineComponent';
import { ButtonLineComponent } from '../../../lines/buttonLineComponent';

interface ICommonShadowLightPropertyGridComponentProps {
    globalState: GlobalState,
    light: IShadowLight,
    lockObject: LockObject,
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>
}

export class CommonShadowLightPropertyGridComponent extends React.Component<ICommonShadowLightPropertyGridComponentProps> {
    constructor(props: ICommonShadowLightPropertyGridComponentProps) {
        super(props);
    }

    createShadowGenerator() {
        const light = this.props.light;
        const scene = light.getScene();
        let generator = new ShadowGenerator(512, light);

        scene.meshes.forEach(m => {
            generator.addShadowCaster(m);
            m.receiveShadows = true;
        });

        this.forceUpdate();
    }

    render() {
        const light = this.props.light;
        const generator = light.getShadowGenerator() as ShadowGenerator || null;

        var blurModeOptions = [
            { label: "None", value: ShadowGenerator.FILTER_NONE },
            { label: "PCF", value: ShadowGenerator.FILTER_PCF },
            { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
            { label: "Poisson", value: ShadowGenerator.FILTER_POISSONSAMPLING },
            { label: "Exponential", value: ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP },
            { label: "Blurred exponential", value: ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP },
            { label: "Close exponential", value: ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP },
            { label: "Blurred close exponential", value: ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP },
        ];

        var filteringQualityOptions = [
            { label: "Low", value: ShadowGenerator.QUALITY_LOW },
            { label: "Medium", value: ShadowGenerator.QUALITY_MEDIUM },
            { label: "High", value: ShadowGenerator.QUALITY_HIGH }
        ];

        let filter = generator ? generator.filter : 0;

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="SHADOWS">
                    <CheckBoxLineComponent label="Shadows enabled" target={light} propertyName="shadowEnabled" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Shadows near plane" target={light} propertyName="shadowMinZ" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                    <FloatLineComponent lockObject={this.props.lockObject} label="Shadows far plane" target={light} propertyName="shadowMaxZ" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                </LineContainerComponent>
                {
                    generator == null &&
                    <LineContainerComponent globalState={this.props.globalState} title="SHADOW GENERATOR">
                        <ButtonLineComponent label="Create generator" onClick={() => this.createShadowGenerator()} />
                    </LineContainerComponent>
                }
                {
                    generator !== null &&
                    <LineContainerComponent globalState={this.props.globalState} title="SHADOW GENERATOR">
                        <FloatLineComponent lockObject={this.props.lockObject} digits={4} step="0.0001" label="Bias" target={generator} propertyName="bias" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <FloatLineComponent lockObject={this.props.lockObject} label="Normal bias" target={generator} propertyName="normalBias" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <SliderLineComponent label="Darkness" target={generator} minimum={0} maximum={1} step={0.01} propertyName="darkness" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <CheckBoxLineComponent label="Allow transparent shadows" target={generator} propertyName="transparencyShadow" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        <OptionsLineComponent label="Filter" options={blurModeOptions}
                            onSelect={() => {
                                this.forceUpdate();
                            }}
                            target={generator} propertyName="filter" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        {
                            (filter === ShadowGenerator.FILTER_PCF || filter === ShadowGenerator.FILTER_PCSS) &&
                            <OptionsLineComponent label="Filtering quality" options={filteringQualityOptions}
                                onSelect={() => {
                                    this.forceUpdate();
                                }}
                                target={generator} propertyName="filteringQuality" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        }
                        {
                            (filter === ShadowGenerator.FILTER_PCSS) &&
                            <SliderLineComponent label="Penumbra ratio" minimum={0} maximum={0.5} step={0.001} target={generator} propertyName="contactHardeningLightSizeUVRatio" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        }
                        {
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) &&
                            <CheckBoxLineComponent label="Use kernel blur" target={generator} propertyName="useKernelBlur"
                                onValueChanged={() => this.forceUpdate()}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        }
                        {
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) &&
                            !generator.useKernelBlur &&
                            <SliderLineComponent label="Blur box offset" target={generator} propertyName="blurBoxOffset" minimum={1} maximum={64} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />}
                        {
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) &&
                            generator.useKernelBlur &&
                            <SliderLineComponent label="Blur kernel" target={generator} propertyName="blurKernel" minimum={1} maximum={64} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        }
                        {
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) &&
                            <FloatLineComponent lockObject={this.props.lockObject} label="Depth scale" target={generator} propertyName="depthScale" onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        }
                        {
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) &&
                            <SliderLineComponent label="Blur scale" target={generator} propertyName="blurScale" minimum={1} maximum={4} step={1} onPropertyChangedObservable={this.props.onPropertyChangedObservable} />
                        }
                    </LineContainerComponent>
                }
            </div>
        );
    }
}