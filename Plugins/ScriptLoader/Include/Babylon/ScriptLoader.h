#pragma once

#include <Babylon/JsRuntime.h>

#include <memory>
#include <string>

namespace Babylon
{
    class ScriptLoader
    {
    public:
        ScriptLoader(JsRuntime&, std::string rootUrl);
        ~ScriptLoader();

        void LoadScript(std::string url);
        void Eval(std::string source, std::string url);

    private:
        struct Impl;
        std::unique_ptr<Impl> m_impl{};
    };
}