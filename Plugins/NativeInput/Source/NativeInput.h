#pragma once

#include <Babylon/JsRuntimeScheduler.h>
#include <Babylon/Plugins/NativeInput.h>
#include <arcana/containers/weak_table.h>

#include <optional>
#include <unordered_map>

namespace Babylon::Plugins
{
    class NativeInput::Impl
    {
    public:
        using DeviceStatusChangedCallback = std::function<void(const std::string&)>;
        using DeviceStatusChangedCallbackTicket = arcana::weak_table<DeviceStatusChangedCallback>::ticket;

        Impl(Napi::Env);

        void PointerDown(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y);
        void PointerUp(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y);
        void PointerMove(uint32_t pointerId, uint32_t x, uint32_t y);

        DeviceStatusChangedCallbackTicket AddDeviceConnectedCallback(DeviceStatusChangedCallback&& callback);
        DeviceStatusChangedCallbackTicket AddDeviceDisconnectedCallback(DeviceStatusChangedCallback&& callback);
        std::optional<int32_t> PollInput(const std::string& deviceName, uint32_t inputIndex);

    private:
        std::vector<int32_t>& GetOrCreateInputMap(const std::string& deviceId, const std::vector<uint32_t>& inputIndices);
        void RemoveInputMap(const std::string& deviceId);

        JsRuntimeScheduler m_runtimeScheduler;
        std::unordered_map<std::string, std::vector<int32_t>> m_inputs{};
        arcana::weak_table<DeviceStatusChangedCallback> m_deviceConnectedCallbacks{};
        arcana::weak_table<DeviceStatusChangedCallback> m_deviceDisconnectedCallbacks{};

        class DeviceInputSystem;
    };
}
