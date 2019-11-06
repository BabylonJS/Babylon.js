#pragma once

#include <memory>
#include <string>
#include <vector>

namespace xr
{
    class Exception final : public std::exception
    {
    public:
        Exception::Exception(const char* message);
        const char* Exception::what() const noexcept;

    private:
        std::string m_message{};
    };

    enum class TextureFormat
    {
        RGBA8,
        RGBA8S,
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
        constexpr static float DEFAULT_DEPTH_NEAR_Z{ 0.5f };
        constexpr static float DEFAULT_DEPTH_FAR_Z{ 1000.f };

        class Session
        {
            friend class System;
            class Impl;

        public:
            class Frame
            {
            public:
                struct View
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

                std::vector<View>& Views;

                Frame(System::Session::Impl&);
                ~Frame();

            private:
                Session::Impl& m_sessionImpl;
                bool m_shouldRender{};
                int64_t m_displayTime{};
            };

            Session(System& headMountedDisplay, void* graphicsDevice);
            ~Session();

            Session(Session&) = delete;
            Session& operator=(Session&&) = delete;

            std::unique_ptr<Frame> GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession);
            void RequestEndSession();
            Size GetWidthAndHeightForViewIndex(size_t viewIndex) const;
            void SetDepthsNearFar(float depthNear, float depthFar);

        private:
            std::unique_ptr<Impl> m_impl{};
        };

        System(const char* = "OpenXR Experience");
        ~System();

        System(System&) = delete;
        System& operator=(System&&) = delete;

        bool IsInitialized() const;
        bool TryInitialize();

    private:
        class Impl;
        std::unique_ptr<Impl> m_impl{};
    };
}
