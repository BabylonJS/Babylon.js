#include "RuntimeImpl.h"

#include <Engine/BgfxEngine.h>
#include <ScriptHost/Console.h>
#include <ScriptHost/ScriptHost.h>
#include <ScriptHost/Window.h>
#include <ScriptHost/XMLHttpRequest.h>

namespace babylon
{
    RuntimeImpl::RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl, std::function<void()> threadProcedure)
        : m_engine{ std::make_unique<GraphicsEngine>(nativeWindowPtr, *this) }
        , m_thread{ [threadProcedure = std::move(threadProcedure)] { threadProcedure(); } }
        , m_rootUrl{ rootUrl }
    {}

    RuntimeImpl::RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl)
        : RuntimeImpl{ nativeWindowPtr, rootUrl, [this] { DefaultThreadProcedure(); } }
    {}

    RuntimeImpl::~RuntimeImpl()
    {
        m_cancelSource.cancel();
        m_thread.join();
    }

    void RuntimeImpl::UpdateSize(float width, float height)
    {
        m_dispatcher.queue([width, height, this] { m_engine->UpdateSize(width, height); });
    }

    void RuntimeImpl::UpdateRenderTarget()
    {
        m_dispatcher.queue([this] { m_engine->UpdateRenderTarget(); });
    }

    void RuntimeImpl::Suspend()
    {
        m_engine->Suspend();
    }

    void RuntimeImpl::Execute(std::function<void(RuntimeImpl&)> func)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(m_dispatcher, m_cancelSource, [func = std::move(func), this]()
        {
            func(*this);
        });
    }

    ScriptHost& RuntimeImpl::ScriptHost()
    {
        return *this->m_scriptHost;
    }

    const std::string& RuntimeImpl::RootUrl() const
    {
        return m_rootUrl;
    }

    arcana::manual_dispatcher<babylon_dispatcher::work_size>& RuntimeImpl::Dispatcher()
    {
        return m_dispatcher;
    }

    arcana::cancellation& RuntimeImpl::Cancellation()
    {
        return m_cancelSource;
    }

    std::scoped_lock<std::mutex> RuntimeImpl::AcquireTaskLock()
    {
        return std::scoped_lock{ m_taskMutex };
    }

    void RuntimeImpl::DefaultThreadProcedure()
    {
        m_dispatcher.set_affinity(std::this_thread::get_id());

        babylon::ScriptHost host{ *this };
        m_scriptHost = &host;
        auto hostScopeGuard = gsl::finally([this] { m_scriptHost = nullptr; });

        Console::Initialize(m_scriptHost->Env());

        XMLHttpRequest::Initialize(m_scriptHost->Env(), *this);

        Window window{ *this };

        m_engine->Initialize(host.Env());

        // TODO: Handle device lost/restored.

        while (!m_cancelSource.cancelled())
        {
            m_dispatcher.blocking_tick(m_cancelSource);
        }
    }

    void RuntimeImpl::RunScriptWithNapi(const std::string& script, const std::string& url)
    {
        auto& env = ScriptHost().Env();
        auto scriptString = Napi::String::New(env, script);
        napi_value result;
        napi_run_script(env, scriptString, url.c_str(), &result); // TODO throw error if failed? Probably should move this functionality into napi
    }
}
