import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Points,
  PointsMaterial,
  Vector3,
} from 'three';
import BaseLayer from './BaseLayer';
import { IArround, IArroundInstance } from './interface';
import LayerType from './LayerType';
import { random, setDefaultValue } from './utils';

class Arround extends BaseLayer implements IArround {
  number: number;
  constructor(options: IArroundInstance) {
    super({
      name: LayerType.ARROUND,
    });
    this.scene = setDefaultValue(options.scene, undefined);
    this.number = setDefaultValue(options.number, 1000);

    this.init();
  }
  init() {
    const geometry = new BufferGeometry();
    //初始变换点组
    const arround = [];
    for (let i = 0; i < this.number; i++) {
      arround.push(random(-20, 20), random(-20, 20), random(-20, 20));
    }
    geometry.setAttribute('position', new Float32BufferAttribute(arround, 3));
    // 圆形canvas材质
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    canvas.setAttribute(
      'style',
      `
      background: rgba(0, 0, 0, 0);
    `,
    );

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.globalAlpha = 1;
    context.beginPath();
    context.arc(50, 50, 50, 0, 2 * Math.PI, true);
    context.closePath();
    context.fillStyle = '#D2D0CD';
    context.fill();

    const texture = new CanvasTexture(canvas);

    const material = new PointsMaterial({
      size: 0.1,
      sizeAttenuation: true,
      color: '#81745D',
      map: texture,
      transparent: true,
      opacity: 1,
    });
    this.mesh = new Points(geometry, material);
    this.mesh.lookAt(new Vector3(0, 0, 0));
  }
}

export default Arround;
