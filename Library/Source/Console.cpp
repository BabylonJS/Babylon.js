#include "Console.h"

#include <sstream>

namespace Babylon
{
    Napi::ObjectReference Console::Create(Napi::Env env, LogCallback& callback)
    {
        Napi::HandleScope scope{ env };

        Napi::Function func = DefineClass(
            env,
            "Console",
            {
                InstanceMethod("log", &Console::Log),
                InstanceMethod("warn", &Console::Warn),
                InstanceMethod("error", &Console::Error),
            });

        return Napi::Persistent(func.New({ Napi::External<LogCallback>::New(env, &callback) }));
    }

    Console::Console(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<Console>{ info }
        , m_callback{ *info[0].As<Napi::External<LogCallback>>().Data() }
    {}

    void Console::SendToOutputs(const Napi::CallbackInfo& info, LogLevel logLevel) const
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

    void Console::Log(const Napi::CallbackInfo& info)
    {
        // TODO: Log output to ETW/telemetry rather than debugger output.
        // TODO: Handle version of this method that takes a format string as the first parameter.
        SendToOutputs(info, LogLevel::Log);
    }

    void Console::Warn(const Napi::CallbackInfo& info)
    {
        SendToOutputs(info, LogLevel::Warn);
    }

    void Console::Error(const Napi::CallbackInfo& info)
    {
        SendToOutputs(info, LogLevel::Error);
    }
}
