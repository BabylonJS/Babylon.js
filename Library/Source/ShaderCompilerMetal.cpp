#include "ShaderCompiler.h"
#include "ResourceLimits.h"
#include <arcana/experimental/array.h>
#include <bgfx/bgfx.h>
#include <glslang/Public/ShaderLang.h>
#include <SPIRV/GlslangToSpv.h>
#include <spirv_parser.hpp>
#include <spirv_msl.hpp>

namespace glslang
{
    void AddShader(glslang::TProgram& program, glslang::TShader& shader, std::string_view source)
    {
        const std::array<const char*, 1> sources{source.data()};
        shader.setStrings(sources.data(), gsl::narrow_cast<int>(sources.size()));
        shader.setEnvInput(glslang::EShSourceGlsl, shader.getStage(), glslang::EShClientVulkan, 100);
        shader.setEnvClient(glslang::EShClientVulkan, glslang::EShTargetVulkan_1_0);
        shader.setEnvTarget(glslang::EShTargetSpv, glslang::EShTargetSpv_1_0);

        if (!shader.parse(&Babylon::DefaultTBuiltInResource, 450, false, EShMsgDefault))
        {
            throw std::exception(); //shader.getInfoDebugLog());
        }

        program.addShader(&shader);
    }

    std::unique_ptr<spirv_cross::Compiler> CompileShader(glslang::TProgram& program, EShLanguage stage, std::string& shaderResult)
    {
        std::vector<uint32_t> spirv;
        glslang::GlslangToSpv(*program.getIntermediate(stage), spirv);

        spirv_cross::Parser parser{std::move(spirv)};
        parser.parse();

        auto compiler = std::make_unique<spirv_cross::CompilerMSL>(parser.get_parsed_ir());

        auto resources = compiler->get_shader_resources();
        for (auto& resource : resources.uniform_buffers)
        {
            compiler->set_name(resource.id, "_mtl_u");
        }
        
        compiler->rename_entry_point("main", "xlatMtlMain", (stage == EShLangVertex) ? spv::ExecutionModelVertex : spv::ExecutionModelFragment);
        
        shaderResult = compiler->compile();
        return std::move(compiler);
    }
}

namespace Babylon
{
    ShaderCompiler::ShaderCompiler()
    {
        glslang::InitializeProcess();
    }

    ShaderCompiler::~ShaderCompiler()
    {
        glslang::FinalizeProcess();
    }

    void ShaderCompiler::Compile(std::string_view vertexSource, std::string_view fragmentSource, std::function<void(ShaderInfo, ShaderInfo)> onCompiled)
    {
        glslang::TProgram program;

        glslang::TShader vertexShader{EShLangVertex};
        AddShader(program, vertexShader, vertexSource);

        glslang::TShader fragmentShader{EShLangFragment};
        AddShader(program, fragmentShader, fragmentSource);
        InvertYDerivativeOperands(fragmentShader);

        if (!program.link(EShMsgDefault))
        {
            throw std::exception(); //program.getInfoDebugLog());
        }

        std::string vertexShaderMSL(vertexSource.data(), vertexSource.size());
        auto vertexCompiler = CompileShader(program, EShLangVertex, vertexShaderMSL);
        ShaderInfo vertexShaderInfo{
            std::move(vertexCompiler),
            gsl::make_span(reinterpret_cast<uint8_t*>(vertexShaderMSL.data()), vertexShaderMSL.size())};

        std::string fragmentShaderMSL(fragmentSource.data(), fragmentSource.size());
        auto fragmentCompiler = CompileShader(program, EShLangFragment, fragmentShaderMSL);
        ShaderInfo fragmentShaderInfo{
            std::move(fragmentCompiler),
            gsl::make_span(reinterpret_cast<uint8_t*>(fragmentShaderMSL.data()), fragmentShaderMSL.size())};

        onCompiled(std::move(vertexShaderInfo), std::move(fragmentShaderInfo));
    }
}
