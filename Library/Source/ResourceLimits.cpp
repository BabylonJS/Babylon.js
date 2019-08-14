#include "ResourceLimits.h"

namespace babylon
{
    const TBuiltInResource DefaultTBuiltInResource =
    {
        32, // MaxLights
        6, // MaxClipPlanes
        32, // MaxTextureUnits
        32, // MaxTextureCoords
        64, // MaxVertexAttribs
        4096, // MaxVertexUniformComponents
        64, // MaxVaryingFloats
        32, // MaxVertexTextureImageUnits
        80, // MaxCombinedTextureImageUnits
        32, // MaxTextureImageUnits
        4096, // MaxFragmentUniformComponents
        32, // MaxDrawBuffers
        128, // MaxVertexUniformVectors
        8, // MaxVaryingVectors
        16, // MaxFragmentUniformVectors
        16, // MaxVertexOutputVectors
        15, // MaxFragmentInputVectors
        -8, // MinProgramTexelOffset
        7, // MaxProgramTexelOffset
        8, // MaxClipDistances
        65535, // MaxComputeWorkGroupCountX
        65535, // MaxComputeWorkGroupCountY
        65535, // MaxComputeWorkGroupCountZ
        1024, // MaxComputeWorkGroupSizeX
        1024, // MaxComputeWorkGroupSizeY
        64, // MaxComputeWorkGroupSizeZ
        1024, // MaxComputeUniformComponents
        16, // MaxComputeTextureImageUnits
        8, // MaxComputeImageUniforms
        8, // MaxComputeAtomicCounters
        1, // MaxComputeAtomicCounterBuffers
        60, // MaxVaryingComponents
        64, // MaxVertexOutputComponents
        64, // MaxGeometryInputComponents
        128, // MaxGeometryOutputComponents
        128, // MaxFragmentInputComponents
        8, // MaxImageUnits
        8, // MaxCombinedImageUnitsAndFragmentOutputs
        8, // MaxCombinedShaderOutputResources
        0, // MaxImageSamples
        0, // MaxVertexImageUniforms
        0, // MaxTessControlImageUniforms
        0, // MaxTessEvaluationImageUniforms
        0, // MaxGeometryImageUniforms
        8, // MaxFragmentImageUniforms
        8, // MaxCombinedImageUniforms
        16, // MaxGeometryTextureImageUnits
        256, // MaxGeometryOutputVertices
        1024, // MaxGeometryTotalOutputComponents
        1024, // MaxGeometryUniformComponents
        64, // MaxGeometryVaryingComponents
        128, // MaxTessControlInputComponents
        128, // MaxTessControlOutputComponents
        16, // MaxTessControlTextureImageUnits
        1024, // MaxTessControlUniformComponents
        4096, // MaxTessControlTotalOutputComponents
        128, // MaxTessEvaluationInputComponents
        128, // MaxTessEvaluationOutputComponents
        16, // MaxTessEvaluationTextureImageUnits
        1024, // MaxTessEvaluationUniformComponents
        120, // MaxTessPatchComponents
        32, // MaxPatchVertices
        64, // MaxTessGenLevel
        16, // MaxViewports
        0, // MaxVertexAtomicCounters
        0, // MaxTessControlAtomicCounters
        0, // MaxTessEvaluationAtomicCounters
        0, // MaxGeometryAtomicCounters
        8, // MaxFragmentAtomicCounters
        8, // MaxCombinedAtomicCounters
        1, // MaxAtomicCounterBindings
        0, // MaxVertexAtomicCounterBuffers
        0, // MaxTessControlAtomicCounterBuffers
        0, // MaxTessEvaluationAtomicCounterBuffers
        0, // MaxGeometryAtomicCounterBuffers
        1, // MaxFragmentAtomicCounterBuffers
        1, // MaxCombinedAtomicCounterBuffers
        16384, // MaxAtomicCounterBufferSize
        4, // MaxTransformFeedbackBuffers
        64, // MaxTransformFeedbackInterleavedComponents
        8, // MaxCullDistances
        8, // MaxCombinedClipAndCullDistances
        4, // MaxSamples
        256, // maxMeshOutputVerticesNV
        512, // maxMeshOutputPrimitivesNV
        32, // maxMeshWorkGroupSizeX_NV
        1, // maxMeshWorkGroupSizeY_NV
        1, // maxMeshWorkGroupSizeZ_NV
        32, // maxTaskWorkGroupSizeX_NV
        1, // maxTaskWorkGroupSizeY_NV
        1, // maxTaskWorkGroupSizeZ_NV
        4, // maxMeshViewCountNV

        // limits
        {
            1, // nonInductiveForLoops
            1, // whileLoops
            1, // doWhileLoops
            1, // generalUniformIndexing
            1, // generalAttributeMatrixVectorIndexing
            1, // generalVaryingIndexing
            1, // generalSamplerIndexing
            1, // generalVariableIndexing
            1, // generalConstantMatrixVectorIndexing
        }
    };

}