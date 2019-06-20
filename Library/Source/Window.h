#pragma once

#include <napi/napi.h>
#include <chrono>

namespace babylon
{
    class RuntimeImpl;

    class Window final
    {
    public:
        Window(RuntimeImpl& runtime);

    private:
        static void SetTimeout(const Napi::CallbackInfo& info);
        static Napi::Value DecodeBase64(const Napi::CallbackInfo& info);

        void RecursiveWaitOrCall(std::shared_ptr<Napi::FunctionReference>, std::chrono::system_clock::time_point);

        RuntimeImpl& m_runtimeImpl;
    };
}
