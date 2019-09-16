#include "RuntimeImpl.h"
#include "NativeEngine.h"
#include "Console.h"
#include "Window.h"
#include "XMLHttpRequest.h"
#include <curl/curl.h>
#include <napi/env.h>
#include <sstream>

namespace babylon
{
    RuntimeImpl::RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl)
        : m_engine{ std::make_unique<NativeEngine>(nativeWindowPtr, *this) }
        , m_thread{ [this] { ThreadProcedure(); } }
        , m_rootUrl{ rootUrl }
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
        m_dispatcher.queue([width, height, this] { m_engine->UpdateSize(width, height); });
    }

    void RuntimeImpl::UpdateRenderTarget()
    {
        m_dispatcher.queue([this] { m_engine->UpdateRenderTarget(); });
    }

    void RuntimeImpl::Suspend()
    {
        std::unique_lock<std::mutex> lock(m_suspendMutex);
        m_suspended = true;
        m_suspendVariable.notify_one();
    }

    void RuntimeImpl::Resume()
    {
        std::unique_lock<std::mutex> lock(m_suspendMutex);
        m_suspended = false;
        m_suspendVariable.notify_one();
    }

    std::string RuntimeImpl::GetAbsoluteUrl(const std::string& url)
    {
        auto curl = curl_url();

        auto code = curl_url_set(curl, CURLUPART_URL, url.c_str(), 0);

        // If input could not be turned into a valid URL, try using it as a regular URL.
        if (code == CURLUE_MALFORMED_INPUT)
        {
            std::stringstream ss;
            ss << m_rootUrl << "/" << url;
            code = curl_url_set(curl, CURLUPART_URL, ss.str().c_str(), 0);
        }

        if (code != CURLUE_OK)
        {
            throw std::exception{ };
        }

        char* buf;
        code = curl_url_get(curl, CURLUPART_URL, &buf, 0);

        if (code != CURLUE_OK)
        {
            throw std::exception{ };
        }

        std::string absoluteUrl{ buf };

        curl_free(buf);
        curl_url_cleanup(curl);

        return absoluteUrl;
    }

    template<typename T> arcana::task<T, std::exception_ptr> RuntimeImpl::LoadUrlAsync(const std::string& url)
    {
        return arcana::make_task(m_dispatcher, m_cancelSource, [url]()
        {
            T data{};

            auto curl = curl_easy_init();
            if (curl)
            {
                curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
                curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);

                curl_write_callback callback = [](char* buffer, size_t size, size_t nitems, void* userData)
                {
                    auto& data = *static_cast<T*>(userData);
                    data.insert(data.end(), buffer, buffer + nitems);
                    return nitems;
                };

                curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, callback);
                curl_easy_setopt(curl, CURLOPT_WRITEDATA, &data);

                auto result = curl_easy_perform(curl);
                if (result != CURLE_OK)
                {
                    throw std::exception();
                }

                curl_easy_cleanup(curl);
            }

            return data;
        });
    }

    void RuntimeImpl::LoadScript(const std::string& url)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(m_dispatcher, m_cancelSource, [this, url]
        {
            return LoadUrlAsync<std::string>(GetAbsoluteUrl(url).c_str());
        }).then(m_dispatcher, m_cancelSource, [this, url](const std::string& script)
        {
            Env().Eval(script.data(), url.data());
        });
        
    }

    void RuntimeImpl::Eval(const std::string& string, const std::string& sourceUrl)
    {
        Execute([this, string, sourceUrl](auto&)
        {
            Env().Eval(string.data(), sourceUrl.data());
        });
    }

    void RuntimeImpl::Execute(std::function<void(RuntimeImpl&)> func)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(m_dispatcher, m_cancelSource, [func = std::move(func), this]()
        {
            func(*this);
        });
    }

    Env& RuntimeImpl::Env()
    {
        return *this->m_env;
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

    void RuntimeImpl::BaseThreadProcedure()
    {
        m_dispatcher.set_affinity(std::this_thread::get_id());

        auto executeOnScriptThread = [this](std::function<void()> action)
        {
            Execute([action = std::move(action)](auto&)
            {
                action();
            });
        };

        babylon::Env env{ GetModulePath().u8string().data(), std::move(executeOnScriptThread) };

        m_env = &env;
        auto hostScopeGuard = gsl::finally([this] { m_env = nullptr; });

        Console::Initialize(env);

        XMLHttpRequest::Initialize(env, *this);

        Window window{ *this };

        m_engine->Initialize(env);

        // TODO: Handle device lost/restored.

        while (!m_cancelSource.cancelled())
        {
            // check if suspended
            {
                std::unique_lock<std::mutex> lck(m_suspendMutex);
                m_suspendVariable.wait(lck, [this](){ return !m_suspended;});
            }
            m_dispatcher.blocking_tick(m_cancelSource);
        }
    }

    template arcana::task<std::string, std::exception_ptr> RuntimeImpl::LoadUrlAsync(const std::string& url);
    template arcana::task<std::vector<char>, std::exception_ptr> RuntimeImpl::LoadUrlAsync(const std::string& url);
}

