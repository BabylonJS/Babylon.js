#pragma once

#include "Common.h"
#include <Babylon/Runtime.h>
#include <arcana/threading/dispatcher.h>
#include <arcana/threading/task.h>

namespace babylon
{
    class Env;
    class NativeEngine;

    class RuntimeImpl
    {
    public:
        RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl);
        virtual ~RuntimeImpl();

        void UpdateSize(float width, float height);
        void UpdateRenderTarget();
        void Suspend();
        void Resume();

        std::string GetAbsoluteUrl(const std::string& url);
        template<typename T> arcana::task<T, std::exception_ptr> LoadUrlAsync(const std::string& url);

        void LoadScript(const std::string& url);
        void Eval(const std::string& string, const std::string& url);

        void Execute(std::function<void(RuntimeImpl&)>);

        babylon::Env& Env();
        const std::string& RootUrl() const;
        arcana::manual_dispatcher<babylon_dispatcher::work_size>& Dispatcher();
        arcana::cancellation& Cancellation();

        // TODO: Reduce exposure of Task and mutex once we decide on an effective alternative.
        // Appending to the task chain is NOT thread-safe.  Before setting the RuntimeImpl's Task
        // to a new value, AcquireTaskLock MUST be called.  Correct usage is something like the
        // following:
        //
        //     auto lock = RuntimeImpl.AcquireTaskLock();
        //     RuntimeImpl.Task = RuntimeImpl.Task.then(...);
        //
        arcana::task<void, std::exception_ptr> Task = arcana::task_from_result<std::exception_ptr>();
        std::scoped_lock<std::mutex> AcquireTaskLock();

    private:
        void BaseThreadProcedure();
        void ThreadProcedure();

        arcana::manual_dispatcher<babylon_dispatcher::work_size> m_dispatcher{};
        arcana::cancellation_source m_cancelSource{};
        std::mutex m_taskMutex;
        std::mutex m_suspendMutex;
        std::condition_variable m_suspendVariable;
        bool m_suspended{ false };

        std::unique_ptr<NativeEngine> m_engine{};

        std::thread m_thread{};

        // This env is technically owned by the thread on which it runs, and so
        // the actually object is maintained as a local variable within the
        // method which represents that thread.  However, external calls
        // occasionally need access to the env as well; m_env provides this
        // access when the env is available, reverting to nullptr once the env
        // is destroyed.
        babylon::Env* m_env{};
        const std::string m_rootUrl{};
    };
}
    
