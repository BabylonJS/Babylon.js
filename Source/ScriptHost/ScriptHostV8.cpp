#include "ScriptHost.h"
#include <Runtime/Common.h>
#include <napi/env_v8.h>
#include <v8.h>
#include <libplatform/libplatform.h>

namespace
{
    class Module final
    {
    public:
        Module()
        {
            const std::string& executablePath = babylon::GetExecutablePath();
            v8::V8::InitializeICUDefaultLocation(executablePath.data());
            v8::V8::InitializeExternalStartupData(executablePath.data());
            m_platform = v8::platform::NewDefaultPlatform();
            v8::V8::InitializePlatform(m_platform.get());
            v8::V8::Initialize();
        }

        ~Module()
        {
            v8::V8::Dispose();
            v8::V8::ShutdownPlatform();
        }

        static void Initialize()
        {
            if (s_module == nullptr)
            {
                s_module = std::make_unique<Module>();
            }
        }

    private:
        std::unique_ptr<v8::Platform> m_platform;

        static std::unique_ptr<Module> s_module;
    };

    std::unique_ptr<Module> Module::s_module;

    v8::Isolate* CreateIsolate(v8::ArrayBuffer::Allocator* arrayBufferAllocator)
    {
        Module::Initialize();

        v8::Isolate::CreateParams create_params;
        create_params.array_buffer_allocator = arrayBufferAllocator;
        return v8::Isolate::New(create_params);
    }
}

namespace babylon
{
    class ScriptHost::Impl final
    {
    public:
        Impl();
        ~Impl();

        void RunScript(gsl::czstring<> script, gsl::czstring<> url);

        Napi::Env& Env();

    private:
        std::unique_ptr<v8::ArrayBuffer::Allocator> m_arrayBufferAllocator;
        v8::Isolate* m_isolate;
        Napi::Env m_env;
    };

    ScriptHost::ScriptHost(RuntimeImpl&)
        : m_impl{ std::make_unique<Impl>() }
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

    ScriptHost::Impl::Impl()
        : m_arrayBufferAllocator{ v8::ArrayBuffer::Allocator::NewDefaultAllocator() }
        , m_isolate{ ::CreateIsolate(m_arrayBufferAllocator.get()) }
        , m_env{ ::napi_create_env(m_isolate) }
    {
    }

    ScriptHost::Impl::~Impl()
    {
        ::napi_destroy_env(m_env);

        m_isolate->Dispose();
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
}
