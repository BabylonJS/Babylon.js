struct SpotLight {
    vLightData: vec4f,
    vLightDiffuse: vec4f,
    vLightSpecular: vec4f,
    vLightDirection: vec4f,
    vLightFalloff: vec4f,
}

fn getClusteredSpotLight(lightDataTexture: texture_2d<f32>, index: u32) -> SpotLight {
    return SpotLight(
        textureLoad(lightDataTexture, vec2u(0, index), 0),
        textureLoad(lightDataTexture, vec2u(1, index), 0),
        textureLoad(lightDataTexture, vec2u(2, index), 0),
        textureLoad(lightDataTexture, vec2u(3, index), 0),
        textureLoad(lightDataTexture, vec2u(4, index), 0)
    );
}
