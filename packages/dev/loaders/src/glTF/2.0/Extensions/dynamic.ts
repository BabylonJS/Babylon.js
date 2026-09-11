/* eslint-disable @typescript-eslint/naming-convention */

import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

/**
 * Registers the built-in glTF 2.0 extension async factories, which dynamically imports and loads each glTF extension on demand (e.g. only when a glTF model uses the extension).
 */
export function registerBuiltInGLTFExtensions() {
    unregisterGLTFExtension("EXT_lights_image_based");
    registerGLTFExtension("EXT_lights_image_based", true, async (loader) => {
        const { EXT_lights_image_based } = await import("./EXT_lights_image_based.pure");
        return new EXT_lights_image_based(loader);
    });

    unregisterGLTFExtension("EXT_mesh_gpu_instancing");
    registerGLTFExtension("EXT_mesh_gpu_instancing", true, async (loader) => {
        const [{ EXT_mesh_gpu_instancing }, { RegisterThinInstanceMesh }] = await Promise.all([
            import("./EXT_mesh_gpu_instancing.pure"),
            import("core/Meshes/thinInstanceMesh.pure"),
        ]);
        RegisterThinInstanceMesh();
        return new EXT_mesh_gpu_instancing(loader);
    });

    unregisterGLTFExtension("EXT_meshopt_compression");
    registerGLTFExtension("EXT_meshopt_compression", true, async (loader) => {
        const { EXT_meshopt_compression } = await import("./EXT_meshopt_compression.pure");
        return new EXT_meshopt_compression(loader);
    });

    unregisterGLTFExtension("EXT_texture_avif");
    registerGLTFExtension("EXT_texture_avif", true, async (loader) => {
        const { EXT_texture_avif } = await import("./EXT_texture_avif.pure");
        return new EXT_texture_avif(loader);
    });

    unregisterGLTFExtension("EXT_texture_webp");
    registerGLTFExtension("EXT_texture_webp", true, async (loader) => {
        const { EXT_texture_webp } = await import("./EXT_texture_webp.pure");
        return new EXT_texture_webp(loader);
    });

    unregisterGLTFExtension("ExtrasAsMetadata");
    registerGLTFExtension("ExtrasAsMetadata", false, async (loader) => {
        const { ExtrasAsMetadata } = await import("./ExtrasAsMetadata.pure");
        return new ExtrasAsMetadata(loader);
    });

    unregisterGLTFExtension("KHR_animation_pointer");
    registerGLTFExtension("KHR_animation_pointer", true, async (loader) => {
        const [{ KHR_animation_pointer }, { _RegisterKHRAnimationPointerData }] = await Promise.all([
            import("./KHR_animation_pointer.pure"),
            import("./KHR_animation_pointer.data.pure"),
        ]);
        _RegisterKHRAnimationPointerData();
        return new KHR_animation_pointer(loader);
    });

    unregisterGLTFExtension("KHR_draco_mesh_compression");
    registerGLTFExtension("KHR_draco_mesh_compression", true, async (loader) => {
        const { KHR_draco_mesh_compression } = await import("./KHR_draco_mesh_compression.pure");
        return new KHR_draco_mesh_compression(loader);
    });

    unregisterGLTFExtension("KHR_gaussian_splatting");
    registerGLTFExtension("KHR_gaussian_splatting", true, async (loader) => {
        const { KHR_gaussian_splatting } = await import("./KHR_gaussian_splatting.pure");
        return new KHR_gaussian_splatting(loader);
    });

    unregisterGLTFExtension("KHR_interactivity");
    registerGLTFExtension("KHR_interactivity", true, async (loader) => {
        const { KHR_interactivity, _RegisterKHRInteractivityRuntime } = await import("./KHR_interactivity.pure");
        _RegisterKHRInteractivityRuntime();
        return new KHR_interactivity(loader);
    });

    unregisterGLTFExtension("KHR_lights_punctual");
    registerGLTFExtension("KHR_lights_punctual", true, async (loader) => {
        const { KHR_lights } = await import("./KHR_lights_punctual.pure");
        return new KHR_lights(loader);
    });

    unregisterGLTFExtension("EXT_lights_area");
    registerGLTFExtension("EXT_lights_area", true, async (loader) => {
        const { EXT_lights_area } = await import("./EXT_lights_area.pure");
        return new EXT_lights_area(loader);
    });

    unregisterGLTFExtension("EXT_lights_ies");
    registerGLTFExtension("EXT_lights_ies", true, async (loader) => {
        const { EXT_lights_ies } = await import("./EXT_lights_ies.pure");
        return new EXT_lights_ies(loader);
    });

    unregisterGLTFExtension("KHR_materials_anisotropy");
    registerGLTFExtension("KHR_materials_anisotropy", true, async (loader) => {
        const { KHR_materials_anisotropy } = await import("./KHR_materials_anisotropy.pure");
        return new KHR_materials_anisotropy(loader);
    });

    unregisterGLTFExtension("KHR_materials_clearcoat");
    registerGLTFExtension("KHR_materials_clearcoat", true, async (loader) => {
        const { KHR_materials_clearcoat } = await import("./KHR_materials_clearcoat.pure");
        return new KHR_materials_clearcoat(loader);
    });

    unregisterGLTFExtension("KHR_materials_diffuse_roughness");
    registerGLTFExtension("KHR_materials_diffuse_roughness", true, async (loader) => {
        const { KHR_materials_diffuse_roughness } = await import("./KHR_materials_diffuse_roughness.pure");
        return new KHR_materials_diffuse_roughness(loader);
    });

    unregisterGLTFExtension("KHR_materials_diffuse_transmission");
    registerGLTFExtension("KHR_materials_diffuse_transmission", true, async (loader) => {
        const { KHR_materials_diffuse_transmission } = await import("./KHR_materials_diffuse_transmission.pure");
        return new KHR_materials_diffuse_transmission(loader);
    });

    unregisterGLTFExtension("KHR_materials_dispersion");
    registerGLTFExtension("KHR_materials_dispersion", true, async (loader) => {
        const { KHR_materials_dispersion } = await import("./KHR_materials_dispersion.pure");
        return new KHR_materials_dispersion(loader);
    });

    unregisterGLTFExtension("KHR_materials_emissive_strength");
    registerGLTFExtension("KHR_materials_emissive_strength", true, async (loader) => {
        const { KHR_materials_emissive_strength } = await import("./KHR_materials_emissive_strength.pure");
        return new KHR_materials_emissive_strength(loader);
    });

    unregisterGLTFExtension("KHR_materials_ior");
    registerGLTFExtension("KHR_materials_ior", true, async (loader) => {
        const { KHR_materials_ior } = await import("./KHR_materials_ior.pure");
        return new KHR_materials_ior(loader);
    });

    unregisterGLTFExtension("KHR_materials_iridescence");
    registerGLTFExtension("KHR_materials_iridescence", true, async (loader) => {
        const { KHR_materials_iridescence } = await import("./KHR_materials_iridescence.pure");
        return new KHR_materials_iridescence(loader);
    });

    unregisterGLTFExtension("KHR_materials_pbrSpecularGlossiness");
    registerGLTFExtension("KHR_materials_pbrSpecularGlossiness", true, async (loader) => {
        const { KHR_materials_pbrSpecularGlossiness } = await import("./KHR_materials_pbrSpecularGlossiness.pure");
        return new KHR_materials_pbrSpecularGlossiness(loader);
    });

    unregisterGLTFExtension("KHR_materials_sheen");
    registerGLTFExtension("KHR_materials_sheen", true, async (loader) => {
        const { KHR_materials_sheen } = await import("./KHR_materials_sheen.pure");
        return new KHR_materials_sheen(loader);
    });

    unregisterGLTFExtension("KHR_materials_specular");
    registerGLTFExtension("KHR_materials_specular", true, async (loader) => {
        const { KHR_materials_specular } = await import("./KHR_materials_specular.pure");
        return new KHR_materials_specular(loader);
    });

    unregisterGLTFExtension("KHR_materials_transmission");
    registerGLTFExtension("KHR_materials_transmission", true, async (loader) => {
        const { KHR_materials_transmission } = await import("./KHR_materials_transmission.pure");
        return new KHR_materials_transmission(loader);
    });

    unregisterGLTFExtension("KHR_materials_unlit");
    registerGLTFExtension("KHR_materials_unlit", true, async (loader) => {
        const { KHR_materials_unlit } = await import("./KHR_materials_unlit.pure");
        return new KHR_materials_unlit(loader);
    });

    unregisterGLTFExtension("KHR_materials_variants");
    registerGLTFExtension("KHR_materials_variants", true, async (loader) => {
        const { KHR_materials_variants } = await import("./KHR_materials_variants.pure");
        return new KHR_materials_variants(loader);
    });

    unregisterGLTFExtension("KHR_materials_volume");
    registerGLTFExtension("KHR_materials_volume", true, async (loader) => {
        const { KHR_materials_volume } = await import("./KHR_materials_volume.pure");
        return new KHR_materials_volume(loader);
    });

    unregisterGLTFExtension("KHR_mesh_quantization");
    registerGLTFExtension("KHR_mesh_quantization", true, async (loader) => {
        const { KHR_mesh_quantization } = await import("./KHR_mesh_quantization.pure");
        return new KHR_mesh_quantization(loader);
    });

    unregisterGLTFExtension("KHR_texture_basisu");
    registerGLTFExtension("KHR_texture_basisu", true, async (loader) => {
        const { KHR_texture_basisu } = await import("./KHR_texture_basisu.pure");
        return new KHR_texture_basisu(loader);
    });

    unregisterGLTFExtension("KHR_texture_transform");
    registerGLTFExtension("KHR_texture_transform", true, async (loader) => {
        const { KHR_texture_transform } = await import("./KHR_texture_transform.pure");
        return new KHR_texture_transform(loader);
    });

    unregisterGLTFExtension("KHR_xmp_json_ld");
    registerGLTFExtension("KHR_xmp_json_ld", true, async (loader) => {
        const { KHR_xmp_json_ld } = await import("./KHR_xmp_json_ld.pure");
        return new KHR_xmp_json_ld(loader);
    });

    unregisterGLTFExtension("MSFT_audio_emitter");
    registerGLTFExtension("MSFT_audio_emitter", true, async (loader) => {
        const [{ MSFT_audio_emitter }, { RegisterAudioSceneComponent }, { Sound }] = await Promise.all([
            import("./MSFT_audio_emitter.pure"),
            import("core/Audio/audioSceneComponent.pure"),
            import("core/Audio/sound.pure"),
        ]);
        RegisterAudioSceneComponent(Sound);
        return new MSFT_audio_emitter(loader);
    });

    unregisterGLTFExtension("MSFT_lod");
    registerGLTFExtension("MSFT_lod", true, async (loader) => {
        const { MSFT_lod } = await import("./MSFT_lod.pure");
        return new MSFT_lod(loader);
    });

    unregisterGLTFExtension("MSFT_minecraftMesh");
    registerGLTFExtension("MSFT_minecraftMesh", true, async (loader) => {
        const { MSFT_minecraftMesh } = await import("./MSFT_minecraftMesh.pure");
        return new MSFT_minecraftMesh(loader);
    });

    unregisterGLTFExtension("MSFT_sRGBFactors");
    registerGLTFExtension("MSFT_sRGBFactors", true, async (loader) => {
        const { MSFT_sRGBFactors } = await import("./MSFT_sRGBFactors.pure");
        return new MSFT_sRGBFactors(loader);
    });

    unregisterGLTFExtension("KHR_node_visibility");
    registerGLTFExtension("KHR_node_visibility", true, async (loader) => {
        const { KHR_node_visibility, _RegisterKHRNodeVisibilityRuntime } = await import("./KHR_node_visibility.pure");
        _RegisterKHRNodeVisibilityRuntime();
        return new KHR_node_visibility(loader);
    });

    unregisterGLTFExtension("KHR_node_hoverability");
    registerGLTFExtension("KHR_node_hoverability", true, async (loader) => {
        const { KHR_node_hoverability, _RegisterKHRNodeHoverabilityRuntime } = await import("./KHR_node_hoverability.pure");
        _RegisterKHRNodeHoverabilityRuntime();
        return new KHR_node_hoverability(loader);
    });

    unregisterGLTFExtension("KHR_node_selectability");
    registerGLTFExtension("KHR_node_selectability", true, async (loader) => {
        const { KHR_node_selectability, _RegisterKHRNodeSelectabilityRuntime } = await import("./KHR_node_selectability.pure");
        _RegisterKHRNodeSelectabilityRuntime();
        return new KHR_node_selectability(loader);
    });

    unregisterGLTFExtension("KHR_materials_coat");
    registerGLTFExtension("KHR_materials_coat", true, async (loader) => {
        const { KHR_materials_coat } = await import("./KHR_materials_coat.pure");
        return new KHR_materials_coat(loader);
    });

    unregisterGLTFExtension("KHR_materials_fuzz");
    registerGLTFExtension("KHR_materials_fuzz", true, async (loader) => {
        const { KHR_materials_fuzz } = await import("./KHR_materials_fuzz.pure");
        return new KHR_materials_fuzz(loader);
    });

    unregisterGLTFExtension("KHR_materials_volume_scatter");
    registerGLTFExtension("KHR_materials_volume_scatter", true, async (loader) => {
        const { KHR_materials_volume_scatter } = await import("./KHR_materials_volume_scatter.pure");
        return new KHR_materials_volume_scatter(loader);
    });

    unregisterGLTFExtension("KHR_materials_scatter");
    registerGLTFExtension("KHR_materials_scatter", true, async (loader) => {
        const { KHR_materials_scatter } = await import("./KHR_materials_scatter");
        return new KHR_materials_scatter(loader);
    });
}
