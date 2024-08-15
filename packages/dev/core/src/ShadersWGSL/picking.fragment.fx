
#if defined(INSTANCES)
varying vMeshID: vec4f;
#else
uniform meshID: vec4f;
#endif

@fragment
fn main(input: FragmentInputs) -> FragmentOutputs {

#if defined(INSTANCES)
    fragmentOutputs.color = vMeshID;
#else
	fragmentOutputs.color = meshID;
#endif

}