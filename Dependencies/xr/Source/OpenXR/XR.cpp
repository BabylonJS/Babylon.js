#include <XR.h>

#include <XrPlatform.h>

#include <assert.h>
#include <optional>
#include <arcana/threading/task.h>

namespace xr
{
    namespace
    {
        struct SupportedExtensions
        {
            SupportedExtensions()
                : Names{}
            {
                uint32_t extensionCount{};
                XrCheck(xrEnumerateInstanceExtensionProperties(nullptr, 0, &extensionCount, nullptr));
                std::vector<XrExtensionProperties> extensionProperties(extensionCount, { XR_TYPE_EXTENSION_PROPERTIES });
                XrCheck(xrEnumerateInstanceExtensionProperties(nullptr, extensionCount, &extensionCount, extensionProperties.data()));

                // D3D11 extension is required for this sample, so check if it's supported.
                for (const char* extensionName : REQUIRED_EXTENSIONS)
                {
                    if (!TryEnableExtension(extensionName, extensionProperties))
                    {
                        throw std::runtime_error{ "Required extension not supported" };
                    }
                }

                // Additional optional extensions for enhanced functionality. Track whether enabled in m_optionalExtensions.
                DepthExtensionSupported = TryEnableExtension(XR_KHR_COMPOSITION_LAYER_DEPTH_EXTENSION_NAME, extensionProperties);
                UnboundedRefSpaceSupported = TryEnableExtension(XR_MSFT_UNBOUNDED_REFERENCE_SPACE_EXTENSION_NAME, extensionProperties);
                SpatialAnchorSupported = TryEnableExtension(XR_MSFT_SPATIAL_ANCHOR_EXTENSION_NAME, extensionProperties);
            }

            std::vector<const char*> Names{};
            bool DepthExtensionSupported{ false };
            bool UnboundedRefSpaceSupported{ false };
            bool SpatialAnchorSupported{ false };

        private:
            bool TryEnableExtension(
                const char* extensionName,
                const std::vector<XrExtensionProperties>& extensionProperties)
            {
                for (const auto& extensionProperty : extensionProperties)
                {
                    if (strcmp(extensionProperty.extensionName, extensionName) == 0)
                    {
                        Names.push_back(extensionName);
                        return true;
                    }
                }
                return false;
            };
        };

        uint32_t AquireAndWaitForSwapchainImage(XrSwapchain handle)
        {
            uint32_t swapchainImageIndex;
            XrSwapchainImageAcquireInfo acquireInfo{ XR_TYPE_SWAPCHAIN_IMAGE_ACQUIRE_INFO };
            XrCheck(xrAcquireSwapchainImage(handle, &acquireInfo, &swapchainImageIndex));

            XrSwapchainImageWaitInfo waitInfo{ XR_TYPE_SWAPCHAIN_IMAGE_WAIT_INFO };
            waitInfo.timeout = XR_INFINITE_DURATION;
            XrCheck(xrWaitSwapchainImage(handle, &waitInfo));

            return swapchainImageIndex;
        };
    }

    struct System::Impl
    {
        static constexpr XrFormFactor FORM_FACTOR{ XR_FORM_FACTOR_HEAD_MOUNTED_DISPLAY };
        static constexpr XrViewConfigurationType VIEW_CONFIGURATION_TYPE{ XR_VIEW_CONFIGURATION_TYPE_PRIMARY_STEREO };
        static constexpr uint32_t STEREO_VIEW_COUNT{ 2 }; // PRIMARY_STEREO view configuration always has 2 views

        XrInstance Instance{ XR_NULL_HANDLE };
        XrSystemId SystemId{ XR_NULL_SYSTEM_ID };

        std::unique_ptr<SupportedExtensions> Extensions{};

        XrEnvironmentBlendMode EnvironmentBlendMode{};

        std::string ApplicationName{};

        Impl(const std::string& applicationName)
            : ApplicationName{ applicationName }
        {}

        bool IsInitialized() const
        {
            return Instance != XR_NULL_HANDLE && SystemId != XR_NULL_SYSTEM_ID;
        }

        bool TryInitialize()
        {
            assert(!IsInitialized());

            if (Instance == XR_NULL_HANDLE)
            {
                Extensions = std::make_unique<SupportedExtensions>();
                InitializeXrInstance();
            }

            assert(Extensions != nullptr);
            assert(SystemId == XR_NULL_SYSTEM_ID);

            return TryInitializeXrSystemIdAndBlendMode();
        }

    private:
        // Phase one of initialization. Cannot fail without crashing.
        void InitializeXrInstance()
        {
            XrInstanceCreateInfo createInfo{ XR_TYPE_INSTANCE_CREATE_INFO };
            createInfo.enabledExtensionCount = static_cast<uint32_t>(Extensions->Names.size());
            createInfo.enabledExtensionNames = Extensions->Names.data();
            createInfo.applicationInfo = { "", 1, "OpenXR Sample", 1, XR_CURRENT_API_VERSION };
            strcpy_s(createInfo.applicationInfo.applicationName, ApplicationName.c_str());
            XrCheck(xrCreateInstance(&createInfo, &Instance));
        }

