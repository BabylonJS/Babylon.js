#pragma once

#include <Napi/napi.h>

#include <functional>
#include <memory>
#include <string>

namespace babylon
{
    class RuntimeImpl;

    class Runtime
    {
    public:
        Runtime(std::unique_ptr<RuntimeImpl>);
        Runtime(const Runtime&) = delete;
        Runtime& operator=(const Runtime&) = delete;
        virtual ~Runtime();

        void UpdateSize(float width, float height);
        void UpdateRenderTarget();
        void Suspend();

        void RunScript(const std::string& url);
        void RunScript(const std::string& script, const std::string& url);

        void Execute(std::function<void(Runtime&)>);

        Napi::Env& Env() const;
        const std::string& RootUrl() const;

    protected:
        Runtime() = default;
        std::unique_ptr<RuntimeImpl> m_impl;
    };
}
