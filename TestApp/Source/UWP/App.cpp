#include "App.h"

#include <Babylon/Console.h>

#include <pplawait.h>
#include <winrt/Windows.ApplicationModel.h>

#include <filesystem>

using namespace Windows::ApplicationModel;
using namespace Windows::ApplicationModel::Core;
using namespace Windows::ApplicationModel::Activation;
using namespace Windows::UI::Core;
using namespace Windows::UI::Input;
using namespace Windows::System;
using namespace Windows::Foundation;
using namespace Windows::Graphics::Display;

// The main function is only used to initialize our IFrameworkView class.
[Platform::MTAThread]
int main(Platform::Array<Platform::String^>^)
{
    auto direct3DApplicationSource = ref new Direct3DApplicationSource();
    CoreApplication::Run(direct3DApplicationSource);
    return 0;
}

IFrameworkView^ Direct3DApplicationSource::CreateView()
{
    return ref new App();
}

App::App() :
    m_windowClosed{ false },
    m_windowVisible{ true }
{
}

// The first method called when the IFrameworkView is being created.
void App::Initialize(CoreApplicationView^ applicationView)
{
    // Register event handlers for app lifecycle. This example includes Activated, so that we
    // can make the CoreWindow active and start rendering on the window.
    applicationView->Activated +=
        ref new TypedEventHandler<CoreApplicationView^, IActivatedEventArgs^>(this, &App::OnActivated);

    CoreApplication::Suspending +=
        ref new EventHandler<SuspendingEventArgs^>(this, &App::OnSuspending);

    CoreApplication::Resuming +=
        ref new EventHandler<Platform::Object^>(this, &App::OnResuming);
}

// Called when the CoreWindow object is created (or re-created).
void App::SetWindow(CoreWindow^ window)
{
    window->SizeChanged +=
        ref new TypedEventHandler<CoreWindow^, WindowSizeChangedEventArgs^>(this, &App::OnWindowSizeChanged);

    window->VisibilityChanged +=
        ref new TypedEventHandler<CoreWindow^, VisibilityChangedEventArgs^>(this, &App::OnVisibilityChanged);

    window->Closed +=
        ref new TypedEventHandler<CoreWindow^, CoreWindowEventArgs^>(this, &App::OnWindowClosed);

    DisplayInformation^ currentDisplayInformation = DisplayInformation::GetForCurrentView();

    currentDisplayInformation->DpiChanged +=
        ref new TypedEventHandler<DisplayInformation^, Object^>(this, &App::OnDpiChanged);

    currentDisplayInformation->OrientationChanged +=
        ref new TypedEventHandler<DisplayInformation^, Object^>(this, &App::OnOrientationChanged);

    DisplayInformation::DisplayContentsInvalidated +=
        ref new TypedEventHandler<DisplayInformation^, Object^>(this, &App::OnDisplayContentsInvalidated);

    window->PointerMoved +=
        ref new TypedEventHandler<CoreWindow^, PointerEventArgs^>(this, &App::OnPointerMoved);

    window->PointerPressed +=
        ref new TypedEventHandler<CoreWindow^, PointerEventArgs^>(this, &App::OnPointerPressed);

    window->PointerReleased +=
        ref new TypedEventHandler<CoreWindow^, PointerEventArgs^>(this, &App::OnPointerReleased);

    window->KeyDown +=
        ref new TypedEventHandler<CoreWindow^, KeyEventArgs^>(this, &App::OnKeyPressed);
}

// Initializes scene resources, or loads a previously saved app state.
void App::Load(Platform::String^ entryPoint)
{
}

// This method is called after the window becomes active.
void App::Run()
{
    while (!m_windowClosed)
    {
        CoreWindow::GetForCurrentThread()->Dispatcher->ProcessEvents(CoreProcessEventsOption::ProcessOneAndAllPending);
    }
}

// Required for IFrameworkView.
// Terminate events do not cause Uninitialize to be called. It will be called if your IFrameworkView
// class is torn down while the app is in the foreground.
void App::Uninitialize()
{
}

// Application lifecycle event handlers.

void App::OnActivated(CoreApplicationView^ applicationView, IActivatedEventArgs^ args)
{
    // Run() won't start until the CoreWindow is activated.
    CoreWindow::GetForCurrentThread()->Activate();

    if (args->Kind == Activation::ActivationKind::File)
    {
        m_fileActivatedArgs = static_cast<FileActivatedEventArgs^>(args);
    }
    else
    {
        m_fileActivatedArgs = nullptr;
    }

    RestartRuntimeAsync(applicationView->CoreWindow->Bounds);
}

