#include "NativeWindow.h"

namespace Babylon::Plugins::Internal
{
    namespace
    {
        constexpr auto JS_CLASS_NAME = "NativeWindow";
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

            m_onResizeCallbacks.apply_to_all([this](auto& callback) {
                callback(m_width, m_height);
            });
        }
    }

    NativeWindow::OnResizeCallbackTicket NativeWindow::AddOnResizeCallback(OnResizeCallback&& callback)
    {
        return m_onResizeCallbacks.insert(std::move(callback));
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
}

namespace Babylon::Plugins::NativeWindow
{
    using NativeWindow = Babylon::Plugins::Internal::NativeWindow;

    void Initialize(Napi::Env env, void* windowPtr, size_t width, size_t height)
    {
        NativeWindow::Initialize(env, windowPtr, width, height);
    }

    void UpdateSize(Napi::Env env, size_t width, size_t height)
    {
        auto& window = NativeWindow::GetFromJavaScript(env);
        window.Resize(static_cast<size_t>(width), static_cast<size_t>(height));
    }
}
