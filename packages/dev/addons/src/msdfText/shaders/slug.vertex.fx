// Slug GPU Font - Vertex Shader (GLSL)
//
// Based on Eric Lengyel's Slug algorithm.
// Performs dynamic vertex dilation and transforms glyph quads.

precision highp float;

// Vertex attributes (5 × vec4 = 80 bytes per vertex)
attribute vec4 slugPos;  // object-space position (xy) + normal (zw)
attribute vec4 slugTex;  // em-space coords (xy) + glyph location (zw) as float
attribute vec4 slugMet;  // bandMaxX, bandMaxY, invScale, flags
attribute vec4 slugBnd;  // bandScaleX, bandScaleY, bandOffsetX, bandOffsetY
attribute vec4 slugCol;  // vertex color RGBA

// Uniforms
uniform mat4 slugMatrix;    // MVP matrix (column-major)
uniform vec4 slugViewport;  // (viewportWidth, viewportHeight, 0, 0)
// Outline width in pixels. Consumed by the fragment shader; declared here so the linker
// keeps the uniform active. yzw reserved.
uniform vec4 slugOutline;

// Varyings
varying vec4 vColor;
varying vec2 vTexcoord;
flat varying vec4 vBanding;
flat varying vec4 vGlyph;

void main(void) {
    vec2 pos = slugPos.xy;
    vec2 normal = slugPos.zw;
    vec2 tex = slugTex.xy;
    float invScale = slugMet.z;
    vec4 jac = vec4(invScale, 0.0, 0.0, invScale);

    // Extract MVP matrix rows from column-major storage
    vec4 row0 = vec4(slugMatrix[0].x, slugMatrix[1].x, slugMatrix[2].x, slugMatrix[3].x);
    vec4 row1 = vec4(slugMatrix[0].y, slugMatrix[1].y, slugMatrix[2].y, slugMatrix[3].y);
    vec4 row3 = vec4(slugMatrix[0].w, slugMatrix[1].w, slugMatrix[2].w, slugMatrix[3].w);

    // Dynamic dilation (SlugDilate)
    vec2 n = normalize(normal);
    float s = dot(row3.xy, pos) + row3.w;
    float t = dot(row3.xy, n);

    float u = (s * dot(row0.xy, n) - t * (dot(row0.xy, pos) + row0.w)) * slugViewport.x;
    float v = (s * dot(row1.xy, n) - t * (dot(row1.xy, pos) + row1.w)) * slugViewport.y;

    float s2 = s * s;
    float st = s * t;
    float uv = u * u + v * v;
    // Base dilation: +1 pixel outward along normal in screen space (for AA edge).
    vec2 d = normal * (s2 * (st + sqrt(uv)) / (uv - st * st));

    vec2 dilatedPos = pos + d;
    vec2 dilatedTex = vec2(tex.x + dot(d, jac.xy), tex.y + dot(d, jac.zw));

    // Transform dilated position with MVP
    gl_Position = slugMatrix * vec4(dilatedPos, 0.0, 1.0);

    // Pass varyings
    vTexcoord = dilatedTex;
    vBanding = slugBnd;
    vGlyph = vec4(slugTex.zw, slugMet.xy);  // (glyphLocX, glyphLocY, bandMaxX, bandMaxY)
    vColor = slugCol;
}
