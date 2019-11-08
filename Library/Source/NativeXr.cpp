#include "NativeXr.h"

#include "NativeEngine.h"

#include <XR.h>

#include <bx/bx.h>

namespace
{
    bgfx::TextureFormat::Enum XrTextureFormatToBgfxFormat(xr::TextureFormat format)
    {
        switch (format)
        {
        case xr::TextureFormat::RGBA8:
            return bgfx::TextureFormat::RGBA8;
        case xr::TextureFormat::RGBA8S:
            return bgfx::TextureFormat::RGBA8S;
        case xr::TextureFormat::D24S8:
            return bgfx::TextureFormat::D24S8;
        default:
            throw std::exception{ /* Unsupported texture format */ };
        }
    }

    constexpr std::array<float, 16> IDENTITY_MATRIX
    {
        1.f, 0.f, 0.f, 0.f,
        0.f, 1.f, 0.f, 0.f,
        0.f, 0.f, 1.f, 0.f,
        0.f, 0.f, 0.f, 1.f
    };

    std::array<float, 16> CreateProjectionMatrix(const xr::System::Session::Frame::View& view)
    {
        const float n{ view.DepthNearZ };
        const float f{ view.DepthFarZ };

        const float r{ std::tanf(view.FieldOfView.AngleRight) * n };
        const float l{ std::tanf(view.FieldOfView.AngleLeft) * n };
        const float t{ std::tanf(view.FieldOfView.AngleUp) * n };
        const float b{ std::tanf(view.FieldOfView.AngleDown) * n };

        std::array<float, 16> bxResult{};
        bx::mtxProj(bxResult.data(), t, b, l, r, n, f, false, bx::Handness::Right);

        return bxResult;
    }

    std::array<float, 16> CreateTransformMatrix(const xr::System::Session::Frame::View& view)
    {
        auto& quat = view.Orientation;
        auto& pos = view.Position;

        // Quaternion to matrix from https://github.com/BabylonJS/Babylon.js/blob/v4.0.0/src/Maths/math.ts#L6245-L6283
        const float xx{ quat.X * quat.X };
        const float yy{ quat.Y * quat.Y };
        const float zz{ quat.Z * quat.Z };
        const float xy{ quat.X * quat.Y };
        const float zw{ quat.Z * quat.W };
        const float zx{ quat.Z * quat.X };
        const float yw{ quat.Y * quat.W };
        const float yz{ quat.Y * quat.Z };
        const float xw{ quat.X * quat.W };

        auto worldSpaceTransform{ IDENTITY_MATRIX };

        worldSpaceTransform[0] = 1.f - (2.f * (yy + zz));
        worldSpaceTransform[1] = 2.f * (xy + zw);
        worldSpaceTransform[2] = 2.f * (zx - yw);
        worldSpaceTransform[3] = 0.f;

        worldSpaceTransform[4] = 2.f * (xy - zw);
        worldSpaceTransform[5] = 1.f - (2.f * (zz + xx));
        worldSpaceTransform[6] = 2.f * (yz + xw);
        worldSpaceTransform[7] = 0.f;

        worldSpaceTransform[8] = 2.f * (zx + yw);
        worldSpaceTransform[9] = 2.f * (yz - xw);
        worldSpaceTransform[10] = 1.f - (2.f * (yy + xx));
        worldSpaceTransform[11] = 0.f;

        // Insert position into rotation matrix.
        worldSpaceTransform[12] = pos.X;
        worldSpaceTransform[13] = pos.Y;
        worldSpaceTransform[14] = pos.Z;
        worldSpaceTransform[15] = 1.f;

        // Invert to get the view space transform.
        std::array<float, 16> viewSpaceTransform{};
        bx::mtxInverse(viewSpaceTransform.data(), worldSpaceTransform.data());

        return viewSpaceTransform;
    }
}

// NativeXr implementation proper.
namespace babylon
{
    class NativeXr
    {
    public:
        NativeXr::NativeXr();
        ~NativeXr();

        void BeginSession(); // TODO: Make this asynchronous.
        void EndSession(); // TODO: Make this asynchronous.

        auto ActiveFrameBuffers() const
        {
            return gsl::make_span(m_activeFrameBuffers);
        }

