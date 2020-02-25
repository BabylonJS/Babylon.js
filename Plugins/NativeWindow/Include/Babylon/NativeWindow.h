#pragma once

#include <Babylon/JsRuntime.h>
#include <Babylon/TicketedCollection.h> // TODO: Having this publicly exposed and be in BabylonNativeUtils causes arcana to be publicly exposed. Consider alternatives.

#include <napi/napi.h>

#include <chrono>

namespace Babylon
{
    class NativeWindow : public Napi::ObjectWrap<NativeWindow>
    {
        static constexpr auto JS_NATIVE_WINDOW_NAME = "nativeWindow";

    public:
        static void Initialize(Napi::Env env, void* windowPtr, size_t width, size_t height);
        static NativeWindow& GetFromJavaScript(Napi::Env);

        NativeWindow(const Napi::CallbackInfo& info);

        void Resize(size_t newWidth, size_t newHeight);

        using OnResizeCallback = std::function<void(size_t, size_t)>;
        using OnResizeCallbackTicket = TicketedCollection<OnResizeCallback>::Ticket;
        OnResizeCallbackTicket AddOnResizeCallback(OnResizeCallback&& callback);

        void* GetWindowPtr() const;
        size_t GetWidth() const;
        size_t GetHeight() const;

    private:
        JsRuntime& m_runtime;
        void* m_windowPtr{};
        size_t m_width{};
        size_t m_height{};

        TicketedCollection<OnResizeCallback> m_onResizeCallbacks{};

        static void SetTimeout(const Napi::CallbackInfo& info);
        static Napi::Value DecodeBase64(const Napi::CallbackInfo& info);
        static void AddEventListener(const Napi::CallbackInfo& info);
        static void RemoveEventListener(const Napi::CallbackInfo& info);

        void RecursiveWaitOrCall(std::shared_ptr<Napi::FunctionReference> function, std::chrono::system_clock::time_point whenToRun);
    };
}
