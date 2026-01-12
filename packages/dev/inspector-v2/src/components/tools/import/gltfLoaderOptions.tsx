import type { FunctionComponent } from "react";
import { GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode } from "loaders/glTF/glTFFileLoader";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";
import type { GLTFExtensionOptionsType, GLTFLoaderOptionsType } from "../../../services/panes/tools/import/gltfLoaderOptionsService";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { tokens } from "@fluentui/react-components";

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
export const GLTFLoaderOptions: FunctionComponent<{
    loaderOptions: GLTFLoaderOptionsType;
    updateLoaderOption: <K extends keyof GLTFLoaderOptionsType>(key: K, value: GLTFLoaderOptionsType[K]) => void;
}> = ({ loaderOptions, updateLoaderOption }) => {
    return (
        <PropertyLine
            label="Loader Options"
            expandByDefault={false}
            expandedContent={
                <div style={{ paddingLeft: tokens.spacingHorizontalM }}>
                    <SwitchPropertyLine
                        label="Always compute bounding box"
                        value={loaderOptions.alwaysComputeBoundingBox}
                        onChange={(value) => updateLoaderOption("alwaysComputeBoundingBox", value)}
                    />
                    <SwitchPropertyLine
                        label="Always compute skeleton root node"
                        value={loaderOptions.alwaysComputeSkeletonRootNode}
                        onChange={(value) => updateLoaderOption("alwaysComputeSkeletonRootNode", value)}
                    />
                    <NumberDropdownPropertyLine
                        label="Animation start mode"
                        options={AnimationStartModeOptions}
                        value={loaderOptions.animationStartMode}
                        onChange={(value) => updateLoaderOption("animationStartMode", value)}
                    />
                    <SwitchPropertyLine
                        label="Capture performance counters"
                        value={loaderOptions.capturePerformanceCounters}
                        onChange={(value) => updateLoaderOption("capturePerformanceCounters", value)}
                    />
                    <SwitchPropertyLine label="Compile materials" value={loaderOptions.compileMaterials} onChange={(value) => updateLoaderOption("compileMaterials", value)} />
                    <SwitchPropertyLine
                        label="Compile shadow generators"
                        value={loaderOptions.compileShadowGenerators}
                        onChange={(value) => updateLoaderOption("compileShadowGenerators", value)}
                    />
                    <NumberDropdownPropertyLine
                        label="Coordinate system"
                        options={CoordinateSystemModeOptions}
                        value={loaderOptions.coordinateSystemMode}
                        onChange={(value) => updateLoaderOption("coordinateSystemMode", value)}
                    />
                    <SwitchPropertyLine label="Create instances" value={loaderOptions.createInstances} onChange={(value) => updateLoaderOption("createInstances", value)} />
                    <SwitchPropertyLine label="Enable logging" value={loaderOptions.loggingEnabled} onChange={(value) => updateLoaderOption("loggingEnabled", value)} />
                    <SwitchPropertyLine label="Load all materials" value={loaderOptions.loadAllMaterials} onChange={(value) => updateLoaderOption("loadAllMaterials", value)} />
                    <SyncedSliderPropertyLine
                        label="Target FPS"
                        value={loaderOptions.targetFps}
                        onChange={(value) => updateLoaderOption("targetFps", value)}
                        min={1}
                        max={120}
                        step={1}
                    />
                    <SwitchPropertyLine
                        label="Transparency as coverage"
                        value={loaderOptions.transparencyAsCoverage}
                        onChange={(value) => updateLoaderOption("transparencyAsCoverage", value)}
                    />
                    <SwitchPropertyLine label="Use clip plane" value={loaderOptions.useClipPlane} onChange={(value) => updateLoaderOption("useClipPlane", value)} />
                    <SwitchPropertyLine label="Use sRGB buffers" value={loaderOptions.useSRGBBuffers} onChange={(value) => updateLoaderOption("useSRGBBuffers", value)} />
                </div>
            }
        />
    );
};

/**
 * Displays glTF extension configuration options in a collapsible section.
 * Allows enabling/disabling extensions and configuring extension-specific properties.
 * @param props - Component props including service and extension states
 * @returns Extension options UI
 */