        void SetEngine(Napi::Object& jsEngine)
        {
            // This implementation must be switched to simply unwrapping the JavaScript object as soon as NativeEngine
            // is transitioned away from a singleton pattern. Part of that change will remove the GetEngine method, as
            // documented in https://github.com/BabylonJS/BabylonNative/issues/62
            auto nativeEngine = jsEngine.Get("_native").As<Napi::Object>();
            auto getEngine = nativeEngine.Get("getEngine").As<Napi::Function>();
            m_engineImpl = getEngine.Call(nativeEngine, {}).As<Napi::External<NativeEngine>>().Data();
        }

        void DoFrame(std::function<void(const xr::System::Session::Frame&)> callback)
        {
            Dispatch([this, callback = std::move(callback)]()
            {
                // Early out if there's no session available.
                if (m_session == nullptr)
                {
                    return;
                }

                BeginFrame();
                callback(*m_frame);
                m_engineImpl->EndFrame();
                EndFrame();
            });
        }

        void Dispatch(std::function<void()>&& callable)
        {
            m_engineImpl->Dispatch(callable);
        }

        xr::Size GetWidthAndHeightForViewIndex(size_t viewIndex) const
        {
            return m_session->GetWidthAndHeightForViewIndex(viewIndex);
        }

        void SetDepthsNarFar(float depthNear, float depthFar)
        {
            m_session->SetDepthsNearFar(depthNear, depthFar);
        }

    private:
        std::map<uintptr_t, std::unique_ptr<FrameBufferData>> m_texturesToFrameBuffers{};
        xr::System m_system{};
        std::unique_ptr<xr::System::Session> m_session{};
        std::unique_ptr<xr::System::Session::Frame> m_frame{};
        std::vector<FrameBufferData*> m_activeFrameBuffers{};
        NativeEngine* m_engineImpl{};

        void BeginFrame();
        void EndFrame();
    };

    NativeXr::NativeXr()
    {}

    NativeXr::~NativeXr()
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
    void NativeXr::BeginSession()
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
    void NativeXr::EndSession()
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

    void NativeXr::BeginFrame()
    {
        assert(m_engineImpl != nullptr);
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

                auto fbPtr = m_engineImpl->GetFrameBufferManager().CreateNew(
                    frameBuffer,
                    static_cast<uint16_t>(view.ColorTextureSize.Width),
                    static_cast<uint16_t>(view.ColorTextureSize.Height));

                // WebXR, at least in its current implementation, specifies an implicit default clear to black.
                // https://immersive-web.github.io/webxr/#xrwebgllayer-interface
                fbPtr->ViewClearState.UpdateColor(0.f, 0.f, 0.f, 0.f);
                m_texturesToFrameBuffers[colorTexPtr] = std::unique_ptr<FrameBufferData>{ fbPtr };

                m_activeFrameBuffers.push_back(fbPtr);
            }
            else
            {
                m_activeFrameBuffers.push_back(it->second.get());
            }
        }
    }

    void NativeXr::EndFrame()
    {
        assert(m_session != nullptr);
        assert(m_frame != nullptr);

        m_activeFrameBuffers.clear();

        m_frame.reset();
    }
}

namespace babylon
{
    namespace
    {
        struct XRSessionType
        {
            static inline const std::string IMMERSIVE_VR{ "immersive-vr" };
            static inline const std::string IMMERSIVE_AR{ "immersive-vr" };
            static inline const std::string IMMERSIVE_INLINE{ "inline" };
        };

        struct XRReferenceSpaceType
        {
            static inline const std::string VIEWER{ "viewer" };
            static inline const std::string LOCAL{ "local" };
            static inline const std::string LOCAL_FLOOR{ "local-floor" };
            static inline const std::string BOUNDED_FLOOR{ "bounded-floor" };
            static inline const std::string UNBOUNDED{ "unbounded" };
        };

        struct XREye
        {
            static inline const std::string NONE{ "none" };
            static inline const std::string LEFT{ "left" };
            static inline const std::string RIGHT{ "right" };

