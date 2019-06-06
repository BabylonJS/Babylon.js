#pragma once

#include <string_view>
#include <gsl/span>
#include <spirv_cross.hpp>

namespace babylon
{
    class ShaderCompiler
    {
    public:
        ShaderCompiler();
        ~ShaderCompiler();

        struct ShaderInfo
        {
            std::unique_ptr<const spirv_cross::Compiler> Compiler;
            gsl::span<uint8_t> Bytes;
        };

        void Compile(std::string_view vertexSource, std::string_view fragmentSource, std::function<void (ShaderInfo, ShaderInfo)> onCompiled);
    };
}
