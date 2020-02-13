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
    class NativeWindow;

    class RuntimeImpl final
    {
    public:
        RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl);
        virtual ~RuntimeImpl();

        void UpdateSize(float width, float height);
        void UpdateWindow(float width, float height, void* nativeWindowPtr);
        void Suspend();
        void Resume();
        void LoadScript(const std::string& url);
        void Eval(const std::string& string, const std::string& sourceUrl);
        void Dispatch(std::function<void(Napi::Env)> callback);
        const std::string& RootUrl() const;

    private:
        void InitializeJavaScriptVariables(Napi::Env);
        void RunJavaScript(Napi::Env);
        void BaseThreadProcedure();
        void ThreadProcedure();

        arcana::task<void, std::exception_ptr> m_task = arcana::task_from_result<std::exception_ptr>();
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
        Napi::Env* m_env{};
        const std::string m_rootUrl{};
    };
}