        // Phase two of initialization. Can fail and be retried without crashing.
        bool TryInitializeXrSystemIdAndBlendMode()
        {
            XrSystemGetInfo systemInfo{ XR_TYPE_SYSTEM_GET_INFO };
            systemInfo.formFactor = FORM_FACTOR;

            XrResult result = xrGetSystem(Instance, &systemInfo, &SystemId);
            if (result == XR_ERROR_FORM_FACTOR_UNAVAILABLE)
            {
                SystemId = XR_NULL_SYSTEM_ID;
                return false;
            }
            else if(!XR_SUCCEEDED(result))
            {
                throw std::runtime_error{ "SystemId initialization failed with unexpected result type." };
            }

            // Find the available environment blend modes.
            uint32_t count;
            XrCheck(xrEnumerateEnvironmentBlendModes(Instance, SystemId, VIEW_CONFIGURATION_TYPE, 0, &count, nullptr));
            std::vector<XrEnvironmentBlendMode> environmentBlendModes(count);
            XrCheck(xrEnumerateEnvironmentBlendModes(Instance, SystemId, VIEW_CONFIGURATION_TYPE, count, &count, environmentBlendModes.data()));

            // Automatically choose the system's preferred blend mode, since specifying the app's 
            // preferred blend mode is currently not supported.
            assert(environmentBlendModes.size() > 0);
            EnvironmentBlendMode = environmentBlendModes[0];

            return true;
        }
    };

    struct System::Session::Impl
    {
        const System::Impl& HmdImpl;
        XrSession Session{ XR_NULL_HANDLE };

        XrSpace SceneSpace{ XR_NULL_HANDLE };
        XrReferenceSpaceType SceneSpaceType{};

        static constexpr uint32_t LeftSide = 0;
        static constexpr uint32_t RightSide = 1;

        struct Swapchain
        {
            XrSwapchain Handle{};
            SwapchainFormat Format{};
            int32_t Width{ 0 };
            int32_t Height{ 0 };
            uint32_t ArraySize{ 0 };
            std::vector<SwapchainImage> Images{};
        };

        struct
        {
            std::vector<XrView> Views{};
            std::vector<XrViewConfigurationView> ConfigViews{};
            std::vector<Swapchain> ColorSwapchains{};
            std::vector<Swapchain> DepthSwapchains{};
            std::vector<XrCompositionLayerProjectionView> ProjectionLayerViews{};
            std::vector<XrCompositionLayerDepthInfoKHR> DepthInfoViews{};
            std::vector<Frame::View> ActiveFrameViews{};
        } RenderResources{};

        struct
        {
            static constexpr char* DEFAULT_XR_ACTION_SET_NAME{ "default_xr_action_set" };
            static constexpr char* DEFAULT_XR_ACTION_SET_LOCALIZED_NAME{ "Default XR Action Set" };
            XrActionSet ActionSet{};

            static constexpr std::array<const char*, 2> CONTROLLER_SUBACTION_PATH_PREFIXES
            {
                "/user/hand/left",
                "/user/hand/right"
            };
            std::array<XrPath, CONTROLLER_SUBACTION_PATH_PREFIXES.size()> ControllerSubactionPaths{};

            static constexpr char* CONTROLLER_GET_GRIP_POSE_ACTION_NAME{ "controller_get_pose_action" };
            static constexpr char* CONTROLLER_GET_GRIP_POSE_ACTION_LOCALIZED_NAME{ "Controller Pose" };
            static constexpr char* CONTROLLER_GET_GRIP_POSE_PATH_SUFFIX{ "/input/grip/pose" };
            XrAction ControllerGetGripPoseAction{};
            std::array<XrSpace, CONTROLLER_SUBACTION_PATH_PREFIXES.size()> ControllerGripPoseSpaces{};

            static constexpr char* CONTROLLER_GET_AIM_POSE_ACTION_NAME{ "controller_get_aim_action" };
            static constexpr char* CONTROLLER_GET_AIM_POSE_ACTION_LOCALIZED_NAME{ "Controller Aim" };
            static constexpr char* CONTROLLER_GET_AIM_POSE_PATH_SUFFIX{ "/input/aim/pose" };
            XrAction ControllerGetAimPoseAction{};
            std::array<XrSpace, CONTROLLER_SUBACTION_PATH_PREFIXES.size()> ControllerAimPoseSpaces{};

            static constexpr char* DEFAULT_XR_INTERACTION_PROFILE{ "/interaction_profiles/khr/simple_controller" };

            std::vector<Frame::InputSource> ActiveInputSources{};
        } ActionResources{};

        float DepthNearZ{ DEFAULT_DEPTH_NEAR_Z };
        float DepthFarZ{ DEFAULT_DEPTH_FAR_Z };

        XrSessionState SessionState{ XR_SESSION_STATE_UNKNOWN };

        Impl(System::Impl& hmdImpl, void* graphicsContext)
            : HmdImpl{ hmdImpl }
        {
            assert(HmdImpl.IsInitialized());
            auto instance = HmdImpl.Instance;
            auto systemId = HmdImpl.SystemId;

            // Create the session
            auto graphicsBinding = CreateGraphicsBinding(instance, systemId, graphicsContext);
            XrSessionCreateInfo createInfo{ XR_TYPE_SESSION_CREATE_INFO };
            createInfo.next = &graphicsBinding;
            createInfo.systemId = systemId;
            XrCheck(xrCreateSession(instance, &createInfo, &Session));

            // Initialize scene space
            if (HmdImpl.Extensions->UnboundedRefSpaceSupported)
            {
                SceneSpaceType = XR_REFERENCE_SPACE_TYPE_UNBOUNDED_MSFT;
            }
            else
            {
                SceneSpaceType = XR_REFERENCE_SPACE_TYPE_LOCAL;
            }
            XrReferenceSpaceCreateInfo spaceCreateInfo{ XR_TYPE_REFERENCE_SPACE_CREATE_INFO };
            spaceCreateInfo.referenceSpaceType = SceneSpaceType;
            spaceCreateInfo.poseInReferenceSpace = IDENTITY_TRANSFORM;
            XrCheck(xrCreateReferenceSpace(Session, &spaceCreateInfo, &SceneSpace));

            InitializeRenderResources(instance, systemId);
            InitializeActionResources(instance);
        }

