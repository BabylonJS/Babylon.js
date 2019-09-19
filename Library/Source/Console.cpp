#include "Console.h"

namespace babylon
{
    std::vector<MessageLogger> Console::m_logOutputs;
    std::vector<MessageLogger> Console::m_warnOutputs;
    std::vector<MessageLogger> Console::m_errorOutputs;

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


    void Console::SendToOutputs(const Napi::CallbackInfo& info, std::vector<MessageLogger>& outputs)
    {
        for (size_t i = 0; i < outputs.size(); i++)
        {
            auto& output = outputs[i];
            for (unsigned int index = 0; index < info.Length(); index++)
            {
                if (index > 0)
                {
                    output(" ");
                }
                output(info[index].ToString().Utf8Value().c_str());
            }
            output("\r\n");
        }
    }

    void Console::Log(const Napi::CallbackInfo& info)
    {
        // TODO: Log output to ETW/telemetry rather than debugger output.
        // TODO: Handle version of this method that takes a format string as the first parameter.
        SendToOutputs(info, m_logOutputs);
    }

    void Console::Warn(const Napi::CallbackInfo& info)
    {
        SendToOutputs(info, m_warnOutputs);
    }

    void Console::Error(const Napi::CallbackInfo& info)
    {
        SendToOutputs(info, m_errorOutputs);
    }

    void Console::RegisterLogOutput(MessageLogger output)
    {
        m_logOutputs.push_back(output);
    }

    void Console::RegisterWarnOutput(MessageLogger output)
    {
        m_warnOutputs.push_back(output);
    }

    void Console::RegisterErrorOutput(MessageLogger output)
    {
        m_errorOutputs.push_back(output);
    }

}
