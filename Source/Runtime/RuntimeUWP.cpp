#include "RuntimeUWP.h"
#include "CommonUWP.h"
#include "RuntimeImpl.h"
#include <ScriptHost/ScriptHost.h>
#include <ScriptHost/Console.h>
#include <ScriptHost/Window.h>
#include <ScriptHost/XMLHttpRequest.h>
#include <arcana/experimental/array.h>
#include <arcana/threading/cancellation.h>
#include <arcana/threading/coroutine.h>
#include <arcana/threading/dispatcher.h>
#include <arcana/threading/task.h>
#include <arcana/threading/task_conversions.h>
#include <winrt/Windows.ApplicationModel.h>
#include <winrt/Windows.ApplicationModel.Core.h>
#include <winrt/Windows.UI.Core.h>
#include <winrt/Windows.Storage.h>
#include <winrt/Windows.Graphics.Display.h>
#include <winrt/Windows.UI.Xaml.Controls.h>
#include <exception>
#include <dxgi1_2.h>
#include <windows.ui.xaml.media.dxinterop.h>
#include <variant>

namespace
{
    arcana::task<std::string, std::exception_ptr> read_text_async(std::string filename)
    {
        auto folder = winrt::Windows::ApplicationModel::Package::Current().InstalledLocation();
        return arcana::create_task<std::exception_ptr>(folder.GetFileAsync(winrt::to_hstring(filename)))
            .then(arcana::inline_scheduler, arcana::cancellation::none(), [filename](const winrt::Windows::Storage::StorageFile& file)
        {
            return arcana::create_task<std::exception_ptr>(winrt::Windows::Storage::FileIO::ReadTextAsync(file));
        }).then(arcana::inline_scheduler, arcana::cancellation::none(), [filename](const winrt::hstring& hstring)
        {
            return winrt::to_string(hstring);
        });
    }

    // Converts a length in device-independent pixels (DIPs) to a length in physical pixels.
    float dips_to_pixels(float dips, float dpi)
    {
        static const float dipsPerInch = 96.0f;
        return floorf(dips * dpi / dipsPerInch + 0.5f); // Round to nearest integer.
    }

    template<typename T>
    T from_abi(void* from)
    {
        T to{ nullptr };
        winrt::copy_from_abi(to, from);
        return std::move(to);
    }

    // TODO: fix for bgfx
    //Spectre::Engine::EngineDescription GetEngineDescription(winrt::agile_ref<winrt::Windows::UI::Core::CoreWindow>& window)
    //{
    //    Spectre::Engine::EngineDescription engineDesc{};

    //    Spectre::Engine::GeneralDescription& general = engineDesc.General;
    //    general.ThreadingMode = Spectre::Engine::Lockable::ThreadingMode::Single;

    //    Spectre::Engine::DeviceDescription& device = engineDesc.Device;
    //    device.Platform = Spectre::Engine::DevicePlatform::DirectX11;

    //    Spectre::Engine::OutputDescription& output = engineDesc.Output;
    //    output.Mode = Spectre::Engine::RenderOutputMode::CoreWindow;
    //    output.NativeWindow = winrt::get_abi(reinterpret_cast<winrt::com_ptr<IAgileReference>&>(window));
    //    output.PerformanceLogging = Spectre::Engine::RenderOutputPerformanceLogging::Enable;

    //    return std::move(engineDesc);
    //}

    //void SPECTRESDK_CALL OnSwapChainCreatedCallback(void* dxgiSwapChain, void* pUserData)
    //{
    //    auto panel = from_abi<winrt::Windows::UI::Xaml::Controls::SwapChainPanel>(pUserData);
    //    panel.Dispatcher().RunAsync(winrt::Windows::UI::Core::CoreDispatcherPriority::Normal, [=]
    //    {
    //        winrt::check_hresult(panel.as<ISwapChainPanelNative>()->SetSwapChain(static_cast<IDXGISwapChain1*>(dxgiSwapChain)));
    //    });
    //}

    //Spectre::Engine::EngineDescription GetEngineDescription(winrt::Windows::UI::Xaml::Controls::SwapChainPanel& panel)
    //{
    //    Spectre::Engine::EngineDescription engineDesc{};

    //    Spectre::Engine::GeneralDescription& general = engineDesc.General;
    //    general.ThreadingMode = Spectre::Engine::Lockable::ThreadingMode::Single;

    //    Spectre::Engine::DeviceDescription& device = engineDesc.Device;
    //    device.Platform = Spectre::Engine::DevicePlatform::DirectX11;

