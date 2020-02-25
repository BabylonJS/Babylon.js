#include <Babylon/NativeEngine.h>
#include "NativeEngine.h"

#include <Babylon/NativeWindow.h>

#ifdef NATIVE_ENGINE_XR
#include "NativeXr.h"
#endif

namespace Babylon
{
    void InitializeNativeEngine(JsRuntime& runtime, void* windowPtr, size_t width, size_t height)
    {
        NativeEngine::InitializeWindow(windowPtr, width, height);
        runtime.Dispatch([](Napi::Env env) {
            NativeEngine::Initialize(env);
#ifdef NATIVE_ENGINE_XR
            InitializeNativeXr(env);
#endif
        });
    }

    void ReinitializeNativeEngine(JsRuntime& runtime, void* windowPtr, size_t width, size_t height)
    {
        runtime.Dispatch([windowPtr, width, height](Napi::Env env) {
            bgfx::PlatformData pd;
            pd.ndt = nullptr;
            pd.nwh = windowPtr;
            pd.context = nullptr;
            pd.backBuffer = nullptr;
            pd.backBufferDS = nullptr;
            bgfx::setPlatformData(pd);
            bgfx::reset(width, height);

            auto& window = NativeWindow::GetFromJavaScript(env);
            window.Resize(width, height);
        });
    }
}
