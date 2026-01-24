import type { FunctionComponent } from "react";
import { GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode } from "loaders/glTF/glTFFileLoader";
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import type { GLTFExtensionOptionsType, GLTFLoaderOptionsType } from "../../../services/panes/tools/import/gltfLoaderOptionsService";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { tokens } from "@fluentui/react-components";
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
            indentExpandedContent={true}
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
                <div style={{ paddingLeft: tokens.spacingHorizontalM }}>
                    <BoundProperty
                        label="EXT_lights_image_based"
                        component={SwitchPropertyLine}
                        key="EXT_lights_image_based_enabled"
                        target={extensionOptions["EXT_lights_image_based"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty
                        label="EXT_mesh_gpu_instancing"
                        component={SwitchPropertyLine}
                        key="EXT_mesh_gpu_instancing_enabled"
                        target={extensionOptions["EXT_mesh_gpu_instancing"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty component={SwitchPropertyLine} label="EXT_texture_webp" target={extensionOptions["EXT_texture_webp"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="EXT_texture_avif" target={extensionOptions["EXT_texture_avif"]} propertyKey="enabled" />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="KHR_draco_mesh_compression"
                        target={extensionOptions["KHR_draco_mesh_compression"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="KHR_materials_pbrSpecularGlossiness"
                        target={extensionOptions["KHR_materials_pbrSpecularGlossiness"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_clearcoat" target={extensionOptions["KHR_materials_clearcoat"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_iridescence" target={extensionOptions["KHR_materials_iridescence"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_anisotropy" target={extensionOptions["KHR_materials_anisotropy"]} propertyKey="enabled" />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="KHR_materials_emissive_strength"
                        target={extensionOptions["KHR_materials_emissive_strength"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_ior" target={extensionOptions["KHR_materials_ior"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_sheen" target={extensionOptions["KHR_materials_sheen"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_specular" target={extensionOptions["KHR_materials_specular"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_unlit" target={extensionOptions["KHR_materials_unlit"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_materials_variants" target={extensionOptions["KHR_materials_variants"]} propertyKey="enabled" />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        key="KHR_materials_transmission"
                        label="KHR_materials_transmission"
                        target={extensionOptions["KHR_materials_transmission"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="KHR_materials_diffuse_transmission"
                        target={extensionOptions["KHR_materials_diffuse_transmission"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        key="KHR_materials_volume"
                        label="KHR_materials_volume"
                        target={extensionOptions["KHR_materials_volume"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        key="KHR_materials_dispersion"
                        label="KHR_materials_dispersion"
                        target={extensionOptions["KHR_materials_dispersion"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty
                        component={SwitchPropertyLine}
                        label="KHR_materials_diffuse_roughness"
                        target={extensionOptions["KHR_materials_diffuse_roughness"]}
                        propertyKey="enabled"
                    />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_mesh_quantization" target={extensionOptions["KHR_mesh_quantization"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_lights_punctual" target={extensionOptions["KHR_lights_punctual"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="EXT_lights_area" target={extensionOptions["EXT_lights_area"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_texture_basisu" target={extensionOptions["KHR_texture_basisu"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_texture_transform" target={extensionOptions["KHR_texture_transform"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="KHR_xmp_json_ld" target={extensionOptions["KHR_xmp_json_ld"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="MSFT_lod" target={extensionOptions["MSFT_lod"]} propertyKey="enabled" />
                    <div style={{ paddingLeft: tokens.spacingHorizontalM }}>
                        <BoundProperty
                            component={SyncedSliderPropertyLine}
                            label="Maximum LODs"
                            target={extensionOptions["MSFT_lod"]}
                            propertyKey="maxLODsToLoad"
                            min={1}
                            max={10}
                            step={1}
                        />
                    </div>
                    <BoundProperty component={SwitchPropertyLine} label="MSFT_minecraftMesh" target={extensionOptions["MSFT_minecraftMesh"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="MSFT_sRGBFactors" target={extensionOptions["MSFT_sRGBFactors"]} propertyKey="enabled" />
                    <BoundProperty component={SwitchPropertyLine} label="MSFT_audio_emitter" target={extensionOptions["MSFT_audio_emitter"]} propertyKey="enabled" />
                </div>
            }
        />
    );
};
