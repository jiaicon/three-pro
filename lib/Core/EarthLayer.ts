import TWEEN from '@tweenjs/tween.js';
import {
  BufferGeometry,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Points,
  PointsMaterial,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from 'three';
import BaseLayer from './BaseLayer';
import CONST from './const';
import cloud_img from './imgs/cloud.jpg';
import dot_img from './imgs/dot.png';
import earth_img from './imgs/earth.jpg';
import earth_1_img from './imgs/earth_1.png';
import earth_impact from './imgs/impact-512.jpg';
import earth_blur from './imgs/map_blur.jpg';
import merge_from_ofoct_img from './imgs/merge_from_ofoct.jpg';
import popularJSON from './imgs/popular.json';
import wordJSON from './imgs/word.json';
import { EarthType, IEarth, IEarthInstance } from './interface';
import LayerType from './LayerType';
import {
  cartographicToXYZ,
  projection,
  random,
  setDefaultValue,
} from './utils';

const { EARTH_RADIUS, SHRINK_SCALE } = CONST;
class EarthLayer extends BaseLayer implements IEarth {
  color?: any;
  cloud?: boolean;
  impact?: boolean;
  arround?: boolean;
  load?: boolean;
  rotate?: boolean; //
  _rotate?: boolean; // 真实的是否执行动画
  deploy?: EarthType;
  earthType: string;
  vertices0: Float32BufferAttribute;
  vertices1: Float32BufferAttribute;
  point?: Points;

  // 几种地球
  earthMesh: Group | Mesh | Points | null;
  extrudeEarth: Group | Mesh | Points | null;
  jueJinEarth: Group | Mesh | Points | null;
  pointEarth: Group | Mesh | Points | null;
  lineEarth: Group | Mesh | Points | null;

  cloudMesh: Mesh | null;
  arroundMesh: Mesh | Points | null;

  // 所有的地球类型
  category: string[];

  // 动画id
  requestId?: number;

  constructor(options: IEarthInstance) {
    super({
      name: LayerType.EARTH,
    });

    this.color = setDefaultValue(options.color, 0xffffff);
    this.cloud = setDefaultValue(options.cloud, true);
    this.impact = setDefaultValue(options.impact, false);
    this.arround = setDefaultValue(options.arround, false);
    this.load = setDefaultValue(options.load, true);
    this._rotate = this.rotate = setDefaultValue(options.rotate, true);
    this.deploy = setDefaultValue(options.deploy, 'earth');
    this.earthType = setDefaultValue(options.type, 'point');
    this.scene = setDefaultValue(options.scene, undefined);

    this.vertices0 = new Float32BufferAttribute([], 3);
    this.vertices1 = new Float32BufferAttribute([], 3);

    // 初始化地球
    this.earthMesh = null;
    this.extrudeEarth = null;
    this.jueJinEarth = null;
    this.pointEarth = null;
    this.lineEarth = null;

    this.cloudMesh = null;
    this.arroundMesh = null;

    this.category = [
      'extrudeEarth',
      'jueJinEarth',
      'pointEarth',
      'earthMesh',
      'lineEarth',
    ];

    this.init();
  }
  init() {
    // 保存地球的所有物体
    this.mesh = new Group();
    this.mesh.name = 'earthGroup';

    // // 平面3D图
    // this.extrudeEarth = this.initExtrudeEarth();
    // this.mesh.add(this.extrudeEarth);

    // // 掘金粒子
    // this.jueJinEarth = this.initJueJinEarth();
    // this.mesh.add(this.jueJinEarth);

    // // 真实地球
    // this.earthMesh = this.initEarth();
    // this.mesh.add(this.earthMesh);

    // // 点状地球
    // this.pointEarth = this.initPointEarth();
    // this.mesh.add(this.pointEarth);
    this.chooseEarth();

    if (this.impact) {
      this.mesh.add(this.initEarthLight());
    }

    if (this.cloud) {
      this.cloudMesh = this.createCloud();
      this.mesh.add(this.cloudMesh);
    }

    if (this.arround) {
      this.arroundMesh = this.createArround() as Points;
      this.mesh.add(this.arroundMesh);
    }

    // 加载动画
    this.loaded();
    this.animate();
  }
  loaded() {
    if (this.load && this.mesh) {
      this.mesh.scale.set(0.1, 0.1, 0.1);

      const tween = new TWEEN.Tween(this.mesh.scale);
      tween.to(
        {
          x: 1,
          y: 1,
          z: 1,
        },
        1000,
      );
      tween.easing(TWEEN.Easing.Exponential.In);
      tween.start();
    }
  }
  chooseEarth() {
    this.category.forEach((cate: any) => {
      // @ts-ignore
      if (this[cate]) {
        // @ts-ignore
        this[cate].visible = false;
      }
    });
    switch (this.deploy) {
      case 'earth':
        if (!this.earthMesh) {
          this.earthMesh = this.initEarth();
          this.mesh?.add(this.earthMesh);
        }
        this.earthMesh.visible = true;
        this.axes = '3d';
        break;
      case 'extrudeEarth':
        if (!this.extrudeEarth) {
          this.extrudeEarth = this.initExtrudeEarth();
          this.mesh?.add(this.extrudeEarth);
        }
        this.extrudeEarth.visible = true;
        this.axes = '2d';
        break;
      case 'jueJinEarth':
        if (!this.jueJinEarth) {
          this.jueJinEarth = this.initJueJinEarth();
          this.mesh?.add(this.jueJinEarth);
        }
        this.jueJinEarth.visible = true;
        this.axes = '3d';
        break;
      case 'pointEarth':
        if (!this.pointEarth) {
          this.pointEarth = this.initPointEarth();
          this.mesh?.add(this.pointEarth);
        }
        this.pointEarth.visible = true;
        this.axes = '2d';
        break;
      case 'lineEarth':
        if (!this.lineEarth) {
          this.lineEarth = this.initLineEarth();
          this.mesh?.add(this.lineEarth);
        }
        this.lineEarth.visible = true;
        this.axes = '2d';
        break;
      default:
    }
  }
  initJueJinEarth() {
    const lineTexture = this.textureLoader.load(merge_from_ofoct_img);
    const fillTexture = this.textureLoader.load(earth_1_img);
    const mapTexture = this.textureLoader.load(dot_img);
    const uniforms = {
      lineTexture: { value: lineTexture },
      fillTexture: { value: fillTexture },
      mapTexture: { value: mapTexture },
    };
    // 内层球材质
    const shaderMaterial = new ShaderMaterial({
      uniforms: uniforms,
      side: DoubleSide,
      vertexShader: `
        precision highp float;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float _alpha;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
          gl_Position = projectionMatrix * mvPosition;
        }
        `,
      fragmentShader: `
        uniform sampler2D lineTexture;
        uniform sampler2D fillTexture;
        uniform sampler2D mapTexture;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying float _alpha;
        void main() {
          vec4 lineColor = texture2D( lineTexture, vUv );
          vec4 fillColor = texture2D( fillTexture, vUv );
          // 由于我们希望得到一个球的两边亮一些的效果，
          // 就得借助球表面的向量在Z轴上的投影的大小来达到变化颜色的效果
          // vNormal代表每个垂直于球平面的向量，再点乘Z轴，因为摄像头是从Z向里看的，
          // 所以这里我们取(0.0, 0.0, 1.0)，Z轴
          float silhouette = dot(vec3(0.0, 0.0, 1.0) ,vNormal );
          lineColor = vec4(lineColor.rgb,1.0);
          float z = gl_FragCoord.z;
          if(lineColor.r <= 0.1) {
            if(fillColor.r <= 0.1) {
              float x = sin(vUv.x * 1000.0) * 0.5 + 0.5;
              float y = sin(vUv.y * 1000.0) * 0.5 + 0.5;
              vec4 mapColor = texture2D( mapTexture, vec2(x, y) );
              // 球面变化关联到颜色
              float c = pow(1.0 - abs(silhouette), 1.0);
              if(c < 0.2) {
                c = 0.2;
              }
              // lineColor = vec4(c,c,c, 1.0) * mapColor.rgb;
              lineColor = vec4(0.9568,0.8274,0.6431, 1.0);
            } else {
              discard;
            }
          }
          gl_FragColor = vec4(lineColor.rgb * vec3(244.0/255.0, 211.0/255.0, 164.0/255.0), 1.0);
        }
      `,
      transparent: true,
    });

    const group = new Group();
    const geo = new SphereGeometry(EARTH_RADIUS * SHRINK_SCALE, 40, 30);
    const material = new MeshBasicMaterial({
      color: '#383F38',
      transparent: true,
      opacity: 0.45,
    });
    const mesh = new Mesh(geo, shaderMaterial);
    const m1 = new Mesh(geo, material);
    group.add(mesh, m1);
    group.rotation.y += -77 * (Math.PI / 180);
    return group;
  }
  initEarth() {
    const earthGeometry = new SphereGeometry(
      EARTH_RADIUS * SHRINK_SCALE,
      40,
      30,
    );
    const earthMaterial = new MeshPhongMaterial({
      map: this.textureLoader.load(earth_img),
      specularMap: this.textureLoader.load(earth_blur),
      shininess: 100,
      side: DoubleSide,
    });

    const earthMesh = new Mesh(earthGeometry, earthMaterial);
    earthMesh.name = 'earth';
    earthMesh.rotation.y = -(Math.PI / 2).toFixed(2);

    return earthMesh;
  }
  initEarthLight() {
    const texture = this.textureLoader.load(earth_impact);
    const spriteMaterial = new SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      color: '#212721',
    });
    const sprite = new Sprite(spriteMaterial);
    sprite.scale.set(18, 18, 1);
    return sprite;
  }
  initExtrudeEarth() {
    const group = new Group();

    const features = wordJSON.features;
    features.forEach((feature) => {
      const { type, coordinates } = feature.geometry;
      if (type === 'MultiPolygon') {
        coordinates.forEach((coordinate) => {
          coordinate.forEach((polygon) => {
            const mesh = this.buildShape(polygon as number[][]);
            group.add(mesh);
          });
        });
      } else if (type === 'Polygon') {
        coordinates.forEach((coordinate) => {
          const mesh = this.buildShape(coordinate as number[][]);
          group.add(mesh);
        });
      }
    });
    return group;
  }
  initLineEarth() {
    const group = new Group();

    const features = wordJSON.features;
    features.forEach((feature) => {
      const { type, coordinates } = feature.geometry;
      if (type === 'MultiPolygon') {
        coordinates.forEach((coordinate) => {
          coordinate.forEach((polygon) => {
            const mesh = this.buildShape(polygon as number[][], {
              isExtrude: false,
              isLine: true,
            });
            group.add(mesh);
          });
        });
      } else if (type === 'Polygon') {
        coordinates.forEach((coordinate) => {
          const mesh = this.buildShape(coordinate as number[][], {
            isExtrude: false,
            isLine: true,
          });
          group.add(mesh);
        });
      }
    });
    return group;
  }
  buildShape(
    coordinate: number[][],
    options: { isLine?: boolean; isExtrude?: boolean } = {
      isLine: true,
      isExtrude: true,
    },
  ) {
    const group = new Group();
    const shape = new Shape();
    const lineGeometry = new BufferGeometry();
    const lineMaterial = new LineBasicMaterial({
      color: '#F4D3A4',
      side: DoubleSide,
    });
    const lines = [];
    for (let i = 0; i < coordinate.length; i++) {
      const [lng, lat] = coordinate[i] as [number, number];
      const [x, y] = projection([lng, lat], 6) as [number, number];

      if (i === 0) {
        shape.moveTo(x, -y);
      }
      shape.lineTo(x, -y);
      lines.push(x, -y, 1);
    }

    lineGeometry.setAttribute('position', new Float32BufferAttribute(lines, 3));

    const extrudeSettings = {
      depth: 1,
      bevelEnabled: false,
    };
    const geometry = new ExtrudeGeometry(shape, extrudeSettings);
    geometry.scale(0.5, 0.5, 0.5);
    lineGeometry.scale(0.5, 0.5, 0.5);
    const material = new MeshBasicMaterial({
      color: '#F4D3A4',
      transparent: true,
      opacity: 1,
    });
    const material1 = new MeshBasicMaterial({
      color: '#432F1D',
      transparent: true,
      opacity: 1,
    });
    const line = new Line(lineGeometry, lineMaterial);
    const extrude = new Mesh(geometry, [material, material1]);

    if (options.isLine) {
      group.add(line);
    }
    if (options.isExtrude) {
      group.add(extrude);
    }
    return group;
  }
  initPointEarth() {
    // 圆形canvas材质
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.fillStyle = '#D2D0CD';

    context.arc(50, 50, 45, 0, 2 * Math.PI);
    context.fill();

    const texture = new Texture(canvas);

    texture.needsUpdate = true;

    const geometry = new BufferGeometry();

    // 生成顶点信息
    const vertices = this.chooseVertices(true) as {
      colors: Float32BufferAttribute;
      vertices: Float32BufferAttribute;
    };
    geometry.setAttribute('position', vertices.vertices);

    geometry.setAttribute('color', vertices.colors);

    const material = new PointsMaterial({
      map: texture,
      size: 1 * 0.1,
      side: DoubleSide,
      transparent: true,
      color: '#F4D3A4',
    });
    material.vertexColors = true;
    const point = new Points(geometry, material);
    point.lookAt(new Vector3(0, 0, 0));
    return point;
  }
  chooseVertices(
    isColor = false,
  ):
    | Float32BufferAttribute
    | { colors: Float32BufferAttribute; vertices: Float32BufferAttribute } {
    const pxyz_arr0 = [];
    const pxyz_arr1 = [];
    const colors = [];
    const color = new Color();
    const _color = color.setStyle('#F4D3A4');
    for (let i = 0; i < popularJSON.length; i++) {
      const pcoor = popularJSON[i];
      const pxyz = cartographicToXYZ(pcoor[0], pcoor[1]);
      pxyz_arr0.push(pxyz.x, pxyz.y, pxyz.z);

      const pxyz1 = projection(pcoor, 6) as [number, number];
      pxyz_arr1.push(pxyz1[0], pxyz1[1], 0);
      colors.push(_color.r, _color.g, _color.b);
    }

    this.vertices0 = new Float32BufferAttribute(pxyz_arr0, 3);
    this.vertices1 = new Float32BufferAttribute(pxyz_arr1, 3);
    if (isColor) {
      return this.deploy === 'pointEarth'
        ? {
            colors: new Float32BufferAttribute(colors, 3),
            vertices: new Float32BufferAttribute(pxyz_arr1, 3),
          }
        : {
            colors: new Float32BufferAttribute(colors, 3),
            vertices: new Float32BufferAttribute(pxyz_arr0, 3),
          };
    }
    return this.deploy === 'pointEarth'
      ? new Float32BufferAttribute(pxyz_arr1, 3)
      : new Float32BufferAttribute(pxyz_arr0, 3);
  }
  changeType(s: EarthType) {
    this.deploy = s;
    this.chooseEarth();
    this.loaded();
  }
  createCloud() {
    // 创建包裹地球的云
    const cloudGeometry = new SphereGeometry(
      EARTH_RADIUS * SHRINK_SCALE + 0.3,
      40,
      30,
    );
    const cloudMaterial = new MeshPhongMaterial({
      map: this.textureLoader.load(cloud_img),
      side: DoubleSide,
      transparent: true,
      opacity: 0.2,
    });
    const cloudMesh = new Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.name = 'cloud';

    return cloudMesh;
  }
  createArround() {
    const geometry = new BufferGeometry();
    //初始变换点组
    const arround = [];
    for (let i = 0; i < 1000; i++) {
      arround.push(random(-20, 20), random(-20, 20), random(-20, 20));
    }
    geometry.setAttribute('position', new Float32BufferAttribute(arround, 3));
    // 圆形canvas材质
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.fillStyle = '#D2D0CD';

    context.arc(50, 50, 45, 0, 2 * Math.PI);
    context.fill();

    const texture = new Texture(canvas);

    texture.needsUpdate = true;

    const material = new PointsMaterial({
      map: texture,
      size: 0.1,
      sizeAttenuation: true,
      color: '#81745D',
      transparent: true,
      opacity: 1,
    });
    const mesh = new Points(geometry, material);
    mesh.lookAt(new Vector3(0, 0, 0));
    return mesh;
  }

  rotateMesh() {
    if (this._rotate) {
      if (this.jueJinEarth) {
        this.jueJinEarth.rotation.y -= 0.0015;
      }
      if (this.earthMesh) {
        this.earthMesh.rotation.y -= 0.0015;
      }
      if (this.cloudMesh) {
        this.cloudMesh.rotation.y += 0.002;
      }
      if (this.arroundMesh) {
        this.arroundMesh.rotation.y -= 0.0015;
      }
    }
  }

  animate() {
    this.rotateMesh();
    TWEEN.update();
    this.requestId = requestAnimationFrame(this.animate.bind(this));
  }

  cancelAnimate() {
    if (this.requestId !== undefined) {
      cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  }
}

export default EarthLayer;
