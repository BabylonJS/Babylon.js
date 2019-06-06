#include "env_chakra.h"
#include "js_native_api_chakra.h"

napi_env napi_create_env()
{
    return new napi_env__();
}

void napi_destroy_env(napi_env env)
{
    delete env;
}
