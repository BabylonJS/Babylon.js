#include "RuntimeImpl.h"

#include "NativeEngine.h"
#include "NativeWindow.h"
#include "NetworkUtils.h"
#include "XMLHttpRequest.h"

#include <napi/env.h>
#include <sstream>

namespace Babylon
{
    RuntimeImpl::RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl)
        : m_dispatcher{std::make_unique<DispatcherT>()}
        , m_nativeWindowPtr{nativeWindowPtr}
        , m_thread{[this] { ThreadProcedure(); }}
        , m_rootUrl{rootUrl}
    {
    }

    RuntimeImpl::~RuntimeImpl()
    {
        if (m_suspended)
        {
            Resume();
        }
        m_cancelSource.cancel();
        m_thread.join();
    }

    void RuntimeImpl::UpdateSize(float width, float height)
    {
        Dispatch([width, height](Napi::Env env)
        {
            auto& window = NativeWindow::GetFromJavaScript(env);
            window.Resize(static_cast<size_t>(width), static_cast<size_t>(height));
        });
    }

    void RuntimeImpl::UpdateWindow(float width, float height, void* nativeWindowPtr)
    {
        m_dispatcher->queue([width, height, nativeWindowPtr, this]
        {
            bgfx::PlatformData pd;
            pd.ndt          = NULL;
            pd.nwh          = nativeWindowPtr;
            pd.context      = NULL;
            pd.backBuffer   = NULL;
            pd.backBufferDS = NULL;
            bgfx::setPlatformData(pd);
            bgfx::reset(width, height);
            auto& window = NativeWindow::GetFromJavaScript(*m_env);
            window.Resize(static_cast<size_t>(width), static_cast<size_t>(height));
        });
    }

    void RuntimeImpl::Suspend()
    {
        std::unique_lock<std::mutex> lockSuspension(m_suspendMutex);
        // Lock block ticking so no rendering will happen once we exit Suspend method
        std::unique_lock<std::mutex> lockTicking(m_blockTickingMutex);
        m_suspended = true;
        m_suspendVariable.notify_one();
    }

    void RuntimeImpl::Resume()
    {
        std::unique_lock<std::mutex> lock(m_suspendMutex);
        m_suspended = false;
        m_suspendVariable.notify_one();
    }

    void RuntimeImpl::LoadScript(const std::string& url)
    {
        std::scoped_lock lock{m_taskMutex};
        auto absoluteUrl = GetAbsoluteUrl(url, m_rootUrl);
        auto loadUrlTask = LoadTextAsync(std::move(absoluteUrl));
        auto whenAllTask = arcana::when_all(loadUrlTask, m_task);
        m_task = whenAllTask.then(*m_dispatcher, m_cancelSource, [this, url](const std::tuple<std::string, arcana::void_placeholder>& args) {
            Napi::Eval(*m_env, std::get<0>(args).data(), url.data());
        });
    }

    void RuntimeImpl::Eval(const std::string& string, const std::string& sourceUrl)
    {
        std::scoped_lock lock{m_taskMutex};
        m_task = m_task.then(*m_dispatcher, m_cancelSource, [this, string, sourceUrl]() {
            Napi::Eval(*m_env, string.data(), sourceUrl.data());
        });
    }

    void RuntimeImpl::Dispatch(std::function<void(Napi::Env)> func)
    {
        std::scoped_lock lock{m_taskMutex};
        m_task = m_task.then(*m_dispatcher, m_cancelSource, [func = std::move(func), this]() {
            func(*m_env);
        });
    }

    const std::string& RuntimeImpl::RootUrl() const
    {
        return m_rootUrl;
    }

    void RuntimeImpl::InitializeJavaScriptVariables(Napi::Env env)
    {
        JsRuntime::Initialize(env, [this](std::function<void(Napi::Env)> func){ Dispatch(std::move(func)); });
        NativeWindow::Initialize(env, m_nativeWindowPtr, 32, 32);
        NativeEngine::Initialize(env);
        XMLHttpRequest::Initialize(env, m_rootUrl.c_str());
    }

    void RuntimeImpl::RunJavaScript(Napi::Env env)
    {
        m_dispatcher->set_affinity(std::this_thread::get_id());

        m_env = &env;
        auto envScopeGuard = gsl::finally([this, env]
        {
            // Because the dispatcher and task may take references to the N-API environment,
            // they must be cleared before the env itself is destroyed.
            m_dispatcher.reset();
            m_task = arcana::task_from_result<std::exception_ptr>();

            m_env = nullptr;
        });

        InitializeJavaScriptVariables(env);

        // TODO: Handle device lost/restored.

        while (!m_cancelSource.cancelled())
        {
            // check if suspended
            {
                std::unique_lock<std::mutex> lock(m_suspendMutex);
                m_suspendVariable.wait(lock, [this]() { return !m_suspended; });
            }
            {
                std::unique_lock<std::mutex> lock(m_blockTickingMutex);
                m_dispatcher->blocking_tick(m_cancelSource);
            }
        }
    }
}
