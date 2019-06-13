#include "RuntimeWin32.h"
#include "RuntimeImpl.h"
#include "CommonWin32.h"
#include <ScriptHost/ScriptHost.h>
#include <ScriptHost/Console.h>
#include <ScriptHost/Window.h>
#include <ScriptHost/XMLHttpRequest.h>
#include <arcana/experimental/array.h>
#include <arcana/threading/cancellation.h>
#include <arcana/threading/dispatcher.h>
#include <arcana/threading/task.h>
#include <fstream>
#include <objbase.h>

namespace
{
    std::string ReadAllText(const char* fileName)
    {
        // TODO: This hack-ish way to load files from local and system-wide locations should be
        // replaced once we figure out how we want to do file access in general.

        std::ifstream t;
        t.open(fileName);
        if (!t.good())
        {
            t.open(babylon::GetAbsolutePath(fileName));
        }
        return std::string({ std::istreambuf_iterator<char>(t) }, std::istreambuf_iterator<char>());
    }
}

namespace babylon
{
    class RuntimeWin32::Impl final : public RuntimeImpl
    {
    public:
        explicit Impl(HWND hWnd, const std::string& rootUrl);
        ~Impl() override;

        virtual void RunScript(const std::string& url) override;
        virtual void RunScript(const std::string& script, const std::string& url) override;

    private:
        void ThreadProcedure();
    };

    RuntimeWin32::DefaultInitializationScriptsArray RuntimeWin32::DEFAULT_INITIALIZATION_SCRIPTS = arcana::make_array<std::string>
    (
#ifdef _DEBUG
        "Scripts\\babylon.max.js",
        "Scripts\\babylon.glTF2FileLoader.js"
#else
        "Scripts\\babylon.js",
        "Scripts\\babylon.glTF2FileLoader.min.js"
#endif
    );

    RuntimeWin32::RuntimeWin32(HWND hWnd, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeWin32::Impl>(hWnd, rootUrl) }
    {
    }

    RuntimeWin32::~RuntimeWin32()
    {
    }

    // Loads and initializes application assets when the application is loaded.
    RuntimeWin32::Impl::Impl(HWND hWnd, const std::string& rootUrl)
        : RuntimeImpl{ hWnd, rootUrl, [this] { ThreadProcedure(); } }
    {
        RECT rect;
        if (GetWindowRect(hWnd, &rect))
        {
            float width = static_cast<float>(rect.right - rect.left);
            float height = static_cast<float>(rect.bottom - rect.top);
            UpdateSize(width, height);
        }

        for (const auto& url : RuntimeWin32::DEFAULT_INITIALIZATION_SCRIPTS)
        {
            RunScript(url);
        }
    }

    RuntimeWin32::Impl::~Impl()
    {
        Dispatcher().clear(); // TODO: fix arcana instead of doing this
    }

    void RuntimeWin32::Impl::ThreadProcedure()
    {
        HRESULT hresult = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
        assert(SUCCEEDED(hresult));
        auto coInitializeScopeGuard = gsl::finally([] { CoUninitialize(); });

        RuntimeImpl::DefaultThreadProcedure();
    }

    void RuntimeWin32::Impl::RunScript(const std::string& url)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(Dispatcher(), Cancellation(), [this, url]
        {
            return ReadAllText(url.c_str());
        }).then(Dispatcher(), Cancellation(), [this, url](const std::string& script)
        {
            RunScriptWithNapi(script, url);
        });
    }

    void RuntimeWin32::Impl::RunScript(const std::string& script, const std::string& url)
    {
        Execute([this, script, url](auto&)
        {
            RunScriptWithNapi(script, url);
        });
    }
}
