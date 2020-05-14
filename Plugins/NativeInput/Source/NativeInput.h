#pragma once

#include <Babylon/JsRuntimeScheduler.h>
#include <Babylon/Plugins/NativeInput.h>
#include <arcana/containers/weak_table.h>

#include <optional>
#include <unordered_map>

namespace Babylon::Plugins
{
    class NativeInput::Impl final
    {
    public:
        enum class DeviceType
        {
            Generic = 0,
            Keyboard = 1,
            Mouse = 2,
            Touch = 3,
            DualShock = 4,
            Xbox = 5,
            Switch = 6,
        };

        using DeviceStatusChangedCallback = std::function<void(DeviceType deviceType, int32_t deviceSlot)>;
        using DeviceStatusChangedCallbackTicket = arcana::weak_table<DeviceStatusChangedCallback>::ticket;

        using InputStateChangedCallback = std::function<void(DeviceType deviceType, int32_t deviceSlot, uint32_t inputIndex, std::optional<int32_t> previousState, std::optional<int32_t> currentState)>;
        using InputStateChangedCallbackTicket = arcana::weak_table<InputStateChangedCallback>::ticket;

        Impl(Napi::Env);

        void PointerDown(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y);
        void PointerUp(uint32_t pointerId, uint32_t buttonIndex, uint32_t x, uint32_t y);
        void PointerMove(uint32_t pointerId, uint32_t x, uint32_t y);

        DeviceStatusChangedCallbackTicket AddDeviceConnectedCallback(DeviceStatusChangedCallback&& callback);
        DeviceStatusChangedCallbackTicket AddDeviceDisconnectedCallback(DeviceStatusChangedCallback&& callback);
        InputStateChangedCallbackTicket AddInputChangedCallback(InputStateChangedCallback&& callback);
        const std::optional<int32_t> PollInput(DeviceType deviceType, int32_t deviceSlot, uint32_t inputIndex);

    private:
        using InputMapKey = std::pair<DeviceType, int32_t>;

        struct InputMapKeyHash
        {
            size_t operator()(const InputMapKey& inputMapKey) const
            {
                return std::hash<uint64_t>{}((static_cast<uint64_t>(inputMapKey.first) << (sizeof(uint32_t) * 8)) + static_cast<uint32_t>(inputMapKey.second));
            }
        };

        std::vector<std::optional<int32_t>>& GetOrCreateInputMap(DeviceType deviceType, int32_t deviceSlot, const std::vector<uint32_t>& inputIndices);
        void RemoveInputMap(DeviceType deviceType, int32_t deviceSlot);
        void SetInputState(DeviceType deviceType, int32_t deviceSlot, uint32_t inputIndex, int32_t inputState, std::vector<std::optional<int32_t>>& deviceInputs);

        JsRuntimeScheduler m_runtimeScheduler;
        std::unordered_map<InputMapKey, std::vector<std::optional<int32_t>>, InputMapKeyHash> m_inputs{};
        arcana::weak_table<DeviceStatusChangedCallback> m_deviceConnectedCallbacks{};
        arcana::weak_table<DeviceStatusChangedCallback> m_deviceDisconnectedCallbacks{};
        arcana::weak_table<InputStateChangedCallback> m_inputChangedCallbacks{};

        class DeviceInputSystem;
    };
}
