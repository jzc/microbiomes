import { gl } from "./webgl"

interface VertexAttribute {
    name: string;
    components: number;
    type: "float";
}

export function getVertexSize(va: VertexAttribute) {
    let size: number = 0;
    if (va.type === "float") {
        size = 4;
    } 
    return va.components*size;
}

export function getVertexType(va: VertexAttribute) {
    let typ: number = 0;
    if (va.type == "float") {
        typ = gl.FLOAT;
    }
    return typ;
}

export class Shader {
    shaderProgram: WebGLProgram;
    vertexAttributes: Array<VertexAttribute>;

    constructor(vertexSource: string, fragmentSource: string, vertexAttributes: Array<VertexAttribute>) {
        function loadShader(type: number, source: string) {
            const shader = gl.createShader(type)!;
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }   
            return shader;
        }
        const vertexShader = loadShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentSource);
        const shaderProgram = gl.createProgram()!;
        gl.attachShader(shaderProgram, vertexShader!);
        gl.attachShader(shaderProgram, fragmentShader!);
        gl.linkProgram(shaderProgram);
        
        if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
            alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
        }
        this.shaderProgram = shaderProgram;
        this.vertexAttributes = vertexAttributes
        gl.flush();
    }

    use() {
        gl.useProgram(this.shaderProgram);
    }
    
    setFloat(name: string, value: number) {
        gl.uniform1f(gl.getUniformLocation(this.shaderProgram, name), value);
    }

    setMatrix4(name: string, value: Float32Array, transpose=false) {
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, name), transpose, value);
    }

    setVec3(name: string, value: Float32Array) {
        gl.uniform3fv(gl.getUniformLocation(this.shaderProgram, name), value);
    }
}

export function hasNormals(s: Shader) {
    for (let va of s.vertexAttributes) {
        if (va.name == "aNormal") {
            return true;
        }
    }
    return false;
}

class ColorShader extends Shader {
    static readonly vertexAttributes: Array<VertexAttribute> = [
        {name: "aPos", components: 3, type: "float"},
        {name: "aNormal", components: 3, type: "float"},
        {name: "aColor", components: 3, type: "float"}
    ];

    static readonly vsSource = `#version 300 es
        layout (location = 0) in vec3 aPos;
        layout (location = 1) in vec3 aNormal;
        layout (location = 2) in vec3 aColor;
        
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
        uniform mat4 uNormal;
        uniform mat4 uLightSpaceMatrix;

        out vec3 vPos;
        out vec3 vNormal;
        out vec3 vColor;
        out vec4 vFragPosLightSpace;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPos, 1.0);
            vNormal = mat3(uNormal) * aNormal;
            vPos = vec3(uModel * vec4(aPos, 1.0));
            vColor = aColor;
            vFragPosLightSpace = uLightSpaceMatrix * vec4(vPos, 1.0);
        }
    `;
    static readonly fsSource = `#version 300 es
        precision mediump float;

        in vec3 vPos;
        in vec3 vNormal;
        in vec3 vColor;
        in vec4 vFragPosLightSpace;

        uniform vec3 uLightColor;
        uniform vec3 uLightDir;
        uniform vec3 uViewPos;

        uniform sampler2D shadowMap;

        out vec4 fragColor;

        float ShadowCalculation() {
            vec3 projCoords = vFragPosLightSpace.xyz / vFragPosLightSpace.w;
            projCoords = projCoords * 0.5 + 0.5; 
            float closestDepth = texture(shadowMap, projCoords.xy).r;   
            float currentDepth = projCoords.z;  
            float bias = 0.005;
            // float shadow = currentDepth - bias > closestDepth  ? 1.0 : 0.0; 
            float shadow = 0.0;
            vec2 texelSize = 1.0 / vec2(textureSize(shadowMap, 0));
            for(int x = -1; x <= 1; ++x)
            {
                for(int y = -1; y <= 1; ++y)
                {
                    float pcfDepth = texture(shadowMap, projCoords.xy + vec2(x, y) * texelSize).r; 
                    shadow += currentDepth - bias > pcfDepth ? 1.0 : 0.0;        
                }    
            }
            shadow /= 9.0; 
            return shadow;
        }

        void main() {
            vec3 lightDir = normalize(-uLightDir);

            float ambientStrength = 0.2;
            vec3 ambient = ambientStrength * uLightColor;
            
            vec3 norm = normalize(vNormal);
            float diff = max(dot(norm, lightDir), 0.0);
            vec3 diffuse = diff * uLightColor;

            float specularStrength = 0.1;
            vec3 viewDir = normalize(uViewPos - vPos);
            vec3 reflectDir = reflect(-lightDir, norm);  
            float spec = pow(max(dot(viewDir, reflectDir), 0.0), 2.0);
            vec3 specular = specularStrength * spec * uLightColor; 

            float shadow = ShadowCalculation();
            vec3 result = (ambient + (1.0 - shadow) * (diffuse + specular)) * vColor;
            fragColor = vec4(result, 1);
        }
    `;

    constructor() {
        super(ColorShader.vsSource, ColorShader.fsSource, ColorShader.vertexAttributes);
    }
}

export const colorShader = new ColorShader();

class BasicShader extends Shader {
    static readonly vertexAttributes: Array<VertexAttribute> = [
        {name: "aPos", components: 3, type: "float"},
        {name: "aColor", components: 3, type: "float"}
    ];

    static readonly vsSource = `#version 300 es
        layout (location = 0) in vec3 aPos;
        layout (location = 2) in vec3 aColor;
        
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;

        out vec3 vColor;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPos, 1);
            vColor = aColor;
        }
    `;

    static readonly fsSource = `#version 300 es
        precision mediump float;
        
        in vec3 vColor;

        out vec4 fragColor;

        void main() {
            fragColor = vec4(vColor, 1);
        }
    `;

    constructor() {
        super(BasicShader.vsSource, BasicShader.fsSource, BasicShader.vertexAttributes);
    }
}

export const basicShader = new BasicShader();

class DebugShader extends Shader {
    static readonly vsSource = `#version 300 es
        layout (location = 0) in vec3 aPos;
        layout (location = 2) in vec2 aTexCoords;

        out vec2 vTexCoords;

        void main() {
            gl_Position = vec4(aPos, 1);
            vTexCoords = aTexCoords;
        }
    `

    static readonly fsSource = `#version 300 es
        precision mediump float;

        in vec2 vTexCoords;

        uniform sampler2D tex;

        out vec4 fragColor;

        void main() {
            fragColor = texture(tex, vTexCoords);
        }
    `

    constructor() {
        super(DebugShader.vsSource, DebugShader.fsSource, []);
    }
}

export const debugShader = new DebugShader();

class ShadowShader extends Shader {
    static readonly vsSource = `#version 300 es
        layout (location = 0) in vec3 aPos;

        uniform mat4 uLightSpaceMatrix;
        uniform mat4 uModel;

        void main() {
            gl_Position = uLightSpaceMatrix * uModel * vec4(aPos, 1.0);
        }
    `;

    static readonly fsSource = `#version 300 es
        void main() {

        }
    `;

    constructor() {
        super(ShadowShader.vsSource, ShadowShader.fsSource, []);
    }
}

export const shadowShader = new ShadowShader();