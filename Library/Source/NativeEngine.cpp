#include "NativeEngine.h"

#include <napi/env.h>

#include <bgfx/bgfx.h>
#include <bgfx/platform.h>
#ifndef WIN32
#include <alloca.h>
#define alloca(size) __builtin_alloca(size)
#endif
// TODO: this needs to be fixed in bgfx
namespace bgfx
{
    uint16_t attribToId(Attrib::Enum _attr);
}

#define BGFX_UNIFORM_FRAGMENTBIT UINT8_C(0x10) // Copy-pasta from bgfx_p.h
#define BGFX_UNIFORM_SAMPLERBIT UINT8_C(0x20)  // Copy-pasta from bgfx_p.h
#define BGFX_RESET_FLAGS (BGFX_RESET_VSYNC | BGFX_RESET_MSAA_X4 | BGFX_RESET_MAXANISOTROPY)

#include <bimg/bimg.h>
#include <bimg/decode.h>
#include <bimg/encode.h>

#include <bx/math.h>
#include <bx/readerwriter.h>

#include <queue>
#include <regex>
#include <sstream>

namespace Babylon
{
    namespace
    {
        template<typename AppendageT>
        inline void AppendBytes(std::vector<uint8_t>& bytes, const AppendageT appendage)
        {
            auto ptr = reinterpret_cast<const uint8_t*>(&appendage);
            auto stride = static_cast<std::ptrdiff_t>(sizeof(AppendageT));
            bytes.insert(bytes.end(), ptr, ptr + stride);
        }

        template<typename AppendageT = std::string&>
        inline void AppendBytes(std::vector<uint8_t>& bytes, const std::string& string)
        {
            auto ptr = reinterpret_cast<const uint8_t*>(string.data());
            auto stride = static_cast<std::ptrdiff_t>(string.length());
            bytes.insert(bytes.end(), ptr, ptr + stride);
        }

        template<typename ElementT>
        inline void AppendBytes(std::vector<uint8_t>& bytes, const gsl::span<ElementT>& data)
        {
            auto ptr = reinterpret_cast<const uint8_t*>(data.data());
            auto stride = static_cast<std::ptrdiff_t>(data.size() * sizeof(ElementT));
            bytes.insert(bytes.end(), ptr, ptr + stride);
        }

        void FlipYInImageBytes(gsl::span<uint8_t> bytes, size_t rowCount, size_t rowPitch)
        {
            std::vector<uint8_t> buffer{};
            buffer.reserve(rowPitch);

            for (size_t row = 0; row < rowCount / 2; row++)
            {
                auto frontPtr = bytes.data() + (row * rowPitch);
                auto backPtr = bytes.data() + ((rowCount - row - 1) * rowPitch);

                std::memcpy(buffer.data(), frontPtr, rowPitch);
                std::memcpy(frontPtr, backPtr, rowPitch);
                std::memcpy(backPtr, buffer.data(), rowPitch);
            }
        }

        void AppendUniformBuffer(std::vector<uint8_t>& bytes, const spirv_cross::Compiler& compiler, const spirv_cross::Resource& uniformBuffer, bool isFragment)
        {
            const uint8_t fragmentBit = (isFragment ? BGFX_UNIFORM_FRAGMENTBIT : 0);

            const spirv_cross::SPIRType& type = compiler.get_type(uniformBuffer.base_type_id);
            for (uint32_t index = 0; index < type.member_types.size(); ++index)
            {
                auto name = compiler.get_member_name(uniformBuffer.base_type_id, index);
                auto offset = compiler.get_member_decoration(uniformBuffer.base_type_id, index, spv::DecorationOffset);
                auto memberType = compiler.get_type(type.member_types[index]);

                bgfx::UniformType::Enum bgfxType;
                uint16_t regCount;

                if (memberType.basetype != spirv_cross::SPIRType::Float)
                {
                    throw std::exception(); // Not supported
                }

                if (memberType.columns == 1 && 1 <= memberType.vecsize && memberType.vecsize <= 4)
                {
                    bgfxType = bgfx::UniformType::Vec4;
                    regCount = 1;
                }
                else if (memberType.columns == 4 && memberType.vecsize == 4)
                {
                    bgfxType = bgfx::UniformType::Mat4;
                    regCount = 4;
                }
                else
                {
                    throw std::exception();
                }

                for (const auto size : memberType.array)
                {
                    regCount *= size;
                }

                AppendBytes(bytes, static_cast<uint8_t>(name.size()));
                AppendBytes(bytes, name);
                AppendBytes(bytes, static_cast<uint8_t>(bgfxType | fragmentBit));
                AppendBytes(bytes, static_cast<uint8_t>(0)); // Value "num" not used by D3D11 pipeline.
                AppendBytes(bytes, static_cast<uint16_t>(offset));
                AppendBytes(bytes, static_cast<uint16_t>(regCount));
            }
        }

        void AppendSamplers(std::vector<uint8_t>& bytes, const spirv_cross::Compiler& compiler, const spirv_cross::SmallVector<spirv_cross::Resource>& samplers, bool isFragment, std::unordered_map<std::string, UniformInfo>& cache)
        {
            const uint8_t fragmentBit = (isFragment ? BGFX_UNIFORM_FRAGMENTBIT : 0);

            for (const spirv_cross::Resource& sampler : samplers)
            {
                AppendBytes(bytes, static_cast<uint8_t>(sampler.name.size()));
                AppendBytes(bytes, sampler.name);
                AppendBytes(bytes, static_cast<uint8_t>(bgfx::UniformType::Sampler | BGFX_UNIFORM_SAMPLERBIT));

                // TODO : These values (num, regIndex, regCount) are only used by Vulkan and should be set for that API
                AppendBytes(bytes, static_cast<uint8_t>(0));
                AppendBytes(bytes, static_cast<uint16_t>(0));
                AppendBytes(bytes, static_cast<uint16_t>(0));

                cache[sampler.name].Stage = compiler.get_decoration(sampler.id, spv::DecorationBinding);
            }
        }

        void CacheUniformHandles(bgfx::ShaderHandle shader, std::unordered_map<std::string, UniformInfo>& cache)
        {
            const auto MAX_UNIFORMS = 256;
            bgfx::UniformHandle uniforms[MAX_UNIFORMS];
            auto numUniforms = bgfx::getShaderUniforms(shader, uniforms, MAX_UNIFORMS);

            bgfx::UniformInfo info{};
            for (uint8_t idx = 0; idx < numUniforms; idx++)
            {
                bgfx::getUniformInfo(uniforms[idx], info);
                cache[info.name].Handle = uniforms[idx];
            }
        }

        void GenerateMipmap(const uint8_t* const __restrict source, const int size, const int channels, uint8_t* __restrict dest)
        {
            int mipsize = size / 2;

            for (int y = 0; y < mipsize; ++y)
            {
                for (int x = 0; x < mipsize; ++x)
                {
                    for (int c = 0; c < channels; ++c)
                    {
                        int index = channels * ((y * 2) * size + (x * 2)) + c;
                        int sum_value = 4 >> 1;
                        sum_value += source[index + channels * (0 * size + 0)];
                        sum_value += source[index + channels * (0 * size + 1)];
                        sum_value += source[index + channels * (1 * size + 0)];
                        sum_value += source[index + channels * (1 * size + 1)];
                        dest[channels * (y * mipsize + x) + c] = (uint8_t)(sum_value / 4);
                    }
                }
            }
        }

