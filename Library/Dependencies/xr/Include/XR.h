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

    enum TextureFormat
    {
        RGBA8,
        D24S8
    };

    class System
    {
    public:
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
                    struct
                    {
                        size_t Width{};
                        size_t Height{};
                    } ColorTextureSize;

                    TextureFormat DepthTextureFormat{};
                    void* DepthTexturePointer{};
                    struct
                    {
                        size_t Width{};
                        size_t Height{};
                    } DepthTextureSize;
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

        private:
            std::unique_ptr<Impl> m_impl{};
        };

        System();
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
