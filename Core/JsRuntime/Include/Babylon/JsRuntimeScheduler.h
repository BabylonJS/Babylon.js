#pragma once

#include "JsRuntime.h"

namespace Babylon
{
    /**
     * Scheduler that invokes continuations via JsRuntime::Dispatch.
     * Intended to be consumed by arcana.cpp tasks.
     */
    class JsRuntimeScheduler
    {
    public:
        explicit JsRuntimeScheduler(JsRuntime& runtime)
            : m_runtime{runtime}
        {
        }

        template<typename CallableT>
        void operator()(CallableT&& callable) const
        {
            m_runtime.Dispatch([callable{std::forward<CallableT>(callable)}](Napi::Env){
                callable();
            });
        }

    private:
        JsRuntime& m_runtime;
    };
}
