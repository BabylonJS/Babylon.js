#pragma once

#include "NativeEngine.h"

#include "ShaderCompiler.h"
#include "RuntimeImpl.h"

#include <napi/napi.h>
#include "NapiBridge.h"

#include <bgfx/bgfx.h>
#include <bgfx/platform.h>
#include <bimg/bimg.h>
#include <bx/readerwriter.h>

#include <gsl/gsl>

#include <assert.h>

namespace babylon
{
    template<typename T>
    class RecycleSet
    {
    public:
        RecycleSet(T firstId)
            : m_nextId{ firstId }
        {}

        RecycleSet() : RecycleSet({ 0 })
        {}

        T Get()
        {
            if (m_queue.empty())
            {
                return m_nextId++;
            }
            else
            {
                T next = m_queue.back();
                m_queue.pop();
                return next;
            }
        }

        void Recycle(T id)
        {
            assert(id < m_nextId);
            m_queue.push(id);
        }

    private:
        T m_nextId{};
        std::queue<bgfx::ViewId> m_queue{};
    };

    class ViewClearState final
    {
    public:
        ViewClearState(uint16_t viewId)
            : m_viewId{ viewId }
        {}

        bool Update(const Napi::CallbackInfo& info)
        {
            auto r = info[0].As<Napi::Number>().FloatValue();
            auto g = info[1].As<Napi::Number>().FloatValue();
            auto b = info[2].As<Napi::Number>().FloatValue();
            auto a = info[3].IsUndefined() ? 1.f : info[3].As<Napi::Number>().FloatValue();
            auto backBuffer = info[4].IsUndefined() ? true : info[4].As<Napi::Boolean>().Value();
            auto depth = info[5].IsUndefined() ? true : info[5].As<Napi::Boolean>().Value();
            auto stencil = info[6].IsUndefined() ? true : info[6].As<Napi::Boolean>().Value();

            return Update(r, g, b, a, backBuffer, depth, stencil);
        }
        
        bool Update(float r, float g, float b, float a = 1.f, bool backBuffer = true, bool depth = true, bool stencil = true)
        {
            bool needToUpdate = r != m_red
                || g != m_green
                || b != m_blue
                || a != m_alpha
                || backBuffer != m_backBuffer
                || depth != m_depth
                || stencil != m_stencil;
            if (needToUpdate)
            {
                m_red = r;
                m_green = g;
                m_blue = b;
                m_alpha = a;
                m_backBuffer = backBuffer;
                m_depth = depth;
                m_stencil = stencil;

                Update();
            }

            return needToUpdate;
        }

        void Update() const
        {
            // TODO: Backbuffer, depth, and stencil.
            bgfx::setViewClear(m_viewId, BGFX_CLEAR_COLOR | (m_depth ? BGFX_CLEAR_DEPTH : 0x0), Color());
            bgfx::touch(m_viewId);
        }

    private:
        const uint16_t m_viewId{};
        float m_red{ 68.f / 255.f };
        float m_green{ 51.f / 255.f };
        float m_blue{ 85.f / 255.f };
        float m_alpha{ 1.f };
        bool m_backBuffer{ true };
        bool m_depth{ true };
        bool m_stencil{ true };

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
        FrameBufferData(bgfx::FrameBufferHandle frameBuffer, RecycleSet<bgfx::ViewId>& viewIdSet, uint16_t width, uint16_t height)
            : FrameBuffer{ frameBuffer }
            , ViewId{ viewIdSet.Get() }
            , ViewClearState{ ViewId }
            , Width{ width }
            , Height{ height }
            , m_idSet{ viewIdSet }
        {
            assert(ViewId < bgfx::getCaps()->limits.maxViews);
        }

        FrameBufferData(FrameBufferData&) = delete;

        ~FrameBufferData()
        {
            bgfx::destroy(FrameBuffer);
            m_idSet.Recycle(ViewId);
        }

        void SetUpView()
        {
            bgfx::setViewFrameBuffer(ViewId, FrameBuffer);
            ViewClearState.Update();
            bgfx::setViewRect(ViewId, 0, 0, Width, Height);
        }

