import type { FunctionComponent } from "react";

import type { Camera, IShadowGenerator, Nullable, ShadowLight } from "core/index";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

import { useEffect, useState } from "react";

import { DirectionalLight } from "core/Lights/directionalLight";
import { CascadedShadowGenerator } from "core/Lights/Shadows/cascadedShadowGenerator";
import { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { useObservableState } from "../../../hooks/observableHooks";
import { useProperty } from "../../../hooks/compoundPropertyHooks";
import { BoundProperty } from "../boundProperty";

import "core/Lights/Shadows/shadowGeneratorSceneComponent";

type ShadowGeneratorType = "Default" | "Cascade";

const DefaultShadowGeneratorOptions = [{ label: "Shadow Generator", value: "Default" satisfies ShadowGeneratorType }] as const satisfies DropdownOption<ShadowGeneratorType>[];

const DirectionalLightGeneratorOptions = [
    ...DefaultShadowGeneratorOptions,
    { label: "Cascaded Shadow Generator", value: "Cascade" satisfies ShadowGeneratorType },
] as const satisfies DropdownOption<ShadowGeneratorType>[];

const MapSizeOptions = [
    { label: "4096 x 4096", value: 4096 },
    { label: "2048 x 2048", value: 2048 },
    { label: "1024 x 1024", value: 1024 },
    { label: "512 x 512", value: 512 },
    { label: "256 x 256", value: 256 },
] as const satisfies DropdownOption<number>[];

const BlurModeOptions = [
    { label: "None", value: ShadowGenerator.FILTER_NONE },
    { label: "PCF", value: ShadowGenerator.FILTER_PCF },
    { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
    { label: "Poisson", value: ShadowGenerator.FILTER_POISSONSAMPLING },
    { label: "Exponential", value: ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP },
    { label: "Blurred Exponential", value: ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP },
    { label: "Close Exponential", value: ShadowGenerator.FILTER_CLOSEEXPONENTIALSHADOWMAP },
    { label: "Blurred Close Exponential", value: ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP },
] as const satisfies DropdownOption<number>[];

const CSMBlurModeOptions = [
    { label: "None", value: ShadowGenerator.FILTER_NONE },
    { label: "PCF", value: ShadowGenerator.FILTER_PCF },
    { label: "PCSS", value: ShadowGenerator.FILTER_PCSS },
] as const satisfies DropdownOption<number>[];

const FilteringQualityOptions = [
    { label: "Low", value: ShadowGenerator.QUALITY_LOW },
    { label: "Medium", value: ShadowGenerator.QUALITY_MEDIUM },
    { label: "High", value: ShadowGenerator.QUALITY_HIGH },
] as const satisfies DropdownOption<number>[];

const NumCascadesOptions = [
    { label: "2", value: 2 },
    { label: "3", value: 3 },
    { label: "4", value: 4 },
] as const satisfies DropdownOption<number>[];

type ShadowGeneratorSettings = {
    generatorType: ShadowGeneratorType; // Type of shadow generator
    mapSize: number; // Size of the shadow map
};

function GetShadowGenerator(camera: Nullable<Camera>, shadowLight: ShadowLight): Nullable<IShadowGenerator> {
    return shadowLight.getShadowGenerator(camera) ?? shadowLight.getShadowGenerators()?.values().next().value ?? null;
}

function CreateShadowGenerator(shadowLight: ShadowLight, settings: ShadowGeneratorSettings): void {
    const light = shadowLight;
    const scene = light.getScene();
    const internals = settings;
    const generatorType = internals.generatorType;
    const mapSize = internals.mapSize;
    const generator = generatorType === "Default" ? new ShadowGenerator(mapSize, light) : new CascadedShadowGenerator(mapSize, light as DirectionalLight);

    for (const m of scene.meshes) {
        if (m.infiniteDistance) {
            continue;
        }
        generator.addShadowCaster(m);
        if (!m.isAnInstance) {
            m.receiveShadows = true;
        }
    }
}

function DisposeShadowGenerator(camera: Nullable<Camera>, shadowLight: ShadowLight): void {
    GetShadowGenerator(camera, shadowLight)?.dispose();
}

export const ShadowGeneratorSetupProperties: FunctionComponent<{ context: ShadowLight }> = ({ context: shadowLight }) => {
    const defaultGeneratorType = DefaultShadowGeneratorOptions[0].value;
    const defaultMapSize = MapSizeOptions[0].value;
    const [shadowGeneratorSettings, setShadowGeneratorSettings] = useState<Readonly<ShadowGeneratorSettings>>({ generatorType: defaultGeneratorType, mapSize: defaultMapSize });
    const shadowGeneratorOptions = shadowLight instanceof DirectionalLight ? DirectionalLightGeneratorOptions : DefaultShadowGeneratorOptions;
    const camera = useObservableState(() => shadowLight.getScene().activeCamera, shadowLight.getScene().onActiveCameraChanged);
    const shadowGenerator = GetShadowGenerator(camera, shadowLight) as ShadowGenerator | CascadedShadowGenerator | null;
    const [hasShadowGenerator, setHasShadowGenerator] = useState(!!shadowGenerator);

    useEffect(() => {
        setHasShadowGenerator(!!shadowGenerator);
    }, [shadowGenerator]);

    const isCascaded = shadowGenerator instanceof CascadedShadowGenerator;
    const isStandardGenerator = shadowGenerator instanceof ShadowGenerator && !isCascaded;

    // Use useProperty to track filter changes and trigger re-renders for conditional UI
    const filter = useProperty(shadowGenerator, "filter") ?? ShadowGenerator.FILTER_NONE;
    const useKernelBlur = useProperty(shadowGenerator as ShadowGenerator | null, "useKernelBlur");

    const blurModeOptions = isCascaded ? CSMBlurModeOptions : BlurModeOptions;

    const near = camera?.minZ ?? 0;
    const far = camera?.maxZ ?? 10000;

    const isPCFOrPCSS = filter === ShadowGenerator.FILTER_PCF || filter === ShadowGenerator.FILTER_PCSS;
    const isPCSS = filter === ShadowGenerator.FILTER_PCSS;
    const isBlurExponential = filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_BLURCLOSEEXPONENTIALSHADOWMAP;
    const isExponential = filter === ShadowGenerator.FILTER_BLUREXPONENTIALSHADOWMAP || filter === ShadowGenerator.FILTER_EXPONENTIALSHADOWMAP;

    return (
        <>
            {!hasShadowGenerator && (
                <>
                    <StringDropdownPropertyLine
                        label="Type"
                        options={shadowGeneratorOptions}
                        value={shadowGeneratorSettings.generatorType}
                        onChange={(value) => setShadowGeneratorSettings((prev) => ({ ...prev, generatorType: value as ShadowGeneratorType }))}
                    />
                    <NumberDropdownPropertyLine
                        label="Map Size"
                        options={MapSizeOptions}
                        value={shadowGeneratorSettings.mapSize}
                        onChange={(value) => setShadowGeneratorSettings((prev) => ({ ...prev, mapSize: value }))}
                    />
                    <ButtonLine
                        label="Create Generator"
                        onClick={() => {
                            CreateShadowGenerator(shadowLight, shadowGeneratorSettings);
                            setHasShadowGenerator(true);
                        }}
                    />
                </>
            )}
            {shadowGenerator && (
                <>
                    {isCascaded && <CascadedShadowGeneratorProperties generator={shadowGenerator} near={near} far={far} isPCSS={isPCSS} />}

                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Bias"
                        description="Bias to apply to the shadow map to avoid shadow acne."
                        target={shadowGenerator}
                        propertyKey="bias"
                        propertyPath="getShadowGenerator().bias"
                        step={0.0001}
                    />
                    <BoundProperty
                        component={NumberInputPropertyLine}
                        label="Normal Bias"
                        description="Normal bias to apply to avoid shadow acne."
                        target={shadowGenerator}
                        propertyKey="normalBias"
                        propertyPath="getShadowGenerator().normalBias"
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Darkness"
                        description="Darkness of the shadow (0 = no shadow, 1 = full shadow)."
                        target={shadowGenerator}
                        propertyKey="darkness"
                        propertyPath="getShadowGenerator().darkness"
                        min={0}
                        max={1}
                        step={0.01}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Transparent Shadows"
                        description="Allow transparent objects to cast shadows."
                        target={shadowGenerator}
                        propertyKey="transparencyShadow"
                        propertyPath="getShadowGenerator().transparencyShadow"
                    />

                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Filter"
                        description="Shadow filtering mode."
                        target={shadowGenerator}
                        propertyKey="filter"
                        propertyPath="getShadowGenerator().filter"
                        options={blurModeOptions}
                    />
                    <Collapse visible={isPCFOrPCSS}>
                        <BoundProperty
                            component={NumberDropdownPropertyLine}
                            label="Filtering Quality"
                            target={shadowGenerator}
                            propertyKey="filteringQuality"
                            propertyPath="getShadowGenerator().filteringQuality"
                            options={FilteringQualityOptions}
                        />
                    </Collapse>
                    <Collapse visible={isPCSS}>
                        <BoundProperty
                            component={SyncedSliderPropertyLine}
                            label="Penumbra Ratio"
                            description="Light size UV ratio for PCSS."
                            target={shadowGenerator}
                            propertyKey="contactHardeningLightSizeUVRatio"
                            propertyPath="getShadowGenerator().contactHardeningLightSizeUVRatio"
                            min={0}
                            max={0.5}
                            step={0.001}
                        />
                    </Collapse>
                    {isStandardGenerator && (
                        <>
                            <Collapse visible={isBlurExponential}>
                                <>
                                    <BoundProperty
                                        component={SwitchPropertyLine}
                                        label="Use Kernel Blur"
                                        description="Use kernel-based blur instead of box blur."
                                        target={shadowGenerator}
                                        propertyKey="useKernelBlur"
                                        propertyPath="getShadowGenerator().useKernelBlur"
                                    />
                                    {useKernelBlur ? (
                                        <BoundProperty
                                            component={SyncedSliderPropertyLine}
                                            label="Blur Kernel"
                                            target={shadowGenerator}
                                            propertyKey="blurKernel"
                                            propertyPath="getShadowGenerator().blurKernel"
                                            min={1}
                                            max={64}
                                            step={1}
                                        />
                                    ) : (
                                        <BoundProperty
                                            component={SyncedSliderPropertyLine}
                                            label="Blur Box Offset"
                                            target={shadowGenerator}
                                            propertyKey="blurBoxOffset"
                                            propertyPath="getShadowGenerator().blurBoxOffset"
                                            min={1}
                                            max={64}
                                            step={1}
                                        />
                                    )}
                                </>
                            </Collapse>
                            <Collapse visible={isExponential}>
                                <>
                                    <BoundProperty
                                        component={NumberInputPropertyLine}
                                        label="Depth Scale"
                                        target={shadowGenerator}
                                        propertyKey="depthScale"
                                        propertyPath="getShadowGenerator().depthScale"
                                    />
                                    <BoundProperty
                                        component={SyncedSliderPropertyLine}
                                        label="Blur Scale"
                                        target={shadowGenerator}
                                        propertyKey="blurScale"
                                        propertyPath="getShadowGenerator().blurScale"
                                        min={1}
                                        max={4}
                                        step={1}
                                    />
                                </>
                            </Collapse>
                        </>
                    )}

                    <ButtonLine
                        label="Dispose Generator"
                        onClick={() => {
                            DisposeShadowGenerator(camera, shadowLight);
                            setHasShadowGenerator(false);
                        }}
                    />
                </>
            )}
        </>
    );
};

const CascadedShadowGeneratorProperties: FunctionComponent<{ generator: CascadedShadowGenerator; near: number; far: number; isPCSS: boolean }> = ({
    generator,
    near,
    far,
    isPCSS,
}) => {
    return (
        <>
            <BoundProperty
                component={NumberDropdownPropertyLine}
                label="Num Cascades"
                description="Number of cascades for the cascaded shadow map."
                target={generator}
                propertyKey="numCascades"
                propertyPath="getShadowGenerator().numCascades"
                options={NumCascadesOptions}
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Debug Mode"
                description="Colorize cascades for debugging."
                target={generator}
                propertyKey="debug"
                propertyPath="getShadowGenerator().debug"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Stabilize Cascades"
                description="Stabilize the cascade splits to avoid shimmering."
                target={generator}
                propertyKey="stabilizeCascades"
                propertyPath="getShadowGenerator().stabilizeCascades"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Lambda"
                description="Balance between logarithmic and uniform cascade splits."
                target={generator}
                propertyKey="lambda"
                propertyPath="getShadowGenerator().lambda"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Cascade Blend"
                description="Percentage of blending between cascades."
                target={generator}
                propertyKey="cascadeBlendPercentage"
                propertyPath="getShadowGenerator().cascadeBlendPercentage"
                min={0}
                max={1}
                step={0.01}
            />
            <BoundProperty component={SwitchPropertyLine} label="Depth Clamp" target={generator} propertyKey="depthClamp" propertyPath="getShadowGenerator().depthClamp" />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Auto-Calc Depth Bounds"
                target={generator}
                propertyKey="autoCalcDepthBounds"
                propertyPath="getShadowGenerator().autoCalcDepthBounds"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Shadow MaxZ"
                target={generator}
                propertyKey="shadowMaxZ"
                propertyPath="getShadowGenerator().shadowMaxZ"
                min={near}
                max={far}
                step={0.5}
            />
            <Collapse visible={isPCSS}>
                <BoundProperty
                    component={SyncedSliderPropertyLine}
                    label="Penumbra Darkness"
                    description="Darkness of the penumbra for PCSS in CSM."
                    target={generator}
                    propertyKey="penumbraDarkness"
                    propertyPath="getShadowGenerator().penumbraDarkness"
                    min={0}
                    max={1}
                    step={0.01}
                />
            </Collapse>
        </>
    );
};
