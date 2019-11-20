#include "ShaderCompiler.h"

namespace Babylon
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
        // android stub
    }
}
