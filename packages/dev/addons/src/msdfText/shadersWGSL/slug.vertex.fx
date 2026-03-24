// Slug GPU Font - Vertex Shader (WGSL)
//
// Based on Eric Lengyel's Slug algorithm.
// Performs dynamic vertex dilation and transforms glyph quads.

// Vertex attributes (5 × vec4 = 80 bytes per vertex)
attribute slugPos: vec4f;   // object-space position (xy) + normal (zw)
attribute slugTex: vec4f;   // em-space coords (xy) + glyph location (zw) as float
attribute slugMet: vec4f;   // bandMaxX, bandMaxY, invScale, flags
attribute slugBnd: vec4f;   // bandScaleX, bandScaleY, bandOffsetX, bandOffsetY
attribute slugCol: vec4f;   // vertex color RGBA

// Uniforms
uniform slugMatrix: mat4x4f;    // MVP matrix
uniform slugViewport: vec4f;     // (viewportWidth, viewportHeight, 0, 0)

// Varyings
varying vColor: vec4f;
varying vTexcoord: vec2f;
flat varying vBanding: vec4f;
flat varying vGlyph: vec4f;

@vertex
fn main(input: VertexInputs) -> FragmentInputs {
    let pos = input.slugPos.xy;
    let normal = input.slugPos.zw;
    let tex = input.slugTex.xy;
    let invScale = input.slugMet.z;
    let jac = vec4f(invScale, 0.0, 0.0, invScale);

    // Extract MVP matrix rows from column-major storage
    let row0 = vec4f(uniforms.slugMatrix[0].x, uniforms.slugMatrix[1].x, uniforms.slugMatrix[2].x, uniforms.slugMatrix[3].x);
    let row1 = vec4f(uniforms.slugMatrix[0].y, uniforms.slugMatrix[1].y, uniforms.slugMatrix[2].y, uniforms.slugMatrix[3].y);
    let row3 = vec4f(uniforms.slugMatrix[0].w, uniforms.slugMatrix[1].w, uniforms.slugMatrix[2].w, uniforms.slugMatrix[3].w);

    // Dynamic dilation (SlugDilate)
    let n = normalize(normal);
    let s = dot(row3.xy, pos) + row3.w;
    let t_val = dot(row3.xy, n);

    let u = (s * dot(row0.xy, n) - t_val * (dot(row0.xy, pos) + row0.w)) * uniforms.slugViewport.x;
    let v = (s * dot(row1.xy, n) - t_val * (dot(row1.xy, pos) + row1.w)) * uniforms.slugViewport.y;

    let s2 = s * s;
    let st = s * t_val;
    let uv = u * u + v * v;
    let d = normal * (s2 * (st + sqrt(uv)) / (uv - st * st));

    let dilatedPos = pos + d;
    let dilatedTex = vec2f(tex.x + dot(d, jac.xy), tex.y + dot(d, jac.zw));

    // Transform dilated position with MVP
    vertexOutputs.position = uniforms.slugMatrix * vec4f(dilatedPos, 0.0, 1.0);

    // Pass varyings
    vertexOutputs.vTexcoord = dilatedTex;
    vertexOutputs.vBanding = input.slugBnd;
    vertexOutputs.vGlyph = vec4f(input.slugTex.zw, input.slugMet.xy);
    vertexOutputs.vColor = input.slugCol;
}