            static const auto& IndexToEye(size_t idx)
            {
                switch (idx)
                {
                case 0:
                    return LEFT;
                case 1:
                    return RIGHT;
                default:
                    throw std::exception{ /* Unsupported idx */ };
                }
            }

            static const auto EyeToIndex(const std::string& eye)
            {
                if (eye == LEFT)
                {
                    return 0;
                }
                else if (eye == RIGHT)
                {
                    return 1;
                }
                else
                {
                    throw std::exception{ /* Unsupported eye */ };
                }
            }
        };

        class XRWebGLLayer : public Napi::ObjectWrap<XRWebGLLayer>
        {
            static constexpr auto JS_CLASS_NAME = "XRWebGLLayer";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getViewport", &XRWebGLLayer::GetViewport)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New()
            {
                return constructor.New({});
            }

            XRWebGLLayer(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRWebGLLayer>{ info }
            {}

        private:
            static inline Napi::FunctionReference constructor{};

            Napi::Value GetViewport(const Napi::CallbackInfo& info)
            {
                return info.This().As<Napi::Object>().Get("viewport");
            }
        };

        class XRRigidTransform : public Napi::ObjectWrap<XRRigidTransform>
        {
            static constexpr auto JS_CLASS_NAME = "XRRigidTransform";
            static constexpr size_t MATRIX_SIZE = 16;

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceAccessor("matrix", &XRRigidTransform::Matrix, nullptr)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New()
            {
                return constructor.New({});
            }

            XRRigidTransform(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRRigidTransform>{ info }
                , m_matrix{ Napi::Persistent(Napi::Float32Array::New(info.Env(), MATRIX_SIZE)) }
            {}

            void Update(gsl::span<const float, MATRIX_SIZE> matrix)
            {
                std::memcpy(m_matrix.Value().Data(), matrix.data(), m_matrix.Value().ByteLength());
            }

        private:
            static inline Napi::FunctionReference constructor{};

            Napi::Reference<Napi::Float32Array> m_matrix{};

            Napi::Value Matrix(const Napi::CallbackInfo& info)
            {
                return m_matrix.Value();
            }
        };

