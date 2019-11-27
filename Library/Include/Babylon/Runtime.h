#pragma once

#include <functional>
#include <memory>
#include <string>

namespace Babylon
{
    class RuntimeImpl;
    class Env;

    /**
     * Importance level of messages sent via logging callbacks.
     */
    enum class LogLevel
    {
        Log,
        Warn,
        Error,
    };

    /**
     * Type of logging callback argument required to create Runtime.
     */
    using LogCallback = std::function<void(const char*, LogLevel)>;
    
    /**
     * This class represents an instance of Babylon Native. It holds and manages all program
     * state and behavior relevant to Babylon Native's functionality, including the JavaScript
     * environment, the graphics engine, and other add-ons required to support the the execution
     * of the application's JavaScript code.
     */
    class Runtime
    {
    public:
        /**
         * Inform the runtime that the size of the default rendering backbuffer has changed. A 
         * familiar example of this would be if the window containing a full-frame rendering
         * were resized.
         */
        void UpdateSize(float width, float height);

        /**
         * Pause the execution of the Runtime. This might be necessary if the containing app
         * has lost focus.
         */
        void Suspend();

        /**
         * Un-pause the execution of the Runtime. This might be necessary if the containing
         * app were previously paused (suspended), but has gained focus again.
         */
        void Resume();

        /**
         * Download a JavaScript resource from a URL and execute its code in the JavaScript
         * environment. This method is thread-safe, but it is implicitly asynchronous: order of
         * execution is guaranteed, but not immediacy of execution.
         */
        void LoadScript(const std::string& url);

        /**
         * Execute code contained in a string (fetched from the sourceUrl) in the JavaScript 
         * environment. This method is thread-safe, but it is implicitly asynchronous: order of
         * execution is guaranteed, but not immediacy of execution.
         */
        void Eval(const std::string& string, const std::string& sourceUrl);

        /**
         * Dispatch an arbitrary function on the same thread that drives the JavaScript environment.
         * This method is thread-safe, but it is implicitly asynchronous: order of execution is
         * guaranteed, but not immediacy of execution. This is the correct way to force code to be
         * run in a particular order relative to calls to LoadScript() and Eval().
         */
        void Dispatch(std::function<void(Env&)> callback);

        /**
         * Retrieves the root URL provided at the time the Runtime was created (a default value may
         * be returned if the Runtime was created without a root URL).
         */
        const std::string& RootUrl() const;

    protected:
        std::unique_ptr<RuntimeImpl> m_impl;

        Runtime(std::unique_ptr<RuntimeImpl>);
        Runtime(const Runtime&) = delete;
        Runtime& operator=(const Runtime&) = delete;
        virtual ~Runtime();
    };
}
