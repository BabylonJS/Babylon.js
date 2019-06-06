#pragma once

#include <napi/js_native_api_types.h>
#include <v8.h>

napi_env napi_create_env(v8::Isolate* isolate);
void napi_destroy_env(napi_env env);
