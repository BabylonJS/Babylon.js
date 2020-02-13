#include <Babylon/RuntimeAndroid.h>
#include "RuntimeImpl.h"
#include "NativeEngine.h"

namespace Babylon
{

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr, float width, float height)
        : RuntimeAndroid{nativeWindowPtr, ".", width, height} // todo : GetModulePath().parent_path() std::fs experimental not available with ndk
    {
    }

    RuntimeAndroid::RuntimeAndroid(ANativeWindow* nativeWindowPtr, const std::string& rootUrl, float width, float height)
        : Runtime{std::make_unique<RuntimeImpl>(nativeWindowPtr, rootUrl)}
    {
        // OpenGL initialization must happen in the same thread as the rendering.
        // GL context it associated to 1 thread.
        m_impl->Dispatch([width, height, nativeWindowPtr](Napi::Env) {
            NativeEngine::InitializeWindow(nativeWindowPtr, static_cast<uint32_t>(width), static_cast<uint32_t>(height));
        });
    }

    void RuntimeImpl::ThreadProcedure()
    {
        RuntimeImpl::BaseThreadProcedure();
    }

    void RuntimeAndroid::UpdateWindow(float width, float height, ANativeWindow* nativeWindowPtr)
    {
        m_impl->UpdateWindow(width, height, nativeWindowPtr);
    }
}
