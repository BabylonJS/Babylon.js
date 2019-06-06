#pragma once

#include <Runtime/Runtime.h>
#include <napi/napi.h>
#include <memory>
#include <gsl/gsl>

namespace babylon
{
    class ScriptHost final
    {
    public:
        explicit ScriptHost(RuntimeImpl&);
        ScriptHost(const ScriptHost&) = delete;
        ~ScriptHost();

        void RunScript(gsl::czstring<> script, gsl::czstring<> url);

        Napi::Env& Env();

    private:
        class Impl;
        std::unique_ptr<Impl> m_impl;
    };
}
