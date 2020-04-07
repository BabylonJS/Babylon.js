#pragma once

#include <memory>
#include <string>
#include <vector>

#ifdef ANDROID
#include <jni.h>
#endif

namespace xr
{
    enum class TextureFormat
    {
        RGBA8_SRGB,
        BGRA8_SRGB,
        D24S8
    };

    struct Size
    {
        size_t Width{};
        size_t Height{};
    };

    class System
    {
    public:
        static constexpr float DEFAULT_DEPTH_NEAR_Z{ 0.5f };
        static constexpr float DEFAULT_DEPTH_FAR_Z{ 1000.f };

        class Session
        {
            friend class System;
            class Impl;

        public:
            class Frame
            {
            public:
                struct Space
                {
                    struct
                    {
                        float X{};
                        float Y{};
                        float Z{};
                    } Position;

                    struct
                    {
                        float X{};
                        float Y{};
                        float Z{};
                        float W{};
                    } Orientation;
                };

                struct View
                {
                    Space Space{};

                    struct
                    {
                        float AngleLeft{};
                        float AngleRight{};
                        float AngleUp{};
                        float AngleDown{};
                    } FieldOfView;

                    TextureFormat ColorTextureFormat{};
                    void* ColorTexturePointer{};
                    Size ColorTextureSize;

                    TextureFormat DepthTextureFormat{};
                    void* DepthTexturePointer{};
                    Size DepthTextureSize;

                    float DepthNearZ{};
                    float DepthFarZ{};
                };

                struct InputSource
                {
                    using Identifier = size_t;

                    enum class HandednessEnum
                    {
                        Left = 0,
                        Right = 1
                    };

                    const Identifier ID{ NEXT_ID++ };
                    bool TrackedThisFrame{};
                    Space GripSpace{};
                    Space AimSpace{};
                    HandednessEnum Handedness{};

                private:
                    static inline Identifier NEXT_ID{ 0 };
                };

                std::vector<View>& Views;
                std::vector<InputSource>& InputSources;

                Frame(System::Session::Impl&);
                ~Frame();

            private:
                class Impl;
                std::unique_ptr<Impl> m_impl{};
            };

            Session(System& system, void* graphicsDevice);
            ~Session();

            Session(Session&) = delete;
            Session& operator=(Session&&) = delete;

            std::unique_ptr<Frame> GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession);
            void RequestEndSession();
            Size GetWidthAndHeightForViewIndex(size_t viewIndex) const;
            void SetDepthsNearFar(float depthNear, float depthFar);

            // TODO: Probably need pause/resume functionality for ARCore

        private:
            std::unique_ptr<Impl> m_impl{};
        };

        System(const char* = "OpenXR Experience");
        ~System();

        System(System&) = delete;
        System& operator=(System&&) = delete;

        bool IsInitialized() const;

#ifdef ANDROID
        bool TryInitialize(JNIEnv* env, jobject appContext);
#else
        bool TryInitialize();
#endif

    private:
        class Impl;
        std::unique_ptr<Impl> m_impl{};
    };
}
