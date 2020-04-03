#include "Console.h"

#include <functional>
#include <sstream>

namespace Babylon
{
    void Console::CreateInstance(Napi::Env env, Polyfills::Console::CallbackT callback)
    {
        Napi::HandleScope scope{env};

        Napi::Function func = ParentT::DefineClass(
            env,
            "Console",
            {
                ParentT::InstanceMethod("log", &Console::Log),
                ParentT::InstanceMethod("warn", &Console::Warn),
                ParentT::InstanceMethod("error", &Console::Error),
            });

        Napi::Object console = func.New({Napi::External<Polyfills::Console::CallbackT>::New(env, new Polyfills::Console::CallbackT(std::move(callback)))});
        env.Global().Set(JS_INSTANCE_NAME, console);
    }

    Console::Console(const Napi::CallbackInfo& info)
        : ParentT{info}
        , m_callback{*info[0].As<Napi::External<Polyfills::Console::CallbackT>>().Data()}
    {
    }

    void Console::Log(const Napi::CallbackInfo& info)
    {
        InvokeCallback(info, Polyfills::Console::LogLevel::Log);
    }

    void Console::Warn(const Napi::CallbackInfo& info)
    {
        InvokeCallback(info, Polyfills::Console::LogLevel::Warn);
    }

    void Console::Error(const Napi::CallbackInfo& info)
    {
        InvokeCallback(info, Polyfills::Console::LogLevel::Error);
    }

    void Console::InvokeCallback(const Napi::CallbackInfo& info, Polyfills::Console::LogLevel logLevel) const
    {
        std::stringstream ss{};
        for (unsigned int index = 0; index < info.Length(); index++)
        {
            if (index > 0)
            {
                ss << " ";
            }
            ss << info[index].ToString().Utf8Value().c_str();
        }
        ss << std::endl;
        m_callback(ss.str().c_str(), logLevel);
    }
    
    namespace Polyfills::Console
    {
        void Initialize(Napi::Env env, CallbackT callback)
        {
            Babylon::Console::CreateInstance(env, std::move(callback));
        }
    }
}
