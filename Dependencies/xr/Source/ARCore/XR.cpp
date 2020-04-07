#include <XR.h>

#include <assert.h>
#include <optional>
#include <sstream>

#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#include <GLES3/gl3.h>
#include <EGL/egl.h>

#include <android/native_window.h>
#include <android/log.h>
#include <arcore_c_api.h>

#include <gsl/gsl>

#define GLM_FORCE_RADIANS 1
#define GLM_ENABLE_EXPERIMENTAL
#include <glm.hpp>
#include <gtc/matrix_transform.hpp>
#include <gtc/type_ptr.hpp>
#include <gtx/quaternion.hpp>

namespace xr
{
    class System::Impl
    {
    public:
        Impl(const std::string& applicationName)
        {}

        bool IsInitialized() const
        {
            return (m_env != nullptr && m_appContext != nullptr);
        }

        bool TryInitialize(JNIEnv* env, jobject appContext)
        {
            m_env = env;
            m_appContext = appContext;

            // Perhaps call eglGetCurrentSurface to get the render surface *before* XR render loop starts and changes to rendering to an FBO?
            return true;
        }

        JNIEnv* Env() const
        {
            return m_env;
        }

        const jobject& AppContext() const
        {
            return m_appContext;
        }

    private:
        JNIEnv* m_env{};
        jobject m_appContext{};
    };

    namespace
    {
        constexpr GLfloat VERTEX_POSITIONS[]{ -1.0f, -1.0f, +1.0f, -1.0f, -1.0f, +1.0f, +1.0f, +1.0f };
        constexpr size_t VERTEX_COUNT{ std::size(VERTEX_POSITIONS) / 2 };

        constexpr char QUAD_VERT_SHADER[] = R"(#version 300 es
            precision highp float;
            uniform vec2 vertexPositions[4];
            uniform vec2 cameraFrameUVs[4];
            out vec2 cameraFrameUV;
            out vec2 babylonUV;
            void main() {
                gl_Position = vec4(vertexPositions[gl_VertexID], 0.0, 1.0);
                cameraFrameUV = cameraFrameUVs[gl_VertexID];
                babylonUV = vec2(gl_Position.x + 1.0, gl_Position.y + 1.0) * 0.5;
            }
        )";

