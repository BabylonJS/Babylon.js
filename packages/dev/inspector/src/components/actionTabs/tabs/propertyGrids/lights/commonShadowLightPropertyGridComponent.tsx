import * as React from "react";
import type { Observable } from "core/Misc/observable";
import type { IShadowLight } from "core/Lights/shadowLight";
import type { PropertyChangedEvent } from "../../../../propertyChangedEvent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import type { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";
import type { GlobalState } from "../../../../globalState";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { DirectionalLight } from "core/Lights/directionalLight";

interface ICommonShadowLightPropertyGridComponentProps {
    globalState: GlobalState;
    light: IShadowLight;
    lockObject: LockObject;
    onPropertyChangedObservable?: Observable<PropertyChangedEvent>;
}

export class CommonShadowLightPropertyGridComponent extends React.Component<ICommonShadowLightPropertyGridComponentProps> {
    private _internals: { generatorType: number; mapSize: number };

    constructor(props: ICommonShadowLightPropertyGridComponentProps) {
        super(props);

        this._internals = {
            generatorType: 0,
            mapSize: 1024,
        };
    }

    createShadowGenerator() {
        const light = this.props.light;
        const scene = light.getScene();
        const internals = this._internals;
        const generator = internals.generatorType === 0 ? new ShadowGenerator(internals.mapSize, light) : new CascadedShadowGenerator(internals.mapSize, light as DirectionalLight);

        for (const m of scene.meshes) {
            if (m.infiniteDistance) {
                return;
            }
            generator.addShadowCaster(m);
            if (!m.isAnInstance) {
                m.receiveShadows = true;
            }
        }

        this.forceUpdate();
    }

    disposeShadowGenerator() {
        const light = this.props.light;

        light.getShadowGenerator()?.dispose();

        this.forceUpdate();
    }

