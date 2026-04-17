import { type FunctionComponent, useCallback } from "react";

import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import {
    type GLTFExtensionOptionsType,
    type GLTFLoaderOptionsType,
    ExtensionOptionDefaults,
    LoaderOptionDefaults,
} from "../../../services/panes/tools/import/gltfLoaderOptionsDefaults";

import { GLTFLoaderAnimationStartMode, GLTFLoaderCoordinateSystemMode } from "loaders/glTF/glTFFileLoader";
import { ArrowResetRegular } from "@fluentui/react-icons";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { BoundProperty } from "../../properties/boundProperty";

const AnimationStartModeOptions: DropdownOption<number>[] = [
    { label: "None", value: GLTFLoaderAnimationStartMode.NONE },
    { label: "First", value: GLTFLoaderAnimationStartMode.FIRST },
    { label: "All", value: GLTFLoaderAnimationStartMode.ALL },
];

const CoordinateSystemModeOptions: DropdownOption<number>[] = [
    { label: "Auto", value: GLTFLoaderCoordinateSystemMode.AUTO },
    { label: "Right Handed", value: GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED },
];

export const GLTFLoaderOptionsTool: FunctionComponent<{
    loaderOptions: GLTFLoaderOptionsType;
}> = ({ loaderOptions }) => {
    const resetLoaderOptions = useCallback(() => {
        for (const key of Object.keys(loaderOptions) as (keyof GLTFLoaderOptionsType)[]) {
            loaderOptions[key] = null;
        }
    }, [loaderOptions]);

    return (
        <PropertyLine
            label="Loader Options"
            expandByDefault={false}
            expandedContent={
                <>
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Always Compute Bounding Box"
                        target={loaderOptions}
                        propertyKey="alwaysComputeBoundingBox"
                        nullable
                        defaultValue={LoaderOptionDefaults.alwaysComputeBoundingBox}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Always Compute Skeleton Root Node"
                        target={loaderOptions}
                        propertyKey="alwaysComputeSkeletonRootNode"
                        nullable
                        defaultValue={LoaderOptionDefaults.alwaysComputeSkeletonRootNode}
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Animation Start Mode"
                        options={AnimationStartModeOptions}
                        target={loaderOptions}
                        propertyKey="animationStartMode"
                        nullable
                        defaultValue={LoaderOptionDefaults.animationStartMode}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Capture Performance Counters"
                        target={loaderOptions}
                        propertyKey="capturePerformanceCounters"
                        nullable
                        defaultValue={LoaderOptionDefaults.capturePerformanceCounters}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Compile Materials"
                        target={loaderOptions}
                        propertyKey="compileMaterials"
                        nullable
                        defaultValue={LoaderOptionDefaults.compileMaterials}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Compile Shadow Generators"
                        target={loaderOptions}
                        propertyKey="compileShadowGenerators"
                        nullable
                        defaultValue={LoaderOptionDefaults.compileShadowGenerators}
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Coordinate System"
                        options={CoordinateSystemModeOptions}
                        target={loaderOptions}
                        propertyKey="coordinateSystemMode"
                        nullable
                        defaultValue={LoaderOptionDefaults.coordinateSystemMode}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Create Instances"
                        target={loaderOptions}
                        propertyKey="createInstances"
                        nullable
                        defaultValue={LoaderOptionDefaults.createInstances}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Don't Use Transmission Helper"
                        target={loaderOptions}
                        propertyKey="dontUseTransmissionHelper"
                        nullable
                        defaultValue={LoaderOptionDefaults.dontUseTransmissionHelper}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Enable Logging"
                        target={loaderOptions}
                        propertyKey="loggingEnabled"
                        nullable
                        defaultValue={LoaderOptionDefaults.loggingEnabled}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Load All Materials"
                        target={loaderOptions}
                        propertyKey="loadAllMaterials"
                        nullable
                        defaultValue={LoaderOptionDefaults.loadAllMaterials}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Load Morph Targets"
                        target={loaderOptions}
                        propertyKey="loadMorphTargets"
                        nullable
                        defaultValue={LoaderOptionDefaults.loadMorphTargets}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Load Node Animations"
                        target={loaderOptions}
                        propertyKey="loadNodeAnimations"
                        nullable
                        defaultValue={LoaderOptionDefaults.loadNodeAnimations}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Load Only Materials"
                        target={loaderOptions}
                        propertyKey="loadOnlyMaterials"
                        nullable
                        defaultValue={LoaderOptionDefaults.loadOnlyMaterials}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Load Skins"
                        target={loaderOptions}
                        propertyKey="loadSkins"
                        nullable
                        defaultValue={LoaderOptionDefaults.loadSkins}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Skip Materials"
                        target={loaderOptions}
                        propertyKey="skipMaterials"
                        nullable
                        defaultValue={LoaderOptionDefaults.skipMaterials}
                    />
                    <BoundProperty
                        component={SyncedSliderPropertyLine}
                        label="Target FPS"
                        target={loaderOptions}
                        propertyKey="targetFps"
                        min={1}
                        max={120}
                        step={1}
                        nullable
                        defaultValue={LoaderOptionDefaults.targetFps}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Transparency As Coverage"
                        target={loaderOptions}
                        propertyKey="transparencyAsCoverage"
                        nullable
                        defaultValue={LoaderOptionDefaults.transparencyAsCoverage}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use Clip Plane"
                        target={loaderOptions}
                        propertyKey="useClipPlane"
                        nullable
                        defaultValue={LoaderOptionDefaults.useClipPlane}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use glTF Texture Names"
                        target={loaderOptions}
                        propertyKey="useGltfTextureNames"
                        nullable
                        defaultValue={LoaderOptionDefaults.useGltfTextureNames}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use OpenPBR"
                        target={loaderOptions}
                        propertyKey="useOpenPBR"
                        nullable
                        defaultValue={LoaderOptionDefaults.useOpenPBR}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use Range Requests"
                        target={loaderOptions}
                        propertyKey="useRangeRequests"
                        nullable
                        defaultValue={LoaderOptionDefaults.useRangeRequests}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use sRGB Buffers"
                        target={loaderOptions}
                        propertyKey="useSRGBBuffers"
                        nullable
                        defaultValue={LoaderOptionDefaults.useSRGBBuffers}
                    />
                    <ButtonLine label="Reset to Defaults" icon={ArrowResetRegular} onClick={resetLoaderOptions} />
                </>
            }
        />
    );
};

