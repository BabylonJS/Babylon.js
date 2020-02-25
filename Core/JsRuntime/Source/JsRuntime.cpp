#include "JsRuntime.h"

namespace Babylon
{
    namespace
    {
        static constexpr auto JS_RUNTIME_NAME = "runtime";
        static constexpr auto JS_WINDOW_NAME = "window";
    }

    JsRuntime::JsRuntime(DispatchFunctionT dispatchFunction)
        : JsRuntime(std::move(dispatchFunction), [](Napi::Env, JsRuntime*) {})
    {
    }

    JsRuntime::JsRuntime(DispatchFunctionT dispatchFunction, DeleterT deleter)
        : m_dispatchFunction{std::move(dispatchFunction)}
    {
        Dispatch([this, deleter = std::move(deleter)](Napi::Env env) mutable {
            auto global = env.Global();

            if (global.Get(JS_WINDOW_NAME).IsUndefined())
            {
                global.Set(JS_WINDOW_NAME, global);
            }

            auto jsNative = Napi::Object::New(env);
            global.Set(JS_NATIVE_NAME, jsNative);

            Napi::Value jsRuntime = Napi::External<JsRuntime>::New(env, this, std::move(deleter));
            jsNative.Set(JS_RUNTIME_NAME, jsRuntime);
        });
    }

    void JsRuntime::Initialize(Napi::Env env, DispatchFunctionT dispatchFunction)
    {
        DeleterT deleter = [](Napi::Env, JsRuntime* runtime) { delete runtime; };
        new JsRuntime(std::move(dispatchFunction), std::move(deleter));
    }

    JsRuntime& JsRuntime::GetFromJavaScript(Napi::Env env)
    {
        return *env.Global()
                    .Get(JS_NATIVE_NAME)
                    .As<Napi::Object>()
                    .Get(JS_RUNTIME_NAME)
                    .As<Napi::External<JsRuntime>>()
                    .Data();
    }

    void JsRuntime::Dispatch(std::function<void(Napi::Env)> function)
    {
        std::scoped_lock lock{m_mutex};
        m_dispatchFunction(std::move(function));
    }
}
