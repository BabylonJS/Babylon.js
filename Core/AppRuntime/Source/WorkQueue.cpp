#include "WorkQueue.h"

namespace Babylon
{
    WorkQueue::WorkQueue(std::function<void()> threadProcedure)
        : m_thread{std::move(threadProcedure)}
    {
    }

    WorkQueue::~WorkQueue()
    {
        if (m_suspended)
        {
            Resume();
        }

        m_cancelSource.cancel();
        m_dispatcher.cancelled();

        m_thread.join();
    }

    void WorkQueue::Append(std::function<void(Napi::Env)> callable)
    {
        std::scoped_lock lock{m_appendMutex};
        m_task = m_task.then(m_dispatcher, m_cancelSource, [this, callable = std::move(callable)] {
            callable(m_env.value());
        });
    }

    void WorkQueue::Suspend()
    {
        // Lock m_blockingTickMutex as well as m_suspendMutex to ensure we do not
        // accidentally suspend in the middle of a blocking tick.
        std::scoped_lock<std::mutex> lockTicking(m_blockingTickMutex);
        std::scoped_lock<std::mutex> lockSuspension(m_suspendMutex);
        m_suspended = true;
        m_suspendConditionVariable.notify_one();
    }

    void WorkQueue::Resume()
    {
        std::scoped_lock<std::mutex> lock(m_suspendMutex);
        m_suspended = false;
        m_suspendConditionVariable.notify_one();
    }

    void WorkQueue::Run(Napi::Env env)
    {
        m_env = std::make_optional(env);
        m_dispatcher.set_affinity(std::this_thread::get_id());

        while (!m_cancelSource.cancelled())
        {
            {
                std::unique_lock<std::mutex> lock{m_suspendMutex};
                m_suspendConditionVariable.wait(lock, [this]() { return !m_suspended; });
            }
            {
                std::scoped_lock<std::mutex> lock{m_blockingTickMutex};
                m_dispatcher.blocking_tick(m_cancelSource);
            }
        }

        m_dispatcher.clear();
        m_task = arcana::task_from_result<std::exception_ptr>();
    }
}
