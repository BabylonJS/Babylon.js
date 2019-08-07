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
    namespace
    {
        void AddShader(glslang::TProgram& program, glslang::TShader& shader, std::string_view source)
        {
            const std::array<const char*, 1> sources{ source.data() };
            shader.setStrings(sources.data(), gsl::narrow_cast<int>(sources.size()));
            shader.setEnvInput(glslang::EShSourceGlsl, shader.getStage(), glslang::EShClientVulkan, 100);
            shader.setEnvClient(glslang::EShClientVulkan, glslang::EShTargetVulkan_1_0);
            shader.setEnvTarget(glslang::EShTargetSpv, glslang::EShTargetSpv_1_0);

            // TODO: Do this to avoid the work around for dFdy?
            //shader->setInvertY(true);

            if (!shader.parse(&DefaultTBuiltInResource, 450, false, EShMsgDefault))
            {
                throw std::exception();
            }

            program.addShader(&shader);
        }
    }

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
        // android stub
    }
}
