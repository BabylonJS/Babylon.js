#include <napi/env.h>
#include <napi/js_native_api_types.h>
#include "js_native_api_v8.h"
#include "libplatform/libplatform.h"

namespace
{
    class Module final
    {
    public:
        Module(const char* executablePath)
        {
            v8::V8::InitializeICUDefaultLocation(executablePath);
            v8::V8::InitializeExternalStartupData(executablePath);
            m_platform = v8::platform::NewDefaultPlatform();
            v8::V8::InitializePlatform(m_platform.get());
            v8::V8::Initialize();
        }

        ~Module()
        {
            v8::V8::Dispose();
            v8::V8::ShutdownPlatform();
        }

        static void Initialize(const char* executablePath)
        {
            if (s_module == nullptr)
            {
                s_module = std::make_unique<Module>(executablePath);
            }
        }

    private:
        std::unique_ptr<v8::Platform> m_platform;

        static std::unique_ptr<Module> s_module;
    };

    std::unique_ptr<Module> Module::s_module;

    v8::Isolate* CreateIsolate(const char* executablePath)
    {
        Module::Initialize(executablePath);

        v8::Isolate::CreateParams create_params;
        create_params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
        return v8::Isolate::New(create_params);
    }

    void DestroyIsolate(v8::Isolate* isolate)
    {
        // todo : GetArrayBufferAllocator not available?
        //delete isolate->GetArrayBufferAllocator();
        isolate->Dispose();
    }

    class napi_env_base
    {
    public:
        explicit napi_env_base(v8::Isolate* isolate)
            : isolate_scope{ isolate }
            , isolate_handle_scope{ isolate }
        {
        }

    private:
        v8::Isolate::Scope isolate_scope;
        v8::HandleScope isolate_handle_scope;
    };

    class napi_env_local : public napi_env_base, public napi_env__
    {
    public:
        explicit napi_env_local(v8::Isolate* isolate)
            : napi_env_base{ isolate }
            , napi_env__{ v8::Context::New(isolate) }
            , context_scope{ context() }
        {
        }

        ~napi_env_local()
        {
        }

    private:
        v8::Context::Scope context_scope;
    };
}

namespace Babylon
{
    Env::Env(const char* executablePath, std::function<void(std::function<void()>)> executeOnScriptThread)
        : Napi::Env{ new napi_env_local{ CreateIsolate(executablePath) } }
    {
    }

    Env::~Env()
    {
        napi_env env = *this;
        auto isolate = static_cast<napi_env__*>(env)->isolate;
        delete static_cast<napi_env_local*>(env);
        isolate->Dispose();
    }
}
