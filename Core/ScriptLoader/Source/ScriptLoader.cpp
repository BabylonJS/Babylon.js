#include <Babylon/ScriptLoader.h>
#include <UrlLib/UrlLib.h>
#include <arcana/threading/task.h>

namespace Babylon
{
    class ScriptLoader::Impl
    {
    public:
        Impl(DispatchFunctionT dispatchFunction)
            : m_dispatchFunction{dispatchFunction}
            , m_task{arcana::task_from_result<std::exception_ptr>()}
        {
        }

        void LoadScript(std::string url)
        {
            UrlLib::UrlRequest request;
            request.Open(UrlLib::UrlMethod::Get, url);
            request.ResponseType(UrlLib::UrlResponseType::String);
            m_task = arcana::when_all(m_task, request.SendAsync()).then(arcana::inline_scheduler, arcana::cancellation::none(), [dispatchFunction{m_dispatchFunction}, request{std::move(request)}, url{std::move(url)}](auto) {
                arcana::task_completion_source<void, std::exception_ptr> taskCompletionSource{};
                dispatchFunction([taskCompletionSource, request{std::move(request)}, url{std::move(url)}](Napi::Env env) mutable {
                    Napi::Eval(env, request.ResponseString().data(), url.data());
                    taskCompletionSource.complete();
                });
                return taskCompletionSource.as_task();
            });
        }

        void Eval(std::string source, std::string url)
        {
            m_task = m_task.then(arcana::inline_scheduler, arcana::cancellation::none(), [dispatchFunction{m_dispatchFunction}, source{std::move(source)}, url{std::move(url)}](auto) {
                arcana::task_completion_source<void, std::exception_ptr> taskCompletionSource{};
                dispatchFunction([taskCompletionSource, source{std::move(source)}, url{std::move(url)}](Napi::Env env) mutable {
                    Napi::Eval(env, source.data(), url.data());
                    taskCompletionSource.complete();
                });
                return taskCompletionSource.as_task();
            });
        }

    private:
        DispatchFunctionT m_dispatchFunction{};
        arcana::task<void, std::exception_ptr> m_task{};
    };

    ScriptLoader::ScriptLoader(DispatchFunctionT dispatchFunction)
        : m_impl{std::make_unique<ScriptLoader::Impl>(std::move(dispatchFunction))}
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
