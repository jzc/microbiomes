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

class ColorShader extends Shader {
    static readonly vertexAttributes: Array<VertexAttribute> = [
        {name: "aPos", components: 3, type: "float"},
        {name: "aNormal", components: 3, type: "float"},
        {name: "aColor", components: 3, type: "float"}
    ];

    static readonly vsSource = `
        attribute vec3 aPos;
        attribute vec3 aNormal;
        attribute vec3 aColor;
        
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;
        uniform mat4 uNormal;

        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vColor;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPos, 1);
            vNormal = mat3(uNormal) * aNormal;
            vColor = aColor;
        }
    `;
    static readonly fsSource = `
        precision mediump float;

        varying vec3 vPos;
        varying vec3 vNormal;
        varying vec3 vColor;

        uniform vec3 uLightColor;
        uniform vec3 uLightDir;
        uniform vec3 uViewPos;

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

            vec3 result = (ambient + diffuse + specular) * vColor;
            gl_FragColor = vec4(result, 1);
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

    static readonly vsSource = `
        attribute vec3 aPos;
        attribute vec3 aColor;
        
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;

        varying vec3 vColor;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPos, 1);
            vColor = aColor;
        }
    `;

    static readonly fsSource = `
        precision mediump float;
        
        varying vec3 vColor;

        void main() {
            gl_FragColor = vec4(vColor, 1);
        }
    `;

    constructor() {
        super(BasicShader.vsSource, BasicShader.fsSource, BasicShader.vertexAttributes);
    }
}

export const basicShader = new BasicShader();