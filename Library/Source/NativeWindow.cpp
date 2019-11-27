#include "NativeWindow.h"

#include <basen.hpp>

namespace Babylon
{
    namespace
    {
        constexpr auto JS_CLASS_NAME = "NativeWindow";
        constexpr auto JS_SET_TIMEOUT_NAME = "setTimeout";
        constexpr auto JS_A_TO_B_NAME = "atob";
    }

    Napi::ObjectReference NativeWindow::Create(Napi::Env& env, void* windowPtr, size_t width, size_t height)
    {
        Napi::HandleScope scope{ env };

        Napi::Function constructor = DefineClass(
            env,
            JS_CLASS_NAME,
            {

            });

        return Napi::Persistent(constructor.New({ Napi::External<void>::New(env, windowPtr), Napi::Number::From(env, width), Napi::Number::From(env, height) }));
    }

    Napi::FunctionReference NativeWindow::GetSetTimeoutFunction(Napi::ObjectReference& nativeWindow)
    {
        return Napi::Persistent(Napi::Function::New(nativeWindow.Env(), &NativeWindow::SetTimeout, JS_SET_TIMEOUT_NAME, NativeWindow::Unwrap(nativeWindow.Value())));
    }

    Napi::FunctionReference NativeWindow::GetAToBFunction(Napi::ObjectReference& nativeWindow)
    {
        return Napi::Persistent(Napi::Function::New(nativeWindow.Env(), &NativeWindow::DecodeBase64, JS_A_TO_B_NAME));
    }

    NativeWindow::NativeWindow(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<NativeWindow>{ info }
        , m_runtimeImpl{ RuntimeImpl::GetRuntimeImplFromJavaScript(info.Env()) }
        , m_windowPtr{ info[0].As<Napi::External<void>>().Data() }
        , m_width{ static_cast<size_t>(info[1].As<Napi::Number>().Uint32Value()) }
        , m_height{ static_cast<size_t>(info[2].As<Napi::Number>().Uint32Value()) }
    {}

    void NativeWindow::Resize(size_t newWidth, size_t newHeight)
    {
        if (newWidth != m_width || newHeight != m_height)
        {
            m_width = newWidth;
            m_height = newHeight;

            std::scoped_lock lock{ m_mutex };
            for (const auto& callback : m_onResizeCallbacks)
            {
                callback(m_width, m_height);
            }
        }
    }

    NativeWindow::OnResizeCallbackTicket NativeWindow::AddOnResizeCallback(OnResizeCallback&& callback)
    {
        std::scoped_lock lock{ m_mutex };
        return m_onResizeCallbacks.insert(callback, m_mutex);
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
        auto milliseconds = std::chrono::milliseconds{ info[1].As<Napi::Number>().Int32Value() };

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
            m_runtimeImpl.Dispatch([this, function = std::move(function), whenToRun](auto&)
            {
                RecursiveWaitOrCall(std::move(function), whenToRun);
            });
        }
    }
}