        std::unique_ptr<System::Session::Frame> GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession)
        {
            ProcessEvents(shouldEndSession, shouldRestartSession);

            if (!shouldEndSession)
            {
                return std::make_unique<Frame>(*this);
            }
            else
            {
                return nullptr;
            }
        }

        void RequestEndSession()
        {
            xrRequestExitSession(Session);
        }

        Size GetWidthAndHeightForViewIndex(size_t viewIndex) const
        {
            const auto& swapchain = RenderResources.ColorSwapchains[viewIndex];
            return{ static_cast<size_t>(swapchain.Width), static_cast<size_t>(swapchain.Height) };
        }

    private:
        static constexpr XrPosef IDENTITY_TRANSFORM{ XrQuaternionf{ 0.f, 0.f, 0.f, 1.f }, XrVector3f{ 0.f, 0.f, 0.f } };

        void InitializeRenderResources(XrInstance instance, XrSystemId systemId)
        {
            // Read graphics properties for preferred swapchain length and logging.
            XrSystemProperties systemProperties{ XR_TYPE_SYSTEM_PROPERTIES };
            XrCheck(xrGetSystemProperties(instance, systemId, &systemProperties));

            // Select color and depth swapchain pixel formats
            SwapchainFormat colorSwapchainFormat;
            SwapchainFormat depthSwapchainFormat;
            SelectSwapchainPixelFormats(colorSwapchainFormat, depthSwapchainFormat);

            // Query and cache view configuration views. Two-call idiom.
            uint32_t viewCount;
            XrCheck(xrEnumerateViewConfigurationViews(instance, systemId, HmdImpl.VIEW_CONFIGURATION_TYPE, 0, &viewCount, nullptr));
            assert(viewCount == HmdImpl.STEREO_VIEW_COUNT);
            RenderResources.ConfigViews.resize(viewCount, { XR_TYPE_VIEW_CONFIGURATION_VIEW });
            XrCheck(xrEnumerateViewConfigurationViews(instance, systemId, HmdImpl.VIEW_CONFIGURATION_TYPE, viewCount, &viewCount, RenderResources.ConfigViews.data()));

            // Create all the swapchains.
            for (uint32_t idx = 0; idx < viewCount; ++idx)
            {
                const XrViewConfigurationView& view = RenderResources.ConfigViews[idx];
                RenderResources.ColorSwapchains.push_back(
                    CreateSwapchain(Session,
                        colorSwapchainFormat,
                        view.recommendedImageRectWidth,
                        view.recommendedImageRectHeight,
                        1,
                        view.recommendedSwapchainSampleCount,
                        0,
                        XR_SWAPCHAIN_USAGE_SAMPLED_BIT | XR_SWAPCHAIN_USAGE_COLOR_ATTACHMENT_BIT));
                RenderResources.DepthSwapchains.push_back(
                    CreateSwapchain(Session,
                        depthSwapchainFormat,
                        view.recommendedImageRectWidth,
                        view.recommendedImageRectHeight,
                        1,
                        view.recommendedSwapchainSampleCount,
                        0,
                        XR_SWAPCHAIN_USAGE_SAMPLED_BIT | XR_SWAPCHAIN_USAGE_DEPTH_STENCIL_ATTACHMENT_BIT));
            }

            // Pre-allocate the views, since we know how many there will be.
            RenderResources.Views.resize(viewCount, { XR_TYPE_VIEW });
        }

