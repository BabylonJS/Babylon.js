import { useCallback, useState, useEffect, useRef } from "react";
import type { FunctionComponent } from "react";
import { GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode } from "loaders/glTF/glTFFileLoader";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { IGLTFLoaderService } from "../../../services/panes/tools/gltfLoaderService";
import { useObservableState } from "../../../hooks/observableHooks";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

const AnimationStartModeOptions: DropdownOption<number>[] = [
    { label: "None", value: GLTFLoaderAnimationStartMode.NONE },
    { label: "First", value: GLTFLoaderAnimationStartMode.FIRST },
    { label: "All", value: GLTFLoaderAnimationStartMode.ALL },
];

const CoordinateSystemModeOptions: DropdownOption<number>[] = [
    { label: "Auto", value: GLTFLoaderCoordinateSystemMode.AUTO },
    { label: "Right Handed", value: GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED },
];

/**
 * Displays global loader configuration options in a collapsible section.
 * @param props - Component props including service and current config
 * @returns Loader settings UI
 */
const GLTFGlobalOptions: FunctionComponent<{ gltfLoaderService: IGLTFLoaderService; loaderConfig: ReturnType<IGLTFLoaderService["getLoaderConfig"]> }> = ({
    gltfLoaderService,
    loaderConfig,
}) => {
    return (
        <PropertyLine
            label="Loader Settings"
            expandByDefault={false}
            expandedContent={
                <>
                    <SwitchPropertyLine
                        label="Always compute bounding box"
                        value={loaderConfig.alwaysComputeBoundingBox}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("alwaysComputeBoundingBox", value)}
                    />
                    <SwitchPropertyLine
                        label="Always compute skeleton root node"
                        value={loaderConfig.alwaysComputeSkeletonRootNode}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("alwaysComputeSkeletonRootNode", value)}
                    />
                    <NumberDropdownPropertyLine
                        label="Animation start mode"
                        options={AnimationStartModeOptions}
                        value={loaderConfig.animationStartMode}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("animationStartMode", value)}
                    />
                    <SwitchPropertyLine
                        label="Capture performance counters"
                        value={loaderConfig.capturePerformanceCounters}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("capturePerformanceCounters", value)}
                    />
                    <SwitchPropertyLine
                        label="Compile materials"
                        value={loaderConfig.compileMaterials}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("compileMaterials", value)}
                    />
                    <SwitchPropertyLine
                        label="Compile shadow generators"
                        value={loaderConfig.compileShadowGenerators}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("compileShadowGenerators", value)}
                    />
                    <NumberDropdownPropertyLine
                        label="Coordinate system"
                        options={CoordinateSystemModeOptions}
                        value={loaderConfig.coordinateSystemMode}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("coordinateSystemMode", value)}
                    />
                    <SwitchPropertyLine
                        label="Create instances"
                        value={loaderConfig.createInstances}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("createInstances", value)}
                    />
                    <SwitchPropertyLine
                        label="Enable logging"
                        value={loaderConfig.loggingEnabled}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("loggingEnabled", value)}
                    />
                    <SwitchPropertyLine
                        label="Load all materials"
                        value={loaderConfig.loadAllMaterials}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("loadAllMaterials", value)}
                    />
                    <SyncedSliderPropertyLine
                        label="Target FPS"
                        value={loaderConfig.targetFps}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("targetFps", value)}
                        min={1}
                        max={120}
                        step={1}
                    />
                    <SwitchPropertyLine
                        label="Transparency as coverage"
                        value={loaderConfig.transparencyAsCoverage}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("transparencyAsCoverage", value)}
                    />
                    <SwitchPropertyLine
                        label="Use clip plane"
                        value={loaderConfig.useClipPlane}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("useClipPlane", value)}
                    />
                    <SwitchPropertyLine
                        label="Use sRGB buffers"
                        value={loaderConfig.useSRGBBuffers}
                        onChange={(value) => gltfLoaderService.updateLoaderConfig("useSRGBBuffers", value)}
                    />
                </>
            }
        />
    );
};

/**
 * Displays glTF extension configuration options in a collapsible section.
 * Allows enabling/disabling extensions and configuring extension-specific properties.
 * @param props - Component props including service and extension states
 * @returns Extension settings UI
 */
