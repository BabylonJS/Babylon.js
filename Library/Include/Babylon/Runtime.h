#pragma once

#include <functional>
#include <memory>
#include <string>

namespace babylon
{
    class RuntimeImpl;
    using MessageLogger = void(*)(const char* message);
    class Env;
    
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
        void Resume();

        void LoadScript(const std::string& url);
        void Eval(const std::string& string, const std::string& sourceUrl);

        void Execute(std::function<void(Runtime&)>);

        babylon::Env& Env() const;
        const std::string& RootUrl() const;

        static void RegisterLogOutput(MessageLogger output);
        static void RegisterWarnOutput(MessageLogger output);
        static void RegisterErrorOutput(MessageLogger output);

    protected:
        std::unique_ptr<RuntimeImpl> m_impl;
    };
}