        void InitializeActionResources(XrInstance instance)
        {
            // Create action set
            XrActionSetCreateInfo actionSetInfo{ XR_TYPE_ACTION_SET_CREATE_INFO };
            std::strcpy(actionSetInfo.actionSetName, ActionResources.DEFAULT_XR_ACTION_SET_NAME);
            std::strcpy(actionSetInfo.localizedActionSetName, ActionResources.DEFAULT_XR_ACTION_SET_LOCALIZED_NAME);
            XrCheck(xrCreateActionSet(instance, &actionSetInfo, &ActionResources.ActionSet));

            // Cache paths for subactions
            for (size_t idx = 0; idx < ActionResources.CONTROLLER_SUBACTION_PATH_PREFIXES.size(); ++idx)
            {
                XrCheck(xrStringToPath(instance, ActionResources.CONTROLLER_SUBACTION_PATH_PREFIXES[idx], &ActionResources.ControllerSubactionPaths[idx]));
            }

            std::vector<XrActionSuggestedBinding> bindings{};

            // Create controller get grip pose action, suggested bindings, and spaces
            {
                XrActionCreateInfo actionInfo{ XR_TYPE_ACTION_CREATE_INFO };
                actionInfo.actionType = XR_ACTION_TYPE_POSE_INPUT;
                strcpy_s(actionInfo.actionName, ActionResources.CONTROLLER_GET_GRIP_POSE_ACTION_NAME);
                strcpy_s(actionInfo.localizedActionName, ActionResources.CONTROLLER_GET_GRIP_POSE_ACTION_LOCALIZED_NAME);
                actionInfo.countSubactionPaths = static_cast<uint32_t>(ActionResources.ControllerSubactionPaths.size());
                actionInfo.subactionPaths = ActionResources.ControllerSubactionPaths.data();
                XrCheck(xrCreateAction(ActionResources.ActionSet, &actionInfo, &ActionResources.ControllerGetGripPoseAction));
                // For each controller subaction
                for (size_t idx = 0; idx < ActionResources.CONTROLLER_SUBACTION_PATH_PREFIXES.size(); ++idx)
                {
                    // Create suggested binding
                    std::string path{ ActionResources.CONTROLLER_SUBACTION_PATH_PREFIXES[idx] };
                    path.append(ActionResources.CONTROLLER_GET_GRIP_POSE_PATH_SUFFIX);
                    bindings.push_back({ ActionResources.ControllerGetGripPoseAction });
                    XrCheck(xrStringToPath(instance, path.data(), &bindings.back().binding));

                    // Create subaction space
                    XrActionSpaceCreateInfo actionSpaceCreateInfo{ XR_TYPE_ACTION_SPACE_CREATE_INFO };
                    actionSpaceCreateInfo.action = ActionResources.ControllerGetGripPoseAction;
                    actionSpaceCreateInfo.poseInActionSpace = IDENTITY_TRANSFORM;
                    actionSpaceCreateInfo.subactionPath = ActionResources.ControllerSubactionPaths[idx];
                    XrCheck(xrCreateActionSpace(Session, &actionSpaceCreateInfo, &ActionResources.ControllerGripPoseSpaces[idx]));
                }
            }

            // Create controller controller get aim pose action, suggested bindings, and spaces
            {
                XrActionCreateInfo actionInfo{ XR_TYPE_ACTION_CREATE_INFO };
                actionInfo.actionType = XR_ACTION_TYPE_POSE_INPUT;
                strcpy_s(actionInfo.actionName, ActionResources.CONTROLLER_GET_AIM_POSE_ACTION_NAME);
                strcpy_s(actionInfo.localizedActionName, ActionResources.CONTROLLER_GET_AIM_POSE_ACTION_LOCALIZED_NAME);
                actionInfo.countSubactionPaths = static_cast<uint32_t>(ActionResources.ControllerSubactionPaths.size());
                actionInfo.subactionPaths = ActionResources.ControllerSubactionPaths.data();
                XrCheck(xrCreateAction(ActionResources.ActionSet, &actionInfo, &ActionResources.ControllerGetAimPoseAction));
                // For each controller subaction
                for (size_t idx = 0; idx < ActionResources.CONTROLLER_SUBACTION_PATH_PREFIXES.size(); ++idx)
                {
                    // Create suggested binding
                    std::string path{ ActionResources.CONTROLLER_SUBACTION_PATH_PREFIXES[idx] };
                    path.append(ActionResources.CONTROLLER_GET_AIM_POSE_PATH_SUFFIX);
                    bindings.push_back({ ActionResources.ControllerGetAimPoseAction });
                    XrCheck(xrStringToPath(instance, path.data(), &bindings.back().binding));

                    // Create subaction space
                    XrActionSpaceCreateInfo actionSpaceCreateInfo{ XR_TYPE_ACTION_SPACE_CREATE_INFO };
                    actionSpaceCreateInfo.action = ActionResources.ControllerGetAimPoseAction;
                    actionSpaceCreateInfo.poseInActionSpace = IDENTITY_TRANSFORM;
                    actionSpaceCreateInfo.subactionPath = ActionResources.ControllerSubactionPaths[idx];
                    XrCheck(xrCreateActionSpace(Session, &actionSpaceCreateInfo, &ActionResources.ControllerAimPoseSpaces[idx]));
                }
            }

            // Provide suggested bindings to instance
            XrInteractionProfileSuggestedBinding suggestedBindings{ XR_TYPE_INTERACTION_PROFILE_SUGGESTED_BINDING };
            XrCheck(xrStringToPath(instance, ActionResources.DEFAULT_XR_INTERACTION_PROFILE, &suggestedBindings.interactionProfile));
            suggestedBindings.suggestedBindings = bindings.data();
            suggestedBindings.countSuggestedBindings = (uint32_t)bindings.size();
            XrCheck(xrSuggestInteractionProfileBindings(instance, &suggestedBindings));

            XrSessionActionSetsAttachInfo attachInfo{ XR_TYPE_SESSION_ACTION_SETS_ATTACH_INFO };
            attachInfo.countActionSets = 1;
            attachInfo.actionSets = &ActionResources.ActionSet;
            XrCheck(xrAttachSessionActionSets(Session, &attachInfo));
        }