        const bgfx::Memory* GenerateMipMaps(const bimg::ImageContainer& image)
        {
            bool widthIsPowerOf2 = ((image.m_width & (~image.m_width + 1)) == image.m_width);
            bool supportedFormat = image.m_format == bimg::TextureFormat::RGB8 || image.m_format == bimg::TextureFormat::RGBA8 || image.m_format == bimg::TextureFormat::BGRA8;
            if (image.m_width == image.m_height && image.m_width && widthIsPowerOf2 && supportedFormat)
            {
                auto channelCount = (image.m_format == bimg::TextureFormat::RGB8) ? 3 : 4;
                auto mipMapCount = static_cast<uint32_t>(std::log2(image.m_width));
                auto mipmapImageSize = image.m_size;
                for (uint32_t i = 1; i <= mipMapCount; i++)
                {
                    mipmapImageSize += image.m_size >> (2 * i);
                }
                auto imageDataRef = bgfx::alloc(mipmapImageSize);
                uint8_t* destination = imageDataRef->data;
                uint8_t* source = static_cast<uint8_t*>(image.m_data);
                memcpy(destination, source, image.m_size);
                destination += image.m_size;
                auto mipmapSize = image.m_size;
                for (uint32_t i = 0; i < mipMapCount; i++)
                {
                    GenerateMipmap(source, image.m_width >> i, channelCount, destination);
                    source = destination;
                    mipmapSize >>= 2;
                    destination += mipmapSize;
                }
                return imageDataRef;
            }
            return nullptr;
        }

        enum class WebGLAttribType
        {
            BYTE = 5120,
            UNSIGNED_BYTE = 5121,
            SHORT = 5122,
            UNSIGNED_SHORT = 5123,
            INT = 5124,
            UNSIGNED_INT = 5125,
            FLOAT = 5126
        };

        bgfx::AttribType::Enum ConvertAttribType(WebGLAttribType type)
        {
            switch (type)
            {
                case WebGLAttribType::UNSIGNED_BYTE:
                    return bgfx::AttribType::Uint8;
                case WebGLAttribType::SHORT:
                    return bgfx::AttribType::Int16;
                case WebGLAttribType::FLOAT:
                    return bgfx::AttribType::Float;
                default: // avoid "warning: 4 enumeration values not handled"
                    throw std::exception();
                    break;
            }
        }

        // Must match constants.ts in Babylon.js.
        constexpr std::array<uint64_t, 11> ALPHA_MODE{
            // ALPHA_DISABLE
            0x0,

            // ALPHA_ADD: SRC ALPHA * SRC + DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_SRC_ALPHA, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ZERO, BGFX_STATE_BLEND_ONE),

            // ALPHA_COMBINE: SRC ALPHA * SRC + (1 - SRC ALPHA) * DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_SRC_ALPHA, BGFX_STATE_BLEND_INV_SRC_ALPHA, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ONE),

            // ALPHA_SUBTRACT: DEST - SRC * DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_ZERO, BGFX_STATE_BLEND_INV_SRC_COLOR, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ONE),

            // ALPHA_MULTIPLY: SRC * DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_DST_COLOR, BGFX_STATE_BLEND_ZERO, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ONE),

            // ALPHA_MAXIMIZED: SRC ALPHA * SRC + (1 - SRC) * DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_SRC_ALPHA, BGFX_STATE_BLEND_INV_SRC_COLOR, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ONE),

            // ALPHA_ONEONE: SRC + DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ZERO, BGFX_STATE_BLEND_ONE),

            // ALPHA_PREMULTIPLIED: SRC + (1 - SRC ALPHA) * DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_INV_SRC_ALPHA, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_ONE),

            // ALPHA_PREMULTIPLIED_PORTERDUFF: SRC + (1 - SRC ALPHA) * DEST, (1 - SRC ALPHA) * DEST ALPHA
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_INV_SRC_ALPHA, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_INV_SRC_ALPHA),

            // ALPHA_INTERPOLATE: CST * SRC + (1 - CST) * DEST
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_FACTOR, BGFX_STATE_BLEND_INV_FACTOR, BGFX_STATE_BLEND_FACTOR, BGFX_STATE_BLEND_INV_FACTOR),

