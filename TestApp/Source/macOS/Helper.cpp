#import <Babylon/RuntimeApple.h>
#import <Shared/InputManager.h>

//namespace babylon
//{
    extern "C" void InitRuntime()
    {
        // Apple stub. temporary code to make sure everything compiles and link correctly
        // can't include c++11 header (like functional) directly in the .m
        auto runtime = std::make_unique<babylon::RuntimeApple>(nullptr, ".");

        auto inputBuffer = std::make_unique<InputManager::InputBuffer>(*runtime);
        InputManager::Initialize(*runtime, *inputBuffer);
    }
//}