concurrency::task<void> App::RestartRuntimeAsync(Windows::Foundation::Rect bounds)
{
    m_inputBuffer.reset();
    m_runtime.reset();

    std::string appUrl{ "file:///" + std::filesystem::current_path().generic_string() };

    std::string rootUrl{ appUrl };
    if (m_fileActivatedArgs != nullptr)
    {
        auto file = static_cast<Windows::Storage::IStorageFile^>(m_fileActivatedArgs->Files->GetAt(0));
        const auto path = winrt::to_string(file->Path->Data());
        auto parentPath = std::filesystem::path{ path }.parent_path();
        rootUrl = "file:///" + parentPath.generic_string();
    }

    m_runtime = std::make_unique<Babylon::RuntimeUWP>(
        reinterpret_cast<ABI::Windows::UI::Core::ICoreWindow*>(CoreWindow::GetForCurrentThread()), rootUrl);

    m_runtime->Dispatch([](Babylon::Env& env)
    {
        Babylon::Console::CreateInstance(env, [](const char* message, auto)
        {
            OutputDebugStringA(message);
        });
    });

    m_inputBuffer = std::make_unique<InputManager::InputBuffer>(*m_runtime);
    InputManager::Initialize(*m_runtime, *m_inputBuffer);

    m_runtime->LoadScript(appUrl + "/Scripts/babylon.max.js");
    m_runtime->LoadScript(appUrl + "/Scripts/babylon.glTF2FileLoader.js");

    if (m_fileActivatedArgs == nullptr)
    {
        m_runtime->LoadScript("Scripts/experience.js");
    }
    else
    {
        for (unsigned int idx = 0; idx < m_fileActivatedArgs->Files->Size; idx++)
        {
            auto file = static_cast<Windows::Storage::IStorageFile^>(m_fileActivatedArgs->Files->GetAt(idx));
            const auto path = winrt::to_string(file->Path->Data());
            auto text = co_await Windows::Storage::FileIO::ReadTextAsync(file);
            m_runtime->Eval(winrt::to_string(text->Data()), path);
        }

        m_runtime->LoadScript(appUrl + "/Scripts/playground_runner.js");
    }

    DisplayInformation^ displayInformation = DisplayInformation::GetForCurrentView();
    m_displayScale = static_cast<float>(displayInformation->RawPixelsPerViewPixel);

    m_runtime->UpdateSize(bounds.Width * m_displayScale, bounds.Height * m_displayScale);
}

void App::OnSuspending(Platform::Object^ sender, SuspendingEventArgs^ args)
{
    // Save app state after requesting a deferral. Holding a deferral
    // indicates that the application is busy performing suspending operations. Be
    // aware that a deferral may not be held indefinitely. After about five seconds,
    // the app will be forced to exit.
    auto deferral = args->SuspendingOperation->GetDeferral();
    m_runtime->Suspend();
    deferral->Complete();
}

void App::OnResuming(Platform::Object^ sender, Platform::Object^ args)
{
    // Restore any data or state that was unloaded on suspend. By default, data
    // and state are persisted when resuming from suspend. Note that this event
    // does not occur if the app was previously terminated.

    m_runtime->Resume();
}

// Window event handlers.

void App::OnWindowSizeChanged(CoreWindow^ /*sender*/, WindowSizeChangedEventArgs^ args)
{
    m_runtime->UpdateSize(args->Size.Width * m_displayScale, args->Size.Height * m_displayScale);
}

void App::OnVisibilityChanged(CoreWindow^ sender, VisibilityChangedEventArgs^ args)
{
    m_windowVisible = args->Visible;
}

void App::OnWindowClosed(CoreWindow^ sender, CoreWindowEventArgs^ args)
{
    m_windowClosed = true;
}

void App::OnPointerMoved(CoreWindow^, PointerEventArgs^ args)
{
    const auto& point = args->CurrentPoint->RawPosition;
    m_inputBuffer->SetPointerPosition(static_cast<int>(point.X), static_cast<int>(point.Y));
}

void App::OnPointerPressed(CoreWindow^, PointerEventArgs^)
{
    m_inputBuffer->SetPointerDown(true);
}

void App::OnPointerReleased(CoreWindow^, PointerEventArgs^)
{
    m_inputBuffer->SetPointerDown(false);
}

void App::OnKeyPressed(CoreWindow^ window, KeyEventArgs^ args)
{
    if (args->VirtualKey == VirtualKey::R)
    {
        RestartRuntimeAsync(window->Bounds);
    }
}

// DisplayInformation event handlers.

void App::OnDpiChanged(DisplayInformation^ /*sender*/, Object^ /*args*/)
{
    DisplayInformation^ displayInformation = DisplayInformation::GetForCurrentView();
    m_displayScale = static_cast<float>(displayInformation->RawPixelsPerViewPixel);
    // resize event happens after. No need to force resize here.
}

void App::OnOrientationChanged(DisplayInformation^ sender, Object^ args)
{
    // TODO: Implement.
    //m_deviceResources->SetCurrentOrientation(sender->CurrentOrientation);
}

void App::OnDisplayContentsInvalidated(DisplayInformation^ sender, Object^ args)
{
    // TODO: Implement.
    //m_deviceResources->ValidateDevice();
}
