#pragma once

#include <napi/env.h>

#include <functional>
#include <memory>
#include <string>

namespace Babylon
{
    class ScriptLoader
    {
    public:
        using DispatchFunctionT = std::function<void(std::function<void(Napi::Env)>)>;

        ScriptLoader(DispatchFunctionT dispatchFunction, std::string rootUrl);
        
        template<typename T>
        ScriptLoader(T& dispatcher, std::string rootUrl)
            : ScriptLoader([&dispatcher](auto func) { dispatcher.Dispatch(std::move(func)); }
            , std::move(rootUrl))
        {
        }

        ~ScriptLoader();

        void LoadScript(std::string url);
        void Eval(std::string source, std::string url);

    private:
        struct Impl;
        std::unique_ptr<Impl> m_impl{};
    };
}
