#if defined(_DEFINENAME_) && _DEFINENAME_DIRECTUV == 0
	if (uniforms.v_INFONAME_ == 0.)
	{
		vertexOutputs.v_VARYINGNAME_UV =  (uniforms._MATRIXNAME_Matrix *  vec4f(uvUpdated, 1.0, 0.0)).xy;
	}
#ifdef UV2
	else if (uniforms.v_INFONAME_ == 1.)
	{
		vertexOutputs.v_VARYINGNAME_UV =  (uniforms._MATRIXNAME_Matrix *  vec4f(uv2Updated, 1.0, 0.0)).xy;
	}
#endif
#ifdef UV3
	else if (uniforms.v_INFONAME_ == 2.)
	{
		vertexOutputs.v_VARYINGNAME_UV =  (uniforms._MATRIXNAME_Matrix *  vec4f(vertexInputs.uv3, 1.0, 0.0)).xy;
	}
#endif
#ifdef UV4
	else if (uniforms.v_INFONAME_ == 3.)
	{
		vertexOutputs.v_VARYINGNAME_UV =  (uniforms._MATRIXNAME_Matrix *  vec4f(vertexInputs.uv4, 1.0, 0.0)).xy;
	}
#endif
#ifdef UV5
	else if (uniforms.v_INFONAME_ == 4.)
	{
		vertexOutputs.v_VARYINGNAME_UV =  (uniforms._MATRIXNAME_Matrix *  vec4f(vertexInputs.uv5, 1.0, 0.0)).xy;
	}
#endif
#ifdef UV6
	else if (uniforms.v_INFONAME_ == 5.)
	{
		vertexOutputs.v_VARYINGNAME_UV =  (uniforms._MATRIXNAME_Matrix *  vec4f(vertexInputs.uv6, 1.0, 0.0)).xy;
	}
#endif
#endif
