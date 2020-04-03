#pragma once

#include <Babylon/JsRuntime.h>

namespace Babylon::Polyfills::Internal
{
    class Window : public Napi::ObjectWrap<Window>
    {
        static constexpr auto JS_WINDOW_NAME = "window";

    public:
        static void Initialize(Napi::Env env);
        static Window& GetFromJavaScript(Napi::Env);

        Window(const Napi::CallbackInfo& info);

    private:
        JsRuntime& m_runtime;

        static void SetTimeout(const Napi::CallbackInfo& info);
        static Napi::Value DecodeBase64(const Napi::CallbackInfo& info);
        static void AddEventListener(const Napi::CallbackInfo& info);
        static void RemoveEventListener(const Napi::CallbackInfo& info);

        void RecursiveWaitOrCall(std::shared_ptr<Napi::FunctionReference> function, std::chrono::system_clock::time_point whenToRun);
    };
}