export const GLTFExtensionOptionsTool: FunctionComponent<{
    extensionOptions: GLTFExtensionOptionsType;
}> = ({ extensionOptions }) => {
    const resetExtensionOptions = useCallback(() => {
        for (const options of Object.values(extensionOptions)) {
            for (const key of Object.keys(options)) {
                (options as Record<string, unknown>)[key] = null;
            }
        }
    }, [extensionOptions]);

    return (
        <PropertyLine
            label="Extension Options"
            expandByDefault={false}
            expandedContent={
                <>
                    {Object.entries(extensionOptions)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([extensionName, options]) => {
                            return (
                                <BoundProperty
                                    key={extensionName}
                                    component={SwitchPropertyLine}
                                    label={extensionName}
                                    target={options}
                                    propertyKey="enabled"
                                    nullable
                                    defaultValue={true}
                                    expandedContent={
                                        (extensionName === "MSFT_lod" && (
                                            <BoundProperty
                                                key={extensionName + "_maxLODsToLoad"}
                                                component={SyncedSliderPropertyLine}
                                                label="Maximum LODs"
                                                target={extensionOptions[extensionName]} // TS can't infer that value ~ extensionOptions[extensionName]
                                                propertyKey="maxLODsToLoad"
                                                min={1}
                                                max={10}
                                                step={1}
                                                nullable
                                                defaultValue={ExtensionOptionDefaults.MSFT_lod.maxLODsToLoad}
                                            />
                                        )) ||
                                        undefined
                                    }
                                />
                            );
                        })}
                    <ButtonLine label="Reset to Defaults" icon={ArrowResetRegular} onClick={resetExtensionOptions} />
                </>
            }
        />
    );
};
