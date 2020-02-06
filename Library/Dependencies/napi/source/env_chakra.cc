#include <napi/env.h>
#include "js_native_api_chakra.h"
#include <jsrt.h>
#include <strsafe.h>

namespace
{
    void ThrowIfFailed(JsErrorCode errorCode)
    {
        if (errorCode != JsErrorCode::JsNoError)
        {
            throw std::exception();
        }
    }

    void Log(const wchar_t* format, ...)
    {
        va_list argList;
        va_start(argList, format);

        wchar_t message[1024];
        StringCchVPrintfW(message, std::size(message), format, argList);
        OutputDebugStringW(message);

        va_end(argList);
    }
}

namespace Babylon
{
    class napi_env_local : public napi_env__
    {
    public:
        explicit napi_env_local(std::function<void(std::function<void()>)> executeOnScriptThread)
            : m_executeOnScriptThread{ std::move(executeOnScriptThread) }
        {
            // Create the runtime. We're only going to use one runtime for this host.
            ThrowIfFailed(JsCreateRuntime(JsRuntimeAttributeNone, nullptr, &m_jsRuntime));

            // Create a single execution context.
            JsContextRef context;
            ThrowIfFailed(JsCreateContext(m_jsRuntime, &context));

            // Now set the execution context as being the current one on this thread.
            ThrowIfFailed(JsSetCurrentContext(context));

            // Set up ES6 Promise.
            ThrowIfFailed(JsSetPromiseContinuationCallback(&napi_env_local::PromiseContinuationCallback, this));

            // UWP namespace projection; all UWP under Windows namespace should work.
            ThrowIfFailed(JsProjectWinRTNamespace(L"Windows"));

#ifdef _DEBUG
            // Put Chakra in debug mode.
            ThrowIfFailed(JsStartDebugging());
#endif

            CacheHasOwnPropertyFunction();
        }

        ~napi_env_local()
        {
            ThrowIfFailed(JsSetCurrentContext(JS_INVALID_REFERENCE));

            ThrowIfFailed(JsDisposeRuntime(m_jsRuntime));
        }

    private:
        static void CALLBACK PromiseContinuationCallback(JsValueRef task, void* callbackState)
        {
            ThrowIfFailed(JsAddRef(task, nullptr));
            reinterpret_cast<napi_env_local*>(callbackState)->m_executeOnScriptThread([task]()
            {
                JsValueRef undefined;
                ThrowIfFailed(JsGetUndefinedValue(&undefined));
                ThrowIfFailed(JsCallFunction(task, &undefined, 1, nullptr));
                ThrowIfFailed(JsRelease(task, nullptr));
            });
        }

        void CacheHasOwnPropertyFunction()
        {
            JsPropertyIdRef propertyId;

            JsValueRef global;
            ThrowIfFailed(JsGetGlobalObject(&global));

            JsValueRef object;
            ThrowIfFailed(JsGetPropertyIdFromName(L"Object", &propertyId));
            ThrowIfFailed(JsGetProperty(global, propertyId, &object));

            JsValueRef prototype;
            ThrowIfFailed(JsGetPrototype(object, &prototype));

            ThrowIfFailed(JsGetPropertyIdFromName(L"hasOwnProperty", &propertyId));
            ThrowIfFailed(JsGetProperty(prototype, propertyId, &has_own_property_function));
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
