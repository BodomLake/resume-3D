uniform float uSize;
uniform float uTime;

varying vec3 vColor;

attribute vec3 aRandomness;
attribute float aScale;

void main() {
    /**
     * Position
     */
    // modelMatrix position viewMatrix projectionMatrix 都是ShaderMaterial
    // 对顶点着色器程序预置的 attributes 或者 uniforms
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

    // Rotate Y
  float angle = atan(modelPosition.x, modelPosition.z);
  float distanceToCenter = length(modelPosition.xz);
  float angleOffset = (1.0 / distanceToCenter) * uTime * 0.2;
  angle += angleOffset;
  modelPosition.x = cos(angle) * distanceToCenter;
  modelPosition.z = sin(angle) * distanceToCenter;

    // Randomness
  modelPosition.xyz += aRandomness;

  vec4 viewPosition = viewMatrix * modelPosition;
  vec4 projectedPosition = projectionMatrix * viewPosition;

    // 在最后设置了顶点的位置
  gl_Position = projectedPosition;

    /**
     * Size
     */
  gl_PointSize = uSize * aScale;
  gl_PointSize *= (50.0 / -viewPosition.z);

       /**
     * Color
     */
    //  color是由外部引入的attribute, vColor会传到片元着色器
  vColor = color;

}