#include "XrPlugin.h"

#include "NativeEngineImpl.h"

#include <XR.h>

namespace
{
    bgfx::TextureFormat::Enum XrTextureFormatToBgfxFormat(xr::TextureFormat format)
    {
        switch (format)
        {
        case xr::TextureFormat::RGBA8:
            return bgfx::TextureFormat::RGBA8;
        case xr::TextureFormat::D24S8:
            return bgfx::TextureFormat::D24S8;
        default:
            throw std::exception{ /* Unsupported texture format */ };
        }
    }
}

namespace babylon
{
    class XrPlugin : public Napi::ObjectWrap<XrPlugin>
    {
    public:
        static void Initialize(Napi::Env&);

        XrPlugin::XrPlugin(const Napi::CallbackInfo& info);
        ~XrPlugin();

    private:
        static inline Napi::FunctionReference constructor{};

        void BeginSession(const Napi::CallbackInfo&); // TODO: Make this asynchronous.
        void EndSession(const Napi::CallbackInfo&); // TODO: Make this asynchronous.
        void EndSession();
        void BeginFrame(const Napi::CallbackInfo&);
        void EndFrame(const Napi::CallbackInfo&);
        void EndFrame();
        Napi::Value GetActiveFrameBuffers(const Napi::CallbackInfo& info);

        xr::System m_system{};
        std::unique_ptr<xr::System::Session> m_session{};
        std::unique_ptr<xr::System::Session::Frame> m_frame{};
        FrameBufferManager& m_frameBufferManager;
        std::vector<FrameBufferData*> m_activeFrameBuffers{};

        std::map<uintptr_t, std::unique_ptr<FrameBufferData>> m_texturesToFrameBuffers{};
    };

    void XrPlugin::Initialize(Napi::Env& env)
    {
        Napi::HandleScope scope{ env };

        Napi::Function func = DefineClass(
            env,
            "XrPlugin",
            {
                InstanceMethod("beginSession", &XrPlugin::BeginSession),
                InstanceMethod("endSession", &XrPlugin::EndSession),
                InstanceMethod("beginFrame", &XrPlugin::BeginFrame),
                InstanceMethod("endFrame", &XrPlugin::EndFrame),
                InstanceMethod("getActiveFrameBuffers", &XrPlugin::GetActiveFrameBuffers)
            });

        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();

        env.Global().Set("XrPlugin", func);
    }

    XrPlugin::XrPlugin(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<XrPlugin>{ info }
        , m_frameBufferManager{ info[0].As<Napi::External<NativeEngine::Impl>>().Data()->GetFrameBufferManager() }
    {}

    XrPlugin::~XrPlugin()
    {
        if (m_session != nullptr)
        {
            if (m_frame != nullptr)
            {
                EndFrame();
            }

            EndSession();
        }
    }

    // TODO: Make this asynchronous.
    void XrPlugin::BeginSession(const Napi::CallbackInfo&)
    {
        assert(m_session == nullptr);
        assert(m_frame == nullptr);

        if (!m_system.IsInitialized())
        {
            while (!m_system.TryInitialize());
        }

        m_session = std::make_unique<xr::System::Session>(m_system, bgfx::getInternalData()->context);
    }

    // TODO: Make this asynchronous.
    void XrPlugin::EndSession(const Napi::CallbackInfo&)
    {
        EndSession();
    }

    void XrPlugin::EndSession()
    {
        assert(m_session != nullptr);
        assert(m_frame == nullptr);

        m_session->RequestEndSession();

        bool shouldEndSession{};
        bool shouldRestartSession{};
        do
        {
            // Block and burn frames until XR successfully shuts down.
            m_frame = m_session->GetNextFrame(shouldEndSession, shouldRestartSession);
            m_frame.reset();
        } while (!shouldEndSession);
        m_session.reset();
    }

    void XrPlugin::BeginFrame(const Napi::CallbackInfo&)
    {
        assert(m_session != nullptr);
        assert(m_frame == nullptr);

        bool shouldEndSession{};
        bool shouldRestartSession{};
        m_frame = m_session->GetNextFrame(shouldEndSession, shouldRestartSession);

        // Ending a session outside of calls to EndSession() is currently not supported.
        assert(!shouldEndSession);
        assert(m_frame != nullptr);

        m_activeFrameBuffers.reserve(m_frame->Views.size());
        for (const auto& view : m_frame->Views)
        {
            auto colorTexPtr = reinterpret_cast<uintptr_t>(view.ColorTexturePointer);

            auto it = m_texturesToFrameBuffers.find(colorTexPtr);
            if (it == m_texturesToFrameBuffers.end())
            {
                assert(view.ColorTextureSize.Width == view.DepthTextureSize.Width);
                assert(view.ColorTextureSize.Height == view.DepthTextureSize.Height);

                auto colorTextureFormat = XrTextureFormatToBgfxFormat(view.ColorTextureFormat);
                auto depthTextureFormat = XrTextureFormatToBgfxFormat(view.DepthTextureFormat);

                assert(bgfx::isTextureValid(0, false, 1, colorTextureFormat, BGFX_TEXTURE_RT));
                assert(bgfx::isTextureValid(0, false, 1, depthTextureFormat, BGFX_TEXTURE_RT));

                auto colorTex = bgfx::createTexture2D(1, 1, false, 1, colorTextureFormat, BGFX_TEXTURE_RT);
                auto depthTex = bgfx::createTexture2D(1, 1, false, 1, depthTextureFormat, BGFX_TEXTURE_RT);

                // Force BGFX to create the texture now, which is necessary in order to use overrideInternal.
                bgfx::frame();

                bgfx::overrideInternal(colorTex, colorTexPtr);
                bgfx::overrideInternal(depthTex, reinterpret_cast<uintptr_t>(view.DepthTexturePointer));

                std::array<bgfx::Attachment, 2> attachments{};
                attachments[0].init(colorTex);
                attachments[1].init(depthTex);
                auto frameBuffer = bgfx::createFrameBuffer(static_cast<uint8_t>(attachments.size()), attachments.data(), false);

                auto fbPtr = m_frameBufferManager.CreateNew(
                    frameBuffer,
                    static_cast<uint16_t>(view.ColorTextureSize.Width),
                    static_cast<uint16_t>(view.ColorTextureSize.Height));
                m_texturesToFrameBuffers[colorTexPtr] = std::unique_ptr<FrameBufferData>{ fbPtr };

                m_activeFrameBuffers.push_back(fbPtr);
            }
            else
            {
                m_activeFrameBuffers.push_back(it->second.get());
            }
        }
    }

    void XrPlugin::EndFrame(const Napi::CallbackInfo&)
    {
        EndFrame();
    }

    void XrPlugin::EndFrame()
    {
        assert(m_session != nullptr);
        assert(m_frame != nullptr);

        m_activeFrameBuffers.clear();

        m_frame.reset();
    }

    Napi::Value XrPlugin::GetActiveFrameBuffers(const Napi::CallbackInfo& info)
    {
        auto activeFrameBuffers = Napi::Array::New(info.Env(), m_activeFrameBuffers.size());
        for (uint32_t idx = 0; idx < m_activeFrameBuffers.size(); ++idx)
        {
            activeFrameBuffers[idx] = Napi::External<FrameBufferData>::New(info.Env(), m_activeFrameBuffers[idx]);
        }

        return activeFrameBuffers;
    }

    void InitializeXrPlugin(babylon::Env& env)
    {
        XrPlugin::Initialize(env);
    }
}
