#pragma once

#include "ShaderCompiler.h"
#include "BgfxCallback.h"

#include <Babylon/JsRuntime.h>
#include <Babylon/JsRuntimeScheduler.h>

#include <NativeWindow.h>

#include <napi/napi.h>

#include <bgfx/bgfx.h>
#include <bgfx/platform.h>
#include <bimg/bimg.h>
#include <bx/readerwriter.h>

#include <gsl/gsl>

#include <assert.h>

#include <arcana/containers/weak_table.h>
#include <arcana/threading/cancellation.h>

namespace Babylon
{
    class ViewClearState final
    {
    public:
        ViewClearState(uint16_t viewId)
            : m_viewId{viewId}
        {
        }

        void UpdateFlags(const Napi::CallbackInfo& info)
        {
            const auto flags = static_cast<uint16_t>(info[0].As<Napi::Number>().Uint32Value());
            m_flags = flags;
            Update();
        }

        void UpdateColor(const Napi::CallbackInfo& info)
        {
            const auto r = info[0].As<Napi::Number>().FloatValue();
            const auto g = info[1].As<Napi::Number>().FloatValue();
            const auto b = info[2].As<Napi::Number>().FloatValue();
            const auto a = info[3].IsUndefined() ? 1.f : info[3].As<Napi::Number>().FloatValue();
            UpdateColor(r, g, b, a);
        }

        void UpdateColor(float r, float g, float b, float a = 1.f)
        {
            const bool needToUpdate = r != m_red || g != m_green || b != m_blue || a != m_alpha;
            if (needToUpdate)
            {
                m_red = r;
                m_green = g;
                m_blue = b;
                m_alpha = a;
                Update();
            }
        }

        void UpdateDepth(const Napi::CallbackInfo& info)
        {
            const auto depth = info[0].As<Napi::Number>().FloatValue();
            const bool needToUpdate = m_depth != depth;
            if (needToUpdate)
            {
                m_depth = depth;
                Update();
            }
        }

        void UpdateStencil(const Napi::CallbackInfo& info)
        {
            const auto stencil = static_cast<uint8_t>(info[0].As<Napi::Number>().Int32Value());
            const bool needToUpdate = m_stencil != stencil;
            if (needToUpdate)
            {
                m_stencil = stencil;
                Update();
            }
        }

        void Update() const
        {
            bgfx::setViewClear(m_viewId, m_flags, Color(), m_depth, m_stencil);
            // discard any previous set state
            bgfx::discard();
            bgfx::touch(m_viewId);
        }

        void UpdateViewId(uint16_t viewId)
        {
            m_viewId = viewId;
        }

    private:
        uint16_t m_viewId{};
        float m_red{68.f / 255.f};
        float m_green{51.f / 255.f};
        float m_blue{85.f / 255.f};
        float m_alpha{1.f};
        float m_depth{1.f};
        uint16_t m_flags{BGFX_CLEAR_COLOR | BGFX_CLEAR_DEPTH};
        uint8_t m_stencil{0};

        uint32_t Color() const
        {
            uint32_t color = 0x0;
            color += static_cast<uint8_t>(m_red * std::numeric_limits<uint8_t>::max());
            color = color << 8;
            color += static_cast<uint8_t>(m_green * std::numeric_limits<uint8_t>::max());
            color = color << 8;
            color += static_cast<uint8_t>(m_blue * std::numeric_limits<uint8_t>::max());
            color = color << 8;
            color += static_cast<uint8_t>(m_alpha * std::numeric_limits<uint8_t>::max());
            return color;
        }
    };

    struct FrameBufferData final
    {
        FrameBufferData(bgfx::FrameBufferHandle frameBuffer, uint16_t viewId, uint16_t width, uint16_t height)
            : FrameBuffer{frameBuffer}
            , ViewId{viewId}
            , ViewClearState{ViewId}
            , Width{width}
            , Height{height}
        {
            assert(ViewId < bgfx::getCaps()->limits.maxViews);
        }

        FrameBufferData(FrameBufferData&) = delete;

        ~FrameBufferData()
        {
            bgfx::destroy(FrameBuffer);
        }

        void UseViewId(uint16_t viewId)
        {
            ViewId = viewId;
            ViewClearState.UpdateViewId(ViewId);
        }

        void SetUpView(uint16_t viewId)
        {
            UseViewId(viewId);
            bgfx::setViewFrameBuffer(ViewId, FrameBuffer);
            ViewClearState.Update();
            bgfx::setViewRect(ViewId, 0, 0, Width, Height);
        }

        bgfx::FrameBufferHandle FrameBuffer{bgfx::kInvalidHandle};
        bgfx::ViewId ViewId{};
        Babylon::ViewClearState ViewClearState;
        uint16_t Width{};
        uint16_t Height{};
    };

    struct FrameBufferManager final
    {
        FrameBufferManager()
        {
            m_boundFrameBuffer = m_backBuffer = new FrameBufferData(BGFX_INVALID_HANDLE, GetNewViewId(), bgfx::getStats()->width, bgfx::getStats()->height);
        }

