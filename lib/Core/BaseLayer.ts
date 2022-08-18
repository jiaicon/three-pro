// @ts-ignore
import { Group, Mesh, Points, TextureLoader } from 'three';
import { Axes, IBaseLayerInstance, ILayer, IScene } from './interface';

class BaseLayer implements ILayer {
  public name: string;
  public mesh?: Mesh | Group | Points;
  private animates: any[];

  private animateId?: number;
  // 整个场景
  public scene?: IScene;
  // 加载器
  public textureLoader: TextureLoader;
  // 坐标系
  public axes: Axes;

  // option: IBaseLayerInstance
  constructor(options: IBaseLayerInstance) {
    this.name = options.name || 'baseLayer';
    this.animates = [];

    this.axes = '3d';

    this.textureLoader = new TextureLoader();
  }

  changeAxes(axes: Axes) {
    this.axes = axes;
    return this;
  }

  animate() {
    this.animates.forEach((ani) => {
      if (typeof ani === 'function') {
        ani();
      }
    });
    this.animateId = requestAnimationFrame(this.animate.bind(this));
  }
  stop() {
    cancelAnimationFrame(this.animateId as number);
  }
  public addAnimate(fn: () => void) {
    this.animates.push(fn);
  }
}

export default BaseLayer;