const GLTFExtensionOptions: FunctionComponent<{ gltfLoaderService: IGLTFLoaderService; extensionStates: ReturnType<IGLTFLoaderService["getExtensionStates"]> }> = ({
    gltfLoaderService,
    extensionStates,
}) => {
    return (
        <>
            <PropertyLine
                label="Extension Settings"
                expandByDefault={false}
                expandedContent={
                    <>
                        <SwitchPropertyLine
                            label="EXT_lights_image_based"
                            value={extensionStates["EXT_lights_image_based"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("EXT_lights_image_based", value)}
                        />
                        <SwitchPropertyLine
                            label="EXT_mesh_gpu_instancing"
                            value={extensionStates["EXT_mesh_gpu_instancing"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("EXT_mesh_gpu_instancing", value)}
                        />
                        <SwitchPropertyLine
                            label="EXT_texture_webp"
                            value={extensionStates["EXT_texture_webp"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("EXT_texture_webp", value)}
                        />
                        <SwitchPropertyLine
                            label="EXT_texture_avif"
                            value={extensionStates["EXT_texture_avif"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("EXT_texture_avif", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_draco_mesh_compression"
                            value={extensionStates["KHR_draco_mesh_compression"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_draco_mesh_compression", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_pbrSpecularGlossiness"
                            value={extensionStates["KHR_materials_pbrSpecularGlossiness"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_pbrSpecularGlossiness", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_clearcoat"
                            value={extensionStates["KHR_materials_clearcoat"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_clearcoat", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_iridescence"
                            value={extensionStates["KHR_materials_iridescence"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_iridescence", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_anisotropy"
                            value={extensionStates["KHR_materials_anisotropy"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_anisotropy", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_emissive_strength"
                            value={extensionStates["KHR_materials_emissive_strength"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_emissive_strength", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_ior"
                            value={extensionStates["KHR_materials_ior"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_ior", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_sheen"
                            value={extensionStates["KHR_materials_sheen"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_sheen", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_specular"
                            value={extensionStates["KHR_materials_specular"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_specular", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_unlit"
                            value={extensionStates["KHR_materials_unlit"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_unlit", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_variants"
                            value={extensionStates["KHR_materials_variants"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_variants", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_transmission"
                            value={extensionStates["KHR_materials_transmission"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_transmission", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_diffuse_transmission"
                            value={extensionStates["KHR_materials_diffuse_transmission"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_diffuse_transmission", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_volume"
                            value={extensionStates["KHR_materials_volume"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_volume", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_dispersion"
                            value={extensionStates["KHR_materials_dispersion"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_dispersion", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_materials_diffuse_roughness"
                            value={extensionStates["KHR_materials_diffuse_roughness"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_materials_diffuse_roughness", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_mesh_quantization"
                            value={extensionStates["KHR_mesh_quantization"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_mesh_quantization", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_lights_punctual"
                            value={extensionStates["KHR_lights_punctual"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_lights_punctual", value)}
                        />
                        <SwitchPropertyLine
                            label="EXT_lights_area"
                            value={extensionStates["EXT_lights_area"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("EXT_lights_area", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_texture_basisu"
                            value={extensionStates["KHR_texture_basisu"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_texture_basisu", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_texture_transform"
                            value={extensionStates["KHR_texture_transform"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_texture_transform", value)}
                        />
                        <SwitchPropertyLine
                            label="KHR_xmp_json_ld"
                            value={extensionStates["KHR_xmp_json_ld"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("KHR_xmp_json_ld", value)}
                        />
                        <SwitchPropertyLine
                            label="MSFT_lod"
                            value={extensionStates["MSFT_lod"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("MSFT_lod", value)}
                        />
                        <Collapse visible={extensionStates["MSFT_lod"].enabled}>
                            <SyncedSliderPropertyLine
                                label="Maximum LODs"
                                value={extensionStates["MSFT_lod"].maxLODsToLoad}
                                onChange={(value) => gltfLoaderService.updateExtensionProperty("MSFT_lod", "maxLODsToLoad", value)}
                                min={1}
                                max={10}
                                step={1}
                            />
                        </Collapse>
                        <SwitchPropertyLine
                            label="MSFT_minecraftMesh"
                            value={extensionStates["MSFT_minecraftMesh"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("MSFT_minecraftMesh", value)}
                        />
                        <SwitchPropertyLine
                            label="MSFT_sRGBFactors"
                            value={extensionStates["MSFT_sRGBFactors"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("MSFT_sRGBFactors", value)}
                        />
                        <SwitchPropertyLine
                            label="MSFT_audio_emitter"
                            value={extensionStates["MSFT_audio_emitter"].enabled}
                            onChange={(value) => gltfLoaderService.updateExtensionState("MSFT_audio_emitter", value)}
                        />
                    </>
                }
            />
        </>
    );
};

/**
 * Main component for glTF loader configuration.
 *
 * This component subscribes to service state via observables and tracks whether
 * the configuration has changed since the last file load. Components in the inspector
 * stay mounted (but hidden) when tabs switch, so we use the service to persist state
 * across the inspector's lifetime while using React state for UI-specific concerns.
 * @param props - Component props
 * @returns The loader configuration UI
 */
export const GLTFLoaderOptions: FunctionComponent<{ gltfLoaderService: IGLTFLoaderService }> = ({ gltfLoaderService }) => {
    const [hasChanges, setHasChanges] = useState(false);
    // Store stringified initial state to efficiently compare for changes
    const initialStateRef = useRef<{ loader: string; extensions: string } | null>(null);

    // Track current state
    const loaderConfig = useObservableState(
        useCallback(() => gltfLoaderService.getLoaderConfig(), [gltfLoaderService]),
        gltfLoaderService.onLoaderConfigChangedObservable
    );

    const extensionStates = useObservableState(
        useCallback(() => gltfLoaderService.getExtensionStates(), [gltfLoaderService]),
        gltfLoaderService.onExtensionConfigChangedObservable
    );

    // Store initial state when file loads
    useEffect(() => {
        const observer = gltfLoaderService.onLoaderActivatedObservable.add(() => {
            initialStateRef.current = {
                loader: JSON.stringify(gltfLoaderService.getLoaderConfig()),
                extensions: JSON.stringify(gltfLoaderService.getExtensionStates()),
            };
            setHasChanges(false);
        });

        return () => observer.remove();
    }, [gltfLoaderService]);

    // Compare current state with initial state to determine if reload message should be shown
    // Using JSON.stringify for deep equality check since these are complex nested objects
    useEffect(() => {
        if (!initialStateRef.current) {
            return;
        }

        const currentLoader = JSON.stringify(loaderConfig);
        const currentExtensions = JSON.stringify(extensionStates);

        const isDifferent = currentLoader !== initialStateRef.current.loader || currentExtensions !== initialStateRef.current.extensions;
        setHasChanges(isDifferent);
    }, [loaderConfig, extensionStates]);

    return (
        <>
            {hasChanges && <MessageBar intent="info" title="" message="Reload the file for changes to take effect" />}
            <GLTFGlobalOptions gltfLoaderService={gltfLoaderService} loaderConfig={loaderConfig} />
            <GLTFExtensionOptions gltfLoaderService={gltfLoaderService} extensionStates={extensionStates} />
        </>
    );
};