        bgfx::FrameBufferHandle FrameBuffer{ bgfx::kInvalidHandle };
        bgfx::ViewId ViewId{};
        ViewClearState ViewClearState;
        uint16_t Width{};
        uint16_t Height{};

    private:
        RecycleSet<bgfx::ViewId>& m_idSet;
    };

    struct FrameBufferManager final
    {
        FrameBufferData* CreateNew(bgfx::FrameBufferHandle frameBufferHandle, uint16_t width, uint16_t height)
        {
            return new FrameBufferData(frameBufferHandle, m_idSet, width, height);
        }

        void Bind(FrameBufferData* data)
        {
            assert(m_boundFrameBuffer == nullptr);
            m_boundFrameBuffer = data;

            // TODO: Consider doing this only on bgfx::reset(); the effects of this call don't survive reset, but as
            // long as there's no reset this doesn't technically need to be called every time the frame buffer is bound.
            m_boundFrameBuffer->SetUpView();

            // bgfx::setTexture()? Why?
            // TODO: View order?
        }

        bool IsFrameBufferBound() const
        {
            return m_boundFrameBuffer != nullptr;
        }

        FrameBufferData& GetBound() const
        {
            return *m_boundFrameBuffer;
        }

        void Unbind(FrameBufferData* data)
        {
            assert(m_boundFrameBuffer == data);
            m_boundFrameBuffer = nullptr;
        }

    private:
        RecycleSet<bgfx::ViewId> m_idSet{ 1 };
        FrameBufferData* m_boundFrameBuffer{ nullptr };
    };

    struct UniformInfo final
    {
        uint8_t Stage{};
        // uninitilized bgfx resource is kInvalidHandle. 0 can be a valid handle.
        bgfx::UniformHandle Handle{ bgfx::kInvalidHandle };
    };

    struct TextureData final
    {
        ~TextureData()
        {
            bgfx::destroy(Texture);

            for (auto image : Images)
            {
                bimg::imageFree(image);
            }
        }

        std::vector<bimg::ImageContainer*> Images{};
        bgfx::TextureHandle Texture{ bgfx::kInvalidHandle };
    };

    struct ProgramData final
    {
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
            bgfx::VertexDeclHandle declHandle;
        };

        std::vector<VertexBuffer> vertexBuffers;
    };

    class NativeEngine::Impl final
    {
    public:
        Impl(void* nativeWindowPtr, RuntimeImpl& runtimeImpl);

        void Initialize(Napi::Env& env);
        void UpdateSize(float width, float height);
        void UpdateRenderTarget();
        void Suspend();

        FrameBufferManager& GetFrameBufferManager();
        void Dispatch(std::function<void()>);

    private:
        using EngineDefiner = NativeEngineDefiner<NativeEngine::Impl>;
        friend EngineDefiner;

        enum BlendMode {}; // TODO DEBUG
        enum class Filter {}; // TODO DEBUG
        enum class AddressMode {}; // TODO DEBUG

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
        void SetBool(const Napi::CallbackInfo& info);
        Napi::Value CreateTexture(const Napi::CallbackInfo& info);
        void LoadTexture(const Napi::CallbackInfo& info);
        void LoadCubeTexture(const Napi::CallbackInfo& info);
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
        Napi::Value GetRenderWidth(const Napi::CallbackInfo& info);
        Napi::Value GetRenderHeight(const Napi::CallbackInfo& info);

        void DispatchAnimationFrameAsync(Napi::FunctionReference callback);

        ShaderCompiler m_shaderCompiler;

        ProgramData* m_currentProgram;

        RuntimeImpl& m_runtimeImpl;

        struct
        {
            uint32_t Width{};
            uint32_t Height{};
        } m_size;

        bx::DefaultAllocator m_allocator;
        uint64_t m_engineState;
        ViewClearState m_viewClearState;

        FrameBufferManager m_frameBufferManager{};

        void* m_nativeWindowPtr{};

        // Scratch vector used for data alignment.
        std::vector<float> m_scratch{};
    };
}
