#ifdef NUM_SAMPLES
	#if NUM_SAMPLES > 0
		uniform float cubeWidth;
		uniform vec3 vSampleDirections[NUM_SAMPLES];
		uniform float vWeights[NUM_SAMPLES];

		vec4 sampleFiltered(samplerCube inputTexture, vec3 direction) {
			vec3 n = normalize(direction);
			vec3 tangent = abs(n.z) < 0.999 ? vec3(0., 0., 1.) : vec3(1., 0., 0.);
			tangent = normalize(cross(tangent, n));
			vec3 bitangent = cross(n, tangent);
			mat3 tbn = mat3(tangent, bitangent, n);

			vec4 color = vec4(0.);
			vec3 h;
			vec3 l;
			float NoH;
			float NoL;
			float totalWeight = 0.;
			for (int i = 0; i < NUM_SAMPLES; i++) {
			    h = tbn * vSampleDirections[i];
			    l = 2. * dot(h, n) * h - n;
			    NoH = clamp(dot(h, n), 0.0, 1.0);
			    NoL = clamp(dot(l, n), 0.0, 1.0);
			    if (NoL > 0.) {
			        float solidAngleTexel = 4. * 3.14159 / (6. * cubeWidth * cubeWidth);
			        float solidAngleSample = 4.0 / (float(NUM_SAMPLES) * vWeights[i]);
			        float lod = 0.5 * log2(solidAngleSample / solidAngleTexel);
			        color += textureCubeLodEXT(inputTexture, l, lod) * NoL;
			        totalWeight += NoL;            
			    }
			}

			if (totalWeight != 0.) {
			    color /= totalWeight;
			}

			return color;
		}
	#endif
#endif