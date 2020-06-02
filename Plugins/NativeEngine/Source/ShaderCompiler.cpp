#if _MSC_VER 
#pragma warning( disable : 4100 ) // unreferenced formal parameter in glslang header
#endif

#include "ShaderCompiler.h"
#include <glslang/Public/ShaderLang.h>
#include <glslang/MachineIndependent/localintermediate.h>

namespace Babylon
{
    namespace
    {
        class InvertYDerivativeOperandsTraverser : public glslang::TIntermTraverser
        {
        public:
            InvertYDerivativeOperandsTraverser(glslang::TIntermediate* intermediate)
                : m_intermediate(intermediate)
            {
            }

            virtual bool visitUnary(glslang::TVisit visit, glslang::TIntermUnary* unary) override
            {
                if (visit == glslang::EvPreVisit)
                {
                    auto op = unary->getOp();
                    if (op == glslang::EOpDPdy || op == glslang::EOpDPdyFine || op == glslang::EOpDPdyCoarse)
                    {
                        unary->setOperand(m_intermediate->addUnaryNode(glslang::EOpNegative, unary->getOperand(), {}));
                        return false;
                    }
                }

                return true;
            }

        private:
            glslang::TIntermediate* m_intermediate;
        };
    }

    void ShaderCompiler::InvertYDerivativeOperands(glslang::TShader& shader)
    {
        auto intermediate = shader.getIntermediate();
        InvertYDerivativeOperandsTraverser invertYDerivativeOperandsTraverser{shader.getIntermediate()};
        intermediate->getTreeRoot()->traverse(&invertYDerivativeOperandsTraverser);
    }
}
