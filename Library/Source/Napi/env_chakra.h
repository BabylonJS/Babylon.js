#pragma once

#include "js_native_api_types.h"

napi_env napi_create_env();
void napi_destroy_env(napi_env env);
