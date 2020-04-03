#include <Babylon/Plugins/NativeEngine.h>
#include "NativeEngine.h"

#include <NativeWindow.h>

#ifdef NATIVE_ENGINE_XR
#include "NativeXr.h"
#endif

namespace Babylon::Plugins::NativeEngine
{
    void InitializeGraphics(void* windowPtr, size_t width, size_t height)
    {
        Babylon::NativeEngine::InitializeWindow(windowPtr, width, height);
    }

    void Initialize(Napi::Env env)
    {
        Babylon::NativeEngine::Initialize(env);
#ifdef NATIVE_ENGINE_XR
        InitializeNativeXr(env);
#endif
    }

    void Reinitialize(Napi::Env env, void* windowPtr, size_t width, size_t height)
    {
        bgfx::PlatformData pd;
        pd.ndt = nullptr;
        pd.nwh = windowPtr;
        pd.context = nullptr;
        pd.backBuffer = nullptr;
        pd.backBufferDS = nullptr;
        bgfx::setPlatformData(pd);
        bgfx::reset(width, height);

        auto& window = Plugins::Internal::NativeWindow::GetFromJavaScript(env);
        window.Resize(width, height);
    }

    void DeinitializeGraphics()
    {
        Babylon::NativeEngine::DeinitializeWindow();
    }
}
