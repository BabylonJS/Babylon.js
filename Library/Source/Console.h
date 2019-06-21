#pragma once

#include <napi/napi.h>

namespace babylon
{
    class Console final : public Napi::ObjectWrap<Console>
    {
    public:
        static void Initialize(Napi::Env env);

        explicit Console(const Napi::CallbackInfo& info);

    private:
        void Log(const Napi::CallbackInfo& info);
        void Warn(const Napi::CallbackInfo& info);
        void Error(const Napi::CallbackInfo& info);
    };
}
