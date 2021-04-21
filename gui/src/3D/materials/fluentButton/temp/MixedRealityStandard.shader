// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

// NOTE: MRTK Shaders are versioned via the MRTK.Shaders.sentinel file.
// When making changes to any shader's source file, the value in the sentinel _must_ be incremented.

Shader "Mixed Reality Toolkit/Standard"
{
    Properties
    {
        // Main maps.
        _Color("Color", Color) = (1.0, 1.0, 1.0, 1.0)
        _MainTex("Albedo", 2D) = "white" {}
        [Enum(AlbedoAlphaMode)] _AlbedoAlphaMode("Albedo Alpha Mode", Float) = 0 // "Transparency"
        [Toggle] _AlbedoAssignedAtRuntime("Albedo Assigned at Runtime", Float) = 0.0
        _Cutoff("Alpha Cutoff", Range(0.0, 1.0)) = 0.5
        _Metallic("Metallic", Range(0.0, 1.0)) = 0.0
        _Smoothness("Smoothness", Range(0.0, 1.0)) = 0.5
        [Toggle(_CHANNEL_MAP)] _EnableChannelMap("Enable Channel Map", Float) = 0.0
        [NoScaleOffset] _ChannelMap("Channel Map", 2D) = "white" {}
        [Toggle(_NORMAL_MAP)] _EnableNormalMap("Enable Normal Map", Float) = 0.0
        [NoScaleOffset] _NormalMap("Normal Map", 2D) = "bump" {}
        _NormalMapScale("Scale", Float) = 1.0
        [Toggle(_EMISSION)] _EnableEmission("Enable Emission", Float) = 0.0
        [HDR]_EmissiveColor("Emissive Color", Color) = (0.0, 0.0, 0.0, 1.0)
        [Toggle(_TRIPLANAR_MAPPING)] _EnableTriplanarMapping("Triplanar Mapping", Float) = 0.0
        [Toggle(_USE_SSAA)] _EnableSSAA("Super Sample Anti Aliasing", Float) = 0.0
        _MipmapBias("Mipmap Bias", Range(-5.0, 0.0)) = -2.0
        [Toggle(_LOCAL_SPACE_TRIPLANAR_MAPPING)] _EnableLocalSpaceTriplanarMapping("Local Space", Float) = 0.0
        _TriplanarMappingBlendSharpness("Blend Sharpness", Range(1.0, 16.0)) = 4.0

        // Rendering options.
        [Toggle(_DIRECTIONAL_LIGHT)] _DirectionalLight("Directional Light", Float) = 1.0
        [Toggle(_SPECULAR_HIGHLIGHTS)] _SpecularHighlights("Specular Highlights", Float) = 1.0
        [Toggle(_SPHERICAL_HARMONICS)] _SphericalHarmonics("Spherical Harmonics", Float) = 0.0
        [Toggle(_REFLECTIONS)] _Reflections("Reflections", Float) = 0.0
        [Toggle(_REFRACTION)] _Refraction("Refraction", Float) = 0.0
        _RefractiveIndex("Refractive Index", Range(0.0, 3.0)) = 0.0
        [Toggle(_RIM_LIGHT)] _RimLight("Rim Light", Float) = 0.0
        _RimColor("Rim Color", Color) = (0.5, 0.5, 0.5, 1.0)
        _RimPower("Rim Power", Range(0.0, 8.0)) = 0.25
        [Toggle(_VERTEX_COLORS)] _VertexColors("Vertex Colors", Float) = 0.0
        [Toggle(_VERTEX_EXTRUSION)] _VertexExtrusion("Vertex Extrusion", Float) = 0.0
        _VertexExtrusionValue("Vertex Extrusion Value", Float) = 0.0
        [Toggle(_VERTEX_EXTRUSION_SMOOTH_NORMALS)] _VertexExtrusionSmoothNormals("Vertex Extrusion Smooth Normals", Float) = 0.0
        _BlendedClippingWidth("Blended Clipping With", Range(0.0, 10.0)) = 1.0
        [Toggle(_CLIPPING_BORDER)] _ClippingBorder("Clipping Border", Float) = 0.0
        _ClippingBorderWidth("Clipping Border Width", Range(0.0, 1.0)) = 0.025
        _ClippingBorderColor("Clipping Border Color", Color) = (1.0, 0.2, 0.0, 1.0)
        [Toggle(_NEAR_PLANE_FADE)] _NearPlaneFade("Near Plane Fade", Float) = 0.0
        [Toggle(_NEAR_LIGHT_FADE)] _NearLightFade("Near Light Fade", Float) = 0.0
        _FadeBeginDistance("Fade Begin Distance", Range(0.0, 10.0)) = 0.85
        _FadeCompleteDistance("Fade Complete Distance", Range(0.0, 10.0)) = 0.5
        _FadeMinValue("Fade Min Value", Range(0.0, 1.0)) = 0.0

        // Fluent options.
        [Toggle(_HOVER_LIGHT)] _HoverLight("Hover Light", Float) = 1.0
        [Toggle(_HOVER_COLOR_OVERRIDE)] _EnableHoverColorOverride("Hover Color Override", Float) = 0.0
        _HoverColorOverride("Hover Color Override", Color) = (1.0, 1.0, 1.0, 1.0)
        [Toggle(_PROXIMITY_LIGHT)] _ProximityLight("Proximity Light", Float) = 0.0
        [Toggle(_PROXIMITY_LIGHT_COLOR_OVERRIDE)] _EnableProximityLightColorOverride("Proximity Light Color Override", Float) = 0.0
        [HDR]_ProximityLightCenterColorOverride("Proximity Light Center Color Override", Color) = (1.0, 0.0, 0.0, 0.0)
        [HDR]_ProximityLightMiddleColorOverride("Proximity Light Middle Color Override", Color) = (0.0, 1.0, 0.0, 0.5)
        [HDR]_ProximityLightOuterColorOverride("Proximity Light Outer Color Override", Color) = (0.0, 0.0, 1.0, 1.0)
        [Toggle(_PROXIMITY_LIGHT_SUBTRACTIVE)] _ProximityLightSubtractive("Proximity Light Subtractive", Float) = 0.0
        [Toggle(_PROXIMITY_LIGHT_TWO_SIDED)] _ProximityLightTwoSided("Proximity Light Two Sided", Float) = 0.0
        _FluentLightIntensity("Fluent Light Intensity", Range(0.0, 1.0)) = 1.0
        [Toggle(_ROUND_CORNERS)] _RoundCorners("Round Corners", Float) = 0.0
        _RoundCornerRadius("Round Corner Radius", Range(0.0, 0.5)) = 0.25
        _RoundCornerMargin("Round Corner Margin", Range(0.0, 0.5)) = 0.01
        [Toggle(_INDEPENDENT_CORNERS)] _IndependentCorners("Independent Corners", Float) = 0.0
        _RoundCornersRadius("Round Corners Radius", Vector) = (0.5 ,0.5, 0.5, 0.5)
        [Toggle(_BORDER_LIGHT)] _BorderLight("Border Light", Float) = 0.0
        [Toggle(_BORDER_LIGHT_USES_HOVER_COLOR)] _BorderLightUsesHoverColor("Border Light Uses Hover Color", Float) = 0.0
        [Toggle(_BORDER_LIGHT_REPLACES_ALBEDO)] _BorderLightReplacesAlbedo("Border Light Replaces Albedo", Float) = 0.0
        [Toggle(_BORDER_LIGHT_OPAQUE)] _BorderLightOpaque("Border Light Opaque", Float) = 0.0
        _BorderWidth("Border Width", Range(0.0, 1.0)) = 0.1
        _BorderMinValue("Border Min Value", Range(0.0, 1.0)) = 0.1
        _EdgeSmoothingValue("Edge Smoothing Value", Range(0.0, 0.2)) = 0.002
        _BorderLightOpaqueAlpha("Border Light Opaque Alpha", Range(0.0, 1.0)) = 1.0
        [Toggle(_INNER_GLOW)] _InnerGlow("Inner Glow", Float) = 0.0
        _InnerGlowColor("Inner Glow Color (RGB) and Intensity (A)", Color) = (1.0, 1.0, 1.0, 0.75)
        _InnerGlowPower("Inner Glow Power", Range(2.0, 32.0)) = 4.0
        [Toggle(_IRIDESCENCE)] _Iridescence("Iridescence", Float) = 0.0
        [NoScaleOffset] _IridescentSpectrumMap("Iridescent Spectrum Map", 2D) = "white" {}
        _IridescenceIntensity("Iridescence Intensity", Range(0.0, 1.0)) = 0.5
        _IridescenceThreshold("Iridescence Threshold", Range(0.0, 1.0)) = 0.05
        _IridescenceAngle("Iridescence Angle", Range(-0.78, 0.78)) = -0.78
        [Toggle(_ENVIRONMENT_COLORING)] _EnvironmentColoring("Environment Coloring", Float) = 0.0
        _EnvironmentColorThreshold("Environment Color Threshold", Range(0.0, 3.0)) = 1.5
        _EnvironmentColorIntensity("Environment Color Intensity", Range(0.0, 1.0)) = 0.5
        _EnvironmentColorX("Environment Color X (RGB)", Color) = (1.0, 0.0, 0.0, 1.0)
        _EnvironmentColorY("Environment Color Y (RGB)", Color) = (0.0, 1.0, 0.0, 1.0)
        _EnvironmentColorZ("Environment Color Z (RGB)", Color) = (0.0, 0.0, 1.0, 1.0)

        // Advanced options.
        [Enum(RenderingMode)] _Mode("Rendering Mode", Float) = 0                                     // "Opaque"
        [Enum(CustomRenderingMode)] _CustomMode("Mode", Float) = 0                                   // "Opaque"
        [Enum(UnityEngine.Rendering.BlendMode)] _SrcBlend("Source Blend", Float) = 1                 // "One"
        [Enum(UnityEngine.Rendering.BlendMode)] _DstBlend("Destination Blend", Float) = 0            // "Zero"
        [Enum(UnityEngine.Rendering.BlendOp)] _BlendOp("Blend Operation", Float) = 0                 // "Add"
        [Enum(UnityEngine.Rendering.CompareFunction)] _ZTest("Depth Test", Float) = 4                // "LessEqual"
        [Enum(DepthWrite)] _ZWrite("Depth Write", Float) = 1                                         // "On"
        _ZOffsetFactor("Depth Offset Factor", Float) = 0                                             // "Zero"
        _ZOffsetUnits("Depth Offset Units", Float) = 0                                               // "Zero"
        [Enum(UnityEngine.Rendering.ColorWriteMask)] _ColorWriteMask("Color Write Mask", Float) = 15 // "All"
        [Enum(UnityEngine.Rendering.CullMode)] _CullMode("Cull Mode", Float) = 2                     // "Back"
        _RenderQueueOverride("Render Queue Override", Range(-1.0, 5000)) = -1
        [Toggle(_IGNORE_Z_SCALE)] _IgnoreZScale("Ignore Z Scale", Float) = 0.0
        [Toggle(_STENCIL)] _Stencil("Enable Stencil Testing", Float) = 0.0
        _StencilReference("Stencil Reference", Range(0, 255)) = 0
        [Enum(UnityEngine.Rendering.CompareFunction)]_StencilComparison("Stencil Comparison", Int) = 0
        [Enum(UnityEngine.Rendering.StencilOp)]_StencilOperation("Stencil Operation", Int) = 0
    }

    SubShader
    {
        Pass
        {
            Name "Main"
            Tags{ "RenderType" = "Opaque" "LightMode" = "ForwardBase" }
            LOD 100
            Blend[_SrcBlend][_DstBlend]
            BlendOp[_BlendOp]
            ZTest[_ZTest]
            ZWrite[_ZWrite]
            Cull[_CullMode]
            Offset[_ZOffsetFactor],[_ZOffsetUnits]
            ColorMask[_ColorWriteMask]

            Stencil
            {
                Ref[_StencilReference]
                Comp[_StencilComparison]
                Pass[_StencilOperation]
            }

            CGPROGRAM

            #pragma vertex vert
            #pragma fragment frag

            #pragma multi_compile_instancing
            #pragma multi_compile _ LIGHTMAP_ON
            #pragma multi_compile _ _HOVER_LIGHT_MEDIUM _HOVER_LIGHT_HIGH
            #pragma multi_compile _ _CLIPPING_PLANE _CLIPPING_SPHERE _CLIPPING_BOX

            #pragma shader_feature _ _ALPHATEST_ON _ALPHABLEND_ON
            #pragma shader_feature _DISABLE_ALBEDO_MAP
            #pragma shader_feature _ _METALLIC_TEXTURE_ALBEDO_CHANNEL_A _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A
            #pragma shader_feature _CHANNEL_MAP
            #pragma shader_feature _NORMAL_MAP
            #pragma shader_feature _EMISSION
            #pragma shader_feature _TRIPLANAR_MAPPING
            #pragma shader_feature _LOCAL_SPACE_TRIPLANAR_MAPPING
            #pragma shader_feature _USE_SSAA
            #pragma shader_feature _DIRECTIONAL_LIGHT
            #pragma shader_feature _SPECULAR_HIGHLIGHTS
            #pragma shader_feature _SPHERICAL_HARMONICS
            #pragma shader_feature _REFLECTIONS
            #pragma shader_feature _REFRACTION
            #pragma shader_feature _RIM_LIGHT
            #pragma shader_feature _VERTEX_COLORS
            #pragma shader_feature _VERTEX_EXTRUSION
            #pragma shader_feature _VERTEX_EXTRUSION_SMOOTH_NORMALS
            #pragma shader_feature _CLIPPING_BORDER
            #pragma shader_feature _NEAR_PLANE_FADE
            #pragma shader_feature _NEAR_LIGHT_FADE
            #pragma shader_feature _HOVER_LIGHT
            #pragma shader_feature _HOVER_COLOR_OVERRIDE
            #pragma shader_feature _PROXIMITY_LIGHT
            #pragma shader_feature _PROXIMITY_LIGHT_COLOR_OVERRIDE
            #pragma shader_feature _PROXIMITY_LIGHT_SUBTRACTIVE
            #pragma shader_feature _PROXIMITY_LIGHT_TWO_SIDED
            #pragma shader_feature _ROUND_CORNERS
            #pragma shader_feature _INDEPENDENT_CORNERS
            #pragma shader_feature _BORDER_LIGHT
            #pragma shader_feature _BORDER_LIGHT_USES_HOVER_COLOR
            #pragma shader_feature _BORDER_LIGHT_REPLACES_ALBEDO
            #pragma shader_feature _BORDER_LIGHT_OPAQUE
            #pragma shader_feature _INNER_GLOW
            #pragma shader_feature _IRIDESCENCE
            #pragma shader_feature _ENVIRONMENT_COLORING
            #pragma shader_feature _IGNORE_Z_SCALE

            #define IF(a, b, c) lerp(b, c, step((fixed) (a), 0.0)); 

            #include "UnityCG.cginc"
            #include "UnityStandardConfig.cginc"
            #include "UnityStandardUtils.cginc"
            #include "MixedRealityShaderUtils.cginc"

            // This define will get commented in by the UpgradeShaderForUniversalRenderPipeline method.
            //#define _RENDER_PIPELINE

#if defined(_TRIPLANAR_MAPPING) || defined(_DIRECTIONAL_LIGHT) || defined(_SPHERICAL_HARMONICS) || defined(_REFLECTIONS) || defined(_RIM_LIGHT) || defined(_PROXIMITY_LIGHT) || defined(_ENVIRONMENT_COLORING)
            #define _NORMAL
#else
            #undef _NORMAL
#endif

#if defined(_CLIPPING_PLANE) || defined(_CLIPPING_SPHERE) || defined(_CLIPPING_BOX)
        #define _CLIPPING_PRIMITIVE
#else
        #undef _CLIPPING_PRIMITIVE
#endif

#if defined(_NORMAL) || defined(_CLIPPING_PRIMITIVE) || defined(_NEAR_PLANE_FADE) || defined(_HOVER_LIGHT) || defined(_PROXIMITY_LIGHT)
            #define _WORLD_POSITION
#else
            #undef _WORLD_POSITION
#endif

#if defined(_ALPHATEST_ON) || defined(_CLIPPING_PRIMITIVE) || defined(_ROUND_CORNERS)
            #define _ALPHA_CLIP
#else
            #undef _ALPHA_CLIP
#endif

#if defined(_ALPHABLEND_ON)
            #define _TRANSPARENT
            #undef _ALPHA_CLIP
#else
            #undef _TRANSPARENT
#endif

#if defined(_VERTEX_EXTRUSION) || defined(_ROUND_CORNERS) || defined(_BORDER_LIGHT)
            #define _SCALE
#else
            #undef _SCALE
#endif

#if defined(_DIRECTIONAL_LIGHT) || defined(_RIM_LIGHT)
            #define _FRESNEL
#else
            #undef _FRESNEL
#endif

#if defined(_ROUND_CORNERS) || defined(_BORDER_LIGHT) || defined(_INNER_GLOW)
            #define _DISTANCE_TO_EDGE
#else
            #undef _DISTANCE_TO_EDGE
#endif

#if !defined(_DISABLE_ALBEDO_MAP) || defined(_TRIPLANAR_MAPPING) || defined(_CHANNEL_MAP) || defined(_NORMAL_MAP) || defined(_DISTANCE_TO_EDGE) || defined(_IRIDESCENCE)
            #define _UV
#else
            #undef _UV
#endif

            struct appdata_t
            {
                float4 vertex : POSITION;
                // The default UV channel used for texturing.
                float2 uv : TEXCOORD0;
#if defined(LIGHTMAP_ON)
                // Reserved for Unity's light map UVs.
                float2 uv1 : TEXCOORD1;
#endif
                // Used for smooth normal data (or UGUI scaling data).
                float4 uv2 : TEXCOORD2;
                // Used for UGUI scaling data.
                float2 uv3 : TEXCOORD3;
#if defined(_VERTEX_COLORS)
                fixed4 color : COLOR0;
#endif
                fixed3 normal : NORMAL;
#if defined(_NORMAL_MAP)
                fixed4 tangent : TANGENT;
#endif
                UNITY_VERTEX_INPUT_INSTANCE_ID
            };

            struct v2f 
            {
                float4 position : SV_POSITION;
#if defined(_BORDER_LIGHT)
                float4 uv : TEXCOORD0;
#elif defined(_UV)
                float2 uv : TEXCOORD0;
#endif
#if defined(LIGHTMAP_ON)
                float2 lightMapUV : TEXCOORD1;
#endif
#if defined(_VERTEX_COLORS)
                fixed4 color : COLOR0;
#endif
#if defined(_SPHERICAL_HARMONICS)
                fixed3 ambient : COLOR1;
#endif
#if defined(_IRIDESCENCE)
                fixed3 iridescentColor : COLOR2;
#endif
#if defined(_WORLD_POSITION)
#if defined(_NEAR_PLANE_FADE)
                float4 worldPosition : TEXCOORD2;
#else
                float3 worldPosition : TEXCOORD2;
#endif
#endif
#if defined(_SCALE)
                float3 scale : TEXCOORD3;
#endif
#if defined(_NORMAL)
#if defined(_TRIPLANAR_MAPPING)
                fixed3 worldNormal : COLOR3;
                fixed3 triplanarNormal : COLOR4;
                float3 triplanarPosition : TEXCOORD6;
#elif defined(_NORMAL_MAP)
                fixed3 tangentX : COLOR3;
                fixed3 tangentY : COLOR4;
                fixed3 tangentZ : COLOR5;
#else
                fixed3 worldNormal : COLOR3;
#endif
#endif
                UNITY_VERTEX_INPUT_INSTANCE_ID
                UNITY_VERTEX_OUTPUT_STEREO
            };

            UNITY_INSTANCING_BUFFER_START(Props)
            UNITY_DEFINE_INSTANCED_PROP(float4, _Color)

#if defined(_CLIPPING_PLANE)
            UNITY_DEFINE_INSTANCED_PROP(fixed, _ClipPlaneSide)
            UNITY_DEFINE_INSTANCED_PROP(float4, _ClipPlane)
#endif

#if defined(_CLIPPING_SPHERE)
            UNITY_DEFINE_INSTANCED_PROP(fixed, _ClipSphereSide)
            UNITY_DEFINE_INSTANCED_PROP(float4x4, _ClipSphereInverseTransform)
#endif

#if defined(_CLIPPING_BOX)
            UNITY_DEFINE_INSTANCED_PROP(fixed, _ClipBoxSide)
            UNITY_DEFINE_INSTANCED_PROP(float4x4, _ClipBoxInverseTransform)
#endif

            UNITY_INSTANCING_BUFFER_END(Props)

            sampler2D _MainTex;
            fixed4 _MainTex_ST;

#if defined(_ALPHA_CLIP)
            fixed _Cutoff;
#endif

            fixed _Metallic;
            fixed _Smoothness;

#if defined(_CHANNEL_MAP)
            sampler2D _ChannelMap;
#endif

#if defined(_NORMAL_MAP)
            sampler2D _NormalMap;
            float _NormalMapScale;
#endif

#if defined(_EMISSION)
            fixed4 _EmissiveColor;
#endif

#if defined(_USE_SSAA)
            float _MipmapBias;
#endif

#if defined(_TRIPLANAR_MAPPING)
            float _TriplanarMappingBlendSharpness;
#endif

#if defined(_DIRECTIONAL_LIGHT)
#if defined(_RENDER_PIPELINE)
            CBUFFER_START(_LightBuffer)
            float4 _MainLightPosition;
            half4 _MainLightColor;
            CBUFFER_END
#else
            fixed4 _LightColor0;
#endif
#endif

#if defined(_REFRACTION)
            fixed _RefractiveIndex;
#endif

#if defined(_RIM_LIGHT)
            fixed3 _RimColor;
            fixed _RimPower;
#endif

#if defined(_VERTEX_EXTRUSION)
            float _VertexExtrusionValue;
#endif


#if defined(_CLIPPING_PRIMITIVE)
            float _BlendedClippingWidth;
#endif

#if defined(_CLIPPING_BORDER)
            fixed _ClippingBorderWidth;
            fixed3 _ClippingBorderColor;
#endif

#if defined(_NEAR_PLANE_FADE)
            float _FadeBeginDistance;
            float _FadeCompleteDistance;
            fixed _FadeMinValue;
#endif

#if defined(_HOVER_LIGHT) || defined(_NEAR_LIGHT_FADE)
#if defined(_HOVER_LIGHT_HIGH)
#define HOVER_LIGHT_COUNT 10
#elif defined(_HOVER_LIGHT_MEDIUM)
#define HOVER_LIGHT_COUNT 4
#else
#define HOVER_LIGHT_COUNT 2
#endif
#define HOVER_LIGHT_DATA_SIZE 2
            float4 _HoverLightData[HOVER_LIGHT_COUNT * HOVER_LIGHT_DATA_SIZE];
#if defined(_HOVER_COLOR_OVERRIDE)
            fixed3 _HoverColorOverride;
#endif
#endif

#if defined(_PROXIMITY_LIGHT) || defined(_NEAR_LIGHT_FADE)
#define PROXIMITY_LIGHT_COUNT 2
#define PROXIMITY_LIGHT_DATA_SIZE 6
            float4 _ProximityLightData[PROXIMITY_LIGHT_COUNT * PROXIMITY_LIGHT_DATA_SIZE];
#if defined(_PROXIMITY_LIGHT_COLOR_OVERRIDE)
            float4 _ProximityLightCenterColorOverride;
            float4 _ProximityLightMiddleColorOverride;
            float4 _ProximityLightOuterColorOverride;
#endif
#endif

#if defined(_HOVER_LIGHT) || defined(_PROXIMITY_LIGHT) || defined(_BORDER_LIGHT)
            fixed _FluentLightIntensity;
#endif

#if defined(_ROUND_CORNERS)
#if defined(_INDEPENDENT_CORNERS)
            float4 _RoundCornersRadius; 
#else
            fixed _RoundCornerRadius;
#endif
            fixed _RoundCornerMargin;
#endif

#if defined(_BORDER_LIGHT)
            fixed _BorderWidth;
            fixed _BorderMinValue;
#endif

#if defined(_BORDER_LIGHT_OPAQUE)
            fixed _BorderLightOpaqueAlpha;
#endif

#if defined(_ROUND_CORNERS) || defined(_BORDER_LIGHT)
            fixed _EdgeSmoothingValue;
#endif

#if defined(_INNER_GLOW)
            fixed4 _InnerGlowColor;
            fixed _InnerGlowPower;
#endif

#if defined(_IRIDESCENCE)
            sampler2D _IridescentSpectrumMap;
            fixed _IridescenceIntensity;
            fixed _IridescenceThreshold;
            fixed _IridescenceAngle;
#endif

#if defined(_ENVIRONMENT_COLORING)
            fixed _EnvironmentColorThreshold;
            fixed _EnvironmentColorIntensity;
            fixed3 _EnvironmentColorX;
            fixed3 _EnvironmentColorY;
            fixed3 _EnvironmentColorZ;
#endif

#if defined(_DIRECTIONAL_LIGHT)
            static const fixed _MinMetallicLightContribution = 0.7;
            static const fixed _IblContribution = 0.1;
#endif

#if defined(_SPECULAR_HIGHLIGHTS)
            static const float _Shininess = 800.0;
#endif

#if defined(_FRESNEL)
            static const float _FresnelPower = 8.0;
#endif

#if defined(_NEAR_LIGHT_FADE)
            static const float _MaxNearLightDistance = 10.0;

            inline float NearLightDistance(float4 light, float3 worldPosition)
            {
                return distance(worldPosition, light.xyz) + ((1.0 - light.w) * _MaxNearLightDistance);
            }
#endif

#if defined(_HOVER_LIGHT)
            inline float HoverLight(float4 hoverLight, float inverseRadius, float3 worldPosition)
            {
                return (1.0 - saturate(length(hoverLight.xyz - worldPosition) * inverseRadius)) * hoverLight.w;
            }
#endif

#if defined(_PROXIMITY_LIGHT)
            inline float ProximityLight(float4 proximityLight, float4 proximityLightParams, float4 proximityLightPulseParams, float3 worldPosition, float3 worldNormal, out fixed colorValue)
            {
                float proximityLightDistance = dot(proximityLight.xyz - worldPosition, worldNormal);
#if defined(_PROXIMITY_LIGHT_TWO_SIDED)
                worldNormal = IF(proximityLightDistance < 0.0, -worldNormal, worldNormal);
                proximityLightDistance = abs(proximityLightDistance);
#endif
                float normalizedProximityLightDistance = saturate(proximityLightDistance * proximityLightParams.y);
                float3 projectedProximityLight = proximityLight.xyz - (worldNormal * abs(proximityLightDistance));
                float projectedProximityLightDistance = length(projectedProximityLight - worldPosition);
                float attenuation = (1.0 - normalizedProximityLightDistance) * proximityLight.w;
                colorValue = saturate(projectedProximityLightDistance * proximityLightParams.z);
                float pulse = step(proximityLightPulseParams.x, projectedProximityLightDistance) * proximityLightPulseParams.y;

                return smoothstep(1.0, 0.0, projectedProximityLightDistance / (proximityLightParams.x * max(pow(normalizedProximityLightDistance, 0.25), proximityLightParams.w))) * pulse * attenuation;
            }

            inline fixed3 MixProximityLightColor(fixed4 centerColor, fixed4 middleColor, fixed4 outerColor, fixed t)
            {
                fixed3 color = lerp(centerColor.rgb, middleColor.rgb, smoothstep(centerColor.a, middleColor.a, t));
                return lerp(color, outerColor, smoothstep(middleColor.a, outerColor.a, t));
            }
#endif

#if defined(_ROUND_CORNERS)
            inline float PointVsRoundedBox(float2 position, float2 cornerCircleDistance, float cornerCircleRadius)
            {
                return length(max(abs(position) - cornerCircleDistance, 0.0)) - cornerCircleRadius;
            }

            inline fixed RoundCornersSmooth(float2 position, float2 cornerCircleDistance, float cornerCircleRadius)
            {
                return smoothstep(1.0, 0.0, PointVsRoundedBox(position, cornerCircleDistance, cornerCircleRadius) / _EdgeSmoothingValue);
            }

            inline fixed RoundCorners(float2 position, float2 cornerCircleDistance, float cornerCircleRadius)
            {
#if defined(_TRANSPARENT)
                return RoundCornersSmooth(position, cornerCircleDistance, cornerCircleRadius);
#else
                return (PointVsRoundedBox(position, cornerCircleDistance, cornerCircleRadius) < 0.0);
#endif
            }
#endif

#if defined(_IRIDESCENCE)
            fixed3 Iridescence(float tangentDotIncident, sampler2D spectrumMap, float threshold, float2 uv, float angle, float intensity)
            {
                float k = tangentDotIncident * 0.5 + 0.5;
                float4 left = tex2D(spectrumMap, float2(lerp(0.0, 1.0 - threshold, k), 0.5), float2(0.0, 0.0), float2(0.0, 0.0));
                float4 right = tex2D(spectrumMap, float2(lerp(threshold, 1.0, k), 0.5), float2(0.0, 0.0), float2(0.0, 0.0));

                float2 XY = uv - float2(0.5, 0.5);
                float s = (cos(angle) * XY.x - sin(angle) * XY.y) / cos(angle);
                return (left.rgb + s * (right.rgb - left.rgb)) * intensity;
            }
#endif

            v2f vert(appdata_t v)
            {
                v2f o;
                UNITY_SETUP_INSTANCE_ID(v);
                UNITY_INITIALIZE_OUTPUT(v2f, o);
                UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(o);
                UNITY_TRANSFER_INSTANCE_ID(v, o);

                float4 vertexPosition = v.vertex;

#if defined(_WORLD_POSITION) || defined(_VERTEX_EXTRUSION)
                float3 worldVertexPosition = mul(unity_ObjectToWorld, vertexPosition).xyz;
#endif

#if defined(_SCALE)
                o.scale.x = length(mul(unity_ObjectToWorld, float4(1.0, 0.0, 0.0, 0.0)));
                o.scale.y = length(mul(unity_ObjectToWorld, float4(0.0, 1.0, 0.0, 0.0)));
#if defined(_IGNORE_Z_SCALE)
                o.scale.z = o.scale.x;
#else
                o.scale.z = length(mul(unity_ObjectToWorld, float4(0.0, 0.0, 1.0, 0.0)));
#endif
#if !defined(_VERTEX_EXTRUSION_SMOOTH_NORMALS)
                // uv3.y will contain a negative value when rendered by a UGUI and ScaleMeshEffect.
                if (v.uv3.y < 0.0)
                {
                    o.scale.x *= v.uv2.x;
                    o.scale.y *= v.uv2.y;
                    o.scale.z *= v.uv3.x;
                }
#endif
#endif

                fixed3 localNormal = v.normal;

#if defined(_NORMAL) || defined(_VERTEX_EXTRUSION)
                fixed3 worldNormal = UnityObjectToWorldNormal(localNormal);
#endif

#if defined(_VERTEX_EXTRUSION)
#if defined(_VERTEX_EXTRUSION_SMOOTH_NORMALS)
                worldVertexPosition += UnityObjectToWorldNormal(v.uv2 * o.scale) * _VertexExtrusionValue;
#else
                worldVertexPosition += worldNormal * _VertexExtrusionValue;
#endif
                vertexPosition = mul(unity_WorldToObject, float4(worldVertexPosition, 1.0));
#endif

                o.position = UnityObjectToClipPos(vertexPosition);

#if defined(_WORLD_POSITION)
                o.worldPosition.xyz = worldVertexPosition;
#endif

#if defined(_NEAR_PLANE_FADE)
                float rangeInverse = 1.0 / (_FadeBeginDistance - _FadeCompleteDistance);
#if defined(_NEAR_LIGHT_FADE)
                float fadeDistance = _MaxNearLightDistance;

                [unroll]
                for (int hoverLightIndex = 0; hoverLightIndex < HOVER_LIGHT_COUNT; ++hoverLightIndex)
                {
                    int dataIndex = hoverLightIndex * HOVER_LIGHT_DATA_SIZE;
                    fadeDistance = min(fadeDistance, NearLightDistance(_HoverLightData[dataIndex], o.worldPosition));
                }

                [unroll]
                for (int proximityLightIndex = 0; proximityLightIndex < PROXIMITY_LIGHT_COUNT; ++proximityLightIndex)
                {
                    int dataIndex = proximityLightIndex * PROXIMITY_LIGHT_DATA_SIZE;
                    fadeDistance = min(fadeDistance, NearLightDistance(_ProximityLightData[dataIndex], o.worldPosition));
                }
#else
                float fadeDistance = -UnityObjectToViewPos(vertexPosition).z;
#endif
                o.worldPosition.w = max(saturate(mad(fadeDistance, rangeInverse, -_FadeCompleteDistance * rangeInverse)), _FadeMinValue);
#endif

#if defined(_BORDER_LIGHT) || defined(_ROUND_CORNERS)
                o.uv.xy = TRANSFORM_TEX(v.uv, _MainTex);
   
                float minScale = min(min(o.scale.x, o.scale.y), o.scale.z);

#if defined(_BORDER_LIGHT) 
                float maxScale = max(max(o.scale.x, o.scale.y), o.scale.z);
                float minOverMiddleScale = minScale / (o.scale.x + o.scale.y + o.scale.z - minScale - maxScale);

                float areaYZ = o.scale.y * o.scale.z;
                float areaXZ = o.scale.z * o.scale.x;
                float areaXY = o.scale.x * o.scale.y;

                float borderWidth = _BorderWidth;
#endif

                if (abs(localNormal.x) == 1.0) // Y,Z plane.
                {
                    o.scale.x = o.scale.z;
                    o.scale.y = o.scale.y;

#if defined(_BORDER_LIGHT) 
                    if (areaYZ > areaXZ && areaYZ > areaXY)
                    {
                        borderWidth *= minOverMiddleScale;
                    }
#endif
                }
                else if (abs(localNormal.y) == 1.0) // X,Z plane.
                {
                    o.scale.x = o.scale.x;
                    o.scale.y = o.scale.z;

#if defined(_BORDER_LIGHT) 
                    if (areaXZ > areaXY && areaXZ > areaYZ)
                    {
                        borderWidth *= minOverMiddleScale;
                    }
#endif
                }
                else  // X,Y plane.
                {
                    o.scale.x = o.scale.x;
                    o.scale.y = o.scale.y;

#if defined(_BORDER_LIGHT) 
                    if (areaXY > areaYZ && areaXY > areaXZ)
                    {
                        borderWidth *= minOverMiddleScale;
                    }
#endif
                }

                o.scale.z = minScale;

#if defined(_BORDER_LIGHT) 
                float scaleRatio = min(o.scale.x, o.scale.y) / max(o.scale.x, o.scale.y);
                o.uv.z = IF(o.scale.x > o.scale.y, 1.0 - (borderWidth * scaleRatio), 1.0 - borderWidth);
                o.uv.w = IF(o.scale.x > o.scale.y, 1.0 - borderWidth, 1.0 - (borderWidth * scaleRatio));
#endif
#elif defined(_UV)
                o.uv = TRANSFORM_TEX(v.uv, _MainTex);
#endif

#if defined(LIGHTMAP_ON)
                o.lightMapUV.xy = v.uv1.xy * unity_LightmapST.xy + unity_LightmapST.zw;
#endif

#if defined(_VERTEX_COLORS)
                o.color = v.color;
#endif

#if defined(_SPHERICAL_HARMONICS)
                o.ambient = ShadeSH9(float4(worldNormal, 1.0));
#endif

#if defined(_IRIDESCENCE)
                float3 rightTangent = normalize(mul((float3x3)unity_ObjectToWorld, float3(1.0, 0.0, 0.0)));
                float3 incidentWithCenter = normalize(mul(unity_ObjectToWorld, float4(0.0, 0.0, 0.0, 1.0)) - _WorldSpaceCameraPos);
                float tangentDotIncident = dot(rightTangent, incidentWithCenter);
                o.iridescentColor = Iridescence(tangentDotIncident, _IridescentSpectrumMap, _IridescenceThreshold, v.uv, _IridescenceAngle, _IridescenceIntensity);
#endif

#if defined(_NORMAL)
#if defined(_TRIPLANAR_MAPPING)
                o.worldNormal = worldNormal;
#if defined(_LOCAL_SPACE_TRIPLANAR_MAPPING)
                o.triplanarNormal = localNormal;
                o.triplanarPosition = vertexPosition;
#else
                o.triplanarNormal = worldNormal;
                o.triplanarPosition = o.worldPosition;
#endif
#elif defined(_NORMAL_MAP)
                fixed3 worldTangent = UnityObjectToWorldDir(v.tangent.xyz);
                fixed tangentSign = v.tangent.w * unity_WorldTransformParams.w;
                fixed3 worldBitangent = cross(worldNormal, worldTangent) * tangentSign;
                o.tangentX = fixed3(worldTangent.x, worldBitangent.x, worldNormal.x);
                o.tangentY = fixed3(worldTangent.y, worldBitangent.y, worldNormal.y);
                o.tangentZ = fixed3(worldTangent.z, worldBitangent.z, worldNormal.z);
#else
                o.worldNormal = worldNormal;
#endif
#endif

                return o;
            }

            fixed4 frag(v2f i, fixed facing : VFACE) : SV_Target
            {
                UNITY_SETUP_INSTANCE_ID(i);

#if defined(_TRIPLANAR_MAPPING)
                // Calculate triplanar uvs and apply texture scale and offset values like TRANSFORM_TEX.
                fixed3 triplanarBlend = pow(abs(i.triplanarNormal), _TriplanarMappingBlendSharpness);
                triplanarBlend /= dot(triplanarBlend, fixed3(1.0, 1.0, 1.0));
                float2 uvX = i.triplanarPosition.zy * _MainTex_ST.xy + _MainTex_ST.zw;
                float2 uvY = i.triplanarPosition.xz * _MainTex_ST.xy + _MainTex_ST.zw;
                float2 uvZ = i.triplanarPosition.xy * _MainTex_ST.xy + _MainTex_ST.zw;

                // Ternary operator is 2 instructions faster than sign() when we don't care about zero returning a zero sign.
                float3 axisSign = i.triplanarNormal < 0 ? -1 : 1;
                uvX.x *= axisSign.x;
                uvY.x *= axisSign.y;
                uvZ.x *= -axisSign.z;
#endif

            // Texturing.
#if defined(_DISABLE_ALBEDO_MAP)
                fixed4 albedo = fixed4(1.0, 1.0, 1.0, 1.0);
#else
#if defined(_TRIPLANAR_MAPPING)
                fixed4 albedo = tex2D(_MainTex, uvX) * triplanarBlend.x + 
                                tex2D(_MainTex, uvY) * triplanarBlend.y + 
                                tex2D(_MainTex, uvZ) * triplanarBlend.z;
#else
#if defined(_USE_SSAA)
                // Does SSAA on the texture, implementation based off this article: https://medium.com/@bgolus/sharper-mipmapping-using-shader-based-supersampling-ed7aadb47bec
                // per pixel screen space partial derivatives
                float2 dx = ddx(i.uv.xy) * 0.25; // horizontal offset
                float2 dy = ddy(i.uv.xy) * 0.25; // vertical offset
                // supersampled 2x2 ordered grid
                fixed4 albedo = 0;
                albedo += tex2Dbias(_MainTex, float4(i.uv.xy + dx + dy, 0.0, _MipmapBias));
                albedo += tex2Dbias(_MainTex, float4(i.uv.xy - dx + dy, 0.0, _MipmapBias));
                albedo += tex2Dbias(_MainTex, float4(i.uv.xy + dx - dy, 0.0, _MipmapBias));
                albedo += tex2Dbias(_MainTex, float4(i.uv.xy - dx - dy, 0.0, _MipmapBias));
                albedo *= 0.25;
#else
                fixed4 albedo = tex2D(_MainTex, i.uv);
#endif
#endif
#endif


#ifdef LIGHTMAP_ON
                albedo.rgb *= DecodeLightmap(UNITY_SAMPLE_TEX2D(unity_Lightmap, i.lightMapUV));
#endif

#if defined(_CHANNEL_MAP)
                fixed4 channel = tex2D(_ChannelMap, i.uv);
                _Metallic = channel.r;
                albedo.rgb *= channel.g;
                _Smoothness = channel.a;
#else
#if defined(_METALLIC_TEXTURE_ALBEDO_CHANNEL_A)
                _Metallic = albedo.a;
                albedo.a = 1.0;
#elif defined(_SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A)
                _Smoothness = albedo.a;
                albedo.a = 1.0;
#endif 
#endif

                // Primitive clipping.
#if defined(_CLIPPING_PRIMITIVE)
                float primitiveDistance = 1.0;
#if defined(_CLIPPING_PLANE)
                fixed clipPlaneSide = UNITY_ACCESS_INSTANCED_PROP(Props, _ClipPlaneSide);
                float4 clipPlane = UNITY_ACCESS_INSTANCED_PROP(Props, _ClipPlane);
                primitiveDistance = min(primitiveDistance, PointVsPlane(i.worldPosition.xyz, clipPlane) * clipPlaneSide);
#endif
#if defined(_CLIPPING_SPHERE)
                fixed clipSphereSide = UNITY_ACCESS_INSTANCED_PROP(Props, _ClipSphereSide);
                float4x4 clipSphereInverseTransform = UNITY_ACCESS_INSTANCED_PROP(Props, _ClipSphereInverseTransform);
                primitiveDistance = min(primitiveDistance, PointVsSphere(i.worldPosition.xyz, clipSphereInverseTransform) * clipSphereSide);
#endif
#if defined(_CLIPPING_BOX)
                fixed clipBoxSide = UNITY_ACCESS_INSTANCED_PROP(Props, _ClipBoxSide);
                float4x4 clipBoxInverseTransform = UNITY_ACCESS_INSTANCED_PROP(Props, _ClipBoxInverseTransform);
                primitiveDistance = min(primitiveDistance, PointVsBox(i.worldPosition.xyz, clipBoxInverseTransform) * clipBoxSide);
#endif
#if defined(_CLIPPING_BORDER)
                fixed3 primitiveBorderColor = lerp(_ClippingBorderColor, fixed3(0.0, 0.0, 0.0), primitiveDistance / _ClippingBorderWidth);
                albedo.rgb += primitiveBorderColor * IF((primitiveDistance < _ClippingBorderWidth), 1.0, 0.0);
#endif
#endif

#if defined(_DISTANCE_TO_EDGE)
                fixed2 distanceToEdge;
                distanceToEdge.x = abs(i.uv.x - 0.5) * 2.0;
                distanceToEdge.y = abs(i.uv.y - 0.5) * 2.0;
#endif

                // Rounded corner clipping.
#if defined(_ROUND_CORNERS)
                float2 halfScale = i.scale.xy * 0.5;
                float2 roundCornerPosition = distanceToEdge * halfScale;

                fixed currentCornerRadius;

#if defined(_INDEPENDENT_CORNERS)

                _RoundCornersRadius = clamp(_RoundCornersRadius, 0, 0.5);

                if (i.uv.x < 0.5)
                {
                    if (i.uv.y > 0.5)
                    {
                        currentCornerRadius = _RoundCornersRadius.x;
                    }
                    else
                    {
                        currentCornerRadius = _RoundCornersRadius.w;
                    }
                }
                else
                {
                    if (i.uv.y > 0.5)
                    {
                        currentCornerRadius = _RoundCornersRadius.y;
                    }
                    else
                    {
                        currentCornerRadius = _RoundCornersRadius.z;
                    }
                }
#else 
                currentCornerRadius = _RoundCornerRadius;
#endif

                float cornerCircleRadius = saturate(max(currentCornerRadius - _RoundCornerMargin, 0.01)) * i.scale.z;

                float2 cornerCircleDistance = halfScale - (_RoundCornerMargin * i.scale.z) - cornerCircleRadius;

                float roundCornerClip = RoundCorners(roundCornerPosition, cornerCircleDistance, cornerCircleRadius);
#endif

                albedo *= UNITY_ACCESS_INSTANCED_PROP(Props, _Color);

#if defined(_VERTEX_COLORS)
                albedo *= i.color;
#endif

#if defined(_IRIDESCENCE)
                albedo.rgb += i.iridescentColor;
#endif

                // Normal calculation.
#if defined(_NORMAL)
                fixed3 worldViewDir = normalize(UnityWorldSpaceViewDir(i.worldPosition.xyz));
#if defined(_REFLECTIONS) || defined(_ENVIRONMENT_COLORING)
                fixed3 incident = -worldViewDir;
#endif
                fixed3 worldNormal;

#if defined(_NORMAL_MAP)
#if defined(_TRIPLANAR_MAPPING)
                fixed3 tangentNormalX = UnpackScaleNormal(tex2D(_NormalMap, uvX), _NormalMapScale);
                fixed3 tangentNormalY = UnpackScaleNormal(tex2D(_NormalMap, uvY), _NormalMapScale);
                fixed3 tangentNormalZ = UnpackScaleNormal(tex2D(_NormalMap, uvZ), _NormalMapScale);
                tangentNormalX.x *= axisSign.x;
                tangentNormalY.x *= axisSign.y;
                tangentNormalZ.x *= -axisSign.z;

                // Swizzle world normals to match tangent space and apply Whiteout normal blend.
                tangentNormalX = fixed3(tangentNormalX.xy + i.worldNormal.zy, tangentNormalX.z * i.worldNormal.x);
                tangentNormalY = fixed3(tangentNormalY.xy + i.worldNormal.xz, tangentNormalY.z * i.worldNormal.y);
                tangentNormalZ = fixed3(tangentNormalZ.xy + i.worldNormal.xy, tangentNormalZ.z * i.worldNormal.z);

                // Swizzle tangent normals to match world normal and blend together.
                worldNormal = normalize(tangentNormalX.zyx * triplanarBlend.x +
                                        tangentNormalY.xzy * triplanarBlend.y +
                                        tangentNormalZ.xyz * triplanarBlend.z);
#else
                fixed3 tangentNormal = UnpackScaleNormal(tex2D(_NormalMap, i.uv), _NormalMapScale);
                worldNormal.x = dot(i.tangentX, tangentNormal);
                worldNormal.y = dot(i.tangentY, tangentNormal);
                worldNormal.z = dot(i.tangentZ, tangentNormal);
                worldNormal = normalize(worldNormal) * facing;
#endif
#else
                worldNormal = normalize(i.worldNormal) * facing;
#endif
#endif

                fixed pointToLight = 1.0;
                fixed3 fluentLightColor = fixed3(0.0, 0.0, 0.0);

                // Hover light.
#if defined(_HOVER_LIGHT)
                pointToLight = 0.0;

                [unroll]
                for (int hoverLightIndex = 0; hoverLightIndex < HOVER_LIGHT_COUNT; ++hoverLightIndex)
                {
                    int dataIndex = hoverLightIndex * HOVER_LIGHT_DATA_SIZE;
                    fixed hoverValue = HoverLight(_HoverLightData[dataIndex], _HoverLightData[dataIndex + 1].w, i.worldPosition.xyz);
                    pointToLight += hoverValue;
#if !defined(_HOVER_COLOR_OVERRIDE)
                    fluentLightColor += lerp(fixed3(0.0, 0.0, 0.0), _HoverLightData[dataIndex + 1].rgb, hoverValue);
#endif
                }
#if defined(_HOVER_COLOR_OVERRIDE)
                fluentLightColor = _HoverColorOverride.rgb * pointToLight;
#endif
#endif

                // Proximity light.
#if defined(_PROXIMITY_LIGHT)
#if !defined(_HOVER_LIGHT)
                pointToLight = 0.0;
#endif
                [unroll]
                for (int proximityLightIndex = 0; proximityLightIndex < PROXIMITY_LIGHT_COUNT; ++proximityLightIndex)
                {
                    int dataIndex = proximityLightIndex * PROXIMITY_LIGHT_DATA_SIZE;
                    fixed colorValue;
                    fixed proximityValue = ProximityLight(_ProximityLightData[dataIndex], _ProximityLightData[dataIndex + 1], _ProximityLightData[dataIndex + 2], i.worldPosition.xyz, worldNormal, colorValue);
                    pointToLight += proximityValue;
#if defined(_PROXIMITY_LIGHT_COLOR_OVERRIDE)
                    fixed3 proximityColor = MixProximityLightColor(_ProximityLightCenterColorOverride, _ProximityLightMiddleColorOverride, _ProximityLightOuterColorOverride, colorValue);
#else
                    fixed3 proximityColor = MixProximityLightColor(_ProximityLightData[dataIndex + 3], _ProximityLightData[dataIndex + 4], _ProximityLightData[dataIndex + 5], colorValue);
#endif  
#if defined(_PROXIMITY_LIGHT_SUBTRACTIVE)
                    fluentLightColor -= lerp(fixed3(0.0, 0.0, 0.0), proximityColor, proximityValue);
#else
                    fluentLightColor += lerp(fixed3(0.0, 0.0, 0.0), proximityColor, proximityValue);
#endif    
                }
#endif    

                // Border light.
#if defined(_BORDER_LIGHT)
                fixed borderValue;
#if defined(_ROUND_CORNERS)
                fixed borderMargin = _RoundCornerMargin  + _BorderWidth * 0.5;

                cornerCircleRadius = saturate(max(currentCornerRadius - borderMargin, 0.01)) * i.scale.z;

                cornerCircleDistance = halfScale - (borderMargin * i.scale.z) - cornerCircleRadius;

                borderValue =  1.0 - RoundCornersSmooth(roundCornerPosition, cornerCircleDistance, cornerCircleRadius);
#else
                borderValue = max(smoothstep(i.uv.z - _EdgeSmoothingValue, i.uv.z + _EdgeSmoothingValue, distanceToEdge.x),
                                  smoothstep(i.uv.w - _EdgeSmoothingValue, i.uv.w + _EdgeSmoothingValue, distanceToEdge.y));
#endif
#if defined(_HOVER_LIGHT) && defined(_BORDER_LIGHT_USES_HOVER_COLOR) && defined(_HOVER_COLOR_OVERRIDE)
                fixed3 borderColor = _HoverColorOverride.rgb;
#else
                fixed3 borderColor = fixed3(1.0, 1.0, 1.0);
#endif
                fixed3 borderContribution = borderColor * borderValue * _BorderMinValue * _FluentLightIntensity;
#if defined(_BORDER_LIGHT_REPLACES_ALBEDO)
                albedo.rgb = lerp(albedo.rgb, borderContribution, borderValue);
#else
                albedo.rgb += borderContribution;
#endif
#if defined(_HOVER_LIGHT) || defined(_PROXIMITY_LIGHT)
                albedo.rgb += (fluentLightColor * borderValue * pointToLight * _FluentLightIntensity) * 2.0;
#endif
#if defined(_BORDER_LIGHT_OPAQUE)
                albedo.a = max(albedo.a, borderValue * _BorderLightOpaqueAlpha);
#endif
#endif

#if defined(_ROUND_CORNERS)
                albedo *= roundCornerClip;
                pointToLight *= roundCornerClip;
#endif

#if defined(_ALPHA_CLIP)
#if !defined(_ALPHATEST_ON)
                _Cutoff = 0.5;
#endif
#if defined(_CLIPPING_PRIMITIVE)
                albedo *= (primitiveDistance > 0.0);
#endif
                clip(albedo.a - _Cutoff);
                albedo.a = 1.0;
#endif

                // Blinn phong lighting.
#if defined(_DIRECTIONAL_LIGHT)
#if defined(_RENDER_PIPELINE)
                float4 directionalLightDirection = _MainLightPosition;
#else
                float4 directionalLightDirection = _WorldSpaceLightPos0;
#endif
                fixed diffuse = max(0.0, dot(worldNormal, directionalLightDirection));
#if defined(_SPECULAR_HIGHLIGHTS)
                fixed halfVector = max(0.0, dot(worldNormal, normalize(directionalLightDirection + worldViewDir)));
                fixed specular = saturate(pow(halfVector, _Shininess * pow(_Smoothness, 4.0)) * (_Smoothness * 2.0) * _Metallic);
#else
                fixed specular = 0.0;
#endif
#endif

                // Image based lighting (attempt to mimic the Standard shader).
#if defined(_REFLECTIONS)
                fixed3 worldReflection = reflect(incident, worldNormal);
                fixed4 iblData = UNITY_SAMPLE_TEXCUBE_LOD(unity_SpecCube0, worldReflection, (1.0 - _Smoothness) * UNITY_SPECCUBE_LOD_STEPS);
                fixed3 ibl = DecodeHDR(iblData, unity_SpecCube0_HDR);
#if defined(_REFRACTION)
                fixed4 refractColor = UNITY_SAMPLE_TEXCUBE(unity_SpecCube0, refract(incident, worldNormal, _RefractiveIndex));
                ibl *= DecodeHDR(refractColor, unity_SpecCube0_HDR);
#endif
#else
                fixed3 ibl = unity_IndirectSpecColor.rgb;
#endif

                // Fresnel lighting.
#if defined(_FRESNEL)
                fixed fresnel = 1.0 - saturate(abs(dot(worldViewDir, worldNormal)));
#if defined(_RIM_LIGHT)
                fixed3 fresnelColor = _RimColor * pow(fresnel, _RimPower);
#else
                fixed3 fresnelColor = unity_IndirectSpecColor.rgb * (pow(fresnel, _FresnelPower) * max(_Smoothness, 0.5));
#endif
#endif
                // Final lighting mix.
                fixed4 output = albedo;
#if defined(_SPHERICAL_HARMONICS)
                fixed3 ambient = i.ambient;
#else
                fixed3 ambient = glstate_lightmodel_ambient + fixed3(0.25, 0.25, 0.25);
#endif
                fixed minProperty = min(_Smoothness, _Metallic);
#if defined(_DIRECTIONAL_LIGHT)
                fixed oneMinusMetallic = (1.0 - _Metallic);
                output.rgb = lerp(output.rgb, ibl, minProperty);
#if defined(_RENDER_PIPELINE)
                fixed3 directionalLightColor = _MainLightColor.rgb;
#else
                fixed3 directionalLightColor = _LightColor0.rgb;
#endif
                output.rgb *= lerp((ambient + directionalLightColor * diffuse + directionalLightColor * specular) * max(oneMinusMetallic, _MinMetallicLightContribution), albedo, minProperty);
                output.rgb += (directionalLightColor * albedo * specular) + (directionalLightColor * specular * _Smoothness);
                output.rgb += ibl * oneMinusMetallic * _IblContribution;
#elif defined(_REFLECTIONS)
                output.rgb = lerp(output.rgb, ibl, minProperty);
                output.rgb *= lerp(ambient, albedo, minProperty);
#elif defined(_SPHERICAL_HARMONICS)
                output.rgb *= ambient;
#endif

#if defined(_FRESNEL)
#if defined(_RIM_LIGHT) || !defined(_REFLECTIONS)
                output.rgb += fresnelColor;
#else
                output.rgb += fresnelColor * (1.0 - minProperty);
#endif
#endif

#if defined(_EMISSION)
#if defined(_CHANNEL_MAP)
                output.rgb += _EmissiveColor * channel.b;
#else
                output.rgb += _EmissiveColor;
#endif
#endif

                // Inner glow.
#if defined(_INNER_GLOW)
                fixed2 uvGlow = pow(distanceToEdge * _InnerGlowColor.a, _InnerGlowPower);
                output.rgb += lerp(fixed3(0.0, 0.0, 0.0), _InnerGlowColor.rgb, uvGlow.x + uvGlow.y);
#endif

                // Environment coloring.
#if defined(_ENVIRONMENT_COLORING)
                fixed3 environmentColor = incident.x * incident.x * _EnvironmentColorX +
                                          incident.y * incident.y * _EnvironmentColorY + 
                                          incident.z * incident.z * _EnvironmentColorZ;
                output.rgb += environmentColor * max(0.0, dot(incident, worldNormal) + _EnvironmentColorThreshold) * _EnvironmentColorIntensity;

#endif

#if defined(_NEAR_PLANE_FADE)
                output *= i.worldPosition.w;
#endif

                // Hover and proximity lighting should occur after near plane fading.
#if defined(_HOVER_LIGHT) || defined(_PROXIMITY_LIGHT)
                output.rgb += fluentLightColor * _FluentLightIntensity * pointToLight;
#endif

                // Perform non-alpha clipped primitive clipping on the final output.
#if defined(_CLIPPING_PRIMITIVE) && !defined(_ALPHA_CLIP)
                output *= saturate(primitiveDistance * (1.0f / _BlendedClippingWidth));
#endif
                return output;
            }

            ENDCG
        }

        // Extracts information for lightmapping, GI (emission, albedo, ...)
        // This pass it not used during regular rendering.
        Pass
        {
            Name "Meta"
            Tags { "LightMode" = "Meta" }

            CGPROGRAM

            #pragma vertex vert
            #pragma fragment frag

            #pragma shader_feature EDITOR_VISUALIZATION
            #pragma shader_feature _EMISSION
            #pragma shader_feature _CHANNEL_MAP

            #include "UnityCG.cginc"
            #include "UnityMetaPass.cginc"

            // This define will get commented in by the UpgradeShaderForUniversalRenderPipeline method.
            //#define _RENDER_PIPELINE

            struct v2f
            {
                float4 vertex : SV_POSITION;
                float2 uv : TEXCOORD0;
            };

            float4 _MainTex_ST;

            v2f vert(appdata_full v)
            {
                v2f o;
                o.vertex = UnityMetaVertexPosition(v.vertex, v.texcoord1.xy, v.texcoord2.xy, unity_LightmapST, unity_DynamicLightmapST);
                o.uv = TRANSFORM_TEX(v.texcoord, _MainTex);

                return o;
            }

            sampler2D _MainTex;
            sampler2D _ChannelMap;

            fixed4 _Color;
            fixed4 _EmissiveColor;

#if defined(_RENDER_PIPELINE)
            CBUFFER_START(_LightBuffer)
            float4 _MainLightPosition;
            half4 _MainLightColor;
            CBUFFER_END
#else
            fixed4 _LightColor0;
#endif

            half4 frag(v2f i) : SV_Target
            {
                UnityMetaInput output;
                UNITY_INITIALIZE_OUTPUT(UnityMetaInput, output);

                output.Albedo = tex2D(_MainTex, i.uv) * _Color;
#if defined(_EMISSION)
#if defined(_CHANNEL_MAP)
                output.Emission += tex2D(_ChannelMap, i.uv).b * _EmissiveColor;
#else
                output.Emission += _EmissiveColor;
#endif
#endif
#if defined(_RENDER_PIPELINE)
                output.SpecularColor = _MainLightColor.rgb;
#else
                output.SpecularColor = _LightColor0.rgb;
#endif

                return UnityMetaFragment(output);
            }
            ENDCG
        }
    }
    
    Fallback "Hidden/InternalErrorShader"
    CustomEditor "Microsoft.MixedReality.Toolkit.Editor.MixedRealityStandardShaderGUI"
}
