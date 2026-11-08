/**
 * Spiral distortion of the portal for the loading screen's transition (loadingScene.ts).
 *
 * The scene draws the front-facing arch and its vortex into a square "portal layer" canvas
 * each frame; this uploads it as a texture and redraws it through a fragment shader that
 * maps every screen pixel back into the layer along a counter-clockwise spiral:
 *
 *   d   = (pixel − centre) / zoom − jitter        camera zoom about the portal's centre
 *   k   = 1 − smoothstep(0, radius, |d|·e^(0.6·suck))   1 at the centre, 0 at `radius`,
 *                                                  measured on the portal itself (|d| before
 *                                                  the pull), so the stone stays wound into
 *                                                  arms all the way into the centre
 *   φ   = spin + twist · k                        the inner parts turn further: arms wind up
 *   r'  = |d| · exp(suck · (0.6 + 0.4 k))         sampled from further out: pulled inward,
 *                                                  the centre hardest
 *   src = layer centre + r' · (cos(θ + φ), sin(θ + φ))
 *
 * Sampling at θ + φ moves content toward smaller angles: counter-clockwise on a y-down
 * screen. The texture is sampled nearest-neighbour, so the stones stay blocks of pixels that
 * bend rather than blur. A few extra samples further along the spiral add trails behind the
 * bright energy only. One draw call, no allocations per frame.
 */
export interface TwistParams {
  centreX: number; centreY: number;   // portal centre on screen (painting px)
  zoom: number; twist: number; spin: number; suck: number;
  radius: number; trail: number; jitterX: number; jitterY: number;
}

const VERT = `attribute vec2 aPos; void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;
const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uOut, uPix, uCentre, uJitter;
uniform float uLayer, uZoom, uTwist, uSpin, uSuck, uRadius, uTrail;

vec4 at(vec2 d, float phi, float rs) {
  float th = atan(d.y, d.x) + phi;
  vec2 uv = (vec2(uLayer * 0.5) + rs * vec2(cos(th), sin(th))) / uLayer;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture2D(uTex, uv);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uOut.y - gl_FragCoord.y) / uPix;     // painting px, y down
  vec2 d = (p - uCentre) / uZoom - uJitter;
  float r = length(d);
  float k = 1.0 - smoothstep(0.0, uRadius, r * exp(0.6 * uSuck));
  float phi = uSpin + uTwist * k;
  float rs = r * exp(uSuck * (0.6 + 0.4 * k));
  vec4 c = at(d, phi, rs);
  if (uTrail > 0.0) {
    // Light streaks behind the turquoise energy along the spiral (not the stone).
    vec3 glow = vec3(0.0);
    for (int i = 1; i <= 3; i++) {
      // Content moves toward smaller angles, so what was here a moment ago sits at θ − δ.
      vec4 s = at(d, phi - 0.11 * float(i), rs);
      float lum = dot(s.rgb, vec3(0.3, 0.59, 0.11));
      glow += s.rgb * smoothstep(0.45, 0.85, lum) * (0.55 - 0.13 * float(i));
    }
    glow *= uTrail;
    c = vec4(c.rgb + glow * (1.0 - c.a * 0.5), max(c.a, min(1.0, dot(glow, vec3(0.6)))));
  }
  gl_FragColor = c;
}`;

export class PortalTwist {
  readonly canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private prog: WebGLProgram;
  private tex: WebGLTexture;
  private buf: WebGLBuffer;
  private u: Record<string, WebGLUniformLocation | null> = {};
  private parallel: { COMPLETION_STATUS_KHR: number } | null;
  private linked = false;
  private broken = false;

  /** Null when WebGL is unavailable (the scene then falls back to a plain 2D turn and shrink). */
  static create(): PortalTwist | null {
    try { return new PortalTwist(); } catch { return null; }
  }

  private constructor() {
    this.canvas = document.createElement('canvas');
    const gl = this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false });
    if (!gl) throw new Error('no webgl');
    this.gl = gl;
    // Compile without waiting: with KHR_parallel_shader_compile the driver works in the
    // background and ready() polls it, so no frame stalls on the compile (it took ~70 ms).
    this.parallel = gl.getExtension('KHR_parallel_shader_compile');
    const shader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src); gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    this.prog = prog;
    this.buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);   // one full-screen triangle
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.clearColor(0, 0, 0, 0);
  }

  /** True once the shader is compiled and linked (never blocks while the driver is still at it). */
  ready() {
    if (this.linked) return true;
    if (this.broken) return false;
    const gl = this.gl, prog = this.prog;
    if (this.parallel && !gl.getProgramParameter(prog, this.parallel.COMPLETION_STATUS_KHR)) return false;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      this.broken = true;
      if (import.meta.env?.DEV) console.warn('[portalTwist]', gl.getProgramInfoLog(prog));
      return false;
    }
    gl.useProgram(prog);
    for (const name of ['uTex', 'uOut', 'uPix', 'uCentre', 'uJitter', 'uLayer', 'uZoom', 'uTwist', 'uSpin', 'uSuck', 'uRadius', 'uTrail'])
      this.u[name] = gl.getUniformLocation(prog, name);
    const aPos = gl.getAttribLocation(prog, 'aPos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(this.u.uTex, 0);
    this.linked = true;
    return true;
  }

  /**
   * Renders `layer` (a square canvas, painting px, portal centre in its middle) twisted into
   * a w×h canvas whose pixels are `pixX`×`pixY` per painting px. Returns the canvas to draw.
   */
  render(layer: HTMLCanvasElement, w: number, h: number, pixX: number, pixY: number, p: TwistParams): HTMLCanvasElement | null {
    if (!this.ready()) return null;
    const gl = this.gl, u = this.u;
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, layer);
    gl.uniform2f(u.uOut, w, h);
    gl.uniform2f(u.uPix, pixX, pixY);
    gl.uniform2f(u.uCentre, p.centreX, p.centreY);
    gl.uniform2f(u.uJitter, p.jitterX, p.jitterY);
    gl.uniform1f(u.uLayer, layer.width);
    gl.uniform1f(u.uZoom, p.zoom);
    gl.uniform1f(u.uTwist, p.twist);
    gl.uniform1f(u.uSpin, p.spin);
    gl.uniform1f(u.uSuck, p.suck);
    gl.uniform1f(u.uRadius, p.radius);
    gl.uniform1f(u.uTrail, p.trail);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    return this.canvas;
  }

  /** Frees the GPU objects and the context itself. */
  dispose() {
    const gl = this.gl;
    gl.deleteTexture(this.tex); gl.deleteBuffer(this.buf); gl.deleteProgram(this.prog);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.canvas.width = this.canvas.height = 1;
  }
}
