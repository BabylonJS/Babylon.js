#include "NativeWindow.h"

#include <basen.hpp>

namespace Babylon
{
    namespace
    {
        constexpr auto JS_CLASS_NAME = "NativeWindow";
        constexpr auto JS_SET_TIMEOUT_NAME = "setTimeout";
        constexpr auto JS_A_TO_B_NAME = "atob";
        constexpr auto JS_ADD_EVENT_LISTENER_NAME = "addEventListener";
        constexpr auto JS_REMOVE_EVENT_LISTENER_NAME = "removeEventListener";
    }

    void NativeWindow::Initialize(Napi::Env env, void* windowPtr, size_t width, size_t height)
    {
        Napi::HandleScope scope{env};

        Napi::Function constructor = DefineClass(
            env,
            JS_CLASS_NAME,
            {});

        auto global = env.Global();
        auto jsNative = global.Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>();
        auto jsWindow = constructor.New({Napi::External<void>::New(env, windowPtr), Napi::Number::From(env, width), Napi::Number::From(env, height)});

        jsNative.Set(JS_NATIVE_WINDOW_NAME, jsWindow);
        global.Set(JS_SET_TIMEOUT_NAME, Napi::Function::New(env, &NativeWindow::SetTimeout, JS_SET_TIMEOUT_NAME, NativeWindow::Unwrap(jsWindow)));
        global.Set(JS_A_TO_B_NAME, Napi::Function::New(env, &NativeWindow::DecodeBase64, JS_A_TO_B_NAME));
        global.Set(JS_ADD_EVENT_LISTENER_NAME, Napi::Function::New(env, &NativeWindow::AddEventListener, JS_ADD_EVENT_LISTENER_NAME));
        global.Set(JS_REMOVE_EVENT_LISTENER_NAME, Napi::Function::New(env, &NativeWindow::RemoveEventListener, JS_REMOVE_EVENT_LISTENER_NAME));
    }

    NativeWindow& NativeWindow::GetFromJavaScript(Napi::Env env)
    {
        return *NativeWindow::Unwrap(env.Global().Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>().Get(JS_NATIVE_WINDOW_NAME).As<Napi::Object>());
    }

    NativeWindow::NativeWindow(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<NativeWindow>{info}
        , m_runtime{JsRuntime::GetFromJavaScript(info.Env())}
        , m_windowPtr{info[0].As<Napi::External<void>>().Data()}
        , m_width{static_cast<size_t>(info[1].As<Napi::Number>().Uint32Value())}
        , m_height{static_cast<size_t>(info[2].As<Napi::Number>().Uint32Value())}
    {
    }

    void NativeWindow::Resize(size_t newWidth, size_t newHeight)
    {
        if (newWidth != m_width || newHeight != m_height)
        {
            m_width = newWidth;
            m_height = newHeight;

            m_onResizeCallbacks.ApplyToAll([this](auto& callback) {
                callback(m_width, m_height);
            });
        }
    }

    NativeWindow::OnResizeCallbackTicket NativeWindow::AddOnResizeCallback(OnResizeCallback&& callback)
    {
        return m_onResizeCallbacks.Insert(std::move(callback));
    }

    void* NativeWindow::GetWindowPtr() const
    {
        return m_windowPtr;
    }

    size_t NativeWindow::GetWidth() const
    {
        return m_width;
    }

    size_t NativeWindow::GetHeight() const
    {
        return m_height;
    }

    void NativeWindow::SetTimeout(const Napi::CallbackInfo& info)
    {
        auto function = Napi::Persistent(info[0].As<Napi::Function>());
        auto milliseconds = std::chrono::milliseconds{info[1].As<Napi::Number>().Int32Value()};

        auto& nativeWindow = *static_cast<NativeWindow*>(info.Data());

        nativeWindow.RecursiveWaitOrCall(std::make_shared<Napi::FunctionReference>(std::move(function)), std::chrono::system_clock::now() + milliseconds);
    }

    Napi::Value NativeWindow::DecodeBase64(const Napi::CallbackInfo& info)
    {
        std::string encodedData = info[0].As<Napi::String>().Utf8Value();
        std::u16string decodedData;
        bn::decode_b64(encodedData.begin(), encodedData.end(), std::back_inserter(decodedData));
        return Napi::Value::From(info.Env(), decodedData);
    }

    void NativeWindow::AddEventListener(const Napi::CallbackInfo& info)
    {
        // TODO: handle events
    }

    void NativeWindow::RemoveEventListener(const Napi::CallbackInfo& info)
    {
        // TODO: handle events
    }

    void NativeWindow::RecursiveWaitOrCall(
        std::shared_ptr<Napi::FunctionReference> function,
        std::chrono::system_clock::time_point whenToRun)
    {
        if (std::chrono::system_clock::now() >= whenToRun)
        {
            function->Call({});
        }
        else
        {
            m_runtime.Dispatch([this, function = std::move(function), whenToRun](Napi::Env) {
                RecursiveWaitOrCall(std::move(function), whenToRun);
            });
        }
    }
}
