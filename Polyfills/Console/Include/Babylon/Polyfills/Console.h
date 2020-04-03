#pragma once

#include <napi/env.h>

namespace Babylon::Polyfills::Console
{
    /**
     * Importance level of messages sent via logging callbacks.
     */
    enum class LogLevel
    {
        Log,
        Warn,
        Error,
    };

    using CallbackT = std::function<void(const char*, LogLevel)>;

    void Initialize(Napi::Env env, CallbackT callback);
}
