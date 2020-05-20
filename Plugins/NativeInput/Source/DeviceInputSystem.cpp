#include "DeviceInputSystem.h"

namespace Babylon::Plugins
{
    void NativeInput::Impl::DeviceInputSystem::Initialize(Napi::Env env)
    {
        Napi::HandleScope scope{env};

        static constexpr auto JS_CONSTRUCTOR_NAME = "DeviceInputSystem";

        Napi::Function func
        {
            DefineClass(
                env,
                JS_CONSTRUCTOR_NAME,
                {
                    InstanceAccessor("onDeviceConnected", &DeviceInputSystem::GetOnDeviceConnected, &DeviceInputSystem::SetOnDeviceConnected),
                    InstanceAccessor("onDeviceDisconnected", &DeviceInputSystem::GetOnDeviceDisconnected, &DeviceInputSystem::SetOnDeviceDisconnected),
                    InstanceAccessor("onInputChanged", &DeviceInputSystem::GetOnInputChanged, &DeviceInputSystem::SetOnInputChanged),
                    InstanceMethod("pollInput", &DeviceInputSystem::PollInput),
                })
        };

        env.Global().Get(JsRuntime::JS_NATIVE_NAME).As<Napi::Object>().Set(JS_CONSTRUCTOR_NAME, func);
    }

    // TODO: The JavaScript contract is such that the constructor takes an Engine, but really it should take some kind of view id, which should be passed through to NativeInput::GetFromJavaScript.
    // See https://github.com/BabylonJS/BabylonNative/issues/147
    NativeInput::Impl::DeviceInputSystem::DeviceInputSystem(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<DeviceInputSystem>{info}
        , m_nativeInput{*NativeInput::GetFromJavaScript(info.Env()).m_impl}
        , m_deviceConnectedTicket{m_nativeInput.AddDeviceConnectedCallback([this](DeviceType deviceType, int32_t deviceSlot) {
            if (!m_onDeviceConnected.IsEmpty())
            {
                m_onDeviceConnected({
                    Napi::Value::From(Env(), static_cast<uint32_t>(deviceType)),
                    Napi::Value::From(Env(), deviceSlot)
                });
            }
        })}
        , m_deviceDisconnectedTicket{m_nativeInput.AddDeviceDisconnectedCallback([this](DeviceType deviceType, int32_t deviceSlot) {
            if (!m_onDeviceDisconnected.IsEmpty())
            {
                m_onDeviceDisconnected({
                    Napi::Value::From(Env(), static_cast<uint32_t>(deviceType)),
                    Napi::Value::From(Env(), deviceSlot)
                });
            }
        })}
        , m_InputChangedTicket{m_nativeInput.AddInputChangedCallback([this](DeviceType deviceType, int32_t deviceSlot, uint32_t inputIndex, std::optional<int32_t> previousState, std::optional<int32_t> currentState) {
            if (!m_onInputChanged.IsEmpty())
            {
                m_onInputChanged({
                    Napi::Value::From(Env(), static_cast<uint32_t>(deviceType)),
                    Napi::Value::From(Env(), deviceSlot),
                    Napi::Value::From(Env(), inputIndex),
                    previousState ? Napi::Value::From(Env(), *previousState) : Env().Null(),
                    currentState ? Napi::Value::From(Env(), *currentState) : Env().Null()
                });
            }
        })}
    {
    }

    Napi::Value NativeInput::Impl::DeviceInputSystem::GetOnDeviceConnected(const Napi::CallbackInfo&)
    {
        return m_onDeviceConnected.Value();
    }

    void NativeInput::Impl::DeviceInputSystem::SetOnDeviceConnected(const Napi::CallbackInfo&, const Napi::Value& value)
    {
        m_onDeviceConnected = Napi::Persistent(value.As<Napi::Function>());
    }

    Napi::Value NativeInput::Impl::DeviceInputSystem::GetOnDeviceDisconnected(const Napi::CallbackInfo&)
    {
        return m_onDeviceDisconnected.Value();
    }

    void NativeInput::Impl::DeviceInputSystem::SetOnDeviceDisconnected(const Napi::CallbackInfo&, const Napi::Value& value)
    {
        m_onDeviceDisconnected = Napi::Persistent(value.As<Napi::Function>());
    }

    Napi::Value NativeInput::Impl::DeviceInputSystem::GetOnInputChanged(const Napi::CallbackInfo&)
    {
        return m_onInputChanged.Value();
    }

    void NativeInput::Impl::DeviceInputSystem::SetOnInputChanged(const Napi::CallbackInfo&, const Napi::Value& value)
    {
        m_onInputChanged = Napi::Persistent(value.As<Napi::Function>());
    }

    Napi::Value NativeInput::Impl::DeviceInputSystem::PollInput(const Napi::CallbackInfo& info)
    {
        uint32_t deviceType = info[0].As<Napi::Number>().Uint32Value();
        uint32_t deviceSlot = info[1].As<Napi::Number>().Uint32Value();
        uint32_t inputIndex = info[2].As<Napi::Number>().Uint32Value();
        try
        {
            std::optional<int32_t> inputValue = m_nativeInput.PollInput(static_cast<DeviceType>(deviceType), deviceSlot, inputIndex);
            return inputValue ? Napi::Value::From(Env(), *inputValue) : Env().Null();
        }
        catch (const std::runtime_error& exception)
        {
            throw Napi::Error::New(Env(), exception.what());
        }
    }
}
