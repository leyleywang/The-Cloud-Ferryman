class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.width = 0;
        this.height = 0;
        this.aspectRatio = 1;
        
        this.programs = {};
        this.buffers = {};
        this.textures = {};
        
        this.init();
    }
    
    init() {
        const gl = this.canvas.getContext('webgl', { 
            antialias: true, 
            alpha: true, 
            premultipliedAlpha: false 
        }) || this.canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }
        
        this.gl = gl;
        this.resize();
        this.setupShaders();
        this.setupBuffers();
        
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
    }
    
    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.aspectRatio = this.width / this.height;
        
        if (this.gl) {
            this.gl.viewport(0, 0, this.width, this.height);
        }
    }
    
    setupShaders() {
        const gl = this.gl;
        
        const vertexShaderSource = `
            attribute vec3 aPosition;
            attribute vec3 aNormal;
            attribute vec2 aTexCoord;
            attribute vec4 aColor;
            
            uniform mat4 uProjection;
            uniform mat4 uView;
            uniform mat4 uModel;
            uniform mat4 uNormalMatrix;
            
            varying vec3 vNormal;
            varying vec2 vTexCoord;
            varying vec3 vPosition;
            varying vec4 vColor;
            
            void main() {
                vec4 worldPosition = uModel * vec4(aPosition, 1.0);
                vPosition = worldPosition.xyz;
                vNormal = (uNormalMatrix * vec4(aNormal, 0.0)).xyz;
                vTexCoord = aTexCoord;
                vColor = aColor;
                gl_Position = uProjection * uView * worldPosition;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying vec3 vNormal;
            varying vec2 vTexCoord;
            varying vec3 vPosition;
            varying vec4 vColor;
            
            uniform vec3 uLightDirection;
            uniform vec3 uLightColor;
            uniform vec3 uAmbientColor;
            uniform sampler2D uTexture;
            uniform bool uUseTexture;
            uniform float uAlpha;
            
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 lightDir = normalize(uLightDirection);
                
                float diffuse = max(dot(normal, lightDir), 0.0);
                vec3 ambient = uAmbientColor * vColor.rgb;
                vec3 diffuseColor = uLightColor * vColor.rgb * diffuse;
                
                vec3 finalColor = ambient + diffuseColor;
                
                if (uUseTexture) {
                    vec4 texColor = texture2D(uTexture, vTexCoord);
                    finalColor = finalColor * texColor.rgb;
                    gl_FragColor = vec4(finalColor, texColor.a * uAlpha);
                } else {
                    gl_FragColor = vec4(finalColor, vColor.a * uAlpha);
                }
            }
        `;
        
        const skyVertexShader = `
            attribute vec3 aPosition;
            attribute vec2 aTexCoord;
            
            uniform mat4 uProjection;
            uniform mat4 uView;
            uniform mat4 uModel;
            
            varying vec2 vTexCoord;
            varying vec3 vPosition;
            
            void main() {
                vTexCoord = aTexCoord;
                vPosition = aPosition;
                gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
            }
        `;
        
        const skyFragmentShader = `
            precision mediump float;
            
            varying vec2 vTexCoord;
            varying vec3 vPosition;
            
            uniform float uTime;
            uniform vec3 uSkyColor1;
            uniform vec3 uSkyColor2;
            uniform vec3 uSunColor;
            uniform vec2 uSunPosition;
            
            float noise(vec2 p) {
                return fract(sin(dot(p.xy, vec2(12.9898, 78.233))) * 43758.5453);
            }
            
            float smoothNoise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                f = f * f * (3.0 - 2.0 * f);
                
                float a = noise(i);
                float b = noise(i + vec2(1.0, 0.0));
                float c = noise(i + vec2(0.0, 1.0));
                float d = noise(i + vec2(1.0, 1.0));
                
                return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
            }
            
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 4; i++) {
                    value += amplitude * smoothNoise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            
            void main() {
                float t = vPosition.y * 0.5 + 0.5;
                vec3 skyBase = mix(uSkyColor2, uSkyColor1, t);
                
                float sunDist = length(vTexCoord - uSunPosition);
                float sunGlow = exp(-sunDist * 3.0);
                vec3 sunEffect = uSunColor * sunGlow * 0.3;
                
                vec2 cloudUV = vTexCoord * 3.0 + vec2(uTime * 0.01, 0.0);
                float cloudNoise = fbm(cloudUV);
                float cloudAlpha = smoothstep(0.4, 0.6, cloudNoise) * 0.3;
                vec3 cloudColor = vec3(1.0, 1.0, 1.0);
                
                vec3 finalColor = skyBase + sunEffect;
                finalColor = mix(finalColor, cloudColor, cloudAlpha);
                
                float vignette = 1.0 - 0.3 * length(vTexCoord - 0.5);
                finalColor *= vignette;
                
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;
        
        this.programs.main = this.createProgram(vertexShaderSource, fragmentShaderSource);
        this.programs.sky = this.createProgram(skyVertexShader, skyFragmentShader);
    }
    
    createShader(source, type) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this.createShader(vertexSource, gl.VERTEX_SHADER);
        const fragmentShader = this.createShader(fragmentSource, gl.FRAGMENT_SHADER);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }
        
        return program;
    }
    
    setupBuffers() {
        this.buffers.quad = this.createQuadBuffer();
        this.buffers.cube = this.createCubeBuffer();
        this.buffers.sphere = this.createSphereBuffer(32, 32);
        this.buffers.cloud = this.createCloudBuffer();
    }
    
    createQuadBuffer() {
        const gl = this.gl;
        
        const vertices = new Float32Array([
            -1.0, -1.0, 0.0,     0.0, 0.0, 1.0,     0.0, 0.0,
             1.0, -1.0, 0.0,     0.0, 0.0, 1.0,     1.0, 0.0,
             1.0,  1.0, 0.0,     0.0, 0.0, 1.0,     1.0, 1.0,
            -1.0,  1.0, 0.0,     0.0, 0.0, 1.0,     0.0, 1.0,
        ]);
        
        const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        
        return {
            vertexBuffer,
            indexBuffer,
            vertexCount: indices.length,
            stride: 8 * 4,
            positionOffset: 0,
            normalOffset: 3 * 4,
            texCoordOffset: 6 * 4
        };
    }
    
    createCubeBuffer() {
        const gl = this.gl;
        
        const vertices = [];
        const indices = [];
        
        const faces = [
            { normal: [0, 0, 1], vertices: [[-1,-1,1], [1,-1,1], [1,1,1], [-1,1,1]] },
            { normal: [0, 0, -1], vertices: [[1,-1,-1], [-1,-1,-1], [-1,1,-1], [1,1,-1]] },
            { normal: [0, 1, 0], vertices: [[-1,1,1], [1,1,1], [1,1,-1], [-1,1,-1]] },
            { normal: [0, -1, 0], vertices: [[-1,-1,-1], [1,-1,-1], [1,-1,1], [-1,-1,1]] },
            { normal: [1, 0, 0], vertices: [[1,-1,1], [1,-1,-1], [1,1,-1], [1,1,1]] },
            { normal: [-1, 0, 0], vertices: [[-1,-1,-1], [-1,-1,1], [-1,1,1], [-1,1,-1]] }
        ];
        
        const texCoords = [[0,0], [1,0], [1,1], [0,1]];
        const colors = [
            [1.0, 0.8, 0.6, 1.0],
            [0.8, 0.6, 1.0, 1.0],
            [0.6, 1.0, 0.8, 1.0]
        ];
        
        for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            const baseIndex = vertices.length / 8;
            const color = colors[i % 3];
            
            for (let j = 0; j < 4; j++) {
                vertices.push(
                    face.vertices[j][0], face.vertices[j][1], face.vertices[j][2],
                    face.normal[0], face.normal[1], face.normal[2],
                    texCoords[j][0], texCoords[j][1]
                );
            }
            
            indices.push(
                baseIndex, baseIndex + 1, baseIndex + 2,
                baseIndex, baseIndex + 2, baseIndex + 3
            );
        }
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        return {
            vertexBuffer,
            indexBuffer,
            vertexCount: indices.length,
            stride: 8 * 4,
            positionOffset: 0,
            normalOffset: 3 * 4,
            texCoordOffset: 6 * 4
        };
    }
    
    createSphereBuffer(segments, rings) {
        const gl = this.gl;
        
        const vertices = [];
        const indices = [];
        
        for (let y = 0; y <= rings; y++) {
            for (let x = 0; x <= segments; x++) {
                const u = x / segments;
                const v = y / rings;
                const theta = u * Math.PI * 2;
                const phi = v * Math.PI;
                
                const px = Math.cos(theta) * Math.sin(phi);
                const py = Math.cos(phi);
                const pz = Math.sin(theta) * Math.sin(phi);
                
                vertices.push(
                    px, py, pz,
                    px, py, pz,
                    u, v
                );
            }
        }
        
        for (let y = 0; y < rings; y++) {
            for (let x = 0; x < segments; x++) {
                const a = y * (segments + 1) + x;
                const b = a + segments + 1;
                
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        return {
            vertexBuffer,
            indexBuffer,
            vertexCount: indices.length,
            stride: 8 * 4,
            positionOffset: 0,
            normalOffset: 3 * 4,
            texCoordOffset: 6 * 4
        };
    }
    
    createCloudBuffer() {
        const gl = this.gl;
        
        const vertices = [];
        const indices = [];
        
        const cloudBlobs = [
            { x: 0, y: 0, z: 0, radius: 1.0 },
            { x: -0.8, y: 0.1, z: 0, radius: 0.6 },
            { x: 0.8, y: 0.05, z: 0, radius: 0.7 },
            { x: -0.3, y: 0.3, z: 0, radius: 0.5 },
            { x: 0.4, y: 0.25, z: 0, radius: 0.55 },
            { x: 0, y: -0.1, z: 0.3, radius: 0.5 },
            { x: 0, y: -0.05, z: -0.3, radius: 0.45 }
        ];
        
        const segments = 16;
        const rings = 8;
        
        for (let blobIdx = 0; blobIdx < cloudBlobs.length; blobIdx++) {
            const blob = cloudBlobs[blobIdx];
            const baseIndex = vertices.length / 8;
            
            for (let y = 0; y <= rings; y++) {
                for (let x = 0; x <= segments; x++) {
                    const u = x / segments;
                    const v = y / rings;
                    const theta = u * Math.PI * 2;
                    const phi = v * Math.PI;
                    
                    const px = Math.cos(theta) * Math.sin(phi) * blob.radius + blob.x;
                    const py = Math.cos(phi) * blob.radius + blob.y;
                    const pz = Math.sin(theta) * Math.sin(phi) * blob.radius + blob.z;
                    
                    const nx = Math.cos(theta) * Math.sin(phi);
                    const ny = Math.cos(phi);
                    const nz = Math.sin(theta) * Math.sin(phi);
                    
                    vertices.push(
                        px, py, pz,
                        nx, ny, nz,
                        u, v
                    );
                }
            }
            
            for (let y = 0; y < rings; y++) {
                for (let x = 0; x < segments; x++) {
                    const a = baseIndex + y * (segments + 1) + x;
                    const b = a + segments + 1;
                    
                    indices.push(a, b, a + 1);
                    indices.push(b, b + 1, a + 1);
                }
            }
        }
        
        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        
        return {
            vertexBuffer,
            indexBuffer,
            vertexCount: indices.length,
            stride: 8 * 4,
            positionOffset: 0,
            normalOffset: 3 * 4,
            texCoordOffset: 6 * 4
        };
    }
    
    createPerspectiveMatrix(fov, aspect, near, far) {
        const f = 1.0 / Math.tan(fov / 2);
        const nf = 1 / (near - far);
        
        return new Float32Array([
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0
        ]);
    }
    
    createLookAtMatrix(eye, target, up) {
        const z = this.normalize([
            eye[0] - target[0],
            eye[1] - target[1],
            eye[2] - target[2]
        ]);
        const x = this.normalize(this.cross(up, z));
        const y = this.cross(z, x);
        
        return new Float32Array([
            x[0], y[0], z[0], 0,
            x[1], y[1], z[1], 0,
            x[2], y[2], z[2], 0,
            -this.dot(x, eye), -this.dot(y, eye), -this.dot(z, eye), 1
        ]);
    }
    
    createTranslationMatrix(x, y, z) {
        return new Float32Array([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1
        ]);
    }
    
    createScaleMatrix(x, y, z) {
        return new Float32Array([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1
        ]);
    }
    
    createRotationMatrix(angleX, angleY, angleZ) {
        const cx = Math.cos(angleX), sx = Math.sin(angleX);
        const cy = Math.cos(angleY), sy = Math.sin(angleY);
        const cz = Math.cos(angleZ), sz = Math.sin(angleZ);
        
        const rx = new Float32Array([
            1, 0, 0, 0,
            0, cx, sx, 0,
            0, -sx, cx, 0,
            0, 0, 0, 1
        ]);
        
        const ry = new Float32Array([
            cy, 0, -sy, 0,
            0, 1, 0, 0,
            sy, 0, cy, 0,
            0, 0, 0, 1
        ]);
        
        const rz = new Float32Array([
            cz, sz, 0, 0,
            -sz, cz, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
        
        return this.multiplyMatrix(this.multiplyMatrix(ry, rx), rz);
    }
    
    multiplyMatrix(a, b) {
        const result = new Float32Array(16);
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                result[i * 4 + j] = 0;
                for (let k = 0; k < 4; k++) {
                    result[i * 4 + j] += a[k * 4 + j] * b[i * 4 + k];
                }
            }
        }
        return result;
    }
    
    transposeMatrix(m) {
        return new Float32Array([
            m[0], m[4], m[8], m[12],
            m[1], m[5], m[9], m[13],
            m[2], m[6], m[10], m[14],
            m[3], m[7], m[11], m[15]
        ]);
    }
    
    normalize(v) {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        return [v[0] / len, v[1] / len, v[2] / len];
    }
    
    cross(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    }
    
    dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }
    
    clear(r, g, b, a) {
        const gl = this.gl;
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    
    drawSky(time, levelData) {
        const gl = this.gl;
        const program = this.programs.sky;
        
        gl.useProgram(program);
        
        gl.disable(gl.DEPTH_TEST);
        
        const projection = this.createPerspectiveMatrix(Math.PI / 3, this.aspectRatio, 0.1, 100);
        const view = this.createLookAtMatrix([0, 0, 15], [0, 0, 0], [0, 1, 0]);
        const model = this.createScaleMatrix(80, 80, 80);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, projection);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, view);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, model);
        
        gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time);
        
        const skyColor1 = levelData?.skyColor1 || [0.53, 0.81, 0.92];
        const skyColor2 = levelData?.skyColor2 || [0.88, 0.97, 0.98];
        const sunColor = levelData?.sunColor || [1.0, 0.9, 0.6];
        const sunPosition = levelData?.sunPosition || [0.8, 0.7];
        
        gl.uniform3fv(gl.getUniformLocation(program, 'uSkyColor1'), skyColor1);
        gl.uniform3fv(gl.getUniformLocation(program, 'uSkyColor2'), skyColor2);
        gl.uniform3fv(gl.getUniformLocation(program, 'uSunColor'), sunColor);
        gl.uniform2fv(gl.getUniformLocation(program, 'uSunPosition'), sunPosition);
        
        this.drawBuffer(this.buffers.quad, program, [1, 1, 1, 1]);
        
        gl.enable(gl.DEPTH_TEST);
    }
    
    drawBuffer(buffer, program, color) {
        const gl = this.gl;
        
        const positionLoc = gl.getAttribLocation(program, 'aPosition');
        const normalLoc = gl.getAttribLocation(program, 'aNormal');
        const texCoordLoc = gl.getAttribLocation(program, 'aTexCoord');
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertexBuffer);
        
        if (positionLoc >= 0) {
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, buffer.stride, buffer.positionOffset);
        }
        
        if (normalLoc >= 0) {
            gl.enableVertexAttribArray(normalLoc);
            gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, buffer.stride, buffer.normalOffset);
        }
        
        if (texCoordLoc >= 0) {
            gl.enableVertexAttribArray(texCoordLoc);
            gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, buffer.stride, buffer.texCoordOffset);
        }
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.indexBuffer);
        gl.drawElements(gl.TRIANGLES, buffer.vertexCount, gl.UNSIGNED_SHORT, 0);
    }
    
    drawObject(buffer, modelMatrix, color, alpha = 1.0) {
        const gl = this.gl;
        const program = this.programs.main;
        
        gl.useProgram(program);
        
        const projection = this.createPerspectiveMatrix(Math.PI / 3, this.aspectRatio, 0.1, 100);
        const view = this.createLookAtMatrix([0, 0, 12], [0, 0, 0], [0, 1, 0]);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uProjection'), false, projection);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uView'), false, view);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uModel'), false, modelMatrix);
        
        const normalMatrix = this.transposeMatrix(modelMatrix);
        gl.uniformMatrix4fv(gl.getUniformLocation(program, 'uNormalMatrix'), false, normalMatrix);
        
        gl.uniform3fv(gl.getUniformLocation(program, 'uLightDirection'), [0.5, 1, 0.3]);
        gl.uniform3fv(gl.getUniformLocation(program, 'uLightColor'), [1.0, 1.0, 1.0]);
        gl.uniform3fv(gl.getUniformLocation(program, 'uAmbientColor'), [0.3, 0.3, 0.35]);
        gl.uniform1i(gl.getUniformLocation(program, 'uUseTexture'), 0);
        gl.uniform1f(gl.getUniformLocation(program, 'uAlpha'), alpha);
        
        const colorLoc = gl.getAttribLocation(program, 'aColor');
        if (colorLoc >= 0) {
            gl.vertexAttrib4f(colorLoc, color[0], color[1], color[2], color[3]);
            gl.disableVertexAttribArray(colorLoc);
        }
        
        this.drawBuffer(buffer, program, color);
    }
    
    drawCloud(x, y, tilt, scale, color) {
        const translation = this.createTranslationMatrix(x, y, 0);
        const rotation = this.createRotationMatrix(0, 0, tilt);
        const scaling = this.createScaleMatrix(scale, scale * 0.7, scale);
        
        const modelMatrix = this.multiplyMatrix(
            this.multiplyMatrix(translation, rotation),
            scaling
        );
        
        this.drawObject(this.buffers.cloud, modelMatrix, color);
    }
    
    drawSphere(x, y, z, radius, color) {
        const translation = this.createTranslationMatrix(x, y, z);
        const scaling = this.createScaleMatrix(radius, radius, radius);
        const modelMatrix = this.multiplyMatrix(translation, scaling);
        
        this.drawObject(this.buffers.sphere, modelMatrix, color);
    }
    
    drawCube(x, y, z, scaleX, scaleY, scaleZ, rotationZ, color) {
        const translation = this.createTranslationMatrix(x, y, z);
        const rotation = this.createRotationMatrix(0, 0, rotationZ);
        const scaling = this.createScaleMatrix(scaleX, scaleY, scaleZ);
        
        const modelMatrix = this.multiplyMatrix(
            this.multiplyMatrix(translation, rotation),
            scaling
        );
        
        this.drawObject(this.buffers.cube, modelMatrix, color);
    }
    
    drawRainbow(x, y, width, height) {
        const colors = [
            [1.0, 0.4, 0.4, 0.9],
            [1.0, 0.7, 0.4, 0.9],
            [1.0, 1.0, 0.4, 0.9],
            [0.4, 1.0, 0.4, 0.9],
            [0.4, 0.7, 1.0, 0.9],
            [0.7, 0.4, 1.0, 0.9]
        ];
        
        const numArcs = colors.length;
        const arcSpacing = height / (numArcs * 1.5);
        
        for (let i = 0; i < numArcs; i++) {
            const arcRadius = (height / 2) - i * arcSpacing;
            const arcWidth = arcSpacing * 0.8;
            
            const segments = 32;
            const vertices = [];
            const indices = [];
            
            for (let j = 0; j <= segments; j++) {
                const angle = Math.PI * (j / segments);
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                
                const innerRadius = arcRadius - arcWidth / 2;
                const outerRadius = arcRadius + arcWidth / 2;
                
                vertices.push(
                    x + cosA * innerRadius * (width / height), y + sinA * innerRadius, 0,
                    0, 0, 1,
                    j / segments, 0.5
                );
                
                vertices.push(
                    x + cosA * outerRadius * (width / height), y + sinA * outerRadius, 0,
                    0, 0, 1,
                    j / segments, 0.5
                );
            }
            
            for (let j = 0; j < segments; j++) {
                const baseIdx = j * 2;
                indices.push(
                    baseIdx, baseIdx + 1, baseIdx + 2,
                    baseIdx + 1, baseIdx + 3, baseIdx + 2
                );
            }
            
            const gl = this.gl;
            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
            
            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
            
            const tempBuffer = {
                vertexBuffer,
                indexBuffer,
                vertexCount: indices.length,
                stride: 8 * 4,
                positionOffset: 0,
                normalOffset: 3 * 4,
                texCoordOffset: 6 * 4
            };
            
            this.drawObject(tempBuffer, this.createTranslationMatrix(0, 0, 0), colors[i]);
            
            gl.deleteBuffer(vertexBuffer);
            gl.deleteBuffer(indexBuffer);
        }
    }
    
    drawAnimal(animal) {
        const { x, y, type, scale, falling, fallProgress } = animal;
        
        if (falling && fallProgress > 1) return;
        
        let fallY = 0;
        let fallRotation = 0;
        let alpha = 1.0;
        
        if (falling) {
            fallY = -fallProgress * 5;
            fallRotation = fallProgress * Math.PI * 0.5;
            alpha = Math.max(0, 1 - fallProgress * 0.3);
        }
        
        const animalTypes = {
            bunny: {
                color: [1.0, 0.95, 0.95, 1.0],
                earColor: [1.0, 0.85, 0.85, 1.0],
                innerEarColor: [1.0, 0.7, 0.7, 1.0],
                eyeColor: [0.2, 0.2, 0.3, 1.0],
                noseColor: [1.0, 0.5, 0.5, 1.0]
            },
            cat: {
                color: [0.95, 0.85, 0.6, 1.0],
                earColor: [0.9, 0.8, 0.55, 1.0],
                innerEarColor: [0.95, 0.7, 0.7, 1.0],
                eyeColor: [0.3, 0.6, 0.3, 1.0],
                noseColor: [0.3, 0.2, 0.2, 1.0]
            },
            bird: {
                color: [0.9, 0.5, 0.5, 1.0],
                wingColor: [0.85, 0.45, 0.45, 1.0],
                beakColor: [1.0, 0.8, 0.2, 1.0],
                eyeColor: [0.2, 0.2, 0.3, 1.0]
            },
            bear: {
                color: [0.6, 0.45, 0.35, 1.0],
                earColor: [0.55, 0.4, 0.3, 1.0],
                innerEarColor: [0.7, 0.55, 0.45, 1.0],
                eyeColor: [0.15, 0.1, 0.1, 1.0],
                noseColor: [0.2, 0.1, 0.1, 1.0]
            },
            fox: {
                color: [0.9, 0.5, 0.2, 1.0],
                earColor: [0.85, 0.45, 0.15, 1.0],
                innerEarColor: [1.0, 0.95, 0.9, 1.0],
                eyeColor: [0.2, 0.2, 0.3, 1.0],
                noseColor: [0.2, 0.1, 0.1, 1.0],
                tailTipColor: [1.0, 1.0, 1.0, 1.0]
            }
        };
        
        const config = animalTypes[type] || animalTypes.bunny;
        const s = scale * 0.15;
        
        const translation = this.createTranslationMatrix(x, y + fallY, 0);
        const rotation = this.createRotationMatrix(0, 0, fallRotation);
        const transform = this.multiplyMatrix(translation, rotation);
        
        if (type === 'bird') {
            const bodyScale = this.createScaleMatrix(s * 0.8, s * 0.6, s * 0.6);
            const bodyModel = this.multiplyMatrix(transform, bodyScale);
            this.drawObject(this.buffers.sphere, bodyModel, config.color);
            
            const headScale = this.createScaleMatrix(s * 0.5, s * 0.5, s * 0.5);
            const headTrans = this.createTranslationMatrix(s * 0.6, s * 0.1, 0);
            const headModel = this.multiplyMatrix(transform, this.multiplyMatrix(headTrans, headScale));
            this.drawObject(this.buffers.sphere, headModel, config.color);
            
            const beakScale = this.createScaleMatrix(s * 0.3, s * 0.1, s * 0.15);
            const beakTrans = this.createTranslationMatrix(s * 1.0, s * 0.1, 0);
            const beakModel = this.multiplyMatrix(transform, this.multiplyMatrix(beakTrans, beakScale));
            this.drawObject(this.buffers.cube, beakModel, config.beakColor);
            
            const wingScale = this.createScaleMatrix(s * 0.6, s * 0.1, s * 0.4);
            const wingTrans1 = this.createTranslationMatrix(0, s * 0.2, s * 0.3);
            const wingTrans2 = this.createTranslationMatrix(0, s * 0.2, -s * 0.3);
            const wingModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(wingTrans1, wingScale));
            const wingModel2 = this.multiplyMatrix(transform, this.multiplyMatrix(wingTrans2, wingScale));
            this.drawObject(this.buffers.cube, wingModel1, config.wingColor);
            this.drawObject(this.buffers.cube, wingModel2, config.wingColor);
            
            const eyeScale = this.createScaleMatrix(s * 0.1, s * 0.1, s * 0.1);
            const eyeTrans = this.createTranslationMatrix(s * 0.7, s * 0.25, s * 0.15);
            const eyeModel = this.multiplyMatrix(transform, this.multiplyMatrix(eyeTrans, eyeScale));
            this.drawObject(this.buffers.sphere, eyeModel, config.eyeColor);
        } else {
            const bodyScale = this.createScaleMatrix(s * 0.8, s * 0.7, s * 0.7);
            const bodyModel = this.multiplyMatrix(transform, bodyScale);
            this.drawObject(this.buffers.sphere, bodyModel, config.color);
            
            const headScale = this.createScaleMatrix(s * 0.6, s * 0.55, s * 0.55);
            const headTrans = this.createTranslationMatrix(0, s * 0.6, 0);
            const headModel = this.multiplyMatrix(transform, this.multiplyMatrix(headTrans, headScale));
            this.drawObject(this.buffers.sphere, headModel, config.color);
            
            const earScale = this.createScaleMatrix(s * 0.2, s * 0.4, s * 0.2);
            const innerEarScale = this.createScaleMatrix(s * 0.12, s * 0.25, s * 0.12);
            
            if (type === 'fox') {
                const earRot1 = this.createRotationMatrix(0, 0, -0.3);
                const earRot2 = this.createRotationMatrix(0, 0, 0.3);
                const earTrans1 = this.createTranslationMatrix(-s * 0.3, s * 0.9, 0);
                const earTrans2 = this.createTranslationMatrix(s * 0.3, s * 0.9, 0);
                
                const earModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans1, this.multiplyMatrix(earRot1, earScale)));
                const earModel2 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans2, this.multiplyMatrix(earRot2, earScale)));
                this.drawObject(this.buffers.sphere, earModel1, config.earColor);
                this.drawObject(this.buffers.sphere, earModel2, config.earColor);
                
                const innerEarModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans1, this.multiplyMatrix(earRot1, innerEarScale)));
                const innerEarModel2 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans2, this.multiplyMatrix(earRot2, innerEarScale)));
                this.drawObject(this.buffers.sphere, innerEarModel1, config.innerEarColor);
                this.drawObject(this.buffers.sphere, innerEarModel2, config.innerEarColor);
            } else {
                const earTrans1 = this.createTranslationMatrix(-s * 0.3, s * 0.9, 0);
                const earTrans2 = this.createTranslationMatrix(s * 0.3, s * 0.9, 0);
                
                const earModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans1, earScale));
                const earModel2 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans2, earScale));
                this.drawObject(this.buffers.sphere, earModel1, config.earColor);
                this.drawObject(this.buffers.sphere, earModel2, config.earColor);
                
                const innerEarModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans1, innerEarScale));
                const innerEarModel2 = this.multiplyMatrix(transform, this.multiplyMatrix(earTrans2, innerEarScale));
                this.drawObject(this.buffers.sphere, innerEarModel1, config.innerEarColor);
                this.drawObject(this.buffers.sphere, innerEarModel2, config.innerEarColor);
            }
            
            const eyeScale = this.createScaleMatrix(s * 0.12, s * 0.12, s * 0.12);
            const eyeTrans1 = this.createTranslationMatrix(-s * 0.2, s * 0.65, s * 0.35);
            const eyeTrans2 = this.createTranslationMatrix(s * 0.2, s * 0.65, s * 0.35);
            
            const eyeModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(eyeTrans1, eyeScale));
            const eyeModel2 = this.multiplyMatrix(transform, this.multiplyMatrix(eyeTrans2, eyeScale));
            this.drawObject(this.buffers.sphere, eyeModel1, config.eyeColor);
            this.drawObject(this.buffers.sphere, eyeModel2, config.eyeColor);
            
            const noseScale = this.createScaleMatrix(s * 0.08, s * 0.06, s * 0.08);
            const noseTrans = this.createTranslationMatrix(0, s * 0.5, s * 0.45);
            const noseModel = this.multiplyMatrix(transform, this.multiplyMatrix(noseTrans, noseScale));
            this.drawObject(this.buffers.sphere, noseModel, config.noseColor);
            
            if (type === 'bear' || type === 'fox') {
                const legScale = this.createScaleMatrix(s * 0.15, s * 0.3, s * 0.15);
                const legPositions = [
                    [-s * 0.4, -s * 0.5, s * 0.2],
                    [s * 0.4, -s * 0.5, s * 0.2],
                    [-s * 0.4, -s * 0.5, -s * 0.2],
                    [s * 0.4, -s * 0.5, -s * 0.2]
                ];
                
                for (const pos of legPositions) {
                    const legTrans = this.createTranslationMatrix(pos[0], pos[1], pos[2]);
                    const legModel = this.multiplyMatrix(transform, this.multiplyMatrix(legTrans, legScale));
                    this.drawObject(this.buffers.sphere, legModel, config.color);
                }
            }
            
            if (type === 'fox') {
                const tailScale1 = this.createScaleMatrix(s * 0.5, s * 0.25, s * 0.25);
                const tailTrans1 = this.createTranslationMatrix(-s * 0.8, 0, 0);
                const tailRot1 = this.createRotationMatrix(0, 0, 0.3);
                const tailModel1 = this.multiplyMatrix(transform, this.multiplyMatrix(tailTrans1, this.multiplyMatrix(tailRot1, tailScale1)));
                this.drawObject(this.buffers.sphere, tailModel1, config.color);
                
                const tailTipScale = this.createScaleMatrix(s * 0.15, s * 0.15, s * 0.15);
                const tailTipTrans = this.createTranslationMatrix(-s * 1.2, s * 0.1, 0);
                const tailTipModel = this.multiplyMatrix(transform, this.multiplyMatrix(tailTipTrans, tailTipScale));
                this.drawObject(this.buffers.sphere, tailTipModel, config.tailTipColor);
            }
        }
    }
}

window.WebGLRenderer = WebGLRenderer;