            // ALPHA_SCREENMODE: SRC + (1 - SRC) * DEST, SRC ALPHA + (1 - SRC ALPHA) * DEST ALPHA
            BGFX_STATE_BLEND_FUNC_SEPARATE(BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_INV_SRC_COLOR, BGFX_STATE_BLEND_ONE, BGFX_STATE_BLEND_INV_SRC_ALPHA),
        };

        constexpr std::array<bgfx::TextureFormat::Enum, 2> TEXTURE_FORMAT{
            bgfx::TextureFormat::RGBA8,
            bgfx::TextureFormat::RGBA32F};
    }

    void NativeEngine::InitializeWindow(void* nativeWindowPtr, uint32_t width, uint32_t height)
    {
        // Initialize bgfx.
        bgfx::Init init{};
        init.platformData.nwh = nativeWindowPtr;
        bgfx::setPlatformData(init.platformData);
#if (ANDROID)
        init.type = bgfx::RendererType::OpenGLES;
#else
        init.type = bgfx::RendererType::Direct3D11;
#endif
        init.resolution.width = width;
        init.resolution.height = height;
        init.resolution.reset = BGFX_RESET_FLAGS;
        init.callback = &s_bgfxCallback;
        bgfx::init(init);
        bgfx::setViewClear(0, BGFX_CLEAR_COLOR | BGFX_CLEAR_DEPTH, 0x443355FF, 1.0f, 0);
        bgfx::setViewRect(0, 0, 0, init.resolution.width, init.resolution.height);
        bgfx::touch(0);
    }

    void NativeEngine::Initialize(Napi::Env env)
    {
        // Initialize the JavaScript side.
        Napi::HandleScope scope{env};

        Napi::Function func = DefineClass(
            env,
            JS_CLASS_NAME,
            {
                InstanceMethod("getEngine", &NativeEngine::GetEngine),
                InstanceMethod("requestAnimationFrame", &NativeEngine::RequestAnimationFrame),
                InstanceMethod("createVertexArray", &NativeEngine::CreateVertexArray),
                InstanceMethod("deleteVertexArray", &NativeEngine::DeleteVertexArray),
                InstanceMethod("bindVertexArray", &NativeEngine::BindVertexArray),
                InstanceMethod("createIndexBuffer", &NativeEngine::CreateIndexBuffer),
                InstanceMethod("deleteIndexBuffer", &NativeEngine::DeleteIndexBuffer),
                InstanceMethod("recordIndexBuffer", &NativeEngine::RecordIndexBuffer),
                InstanceMethod("createVertexBuffer", &NativeEngine::CreateVertexBuffer),
                InstanceMethod("deleteVertexBuffer", &NativeEngine::DeleteVertexBuffer),
                InstanceMethod("recordVertexBuffer", &NativeEngine::RecordVertexBuffer),
                InstanceMethod("createProgram", &NativeEngine::CreateProgram),
                InstanceMethod("getUniforms", &NativeEngine::GetUniforms),
                InstanceMethod("getAttributes", &NativeEngine::GetAttributes),
                InstanceMethod("setProgram", &NativeEngine::SetProgram),
                InstanceMethod("setState", &NativeEngine::SetState),
                InstanceMethod("setZOffset", &NativeEngine::SetZOffset),
                InstanceMethod("getZOffset", &NativeEngine::GetZOffset),
                InstanceMethod("setDepthTest", &NativeEngine::SetDepthTest),
                InstanceMethod("getDepthWrite", &NativeEngine::GetDepthWrite),
                InstanceMethod("setDepthWrite", &NativeEngine::SetDepthWrite),
                InstanceMethod("setColorWrite", &NativeEngine::SetColorWrite),
                InstanceMethod("setBlendMode", &NativeEngine::SetBlendMode),
                InstanceMethod("setMatrix", &NativeEngine::SetMatrix),
                InstanceMethod("setInt", &NativeEngine::SetInt),
                InstanceMethod("setIntArray", &NativeEngine::SetIntArray),
                InstanceMethod("setIntArray2", &NativeEngine::SetIntArray2),
                InstanceMethod("setIntArray3", &NativeEngine::SetIntArray3),
                InstanceMethod("setIntArray4", &NativeEngine::SetIntArray4),
                InstanceMethod("setFloatArray", &NativeEngine::SetFloatArray),
                InstanceMethod("setFloatArray2", &NativeEngine::SetFloatArray2),
                InstanceMethod("setFloatArray3", &NativeEngine::SetFloatArray3),
                InstanceMethod("setFloatArray4", &NativeEngine::SetFloatArray4),
                InstanceMethod("setMatrices", &NativeEngine::SetMatrices),
                InstanceMethod("setMatrix3x3", &NativeEngine::SetMatrix3x3),
                InstanceMethod("setMatrix2x2", &NativeEngine::SetMatrix2x2),
                InstanceMethod("setFloat", &NativeEngine::SetFloat),
                InstanceMethod("setFloat2", &NativeEngine::SetFloat2),
                InstanceMethod("setFloat3", &NativeEngine::SetFloat3),
                InstanceMethod("setFloat4", &NativeEngine::SetFloat4),
                InstanceMethod("createTexture", &NativeEngine::CreateTexture),
                InstanceMethod("loadTexture", &NativeEngine::LoadTexture),
                InstanceMethod("loadCubeTexture", &NativeEngine::LoadCubeTexture),
                InstanceMethod("updateRawTexture", &NativeEngine::UpdateRawTexture),
                InstanceMethod("getTextureWidth", &NativeEngine::GetTextureWidth),
                InstanceMethod("getTextureHeight", &NativeEngine::GetTextureHeight),
                InstanceMethod("setTextureSampling", &NativeEngine::SetTextureSampling),
                InstanceMethod("setTextureWrapMode", &NativeEngine::SetTextureWrapMode),
                InstanceMethod("setTextureAnisotropicLevel", &NativeEngine::SetTextureAnisotropicLevel),
                InstanceMethod("setTexture", &NativeEngine::SetTexture),
                InstanceMethod("deleteTexture", &NativeEngine::DeleteTexture),
                InstanceMethod("createFramebuffer", &NativeEngine::CreateFrameBuffer),
                InstanceMethod("deleteFramebuffer", &NativeEngine::DeleteFrameBuffer),
                InstanceMethod("bindFramebuffer", &NativeEngine::BindFrameBuffer),
                InstanceMethod("unbindFramebuffer", &NativeEngine::UnbindFrameBuffer),
                InstanceMethod("drawIndexed", &NativeEngine::DrawIndexed),
                InstanceMethod("draw", &NativeEngine::Draw),
                InstanceMethod("clear", &NativeEngine::Clear),
                InstanceMethod("clearColor", &NativeEngine::ClearColor),
                InstanceMethod("clearDepth", &NativeEngine::ClearDepth),
                InstanceMethod("clearStencil", &NativeEngine::ClearStencil),
                InstanceMethod("getRenderWidth", &NativeEngine::GetRenderWidth),
                InstanceMethod("getRenderHeight", &NativeEngine::GetRenderHeight),
                InstanceMethod("setViewPort", &NativeEngine::SetViewPort),
                InstanceMethod("getFramebufferData", &NativeEngine::GetFramebufferData),
                InstanceMethod("decodeImage", &NativeEngine::DecodeImage),
                InstanceMethod("getImageData", &NativeEngine::GetImageData),
                InstanceMethod("encodeImage", &NativeEngine::EncodeImage),
            });

        env.Global().Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>().Set(JS_ENGINE_CONSTRUCTOR_NAME, func);
    }

    NativeEngine::NativeEngine(const Napi::CallbackInfo& info)
        : NativeEngine(info, NativeWindow::GetFromJavaScript(info.Env()))
    {
    }

    NativeEngine::NativeEngine(const Napi::CallbackInfo& info, NativeWindow& nativeWindow)
        : Napi::ObjectWrap<NativeEngine>{info}
        , m_runtime{JsRuntime::GetFromJavaScript(info.Env())}
        , m_currentProgram{nullptr}
        , m_engineState{BGFX_STATE_DEFAULT}
        , m_resizeCallbackTicket{nativeWindow.AddOnResizeCallback([this](size_t width, size_t height) { this->UpdateSize(width, height); })}
    {
        UpdateSize(static_cast<uint32_t>(nativeWindow.GetWidth()), static_cast<uint32_t>(nativeWindow.GetHeight()));
    }

    NativeEngine::~NativeEngine()
    {
        // This collection contains bgfx data, so it must be cleared before bgfx::shutdown is called.
        m_programDataCollection.clear();

        bgfx::shutdown();
    }

    void NativeEngine::UpdateSize(size_t width, size_t height)
    {
        const auto w = static_cast<uint16_t>(width);
        const auto h = static_cast<uint16_t>(height);

        auto bgfxStats = bgfx::getStats();
        if (w != bgfxStats->width || h != bgfxStats->height)
        {
            bgfx::reset(w, h, BGFX_RESET_FLAGS);
            bgfx::setViewRect(0, 0, 0, w, h);
#ifdef __APPLE__
            bgfx::frame();
#else
            bgfx::touch(0);
#endif
        }
    }

    FrameBufferManager& NativeEngine::GetFrameBufferManager()
    {
        return m_frameBufferManager;
    }

    // NativeEngine definitions
    Napi::Value NativeEngine::GetEngine(const Napi::CallbackInfo& info)
    {
        return Napi::External<NativeEngine>::New(info.Env(), this);
    }

    void NativeEngine::RequestAnimationFrame(const Napi::CallbackInfo& info)
    {
        DispatchAnimationFrameAsync(Napi::Persistent(info[0].As<Napi::Function>()));
    }

    Napi::Value NativeEngine::CreateVertexArray(const Napi::CallbackInfo& info)
    {
        return Napi::External<VertexArray>::New(info.Env(), new VertexArray{});
    }

    void NativeEngine::DeleteVertexArray(const Napi::CallbackInfo& info)
    {
        delete info[0].As<Napi::External<VertexArray>>().Data();
    }

    void NativeEngine::BindVertexArray(const Napi::CallbackInfo& info)
    {
        const auto& vertexArray = *(info[0].As<Napi::External<VertexArray>>().Data());

        bgfx::setIndexBuffer(vertexArray.indexBuffer.handle);

        const auto& vertexBuffers = vertexArray.vertexBuffers;
        for (uint8_t index = 0; index < vertexBuffers.size(); ++index)
        {
            const auto& vertexBuffer = vertexBuffers[index];
            bgfx::setVertexBuffer(index, vertexBuffer.handle, vertexBuffer.startVertex, UINT32_MAX, vertexBuffer.vertexLayoutHandle);
        }
    }

    Napi::Value NativeEngine::CreateIndexBuffer(const Napi::CallbackInfo& info)
    {
        const Napi::TypedArray data = info[0].As<Napi::TypedArray>();
        const bgfx::Memory* ref = bgfx::copy(data.As<Napi::Uint8Array>().Data(), static_cast<uint32_t>(data.ByteLength()));
        const uint16_t flags = data.TypedArrayType() == napi_typedarray_type::napi_uint16_array ? 0 : BGFX_BUFFER_INDEX32;
        const bgfx::IndexBufferHandle handle = bgfx::createIndexBuffer(ref, flags);
        return Napi::Value::From(info.Env(), static_cast<uint32_t>(handle.idx));
    }

    void NativeEngine::DeleteIndexBuffer(const Napi::CallbackInfo& info)
    {
        const bgfx::IndexBufferHandle handle{static_cast<uint16_t>(info[0].As<Napi::Number>().Uint32Value())};
        bgfx::destroy(handle);
    }

    void NativeEngine::RecordIndexBuffer(const Napi::CallbackInfo& info)
    {
        VertexArray& vertexArray = *(info[0].As<Napi::External<VertexArray>>().Data());
        const bgfx::IndexBufferHandle handle{static_cast<uint16_t>(info[1].As<Napi::Number>().Uint32Value())};
        vertexArray.indexBuffer.handle = handle;
    }

    Napi::Value NativeEngine::CreateVertexBuffer(const Napi::CallbackInfo& info)
    {
        const Napi::Uint8Array data = info[0].As<Napi::Uint8Array>();

        // HACK: Create an empty valid vertex decl which will never be used. Consider fixing in bgfx.
        bgfx::VertexLayout vertexLayout;
        vertexLayout.begin();
        vertexLayout.m_stride = 1;
        vertexLayout.end();

        const bgfx::Memory* ref = bgfx::copy(data.Data(), static_cast<uint32_t>(data.ByteLength()));
        const bgfx::VertexBufferHandle handle = bgfx::createVertexBuffer(ref, vertexLayout);
        return Napi::Value::From(info.Env(), static_cast<uint32_t>(handle.idx));
    }

    void NativeEngine::DeleteVertexBuffer(const Napi::CallbackInfo& info)
    {
        const bgfx::VertexBufferHandle handle{static_cast<uint16_t>(info[0].As<Napi::Number>().Uint32Value())};
        bgfx::destroy(handle);
    }

    void NativeEngine::RecordVertexBuffer(const Napi::CallbackInfo& info)
    {
        VertexArray& vertexArray = *(info[0].As<Napi::External<VertexArray>>().Data());
        const bgfx::VertexBufferHandle handle{static_cast<uint16_t>(info[1].As<Napi::Number>().Uint32Value())};
        const uint32_t location = info[2].As<Napi::Number>().Uint32Value();
        const uint32_t byteOffset = info[3].As<Napi::Number>().Uint32Value();
        const uint32_t byteStride = info[4].As<Napi::Number>().Uint32Value();
        const uint32_t numElements = info[5].As<Napi::Number>().Uint32Value();
        const uint32_t type = info[6].As<Napi::Number>().Uint32Value();
        const bool normalized = info[7].As<Napi::Boolean>().Value();

        bgfx::VertexLayout vertexLayout;
        vertexLayout.begin();
        const bgfx::Attrib::Enum attrib = static_cast<bgfx::Attrib::Enum>(location);
        const bgfx::AttribType::Enum attribType = ConvertAttribType(static_cast<WebGLAttribType>(type));
        vertexLayout.add(attrib, numElements, attribType, normalized);
        vertexLayout.m_stride = static_cast<uint16_t>(byteStride);
        vertexLayout.end();

        vertexArray.vertexBuffers.push_back({std::move(handle), byteOffset / byteStride, bgfx::createVertexLayout(vertexLayout)});
    }

    Napi::Value NativeEngine::CreateProgram(const Napi::CallbackInfo& info)
    {
        const auto vertexSource = info[0].As<Napi::String>().Utf8Value();
        const auto fragmentSource = info[1].As<Napi::String>().Utf8Value();

        auto programData = std::make_unique<ProgramData>();

        std::vector<uint8_t> vertexBytes{};
        std::vector<uint8_t> fragmentBytes{};
        std::unordered_map<std::string, uint32_t> attributeLocations;

        m_shaderCompiler.Compile(vertexSource, fragmentSource, [&](ShaderCompiler::ShaderInfo vertexShaderInfo, ShaderCompiler::ShaderInfo fragmentShaderInfo) {
            constexpr uint8_t BGFX_SHADER_BIN_VERSION = 6;

            // These hashes are generated internally by BGFX's custom shader compilation pipeline,
            // which we don't have access to.  Fortunately, however, they aren't used for anything
            // crucial; they just have to match.
            constexpr uint32_t vertexOutputsHash = 0xBAD1DEA;
            constexpr uint32_t fragmentInputsHash = vertexOutputsHash;

            {
                const spirv_cross::Compiler& compiler = *vertexShaderInfo.Compiler;
                const spirv_cross::ShaderResources resources = compiler.get_shader_resources();
                assert(resources.uniform_buffers.size() == 1);
                const spirv_cross::Resource& uniformBuffer = resources.uniform_buffers[0];
                const spirv_cross::SmallVector<spirv_cross::Resource>& samplers = resources.separate_samplers;
                size_t numUniforms = compiler.get_type(uniformBuffer.base_type_id).member_types.size() + samplers.size();

                AppendBytes(vertexBytes, BX_MAKEFOURCC('V', 'S', 'H', BGFX_SHADER_BIN_VERSION));
                AppendBytes(vertexBytes, vertexOutputsHash);
                AppendBytes(vertexBytes, fragmentInputsHash);

                AppendBytes(vertexBytes, static_cast<uint16_t>(numUniforms));
                AppendUniformBuffer(vertexBytes, compiler, uniformBuffer, false);
                AppendSamplers(vertexBytes, compiler, samplers, false, programData->VertexUniformNameToInfo);

                AppendBytes(vertexBytes, static_cast<uint32_t>(vertexShaderInfo.Bytes.size()));
                AppendBytes(vertexBytes, vertexShaderInfo.Bytes);
                AppendBytes(vertexBytes, static_cast<uint8_t>(0));

                AppendBytes(vertexBytes, static_cast<uint8_t>(resources.stage_inputs.size()));
                for (const spirv_cross::Resource& stageInput : resources.stage_inputs)
                {
                    const uint32_t location = compiler.get_decoration(stageInput.id, spv::DecorationLocation);
                    AppendBytes(vertexBytes, bgfx::attribToId(static_cast<bgfx::Attrib::Enum>(location)));

                    std::string attributeName = stageInput.name;
                    if (attributeName == "a_position")
                        attributeName = "position";
                    else if (attributeName == "a_normal")
                        attributeName = "normal";
                    else if (attributeName == "a_tangent")
                        attributeName = "tangent";
                    else if (attributeName == "a_texcoord0")
                        attributeName = "uv";
                    else if (attributeName == "a_texcoord1")
                        attributeName = "uv2";
                    else if (attributeName == "a_texcoord2")
                        attributeName = "uv3";
                    else if (attributeName == "a_texcoord3")
                        attributeName = "uv4";
                    else if (attributeName == "a_color0")
                        attributeName = "color";
                    else if (attributeName == "a_indices")
                        attributeName = "matricesIndices";
                    else if (attributeName == "a_weight")
                        attributeName = "matricesWeights";

                    attributeLocations[attributeName] = location;
                }

                AppendBytes(vertexBytes, static_cast<uint16_t>(compiler.get_declared_struct_size(compiler.get_type(uniformBuffer.base_type_id))));
            }

            {
                const spirv_cross::Compiler& compiler = *fragmentShaderInfo.Compiler;
                const spirv_cross::ShaderResources resources = compiler.get_shader_resources();
                assert(resources.uniform_buffers.size() == 1);
                const spirv_cross::Resource& uniformBuffer = resources.uniform_buffers[0];
                const spirv_cross::SmallVector<spirv_cross::Resource>& samplers = resources.separate_samplers;
                size_t numUniforms = compiler.get_type(uniformBuffer.base_type_id).member_types.size() + samplers.size();

                AppendBytes(fragmentBytes, BX_MAKEFOURCC('F', 'S', 'H', BGFX_SHADER_BIN_VERSION));
                AppendBytes(fragmentBytes, vertexOutputsHash);
                AppendBytes(fragmentBytes, fragmentInputsHash);

                AppendBytes(fragmentBytes, static_cast<uint16_t>(numUniforms));
                AppendUniformBuffer(fragmentBytes, compiler, uniformBuffer, true);
                AppendSamplers(fragmentBytes, compiler, samplers, true, programData->FragmentUniformNameToInfo);

                AppendBytes(fragmentBytes, static_cast<uint32_t>(fragmentShaderInfo.Bytes.size()));
                AppendBytes(fragmentBytes, fragmentShaderInfo.Bytes);
                AppendBytes(fragmentBytes, static_cast<uint8_t>(0));

                // Fragment shaders don't have attributes.
                AppendBytes(fragmentBytes, static_cast<uint8_t>(0));

                AppendBytes(fragmentBytes, static_cast<uint16_t>(compiler.get_declared_struct_size(compiler.get_type(uniformBuffer.base_type_id))));
            }
        });

        auto vertexShader = bgfx::createShader(bgfx::copy(vertexBytes.data(), static_cast<uint32_t>(vertexBytes.size())));
        CacheUniformHandles(vertexShader, programData->VertexUniformNameToInfo);
        programData->AttributeLocations = std::move(attributeLocations);

        auto fragmentShader = bgfx::createShader(bgfx::copy(fragmentBytes.data(), static_cast<uint32_t>(fragmentBytes.size())));
        CacheUniformHandles(fragmentShader, programData->FragmentUniformNameToInfo);

        programData->Program = bgfx::createProgram(vertexShader, fragmentShader, true);

        auto* rawProgramData = programData.get();
        auto ticket = m_programDataCollection.insert(std::move(programData));
        auto finalizer = [ticket = std::move(ticket)](Napi::Env, ProgramData*) {};
        return Napi::External<ProgramData>::New(info.Env(), rawProgramData, std::move(finalizer));
    }

    Napi::Value NativeEngine::GetUniforms(const Napi::CallbackInfo& info)
    {
        const auto program = info[0].As<Napi::External<ProgramData>>().Data();
        const auto names = info[1].As<Napi::Array>();

        auto length = names.Length();
        auto uniforms = Napi::Array::New(info.Env(), length);
        for (uint32_t index = 0; index < length; ++index)
        {
            const auto name = names[index].As<Napi::String>().Utf8Value();

            auto vertexFound = program->VertexUniformNameToInfo.find(name);
            auto fragmentFound = program->FragmentUniformNameToInfo.find(name);

            if (vertexFound != program->VertexUniformNameToInfo.end())
            {
                uniforms[index] = Napi::External<UniformInfo>::New(info.Env(), &vertexFound->second);
            }
            else if (fragmentFound != program->FragmentUniformNameToInfo.end())
            {
                uniforms[index] = Napi::External<UniformInfo>::New(info.Env(), &fragmentFound->second);
            }
            else
            {
                uniforms[index] = info.Env().Null();
            }
        }

        return uniforms;
    }

    Napi::Value NativeEngine::GetAttributes(const Napi::CallbackInfo& info)
    {
        const auto program = info[0].As<Napi::External<ProgramData>>().Data();
        const auto names = info[1].As<Napi::Array>();

        const auto& attributeLocations = program->AttributeLocations;

        auto length = names.Length();
        auto attributes = Napi::Array::New(info.Env(), length);
        for (uint32_t index = 0; index < length; ++index)
        {
            const auto name = names[index].As<Napi::String>().Utf8Value();
            const auto it = attributeLocations.find(name);
            int location = (it == attributeLocations.end() ? -1 : gsl::narrow_cast<int>(it->second));
            attributes[index] = Napi::Value::From(info.Env(), location);
        }

        return attributes;
    }

    void NativeEngine::SetProgram(const Napi::CallbackInfo& info)
    {
        auto program = info[0].As<Napi::External<ProgramData>>().Data();
        m_currentProgram = program;
    }

    void NativeEngine::SetState(const Napi::CallbackInfo& info)
    {
        const auto culling = info[0].As<Napi::Boolean>().Value();
        const auto reverseSide = info[2].As<Napi::Boolean>().Value();

        m_engineState &= ~BGFX_STATE_CULL_MASK;
        if (reverseSide)
        {
            m_engineState &= ~BGFX_STATE_FRONT_CCW;

            if (culling)
            {
                m_engineState |= BGFX_STATE_CULL_CW;
            }
        }
        else
        {
            m_engineState |= BGFX_STATE_FRONT_CCW;

            if (culling)
            {
                m_engineState |= BGFX_STATE_CULL_CCW;
            }
        }

        // TODO: zOffset
        const auto zOffset = info[1].As<Napi::Number>().FloatValue();
    }

    void NativeEngine::SetZOffset(const Napi::CallbackInfo& info)
    {
        const auto zOffset = info[0].As<Napi::Number>().FloatValue();

        // STUB: Stub.
    }

    Napi::Value NativeEngine::GetZOffset(const Napi::CallbackInfo& info)
    {
        // STUB: Stub.
        return {};
    }

    void NativeEngine::SetDepthTest(const Napi::CallbackInfo& info)
    {
        const auto enable = info[0].As<Napi::Boolean>().Value();

        m_engineState &= ~BGFX_STATE_DEPTH_TEST_MASK;
        m_engineState |= enable ? BGFX_STATE_DEPTH_TEST_LESS : BGFX_STATE_DEPTH_TEST_ALWAYS;
    }

    Napi::Value NativeEngine::GetDepthWrite(const Napi::CallbackInfo& info)
    {
        return Napi::Value::From(info.Env(), !!(m_engineState & BGFX_STATE_WRITE_Z));
    }

    void NativeEngine::SetDepthWrite(const Napi::CallbackInfo& info)
    {
        const auto enable = info[0].As<Napi::Boolean>().Value();

        m_engineState &= ~BGFX_STATE_WRITE_Z;
        m_engineState |= enable ? BGFX_STATE_WRITE_Z : 0;
    }

    void NativeEngine::SetColorWrite(const Napi::CallbackInfo& info)
    {
        const auto enable = info[0].As<Napi::Boolean>().Value();

        m_engineState &= ~(BGFX_STATE_WRITE_RGB | BGFX_STATE_WRITE_A);
        m_engineState |= enable ? (BGFX_STATE_WRITE_RGB | BGFX_STATE_WRITE_A) : 0;
    }

    void NativeEngine::SetBlendMode(const Napi::CallbackInfo& info)
    {
        const auto blendMode = info[0].As<Napi::Number>().Int32Value();

        m_engineState &= ~BGFX_STATE_BLEND_MASK;
        m_engineState |= ALPHA_MODE[blendMode];
    }

    void NativeEngine::SetInt(const Napi::CallbackInfo& info)
    {
        const auto uniformData = info[0].As<Napi::External<UniformInfo>>().Data();
        const auto value = info[1].As<Napi::Number>().FloatValue();
        m_currentProgram->SetUniform(uniformData->Handle, gsl::make_span(&value, 1));
    }

    template<int size, typename arrayType>
    void NativeEngine::SetTypeArrayN(const Napi::CallbackInfo& info)
    {
        const auto uniformData = info[0].As<Napi::External<UniformInfo>>().Data();
        const auto array = info[1].As<arrayType>();

        size_t elementLength = array.ElementLength();

        m_scratch.clear();
        for (size_t index = 0; index < elementLength; index += size)
        {
            const float values[] = {
                static_cast<float>(array[index]),
                (size > 1) ? static_cast<float>(array[index + 1]) : 0.f,
                (size > 2) ? static_cast<float>(array[index + 2]) : 0.f,
                (size > 3) ? static_cast<float>(array[index + 3]) : 0.f,
            };
            m_scratch.insert(m_scratch.end(), values, values + 4);
        }

        m_currentProgram->SetUniform(uniformData->Handle, m_scratch, elementLength / size);
    }

    template<int size>
    void NativeEngine::SetFloatN(const Napi::CallbackInfo& info)
    {
        const auto uniformData = info[0].As<Napi::External<UniformInfo>>().Data();
        const float values[] = {
            info[1].As<Napi::Number>().FloatValue(),
            (size > 1) ? info[2].As<Napi::Number>().FloatValue() : 0.f,
            (size > 2) ? info[3].As<Napi::Number>().FloatValue() : 0.f,
            (size > 3) ? info[4].As<Napi::Number>().FloatValue() : 0.f,
        };

        m_currentProgram->SetUniform(uniformData->Handle, values);
    }

    template<int size>
    void NativeEngine::SetMatrixN(const Napi::CallbackInfo& info)
    {
        const auto uniformData = info[0].As<Napi::External<UniformInfo>>().Data();
        const auto matrix = info[1].As<Napi::Float32Array>();

        const size_t elementLength = matrix.ElementLength();
        assert(elementLength == size * size);

        if (size < 4)
        {
            std::array<float, 16> matrixValues{};

            size_t index = 0;
            for (int line = 0; line < size; line++)
            {
                for (int col = 0; col < size; col++)
                {
                    matrixValues[line * 4 + col] = matrix[index++];
                }
            }

            m_currentProgram->SetUniform(uniformData->Handle, gsl::make_span(matrixValues.data(), 16));
        }
        else
        {
            m_currentProgram->SetUniform(uniformData->Handle, gsl::make_span(matrix.Data(), elementLength));
        }
    }

    void NativeEngine::SetIntArray(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<1, Napi::Int32Array>(info);
    }

    void NativeEngine::SetIntArray2(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<2, Napi::Int32Array>(info);
    }

    void NativeEngine::SetIntArray3(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<3, Napi::Int32Array>(info);
    }

    void NativeEngine::SetIntArray4(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<4, Napi::Int32Array>(info);
    }

    void NativeEngine::SetFloatArray(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<1, Napi::Float32Array>(info);
    }

    void NativeEngine::SetFloatArray2(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<2, Napi::Float32Array>(info);
    }

    void NativeEngine::SetFloatArray3(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<3, Napi::Float32Array>(info);
    }

    void NativeEngine::SetFloatArray4(const Napi::CallbackInfo& info)
    {
        SetTypeArrayN<4, Napi::Float32Array>(info);
    }

    void NativeEngine::SetMatrices(const Napi::CallbackInfo& info)
    {
        const auto uniformData = info[0].As<Napi::External<UniformInfo>>().Data();
        const auto matricesArray = info[1].As<Napi::Float32Array>();

        const size_t elementLength = matricesArray.ElementLength();
        assert(elementLength % 16 == 0);

        m_currentProgram->SetUniform(uniformData->Handle, gsl::span(matricesArray.Data(), elementLength), elementLength / 16);
    }

    void NativeEngine::SetMatrix2x2(const Napi::CallbackInfo& info)
    {
        SetMatrixN<2>(info);
    }

    void NativeEngine::SetMatrix3x3(const Napi::CallbackInfo& info)
    {
        SetMatrixN<3>(info);
    }

    void NativeEngine::SetMatrix(const Napi::CallbackInfo& info)
    {
        SetMatrixN<4>(info);
    }

    void NativeEngine::SetFloat(const Napi::CallbackInfo& info)
    {
        SetFloatN<1>(info);
    }

    void NativeEngine::SetFloat2(const Napi::CallbackInfo& info)
    {
        SetFloatN<2>(info);
    }

    void NativeEngine::SetFloat3(const Napi::CallbackInfo& info)
    {
        SetFloatN<3>(info);
    }

    void NativeEngine::SetFloat4(const Napi::CallbackInfo& info)
    {
        SetFloatN<4>(info);
    }

    Napi::Value NativeEngine::CreateTexture(const Napi::CallbackInfo& info)
    {
        return Napi::External<TextureData>::New(info.Env(), new TextureData());
    }

    Napi::Value NativeEngine::DecodeImage(const Napi::CallbackInfo& info)
    {
        auto imageData = new ImageData();
        const auto buffer = info[0].As<Napi::ArrayBuffer>();

        imageData->Image.reset(bimg::imageParse(&m_allocator, buffer.Data(), static_cast<uint32_t>(buffer.ByteLength())));

        return Napi::External<ImageData>::New(info.Env(), imageData);
    }

    Napi::Value NativeEngine::GetImageData(const Napi::CallbackInfo& info)
    {
        const auto imageData = info[0].As<Napi::External<ImageData>>().Data();

        if (!imageData->Image || !imageData->Image->m_size)
        {
            return info.Env().Undefined();
        }

        auto data = Napi::Uint8Array::New(info.Env(), imageData->Image->m_size);
        const auto ptr = static_cast<uint8_t*>(imageData->Image->m_data);
        memcpy(data.Data(), ptr, imageData->Image->m_size);

        return data;
    }

    Napi::Value NativeEngine::EncodeImage(const Napi::CallbackInfo& info)
    {
        const auto imageData = info[0].As<Napi::External<ImageData>>().Data();
        if (!imageData->Image || !imageData->Image->m_size)
        {
            return info.Env().Undefined();
        }

        const auto image = imageData->Image.get();
        bx::MemoryBlock mb(&m_allocator);
        bx::MemoryWriter writer(&mb);
        bimg::imageWritePng(&writer, image->m_width, image->m_height, image->m_size / image->m_height, image->m_data, image->m_format, false);

        auto data = Napi::Uint8Array::New(info.Env(), mb.getSize());
        memcpy(data.Data(), static_cast<uint8_t*>(mb.more()), imageData->Image->m_size);

        return data;
    }

    void NativeEngine::ConvertImageToTexture(TextureData* const textureData, bimg::ImageContainer& image, bool invertY, bool mipMap) const
    {
        bool useMipMap = false;

        if (invertY)
        {
            FlipYInImageBytes(gsl::make_span(static_cast<uint8_t*>(image.m_data), image.m_size), image.m_height, image.m_size / image.m_height);
        }

        auto imageDataRef{bgfx::makeRef(image.m_data, image.m_size)};

        if (mipMap)
        {
            auto imageDataRefMipMap = GenerateMipMaps(image);
            if (imageDataRefMipMap)
            {
                imageDataRef = imageDataRefMipMap;
                useMipMap = true;
            }
            // TODO: log a warning message: "Could not generate mipmap for texture"
        }

        textureData->Texture = bgfx::createTexture2D(
            image.m_width,
            image.m_height,
            useMipMap,
            1,
            static_cast<bgfx::TextureFormat::Enum>(image.m_format),
            0,
            imageDataRef);
    }

    Napi::Value NativeEngine::LoadTexture(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        const auto buffer = info[1].As<Napi::ArrayBuffer>();
        const auto mipMap = info[2].As<Napi::Boolean>().Value();
        const auto invertY = info[3].As<Napi::Boolean>().Value();

        textureData->Images.push_back(bimg::imageParse(&m_allocator, buffer.Data(), static_cast<uint32_t>(buffer.ByteLength())));
        auto& image = *textureData->Images.front();

        ConvertImageToTexture(textureData, image, invertY, mipMap);
        return Napi::Value::From(info.Env(), bgfx::isValid(textureData->Texture));
    }

    void NativeEngine::UpdateRawTexture(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        const auto width = static_cast<uint32_t>(info[2].As<Napi::Number>().Uint32Value());
        const auto height = static_cast<uint32_t>(info[3].As<Napi::Number>().Uint32Value());
        const auto formatIndex = info[4].As<Napi::Number>().Uint32Value();
        const auto mipMap = info[5].As<Napi::Boolean>().Value();
        const auto invertY = info[6].As<Napi::Boolean>().Value();

        const void* data = nullptr;

        switch(formatIndex)
        {
        case 0: // RGBA8
            data = info[1].As<Napi::Uint8Array>().Data();
            break;
        case 1: // RGBA32F
            data = info[1].As<Napi::Float32Array>().Data();
            break;
        default:
            throw std::exception(); // unsupported format
        }

        auto image = bimg::imageAlloc(&m_allocator, (bimg::TextureFormat::Enum)TEXTURE_FORMAT[formatIndex], width, height, 1, 1, false, false, data);
        ConvertImageToTexture(textureData, *image, invertY, mipMap);
    }

    Napi::Value NativeEngine::LoadCubeTexture(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        const auto mipLevelsArray = info[1].As<Napi::Array>();
        const auto flipY = info[2].As<Napi::Boolean>().Value();

        std::vector<std::vector<bimg::ImageContainer*>> images{};
        images.reserve(mipLevelsArray.Length());

        uint32_t totalSize = 0;

        for (uint32_t mipLevel = 0; mipLevel < mipLevelsArray.Length(); mipLevel++)
        {
            const auto facesArray = mipLevelsArray[mipLevel].As<Napi::Array>();

            images.emplace_back().reserve(facesArray.Length());

            for (uint32_t face = 0; face < facesArray.Length(); face++)
            {
                const auto image = facesArray[face].As<Napi::TypedArray>();
                auto buffer = gsl::make_span(static_cast<uint8_t*>(image.ArrayBuffer().Data()) + image.ByteOffset(), image.ByteLength());

                textureData->Images.push_back(bimg::imageParse(&m_allocator, buffer.data(), static_cast<uint32_t>(buffer.size())));
                images.back().push_back(textureData->Images.back());
                totalSize += static_cast<uint32_t>(images.back().back()->m_size);
            }
        }

        auto allPixels = bgfx::alloc(totalSize);

        auto ptr = allPixels->data;
        for (uint32_t face = 0; face < images.front().size(); face++)
        {
            for (uint32_t mipLevel = 0; mipLevel < images.size(); mipLevel++)
            {
                const auto image = images[mipLevel][face];

                std::memcpy(ptr, image->m_data, image->m_size);

                if (flipY)
                {
                    FlipYInImageBytes(gsl::make_span(ptr, image->m_size), image->m_height, image->m_size / image->m_height);
                }

                ptr += image->m_size;
            }
        }

        bgfx::TextureFormat::Enum format{};
        switch (images.front().front()->m_format)
        {
            case bimg::TextureFormat::RGBA8:
            {
                format = bgfx::TextureFormat::RGBA8;
                break;
            }
            case bimg::TextureFormat::RGB8:
            {
                format = bgfx::TextureFormat::RGB8;
                break;
            }
            default:
            {
                throw std::exception();
            }
        }

        textureData->Texture = bgfx::createTextureCube(
            images.front().front()->m_width, // Side size
            true,                            // Has mips
            1,                               // Number of layers
            format,                          // Self-explanatory
            0x0,                             // Flags
            allPixels);                      // Memory
        return Napi::Value::From(info.Env(), bgfx::isValid(textureData->Texture));
    }

    Napi::Value NativeEngine::GetTextureWidth(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        assert(textureData->Images.size() > 0 && !textureData->Images.front()->m_cubeMap);
        return Napi::Value::From(info.Env(), textureData->Images.front()->m_width);
    }

    Napi::Value NativeEngine::GetTextureHeight(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        assert(textureData->Images.size() > 0 && !textureData->Images.front()->m_cubeMap);
        return Napi::Value::From(info.Env(), textureData->Images.front()->m_width);
    }

    void NativeEngine::SetTextureSampling(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        auto filter = static_cast<uint32_t>(info[1].As<Napi::Number>().Uint32Value());

        constexpr std::array<uint32_t, 12> bgfxFiltering = {
            BGFX_SAMPLER_MAG_POINT | BGFX_SAMPLER_MIN_POINT,                          // nearest is mag = nearest and min = nearest and mip = linear
            BGFX_SAMPLER_MIP_POINT,                                                   // Bilinear is mag = linear and min = linear and mip = nearest
            0,                                                                        // Trilinear is mag = linear and min = linear and mip = linear
            BGFX_SAMPLER_MIN_POINT | BGFX_SAMPLER_MAG_POINT | BGFX_SAMPLER_MIP_POINT, // mag = nearest and min = nearest and mip = nearest
            BGFX_SAMPLER_MAG_POINT | BGFX_SAMPLER_MIP_POINT,                          // mag = nearest and min = linear and mip = nearest
            BGFX_SAMPLER_MAG_POINT,                                                   // mag = nearest and min = linear and mip = linear
            BGFX_SAMPLER_MAG_POINT,                                                   // mag = nearest and min = linear and mip = none
            BGFX_SAMPLER_MAG_POINT | BGFX_SAMPLER_MIN_POINT,                          // mag = nearest and min = nearest and mip = none
            BGFX_SAMPLER_MIP_POINT | BGFX_SAMPLER_MIP_POINT,                          // mag = linear and min = nearest and mip = nearest
            BGFX_SAMPLER_MIN_POINT,                                                   // mag = linear and min = nearest and mip = linear
            0,                                                                        // mag = linear and min = linear and mip = none
            BGFX_SAMPLER_MIN_POINT};                                                  // mag = linear and min = nearest and mip = none

        textureData->Flags &= ~(BGFX_SAMPLER_MIN_MASK | BGFX_SAMPLER_MAG_MASK | BGFX_SAMPLER_MIP_MASK);

        if (textureData->AnisotropicLevel > 1)
        {
            textureData->Flags |= BGFX_SAMPLER_MIN_ANISOTROPIC | BGFX_SAMPLER_MAG_ANISOTROPIC;
        }
        else
        {
            textureData->Flags |= bgfxFiltering[filter];
        }
    }

    void NativeEngine::SetTextureWrapMode(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        auto addressModeU = static_cast<uint32_t>(info[1].As<Napi::Number>().Uint32Value());
        auto addressModeV = static_cast<uint32_t>(info[2].As<Napi::Number>().Uint32Value());
        auto addressModeW = static_cast<uint32_t>(info[3].As<Napi::Number>().Uint32Value());

        constexpr std::array<uint32_t, 3> bgfxSamplers = {0, BGFX_SAMPLER_U_CLAMP, BGFX_SAMPLER_U_MIRROR};

        uint32_t addressMode = bgfxSamplers[addressModeU] +
            (bgfxSamplers[addressModeV] << BGFX_SAMPLER_V_SHIFT) +
            (bgfxSamplers[addressModeW] << BGFX_SAMPLER_W_SHIFT);

        textureData->Flags &= ~(BGFX_SAMPLER_U_MASK | BGFX_SAMPLER_V_MASK | BGFX_SAMPLER_W_MASK);
        textureData->Flags |= addressMode;
    }

    void NativeEngine::SetTextureAnisotropicLevel(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        const auto value = info[1].As<Napi::Number>().Uint32Value();

        textureData->AnisotropicLevel = value;

        // if Anisotropic is set to 0 after being >1, then set texture flags back to linear
        textureData->Flags &= ~(BGFX_SAMPLER_MIN_MASK | BGFX_SAMPLER_MAG_MASK | BGFX_SAMPLER_MIP_MASK);
        if (value)
        {
            textureData->Flags |= BGFX_SAMPLER_MIN_ANISOTROPIC | BGFX_SAMPLER_MAG_ANISOTROPIC;
        }
    }

    void NativeEngine::SetTexture(const Napi::CallbackInfo& info)
    {
        const auto uniformData = info[0].As<Napi::External<UniformInfo>>().Data();
        const auto textureData = info[1].As<Napi::External<TextureData>>().Data();

        bgfx::setTexture(uniformData->Stage, uniformData->Handle, textureData->Texture, textureData->Flags);
    }

    void NativeEngine::DeleteTexture(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        delete textureData;
    }

    Napi::Value NativeEngine::CreateFrameBuffer(const Napi::CallbackInfo& info)
    {
        const auto textureData = info[0].As<Napi::External<TextureData>>().Data();
        uint16_t width = static_cast<uint16_t>(info[1].As<Napi::Number>().Uint32Value());
        uint16_t height = static_cast<uint16_t>(info[2].As<Napi::Number>().Uint32Value());
        uint32_t formatIndex = info[3].As<Napi::Number>().Uint32Value();
        int samplingMode = info[4].As<Napi::Number>().Uint32Value();
        bool generateStencilBuffer = info[5].As<Napi::Boolean>();
        bool generateDepth = info[6].As<Napi::Boolean>();
        bool generateMipMaps = info[7].As<Napi::Boolean>();

        bgfx::FrameBufferHandle frameBufferHandle{};
        if (generateStencilBuffer && !generateDepth)
        {
            throw std::exception{/* Does this case even make any sense? */};
        }
        else if (!generateStencilBuffer && !generateDepth)
        {
            frameBufferHandle = bgfx::createFrameBuffer(width, height, TEXTURE_FORMAT[formatIndex], BGFX_TEXTURE_RT);
        }
        else
        {
            auto depthStencilFormat = bgfx::TextureFormat::D32;
            if (generateStencilBuffer)
            {
                depthStencilFormat = bgfx::TextureFormat::D24S8;
            }

            assert(bgfx::isTextureValid(0, false, 1, TEXTURE_FORMAT[formatIndex], BGFX_TEXTURE_RT));
            assert(bgfx::isTextureValid(0, false, 1, depthStencilFormat, BGFX_TEXTURE_RT));

            std::array<bgfx::TextureHandle, 2> textures{
                bgfx::createTexture2D(width, height, generateMipMaps, 1, TEXTURE_FORMAT[formatIndex], BGFX_TEXTURE_RT),
                bgfx::createTexture2D(width, height, generateMipMaps, 1, depthStencilFormat, BGFX_TEXTURE_RT)};
            std::array<bgfx::Attachment, textures.size()> attachments{};
            for (int idx = 0; idx < attachments.size(); ++idx)
            {
                attachments[idx].init(textures[idx]);
            }
            frameBufferHandle = bgfx::createFrameBuffer(static_cast<uint8_t>(attachments.size()), attachments.data(), true);
        }

        textureData->Texture = bgfx::getTexture(frameBufferHandle);

        return Napi::External<FrameBufferData>::New(info.Env(), m_frameBufferManager.CreateNew(frameBufferHandle, width, height));
    }

    void NativeEngine::DeleteFrameBuffer(const Napi::CallbackInfo& info)
    {
        const auto frameBufferData = info[0].As<Napi::External<FrameBufferData>>().Data();
        delete frameBufferData;
    }

    void NativeEngine::BindFrameBuffer(const Napi::CallbackInfo& info)
    {
        const auto frameBufferData = info[0].As<Napi::External<FrameBufferData>>().Data();
        m_frameBufferManager.Bind(frameBufferData);
    }

    void NativeEngine::UnbindFrameBuffer(const Napi::CallbackInfo& info)
    {
        const auto frameBufferData = info[0].As<Napi::External<FrameBufferData>>().Data();
        m_frameBufferManager.Unbind(frameBufferData);
    }

    void NativeEngine::DrawIndexed(const Napi::CallbackInfo& info)
    {
        const auto fillMode = info[0].As<Napi::Number>().Int32Value();
        const auto elementStart = info[1].As<Napi::Number>().Int32Value();
        const auto elementCount = info[2].As<Napi::Number>().Int32Value();

        // TODO: handle viewport

        for (const auto& it : m_currentProgram->Uniforms)
        {
            const ProgramData::UniformValue& value = it.second;
            bgfx::setUniform({it.first}, value.Data.data(), value.ElementLength);
        }

        bgfx::setState(m_engineState);
        bgfx::submit(m_frameBufferManager.GetBound().ViewId, m_currentProgram->Program, 0, true);
    }

    void NativeEngine::Draw(const Napi::CallbackInfo& info)
    {
        const auto fillMode = info[0].As<Napi::Number>().Int32Value();
        const auto elementStart = info[1].As<Napi::Number>().Int32Value();
        const auto elementCount = info[2].As<Napi::Number>().Int32Value();

        // STUB: Stub.
        // bgfx::submit(), right?  Which means we have to preserve here the state of
        // which program is being worked on.
    }

    void NativeEngine::Clear(const Napi::CallbackInfo& info)
    {
        m_frameBufferManager.GetBound().ViewClearState.UpdateFlags(info);
    }

    void NativeEngine::ClearColor(const Napi::CallbackInfo& info)
    {
        m_frameBufferManager.GetBound().ViewClearState.UpdateColor(info);
    }

    void NativeEngine::ClearStencil(const Napi::CallbackInfo& info)
    {
        m_frameBufferManager.GetBound().ViewClearState.UpdateStencil(info);
    }

    void NativeEngine::ClearDepth(const Napi::CallbackInfo& info)
    {
        m_frameBufferManager.GetBound().ViewClearState.UpdateDepth(info);
    }

    Napi::Value NativeEngine::GetRenderWidth(const Napi::CallbackInfo& info)
    {
        return Napi::Value::From(info.Env(), bgfx::getStats()->width);
    }

    Napi::Value NativeEngine::GetRenderHeight(const Napi::CallbackInfo& info)
    {
        return Napi::Value::From(info.Env(), bgfx::getStats()->height);
    }

    void NativeEngine::SetViewPort(const Napi::CallbackInfo& info)
    {
        const auto x = info[0].As<Napi::Number>().FloatValue();
        const auto y = info[1].As<Napi::Number>().FloatValue();
        const auto width = info[2].As<Napi::Number>().FloatValue();
        const auto height = info[3].As<Napi::Number>().FloatValue();

        const auto backbufferWidth = bgfx::getStats()->width;
        const auto backbufferHeight = bgfx::getStats()->height;
        const float yOrigin = bgfx::getCaps()->originBottomLeft ? y : (1.f - y - height);

        m_frameBufferManager.GetBound().UseViewId(m_frameBufferManager.GetNewViewId());
        const bgfx::ViewId viewId = m_frameBufferManager.GetBound().ViewId;
        bgfx::setViewFrameBuffer(viewId, m_frameBufferManager.GetBound().FrameBuffer);
        bgfx::setViewRect(viewId,
            static_cast<uint16_t>(x * backbufferWidth),
            static_cast<uint16_t>(yOrigin * backbufferHeight),
            static_cast<uint16_t>(width * backbufferWidth),
            static_cast<uint16_t>(height * backbufferHeight));
    }

    Napi::Value NativeEngine::GetFramebufferData(const Napi::CallbackInfo& info)
    {
        bgfx::FrameBufferHandle fbh = BGFX_INVALID_HANDLE;
        bgfx::requestScreenShot(fbh, "GetImageData");

        while (s_bgfxCallback.m_screenShotBitmap.empty())
        {
            bgfx::frame();
        }
        const uint32_t x = info[0].As<Napi::Number>().Uint32Value();
        const uint32_t y = info[1].As<Napi::Number>().Uint32Value();
        const uint32_t width = info[2].As<Napi::Number>().Uint32Value();
        const uint32_t height = info[3].As<Napi::Number>().Uint32Value();

        auto imageData = new ImageData();
        const auto buffer = info[0].As<Napi::ArrayBuffer>();

        imageData->Image.reset(bimg::imageAlloc(&m_allocator, bimg::TextureFormat::RGBA8, width, height, 1, 1, false, false));

        auto bitmap = static_cast<uint8_t*>(imageData->Image->m_data);

        uint32_t sourceWidth = bgfx::getStats()->width;
        uint32_t sourceHeight = bgfx::getStats()->height;

        for (auto py = y; py < (y + height); py++)
        {
            for (auto px = x; px < (x + width); px++)
            {
                // bgfx screenshot is BGRA
                *bitmap++ = s_bgfxCallback.m_screenShotBitmap[(py * sourceWidth + px) * 4 + 2];
                *bitmap++ = s_bgfxCallback.m_screenShotBitmap[(py * sourceWidth + px) * 4 + 1];
                *bitmap++ = s_bgfxCallback.m_screenShotBitmap[(py * sourceWidth + px) * 4 + 0];
                *bitmap++ = s_bgfxCallback.m_screenShotBitmap[(py * sourceWidth + px) * 4 + 3];
            }
        }

        s_bgfxCallback.m_screenShotBitmap.clear();

        return Napi::External<ImageData>::New(info.Env(), imageData);
    }

    void NativeEngine::DispatchAnimationFrameAsync(Napi::FunctionReference callback)
    {
        // The purpose of encapsulating the callbackPtr in a std::shared_ptr is because, under the hood, the lambda is
        // put into a kind of function which requires a copy constructor for all of its captured variables.  Because
        // the Napi::FunctionReference is not copyable, this breaks when trying to capture the callback directly, so we
        // wrap it in a std::shared_ptr to allow the capture to function correctly.
        m_runtime.Dispatch([this, callbackPtr = std::make_shared<Napi::FunctionReference>(std::move(callback))](Napi::Env) {
            callbackPtr->Call({});
            EndFrame();
        });
    }

    void NativeEngine::EndFrame()
    {
        GetFrameBufferManager().Reset();

        bgfx::frame();
    }

    void NativeEngine::Dispatch(std::function<void()> function)
    {
        m_runtime.Dispatch([function = std::move(function)](Napi::Env) {
            function();
        });
    }
}
