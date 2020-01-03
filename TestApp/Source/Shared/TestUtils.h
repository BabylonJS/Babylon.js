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
                    ParentT::StaticMethod("exit", &TestUtils::Exit)
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

        inline static void* _nativeWindowPtr{};
    };
}
