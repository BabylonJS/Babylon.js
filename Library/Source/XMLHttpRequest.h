#pragma once

#include "Common.h"
#include <napi/napi.h>
#include <arcana/threading/task.h>
#include <arcana/type_traits.h>

// Should only be in cpp implementation for UWP version
#include <winrt/Windows.Web.Http.h>

namespace babylon
{
    class RuntimeImpl;

    // TODO: Move these down into the CPP file once the UWP file access bug is fixed.
    namespace XMLHttpRequestTypes
    {
        namespace ResponseType
        {
            constexpr const char* Text = "text";
            constexpr const char* ArrayBuffer = "arraybuffer";
        }

        namespace EventType
        {
            constexpr const char* ReadyStateChange = "readystatechange";
            constexpr const char* Progress = "progress";
            constexpr const char* LoadEnd = "loadend";
        }
    }

    class XMLHttpRequest final : public Napi::ObjectWrap<XMLHttpRequest>
    {
    public:
        static void Initialize(Napi::Env& env, RuntimeImpl& runtimeImpl);

        explicit XMLHttpRequest(const Napi::CallbackInfo& info);

    private:
        static Napi::FunctionReference constructor;

        enum class ReadyState
        {
            Unsent = 0,
            Opened = 1,
            Done = 4,
        };

        Napi::Value GetReadyState(const Napi::CallbackInfo& info);
        Napi::Value GetResponse(const Napi::CallbackInfo& info);
        Napi::Value GetResponseText(const Napi::CallbackInfo& info);
        Napi::Value GetResponseType(const Napi::CallbackInfo& info);
        void SetResponseType(const Napi::CallbackInfo& info, const Napi::Value& value);
        Napi::Value GetResponseURL(const Napi::CallbackInfo& info);
        Napi::Value GetStatus(const Napi::CallbackInfo& info);
        void AddEventListener(const Napi::CallbackInfo& info);
        void RemoveEventListener(const Napi::CallbackInfo& info);
        void Open(const Napi::CallbackInfo& info);
        void Send(const Napi::CallbackInfo& info);

        arcana::task<void, std::exception_ptr> SendAsync();
        arcana::task<void, std::exception_ptr> SendAsyncImpl(); // TODO: Eliminate this function once the UWP file access bug is fixed.
        void SetReadyState(ReadyState readyState);

        RuntimeImpl& m_runtimeImpl;

        ReadyState m_readyState{ ReadyState::Unsent };
        Napi::Reference<Napi::ArrayBuffer> m_response;
        std::string m_responseText;
        std::string m_responseType;
        winrt::Windows::Web::Http::HttpStatusCode m_status{ winrt::Windows::Web::Http::HttpStatusCode::None };
        std::string m_responseURL;
        std::unordered_map<std::string, std::vector<Napi::FunctionReference>> m_eventHandlerRefs;

        std::string m_method;
        std::string m_url;
    };
}
