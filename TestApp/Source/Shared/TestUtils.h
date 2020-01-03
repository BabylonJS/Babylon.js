#pragma once

#include <napi/env.h>

#include <functional>
#include <sstream>

namespace Babylon
{
    class TestUtils final : public Napi::ObjectWrap<TestUtils>
    {
    public:
        static inline constexpr char* JS_INSTANCE_NAME{ "testUtils" };

        using ParentT = Napi::ObjectWrap<TestUtils>;

        static void CreateInstance(Napi::Env env, void* nativeWindowPtr)
        {
            _nativeWindowPtr = nativeWindowPtr;
            Napi::HandleScope scope{ env };

            Napi::Function func = ParentT::DefineClass(
                env,
                "TestUtils",
                {
                    ParentT::StaticMethod("exit", &TestUtils::Exit),
                    ParentT::StaticMethod("updateSize", &TestUtils::UpdateSize),
                    ParentT::StaticMethod("setTitle", &TestUtils::SetTitle),
                    
                });

            constructor = Napi::Persistent(func);
            constructor.SuppressDestruct();

            env.Global().Set("TestUtils", func);
        }

        explicit TestUtils(const Napi::CallbackInfo& info)
            : ParentT{ info }
        {
        }

    private:
        static inline Napi::FunctionReference constructor{};

        static void Exit(const Napi::CallbackInfo& info)
        {
            const int32_t exitCode = info[0].As<Napi::Number>().Int32Value();
#ifdef WIN32
            PostMessageW((HWND)_nativeWindowPtr, WM_QUIT, exitCode, 0);
#else
            // TODO: handle exit for other platforms
#endif
        }

        static void UpdateSize(const Napi::CallbackInfo& info)
        {
            const int32_t width = info[0].As<Napi::Number>().Int32Value();
            const int32_t height = info[1].As<Napi::Number>().Int32Value();
            
#ifdef WIN32
            HWND hwnd = (HWND)_nativeWindowPtr;
            RECT rc {0, 0, width, height};
            AdjustWindowRectEx(&rc, GetWindowStyle(hwnd), GetMenu(hwnd) != NULL, GetWindowExStyle(hwnd));
            SetWindowPos(hwnd, NULL, 0, 0, rc.right - rc.left, rc.bottom - rc.top, SWP_NOMOVE | SWP_NOZORDER);
#else
            // TODO: handle resize for other platforms
#endif
        }

        static void SetTitle(const Napi::CallbackInfo& info)
        {
            const auto title = info[0].As<Napi::String>().Utf8Value();
#ifdef WIN32
            SetWindowTextA((HWND)_nativeWindowPtr, title.c_str());
#else
            // TODO: handle title for other platforms
#endif
        }

        inline static void* _nativeWindowPtr{};
    };
}
