// 顶点着色器
const vertexShader = `
	// 接收js传入的attribute值，会经过线性插值
	attribute float current;

	// 接收js传入的uniform值
	uniform float uSize;
	uniform float uTime;
	uniform vec3 uColor;
	uniform float uRange;
	uniform float uTotal;
	uniform float uSpeed;
	uniform float circul;

	// 向片元着色器传值颜色和透明度
	varying vec3 vcolor;
	varying float vopacity;

	void main () {
		float size = uSize;
		// 根据时间确定当前飞线的位置， 以结束点为准  fract()返回小数点部分，所以会循环
		float currentEnd = uTotal * fract(uTime * uSpeed);
		// 判断是否需要循环
		if (circul == 0.0) {
			// 根据时间确定当前飞线的位置， 以结束点为准
			currentEnd = uTotal * uTime * uSpeed;
		}
		// 判断当前像素点是否在飞线范围内，如果在范围内设置尺寸和透明度
		if (current < currentEnd && current > currentEnd - uRange) {
				// 设置渐变的尺寸，头大尾小
				float sizePct = (uRange - (currentEnd - current)) / uRange;
				size *= sizePct;
				vopacity = 1.0;
		} else {
				vopacity = 0.0;
		}
		// 将颜色传递给片元着色器
		vcolor = uColor;
		// 设置点的大小
		gl_PointSize = size * 0.4;
		gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
	}
`;
// 片元着色器
const fragmentShader = `
	precision mediump float;
	// 接收顶点着色器传入的值
	varying float vopacity;
	varying vec3 vcolor;

	void main () {
			// 设置颜色
			gl_FragColor = vec4(vcolor, vopacity);
	}
`;

export { vertexShader, fragmentShader };
