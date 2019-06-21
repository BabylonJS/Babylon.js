#include "Window.h"
#include "RuntimeImpl.h"
#include <basen.hpp>
#include <napi/env.h>

namespace babylon
{
    Window::Window(RuntimeImpl& runtimeImpl)
        : m_runtimeImpl{ runtimeImpl }
    {
        Napi::Env& env = m_runtimeImpl.Env();
        Napi::HandleScope scope{ env };

        Napi::Object global = env.Global();
        global.Set("setTimeout", Napi::Function::New(env, &Window::SetTimeout, "setTimeout", this));
        global.Set("atob", Napi::Function::New(env, &Window::DecodeBase64, "atob", this));

        global.Set("window", global);
    }

    void Window::SetTimeout(const Napi::CallbackInfo& info)
    {
        auto function = Napi::Persistent(info[0].As<Napi::Function>());
        auto milliseconds = std::chrono::milliseconds{ info[1].As<Napi::Number>().Int32Value() };

        Window* window = reinterpret_cast<Window*>(info.Data());
        window->RecursiveWaitOrCall(std::make_shared<Napi::FunctionReference>(std::move(function)), std::chrono::system_clock::now() + milliseconds);
    }

    Napi::Value Window::DecodeBase64(const Napi::CallbackInfo& info)
    {
        std::string encodedData = info[0].As<Napi::String>().Utf8Value();
        std::u16string decodedData;
        bn::decode_b64(encodedData.begin(), encodedData.end(), std::back_inserter(decodedData));
        return Napi::Value::From(info.Env(), decodedData);
    }

    void Window::RecursiveWaitOrCall(
        std::shared_ptr<Napi::FunctionReference> function,
        std::chrono::system_clock::time_point whenToRun)
    {
        if (std::chrono::system_clock::now() >= whenToRun)
        {
            function->Call({});
        }
        else
        {
            m_runtimeImpl.Execute([this, function = std::move(function), whenToRun](auto&)
            {
                RecursiveWaitOrCall(std::move(function), whenToRun);
            });
        }
    }
}
