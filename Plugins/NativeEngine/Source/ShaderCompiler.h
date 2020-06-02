#pragma once

#include <string_view>
#include <gsl/span>
#include <functional>

namespace glslang
{
    class TShader;
}
namespace spirv_cross
{
    class Compiler;
}

namespace Babylon
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

        void Compile(std::string_view vertexSource, std::string_view fragmentSource, std::function<void(ShaderInfo, ShaderInfo)> onCompiled);

    protected:
        // Invert dFdy operands similar to bgfx_shader.sh
        // https://github.com/bkaradzic/bgfx/blob/7be225bf490bb1cd231cfb4abf7e617bf35b59cb/src/bgfx_shader.sh#L44-L45
        // https://github.com/bkaradzic/bgfx/blob/7be225bf490bb1cd231cfb4abf7e617bf35b59cb/src/bgfx_shader.sh#L62-L65
        static void InvertYDerivativeOperands(glslang::TShader& shader);
    };
}
