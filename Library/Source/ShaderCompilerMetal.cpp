#include "ShaderCompiler.h"
#include "ResourceLimits.h"
#include <arcana/experimental/array.h>
#include <bgfx/bgfx.h>
#include <glslang/Public/ShaderLang.h>
#include <SPIRV/GlslangToSpv.h>
#include <spirv_parser.hpp>
#include <spirv_hlsl.hpp>

namespace glslang
{
    extern const TBuiltInResource DefaultTBuiltInResource;
}

namespace babylon
{
    ShaderCompiler::ShaderCompiler()
    {
        //glslang::InitializeProcess();
    }

    ShaderCompiler::~ShaderCompiler()
    {
        //glslang::FinalizeProcess();
    }

    void ShaderCompiler::Compile(std::string_view vertexSource, std::string_view fragmentSource, std::function<void(ShaderInfo, ShaderInfo)> onCompiled)
    {
    }
}
