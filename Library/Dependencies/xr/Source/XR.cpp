#include <XR.h>

#include <XrPlatform.h>

#include <assert.h>
#include <optional>

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
                        throw Exception{ "Required extension not supported" };
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

    Exception::Exception(const char* message)
        : m_message{ message }
    {}

    const char* Exception::what() const noexcept
    {
        return m_message.c_str();
    }

    class System::Impl
    {
    public:
        constexpr static XrFormFactor FORM_FACTOR{ XR_FORM_FACTOR_HEAD_MOUNTED_DISPLAY };
        constexpr static XrViewConfigurationType VIEW_CONFIGURATION_TYPE{ XR_VIEW_CONFIGURATION_TYPE_PRIMARY_STEREO };
        constexpr static uint32_t STEREO_VIEW_COUNT{ 2 }; // PRIMARY_STEREO view configuration always has 2 views

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
                throw Exception{ "SystemId initialization failed with unexpected result type." };
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

    class System::Session::Impl
    {
    public:
        const System::Impl& HmdImpl;
        XrSession Session{ XR_NULL_HANDLE };

        XrSpace SceneSpace{ XR_NULL_HANDLE };
        XrReferenceSpaceType SceneSpaceType{};

        constexpr static uint32_t LeftSide = 0;
        constexpr static uint32_t RightSide = 1;

        struct Swapchain
        {
            XrSwapchain Handle;
            SwapchainFormat Format{};
            int32_t Width{ 0 };
            int32_t Height{ 0 };
            uint32_t ArraySize{ 0 };
            std::vector<SwapchainImage> Images;
        };

        struct RenderResources
        {
            std::vector<XrView> Views{};
            std::vector<XrViewConfigurationView> ConfigViews{};
            std::vector<Swapchain> ColorSwapchains{};
            std::vector<Swapchain> DepthSwapchains{};
            std::vector<XrCompositionLayerProjectionView> ProjectionLayerViews{};
            std::vector<XrCompositionLayerDepthInfoKHR> DepthInfoViews{};
            std::vector<Frame::View> ActiveFrameViews{};
        };
        RenderResources Resources{};

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
            Resources.ConfigViews.resize(viewCount, { XR_TYPE_VIEW_CONFIGURATION_VIEW });
            XrCheck(xrEnumerateViewConfigurationViews(instance, systemId, HmdImpl.VIEW_CONFIGURATION_TYPE, viewCount, &viewCount, Resources.ConfigViews.data()));

            // Create all the swapchains.
            for (uint32_t idx = 0; idx < viewCount; ++idx)
            {
                const XrViewConfigurationView& view = Resources.ConfigViews[idx];
                Resources.ColorSwapchains.push_back(
                    CreateSwapchain(Session,
                        colorSwapchainFormat,
                        view.recommendedImageRectWidth,
                        view.recommendedImageRectHeight,
                        1,
                        view.recommendedSwapchainSampleCount,
                        0,
                        XR_SWAPCHAIN_USAGE_SAMPLED_BIT | XR_SWAPCHAIN_USAGE_COLOR_ATTACHMENT_BIT));
                Resources.DepthSwapchains.push_back(
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
            Resources.Views.resize(viewCount, { XR_TYPE_VIEW });
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
            const auto& swapchain = Resources.ColorSwapchains[viewIndex];
            return{ static_cast<size_t>(swapchain.Width), static_cast<size_t>(swapchain.Height) };
        }

    private:
        static constexpr XrPosef IDENTITY_TRANSFORM{ XrQuaternionf{ 0.f, 0.f, 0.f, 1.f }, XrVector3f{ 0.f, 0.f, 0.f } };

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
                throw Exception{ "No runtime swapchain format is supported for color." };
            }

            auto depthFormatPtr = std::find_first_of(
                std::begin(swapchainFormats),
                std::end(swapchainFormats),
                std::begin(SUPPORTED_DEPTH_FORMATS),
                std::end(SUPPORTED_DEPTH_FORMATS));
            if (depthFormatPtr == std::end(swapchainFormats))
            {
                throw Exception{ "No runtime swapchain format is supported for depth." };
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

    System::Session::Frame::Frame(Session::Impl& sessionImpl)
        : Views{ sessionImpl.Resources.ActiveFrameViews }
        , m_sessionImpl{ sessionImpl }
    {
        auto session = m_sessionImpl.Session;

        XrFrameWaitInfo frameWaitInfo{ XR_TYPE_FRAME_WAIT_INFO };
        XrFrameState frameState{ XR_TYPE_FRAME_STATE };
        XrCheck(xrWaitFrame(session, &frameWaitInfo, &frameState));
        m_shouldRender = frameState.shouldRender;
        m_displayTime = frameState.predictedDisplayTime;

        XrFrameBeginInfo frameBeginInfo{ XR_TYPE_FRAME_BEGIN_INFO };
        XrCheck(xrBeginFrame(session, &frameBeginInfo));

        auto& renderResources = m_sessionImpl.Resources;

        // Only render when session is visible. otherwise submit zero layers
        if (m_shouldRender)
        {
            uint32_t viewCapacityInput = static_cast<uint32_t>(renderResources.Views.size());
            uint32_t viewCountOutput;
        
            XrViewState viewState{ XR_TYPE_VIEW_STATE };
            XrViewLocateInfo viewLocateInfo{ XR_TYPE_VIEW_LOCATE_INFO };
            viewLocateInfo.viewConfigurationType = System::Impl::VIEW_CONFIGURATION_TYPE;
            viewLocateInfo.displayTime = m_displayTime;
            viewLocateInfo.space = m_sessionImpl.SceneSpace;
            XrCheck(xrLocateViews(session, &viewLocateInfo, &viewState, viewCapacityInput, &viewCountOutput, renderResources.Views.data()));
            assert(viewCountOutput == viewCapacityInput);
            assert(viewCountOutput == renderResources.ConfigViews.size());
            assert(viewCountOutput == renderResources.ColorSwapchains.size());
            assert(viewCountOutput == renderResources.DepthSwapchains.size());
        
            renderResources.ProjectionLayerViews.resize(viewCountOutput);
            if (m_sessionImpl.HmdImpl.Extensions->DepthExtensionSupported)
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
                view.Position.X = renderResources.Views[idx].pose.position.x;
                view.Position.Y = renderResources.Views[idx].pose.position.y;
                view.Position.Z = renderResources.Views[idx].pose.position.z;
                view.Orientation.X = renderResources.Views[idx].pose.orientation.x;
                view.Orientation.Y = renderResources.Views[idx].pose.orientation.y;
                view.Orientation.Z = renderResources.Views[idx].pose.orientation.z;
                view.Orientation.W = renderResources.Views[idx].pose.orientation.w;
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
        }
    }

    System::Session::Frame::~Frame()
    {
        // EndFrame can submit mutiple layers, but we only support one at the moment.
        XrCompositionLayerBaseHeader* layersPtr{};

        // The projection layer consists of projection layer views.
        // This must be declared out here because layers is a vector of pointer, so the layer struct
        // must not go out of scope before xrEndFrame() is called.
        XrCompositionLayerProjection layer{ XR_TYPE_COMPOSITION_LAYER_PROJECTION };

        if (m_shouldRender)
        {
            auto& renderResources = m_sessionImpl.Resources;
        
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
        
            layer.space = m_sessionImpl.SceneSpace;
            layer.viewCount = static_cast<uint32_t>(renderResources.ProjectionLayerViews.size());
            layer.views = renderResources.ProjectionLayerViews.data();
        
            layersPtr = reinterpret_cast<XrCompositionLayerBaseHeader*>(&layer);
        }

        // Submit the composition layers for the predicted display time.
        XrFrameEndInfo frameEndInfo{ XR_TYPE_FRAME_END_INFO };
        frameEndInfo.displayTime = m_displayTime;
        frameEndInfo.environmentBlendMode = m_sessionImpl.HmdImpl.EnvironmentBlendMode;
        frameEndInfo.layerCount = m_shouldRender ? 1 : 0;
        frameEndInfo.layers = &layersPtr;
        XrAssert(xrEndFrame(m_sessionImpl.Session, &frameEndInfo));
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

    System::Session::Session(System& headMountedDisplay, void* graphicsDevice)
        : m_impl{ std::make_unique<System::Session::Impl>(*headMountedDisplay.m_impl, graphicsDevice) }
    {}

    System::Session::~Session() {}

    std::unique_ptr<System::Session::Frame> System::Session::GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession)
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
