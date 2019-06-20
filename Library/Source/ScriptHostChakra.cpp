#include "ScriptHost.h"
#include <ScriptHost/Console.h>
#include <ScriptHost/Window.h>
#include <gsl/gsl>
#include <napi/napi.h>
#include <napi/env_chakra.h>
#include <jsrt.h>

namespace babylon
{
    class ScriptHost::Impl final
    {
    public:
        explicit Impl(RuntimeImpl& runtimeImpl);
        ~Impl();

        void RunScript(gsl::czstring<> script, gsl::czstring<> url);

        Napi::Env& Env();

    private:
        static void CALLBACK PromiseContinuationCallback(JsValueRef task, void* callbackState);

        Napi::Env m_env;
        RuntimeImpl& m_runtimeImpl;
        JsRuntimeHandle m_jsRuntime;
    };

    ScriptHost::ScriptHost(RuntimeImpl& runtimeImpl)
        : m_impl{ std::make_unique<Impl>(runtimeImpl) }
    {
    }

    ScriptHost::~ScriptHost()
    {
    }

    void ScriptHost::RunScript(gsl::czstring<> script, gsl::czstring<> url)
    {
        m_impl->RunScript(script, url);
    }

    Napi::Env& ScriptHost::Env()
    {
        return m_impl->Env();
    }

    ScriptHost::Impl::Impl(RuntimeImpl& runtimeImpl)
        : m_env{ napi_create_env() }
        , m_runtimeImpl{ runtimeImpl }
    {
        // Create the runtime. We're only going to use one runtime for this host.
        JsCreateRuntime(JsRuntimeAttributeNone, nullptr, &m_jsRuntime);

        // Create a single execution context.
        JsContextRef context;
        JsCreateContext(m_jsRuntime, &context);

        // Now set the execution context as being the current one on this thread.
        JsSetCurrentContext(context);

        // Set up ES6 Promise.
        JsSetPromiseContinuationCallback(&Impl::PromiseContinuationCallback, this);

        // UWP namespace projection; all UWP under Windows namespace should work.
        JsProjectWinRTNamespace(L"Windows");

#ifdef _DEBUG
        // Put Chakra in debug mode.
        JsStartDebugging();
#endif
    }

    ScriptHost::Impl::~Impl()
    {
        JsDisposeRuntime(m_jsRuntime);
    }

    void ScriptHost::Impl::RunScript(gsl::czstring<> script, gsl::czstring<> url)
    {
        auto scriptString = Napi::String::New(m_env, script);
        napi_value result;
        napi_run_script(m_env, scriptString, url, &result); // TODO throw error if failed? Probably should move this functionality into napi
    }

    Napi::Env& ScriptHost::Impl::Env()
    {
        return m_env;
    }

    void CALLBACK ScriptHost::Impl::PromiseContinuationCallback(JsValueRef task, void* callbackState)
    {
        JsAddRef(task, nullptr);
        reinterpret_cast<Impl*>(callbackState)->m_runtimeImpl.Execute([task](auto&)
        {
            JsValueRef undefined;
            JsGetUndefinedValue(&undefined);
            JsCallFunction(task, &undefined, 1, nullptr);
            JsRelease(task, nullptr);
        });
    }
}
