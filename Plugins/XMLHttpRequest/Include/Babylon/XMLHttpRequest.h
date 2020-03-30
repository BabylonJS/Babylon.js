#pragma once

#include <Napi/env.h>

#include <string>

namespace Babylon
{
    void InitializeXMLHttpRequest(Napi::Env env, std::string rootUrl);
}
