#include <Babylon/Runtime.h>
#include "RuntimeImpl.h"

namespace Babylon
{
    Runtime::Runtime(std::unique_ptr<RuntimeImpl> impl)
        : m_impl{ std::move(impl) }
    {
    }

    Runtime::~Runtime()
    {
    }

    void Runtime::UpdateSize(float width, float height)
    {
        m_impl->UpdateSize(width, height);
    }

    void Runtime::Suspend()
    {
        m_impl->Suspend();
    }

    void Runtime::Resume()
    {
        m_impl->Resume();
    }

    void Runtime::LoadScript(const std::string& url)
    {
        m_impl->LoadScript(url);
    }

    void Runtime::Eval(const std::string& string, const std::string& url)
    {
        m_impl->Eval(string, url);
    }

    void Runtime::Dispatch(std::function<void(Env&)> func)
    {
        m_impl->Dispatch(func);
    }

    const std::string& Runtime::RootUrl() const
    {
        return m_impl->RootUrl();
    }
}
