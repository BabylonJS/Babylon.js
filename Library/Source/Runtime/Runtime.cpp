#include "Runtime.h"

#include "RuntimeImpl.h"
#include <ScriptHost/ScriptHost.h>

namespace babylon
{
    Runtime::Runtime(std::unique_ptr<RuntimeImpl> impl)
        : m_impl{ std::move(impl) }
    {}

    Runtime::~Runtime()
    {}

    void Runtime::UpdateSize(float width, float height)
    {
        m_impl->UpdateSize(width, height);
    }

    void Runtime::UpdateRenderTarget()
    {
        m_impl->UpdateRenderTarget();
    }

    void Runtime::Suspend()
    {
        m_impl->Suspend();
    }

    void Runtime::RunScript(const std::string& url)
    {
        m_impl->RunScript(url);
    }

    void Runtime::RunScript(const std::string& script, const std::string& url)
    {
        m_impl->RunScript(script, url);
    }

    void Runtime::Execute(std::function<void(Runtime&)> func)
    {
        m_impl->Execute([this, func = std::move(func)](auto&)
        {
            func(*this);
        });
    }

    Napi::Env& Runtime::Env() const
    {
        return m_impl->ScriptHost().Env();
    }

    const std::string& Runtime::RootUrl() const
    {
        return m_impl->RootUrl();
    }
}
