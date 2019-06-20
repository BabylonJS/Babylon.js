#include <napi/env.h>
#include "js_native_api_chakra.h"
#include <jsrt.h>

namespace babylon
{
    class napi_env_local : public napi_env__
    {
    public:
        explicit napi_env_local(std::function<void(std::function<void()>)> executeOnScriptThread)
            : m_executeOnScriptThread{ std::move(executeOnScriptThread) }
        {
            // Create the runtime. We're only going to use one runtime for this host.
            JsCreateRuntime(JsRuntimeAttributeNone, nullptr, &m_jsRuntime);

            // Create a single execution context.
            JsContextRef context;
            JsCreateContext(m_jsRuntime, &context);

            // Now set the execution context as being the current one on this thread.
            JsSetCurrentContext(context);

            // Set up ES6 Promise.
            JsSetPromiseContinuationCallback(&napi_env_local::PromiseContinuationCallback, this);

            // UWP namespace projection; all UWP under Windows namespace should work.
            JsProjectWinRTNamespace(L"Windows");

#ifdef _DEBUG
            // Put Chakra in debug mode.
            JsStartDebugging();
#endif
        }

        ~napi_env_local()
        {
            JsDisposeRuntime(m_jsRuntime);
        }

    private:
        static void CALLBACK PromiseContinuationCallback(JsValueRef task, void* callbackState)
        {
            JsAddRef(task, nullptr);
            reinterpret_cast<napi_env_local*>(callbackState)->m_executeOnScriptThread([task]()
            {
                JsValueRef undefined;
                JsGetUndefinedValue(&undefined);
                JsCallFunction(task, &undefined, 1, nullptr);
                JsRelease(task, nullptr);
            });
        }

        std::function<void(std::function<void()>)> m_executeOnScriptThread;
        JsRuntimeHandle m_jsRuntime;
    };

    Env::Env(const char* executablePath, std::function<void(std::function<void()>)> executeOnScriptThread)
        : Napi::Env(new napi_env_local(std::move(executeOnScriptThread)))
    {
    }

    Env::~Env()
    {
        napi_env env = *this;
        delete static_cast<napi_env_local*>(env);
    }
}
