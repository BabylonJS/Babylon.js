#include "Console.h"
#include <Windows.h>

namespace babylon
{
    void Console::Initialize(Napi::Env env)
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

        env.Global().Set("console", func.New({}));
    }

    Console::Console(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<Console>{ info }
    {
    }

    void Console::Log(const Napi::CallbackInfo& info)
    {
        // TODO: Log output to ETW/telemetry rather than debugger output.
        // TODO: Handle version of this method that takes a format string as the first parameter.

        for (unsigned int index = 0; index < info.Length(); index++)
        {
            if (index > 0)
            {
                OutputDebugStringA(" ");
            }
            OutputDebugStringA(info[index].ToString().Utf8Value().c_str());
        }
        OutputDebugStringA("\r\n");
    }

    void Console::Warn(const Napi::CallbackInfo& info)
    {
        // TODO
        Log(info);
    }

    void Console::Error(const Napi::CallbackInfo& info)
    {
        // TODO
        Log(info);
    }
}
