#pragma once

#include <napi/env.h>

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

        static void CreateInstance(Napi::Env env, CallbackT callback);

        explicit Console(const Napi::CallbackInfo& info);

    private:
        void Log(const Napi::CallbackInfo& info);
        void Warn(const Napi::CallbackInfo& info);
        void Error(const Napi::CallbackInfo& info);
        void InvokeCallback(const Napi::CallbackInfo& info, LogLevel logLevel) const;

        CallbackT m_callback{};
    };
}
