#include "ScriptLoader.h"

#include <Babylon/NetworkUtils.h>
#include <arcana/threading/task.h>

namespace Babylon
{
    struct ScriptLoader::Impl
    {
        Impl(JsRuntime& runtime, std::string rootUrl)
            : Runtime{runtime}
            , RootUrl{std::move(rootUrl)}
            , Task{arcana::task_from_result<std::exception_ptr>()}
        {
        }

        void LoadScript(std::string url)
        {
            auto absoluteUrl = GetAbsoluteUrl(url, RootUrl);
            auto loadUrlTask = LoadTextAsync(std::move(absoluteUrl));
            arcana::task_completion_source<void, std::exception_ptr> completionSource{};
            auto loadScriptTask = arcana::when_all(loadUrlTask, Task).then(arcana::inline_scheduler, arcana::cancellation::none(), [& runtime = Runtime, url = std::move(url), completionSource](const std::tuple<std::string, arcana::void_placeholder>& args) mutable {
                std::string source = std::get<0>(args);
                runtime.Dispatch([source = std::move(source), url = std::move(url), completionSource = std::move(completionSource)](Napi::Env env) mutable {
                    Napi::Eval(env, source.data(), url.data());
                    completionSource.complete();
                });
            });
            Task = completionSource.as_task();
        }

        void Eval(std::string source, std::string url)
        {
            arcana::task_completion_source<void, std::exception_ptr> completionSource{};
            auto evalTask = Task.then(arcana::inline_scheduler, arcana::cancellation::none(), [& runtime = Runtime, source = std::move(source), url = std::move(url), completionSource]() mutable {
                runtime.Dispatch([source = std::move(source), url = std::move(url), completionSource = std::move(completionSource)](Napi::Env env) mutable {
                    Napi::Eval(env, source.data(), url.data());
                    completionSource.complete();
                });
            });
            Task = completionSource.as_task();
        }

        JsRuntime& Runtime;
        const std::string RootUrl{};
        arcana::task<void, std::exception_ptr> Task{};
    };

    ScriptLoader::ScriptLoader(JsRuntime& runtime, std::string rootUrl)
        : m_impl{std::make_unique<ScriptLoader::Impl>(runtime, std::move(rootUrl))}
    {
    }

    ScriptLoader::~ScriptLoader()
    {
    }

    void ScriptLoader::LoadScript(std::string url)
    {
        m_impl->LoadScript(std::move(url));
    }

    void ScriptLoader::Eval(std::string source, std::string url)
    {
        m_impl->Eval(std::move(source), std::move(url));
    }
}