        FrameBufferData* CreateNew(bgfx::FrameBufferHandle frameBufferHandle, uint16_t width, uint16_t height)
        {
            return new FrameBufferData(frameBufferHandle, GetNewViewId(), width, height);
        }

        void Bind(FrameBufferData* data)
        {
            m_boundFrameBuffer = data;

            // TODO: Consider doing this only on bgfx::reset(); the effects of this call don't survive reset, but as
            // long as there's no reset this doesn't technically need to be called every time the frame buffer is bound.
            m_boundFrameBuffer->SetUpView(GetNewViewId());

            // bgfx::setTexture()? Why?
            // TODO: View order?
        }

        FrameBufferData& GetBound() const
        {
            return *m_boundFrameBuffer;
        }

        void Unbind(FrameBufferData* data)
        {
            assert(m_boundFrameBuffer == data);
            m_boundFrameBuffer = m_backBuffer;
        }

        uint16_t GetNewViewId()
        {
            m_nextId++;
            assert(m_nextId < bgfx::getCaps()->limits.maxViews);
            return m_nextId;
        }

        void Reset()
        {
            m_nextId = 0;
        }

    private:
        FrameBufferData* m_boundFrameBuffer{nullptr};
        FrameBufferData* m_backBuffer{nullptr};
        uint16_t m_nextId{0};
    };

    struct UniformInfo final
    {
        uint8_t Stage{};
        // uninitilized bgfx resource is BGFX_INVALID_HANDLE. 0 can be a valid handle.
        bgfx::UniformHandle Handle{bgfx::kInvalidHandle};
    };

    struct TextureData final
    {
        ~TextureData()
        {
            if (bgfx::isValid(Handle))
            {
                bgfx::destroy(Handle);
            }
        }

        bgfx::TextureHandle Handle{bgfx::kInvalidHandle};
        uint32_t Width{0};
        uint32_t Height{0};
        uint32_t Flags{0};
        uint8_t AnisotropicLevel{0};
    };

    struct ImageData final
    {
        ~ImageData()
        {
            if (Image)
            {
                bimg::imageFree(Image.get());
            }
        }
        std::unique_ptr<bimg::ImageContainer> Image;
    };

    struct ProgramData final
    {
        ProgramData() = default;
        ProgramData(const ProgramData&) = delete;
        ProgramData(ProgramData&&) = delete;

        ~ProgramData()
        {
            bgfx::destroy(Program);
        }

        std::unordered_map<std::string, uint32_t> AttributeLocations{};
        std::unordered_map<std::string, UniformInfo> VertexUniformNameToInfo{};
        std::unordered_map<std::string, UniformInfo> FragmentUniformNameToInfo{};

        bgfx::ProgramHandle Program{};

        struct UniformValue
        {
            std::vector<float> Data{};
            uint16_t ElementLength{};
        };

        std::unordered_map<uint16_t, UniformValue> Uniforms{};

        void SetUniform(bgfx::UniformHandle handle, gsl::span<const float> data, size_t elementLength = 1)
        {
            UniformValue& value = Uniforms[handle.idx];
            value.Data.assign(data.begin(), data.end());
            value.ElementLength = static_cast<uint16_t>(elementLength);
        }
    };

    struct VertexArray final
    {
        struct IndexBuffer
        {
            bgfx::IndexBufferHandle handle;
        };

        IndexBuffer indexBuffer;

        struct VertexBuffer
        {
            bgfx::VertexBufferHandle handle;
            uint32_t startVertex;
            bgfx::VertexLayoutHandle vertexLayoutHandle;
        };

        std::vector<VertexBuffer> vertexBuffers;
    };

    class NativeEngine final : public Napi::ObjectWrap<NativeEngine>
    {
        static constexpr auto JS_CLASS_NAME = "_NativeEngine";
        static constexpr auto JS_ENGINE_CONSTRUCTOR_NAME = "Engine";

    public:
        NativeEngine(const Napi::CallbackInfo& info);
        NativeEngine(const Napi::CallbackInfo& info, Plugins::Internal::NativeWindow& nativeWindow);
        ~NativeEngine();

        static void InitializeWindow(void* nativeWindowPtr, uint32_t width, uint32_t height);
        static void DeinitializeWindow();
        static void Initialize(Napi::Env);

        FrameBufferManager& GetFrameBufferManager();
        void Dispatch(std::function<void()>);
        void EndFrame();

    private:
        void Dispose();

