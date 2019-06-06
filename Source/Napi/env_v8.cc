#include "env_v8.h"
#include "js_native_api_v8.h"

namespace
{
    struct napi_env_base
    {
        explicit napi_env_base(v8::Isolate* isolate)
            : isolate_scope(isolate)
            , isolate_handle_scope(isolate)
        {
        }

        v8::Isolate::Scope isolate_scope;
        v8::HandleScope isolate_handle_scope;
    };

    struct napi_env_local : public napi_env_base, public napi_env__
    {
        explicit napi_env_local(v8::Isolate* isolate)
            : napi_env_base(isolate)
            , napi_env__(v8::Context::New(isolate))
            , context_scope(context())
        {
        }

        v8::Context::Scope context_scope;
    };
}

napi_env napi_create_env(v8::Isolate* isolate)
{
    return new napi_env_local(isolate);
}

void napi_destroy_env(napi_env env)
{
    delete static_cast<napi_env_local*>(env);
}