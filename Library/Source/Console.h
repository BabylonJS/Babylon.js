#pragma once

#include <napi/napi.h>
#include <Babylon/Runtime.h>

namespace babylon
{
    class Console final : public Napi::ObjectWrap<Console>
    {
    public:
        static void Initialize(Napi::Env env);
        
        explicit Console(const Napi::CallbackInfo& info);

        static void RegisterLogOutput(MessageLogger output);
        static void RegisterWarnOutput(MessageLogger output);
        static void RegisterErrorOutput(MessageLogger output);

    private:
        void Log(const Napi::CallbackInfo& info);
        void Warn(const Napi::CallbackInfo& info);
        void Error(const Napi::CallbackInfo& info);

        static std::vector<MessageLogger> m_logOutputs;
        static std::vector<MessageLogger> m_warnOutputs;
        static std::vector<MessageLogger> m_errorOutputs;

        void SendToOutputs(const Napi::CallbackInfo& info, std::vector<MessageLogger>& outputs);
    };
}