        constexpr char QUAD_FRAG_SHADER[] = R"(#version 300 es
            #extension GL_OES_EGL_image_external_essl3 : require
            precision mediump float;
            in vec2 cameraFrameUV;
            in vec2 babylonUV;
            uniform samplerExternalOES cameraTexture;
            uniform sampler2D babylonTexture;
            out vec4 oFragColor;
            void main() {
                vec4 cameraColor = texture(cameraTexture, cameraFrameUV);
                vec4 babylonColor = texture(babylonTexture, babylonUV);
                oFragColor = mix(cameraColor, babylonColor, babylonColor.a);
            }
        )";

        GLuint LoadShader(GLenum shader_type, const char* shader_source)
        {
            GLuint shader = glCreateShader(shader_type);
            if (!shader)
            {
                throw std::runtime_error{ "Failed to create shader" };
            }

            glShaderSource(shader, 1, &shader_source, nullptr);
            glCompileShader(shader);
            GLint compileStatus = GL_FALSE;
            glGetShaderiv(shader, GL_COMPILE_STATUS, &compileStatus);

            if (compileStatus != GL_TRUE)
            {
                GLint infoLogLength = 0;

                glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &infoLogLength);
                if (!infoLogLength)
                {
                    throw std::runtime_error{ "Unknown error compiling shader" };
                }

                std::string infoLog;
                infoLog.resize(static_cast<size_t>(infoLogLength));
                glGetShaderInfoLog(shader, infoLogLength, nullptr, infoLog.data());
                glDeleteShader(shader);
                throw std::runtime_error("Error compiling shader: " + infoLog);
            }

            return shader;
        }

        GLuint CreateShaderProgram()
        {
            GLuint vertShader = LoadShader(GL_VERTEX_SHADER, QUAD_VERT_SHADER);
            GLuint fragShader = LoadShader(GL_FRAGMENT_SHADER, QUAD_FRAG_SHADER);

            GLuint program = glCreateProgram();
            if (!program)
            {
                throw std::runtime_error{ "Failed to create shader program" };
            }

            glAttachShader(program, vertShader);
            glAttachShader(program, fragShader);

            glLinkProgram(program);
            GLint linkStatus = GL_FALSE;
            glGetProgramiv(program, GL_LINK_STATUS, &linkStatus);

            if (linkStatus != GL_TRUE)
            {
                GLint infoLogLength = 0;
                glGetProgramiv(program, GL_INFO_LOG_LENGTH, &infoLogLength);
                if (!infoLogLength)
                {
                    throw std::runtime_error{ "Unknown error linking shader program" };
                }

                std::string infoLog;
                infoLog.resize(static_cast<size_t>(infoLogLength));
                glGetProgramInfoLog(program, infoLogLength, nullptr, infoLog.data());
                glDeleteProgram(program);
                throw std::runtime_error("Error linking shader program: " + infoLog);
            }

            return program;
        }

        constexpr GLint GetTextureUnit(GLenum texture)
        {
            return texture - GL_TEXTURE0;
        }

        namespace GLTransactions
        {
            auto SetCapability(GLenum capability, bool isEnabled)
            {
                const auto setCapability = [capability](bool isEnabled)
                {
                    if (isEnabled)
                    {
                        glEnable(capability);
                    }
                    else
                    {
                        glDisable(capability);
                    }
                };

                const auto wasEnabled = glIsEnabled(capability);
                setCapability(isEnabled);
                return gsl::finally([wasEnabled, setCapability]() { setCapability(wasEnabled); });
            }

            auto BindFrameBuffer(GLuint frameBufferId)
            {
                GLint previousFrameBufferId;
                glGetIntegerv(GL_FRAMEBUFFER_BINDING, &previousFrameBufferId);
                glBindFramebuffer(GL_FRAMEBUFFER, frameBufferId);
                return gsl::finally([previousFrameBufferId]() { glBindFramebuffer(GL_FRAMEBUFFER, static_cast<GLuint>(previousFrameBufferId)); });
            }

            auto DepthMask(GLboolean depthMask)
            {
                GLboolean previousDepthMask;
                glGetBooleanv(GL_DEPTH_WRITEMASK, &previousDepthMask);
                glDepthMask(depthMask);
                return gsl::finally([previousDepthMask]() { glDepthMask(previousDepthMask); });
            }

            auto BlendFunc(GLenum blendFuncName, GLenum blendFuncSFactor, GLenum blendFuncTFactor)
            {
                GLint previousBlendFuncTFactor;
                glGetIntegerv(blendFuncName, &previousBlendFuncTFactor);
                glBlendFunc(blendFuncSFactor, blendFuncTFactor);
                return gsl::finally([blendFuncSFactor, previousBlendFuncTFactor]() { glBlendFunc(blendFuncSFactor, static_cast<GLenum>(previousBlendFuncTFactor)); });
            }
        }
    }

    class System::Session::Impl
    {
    public:
        const System::Impl& HmdImpl;
        std::vector<Frame::View> ActiveFrameViews{ {} };
        std::vector<Frame::InputSource> InputSources;
        float DepthNearZ{ DEFAULT_DEPTH_NEAR_Z };
        float DepthFarZ{ DEFAULT_DEPTH_FAR_Z };
        bool SessionEnded{ false };

        GLuint shaderProgramId{};
        GLuint cameraTextureId{};

        ArSession* session{};
        ArFrame* frame{};
        ArPose* pose{};

        float cameraFrameUVs[VERTEX_COUNT * 2];
        bool cameraFrameUVsInitialized{false};

        Impl(System::Impl& hmdImpl, void* graphicsContext)
            : HmdImpl{ hmdImpl }
        {
            // Note: graphicsContext is an EGLContext

            // Get the width and height of the current surface
            size_t width{}, height{};
            {
                EGLDisplay display = eglGetCurrentDisplay();
                EGLSurface surface = eglGetCurrentSurface(EGL_DRAW);
                EGLint _width{}, _height{};
                eglQuerySurface(eglGetDisplay(EGL_DEFAULT_DISPLAY), surface, EGL_WIDTH, &_width);
                eglQuerySurface(eglGetDisplay(EGL_DEFAULT_DISPLAY), surface, EGL_HEIGHT, &_height);
                width = static_cast<size_t>(_width);
                height = static_cast<size_t >(_height);
            }

            // Allocate and store the render texture
            {
                GLuint colorTextureId{};
                glGenTextures(1, &colorTextureId);
                glBindTexture(GL_TEXTURE_2D, colorTextureId);
                glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
                glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
                glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
                glBindTexture(GL_TEXTURE_2D, 0);
                ActiveFrameViews[0].ColorTexturePointer = reinterpret_cast<void *>(colorTextureId);
                ActiveFrameViews[0].ColorTextureFormat = TextureFormat::RGBA8_SRGB;
                ActiveFrameViews[0].ColorTextureSize = {width, height};
            }

            // Allocate and store the depth texture
            {
                GLuint depthTextureId{};
                glGenTextures(1, &depthTextureId);
                glBindTexture(GL_TEXTURE_2D, depthTextureId);
                glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH24_STENCIL8_OES, width, height, 0, GL_DEPTH_STENCIL_OES, GL_UNSIGNED_INT_24_8_OES, nullptr);
                glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
                glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
                glBindTexture(GL_TEXTURE_2D, 0);
                ActiveFrameViews[0].DepthTexturePointer = reinterpret_cast<void*>(depthTextureId);
                ActiveFrameViews[0].DepthTextureFormat = TextureFormat::D24S8;
                ActiveFrameViews[0].DepthTextureSize = {width, height};
            }

            // Generate a texture id for the camera texture (ARCore will allocate the texture itself)
            {
                glGenTextures(1, &cameraTextureId);
                glBindTexture(GL_TEXTURE_EXTERNAL_OES, cameraTextureId);
                glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
                glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
                glBindTexture(GL_TEXTURE_EXTERNAL_OES, 0);
            }

            // Create the shader program used for drawing the full screen quad that is the camera frame + Babylon render texture
            shaderProgramId = CreateShaderProgram();

            // Create the ARCore ArSession
            {
                ArStatus status = ArSession_create(hmdImpl.Env(), hmdImpl.AppContext(), &session);
                if (status != ArStatus::AR_SUCCESS)
                {
                    std::ostringstream message;
                    message << "Failed to create ArSession with status: " << status;
                    throw std::runtime_error{ message.str() };
                }
            }

            // Create the ARCore ArFrame (this gets reused each time we query for the latest frame)
            ArFrame_create(session, &frame);

            // Create the ARCore ArPose (this gets reused for each frame as well)
            ArPose_create(session, nullptr, &pose);

            // Initialize the width and height of the display with ARCore (this is used to adjust the UVs for the camera texture so we can draw a portion of the camera frame that matches the size of the UI element displaying it)
            ArSession_setDisplayGeometry(session, 0, static_cast<int32_t>(width), static_cast<int32_t>(height));

            // Start the ArSession
            {
                ArStatus status = ArSession_resume(session);
                if (status != ArStatus::AR_SUCCESS)
                {
                    std::ostringstream message;
                    message << "Failed to start ArSession with status: " << status;
                    throw std::runtime_error{ message.str() };
                }
            }
        }

        ~Impl()
        {
            ArPose_destroy(pose);
            ArFrame_destroy(frame);
            ArSession_destroy(session);
        }

        std::unique_ptr<System::Session::Frame> GetNextFrame(bool& shouldEndSession, bool& shouldRestartSession)
        {
            shouldEndSession = SessionEnded;
            shouldRestartSession = false;

            // Set the texture ID that should be used for the camera frame
            ArSession_setCameraTextureName(session, static_cast<uint32_t>(cameraTextureId));

            // Update the ArSession to get a new frame
            ArSession_update(session, frame);

            return std::make_unique<Frame>(*this);
        }

        void RequestEndSession()
        {
            // Note the end session has been requested, and respond to the request in the next call to GetNextFrame
            SessionEnded = true;
        }

        Size GetWidthAndHeightForViewIndex(size_t viewIndex) const
        {
            // Return a valid (non-zero) size, but otherwise it doesn't matter as the render texture created from this isn't currently used
            return {1,1};
        }
    };

    struct System::Session::Frame::Impl
    {
        Impl(Session::Impl& sessionImpl)
            : sessionImpl{sessionImpl}
        {
        }

        Session::Impl& sessionImpl;
    };

    System::Session::Frame::Frame(Session::Impl& sessionImpl)
        : Views{ sessionImpl.ActiveFrameViews }
        , InputSources{ sessionImpl.InputSources}
        , m_impl{ std::make_unique<System::Session::Frame::Impl>(sessionImpl) }
    {
        Views[0].DepthNearZ = sessionImpl.DepthNearZ;
        Views[0].DepthFarZ = sessionImpl.DepthFarZ;

        ArCamera* camera{};
        ArFrame_acquireCamera(sessionImpl.session, sessionImpl.frame, &camera);

        {
            // Get the current pose of the device
            ArCamera_getDisplayOrientedPose(sessionImpl.session, camera, sessionImpl.pose);

            // The raw pose is exactly 7 floats: 4 for the orientation quaternion, and 3 for the position vector
            float rawPose[7];
            ArPose_getPoseRaw(sessionImpl.session, sessionImpl.pose, rawPose);

            // Set the orientation and position
            Views[0].Space.Orientation = {rawPose[0], rawPose[1], rawPose[2], rawPose[3]};
            Views[0].Space.Position = {rawPose[4], rawPose[5], rawPose[6]};
        }

        {
            // Get the current projection matrix
            glm::mat4 projectionMatrix{};
            ArCamera_getProjectionMatrix(sessionImpl.session, camera, Views[0].DepthNearZ, Views[0].DepthFarZ, glm::value_ptr(projectionMatrix));

            // Calculate the aspect ratio and field of view
            float a = projectionMatrix[0][0];
            float b = projectionMatrix[1][1];

            float aspectRatio = b / a;
            float fieldOfView = std::atan(1.0f / b);

            // Set the horizontal and vertical field of view
            Views[0].FieldOfView.AngleDown = -(Views[0].FieldOfView.AngleUp = fieldOfView);
            Views[0].FieldOfView.AngleLeft = -(Views[0].FieldOfView.AngleRight = fieldOfView * aspectRatio);
        }

        // Get the tracking state
        ArTrackingState trackingState{};
        ArCamera_getTrackingState(sessionImpl.session, camera, &trackingState);

        if (trackingState == ArTrackingState::AR_TRACKING_STATE_TRACKING)
        {
            int32_t geometryChanged{ 0 };
            ArFrame_getDisplayGeometryChanged(sessionImpl.session, sessionImpl.frame, &geometryChanged);
            if (geometryChanged || !sessionImpl.cameraFrameUVsInitialized)
            {
                // Transform the UVs for the vertex positions given the current display size
                ArFrame_transformCoordinates2d(
                    sessionImpl.session, sessionImpl.frame, AR_COORDINATES_2D_OPENGL_NORMALIZED_DEVICE_COORDINATES,
                    VERTEX_COUNT, VERTEX_POSITIONS, AR_COORDINATES_2D_TEXTURE_NORMALIZED, sessionImpl.cameraFrameUVs);

                // Note that the UVs have been initialized (we don't need to do this again unless the display geometry changes)
                sessionImpl.cameraFrameUVsInitialized = true;
            }
        }

        ArCamera_release(camera);
    }

    System::Session::Frame::~Frame()
    {
        // Suppress rendering if the camera did not produce the first frame yet.
        // This is to avoid drawing possible leftover data from previous sessions if
        // the texture is reused.
        int64_t frameTimestamp{};
        ArFrame_getTimestamp(m_impl->sessionImpl.session, m_impl->sessionImpl.frame, &frameTimestamp);
        if (frameTimestamp)
        {
            auto bindFrameBufferTransaction = GLTransactions::BindFrameBuffer(0);
            auto cullFaceTransaction = GLTransactions::SetCapability(GL_CULL_FACE, false);
            auto depthTestTransaction = GLTransactions::SetCapability(GL_DEPTH_TEST, false);
            auto blendTransaction = GLTransactions::SetCapability(GL_BLEND, false);
            auto depthMaskTransaction = GLTransactions::DepthMask(GL_FALSE);
            auto blendFuncTransaction = GLTransactions::BlendFunc(GL_BLEND_SRC_ALPHA, GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);

            glViewport(0, 0, Views[0].ColorTextureSize.Width, Views[0].ColorTextureSize.Height);
            glUseProgram(m_impl->sessionImpl.shaderProgramId);

            // Configure the quad vertex positions
            auto vertexPositionsUniformLocation = glGetUniformLocation(m_impl->sessionImpl.shaderProgramId, "vertexPositions");
            glUniform2fv(vertexPositionsUniformLocation, VERTEX_COUNT, VERTEX_POSITIONS);

            // Configure the camera texture
            auto cameraTextureUniformLocation = glGetUniformLocation(m_impl->sessionImpl.shaderProgramId, "cameraTexture");
            glUniform1i(cameraTextureUniformLocation, GetTextureUnit(GL_TEXTURE0));
            glActiveTexture(GL_TEXTURE0);
            glBindTexture(GL_TEXTURE_EXTERNAL_OES, m_impl->sessionImpl.cameraTextureId);

            // Configure the camera frame UVs
            auto cameraFrameUVsUniformLocation = glGetUniformLocation(m_impl->sessionImpl.shaderProgramId, "cameraFrameUVs");
            glUniform2fv(cameraFrameUVsUniformLocation, VERTEX_COUNT, m_impl->sessionImpl.cameraFrameUVs);

            // Configure the babylon render texture
            auto babylonTextureUniformLocation = glGetUniformLocation(m_impl->sessionImpl.shaderProgramId, "babylonTexture");
            glUniform1i(babylonTextureUniformLocation, GetTextureUnit(GL_TEXTURE1));
            glActiveTexture(GL_TEXTURE1);
            auto babylonTextureId = (GLuint)(size_t)Views[0].ColorTexturePointer;
            glBindTexture(GL_TEXTURE_2D, babylonTextureId);

            // Draw the quad
            glDrawArrays(GL_TRIANGLE_STRIP, 0, VERTEX_COUNT);
            glUseProgram(0);
        }
    }

    System::System(const char* appName)
        : m_impl{ std::make_unique<System::Impl>(appName) }
    {}

    System::~System() {}

    bool System::IsInitialized() const
    {
        return m_impl->IsInitialized();
    }

    bool System::TryInitialize(JNIEnv* env, jobject appContext)
    {
        return m_impl->TryInitialize(env, appContext);
    }

    System::Session::Session(System& system, void* graphicsDevice)
        : m_impl{ std::make_unique<System::Session::Impl>(*system.m_impl, graphicsDevice) }
    {}

    System::Session::~Session()
    {
        // Free textures
    }

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
