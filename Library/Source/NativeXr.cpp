#include "NativeXr.h"

#include "NativeEngine.h"

#include <XR.h>

#include <bx/bx.h>

#include <set>

namespace
{
    bgfx::TextureFormat::Enum XrTextureFormatToBgfxFormat(xr::TextureFormat format)
    {
        switch (format)
        {
            // Color Formats
            // NOTE: Use linear formats even though XR requests sRGB to match what happens on the web.
            //       WebGL shaders expect sRGB output while native shaders expect linear output.
            case xr::TextureFormat::BGRA8_SRGB:
                return bgfx::TextureFormat::BGRA8;
            case xr::TextureFormat::RGBA8_SRGB:
                return bgfx::TextureFormat::RGBA8;

            // Depth Formats
            case xr::TextureFormat::D24S8:
                return bgfx::TextureFormat::D24S8;

            default:
                throw std::exception{/* Unsupported texture format */};
        }
    }

    // clang-format off
    constexpr std::array<float, 16> IDENTITY_MATRIX{
        1.f, 0.f, 0.f, 0.f,
        0.f, 1.f, 0.f, 0.f,
        0.f, 0.f, 1.f, 0.f,
        0.f, 0.f, 0.f, 1.f
    };
    // clang-format on

    std::array<float, 16> CreateProjectionMatrix(const xr::System::Session::Frame::View& view)
    {
        const float n{view.DepthNearZ};
        const float f{view.DepthFarZ};

        const float r{std::tanf(view.FieldOfView.AngleRight) * n};
        const float l{std::tanf(view.FieldOfView.AngleLeft) * n};
        const float t{std::tanf(view.FieldOfView.AngleUp) * n};
        const float b{std::tanf(view.FieldOfView.AngleDown) * n};

        std::array<float, 16> bxResult{};
        bx::mtxProj(bxResult.data(), t, b, l, r, n, f, false, bx::Handness::Right);

        return bxResult;
    }

    std::array<float, 16> CreateTransformMatrix(const xr::System::Session::Frame::Space& space, bool viewSpace = true)
    {
        auto& quat = space.Orientation;
        auto& pos = space.Position;

        // Quaternion to matrix from https://github.com/BabylonJS/Babylon.js/blob/v4.0.0/src/Maths/math.ts#L6245-L6283
        const float xx{quat.X * quat.X};
        const float yy{quat.Y * quat.Y};
        const float zz{quat.Z * quat.Z};
        const float xy{quat.X * quat.Y};
        const float zw{quat.Z * quat.W};
        const float zx{quat.Z * quat.X};
        const float yw{quat.Y * quat.W};
        const float yz{quat.Y * quat.Z};
        const float xw{quat.X * quat.W};

        auto worldSpaceTransform{IDENTITY_MATRIX};

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

        if (viewSpace)
        {
            // Invert to get the view space transform.
            std::array<float, 16> viewSpaceTransform{};
            bx::mtxInverse(viewSpaceTransform.data(), worldSpaceTransform.data());

            return viewSpaceTransform;
        }
        else
        {
            return worldSpaceTransform;
        }
    }

    void SetXRInputSourceSpaces(Napi::Object& jsInputSource, xr::System::Session::Frame::InputSource& inputSource)
    {
        auto env = jsInputSource.Env();
        jsInputSource.Set("targetRaySpace", Napi::External<decltype(inputSource.AimSpace)>::New(env, &inputSource.AimSpace));
        jsInputSource.Set("gripSpace", Napi::External<decltype(inputSource.GripSpace)>::New(env, &inputSource.GripSpace));
    }

    Napi::ObjectReference CreateXRInputSource(xr::System::Session::Frame::InputSource& inputSource, Napi::Env& env)
    {
        constexpr std::array<const char*, 2> HANDEDNESS_STRINGS
        {
            "left",
            "right"
        };
        constexpr char* TARGET_RAY_MODE{ "tracked-pointer" };

        auto jsInputSource = Napi::Object::New(env);
        jsInputSource.Set("handedness", Napi::String::New(env, HANDEDNESS_STRINGS[static_cast<size_t>(inputSource.Handedness)]));
        jsInputSource.Set("targetRayMode", TARGET_RAY_MODE);
        SetXRInputSourceSpaces(jsInputSource, inputSource);

        auto profiles = Napi::Array::New(env, 1);
        Napi::Value string = Napi::String::New(env, "generic-trigger-squeeze-touchpad-thumbstick");
        profiles.Set(uint32_t{ 0 }, string);
        jsInputSource.Set("profiles", profiles);

        return Napi::Persistent(jsInputSource);
    }
}

