#pragma once

#include "Common.h"

#include <Napi/napi.h>

#include <arcana/threading/dispatcher.h>
#include <arcana/threading/task.h>

namespace babylon
{
    class BgfxEngine;
    class ScriptHost;

    class RuntimeImpl
    {
    public:
        using GraphicsEngine = BgfxEngine;

        RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl, std::function<void()> threadProcedure);
        RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl);
        virtual ~RuntimeImpl();

        void UpdateSize(float width, float height);
        void UpdateRenderTarget();
        void Suspend();

        virtual void RunScript(const std::string& url) = 0;
        virtual void RunScript(const std::string& script, const std::string& url) = 0;

        void Execute(std::function<void(RuntimeImpl&)>);

        ScriptHost& ScriptHost();
        const std::string& RootUrl() const;
        arcana::manual_dispatcher<babylon_dispatcher::work_size>& Dispatcher();
        arcana::cancellation& Cancellation();

        // TODO: Reduce exposure of Task and mutex once we decide on an effective alternative.
        /// Appending to the task chain is NOT thread-safe.  Before setting the RuntimeImpl's Task
        /// to a new value, AcquireTaskLock MUST be called.  Correct usage is something like the
        /// following:
        ///
        ///     auto lock = runtimeImpl.AcquireTaskLock();
        ///     runtimeImpl.Task = runtimeImpl.Task.then(...);
        ///
        arcana::task<void, std::exception_ptr> Task = arcana::task_from_result<std::exception_ptr>();
        std::scoped_lock<std::mutex> AcquireTaskLock();

    protected:
        void DefaultThreadProcedure();
        void RunScriptWithNapi(const std::string& script, const std::string& url);

    private:
        arcana::manual_dispatcher<babylon_dispatcher::work_size> m_dispatcher{};
        arcana::cancellation_source m_cancelSource{};
        std::mutex m_taskMutex{};

        std::unique_ptr<GraphicsEngine> m_engine{};

        std::thread m_thread{};

        // The script host is technically owned by the thread on which it runs, and so
        // the actually object is maintained as a local variable within the method which
        // represents that thread.  However, external calls occasionally need access to
        // the script host as well; m_host provides this access when the script host is
        // available, reverting to nullptr once the script host is destroyed.
        babylon::ScriptHost* m_scriptHost{};
        const std::string m_rootUrl{};
    };
}
