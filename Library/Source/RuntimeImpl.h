#pragma once

#include "Common.h"
#include <Babylon/Runtime.h>
#include <arcana/threading/dispatcher.h>
#include <arcana/threading/task.h>

namespace Napi
{
    class Env;
}

namespace Babylon
{
    class Env;
    class NativeWindow;

    class RuntimeImpl final
    {
    public:
        static RuntimeImpl& GetRuntimeImplFromJavaScript(Napi::Env);
        static NativeWindow& GetNativeWindowFromJavaScript(Napi::Env);

        RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl);
        virtual ~RuntimeImpl();

        void UpdateSize(float width, float height);
        void Suspend();
        void Resume();
        void LoadScript(const std::string& url);
        void Eval(const std::string& string, const std::string& sourceUrl);
        void Dispatch(std::function<void(Env&)> callback);
        const std::string& RootUrl() const;

        std::string GetAbsoluteUrl(const std::string& url);
        template<typename T>
        arcana::task<T, std::exception_ptr> LoadUrlAsync(const std::string& url);

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
        void InitializeJavaScriptVariables();
        void BaseThreadProcedure();
        void ThreadProcedure();

        using DispatcherT = arcana::manual_dispatcher<babylon_dispatcher::work_size>;
        std::unique_ptr<DispatcherT> m_dispatcher{};
        arcana::cancellation_source m_cancelSource{};
        std::mutex m_taskMutex;
        std::mutex m_suspendMutex;
        // when asking for suspension, we need to ensure no rendering is on going.
        // This mutex is used to be sure no rendering is happening after Suspend method returns.
        std::mutex m_blockTickingMutex;
        std::condition_variable m_suspendVariable;
        bool m_suspended{false};

        void* m_nativeWindowPtr{};

        std::thread m_thread{};

        // This env is technically owned by the thread on which it runs, and so
        // the actually object is maintained as a local variable within the
        // method which represents that thread.  However, external calls
        // occasionally need access to the env as well; m_env provides this
        // access when the env is available, reverting to nullptr once the env
        // is destroyed.
        Babylon::Env* m_env{};
        const std::string m_rootUrl{};
    };
}