        void Dispose(const Napi::CallbackInfo& info);
        Napi::Value GetEngine(const Napi::CallbackInfo& info); // TODO: Hack, temporary method. Remove as part of the change to get rid of NapiBridge.
        void RequestAnimationFrame(const Napi::CallbackInfo& info);
        Napi::Value CreateVertexArray(const Napi::CallbackInfo& info);
        void DeleteVertexArray(const Napi::CallbackInfo& info);
        void BindVertexArray(const Napi::CallbackInfo& info);
        Napi::Value CreateIndexBuffer(const Napi::CallbackInfo& info);
        void DeleteIndexBuffer(const Napi::CallbackInfo& info);
        void RecordIndexBuffer(const Napi::CallbackInfo& info);
        Napi::Value CreateVertexBuffer(const Napi::CallbackInfo& info);
        void DeleteVertexBuffer(const Napi::CallbackInfo& info);
        void RecordVertexBuffer(const Napi::CallbackInfo& info);
        Napi::Value CreateProgram(const Napi::CallbackInfo& info);
        Napi::Value GetUniforms(const Napi::CallbackInfo& info);
        Napi::Value GetAttributes(const Napi::CallbackInfo& info);
        void SetProgram(const Napi::CallbackInfo& info);
        void SetState(const Napi::CallbackInfo& info);
        void SetZOffset(const Napi::CallbackInfo& info);
        Napi::Value GetZOffset(const Napi::CallbackInfo& info);
        void SetDepthTest(const Napi::CallbackInfo& info);
        Napi::Value GetDepthWrite(const Napi::CallbackInfo& info);
        void SetDepthWrite(const Napi::CallbackInfo& info);
        void SetColorWrite(const Napi::CallbackInfo& info);
        void SetBlendMode(const Napi::CallbackInfo& info);
        void SetMatrix(const Napi::CallbackInfo& info);
        void SetInt(const Napi::CallbackInfo& info);
        void SetIntArray(const Napi::CallbackInfo& info);
        void SetIntArray2(const Napi::CallbackInfo& info);
        void SetIntArray3(const Napi::CallbackInfo& info);
        void SetIntArray4(const Napi::CallbackInfo& info);
        void SetFloatArray(const Napi::CallbackInfo& info);
        void SetFloatArray2(const Napi::CallbackInfo& info);
        void SetFloatArray3(const Napi::CallbackInfo& info);
        void SetFloatArray4(const Napi::CallbackInfo& info);
        void SetMatrices(const Napi::CallbackInfo& info);
        void SetMatrix3x3(const Napi::CallbackInfo& info);
        void SetMatrix2x2(const Napi::CallbackInfo& info);
        void SetFloat(const Napi::CallbackInfo& info);
        void SetFloat2(const Napi::CallbackInfo& info);
        void SetFloat3(const Napi::CallbackInfo& info);
        void SetFloat4(const Napi::CallbackInfo& info);
        Napi::Value CreateTexture(const Napi::CallbackInfo& info);
        void LoadTexture(const Napi::CallbackInfo& info);
        void LoadCubeTexture(const Napi::CallbackInfo& info);
        void LoadCubeTextureWithMips(const Napi::CallbackInfo& info);
        Napi::Value GetTextureWidth(const Napi::CallbackInfo& info);
        Napi::Value GetTextureHeight(const Napi::CallbackInfo& info);
        void SetTextureSampling(const Napi::CallbackInfo& info);
        void SetTextureWrapMode(const Napi::CallbackInfo& info);
        void SetTextureAnisotropicLevel(const Napi::CallbackInfo& info);
        void SetTexture(const Napi::CallbackInfo& info);
        void DeleteTexture(const Napi::CallbackInfo& info);
        Napi::Value CreateFrameBuffer(const Napi::CallbackInfo& info);
        void DeleteFrameBuffer(const Napi::CallbackInfo& info);
        void BindFrameBuffer(const Napi::CallbackInfo& info);
        void UnbindFrameBuffer(const Napi::CallbackInfo& info);
        void DrawIndexed(const Napi::CallbackInfo& info);
        void Draw(const Napi::CallbackInfo& info);
        void Clear(const Napi::CallbackInfo& info);
        void ClearColor(const Napi::CallbackInfo& info);
        void ClearStencil(const Napi::CallbackInfo& info);
        void ClearDepth(const Napi::CallbackInfo& info);
        Napi::Value GetRenderWidth(const Napi::CallbackInfo& info);
        Napi::Value GetRenderHeight(const Napi::CallbackInfo& info);
        void SetViewPort(const Napi::CallbackInfo& info);
        Napi::Value GetFramebufferData(const Napi::CallbackInfo& info);

        void UpdateSize(size_t width, size_t height);

        arcana::cancellation_source m_cancelSource{};

        ShaderCompiler m_shaderCompiler;

        ProgramData* m_currentProgram{nullptr};
        arcana::weak_table<std::unique_ptr<ProgramData>> m_programDataCollection{};

        JsRuntime& m_runtime;
        JsRuntimeScheduler m_runtimeScheduler;

        bx::DefaultAllocator m_allocator;
        uint64_t m_engineState;

        static inline BgfxCallback s_bgfxCallback{};
        FrameBufferManager m_frameBufferManager{};

        Plugins::Internal::NativeWindow::NativeWindow::OnResizeCallbackTicket m_resizeCallbackTicket;

        template<int size, typename arrayType>
        void SetTypeArrayN(const Napi::CallbackInfo& info);

        template<int size>
        void SetFloatN(const Napi::CallbackInfo& info);

        template<int size>
        void SetMatrixN(const Napi::CallbackInfo& info);

        // Scratch vector used for data alignment.
        std::vector<float> m_scratch{};
        
        Napi::FunctionReference m_requestAnimationFrameCalback{};
    };
}
