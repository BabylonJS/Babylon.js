#pragma once

#include <napi/env.h>

#include <functional>
#include <sstream>

namespace Babylon
{
    class Console final : public Napi::ObjectWrap<Console>
    {
    public:
        static inline constexpr char* JS_INSTANCE_NAME{"console"};

        /**
         * Importance level of messages sent via logging callbacks.
         */
        enum class LogLevel
        {
            Log,
            Warn,
            Error,
        };

        using ParentT = Napi::ObjectWrap<Console>;
        using CallbackT = std::function<void(const char*, LogLevel)>;

        static void CreateInstance(Napi::Env env, CallbackT callback)
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

        explicit Console(const Napi::CallbackInfo& info)
            : ParentT{info}
            , m_callback{*info[0].As<Napi::External<CallbackT>>().Data()}
        {
        }

    private:
        void Log(const Napi::CallbackInfo& info)
        {
            // TODO: Log output to ETW/telemetry rather than debugger output.
            // TODO: Handle version of this method that takes a format string as the first parameter.
            SendToOutputs(info, LogLevel::Log);
        }

        void Warn(const Napi::CallbackInfo& info)
        {
            SendToOutputs(info, LogLevel::Warn);
        }

        void Error(const Napi::CallbackInfo& info)
        {
            SendToOutputs(info, LogLevel::Error);
        }

        void SendToOutputs(const Napi::CallbackInfo& info, LogLevel logLevel) const
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

        CallbackT m_callback{};
    };
}
