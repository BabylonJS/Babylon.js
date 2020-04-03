#pragma once

#include <Babylon/Polyfills/Console.h>

namespace Babylon
{
    class Console final : public Napi::ObjectWrap<Console>
    {
    public:
        static inline constexpr char* JS_INSTANCE_NAME{"console"};

        using ParentT = Napi::ObjectWrap<Console>;

        static void CreateInstance(Napi::Env env, Polyfills::Console::CallbackT callback);

        explicit Console(const Napi::CallbackInfo& info);

    private:
        void Log(const Napi::CallbackInfo& info);
        void Warn(const Napi::CallbackInfo& info);
        void Error(const Napi::CallbackInfo& info);
        void InvokeCallback(const Napi::CallbackInfo& info, Polyfills::Console::LogLevel logLevel) const;

        Polyfills::Console::CallbackT m_callback{};
    };
}