        Swapchain CreateSwapchain(XrSession session,
            SwapchainFormat format,
            int32_t width,
            int32_t height,
            uint32_t arraySize,
            uint32_t sampleCount,
            XrSwapchainCreateFlags createFlags,
            XrSwapchainUsageFlags usageFlags)
        {
            Swapchain swapchain;
            swapchain.Format = format;
            swapchain.Width = width;
            swapchain.Height = height;
            swapchain.ArraySize = arraySize;

            XrSwapchainCreateInfo swapchainCreateInfo{ XR_TYPE_SWAPCHAIN_CREATE_INFO };
            swapchainCreateInfo.arraySize = arraySize;
            swapchainCreateInfo.format = format;
            swapchainCreateInfo.width = width;
            swapchainCreateInfo.height = height;
            swapchainCreateInfo.mipCount = 1;
            swapchainCreateInfo.faceCount = 1;
            swapchainCreateInfo.sampleCount = sampleCount;
            swapchainCreateInfo.createFlags = createFlags;
            swapchainCreateInfo.usageFlags = usageFlags;

            XrCheck(xrCreateSwapchain(session, &swapchainCreateInfo, &swapchain.Handle));

            uint32_t chainLength;
            XrCheck(xrEnumerateSwapchainImages(swapchain.Handle, 0, &chainLength, nullptr));
            swapchain.Images.resize(chainLength, { SWAPCHAIN_IMAGE_TYPE_ENUM });
            XrCheck(xrEnumerateSwapchainImages(swapchain.Handle, static_cast<uint32_t>(swapchain.Images.size()), &chainLength,
                reinterpret_cast<XrSwapchainImageBaseHeader*>(swapchain.Images.data())));

            return swapchain;
        }

        void SelectSwapchainPixelFormats(SwapchainFormat& colorFormat, SwapchainFormat& depthFormat)
        {
            // Query runtime preferred swapchain formats. Two-call idiom.
            uint32_t swapchainFormatCount;
            XrCheck(xrEnumerateSwapchainFormats(Session, 0, &swapchainFormatCount, nullptr));
            std::vector<int64_t> swapchainFormats(swapchainFormatCount);
            XrCheck(xrEnumerateSwapchainFormats(Session, static_cast<uint32_t>(swapchainFormats.size()), &swapchainFormatCount, swapchainFormats.data()));

            auto colorFormatPtr = std::find_first_of(
                std::begin(swapchainFormats),
                std::end(swapchainFormats),
                std::begin(SUPPORTED_COLOR_FORMATS),
                std::end(SUPPORTED_COLOR_FORMATS));
            if (colorFormatPtr == std::end(swapchainFormats))
            {
                throw std::runtime_error{ "No runtime swapchain format is supported for color." };
            }

            auto depthFormatPtr = std::find_first_of(
                std::begin(swapchainFormats),
                std::end(swapchainFormats),
                std::begin(SUPPORTED_DEPTH_FORMATS),
                std::end(SUPPORTED_DEPTH_FORMATS));
            if (depthFormatPtr == std::end(swapchainFormats))
            {
                throw std::runtime_error{ "No runtime swapchain format is supported for depth." };
            }

            colorFormat = static_cast<SwapchainFormat>(*colorFormatPtr);
            depthFormat = static_cast<SwapchainFormat>(*depthFormatPtr);
        }

        bool TryReadNextEvent(XrEventDataBuffer& buffer) const
        {
            // Reset buffer header for every xrPollEvent function call.
            buffer = { XR_TYPE_EVENT_DATA_BUFFER };
            const XrResult xr = xrPollEvent(HmdImpl.Instance, &buffer);
            return xr != XR_EVENT_UNAVAILABLE;
        }

        void ProcessSessionState(bool& exitRenderLoop, bool& requestRestart)
        {
            switch (SessionState)
            {
            case XR_SESSION_STATE_READY:
            {
                assert(Session != XR_NULL_HANDLE);
                XrSessionBeginInfo sessionBeginInfo{ XR_TYPE_SESSION_BEGIN_INFO };
                sessionBeginInfo.primaryViewConfigurationType = HmdImpl.VIEW_CONFIGURATION_TYPE;
                XrCheck(xrBeginSession(Session, &sessionBeginInfo));
                break;
            }
            case XR_SESSION_STATE_STOPPING:
                XrCheck(xrEndSession(Session));
                break;
            case XR_SESSION_STATE_EXITING:
                // Do not attempt to restart because user closed this session.
                exitRenderLoop = true;
                requestRestart = false;
                break;
            case XR_SESSION_STATE_LOSS_PENDING:
                // Poll for a new systemId
                exitRenderLoop = true;
                requestRestart = true;
                break;
            }
        }

