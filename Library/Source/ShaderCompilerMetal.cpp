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
        const std::array<const char*, 1> sources{ source.data() };
        shader.setStrings(sources.data(), gsl::narrow_cast<int>(sources.size()));
        shader.setEnvInput(glslang::EShSourceGlsl, shader.getStage(), glslang::EShClientVulkan, 100);
        shader.setEnvClient(glslang::EShClientVulkan, glslang::EShTargetVulkan_1_0);
        shader.setEnvTarget(glslang::EShTargetSpv, glslang::EShTargetSpv_1_0);

        if (!shader.parse(&babylon::DefaultTBuiltInResource, 450, false, EShMsgDefault))
        {
            throw std::exception();//shader.getInfoDebugLog());
        }

        program.addShader(&shader);
    }

    std::unique_ptr<spirv_cross::Compiler> CompileShader(glslang::TProgram& program, EShLanguage stage, std::string& shaderResult)
    {
        std::vector<uint32_t> spirv;
        glslang::GlslangToSpv(*program.getIntermediate(stage), spirv);

        spirv_cross::Parser parser{ std::move(spirv) };
        parser.parse();

        auto compiler = std::make_unique<spirv_cross::CompilerMSL>(parser.get_parsed_ir());

        shaderResult = compiler->compile();
        
        std::string sourceNoStruct(shaderResult.data(), shaderResult.size());
        const std::string main0 = "main0(";
        size_t pos = sourceNoStruct.find(main0);
        if (pos != std::string::npos)
        {
            sourceNoStruct.replace(pos, main0.size(), "xlatMtlMain(");
        }
        
        // WIP for constant names, Needed by bgfx.
        {
            const std::string frame0 = "_22";
            pos = sourceNoStruct.find(frame0);
            if (pos != std::string::npos)
            {
                sourceNoStruct.replace(pos, frame0.size(), "_mtl_u");
                while(1)
                {
                    pos = sourceNoStruct.find(frame0);
                    if (pos == std::string::npos)
                    {
                        break;
                    }
                    sourceNoStruct.replace(pos, frame0.size(), "_mtl_u");
                }
            }
        }
        
        {
            const std::string frame0 = "_69";
            pos = sourceNoStruct.find(frame0);
            if (pos != std::string::npos)
            {
                sourceNoStruct.replace(pos, frame0.size(), "_mtl_u");
                while(1)
                {
                    pos = sourceNoStruct.find(frame0);
                    if (pos == std::string::npos)
                    {
                        break;
                    }
                    sourceNoStruct.replace(pos, frame0.size(), "_mtl_u");
                }
            }
        }
        
        shaderResult = sourceNoStruct;
        return std::move(compiler);
    }
}

namespace babylon
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

        glslang::TShader vertexShader{ EShLangVertex };
        AddShader(program, vertexShader, vertexSource);

        glslang::TShader fragmentShader{ EShLangFragment };
        AddShader(program, fragmentShader, fragmentSource);
        InvertYDerivativeOperands(fragmentShader);

        if (!program.link(EShMsgDefault))
        {
            throw std::exception(); //program.getInfoDebugLog());
        }

        std::string vertexShaderMSL(vertexSource.data(), vertexSource.size());
        auto vertexCompiler = CompileShader(program, EShLangVertex, vertexShaderMSL);

        std::string fragmentShaderMSL(fragmentSource.data(), fragmentSource.size());
        auto fragmentCompiler = CompileShader(program, EShLangFragment, fragmentShaderMSL);

        uint8_t* strVertex = (uint8_t*)vertexShaderMSL.data();
        uint8_t* strFragment = (uint8_t*)fragmentShaderMSL.data();

        onCompiled
        (
            { std::move(vertexCompiler), gsl::make_span(strVertex, vertexShaderMSL.size()) },
            { std::move(fragmentCompiler), gsl::make_span(strFragment, fragmentShaderMSL.size()) }
        );
    }
}
