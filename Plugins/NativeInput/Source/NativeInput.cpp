#include "NativeInput.h"
#include "DeviceInputSystem.h"
#include <Babylon/JsRuntime.h>
#include <Babylon/Plugins/NativeInput.h>

#include <sstream>

namespace Babylon::Plugins
{
    namespace
    {
        constexpr auto JS_NATIVE_INPUT_NAME = "_nativeInput";

        constexpr auto POINTER_BASE_DEVICE_ID = "Pointer";

        constexpr uint32_t POINTER_X_INPUT_INDEX{0};
        constexpr uint32_t POINTER_Y_INPUT_INDEX{1};
        constexpr uint32_t POINTER_BUTTON_BASE_INDEX{2};

        std::string GetPointerDeviceId(uint32_t pointerId)
        {
            std::ostringstream deviceId;
            deviceId << POINTER_BASE_DEVICE_ID << "-" << pointerId;
            return deviceId.str();
        }

        constexpr uint32_t GetPointerButtonInputIndex(uint32_t buttonIndex)
        {
            return POINTER_BUTTON_BASE_INDEX + buttonIndex;
        }
    }

    NativeInput::NativeInput(Napi::Env env)
        : m_impl{ std::make_unique<Impl>(env) }
    {
        Napi::Value nativeInput = Napi::External<NativeInput>::New(env, this, [](Napi::Env, NativeInput* nativeInput) { delete nativeInput; });
        env.Global().Set(JS_NATIVE_INPUT_NAME, nativeInput);
    }

    NativeInput& NativeInput::CreateForJavaScript(Napi::Env env)
    {
        auto* nativeInput = new NativeInput(env);
        return *nativeInput;
    }

    NativeInput& NativeInput::GetFromJavaScript(Napi::Env env)
    {
        return *env.Global().Get(JS_NATIVE_INPUT_NAME).As<Napi::External<NativeInput>>().Data();
    }

    void NativeInput::PointerDown(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y)
    {
        m_impl->PointerDown(pointerId, buttonIndex, x, y);
    }

    void NativeInput::PointerUp(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y)
    {
        m_impl->PointerUp(pointerId, buttonIndex, x, y);
    }

    void NativeInput::PointerMove(uint32_t pointerId, uint32_t x, uint32_t y)
    {
        m_impl->PointerMove(pointerId, x, y);
    }

    NativeInput::Impl::Impl(Napi::Env env)
        : m_runtimeScheduler{JsRuntime::GetFromJavaScript(env)}
    {
        NativeInput::Impl::DeviceInputSystem::Initialize(env);
    }

    void NativeInput::Impl::PointerDown(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y)
    {
        m_runtimeScheduler([pointerId, buttonIndex, x, y, this]() {
            const std::string deviceId{GetPointerDeviceId(pointerId)};
            const uint32_t inputIndex{GetPointerButtonInputIndex(buttonIndex)};
            std::vector<int>& deviceInputs{GetOrCreateInputMap(deviceId, { inputIndex, POINTER_X_INPUT_INDEX, POINTER_Y_INPUT_INDEX })};
            deviceInputs[inputIndex] = 1;
            deviceInputs[POINTER_X_INPUT_INDEX] = x;
            deviceInputs[POINTER_Y_INPUT_INDEX] = y;
        });
    }

    void NativeInput::Impl::PointerUp(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y)
    {
        m_runtimeScheduler([pointerId, buttonIndex, x, y, this]() {
            const std::string deviceId{GetPointerDeviceId(pointerId)};
            const uint32_t inputIndex{GetPointerButtonInputIndex(buttonIndex)};
            std::vector<int>& deviceInputs{GetOrCreateInputMap(deviceId, { inputIndex, POINTER_X_INPUT_INDEX, POINTER_Y_INPUT_INDEX })};
            deviceInputs[inputIndex] = 0;
            deviceInputs[POINTER_X_INPUT_INDEX] = x;
            deviceInputs[POINTER_Y_INPUT_INDEX] = y;

            for (int32_t index = 0; index < deviceInputs.size(); index++)
            {
                if (index != POINTER_X_INPUT_INDEX && index != POINTER_Y_INPUT_INDEX && deviceInputs[index] > 0)
                {
                    return;
                }
            }

            RemoveInputMap(deviceId);
        });
    }

    void NativeInput::Impl::PointerMove(uint32_t pointerId, uint32_t x, uint32_t y)
    {
        m_runtimeScheduler([pointerId, x, y, this]() {
            const std::string deviceId{GetPointerDeviceId(pointerId)};
            std::vector<int>& deviceInputs{GetOrCreateInputMap(deviceId, { POINTER_X_INPUT_INDEX, POINTER_Y_INPUT_INDEX })};
            deviceInputs[POINTER_X_INPUT_INDEX] = x;
            deviceInputs[POINTER_Y_INPUT_INDEX] = y;
        });
    }

    NativeInput::Impl::DeviceStatusChangedCallbackTicket NativeInput::Impl::AddDeviceConnectedCallback(NativeInput::Impl::DeviceStatusChangedCallback&& callback)
    {
        return m_deviceConnectedCallbacks.insert(std::move(callback));
    }

    NativeInput::Impl::DeviceStatusChangedCallbackTicket NativeInput::Impl::AddDeviceDisconnectedCallback(NativeInput::Impl::DeviceStatusChangedCallback&& callback)
    {
        return m_deviceDisconnectedCallbacks.insert(std::move(callback));
    }

    std::optional<int32_t> NativeInput::Impl::PollInput(const std::string& deviceName, uint32_t inputIndex)
    {
        auto it = m_inputs.find(deviceName);
        if (it == m_inputs.end())
        {
            std::ostringstream message;
            message << "Unable to find device " + deviceName;
            throw std::runtime_error{ message.str() };
        }

        const auto& device = it->second;
        if (inputIndex >= device.size())
        {
            std::ostringstream message;
            message << "Unable to find " << inputIndex << " on device " << deviceName;
            throw std::runtime_error{ message.str() };
        }

        int32_t inputValue = device.at(inputIndex);
        if (inputValue >= 0)
        {
            return inputValue;
        }
        else
        {
            return {};
        }
    }

    std::vector<int32_t>& NativeInput::Impl::GetOrCreateInputMap(const std::string& deviceId, const std::vector<uint32_t>& inputIndices)
    {
        uint32_t inputIndex = *std::max_element(inputIndices.begin(), inputIndices.end());

        auto previousSize = m_inputs.size();
        std::vector<int32_t>& deviceInputs{m_inputs[deviceId]};
        auto newSize = m_inputs.size();

        if (newSize != previousSize)
        {
            m_deviceConnectedCallbacks.apply_to_all([deviceId](auto& callback) {
                callback(deviceId);
            });
        }

        deviceInputs.resize(std::max(deviceInputs.size(), static_cast<size_t>(inputIndex + 1)));

        return deviceInputs;
    }

    void NativeInput::Impl::RemoveInputMap(const std::string& deviceId)
    {
        if (m_inputs.erase(deviceId))
        {
            m_deviceDisconnectedCallbacks.apply_to_all([deviceId](auto& callback){
               callback(deviceId);
            });
        }
    }
}