    //    Spectre::Engine::OutputDescription& output = engineDesc.Output;
    //    output.Mode = Spectre::Engine::RenderOutputMode::XAML;
    //    output.NativeWindow = winrt::get_abi(panel);
    //    output.OnSwapChainCreatedCallback = OnSwapChainCreatedCallback;
    //    output.PerformanceLogging = Spectre::Engine::RenderOutputPerformanceLogging::Enable;

    //    return std::move(engineDesc);
    //}
}

namespace babylon
{
    class RuntimeUWP::Impl final : public RuntimeImpl
    {
    public:
        // TODO: fix RenderPAL to take a CoreWindow directly instead of an agile ref to a CoreWindow once we switch to RenderPAL.
        explicit Impl(winrt::agile_ref<winrt::Windows::UI::Core::CoreWindow> window, const std::string& rootUrl);
        explicit Impl(winrt::Windows::UI::Xaml::Controls::SwapChainPanel panel, const std::string& rootUrl);
        ~Impl() override = default;

        virtual void RunScript(const std::string& url) override;
        virtual void RunScript(const std::string& script, const std::string& url) override;

    private:
        std::variant<winrt::agile_ref<winrt::Windows::UI::Core::CoreWindow>, winrt::Windows::UI::Xaml::Controls::SwapChainPanel> m_windowsUiContext;
    };

    RuntimeUWP::DefaultInitializationScriptsArray RuntimeUWP::DEFAULT_INITIALIZATION_SCRIPTS = arcana::make_array<std::string>
    (
#ifdef _DEBUG
        "Scripts\\babylon.max.js",
        "Scripts\\babylon.glTF2FileLoader.js"
#else
        "Scripts\\babylon.js",
        "Scripts\\babylon.glTF2FileLoader.min.js"
#endif
    );

    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Core::ICoreWindow* window, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeUWP::Impl>(from_abi<winrt::Windows::UI::Core::CoreWindow>(window), rootUrl) }
    {
    }

    RuntimeUWP::RuntimeUWP(ABI::Windows::UI::Xaml::Controls::ISwapChainPanel* panel, const std::string& rootUrl)
        : Runtime{ std::make_unique<RuntimeUWP::Impl>(from_abi<winrt::Windows::UI::Xaml::Controls::SwapChainPanel>(panel), rootUrl) }
    {
    }

    RuntimeUWP::Impl::Impl(winrt::agile_ref<winrt::Windows::UI::Core::CoreWindow> window, const std::string& rootUrl)
        : RuntimeImpl{ /*std::make_unique<SpectreEngine>(GetEngineDescription(window), *this)*/nullptr, rootUrl }
        , m_windowsUiContext{ window }
    {
        // Set initial render output size.
        const auto windowBounds = window.get().Bounds();
        const auto currentDisplayInformation = winrt::Windows::Graphics::Display::DisplayInformation::GetForCurrentView();
        const float dpi = currentDisplayInformation.LogicalDpi();
        UpdateSize(dips_to_pixels(windowBounds.Width, dpi), dips_to_pixels(windowBounds.Height, dpi));

        for (const auto& url : RuntimeUWP::DEFAULT_INITIALIZATION_SCRIPTS)
        {
            RunScript(url);
        }
    }

    RuntimeUWP::Impl::Impl(winrt::Windows::UI::Xaml::Controls::SwapChainPanel panel, const std::string& rootUrl)
        : RuntimeImpl{ /*std::make_unique<SpectreEngine>(GetEngineDescription(panel), *this)*/nullptr, rootUrl }
        , m_windowsUiContext{ panel }
    {
        // Set initial render output size.
        const auto currentDisplayInformation = winrt::Windows::Graphics::Display::DisplayInformation::GetForCurrentView();
        const float dpi = currentDisplayInformation.LogicalDpi();
        UpdateSize(dips_to_pixels(static_cast<float>(panel.ActualWidth()), dpi), dips_to_pixels(static_cast<float>(panel.ActualHeight()), dpi));

        for (const auto& url : RuntimeUWP::DEFAULT_INITIALIZATION_SCRIPTS)
        {
            RunScript(url);
        }
    }

    void RuntimeUWP::Impl::RunScript(const std::string& url)
    {
        auto lock = AcquireTaskLock();
        Task = Task.then(arcana::inline_scheduler, Cancellation(), [url]
        {
            return read_text_async(url);
        }).then(Dispatcher(), Cancellation(), [this, url](const std::string& script)
        {
            RunScriptWithNapi(script, url);
        });
    }

    void RuntimeUWP::Impl::RunScript(const std::string& script, const std::string& url)
    {
        Execute([this, script, url](auto&)
        {
            RunScriptWithNapi(script, url);
        });
    }
}
