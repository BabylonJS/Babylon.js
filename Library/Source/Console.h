#pragma once

#include <napi/napi.h>
#include <Babylon/Runtime.h>

namespace babylon
{
    class Console final : public Napi::ObjectWrap<Console>
    {
    public:
        static Napi::ObjectReference Create(Napi::Env env, LogCallback& callback);
        
        explicit Console(const Napi::CallbackInfo& info);

    private:
        void Log(const Napi::CallbackInfo& info);
        void Warn(const Napi::CallbackInfo& info);
        void Error(const Napi::CallbackInfo& info);

        void SendToOutputs(const Napi::CallbackInfo&, LogLevel) const;

        const LogCallback& m_callback;
    };
}
