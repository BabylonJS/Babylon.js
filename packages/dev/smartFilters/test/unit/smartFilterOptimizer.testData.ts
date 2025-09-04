export const testBlockWithOverloadsAnnotatedGlsl = `
/*
{
    "smartFilterBlockType": "TestBlockWithOverloads",
    "namespace": "Babylon.UnitTests",
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main
uniform float amount;
#define ONEDEF 1.0

vec4 greenScreen(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);
    vec4 otherColor = mix(getColor(0.0), getColor(vec3(0.0, ONEDEF, 0.0)), amount);

    return mix(color, otherColor, amount);
}

vec4 getColor(float f) {
    return vec4(f);
}

vec4 getColor(vec3 v) {
    return vec4(v, ONEDEF);
}
`;

export const blackAndWhiteAnnotatedGlsl = `
/*
{
    "smartFilterBlockType": "BlackAndWhiteBlock",
    "namespace": "Babylon.UnitTests",
    "blockDisableStrategy": "AutoSample"
}
*/

uniform sampler2D input; // main

vec4 blackAndWhite(vec2 vUV) { // main
    vec4 color = texture2D(input, vUV);

    float luminance = dot(color.rgb, vec3(0.3, 0.59, 0.11));
    vec3 bg = vec3(luminance, luminance, luminance);

    return vec4(bg, color.a);
}
`;

export const testBlockWithTexture2DSymbolAnnotatedGlsl = `
/*
{
    "smartFilterBlockType": "TestBlockWithTexture2DSymbol",
    "namespace": "Babylon.UnitTests"
}
*/
uniform float amount;
uniform sampler2D input; // main

vec4 mainFunc(vec2 vUV) { // main
    float footexture2D = 1.0;
    float temp = doStuff(texture2D(input, vUV));
    float temp2 = texture2D(input, vUV).r;
    return texture2DStuff(amount);
}
vec4 texture2DStuff(float f) {
    return vec4(f);
}
`;

export const TwoHelpersFirstBlockGlsl = `
/*
{
    "smartFilterBlockType": "FirstBlock",
    "namespace": "Babylon.Test"
}
*/

uniform sampler2D input; // main

vec2 helper1(vec2 vUV) {
    // In FirstBlock
    return helper2(vUV);
}

vec2 helper2(vec2 vUV) {
    // In FirstBlock
    return clamp(vUV, 0.25, 0.75);
}

vec4 firstBlockMain(vec2 vUV) { // main
    // In FirstBlock
    vec2 newUV = helper1(vUV);
    return texture2D(input, newUV);
}
`;

export const TwoHelpersSecondBlockGlsl = `
/*
{
    "smartFilterBlockType": "SecondBlock",
    "namespace": "Babylon.Test"
}
*/

uniform sampler2D input; // main

vec2 helper1(vec2 vUV) {
    // In SecondBlock
    return helper2(vUV);
}

vec2 helper2(vec2 vUV) {
    // In SecondBlock
    return clamp(vUV, 0.25, 0.75);
}

vec4 secondBlockMain(vec2 vUV) { // main
    // In SecondBlock
    vec2 newUV = helper1(vUV);
    return texture2D(input, newUV);
}
`;

export const _helper1_ = `
vec2 _helper1_(vec2 vUV) {
    // In SecondBlock
    return _helper2_(vUV);
}`;

export const _helper2_ = `
vec2 _helper2_(vec2 vUV) {
    // In SecondBlock
    return clamp(vUV, 0.25, 0.75);
}`;

export const _helper1_2_ = `
vec2 _helper1_2_(vec2 vUV) {
    // In FirstBlock
    return _helper2_2_(vUV);
}`;

export const _helper2_2_ = `
vec2 _helper2_2_(vec2 vUV) {
    // In FirstBlock
    return clamp(vUV, 0.25, 0.75);
}`;

export const TestHelperConsolidationBlockGlsl = `
/*
{
    "smartFilterBlockType": "TestHelperConsolidationBlock",
    "namespace": "Babylon.Test"
}
*/

uniform sampler2D input; // main

vec2 helperNoUniformAccess(vec2 uv) {
    return vec2(uv.x, 0.);
}

vec4 blockMain(vec2 vUV) { // main
    vec2 uv = helperNoUniformAccess(vUV);
    return texture2D(input, uv);
}
`;

export const TestHelperAccessesUniformBlockGlsl = `
/*
{
    "smartFilterBlockType": "TestHelperAccessesUniformBlock",
    "namespace": "Babylon.Test"
}
*/

uniform sampler2D input; // main

vec4 helperAccessesUniform(vec2 vUV) {
    return texture2D(input, vUV);
}

vec4 blockMain(vec2 vUV) { // main
    return helperAccessesUniform(vUV);
}
`;

export const NonOptimizableSimpleBlockGlsl = `
/*
{
    "smartFilterBlockType": "NonOptimizableSimpleBlock",
    "namespace": "Babylon.Test",
    "disableOptimization": true
}
*/

uniform sampler2D input; // main

vec4 blockMain(vec2 vUV) { // main
    return texture2D(input, vUV);
}
`;

export const BlendBlockGlsl = `
/*
{
    "smartFilterBlockType": "BlendBlock",
    "namespace": "Babylon.Test"
}
*/

uniform sampler2D input1; // main
uniform sampler2D input2;

vec4 blockMain(vec2 vUV) { // main
    vec4 color1 = texture2D(input1, vUV);
    vec4 color2 = texture2D(input2, vUV);
    return mix(color1, color2, vUV.x);
}
`;

export const ExpectedBlendBlockComboMain2 = `
    vec4 _blockMain_2_(vec2 vUV) {
        vec4 color1 = texture2D(_input1_2_, vUV);
        vec4 color2 = texture2D(_input2_, vUV);
        return mix(color1, color2, vUV.x);
    }`;

export const TestHelperHasParamWithSameNameAsUniformBlockGlsl = `
/*
{
    "smartFilterBlockType": "TestHelperHasParamWithSameNameAsUniformBlock",
    "namespace": "Babylon.Test"
}
*/

uniform sampler2D input; // main
uniform vec2 foo;

vec4 helperDoesNotActuallyUseUniform(vec2 foo) {
    return clamp(foo, 0.0, 1.0);
}

vec4 blockMain(vec2 vUV) { // main
    return texture2D(input, helperDoesNotActuallyUseUniform(vUV));
}
`;
