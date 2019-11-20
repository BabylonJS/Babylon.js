#include <napi/env.h>
#include <napi/js_native_api_types.h>
#include "JavaScriptCore/JavaScriptCore.h"
#include "js_native_api_JavaScriptCore.h"

namespace Babylon
{
    class napi_env_local : public napi_env__
    {
    public:
        explicit napi_env_local(std::function<void(std::function<void()>)> executeOnScriptThread)
            : m_executeOnScriptThread{ std::move(executeOnScriptThread) }
        {
            m_contextGroup = JSContextGroupCreate();
            m_globalContext = JSGlobalContextCreateInGroup(m_contextGroup, nullptr);
        }

        ~napi_env_local()
        {
            JSGlobalContextRelease(m_globalContext);
            JSContextGroupRelease(m_contextGroup);
        }

    private:
        std::function<void(std::function<void()>)> m_executeOnScriptThread;
        JSContextGroupRef m_contextGroup;
    };

    
    Env::Env(const char* executablePath, std::function<void(std::function<void()>)> executeOnScriptThread)
        : Napi::Env{ new napi_env_local(std::move(executeOnScriptThread)) }
    {
    }

    Env::~Env()
    {
    }
}
