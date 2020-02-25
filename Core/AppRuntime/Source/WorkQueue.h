#pragma once

#include "Common.h"

#include <arcana/threading/task.h>
#include <napi/env.h>

namespace Babylon
{
    class WorkQueue
    {
    public:
        WorkQueue(std::function<void()> threadProcedure);
        ~WorkQueue();

        void Append(std::function<void(Napi::Env)>);
        void Suspend();
        void Resume();
        void Run(Napi::Env);

    private:
        std::optional<Napi::Env> m_env{};

        std::mutex m_appendMutex{};
        std::mutex m_blockingTickMutex{};
        std::mutex m_suspendMutex{};
        std::condition_variable m_suspendConditionVariable{};
        bool m_suspended{false};

        arcana::cancellation_source m_cancelSource{};
        arcana::task<void, std::exception_ptr> m_task = arcana::task_from_result<std::exception_ptr>();
        arcana::manual_dispatcher<babylon_dispatcher::work_size> m_dispatcher{};

        std::thread m_thread;
    };
}