    override render() {
        const light = this.props.light;
        const internals = this._internals;
        const camera = light.getScene().activeCamera;

        let generator = (light.getShadowGenerator(camera) as ShadowGenerator | CascadedShadowGenerator) || null;
        if (generator === null) {
            // try to get the first shadow generator
            const shadowGenerators = light.getShadowGenerators();
            if (shadowGenerators && shadowGenerators.size > 0) {
                generator = shadowGenerators.values().next().value as ShadowGenerator | CascadedShadowGenerator;
            }
        }

        const csmGenerator = generator instanceof CascadedShadowGenerator;

        const typeGeneratorOptions = [{ label: "Shadow Generator", value: 0 }];

        if (light instanceof DirectionalLight) {
            typeGeneratorOptions.push({ label: "Cascaded Shadow Generator", value: 1 });
        }

        const mapSizeOptions = [
            { label: "4096x4096", value: 4096 },
            { label: "2048x2048", value: 2048 },
            { label: "1024x1024", value: 1024 },
            { label: "512x512", value: 512 },
            { label: "256x256", value: 256 },
        ];

        let blurModeOptions;

        if (generator instanceof CascadedShadowGenerator) {
            blurModeOptions = [
                { label: "None", value: ShadowGenerator.FILTER_NONE },
                { label: "PCF", value: ShadowGenerator.FILTER_PCF },
                { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
            ];
        } else {
            blurModeOptions = [
                { label: "None", value: ShadowGenerator.FILTER_NONE },
                { label: "PCF", value: ShadowGenerator.FILTER_PCF },
                { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
                { label: "Poisson", value: ShadowGenerator.FILTER_POISSONSAMPLING },
                { label: "Exponential", value: ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP },
                { label: "Blurred exponential", value: ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP },
                { label: "Close exponential", value: ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP },
                { label: "Blurred close exponential", value: ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP },
            ];
        }

        const filteringQualityOptions = [
            { label: "Low", value: ShadowGenerator.QUALITY_LOW },
            { label: "Medium", value: ShadowGenerator.QUALITY_MEDIUM },
            { label: "High", value: ShadowGenerator.QUALITY_HIGH },
        ];

        const numCascadesOptions = [
            { label: "2", value: 2 },
            { label: "3", value: 3 },
            { label: "4", value: 4 },
        ];

        const near = camera ? camera.minZ : 0,
            far = camera ? (camera.maxZ ? camera.maxZ : 500000) : 0;

        const filter = generator ? generator.filter : 0;

        return (
            <div>
                <LineContainerComponent title="SHADOWS" selection={this.props.globalState}>
                    <CheckBoxLineComponent
                        label="Shadows enabled"
                        target={light}
                        propertyName="shadowEnabled"
                        onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                    />
                    {!csmGenerator && (
                        <>
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="Shadows near plane"
                                target={light}
                                propertyName="shadowMinZ"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                            <FloatLineComponent
                                lockObject={this.props.lockObject}
                                label="Shadows far plane"
                                target={light}
                                propertyName="shadowMaxZ"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        </>
                    )}
                </LineContainerComponent>
                {generator == null && (
                    <LineContainerComponent title="SHADOW GENERATOR" selection={this.props.globalState}>
                        <OptionsLine label="Type" options={typeGeneratorOptions} target={internals} propertyName="generatorType" />
                        <OptionsLine label="Map size" options={mapSizeOptions} target={internals} propertyName="mapSize" />
                        <ButtonLineComponent label="Create generator" onClick={() => this.createShadowGenerator()} />
                    </LineContainerComponent>
                )}
                {generator !== null && (
                    <LineContainerComponent title="SHADOW GENERATOR" selection={this.props.globalState}>
                        <ButtonLineComponent label="Dispose generator" onClick={() => this.disposeShadowGenerator()} />
                        {csmGenerator && (
                            <>
                                <OptionsLine
                                    label="Num cascades"
                                    options={numCascadesOptions}
                                    target={generator}
                                    propertyName="numCascades"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <CheckBoxLineComponent
                                    label="Debug mode"
                                    target={generator}
                                    propertyName="debug"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <CheckBoxLineComponent
                                    label="Stabilize cascades"
                                    target={generator}
                                    propertyName="stabilizeCascades"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Lambda"
                                    minimum={0}
                                    maximum={1.0}
                                    step={0.01}
                                    target={generator}
                                    propertyName="lambda"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Cascade blend"
                                    minimum={0}
                                    maximum={1.0}
                                    step={0.01}
                                    target={generator}
                                    propertyName="cascadeBlendPercentage"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <CheckBoxLineComponent
                                    label="Depth clamp"
                                    target={generator}
                                    propertyName="depthClamp"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <CheckBoxLineComponent
                                    label="Auto-Calc depth bounds"
                                    target={generator}
                                    propertyName="autoCalcDepthBounds"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Shadow MaxZ"
                                    minimum={near}
                                    maximum={far}
                                    step={0.5}
                                    target={generator}
                                    propertyName="shadowMaxZ"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                            </>
                        )}
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            digits={4}
                            step="0.0001"
                            label="Bias"
                            target={generator}
                            propertyName="bias"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <FloatLineComponent
                            lockObject={this.props.lockObject}
                            label="Normal bias"
                            target={generator}
                            propertyName="normalBias"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <SliderLineComponent
                            lockObject={this.props.lockObject}
                            label="Darkness"
                            target={generator}
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            propertyName="darkness"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <CheckBoxLineComponent
                            label="Allow transparent shadows"
                            target={generator}
                            propertyName="transparencyShadow"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        <OptionsLine
                            label="Filter"
                            options={blurModeOptions}
                            onSelect={() => {
                                this.forceUpdate();
                            }}
                            target={generator}
                            propertyName="filter"
                            onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                        />
                        {(filter === ShadowGenerator.FILTER_PCF || filter === ShadowGenerator.FILTER_PCSS) && (
                            <OptionsLine
                                label="Filtering quality"
                                options={filteringQualityOptions}
                                onSelect={() => {
                                    this.forceUpdate();
                                }}
                                target={generator}
                                propertyName="filteringQuality"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                        {filter === ShadowGenerator.FILTER_PCSS && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Penumbra ratio"
                                minimum={0}
                                maximum={0.5}
                                step={0.001}
                                target={generator}
                                propertyName="contactHardeningLightSizeUVRatio"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                        {!csmGenerator && (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) && (
                            <CheckBoxLineComponent
                                label="Use kernel blur"
                                target={generator}
                                propertyName="useKernelBlur"
                                onValueChanged={() => this.forceUpdate()}
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                        {generator instanceof ShadowGenerator &&
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) &&
                            !generator.useKernelBlur && (
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Blur box offset"
                                    target={generator}
                                    propertyName="blurBoxOffset"
                                    minimum={1}
                                    maximum={64}
                                    step={1}
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                            )}
                        {generator instanceof ShadowGenerator &&
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP) &&
                            generator.useKernelBlur && (
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Blur kernel"
                                    target={generator}
                                    propertyName="blurKernel"
                                    minimum={1}
                                    maximum={64}
                                    step={1}
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                            )}
                        {generator instanceof ShadowGenerator &&
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) && (
                                <FloatLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Depth scale"
                                    target={generator}
                                    propertyName="depthScale"
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                            )}
                        {generator instanceof ShadowGenerator &&
                            (filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP) && (
                                <SliderLineComponent
                                    lockObject={this.props.lockObject}
                                    label="Blur scale"
                                    target={generator}
                                    propertyName="blurScale"
                                    minimum={1}
                                    maximum={4}
                                    step={1}
                                    onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                                />
                            )}
                        {csmGenerator && filter === ShadowGenerator.FILTER_PCSS && (
                            <SliderLineComponent
                                lockObject={this.props.lockObject}
                                label="Penumbra darkness"
                                minimum={0}
                                maximum={1.0}
                                step={0.01}
                                target={generator}
                                propertyName="penumbraDarkness"
                                onPropertyChangedObservable={this.props.onPropertyChangedObservable}
                            />
                        )}
                    </LineContainerComponent>
                )}
            </div>
        );
    }
}
