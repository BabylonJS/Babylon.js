import { type FunctionComponent } from "react";

import { type DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import {
    type GLTFExtensionOptionsType,
    type GLTFLoaderOptionsType,
    ExtensionOptionDefaults,
    LoaderOptionDefaults,
} from "../../../services/panes/tools/import/gltfLoaderOptionsDefaults";

import { GLTFLoaderAnimationStartMode, GLTFLoaderCoordinateSystemMode } from "loaders/glTF/glTFFileLoader";
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
    return (
        <PropertyLine
            label="Loader Options"
            expandByDefault={false}
            expandedContent={
                <>
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Always compute bounding box"
                        target={loaderOptions}
                        propertyKey="alwaysComputeBoundingBox"
                        nullable
                        defaultValue={LoaderOptionDefaults.alwaysComputeBoundingBox}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Always compute skeleton root node"
                        target={loaderOptions}
                        propertyKey="alwaysComputeSkeletonRootNode"
                        nullable
                        defaultValue={LoaderOptionDefaults.alwaysComputeSkeletonRootNode}
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Animation start mode"
                        options={AnimationStartModeOptions}
                        target={loaderOptions}
                        propertyKey="animationStartMode"
                        nullable
                        defaultValue={LoaderOptionDefaults.animationStartMode}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Capture performance counters"
                        target={loaderOptions}
                        propertyKey="capturePerformanceCounters"
                        nullable
                        defaultValue={LoaderOptionDefaults.capturePerformanceCounters}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Compile materials"
                        target={loaderOptions}
                        propertyKey="compileMaterials"
                        nullable
                        defaultValue={LoaderOptionDefaults.compileMaterials}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Compile shadow generators"
                        target={loaderOptions}
                        propertyKey="compileShadowGenerators"
                        nullable
                        defaultValue={LoaderOptionDefaults.compileShadowGenerators}
                    />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Coordinate system"
                        options={CoordinateSystemModeOptions}
                        target={loaderOptions}
                        propertyKey="coordinateSystemMode"
                        nullable
                        defaultValue={LoaderOptionDefaults.coordinateSystemMode}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Create instances"
                        target={loaderOptions}
                        propertyKey="createInstances"
                        nullable
                        defaultValue={LoaderOptionDefaults.createInstances}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Enable logging"
                        target={loaderOptions}
                        propertyKey="loggingEnabled"
                        nullable
                        defaultValue={LoaderOptionDefaults.loggingEnabled}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Load all materials"
                        target={loaderOptions}
                        propertyKey="loadAllMaterials"
                        nullable
                        defaultValue={LoaderOptionDefaults.loadAllMaterials}
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
                        label="Transparency as coverage"
                        target={loaderOptions}
                        propertyKey="transparencyAsCoverage"
                        nullable
                        defaultValue={LoaderOptionDefaults.transparencyAsCoverage}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use clip plane"
                        target={loaderOptions}
                        propertyKey="useClipPlane"
                        nullable
                        defaultValue={LoaderOptionDefaults.useClipPlane}
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="Use sRGB buffers"
                        target={loaderOptions}
                        propertyKey="useSRGBBuffers"
                        nullable
                        defaultValue={LoaderOptionDefaults.useSRGBBuffers}
                    />
                </>
            }
        />
    );
};

export const GLTFExtensionOptionsTool: FunctionComponent<{
    extensionOptions: GLTFExtensionOptionsType;
}> = ({ extensionOptions }) => {
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
                </>
            }
        />
    );
};
