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

    setMatrix4(name:string, value: Float32List, transpose=false) {
        gl.uniformMatrix4fv(gl.getUniformLocation(this.shaderProgram, name), transpose, value);
    }
}

class ColorShader extends Shader {
    static readonly vertexAttributes: Array<VertexAttribute> = [
        {name: "aPosition", components: 3, type: "float"},
        {name: "aNormal", components: 3, type: "float"},
        {name: "aColor", components: 3, type: "float"}
    ];

    static readonly vsSource = `
        attribute vec3 aPosition;
        attribute vec3 aNormal;
        attribute vec3 aColor;
        
        uniform mat4 uModel;
        uniform mat4 uView;
        uniform mat4 uProjection;

        varying lowp vec3 vNormal;
        varying lowp vec3 vColor;

        void main() {
            gl_Position = uProjection * uView * uModel * vec4(aPosition, 1);
            vNormal = aNormal;
            vColor = aColor;
        }
    `;
    static readonly fsSource = `
        varying lowp vec3 vNormal;
        varying lowp vec3 vColor;

        void main() {
            // lowp vec3 color = abs(vNormal);
            gl_FragColor = vec4(vColor, 1);
        }
    `;

    constructor() {
        super(ColorShader.vsSource, ColorShader.fsSource, ColorShader.vertexAttributes);
    }
}

export const colorShader = new ColorShader();