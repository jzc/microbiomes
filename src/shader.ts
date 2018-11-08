import { gl } from "./gl"

export class Shader {
    shaderProgram: WebGLProgram;
    constructor(vertexSource: string, fragmentSource: string) {
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