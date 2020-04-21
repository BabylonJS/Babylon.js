#include "DeviceInputSystem.h"

namespace Babylon::Plugins
{
    void NativeInput::Impl::DeviceInputSystem::Initialize(Napi::Env env)
    {
        Napi::HandleScope scope{env};

        Napi::Function func
        {
            DefineClass(
                env,
                JS_CONSTRUCTOR_NAME,
                {
                    InstanceAccessor("onDeviceConnected", &DeviceInputSystem::GetOnDeviceConnected, &DeviceInputSystem::SetOnDeviceConnected),
                    InstanceAccessor("onDeviceDisconnected", &DeviceInputSystem::GetOnDeviceDisconnected, &DeviceInputSystem::SetOnDeviceDisconnected),
                    InstanceMethod("pollInput", &DeviceInputSystem::PollInput),
                })
        };

        env.Global().Set(JS_CONSTRUCTOR_NAME, func);
    }

    // TODO: The JavaScript contract is such that the constructor takes an Engine, but really it should take some kind of view id, which should be passed through to NativeInput::GetFromJavaScript.
    // See https://github.com/BabylonJS/BabylonNative/issues/147
    NativeInput::Impl::DeviceInputSystem::DeviceInputSystem(const Napi::CallbackInfo& info)
        : Napi::ObjectWrap<DeviceInputSystem>{info}
        , m_nativeInput{*NativeInput::GetFromJavaScript(info.Env()).m_impl}
        , m_deviceConnectedTicket{m_nativeInput.AddDeviceConnectedCallback([this](const std::string& deviceId) {
            if (!m_onDeviceConnected.IsEmpty())
            {
                Napi::Value napiDeviceId = Napi::String::New(Env(), deviceId);
                m_onDeviceConnected({napiDeviceId});
            }
        })}
        , m_deviceDisconnectedTicket{m_nativeInput.AddDeviceDisconnectedCallback([this](const std::string& deviceId) {
            if (!m_onDeviceDisconnected.IsEmpty())
            {
                Napi::Value napiDeviceId = Napi::String::New(Env(), deviceId);
                m_onDeviceDisconnected({napiDeviceId});
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

    Napi::Value NativeInput::Impl::DeviceInputSystem::PollInput(const Napi::CallbackInfo& info)
    {
        std::string deviceName = info[0].As<Napi::String>().Utf8Value();
        uint32_t inputIndex = info[1].As<Napi::Number>().Uint32Value();
        try
        {
            std::optional<int32_t> inputValue = m_nativeInput.PollInput(deviceName, inputIndex);
            return inputValue ? Napi::Value::From(Env(), *inputValue) : Env().Null();
        }
        catch (const std::runtime_error& exception)
        {
            return Napi::Value::From(Env(), -1);
            // TODO: Re-enable this when exceptions are supported in Napi JSC
            //throw Napi::Error::New(Env(), exception.what());
        }
    }
}