export const GLTFExtensionOptions: FunctionComponent<{
    extensionOptions: GLTFExtensionOptionsType;
    updateExtensionOption: <T extends keyof GLTFExtensionOptionsType, K extends keyof GLTFExtensionOptionsType[T]>(
        extensionName: T,
        key: K,
        value: GLTFExtensionOptionsType[T][K]
    ) => void;
}> = ({ extensionOptions, updateExtensionOption }) => {
    return (
        <PropertyLine
            label="Extension Options"
            expandByDefault={false}
            expandedContent={
                <div style={{ paddingLeft: tokens.spacingHorizontalM }}>
                    <SwitchPropertyLine
                        label="EXT_lights_image_based"
                        value={extensionOptions["EXT_lights_image_based"].enabled}
                        onChange={(value) => {
                            updateExtensionOption("EXT_lights_image_based", "enabled", value);
                        }}
                    />
                    <SwitchPropertyLine
                        label="EXT_mesh_gpu_instancing"
                        value={extensionOptions["EXT_mesh_gpu_instancing"].enabled}
                        onChange={(value) => updateExtensionOption("EXT_mesh_gpu_instancing", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="EXT_texture_webp"
                        value={extensionOptions["EXT_texture_webp"].enabled}
                        onChange={(value) => updateExtensionOption("EXT_texture_webp", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="EXT_texture_avif"
                        value={extensionOptions["EXT_texture_avif"].enabled}
                        onChange={(value) => updateExtensionOption("EXT_texture_avif", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_draco_mesh_compression"
                        value={extensionOptions["KHR_draco_mesh_compression"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_draco_mesh_compression", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_pbrSpecularGlossiness"
                        value={extensionOptions["KHR_materials_pbrSpecularGlossiness"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_pbrSpecularGlossiness", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_clearcoat"
                        value={extensionOptions["KHR_materials_clearcoat"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_clearcoat", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_iridescence"
                        value={extensionOptions["KHR_materials_iridescence"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_iridescence", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_anisotropy"
                        value={extensionOptions["KHR_materials_anisotropy"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_anisotropy", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_emissive_strength"
                        value={extensionOptions["KHR_materials_emissive_strength"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_emissive_strength", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_ior"
                        value={extensionOptions["KHR_materials_ior"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_ior", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_sheen"
                        value={extensionOptions["KHR_materials_sheen"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_sheen", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_specular"
                        value={extensionOptions["KHR_materials_specular"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_specular", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_unlit"
                        value={extensionOptions["KHR_materials_unlit"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_unlit", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_variants"
                        value={extensionOptions["KHR_materials_variants"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_variants", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_transmission"
                        value={extensionOptions["KHR_materials_transmission"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_transmission", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_diffuse_transmission"
                        value={extensionOptions["KHR_materials_diffuse_transmission"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_diffuse_transmission", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_volume"
                        value={extensionOptions["KHR_materials_volume"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_volume", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_dispersion"
                        value={extensionOptions["KHR_materials_dispersion"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_dispersion", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_materials_diffuse_roughness"
                        value={extensionOptions["KHR_materials_diffuse_roughness"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_materials_diffuse_roughness", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_mesh_quantization"
                        value={extensionOptions["KHR_mesh_quantization"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_mesh_quantization", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_lights_punctual"
                        value={extensionOptions["KHR_lights_punctual"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_lights_punctual", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="EXT_lights_area"
                        value={extensionOptions["EXT_lights_area"].enabled}
                        onChange={(value) => updateExtensionOption("EXT_lights_area", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_texture_basisu"
                        value={extensionOptions["KHR_texture_basisu"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_texture_basisu", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_texture_transform"
                        value={extensionOptions["KHR_texture_transform"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_texture_transform", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="KHR_xmp_json_ld"
                        value={extensionOptions["KHR_xmp_json_ld"].enabled}
                        onChange={(value) => updateExtensionOption("KHR_xmp_json_ld", "enabled", value)}
                    />
                    <SwitchPropertyLine label="MSFT_lod" value={extensionOptions["MSFT_lod"].enabled} onChange={(value) => updateExtensionOption("MSFT_lod", "enabled", value)} />
                    <Collapse visible={extensionOptions["MSFT_lod"].enabled}>
                        <div style={{ paddingLeft: tokens.spacingHorizontalM }}>
                            <SyncedSliderPropertyLine
                                label="Maximum LODs"
                                value={extensionOptions["MSFT_lod"].maxLODsToLoad}
                                onChange={(value) => updateExtensionOption("MSFT_lod", "maxLODsToLoad", value)}
                                min={1}
                                max={10}
                                step={1}
                            />
                        </div>
                    </Collapse>
                    <SwitchPropertyLine
                        label="MSFT_minecraftMesh"
                        value={extensionOptions["MSFT_minecraftMesh"].enabled}
                        onChange={(value) => updateExtensionOption("MSFT_minecraftMesh", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="MSFT_sRGBFactors"
                        value={extensionOptions["MSFT_sRGBFactors"].enabled}
                        onChange={(value) => updateExtensionOption("MSFT_sRGBFactors", "enabled", value)}
                    />
                    <SwitchPropertyLine
                        label="MSFT_audio_emitter"
                        value={extensionOptions["MSFT_audio_emitter"].enabled}
                        onChange={(value) => updateExtensionOption("MSFT_audio_emitter", "enabled", value)}
                    />
                </div>
            }
        />
    );
};

// /**
//  * Main component for glTF loader configuration.
//  *
//  * This component subscribes to service state via observables and tracks whether
//  * the configuration has changed since the last file load. Components in the inspector
//  * stay mounted (but hidden) when tabs switch, so we use the service to persist state
//  * across the inspector's lifetime while using React state for UI-specific concerns.
//  * @param props - Component props
//  * @returns The loader configuration UI
//  */
// export const GLTFLoaderOptions: FunctionComponent<{ gltfLoaderService: IGLTFLoaderService }> = ({ gltfLoaderService }) => {
//     const [hasChanges, setHasChanges] = useState(false);
//     // Store stringified initial state to efficiently compare for changes
//     const initialStateRef = useRef<{ loader: string; extensions: string } | null>(null);

//     // Track current state
//     const loaderConfig = useObservableState(
//         useCallback(() => gltfLoaderService.getLoaderConfig(), [gltfLoaderService]),
//         gltfLoaderService.onLoaderConfigChangedObservable
//     );

//     const extensionOptions = useObservableState(
//         useCallback(() => gltfLoaderService.getextensionOptions(), [gltfLoaderService]),
//         gltfLoaderService.onExtensionConfigChangedObservable
//     );

//     // Store initial state when file loads
//     useEffect(() => {
//         const observer = gltfLoaderService.onLoaderActivatedObservable.add(() => {
//             initialStateRef.current = {
//                 loader: JSON.stringify(gltfLoaderService.getLoaderConfig()),
//                 extensions: JSON.stringify(gltfLoaderService.getextensionOptions()),
//             };
//             setHasChanges(false);
//         });

//         return () => observer.remove();
//     }, [gltfLoaderService]);

//     // Compare current state with initial state to determine if reload message should be shown
//     // Using JSON.stringify for deep equality check since these are complex nested objects
//     useEffect(() => {
//         if (!initialStateRef.current) {
//             return;
//         }

//         const currentLoader = JSON.stringify(loaderConfig);
//         const currentExtensions = JSON.stringify(extensionOptions);

//         const isDifferent = currentLoader !== initialStateRef.current.loader || currentExtensions !== initialStateRef.current.extensions;
//         setHasChanges(isDifferent);
//     }, [loaderConfig, extensionOptions]);

//     return (
//         <>
//             {hasChanges && <MessageBar intent="info" title="" message="Reload the file for changes to take effect" />}
//             <GLTFGlobalOptions gltfLoaderService={gltfLoaderService} loaderConfig={loaderConfig} />
//             <GLTFExtensionOptions gltfLoaderService={gltfLoaderService} extensionOptions={extensionOptions} />
//         </>
//     );
// };
