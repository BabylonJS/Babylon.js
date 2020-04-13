#pragma once

#include <Babylon/JsRuntimeScheduler.h>

#include <napi/napi.h>
#include <UrlLib/UrlLib.h>

#include <unordered_map>

namespace Babylon::Polyfills::Internal
{
    class XMLHttpRequest final : public Napi::ObjectWrap<XMLHttpRequest>
    {
        static constexpr auto JS_XML_HTTP_REQUEST_CONSTRUCTOR_NAME = "XMLHttpRequest";

    public:
        static void Initialize(Napi::Env env);

        explicit XMLHttpRequest(const Napi::CallbackInfo& info);

    private:
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
        void Abort(const Napi::CallbackInfo& info);
        void Open(const Napi::CallbackInfo& info);
        void Send(const Napi::CallbackInfo& info);

        void SetReadyState(ReadyState readyState);

        UrlLib::UrlRequest m_request{};
        JsRuntimeScheduler m_runtimeScheduler;
        ReadyState m_readyState{ReadyState::Unsent};
        std::unordered_map<std::string, std::vector<Napi::FunctionReference>> m_eventHandlerRefs;
    };
}
