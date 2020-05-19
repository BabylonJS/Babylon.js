#include <AndroidExtensions/Globals.h>
#include <stdexcept>

namespace android::global
{
    namespace
    {
        JavaVM* g_javaVM{};
        jobject g_appContext{};
        jobject g_currentActivity{};

        thread_local struct Env final
        {
            ~Env()
            {
                if (m_attached)
                {
                    g_javaVM->DetachCurrentThread();
                }
            }

            bool m_attached{};
        } g_env{};

        template<typename ... Args>
        class Event final
        {
        public:
            using Handler = std::function<void(Args ...)>;
            using Ticket = typename arcana::ticketed_collection<Handler>::ticket;
            Ticket AddHandler(Handler&& handler)
            {
                std::lock_guard<std::recursive_mutex> guard{m_mutex};
                return m_handlers.insert(handler, m_mutex);
            }

            void Fire(Args ... args)
            {
                std::lock_guard<std::recursive_mutex> guard{m_mutex};
                for (auto& handler : m_handlers)
                {
                    handler(args ...);
                }
            }

        private:
            std::recursive_mutex m_mutex{};
            arcana::ticketed_collection<Handler, std::recursive_mutex> m_handlers{};
        };

        using AppStateChangedEvent = Event<>;
        AppStateChangedEvent g_pauseEvent{};
        AppStateChangedEvent g_resumeEvent{};

        using RequestPermissionsResultEvent = Event<int32_t, const std::vector<std::string>&, const std::vector<int32_t>&>;
        RequestPermissionsResultEvent g_requestPermissionsResultEvent{};
    }

    void Initialize(JavaVM* javaVM, jobject context)
    {
        g_javaVM = javaVM;
        g_appContext = GetEnvForCurrentThread()->NewGlobalRef(android::content::Context{context}.getApplicationContext());
    }

    JNIEnv* GetEnvForCurrentThread()
    {
        JNIEnv* env{};

        if (g_javaVM->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) == JNI_EDETACHED)
        {
            if (g_javaVM->AttachCurrentThread(&env, nullptr) != 0) {
                throw std::runtime_error("Failed to attach JavaScript thread to Java VM");
            }

            g_env.m_attached = true;
        }

        return env;
    }

    android::content::Context GetAppContext()
    {
        return {g_appContext};
    }

    android::app::Activity GetCurrentActivity()
    {
        return {g_currentActivity};
    }

    void SetCurrentActivity(jobject currentActivity)
    {
        if (g_currentActivity)
        {
            GetEnvForCurrentThread()->DeleteGlobalRef(g_currentActivity);
        }

        g_currentActivity = GetEnvForCurrentThread()->NewGlobalRef(currentActivity);
    }

    void Pause()
    {
        g_pauseEvent.Fire();
    }

    AppStateChangedEvent::Ticket AddPauseCallback(AppStateChangedEvent::Handler&& onPause)
    {
        return g_pauseEvent.AddHandler(std::move(onPause));
    }

    void Resume()
    {
        g_resumeEvent.Fire();
    }

    AppStateChangedEvent::Ticket AddResumeCallback(AppStateChangedEvent::Handler&& onResume)
    {
        return g_resumeEvent.AddHandler(std::move(onResume));
    }

    void RequestPermissionsResult(int32_t requestCode, const std::vector<std::string>& permissions, const std::vector<int32_t>& grantResults)
    {
        g_requestPermissionsResultEvent.Fire(requestCode, permissions, grantResults);
    }

    RequestPermissionsResultEvent::Ticket AddRequestPermissionsResultCallback(RequestPermissionsResultEvent::Handler&& onAddRequestPermissionsResult)
    {
        return g_requestPermissionsResultEvent.AddHandler(std::move(onAddRequestPermissionsResult));
    }
}
