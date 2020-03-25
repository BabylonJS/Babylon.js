#include <Babylon/Console.h>
#include <functional>
#include <sstream>

namespace Babylon
{
    void Console::CreateInstance(Napi::Env env, CallbackT callback)
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

        Napi::Object console = func.New({Napi::External<CallbackT>::New(env, new CallbackT(std::move(callback)))});
        env.Global().Set(JS_INSTANCE_NAME, console);
    }

    Console::Console(const Napi::CallbackInfo& info)
        : ParentT{info}
        , m_callback{*info[0].As<Napi::External<CallbackT>>().Data()}
    {
    }

    void Console::Log(const Napi::CallbackInfo& info)
    {
        InvokeCallback(info, LogLevel::Log);
    }

    void Console::Warn(const Napi::CallbackInfo& info)
    {
        InvokeCallback(info, LogLevel::Warn);
    }

    void Console::Error(const Napi::CallbackInfo& info)
    {
        InvokeCallback(info, LogLevel::Error);
    }

    void Console::InvokeCallback(const Napi::CallbackInfo& info, LogLevel logLevel) const
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
}
