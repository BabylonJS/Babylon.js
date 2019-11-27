#pragma once

#include "napi.h"

namespace Babylon
{
    class Env : public Napi::Env
    {
    public:
        explicit Env(const char* executablePath, std::function<void(std::function<void()>)> executeOnScriptThread);
        Env(const Env&) = delete;
        ~Env();

        void Eval(const char* string, const char* sourceUrl);
    };
}
