#pragma once

#include <Babylon/JsRuntime.h>

#include <memory>
#include <string>

namespace Babylon
{
    class WorkQueue;

    class AppRuntime final : public JsRuntime
    {
    public:
        AppRuntime(std::string rootUrl);
        ~AppRuntime();

        const std::string& RootUrl() const;

        void Suspend();
        void Resume();

        void Dispatch(std::function<void(Napi::Env)> callback);

    private:
        // This secondary constructor exists to resolve a timing issue with the construction
        // of the JsRuntime. Because JsRuntime's contract requires that its dispatch function
        // be valid and safe at the moment its constructor is called, the AppRuntime's work
        // queue (which powers the dispatch function) must exist before the JsRuntime
        // constructor is called. However, because AppRuntime inherits from JsRuntime, by
        // by default the base class must be initialized before the members of the inheriting
        // class -- relevantly m_workQueue. In short, the work queue must exist before
        // m_workQueue can be initialized. The solution to this is to create the work queue
        // separately within a forwarding constructor, then have the JsRuntime's dispatcher
        // function simply capture a reference directly to the underlying work queue. The
        // unique_ptr containing the work queue can then be moved so that it is owned by
        // m_workQueue.
        AppRuntime(std::string, std::unique_ptr<WorkQueue>);

        // These three methods are the mechanism by which platform- and JavaScript-specific
        // code can be "injected" into the execution of the JavaScript thread. These three
        // functions are implemented in separate files, thus allowing implementations to be
        // mixed and matched by the build system based on the platform and JavaScript engine
        // being targeted, without resorting to virtuality. An important nuance of these
        // functions is that they are all intended to call each other: RunPlatformTier MUST
        // call RunEnvironmentTier, which MUST create the initial Napi::Env and pass it to
        // Run. This arrangement allows not only for an arbitrary assemblage of platforms,
        // but it also allows us to respect the requirement by certain platforms (notably V8)
        // that certain program state be allocated and stored only on the stack.
        void RunPlatformTier();
        void RunEnvironmentTier();
        void Run(Napi::Env);

        const std::string m_rootUrl;
        std::unique_ptr<WorkQueue> m_workQueue{};
    };
}