        class XRView : public Napi::ObjectWrap<XRView>
        {
            static constexpr auto JS_CLASS_NAME = "XRView";
            static constexpr size_t MATRIX_SIZE = 16;

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(env, JS_CLASS_NAME,
                    {
                        InstanceAccessor("eye", &XRView::GetEye, nullptr),
                        InstanceAccessor("projectionMatrix", &XRView::GetProjectionMatrix, nullptr),
                        InstanceAccessor("transform", &XRView::GetTransform, nullptr)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New()
            {
                return constructor.New({});
            }

            XRView(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRView>{ info }
                , m_eyeIdx{ 0 }
                , m_eye{ Napi::Persistent(Napi::String::From(info.Env(), XREye::IndexToEye(m_eyeIdx))) }
                , m_projectionMatrix{ Napi::Persistent(Napi::Float32Array::New(info.Env(), MATRIX_SIZE)) }
                , m_rigidTransform{ Napi::Persistent(XRRigidTransform::New()) }
            {}

            void Update(size_t eyeIdx, gsl::span<const float, 16> projectionMatrix, gsl::span<const float, 16> transformMatrix)
            {
                if (eyeIdx != m_eyeIdx)
                {
                    m_eyeIdx = eyeIdx;
                    m_eye = Napi::Persistent(Napi::String::From(m_eye.Env(), XREye::IndexToEye(m_eyeIdx)));
                }

                std::memcpy(m_projectionMatrix.Value().Data(), projectionMatrix.data(), m_projectionMatrix.Value().ByteLength());

                XRRigidTransform::Unwrap(m_rigidTransform.Value())->Update(transformMatrix);
            }

        private:
            static inline Napi::FunctionReference constructor{};

            size_t m_eyeIdx{};
            Napi::Reference<Napi::String> m_eye{};
            Napi::Reference<Napi::Float32Array> m_projectionMatrix{};
            Napi::ObjectReference m_rigidTransform{};

            Napi::Value GetEye(const Napi::CallbackInfo&)
            {
                return m_eye.Value();
            }

            Napi::Value GetProjectionMatrix(const Napi::CallbackInfo&)
            {
                return m_projectionMatrix.Value();
            }

            Napi::Value GetTransform(const Napi::CallbackInfo&)
            {
                return m_rigidTransform.Value();
            }
        };

        class XRViewerPose : public Napi::ObjectWrap<XRViewerPose>
        {
            static constexpr auto JS_CLASS_NAME = "XRViewerPose";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(env, JS_CLASS_NAME,
                    {
                        InstanceAccessor("transform", &XRViewerPose::GetTransform, nullptr),
                        InstanceAccessor("views", &XRViewerPose::GetViews, nullptr)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New()
            {
                return constructor.New({});
            }

            XRViewerPose(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRViewerPose>{ info }
                , m_jsTransform{ Napi::Persistent(XRRigidTransform::New()) }
                , m_jsViews{ Napi::Persistent(Napi::Array::New(info.Env(), 0)) }
                , m_transform{ *XRRigidTransform::Unwrap(m_jsTransform.Value()) }
            {}

            void Update(gsl::span<const float, 16> matrix, gsl::span<const xr::System::Session::Frame::View> views)
            {
                // Update the transform.
                m_transform.Update(matrix);

                // Update the views array if necessary.
                const auto oldSize = static_cast<uint32_t>(m_views.size());
                const auto newSize = static_cast<uint32_t>(views.size());
                if (oldSize != newSize)
                {
                    auto newViews = Napi::Array::New(m_jsViews.Env(), newSize);
                    m_views.resize(newSize);

                    for (uint32_t idx = 0; idx < newSize; ++idx)
                    {
                        if (idx < oldSize)
                        {
                            newViews.Set(idx, m_jsViews.Value().Get(idx));
                        }
                        else
                        {
                            newViews.Set(idx, XRView::New());
                        }

                        m_views[idx] = XRView::Unwrap(newViews.Get(idx).As<Napi::Object>());
                    }

                    m_jsViews = Napi::Persistent(newViews);
                }

                // Update the individual views.
                for (uint32_t idx = 0; idx < static_cast<uint32_t>(views.size()); ++idx)
                {
                    const auto& view = views[idx];
                    const auto projectionMatrix = CreateProjectionMatrix(view);
                    const auto transformMatrix = CreateTransformMatrix(view);
                    m_views[idx]->Update(idx, projectionMatrix, transformMatrix);
                }
            }

        private:
            static inline Napi::FunctionReference constructor{};

            Napi::ObjectReference m_jsTransform{};
            Napi::Reference<Napi::Array> m_jsViews{};

            XRRigidTransform& m_transform;
            std::vector<XRView*> m_views{};

            Napi::Value GetTransform(const Napi::CallbackInfo& info)
            {
                return m_jsTransform.Value();
            }

            Napi::Value GetViews(const Napi::CallbackInfo& info)
            {
                return m_jsViews.Value();
            }
        };

        // Implementation of the XRReferenceSpace interface: https://immersive-web.github.io/webxr/#xrreferencespace-interface
        class XRReferenceSpace : public Napi::ObjectWrap<XRReferenceSpace>
        {
            static constexpr auto JS_CLASS_NAME = "XRReferenceSpace";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {

                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return constructor.New({ info[0] });
            }

            XRReferenceSpace(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRReferenceSpace>{ info }
            {
                // Only unbounded reference spaces are supported at the moment.
                assert(info[0].As<Napi::String>().Utf8Value() == XRReferenceSpaceType::UNBOUNDED);
            }

        private:
            static inline Napi::FunctionReference constructor{};
        };

        class XRFrame : public Napi::ObjectWrap<XRFrame>
        {
            static constexpr auto JS_CLASS_NAME = "XRFrame";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getViewerPose", &XRFrame::GetViewerPose)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New()
            {
                return constructor.New({});
            }

            XRFrame(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRFrame>{ info }
                , m_jsXRViewerPose{ Napi::Persistent(XRViewerPose::New()) }
                , m_xrViewerPose{ *XRViewerPose::Unwrap(m_jsXRViewerPose.Value()) }
            {}

            void Update(const xr::System::Session::Frame& frame)
            {
                // Store off a pointer to the frame so that the viewer pose can be updated later. We cannot 
                // update the viewer pose here because we don't yet know the desired reference space.
                m_frame = &frame;
            }

        private:
            static inline Napi::FunctionReference constructor{};

            const xr::System::Session::Frame* m_frame{};
            Napi::ObjectReference m_jsXRViewerPose{};
            XRViewerPose& m_xrViewerPose;

            Napi::Value GetViewerPose(const Napi::CallbackInfo& info)
            {
                // TODO: Support reference spaces.
                // auto& space = *XRReferenceSpace::Unwrap(info[0].As<Napi::Object>());

                // Updating the reference space is currently not supported. Until it is, we assume the 
                // reference space is unmoving at identity (which is usually true).
                auto spaceTransform = IDENTITY_MATRIX;

                m_xrViewerPose.Update(spaceTransform, m_frame->Views);

                return m_jsXRViewerPose.Value();
            }
        };

        // Implementation of the XRSession interface: https://immersive-web.github.io/webxr/#xrsession-interface
        class XRSession : public Napi::ObjectWrap<XRSession>
        {
            static constexpr auto JS_CLASS_NAME = "XRSession";
            static constexpr auto JS_EVENT_NAME_END = "end";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("addEventListener", &XRSession::AddEventListener),
                        InstanceMethod("requestReferenceSpace", &XRSession::RequestReferenceSpace),
                        InstanceMethod("updateRenderState", &XRSession::UpdateRenderState),
                        InstanceMethod("requestAnimationFrame", &XRSession::RequestAnimationFrame),
                        InstanceMethod("end", &XRSession::End)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Promise CreateAsync(const Napi::CallbackInfo& info)
            {
                auto jsSession = constructor.New({ info[0] });
                auto& session = *XRSession::Unwrap(jsSession);

                session.m_xr.BeginSession();

                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(jsSession);
                return deferred.Promise();
            }

            XRSession(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRSession>{ info }
                , m_jsXRFrame{ Napi::Persistent(XRFrame::New()) }
                , m_xrFrame{ *XRFrame::Unwrap(m_jsXRFrame.Value()) }
            {
                // Currently only immersive VR is supported.
                assert(info[0].As<Napi::String>().Utf8Value() == XRSessionType::IMMERSIVE_VR);
            }

            void SetEngine(Napi::Object& jsEngine)
            {
                m_xr.SetEngine(jsEngine);
            }

            void InitializeXrLayer(Napi::Object layer)
            {
                // NOTE: We currently only support rendering to the entire frame. Because the following values
                // are only used in the context of each other, width and hight as used here don't need to have
                // anything to do with actual pixel widths. This behavior is permitted by the draft WebXR spec,
                // which states that the, "exact interpretation of the viewport values depends on the conventions
                // of the graphics API the viewport is associated with." Since Babylon.js is here doing the
                // the interpretation for our graphics API, we are able to provide Babylon.js with simple values
                // that will communicate the correct behavior. In theory, for partial texture rendering, the
                // only part of this that will need to be fixed is the viewport (the layer will need one for 
                // each view, not just the one that currently exists).
                // Spec reference: https://immersive-web.github.io/webxr/#dom-xrviewport-width
                constexpr size_t WIDTH = 1;
                constexpr size_t HEIGHT = 1;

                auto env = layer.Env();
                auto viewport = Napi::Object::New(env);
                viewport.Set("x", Napi::Value::From(env, 0));
                viewport.Set("y", Napi::Value::From(env, 0));
                viewport.Set("width", Napi::Value::From(env, WIDTH));
                viewport.Set("height", Napi::Value::From(env, HEIGHT));
                layer.Set("viewport", viewport);

                layer.Set("framebufferWidth", Napi::Value::From(env, WIDTH));
                layer.Set("framebufferHeight", Napi::Value::From(env, HEIGHT));
            }

            FrameBufferData* GetFrameBufferForEye(const std::string& eye) const
            {
                return m_xr.ActiveFrameBuffers()[XREye::EyeToIndex(eye)];
            }

            xr::Size GetWidthAndHeightForViewIndex(size_t viewIndex) const
            {
                return m_xr.GetWidthAndHeightForViewIndex(viewIndex);
            }

        private:
            static inline Napi::FunctionReference constructor{};

            NativeXr m_xr{};
            Napi::ObjectReference m_jsXRFrame{};
            XRFrame& m_xrFrame;

            std::vector<std::pair<const std::string, Napi::FunctionReference>> m_eventNamesAndCallbacks{};

            void AddEventListener(const Napi::CallbackInfo& info)
            {
                m_eventNamesAndCallbacks.emplace_back(
                    info[0].As<Napi::String>().Utf8Value(),
                    Napi::Persistent(info[1].As<Napi::Function>()));
            }

            Napi::Value RequestReferenceSpace(const Napi::CallbackInfo& info)
            {
                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(XRReferenceSpace::New(info));
                return deferred.Promise();
            }

            Napi::Value UpdateRenderState(const Napi::CallbackInfo& info)
            {
                auto renderState = info[0].As<Napi::Object>();
                info.This().As<Napi::Object>().Set("renderState", renderState);

                float depthNear = renderState.Get("depthNear").As<Napi::Number>().FloatValue();
                float depthFar = renderState.Get("depthFar").As<Napi::Number>().FloatValue();
                m_xr.SetDepthsNarFar(depthNear, depthFar);

                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(info.Env().Undefined());
                return deferred.Promise();
            }

            Napi::Value RequestAnimationFrame(const Napi::CallbackInfo& info)
            {
                m_xr.DoFrame([this, func = std::make_shared<Napi::FunctionReference>(std::move(Napi::Persistent(info[0].As<Napi::Function>()))), env = info.Env()](const auto& frame)
                {
                    m_xrFrame.Update(frame);
                    func->Call({ Napi::Value::From(env, -1), m_jsXRFrame.Value() });
                });

                // TODO: Timestamp, I think? Or frame handle? Look up what this return value is and return the right thing.
                return Napi::Value::From(info.Env(), 0);
            }

            Napi::Value End(const Napi::CallbackInfo& info)
            {
                m_xr.Dispatch([this]()
                {
                    m_xr.EndSession();

                    for (const auto& [name, callback] : m_eventNamesAndCallbacks)
                    {
                        if (name == JS_EVENT_NAME_END)
                        {
                            callback.Call({});
                        }
                    }
                });

                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(info.Env().Undefined());
                return deferred.Promise();
            }
        };

        class NativeWebXRRenderTarget : public Napi::ObjectWrap<NativeWebXRRenderTarget>
        {
            static constexpr auto JS_CLASS_NAME = "NativeWebXRRenderTarget";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("initializeXRLayerAsync", &NativeWebXRRenderTarget::InitializeXRLayerAsync)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return constructor.New({ info[0] });
            }

            NativeWebXRRenderTarget(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<NativeWebXRRenderTarget>{ info }
                , m_jsEngineReference{ Napi::Persistent(info[0].As<Napi::Object>()) }
            {}

        private:
            static inline Napi::FunctionReference constructor{};

            // Lifetime control to prevent the cleanup of the NativeEngine while XR is still alive.
            Napi::ObjectReference m_jsEngineReference{};

            Napi::Value InitializeXRLayerAsync(const Napi::CallbackInfo& info)
            {
                auto& session = *XRSession::Unwrap(info[0].As<Napi::Object>());
                session.SetEngine(m_jsEngineReference.Value());

                auto xrLayer = XRWebGLLayer::New();
                session.InitializeXrLayer(xrLayer);
                info.This().As<Napi::Object>().Set("xrLayer", xrLayer);

                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(info.Env().Undefined());
                return deferred.Promise();
            }
        };

        class NativeRenderTargetProvider : public Napi::ObjectWrap<NativeRenderTargetProvider>
        {
            static constexpr auto JS_CLASS_NAME = "NativeRenderTargetProvider";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getRenderTargetForEye", &NativeRenderTargetProvider::GetRenderTargetForEye)
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return constructor.New({ info[0], info[1] });
            }

            NativeRenderTargetProvider(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<NativeRenderTargetProvider>{ info }
                , m_jsSession{ Napi::Persistent(info[0].As<Napi::Object>()) }
                , m_session{ *XRSession::Unwrap(m_jsSession.Value()) }
            {
                auto createRenderTextureCallback = info[1].As<Napi::Function>();

                for (size_t idx = 0; idx < m_jsRenderTargetTextures.size(); ++idx)
                {
                    auto size = m_session.GetWidthAndHeightForViewIndex(idx);
                    auto jsWidth = Napi::Value::From(info.Env(), size.Width);
                    auto jsHeight = Napi::Value::From(info.Env(), size.Height);
                    m_jsRenderTargetTextures[idx] = Napi::Persistent(createRenderTextureCallback.Call({ jsWidth, jsHeight }).As<Napi::Object>());
                }
            }

        private:
            static inline Napi::FunctionReference constructor{};

            Napi::ObjectReference m_jsSession{};
            std::array<Napi::ObjectReference, 2> m_jsRenderTargetTextures;
            XRSession& m_session;

            Napi::Value GetRenderTargetForEye(const Napi::CallbackInfo& info)
            {
                const std::string eye{ info[0].As<Napi::String>().Utf8Value() };

                auto rtt = m_jsRenderTargetTextures[XREye::EyeToIndex(eye)].Value();
                rtt.Set("_framebuffer", Napi::External<FrameBufferData>::New(info.Env(), m_session.GetFrameBufferForEye(eye)));
                return rtt;
            }
        };

        // Implementation of the XR interface: https://immersive-web.github.io/webxr/#xr-interface
        class XR : public Napi::ObjectWrap<XR>
        {
            static constexpr auto JS_CLASS_NAME = "NativeXR";
            static constexpr auto JS_NAVIGATOR_NAME = "navigator";
            static constexpr auto JS_XR_NAME = "xr";
            static constexpr auto JS_NATIVE_NAME = "native";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::HandleScope scope{ env };

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("isSessionSupported", &XR::IsSessionSupported),
                        InstanceMethod("requestSession", &XR::RequestSession),
                        InstanceMethod("getWebXRRenderTarget", &XR::GetWebXRRenderTarget),
                        InstanceMethod("getNativeRenderTargetProvider", &XR::GetNativeRenderTargetProvider),
                        InstanceValue(JS_NATIVE_NAME, Napi::Value::From(env, true))
                    });

                Napi::Object global = env.Global();
                Napi::Object navigator;
                if (global.Has(JS_NAVIGATOR_NAME))
                {
                    navigator = global.Get(JS_NAVIGATOR_NAME).As<Napi::Object>();
                }
                else
                {
                    navigator = Napi::Object::New(env);
                    global.Set(JS_NAVIGATOR_NAME, navigator);
                }

                auto xr = func.New({});
                navigator.Set(JS_XR_NAME, xr);
            }

            XR(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XR>{ info }
            {}

        private:

            Napi::Value IsSessionSupported(const Napi::CallbackInfo& info)
            {
                auto sessionType = info[0].As<Napi::String>().Utf8Value();
                bool isSupported = false;

                if (sessionType == XRSessionType::IMMERSIVE_VR)
                {
                    isSupported = true;
                }

                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(Napi::Boolean::New(info.Env(), isSupported));
                return deferred.Promise();
            }

            Napi::Value RequestSession(const Napi::CallbackInfo& info)
            {
                return XRSession::CreateAsync(info);
            }

            Napi::Value GetWebXRRenderTarget(const Napi::CallbackInfo& info)
            {
                return NativeWebXRRenderTarget::New(info);
            }

            Napi::Value GetNativeRenderTargetProvider(const Napi::CallbackInfo& info)
            {
                return NativeRenderTargetProvider::New(info);
            }
        };
    }

    void InitializeNativeXr(babylon::Env& env)
    {
        XRWebGLLayer::Initialize(env);
        XRRigidTransform::Initialize(env);
        XRView::Initialize(env);
        XRViewerPose::Initialize(env);
        XRReferenceSpace::Initialize(env);
        XRFrame::Initialize(env);
        XRSession::Initialize(env);
        NativeWebXRRenderTarget::Initialize(env);
        NativeRenderTargetProvider::Initialize(env);
        XR::Initialize(env);
    }
}
