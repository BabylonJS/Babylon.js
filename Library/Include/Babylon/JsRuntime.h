#pragma once

#include <napi/env.h>

#include <functional>

namespace Babylon
{
    class JsRuntime
    {
        static constexpr auto JS_RUNTIME_NAME = "runtime";
        static constexpr auto JS_WINDOW_NAME = "window";

    public:
        static constexpr auto JS_NATIVE_NAME = "_native";
        using DispatchFunctionT = std::function<void(std::function<void(Napi::Env)>)>;

        static void Initialize(Napi::Env env, DispatchFunctionT dispatchFunction)
        {
            auto global = env.Global();

            if (global.Get(JS_WINDOW_NAME).IsUndefined())
            {
                global.Set(JS_WINDOW_NAME, global);
            }

            auto jsNative = Napi::Object::New(env);
            global.Set(JS_NATIVE_NAME, jsNative);

            auto jsRuntime = Napi::External<JsRuntime>::New(
                env, 
                new JsRuntime(std::move(dispatchFunction)),
                [](Napi::Env, JsRuntime* jsRuntime) { delete jsRuntime; });
            jsNative.Set(JS_RUNTIME_NAME, jsRuntime);
        }

        static JsRuntime& GetFromJavaScript(Napi::Env env)
        {
            return *env.Global()
                .Get(JS_NATIVE_NAME)
                .As<Napi::Object>()
                .Get(JS_RUNTIME_NAME)
                .As<Napi::External<JsRuntime>>()
                .Data();
        }

        void Dispatch(std::function<void(Napi::Env)> function)
        {
            m_dispatchFunction(std::move(function));
        }

    private:
        JsRuntime(DispatchFunctionT&& dispatchFunction)
            : m_dispatchFunction{dispatchFunction}
        {
        }

        DispatchFunctionT m_dispatchFunction{};
    };
}