        void ProcessEvents(bool& exitRenderLoop, bool& requestRestart)
        {
            exitRenderLoop = false;
            requestRestart = false;

            XrEventDataBuffer buffer{ XR_TYPE_EVENT_DATA_BUFFER };
            XrEventDataBaseHeader* header = reinterpret_cast<XrEventDataBaseHeader*>(&buffer);

            // Process all pending messages.
            while (TryReadNextEvent(buffer))
            {
                switch (header->type)
                {
                case XR_TYPE_EVENT_DATA_INSTANCE_LOSS_PENDING:
                    exitRenderLoop = true;
                    requestRestart = false;
                    return;
                case XR_TYPE_EVENT_DATA_SESSION_STATE_CHANGED:
                    const auto stateEvent = *reinterpret_cast<const XrEventDataSessionStateChanged*>(header);
                    assert(Session != XR_NULL_HANDLE && Session == stateEvent.session);
                    SessionState = stateEvent.state;
                    ProcessSessionState(exitRenderLoop, requestRestart);
                    break;
                case XR_TYPE_EVENT_DATA_REFERENCE_SPACE_CHANGE_PENDING:
                case XR_TYPE_EVENT_DATA_INTERACTION_PROFILE_CHANGED:
                default:
                    // DEBUG_PRINT("Ignoring event type %d", header->type);
                    break;
                }
            }
        }
    };

    struct System::Session::Frame::Impl
    {
        Impl(Session::Impl& sessionImpl)
            : sessionImpl{sessionImpl}
        {
        }

        Session::Impl& sessionImpl;
        bool shouldRender{};
        int64_t displayTime{};
    };

    System::Session::Frame::Frame(Session::Impl& sessionImpl)
        : Views{ sessionImpl.RenderResources.ActiveFrameViews }
        , InputSources{ sessionImpl.ActionResources.ActiveInputSources }
        , m_impl{ std::make_unique<System::Session::Frame::Impl>(sessionImpl) }
    {
        auto session = m_impl->sessionImpl.Session;

        XrFrameWaitInfo frameWaitInfo{ XR_TYPE_FRAME_WAIT_INFO };
        XrFrameState frameState{ XR_TYPE_FRAME_STATE };
        XrCheck(xrWaitFrame(session, &frameWaitInfo, &frameState));
        m_impl->shouldRender = frameState.shouldRender;
        m_impl->displayTime = frameState.predictedDisplayTime;

        XrFrameBeginInfo frameBeginInfo{ XR_TYPE_FRAME_BEGIN_INFO };
        XrCheck(xrBeginFrame(session, &frameBeginInfo));

        auto& renderResources = m_impl->sessionImpl.RenderResources;

        // Only render when session is visible. otherwise submit zero layers
        if (m_impl->shouldRender)
        {
            uint32_t viewCapacityInput = static_cast<uint32_t>(renderResources.Views.size());
            uint32_t viewCountOutput;
        
            XrViewState viewState{ XR_TYPE_VIEW_STATE };
            XrViewLocateInfo viewLocateInfo{ XR_TYPE_VIEW_LOCATE_INFO };
            viewLocateInfo.viewConfigurationType = System::Impl::VIEW_CONFIGURATION_TYPE;
            viewLocateInfo.displayTime = m_impl->displayTime;
            viewLocateInfo.space = m_impl->sessionImpl.SceneSpace;
            XrCheck(xrLocateViews(session, &viewLocateInfo, &viewState, viewCapacityInput, &viewCountOutput, renderResources.Views.data()));
            assert(viewCountOutput == viewCapacityInput);
            assert(viewCountOutput == renderResources.ConfigViews.size());
            assert(viewCountOutput == renderResources.ColorSwapchains.size());
            assert(viewCountOutput == renderResources.DepthSwapchains.size());
        
            renderResources.ProjectionLayerViews.resize(viewCountOutput);
            if (m_impl->sessionImpl.HmdImpl.Extensions->DepthExtensionSupported)
            {
                renderResources.DepthInfoViews.resize(viewCountOutput);
            }

            Views.resize(viewCountOutput);
        
            // Prepare rendering parameters of each view for swapchain texture arrays
            for (uint32_t idx = 0; idx < viewCountOutput; ++idx)
            {
                const auto& colorSwapchain = renderResources.ColorSwapchains[idx];
                const auto& depthSwapchain = renderResources.DepthSwapchains[idx];

                // Use the full range of recommended image size to achieve optimum resolution
                const XrRect2Di imageRect = { {0, 0}, { colorSwapchain.Width, colorSwapchain.Height } };
                assert(colorSwapchain.Width == depthSwapchain.Width);
                assert(colorSwapchain.Height == depthSwapchain.Height);

                const uint32_t colorSwapchainImageIndex = AquireAndWaitForSwapchainImage(colorSwapchain.Handle);
                const uint32_t depthSwapchainImageIndex = AquireAndWaitForSwapchainImage(depthSwapchain.Handle);

                // Populate the struct that consuming code will use for rendering.
                auto& view = Views[idx];
                view.Space.Pose.Position.X = renderResources.Views[idx].pose.position.x;
                view.Space.Pose.Position.Y = renderResources.Views[idx].pose.position.y;
                view.Space.Pose.Position.Z = renderResources.Views[idx].pose.position.z;
                view.Space.Pose.Orientation.X = renderResources.Views[idx].pose.orientation.x;
                view.Space.Pose.Orientation.Y = renderResources.Views[idx].pose.orientation.y;
                view.Space.Pose.Orientation.Z = renderResources.Views[idx].pose.orientation.z;
                view.Space.Pose.Orientation.W = renderResources.Views[idx].pose.orientation.w;
                view.FieldOfView.AngleUp = renderResources.Views[idx].fov.angleUp;
                view.FieldOfView.AngleDown = renderResources.Views[idx].fov.angleDown;
                view.FieldOfView.AngleLeft = renderResources.Views[idx].fov.angleLeft;
                view.FieldOfView.AngleRight = renderResources.Views[idx].fov.angleRight;
                view.ColorTextureFormat = SwapchainFormatToTextureFormat(colorSwapchain.Format);
                view.ColorTexturePointer = colorSwapchain.Images[colorSwapchainImageIndex].texture;
                view.ColorTextureSize.Width = colorSwapchain.Width;
                view.ColorTextureSize.Height = colorSwapchain.Height;
                view.DepthTextureFormat = SwapchainFormatToTextureFormat(depthSwapchain.Format);
                view.DepthTexturePointer = depthSwapchain.Images[depthSwapchainImageIndex].texture;
                view.DepthTextureSize.Width = depthSwapchain.Width;
                view.DepthTextureSize.Height = depthSwapchain.Height;
                view.DepthNearZ = sessionImpl.DepthNearZ;
                view.DepthFarZ = sessionImpl.DepthFarZ;
        
                renderResources.ProjectionLayerViews[idx] = { XR_TYPE_COMPOSITION_LAYER_PROJECTION_VIEW };
                renderResources.ProjectionLayerViews[idx].pose = renderResources.Views[idx].pose;
                renderResources.ProjectionLayerViews[idx].fov = renderResources.Views[idx].fov;
                renderResources.ProjectionLayerViews[idx].subImage.swapchain = colorSwapchain.Handle;
                renderResources.ProjectionLayerViews[idx].subImage.imageRect = imageRect;
                renderResources.ProjectionLayerViews[idx].subImage.imageArrayIndex = 0;
        
                if (sessionImpl.HmdImpl.Extensions->DepthExtensionSupported)
                {
                    renderResources.DepthInfoViews[idx] = { XR_TYPE_COMPOSITION_LAYER_DEPTH_INFO_KHR };
                    renderResources.DepthInfoViews[idx].minDepth = 0;
                    renderResources.DepthInfoViews[idx].maxDepth = 1;
                    renderResources.DepthInfoViews[idx].nearZ = sessionImpl.DepthNearZ;
                    renderResources.DepthInfoViews[idx].farZ = sessionImpl.DepthFarZ;
                    renderResources.DepthInfoViews[idx].subImage.swapchain = depthSwapchain.Handle;
                    renderResources.DepthInfoViews[idx].subImage.imageRect = imageRect;
                    renderResources.DepthInfoViews[idx].subImage.imageArrayIndex = 0;
        
                    // Chain depth info struct to the corresponding projection layer views's next
                    renderResources.ProjectionLayerViews[idx].next = &renderResources.DepthInfoViews[idx];
                }
            }

            // Locate all the things.
            auto& actionResources = m_impl->sessionImpl.ActionResources;

            std::vector<XrActiveActionSet> activeActionSets = { { actionResources.ActionSet, XR_NULL_PATH } };
            XrActionsSyncInfo syncInfo{ XR_TYPE_ACTIONS_SYNC_INFO };
            syncInfo.countActiveActionSets = (uint32_t)activeActionSets.size();
            syncInfo.activeActionSets = activeActionSets.data();
            XrCheck(xrSyncActions(m_impl->sessionImpl.Session, &syncInfo));

            InputSources.resize(actionResources.CONTROLLER_SUBACTION_PATH_PREFIXES.size());
            for (size_t idx = 0; idx < InputSources.size(); ++idx)
            {
                // Get grip space
                {
                    XrSpace space = actionResources.ControllerGripPoseSpaces[idx];
                    XrSpaceLocation location{ XR_TYPE_SPACE_LOCATION };
                    XrCheck(xrLocateSpace(space, m_impl->sessionImpl.SceneSpace, m_impl->displayTime, &location));

                    constexpr XrSpaceLocationFlags RequiredFlags =
                        XR_SPACE_LOCATION_POSITION_VALID_BIT |
                        XR_SPACE_LOCATION_ORIENTATION_VALID_BIT |
                        XR_SPACE_LOCATION_POSITION_TRACKED_BIT |
                        XR_SPACE_LOCATION_ORIENTATION_TRACKED_BIT;

                    auto& inputSource = InputSources[idx];
                    inputSource.TrackedThisFrame = (location.locationFlags & RequiredFlags) == RequiredFlags;
                    if (inputSource.TrackedThisFrame)
                    {
                        inputSource.Handedness = static_cast<InputSource::HandednessEnum>(idx);
                        inputSource.GripSpace.Pose.Position.X = location.pose.position.x;
                        inputSource.GripSpace.Pose.Position.Y = location.pose.position.y;
                        inputSource.GripSpace.Pose.Position.Z = location.pose.position.z;
                        inputSource.GripSpace.Pose.Orientation.X = location.pose.orientation.x;
                        inputSource.GripSpace.Pose.Orientation.Y = location.pose.orientation.y;
                        inputSource.GripSpace.Pose.Orientation.Z = location.pose.orientation.z;
                        inputSource.GripSpace.Pose.Orientation.W = location.pose.orientation.w;
                    }
                }

                // Get aim space
                {
                    XrSpace space = actionResources.ControllerAimPoseSpaces[idx];
                    XrSpaceLocation location{ XR_TYPE_SPACE_LOCATION };
                    XrCheck(xrLocateSpace(space, m_impl->sessionImpl.SceneSpace, m_impl->displayTime, &location));

                    constexpr XrSpaceLocationFlags RequiredFlags =
                        XR_SPACE_LOCATION_POSITION_VALID_BIT |
                        XR_SPACE_LOCATION_ORIENTATION_VALID_BIT |
                        XR_SPACE_LOCATION_POSITION_TRACKED_BIT |
                        XR_SPACE_LOCATION_ORIENTATION_TRACKED_BIT;

                    auto& inputSource = InputSources[idx];
                    inputSource.TrackedThisFrame = (location.locationFlags & RequiredFlags) == RequiredFlags;
                    if (inputSource.TrackedThisFrame)
                    {
                        inputSource.Handedness = static_cast<InputSource::HandednessEnum>(idx);
                        inputSource.AimSpace.Pose.Position.X = location.pose.position.x;
                        inputSource.AimSpace.Pose.Position.Y = location.pose.position.y;
                        inputSource.AimSpace.Pose.Position.Z = location.pose.position.z;
                        inputSource.AimSpace.Pose.Orientation.X = location.pose.orientation.x;
                        inputSource.AimSpace.Pose.Orientation.Y = location.pose.orientation.y;
                        inputSource.AimSpace.Pose.Orientation.Z = location.pose.orientation.z;
                        inputSource.AimSpace.Pose.Orientation.W = location.pose.orientation.w;
                    }
                }
            }
        }
    }

    void System::Session::Frame::GetHitTestResults(std::vector<Pose>& /*filteredResults*/, Ray) const {
        // Stubbed out for now, should be implemented if we want to support OpenXR based passthrough AR devices.
    }

    System::Session::Frame::~Frame()
    {
        // EndFrame can submit mutiple layers, but we only support one at the moment.
        XrCompositionLayerBaseHeader* layersPtr{};

        // The projection layer consists of projection layer views.
        // This must be declared out here because layers is a vector of pointer, so the layer struct
        // must not go out of scope before xrEndFrame() is called.
        XrCompositionLayerProjection layer{ XR_TYPE_COMPOSITION_LAYER_PROJECTION };

        if (m_impl->shouldRender)
        {
            auto& renderResources = m_impl->sessionImpl.RenderResources;
        
            XrSwapchainImageReleaseInfo releaseInfo{ XR_TYPE_SWAPCHAIN_IMAGE_RELEASE_INFO };

            for (auto& swapchain : renderResources.ColorSwapchains)
            {
                XrAssert(xrReleaseSwapchainImage(swapchain.Handle, &releaseInfo));
            }

            for (auto& swapchain : renderResources.DepthSwapchains)
            {
                XrAssert(xrReleaseSwapchainImage(swapchain.Handle, &releaseInfo));
            }
        
            // Inform the runtime to consider alpha channel during composition
            // The primary display on Hololens has additive environment blend mode. It will ignore alpha channel.
            // But mixed reality capture has alpha blend mode display and use alpha channel to blend content to environment.
            layer.layerFlags = XR_COMPOSITION_LAYER_BLEND_TEXTURE_SOURCE_ALPHA_BIT;
        
            layer.space = m_impl->sessionImpl.SceneSpace;
            layer.viewCount = static_cast<uint32_t>(renderResources.ProjectionLayerViews.size());
            layer.views = renderResources.ProjectionLayerViews.data();
        
            layersPtr = reinterpret_cast<XrCompositionLayerBaseHeader*>(&layer);
        }

#ifdef _DEBUG
        if (!Views.empty())
        {
            // 'SetPrivateData' is intercepted by the special fork of RenderDoc in order to detect that
            // a frame is being presented. This can be done to any swapchain image texture returned
            // by xrEnumerateSwapchainImages. This should be done after all rendering is complete for the
            // frame (and not for each eye backbuffer).
            ID3D11Texture2D* texture = reinterpret_cast<ID3D11Texture2D*>(Views.front().ColorTexturePointer);
            int dummy;
            texture->SetPrivateData({0xD4544440, 0x90B9, 0x4815, 0x8B, 0x99, 0x18, 0xC0, 0x23, 0xA5, 0x73, 0xF1}, sizeof(dummy), &dummy);
        }
#endif

        // Submit the composition layers for the predicted display time.
        XrFrameEndInfo frameEndInfo{ XR_TYPE_FRAME_END_INFO };
        frameEndInfo.displayTime = m_impl->displayTime;
        frameEndInfo.environmentBlendMode = m_impl->sessionImpl.HmdImpl.EnvironmentBlendMode;
        frameEndInfo.layerCount = m_impl->shouldRender ? 1 : 0;
        frameEndInfo.layers = &layersPtr;
        XrAssert(xrEndFrame(m_impl->sessionImpl.Session, &frameEndInfo));
    }

    System::System(const char* appName)
        : m_impl{ std::make_unique<System::Impl>(appName) }
    {}

    System::~System() {}

    bool System::IsInitialized() const
    {
        return m_impl->IsInitialized();
    }

    bool System::TryInitialize()
    {
        return m_impl->TryInitialize();
    }

    arcana::task<bool, std::exception_ptr> System::IsSessionSupportedAsync(SessionType sessionType)
    {
        // Only immersive_VR is supported for now.
        return arcana::task_from_result<std::exception_ptr>(sessionType == SessionType::IMMERSIVE_VR);
    }

    arcana::task<std::shared_ptr<System::Session>, std::exception_ptr> System::Session::CreateAsync(System& system, void* graphicsDevice)
    {
        return arcana::task_from_result<std::exception_ptr>(std::make_shared<System::Session>(system, graphicsDevice));
    }

    System::Session::Session(System& headMountedDisplay, void* graphicsDevice)
        : m_impl{ std::make_unique<System::Session::Impl>(*headMountedDisplay.m_impl, graphicsDevice) }
    {}

    System::Session::~Session() {}

    std::unique_ptr<System::Session::Frame> System::Session::GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession, std::function<void(void* /*texturePointer*/)> /*deletedTextureCallback*/)
    {
        return m_impl->GetNextFrame(shouldEndSession, shouldRestartSession);
    }

    void System::Session::RequestEndSession()
    {
        m_impl->RequestEndSession();
    }

    Size System::Session::GetWidthAndHeightForViewIndex(size_t viewIndex) const
    {
        return m_impl->GetWidthAndHeightForViewIndex(viewIndex);
    }

    void System::Session::SetDepthsNearFar(float depthNear, float depthFar)
    {
        m_impl->DepthNearZ = depthNear;
        m_impl->DepthFarZ = depthFar;
    }
}
