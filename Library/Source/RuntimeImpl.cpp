#include "RuntimeImpl.h"

#include "Console.h"
#include "NativeEngine.h"
#include "NativeWindow.h"
#include "XMLHttpRequest.h"

#include <curl/curl.h>
#include <napi/env.h>
#include <sstream>

namespace Babylon
{
    namespace
    {
        static constexpr auto JS_WINDOW_NAME = "window";
        static constexpr auto JS_NATIVE_NAME = "_native";
        static constexpr auto JS_RUNTIME_NAME = "runtime";
        static constexpr auto JS_NATIVE_WINDOW_NAME = "window";
        static constexpr auto JS_CONSOLE_NAME = "console";

        static constexpr auto JS_ENGINE_CONSTRUCTOR_NAME = "Engine";
        static constexpr auto JS_XML_HTTP_REQUEST_CONSTRUCTOR_NAME = "XMLHttpRequest";
    }

    RuntimeImpl& RuntimeImpl::GetRuntimeImplFromJavaScript(Napi::Env env)
    {
        return *env.Global()
            .Get(JS_NATIVE_NAME).ToObject()
            .Get(JS_RUNTIME_NAME).As<Napi::External<RuntimeImpl>>()
            .Data();
    }

    NativeWindow& RuntimeImpl::GetNativeWindowFromJavaScript(Napi::Env env)
    {
        return *NativeWindow::Unwrap(
            env.Global()
            .Get(JS_NATIVE_NAME).ToObject()
            .Get(JS_WINDOW_NAME).ToObject());
    }

    RuntimeImpl::RuntimeImpl(void* nativeWindowPtr, const std::string& rootUrl, LogCallback&& logCallback)
        : m_nativeWindowPtr{ nativeWindowPtr }
        , m_thread{ [this] { ThreadProcedure(); } }
        , m_rootUrl{ rootUrl }
        , m_logCallback{ logCallback }
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
        m_dispatcher.queue([width, height, this]
        {
            auto& window = RuntimeImpl::GetNativeWindowFromJavaScript(*m_env);
            window.Resize(static_cast<size_t>(width), static_cast<size_t>(height));
        });
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

    void RuntimeImpl::LoadScript(const std::string& url)
    {
        auto lock = AcquireTaskLock();
        Task = arcana::when_all(LoadUrlAsync<std::string>(GetAbsoluteUrl(url).data()), Task).then(m_dispatcher, m_cancelSource,
            [this, url](const std::tuple<std::string, arcana::void_placeholder>& args)
            {
                m_env->Eval(std::get<0>(args).data(), url.data());
            });
    }

    void RuntimeImpl::Eval(const std::string& string, const std::string& sourceUrl)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(m_dispatcher, m_cancelSource, [this, string, sourceUrl]()
        {
            m_env->Eval(string.data(), sourceUrl.data());
        });
    }

    void RuntimeImpl::Dispatch(std::function<void(Env&)> func)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(m_dispatcher, m_cancelSource, [func = std::move(func), this]()
        {
            func(*m_env);
        });
    }

    const std::string& RuntimeImpl::RootUrl() const
    {
        return m_rootUrl;
    }

    std::string RuntimeImpl::GetAbsoluteUrl(const std::string& url)
    {
        auto curl = curl_url();

        auto code = curl_url_set(curl, CURLUPART_URL, url.data(), 0);

        // If input could not be turned into a valid URL, try using it as a regular URL.
        if (code == CURLUE_MALFORMED_INPUT)
        {
            code = curl_url_set(curl, CURLUPART_URL, (m_rootUrl + "/" + url).data(), 0);
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

        return std::move(absoluteUrl);
    }

    template<typename T> arcana::task<T, std::exception_ptr> RuntimeImpl::LoadUrlAsync(const std::string& url)
    {
        return arcana::make_task(m_dispatcher, m_cancelSource, [url]()
        {
            T data{};

            auto curl = curl_easy_init();
            if (curl)
            {
                curl_easy_setopt(curl, CURLOPT_URL, url.data());
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

            return std::move(data);
        });
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

    void RuntimeImpl::InitializeJavaScriptVariables()
    {
        auto& env = *m_env;
        auto global = env.Global();

        global.Set(JS_WINDOW_NAME, global);

        auto jsNative = Napi::Object::New(env);
        global.Set(JS_NATIVE_NAME, jsNative);

        auto jsRuntime = Napi::External<RuntimeImpl>::New(env, this);
        jsNative.Set(JS_RUNTIME_NAME, jsRuntime);

        auto jsWindow = NativeWindow::Create(env, m_nativeWindowPtr, 32, 32);
        jsNative.Set(JS_NATIVE_WINDOW_NAME, jsWindow.Value());
        global.Set("setTimeout", NativeWindow::GetSetTimeoutFunction(jsWindow).Value());
        global.Set("atob", NativeWindow::GetAToBFunction(jsWindow).Value());

        auto jsConsole = Console::Create(env, m_logCallback);
        jsNative.Set(JS_CONSOLE_NAME, jsConsole.Value());
        global.Set(JS_CONSOLE_NAME, jsConsole.Value());

        auto jsNativeEngineConstructor = NativeEngine::InitializeAndCreateConstructor(env);
        jsNative.Set(JS_ENGINE_CONSTRUCTOR_NAME, jsNativeEngineConstructor.Value());

        auto jsXmlHttpRequestConstructor = XMLHttpRequest::CreateConstructor(env);
        global.Set(JS_XML_HTTP_REQUEST_CONSTRUCTOR_NAME, jsXmlHttpRequestConstructor.Value());
    }

    void RuntimeImpl::BaseThreadProcedure()
    {
        m_dispatcher.set_affinity(std::this_thread::get_id());

        auto executeOnScriptThread = [this](std::function<void()> action)
        {
            Dispatch([action = std::move(action)](auto&)
            {
                action();
            });
        };

        Env env{ GetModulePath().u8string().data(), std::move(executeOnScriptThread) };

        m_env = &env;
        auto hostScopeGuard = gsl::finally([this] { m_env = nullptr; });

        InitializeJavaScriptVariables();

        // TODO: Handle device lost/restored.

        while (!m_cancelSource.cancelled())
        {
            // check if suspended
            {
                std::unique_lock<std::mutex> lock(m_suspendMutex);
                m_suspendVariable.wait(lock, [this](){ return !m_suspended;});
            }
            m_dispatcher.blocking_tick(m_cancelSource);
        }
    }

    template arcana::task<std::string, std::exception_ptr> RuntimeImpl::LoadUrlAsync(const std::string& url);
    template arcana::task<std::vector<char>, std::exception_ptr> RuntimeImpl::LoadUrlAsync(const std::string& url);
}
