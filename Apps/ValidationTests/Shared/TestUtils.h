#pragma once

#include <napi/env.h>

#include <bgfx/bgfx.h>
#include <bgfx/platform.h>

#include <bimg/bimg.h>
#include <bimg/decode.h>
#include <bimg/encode.h>

#if _MSC_VER 
#pragma warning( disable : 4324 ) // 'bx::DirectoryReader': structure was padded due to alignment specifier
#endif

#include <bx/file.h>

#include <functional>
#include <sstream>
#include <Babylon/JsRuntime.h>
#include <atomic>

namespace
{
    std::filesystem::path GetModulePath();
    std::atomic<bool> doExit{};
    int errorCode{};
}

namespace Babylon
{
    class TestUtils final : public Napi::ObjectWrap<TestUtils>
    {
    public:
        static inline constexpr const char* JS_INSTANCE_NAME{ "TestUtils" };

        using ParentT = Napi::ObjectWrap<TestUtils>;

        static void CreateInstance(Napi::Env env, void* nativeWindowPtr)
        {
            _nativeWindowPtr = nativeWindowPtr;
            Napi::HandleScope scope{ env };

            Napi::Function func = ParentT::DefineClass(
                env,
                "TestUtilsClass",
                {
                    ParentT::InstanceMethod("exit", &TestUtils::Exit),
                    ParentT::InstanceMethod("updateSize", &TestUtils::UpdateSize),
                    ParentT::InstanceMethod("setTitle", &TestUtils::SetTitle),
                    ParentT::InstanceMethod("writePNG", &TestUtils::WritePNG),
                    ParentT::InstanceMethod("decodeImage", &TestUtils::DecodeImage),
                    ParentT::InstanceMethod("getImageData", &TestUtils::GetImageData),
                    ParentT::InstanceMethod("getWorkingDirectory", &TestUtils::GetWorkingDirectory),
                });
            env.Global().Set(JS_INSTANCE_NAME, func.New({}));
        }

        explicit TestUtils(const Napi::CallbackInfo& info)
            : ParentT{ info }
        {
        }

    private:
        static inline Napi::FunctionReference constructor{};

        void Exit(const Napi::CallbackInfo& info)
        {
            const int32_t exitCode = info[0].As<Napi::Number>().Int32Value();
            doExit = true;
            errorCode = exitCode;
#ifdef WIN32
            PostMessageW((HWND)_nativeWindowPtr, WM_CLOSE, exitCode, 0);
#elif __linux__
            Display* display = XOpenDisplay(NULL);
            XClientMessageEvent dummyEvent;
            memset(&dummyEvent, 0, sizeof(XClientMessageEvent));
            dummyEvent.type = ClientMessage;
            dummyEvent.window = (Window)_nativeWindowPtr;
            dummyEvent.format = 32;
            XSendEvent(display, (Window)_nativeWindowPtr, 0, 0, (XEvent*)&dummyEvent);
            XFlush(display);
#else
            // TODO: handle exit for other platforms
#endif
        }

        void UpdateSize(const Napi::CallbackInfo& info)
        {
#ifdef WIN32
            const int32_t width = info[0].As<Napi::Number>().Int32Value();
            const int32_t height = info[1].As<Napi::Number>().Int32Value();

            HWND hwnd = (HWND)_nativeWindowPtr;
            RECT rc{ 0, 0, width, height };
            AdjustWindowRectEx(&rc, GetWindowStyle(hwnd), GetMenu(hwnd) != NULL, GetWindowExStyle(hwnd));
            SetWindowPos(hwnd, NULL, 0, 0, rc.right - rc.left, rc.bottom - rc.top, SWP_NOMOVE | SWP_NOZORDER);
#else
            // TODO: handle resize for other platforms
            (void)info;
#endif
        }

        void SetTitle(const Napi::CallbackInfo& info)
        {
            const auto title = info[0].As<Napi::String>().Utf8Value();
#ifdef WIN32
            SetWindowTextA((HWND)_nativeWindowPtr, title.c_str());
#elif __linux__
            Display* display = XOpenDisplay(NULL);
            XStoreName(display, (Window)_nativeWindowPtr, title.c_str());
#else
            // TODO: handle title for other platforms
#endif
        }

        void WritePNG(const Napi::CallbackInfo& info)
        {
            const auto buffer = info[0].As<Napi::Uint8Array>();
            const auto width = info[1].As<Napi::Number>().Uint32Value();
            const auto height = info[2].As<Napi::Number>().Uint32Value();
            const auto filename = info[3].As<Napi::String>().Utf8Value();

            if (buffer.ByteLength() < (width * height * 4))
            {
                return;
            }
            bx::DefaultAllocator allocator;
            bx::MemoryBlock mb(&allocator);
            bx::FileWriter writer;
            bx::FilePath filepath(filename.c_str());
            bx::Error err;
            if (writer.open(filepath, false, &err))
            {
                bimg::imageWritePng(&writer, width, height, width * 4, buffer.Data(), bimg::TextureFormat::RGBA8, false);
                writer.close();
            }
        }

        struct Image
        {
            Image() = default;
            ~Image()
            {
                if (m_Image)
                {
                    bimg::imageFree(m_Image);
                }
            }
            bimg::ImageContainer* m_Image{};
        };

        Napi::Value DecodeImage(const Napi::CallbackInfo& info)
        {
            Image* image = new Image;
            const auto buffer = info[0].As<Napi::ArrayBuffer>();

            bx::DefaultAllocator allocator;
            image->m_Image = bimg::imageParse(&allocator, buffer.Data(), static_cast<uint32_t>(buffer.ByteLength()));

            return Napi::External<Image>::New(info.Env(), image);
        }

        Napi::Value GetImageData(const Napi::CallbackInfo& info)
        {
            const auto imageData = info[0].As<Napi::External<Image>>().Data();

            if (!imageData || !imageData->m_Image->m_size)
            {
                return info.Env().Undefined();
            }

            auto data = Napi::Uint8Array::New(info.Env(), imageData->m_Image->m_size);
            const auto ptr = static_cast<uint8_t*>(imageData->m_Image->m_data);
            memcpy(data.Data(), ptr, imageData->m_Image->m_size);

            return Napi::Value::From(info.Env(), data);
        }

        Napi::Value GetWorkingDirectory(const Napi::CallbackInfo& info)
        {
            auto path = GetModulePath().parent_path().generic_string();
#ifdef WIN32
            path += "/..";
#endif
            return Napi::Value::From(info.Env(), path);
        }


        inline static void* _nativeWindowPtr{};
    };
}
