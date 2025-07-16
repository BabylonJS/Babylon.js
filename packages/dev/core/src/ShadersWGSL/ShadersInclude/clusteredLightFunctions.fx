struct ClusteredLight {
	position: vec4f,
	direction: vec4f,
	diffuse: vec4f,
	specular: vec4f,
	falloff: vec4f,
}

fn tileMaskIndex(lightData: vec4f, fragPos: vec4f) -> u32 {
    let uData = vec3u(lightData.xyz);
    let tilePos = vec2u(fragPos.xy) / uData.xy;
    return tilePos.y * uData.z + tilePos.x;
}
