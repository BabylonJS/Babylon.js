#pragma once

#include "napi/napi.h"
#include "RuntimeImpl.h"

#include <arcana/containers/ticketed_collection.h>

namespace Babylon
{
    class NativeWindow : public Napi::ObjectWrap<NativeWindow>
    {
    public:
        static Napi::ObjectReference Create(Napi::Env& env, void* windowPtr, size_t width, size_t height);
        static Napi::FunctionReference GetSetTimeoutFunction(Napi::ObjectReference& nativeWindow);
        static Napi::FunctionReference GetAToBFunction(Napi::ObjectReference& nativeWindow);

        NativeWindow(const Napi::CallbackInfo& info);

        void Resize(size_t newWidth, size_t newHeight);

        using OnResizeCallback = std::function<void(size_t, size_t)>;
        using OnResizeCallbackTicket = arcana::ticketed_collection<OnResizeCallback>::ticket;
        OnResizeCallbackTicket AddOnResizeCallback(OnResizeCallback&& callback);

        void* GetWindowPtr() const;
        size_t GetWidth() const;
        size_t GetHeight() const;

    private:
        RuntimeImpl& m_runtimeImpl;
        void* m_windowPtr{};
        size_t m_width{};
        size_t m_height{};

        std::mutex m_mutex{};
        arcana::ticketed_collection<OnResizeCallback> m_onResizeCallbacks{};

        static void SetTimeout(const Napi::CallbackInfo& info);
        static Napi::Value DecodeBase64(const Napi::CallbackInfo& info);

        void RecursiveWaitOrCall(std::shared_ptr<Napi::FunctionReference> function, std::chrono::system_clock::time_point whenToRun);
    };
}