// NativeXr implementation proper.
namespace Babylon
{
    class NativeXr
    {
    public:
        NativeXr::NativeXr();
        ~NativeXr();

        void BeginSession(); // TODO: Make this asynchronous.
        void EndSession();   // TODO: Make this asynchronous.

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
            Dispatch([this, callback = std::move(callback)]() {
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
    {
    }

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
            while (!m_system.TryInitialize())
            {
                // do nothing
            }
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
                auto colorTex = bgfx::createTexture2D(1, 1, false, 1, colorTextureFormat, BGFX_TEXTURE_RT);

                auto depthTextureFormat = XrTextureFormatToBgfxFormat(view.DepthTextureFormat);
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
                m_texturesToFrameBuffers[colorTexPtr] = std::unique_ptr<FrameBufferData>{fbPtr};

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

namespace Babylon
{
    namespace
    {
        struct XRSessionType
        {
            static constexpr auto IMMERSIVE_VR{"immersive-vr"};
            static constexpr auto IMMERSIVE_AR{"immersive-vr"};
            static constexpr auto IMMERSIVE_INLINE{"inline"};
        };

        struct XRReferenceSpaceType
        {
            static constexpr auto VIEWER{"viewer"};
            static constexpr auto LOCAL{"local"};
            static constexpr auto LOCAL_FLOOR{"local-floor"};
            static constexpr auto BOUNDED_FLOOR{"bounded-floor"};
            static constexpr auto UNBOUNDED{"unbounded"};
        };

        struct XREye
        {
            static constexpr auto NONE{"none"};
            static constexpr auto LEFT{"left"};
            static constexpr auto RIGHT{"right"};

            static const auto IndexToEye(size_t idx)
            {
                switch (idx)
                {
                    case 0:
                        return LEFT;
                    case 1:
                        return RIGHT;
                    default:
                        throw std::exception{/* Unsupported idx */};
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
                    throw std::exception{/* Unsupported eye */};
                }
            }
        };

        class PointerEvent : public Napi::ObjectWrap<PointerEvent>
        {
            static constexpr auto JS_CLASS_NAME = "PointerEvent";

        public:
            static void Initialize(Napi::Env& env)
            {
                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                    });

                constructor = Napi::Persistent(func);
                constructor.SuppressDestruct();

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New()
            {
                return constructor.New({});
            }

            PointerEvent(const Napi::CallbackInfo & info)
                : Napi::ObjectWrap<PointerEvent>{ info }
            {}

        private:
            static inline Napi::FunctionReference constructor{};
        };

        class XRWebGLLayer : public Napi::ObjectWrap<XRWebGLLayer>
        {
            static constexpr auto JS_CLASS_NAME = "XRWebGLLayer";

        public:
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getViewport", &XRWebGLLayer::GetViewport),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({});
            }

            XRWebGLLayer(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRWebGLLayer>{info}
            {
            }

        private:
            Napi::Value GetViewport(const Napi::CallbackInfo& info)
            {
                return info.This().As<Napi::Object>().Get("viewport");
            }
        };

        class XRRigidTransform : public Napi::ObjectWrap<XRRigidTransform>
        {
            static constexpr auto JS_CLASS_NAME = "XRRigidTransform";
            static constexpr size_t VECTOR_SIZE = 4;
            static constexpr size_t MATRIX_SIZE = 16;

        public:
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceAccessor("position", &XRRigidTransform::Position, nullptr),
                        InstanceAccessor("orientation", &XRRigidTransform::Orientation, nullptr),
                        InstanceAccessor("matrix", &XRRigidTransform::Matrix, nullptr),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({});
            }

            XRRigidTransform(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRRigidTransform>{info}
                , m_position{Napi::Persistent(Napi::Object::New(info.Env()))}
                , m_orientation{Napi::Persistent(Napi::Object::New(info.Env()))}
                , m_matrix{Napi::Persistent(Napi::Float32Array::New(info.Env(), MATRIX_SIZE))}
            {
            }

            void Update(const xr::System::Session::Frame::Space& space, bool isViewSpace)
            {
                auto pos = m_position.Value();
                pos.Set("x", space.Position.X);
                pos.Set("y", space.Position.Y);
                pos.Set("z", space.Position.Z);
                pos.Set("w", 1.f);

                auto or = m_orientation.Value();
                or.Set("x", space.Orientation.X);
                or.Set("y", space.Orientation.Y);
                or.Set("z", space.Orientation.Z);
                or.Set("w", space.Orientation.W);

                std::memcpy(m_matrix.Value().Data(), CreateTransformMatrix(space, isViewSpace).data(), m_matrix.Value().ByteLength());
            }

        private:
            Napi::ObjectReference m_position{};
            Napi::ObjectReference m_orientation{};
            Napi::Reference<Napi::Float32Array> m_matrix{};

            Napi::Value Position(const Napi::CallbackInfo&)
            {
                return m_position.Value();
            }

            Napi::Value Orientation(const Napi::CallbackInfo&)
            {
                return m_orientation.Value();
            }

            Napi::Value Matrix(const Napi::CallbackInfo&)
            {
                return m_matrix.Value();
            }
        };

        class XRView : public Napi::ObjectWrap<XRView>
        {
            static constexpr auto JS_CLASS_NAME = "XRView";
            static constexpr size_t MATRIX_SIZE = 16;

        public:
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceAccessor("eye", &XRView::GetEye, nullptr),
                        InstanceAccessor("projectionMatrix", &XRView::GetProjectionMatrix, nullptr),
                        InstanceAccessor("transform", &XRView::GetTransform, nullptr),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({});
            }

            XRView(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRView>{info}
                , m_eyeIdx{0}
                , m_eye{XREye::IndexToEye(m_eyeIdx)}
                , m_projectionMatrix{Napi::Persistent(Napi::Float32Array::New(info.Env(), MATRIX_SIZE))}
                , m_rigidTransform{Napi::Persistent(XRRigidTransform::New(info))}
            {
            }

            void Update(size_t eyeIdx, gsl::span<const float, 16> projectionMatrix, const xr::System::Session::Frame::Space& space)
            {
                if (eyeIdx != m_eyeIdx)
                {
                    m_eyeIdx = eyeIdx;
                    m_eye = XREye::IndexToEye(m_eyeIdx);
                }

                std::memcpy(m_projectionMatrix.Value().Data(), projectionMatrix.data(), m_projectionMatrix.Value().ByteLength());

                XRRigidTransform::Unwrap(m_rigidTransform.Value())->Update(space, true);
            }

        private:
            size_t m_eyeIdx{};
            gsl::czstring<> m_eye{};
            Napi::Reference<Napi::Float32Array> m_projectionMatrix{};
            Napi::ObjectReference m_rigidTransform{};

            Napi::Value GetEye(const Napi::CallbackInfo& info)
            {
                return Napi::String::From(info.Env(), m_eye);
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
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceAccessor("transform", &XRViewerPose::GetTransform, nullptr),
                        InstanceAccessor("views", &XRViewerPose::GetViews, nullptr),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({});
            }

            XRViewerPose(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRViewerPose>{info}
                , m_jsTransform{Napi::Persistent(XRRigidTransform::New(info))}
                , m_jsViews{Napi::Persistent(Napi::Array::New(info.Env(), 0))}
                , m_transform{*XRRigidTransform::Unwrap(m_jsTransform.Value())}
            {
            }

            void Update(const Napi::CallbackInfo& info, const xr::System::Session::Frame::Space& space, gsl::span<const xr::System::Session::Frame::View> views)
            {
                // Update the transform.
                m_transform.Update(space, true);

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
                            newViews.Set(idx, XRView::New(info));
                        }

                        m_views[idx] = XRView::Unwrap(newViews.Get(idx).As<Napi::Object>());
                    }

                    m_jsViews = Napi::Persistent(newViews);
                }

                // Update the individual views.
                for (uint32_t idx = 0; idx < static_cast<uint32_t>(views.size()); ++idx)
                {
                    const auto& view = views[idx];
                    m_views[idx]->Update(idx, CreateProjectionMatrix(view), view.Space);
                }
            }

        private:
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
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getOffsetReferenceSpace", &XRReferenceSpace::GetOffsetReferenceSpace),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({info[0]});
            }

            XRReferenceSpace(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRReferenceSpace>{info}
            {
                if (info[0].IsString())
                {
                    // TODO: Actually support the different types of reference spaces.
                    const auto referenceSpaceType = info[0].As<Napi::String>().Utf8Value();
                    assert(referenceSpaceType == XRReferenceSpaceType::UNBOUNDED || referenceSpaceType == XRReferenceSpaceType::VIEWER);
                }
                else
                {
                    // TODO: Actually take the offset into account.
                    auto* transform = XRRigidTransform::Unwrap(info[0].As<Napi::Object>());
                    assert(transform != nullptr);
                }
            }

        private:
            Napi::Value GetOffsetReferenceSpace(const Napi::CallbackInfo& info)
            {
                // TODO: Handle XRBoundedReferenceSpace case
                // https://immersive-web.github.io/webxr/#dom-xrreferencespace-getoffsetreferencespace

                return XRReferenceSpace::New(info);
            }
        };

        class XRFrame : public Napi::ObjectWrap<XRFrame>
        {
            static constexpr auto JS_CLASS_NAME = "XRFrame";

        public:
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getViewerPose", &XRFrame::GetViewerPose),
                        InstanceMethod("getPose", &XRFrame::GetPose),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({});
            }

            XRFrame(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRFrame>{info}
                , m_jsXRViewerPose{Napi::Persistent(XRViewerPose::New(info))}
                , m_xrViewerPose{*XRViewerPose::Unwrap(m_jsXRViewerPose.Value())}
                , m_jsTransform{Napi::Persistent(XRRigidTransform::New(info))}
                , m_transform{*XRRigidTransform::Unwrap(m_jsTransform.Value())}
                , m_jsPose{Napi::Persistent(Napi::Object::New(info.Env()))}
            {
                m_jsPose.Set("transform", m_jsTransform.Value());
            }

            void Update(const xr::System::Session::Frame& frame)
            {
                // Store off a pointer to the frame so that the viewer pose can be updated later. We cannot
                // update the viewer pose here because we don't yet know the desired reference space.
                m_frame = &frame;
            }

        private:
            const xr::System::Session::Frame* m_frame{};
            Napi::ObjectReference m_jsXRViewerPose{};
            XRViewerPose& m_xrViewerPose;

            Napi::ObjectReference m_jsTransform{};
            XRRigidTransform& m_transform;
            Napi::ObjectReference m_jsPose{};

            Napi::Value GetViewerPose(const Napi::CallbackInfo& info)
            {
                // TODO: Support reference spaces.
                // auto& space = *XRReferenceSpace::Unwrap(info[0].As<Napi::Object>());

                // Updating the reference space is currently not supported. Until it is, we assume the
                // reference space is unmoving at identity (which is usually true).

                m_xrViewerPose.Update(info, { {0, 0, 0}, {0, 0, 0, 1} }, m_frame->Views);

                return m_jsXRViewerPose.Value();
            }

            Napi::Value GetPose(const Napi::CallbackInfo& info)
            {
                const auto& space = *info[0].As<Napi::External<xr::System::Session::Frame::Space>>().Data();

                m_transform.Update(space, false);
                return m_jsPose.Value();
            }
        };

        // Implementation of the XRSession interface: https://immersive-web.github.io/webxr/#xrsession-interface
        class XRSession : public Napi::ObjectWrap<XRSession>
        {
            static constexpr auto JS_CLASS_NAME = "XRSession";
            static constexpr auto JS_EVENT_NAME_END = "end";
            static constexpr auto JS_EVENT_NAME_INPUT_SOURCES_CHANGE = "inputsourceschange";

        public:
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceAccessor("inputSources", &XRSession::GetInputSources, nullptr),
                        InstanceMethod("addEventListener", &XRSession::AddEventListener),
                        InstanceMethod("requestReferenceSpace", &XRSession::RequestReferenceSpace),
                        InstanceMethod("updateRenderState", &XRSession::UpdateRenderState),
                        InstanceMethod("requestAnimationFrame", &XRSession::RequestAnimationFrame),
                        InstanceMethod("end", &XRSession::End),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Promise CreateAsync(const Napi::CallbackInfo& info)
            {
                auto jsSession = info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({info[0]});
                auto& session = *XRSession::Unwrap(jsSession);

                session.m_xr.BeginSession();

                auto deferred = Napi::Promise::Deferred::New(info.Env());
                deferred.Resolve(jsSession);
                return deferred.Promise();
            }

            XRSession(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<XRSession>{info}
                , m_jsXRFrame{Napi::Persistent(XRFrame::New(info))}
                , m_xrFrame{*XRFrame::Unwrap(m_jsXRFrame.Value())}
                , m_jsInputSources{Napi::Persistent(Napi::Array::New(info.Env()))}
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
            NativeXr m_xr{};
            Napi::ObjectReference m_jsXRFrame{};
            XRFrame& m_xrFrame;

            std::vector<std::pair<const std::string, Napi::FunctionReference>> m_eventNamesAndCallbacks{};

            Napi::Reference<Napi::Array> m_jsInputSources{};
            std::map<xr::System::Session::Frame::InputSource::Identifier, Napi::ObjectReference> m_idToInputSource{};

            Napi::Value GetInputSources(const Napi::CallbackInfo& info)
            {
                return m_jsInputSources.Value();
            }

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

            void ProcessInputSources(const xr::System::Session::Frame& frame, Napi::Env env)
            {
                // Figure out the new state.
                std::set<xr::System::Session::Frame::InputSource::Identifier> added{};
                std::set<xr::System::Session::Frame::InputSource::Identifier> current{};
                std::set<xr::System::Session::Frame::InputSource::Identifier> removed{};
                for (auto& inputSource : frame.InputSources)
                {
                    if (!inputSource.TrackedThisFrame)
                    {
                        continue;
                    }

                    current.insert(inputSource.ID);

                    auto found = m_idToInputSource.find(inputSource.ID);
                    if (found == m_idToInputSource.end())
                    {
                        // Create the new input source, which will have the correct spaces associated with it.
                        m_idToInputSource.insert({ inputSource.ID, CreateXRInputSource(inputSource, env) });

                        added.insert(inputSource.ID);
                    }
                    else
                    {
                        // Ensure the correct spaces are associated with the existing input source.
                        SetXRInputSourceSpaces(found->second.Value(), inputSource);
                    }
                }
                for (const auto& [id, ref] : m_idToInputSource)
                {
                    if (current.find(id) == current.end())
                    {
                        // Do not update space association since said spaces no longer exist.
                        removed.insert(id);
                    }
                }

                // Only need to do more if there's been a change. Note that this block of code assumes
                // that ALL known input sources -- including ones added AND REMOVED this frame -- are
                // currently up-to-date and accessible though m_idToInputSource.
                if (added.size() > 0 || removed.size() > 0)
                {
                    // Update the input sources array.
                    auto jsCurrent = Napi::Array::New(env);
                    for (const auto id : current)
                    {
                        jsCurrent.Set(jsCurrent.Length(), m_idToInputSource[id].Value());
                    }
                    m_jsInputSources = Napi::Persistent(jsCurrent);

                    // Create and send the sources changed event.
                    Napi::Array jsAdded = Napi::Array::New(env);
                    for (const auto id : added)
                    {
                        jsAdded.Set(jsAdded.Length(), m_idToInputSource[id].Value());
                    }
                    Napi::Array jsRemoved = Napi::Array::New(env);
                    for (const auto id : removed)
                    {
                        jsRemoved.Set(jsRemoved.Length(), m_idToInputSource[id].Value());
                    }
                    auto sourcesChangeEvent = Napi::Object::New(env);
                    sourcesChangeEvent.Set("added", jsAdded);
                    sourcesChangeEvent.Set("removed", jsRemoved);
                    for (const auto& [name, callback] : m_eventNamesAndCallbacks)
                    {
                        if (name == JS_EVENT_NAME_INPUT_SOURCES_CHANGE)
                        {
                            callback.Call({ sourcesChangeEvent });
                        }
                    }

                    // Finally, remove the removed.
                    for (const auto id : removed)
                    {
                        m_idToInputSource.erase(id);
                    }
                }
            }

            Napi::Value RequestAnimationFrame(const Napi::CallbackInfo& info)
            {
                m_xr.DoFrame([this, func = std::make_shared<Napi::FunctionReference>(std::move(Napi::Persistent(info[0].As<Napi::Function>()))), env = info.Env()](const auto& frame) {
                    ProcessInputSources(frame, env);

                    m_xrFrame.Update(frame);
                    func->Call({Napi::Value::From(env, -1), m_jsXRFrame.Value()});
                });

                // TODO: Timestamp, I think? Or frame handle? Look up what this return value is and return the right thing.
                return Napi::Value::From(info.Env(), 0);
            }

            Napi::Value End(const Napi::CallbackInfo& info)
            {
                m_xr.Dispatch([this]() {
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
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("initializeXRLayerAsync", &NativeWebXRRenderTarget::InitializeXRLayerAsync),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({info[0]});
            }

            NativeWebXRRenderTarget(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<NativeWebXRRenderTarget>{info}
                , m_jsEngineReference{Napi::Persistent(info[0].As<Napi::Object>())}
            {
            }

        private:
            // Lifetime control to prevent the cleanup of the NativeEngine while XR is still alive.
            Napi::ObjectReference m_jsEngineReference{};

            Napi::Value InitializeXRLayerAsync(const Napi::CallbackInfo& info)
            {
                auto& session = *XRSession::Unwrap(info[0].As<Napi::Object>());
                session.SetEngine(m_jsEngineReference.Value());

                auto xrLayer = XRWebGLLayer::New(info);
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
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("getRenderTargetForEye", &NativeRenderTargetProvider::GetRenderTargetForEye),
                    });

                env.Global().Set(JS_CLASS_NAME, func);
            }

            static Napi::Object New(const Napi::CallbackInfo& info)
            {
                return info.Env().Global().Get(JS_CLASS_NAME).As<Napi::Function>().New({info[0], info[1]});
            }

            NativeRenderTargetProvider(const Napi::CallbackInfo& info)
                : Napi::ObjectWrap<NativeRenderTargetProvider>{info}
                , m_jsSession{Napi::Persistent(info[0].As<Napi::Object>())}
                , m_session{*XRSession::Unwrap(m_jsSession.Value())}
            {
                auto createRenderTextureCallback = info[1].As<Napi::Function>();

                for (size_t idx = 0; idx < m_jsRenderTargetTextures.size(); ++idx)
                {
                    auto size = m_session.GetWidthAndHeightForViewIndex(idx);
                    auto jsWidth = Napi::Value::From(info.Env(), size.Width);
                    auto jsHeight = Napi::Value::From(info.Env(), size.Height);
                    m_jsRenderTargetTextures[idx] = Napi::Persistent(createRenderTextureCallback.Call({jsWidth, jsHeight}).As<Napi::Object>());
                }
            }

        private:
            Napi::ObjectReference m_jsSession{};
            std::array<Napi::ObjectReference, 2> m_jsRenderTargetTextures;
            XRSession& m_session;

            Napi::Value GetRenderTargetForEye(const Napi::CallbackInfo& info)
            {
                const std::string eye{info[0].As<Napi::String>().Utf8Value()};

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
            static void Initialize(Napi::Env env)
            {
                Napi::HandleScope scope{env};

                Napi::Function func = DefineClass(
                    env,
                    JS_CLASS_NAME,
                    {
                        InstanceMethod("isSessionSupported", &XR::IsSessionSupported),
                        InstanceMethod("requestSession", &XR::RequestSession),
                        InstanceMethod("getWebXRRenderTarget", &XR::GetWebXRRenderTarget),
                        InstanceMethod("getNativeRenderTargetProvider", &XR::GetNativeRenderTargetProvider),
                        InstanceValue(JS_NATIVE_NAME, Napi::Value::From(env, true)),
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
                : Napi::ObjectWrap<XR>{info}
            {
            }

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

    void InitializeNativeXr(Env& env)
    {
        PointerEvent::Initialize(env);

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
