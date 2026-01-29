import type { FunctionComponent } from "react";
import { GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode } from "loaders/glTF/glTFFileLoader";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { GLTFExtensionOptionsType, GLTFLoaderOptionsType } from "../../../services/panes/tools/import/gltfLoaderOptionsService";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
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
                    <BoundProperty component={SwitchPropertyLine} label="Always compute bounding box" target={loaderOptions} propertyKey="alwaysComputeBoundingBox" />
                    <BoundProperty component={SwitchPropertyLine} label="Always compute skeleton root node" target={loaderOptions} propertyKey="alwaysComputeSkeletonRootNode" />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Animation start mode"
                        options={AnimationStartModeOptions}
                        target={loaderOptions}
                        propertyKey="animationStartMode"
                    />
                    <BoundProperty component={SwitchPropertyLine} label="Capture performance counters" target={loaderOptions} propertyKey="capturePerformanceCounters" />
                    <BoundProperty component={SwitchPropertyLine} label="Compile materials" target={loaderOptions} propertyKey="compileMaterials" />
                    <BoundProperty component={SwitchPropertyLine} label="Compile shadow generators" target={loaderOptions} propertyKey="compileShadowGenerators" />
                    <BoundProperty
                        component={NumberDropdownPropertyLine}
                        label="Coordinate system"
                        options={CoordinateSystemModeOptions}
                        target={loaderOptions}
                        propertyKey="coordinateSystemMode"
                    />
                    <BoundProperty component={SwitchPropertyLine} label="Create instances" target={loaderOptions} propertyKey="createInstances" />
                    <BoundProperty component={SwitchPropertyLine} label="Enable logging" target={loaderOptions} propertyKey="loggingEnabled" />
                    <BoundProperty component={SwitchPropertyLine} label="Load all materials" target={loaderOptions} propertyKey="loadAllMaterials" />
                    <BoundProperty component={SyncedSliderPropertyLine} label="Target FPS" target={loaderOptions} propertyKey="targetFps" min={1} max={120} step={1} />
                    <BoundProperty component={SwitchPropertyLine} label="Transparency as coverage" target={loaderOptions} propertyKey="transparencyAsCoverage" />
                    <BoundProperty component={SwitchPropertyLine} label="Use clip plane" target={loaderOptions} propertyKey="useClipPlane" />
                    <BoundProperty component={SwitchPropertyLine} label="Use sRGB buffers" target={loaderOptions} propertyKey="useSRGBBuffers" />
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
                    {Object.entries(extensionOptions).map(([extensionName, options]) => {
                        return (
                            <BoundProperty
                                key={extensionName}
                                component={SwitchPropertyLine}
                                label={extensionName}
                                target={options}
                                propertyKey="enabled"
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
