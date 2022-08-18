import { Group, Vector3 } from 'three';
import { CSS3DSprite } from 'three/examples/jsm/renderers/CSS3DRenderer';
import BaseLayer from './BaseLayer';
import { ISprite, ISpriteFeature, ISpriteInstance } from './interface';
import LayerType from './LayerType';
import { cartographicToXYZ, projection, setDefaultValue } from './utils';

class Sprite extends BaseLayer implements ISprite {
  element: HTMLElement | ((v: ISpriteFeature, index: number) => HTMLElement);
  features: ISpriteFeature[];
  constructor(options: ISpriteInstance) {
    super({
      name: LayerType.SPRITE,
    });
    this.features = setDefaultValue(options.feature, []);
    this.scene = setDefaultValue(options.scene, undefined);
    this.element = setDefaultValue(options.element, false);
    this.axes = setDefaultValue(options.axes, '3d');

    this.init();
  }
  init() {
    const group = new Group();
    this.mesh = group;
    this._setData(this.features);
  }
  removeChild() {
    this.mesh?.remove(...this.mesh.children);
  }
  update() {
    if (this.mesh && this.mesh.type === 'Group') {
      this._setData(this.features);
    }
  }
  setData(features: ISpriteFeature[]) {
    this.features = setDefaultValue(features, []);
    this.update();
  }
  _setData(features: ISpriteFeature[]) {
    if (this.mesh && this.mesh.type === 'Group') {
      this.removeChild();
      features.forEach((feature, index) => {
        const { lnglat } = feature;
        let position;
        if (this.axes === '3d') {
          position = cartographicToXYZ(lnglat[0], lnglat[1]);
        } else {
          const to2d = projection(lnglat, 3) as [number, number];
          position = new Vector3(to2d[0], -to2d[1], 0.5);
        }

        const object = new CSS3DSprite(
          typeof this.element === 'function'
            ? this.element(feature, index)
            : this.element,
        );
        object.scale.set(0.05, 0.05, 0.05);
        object.position.set(position.x, position.y + 0.56, position.z);
        object.lookAt(0, 0, 0);
        this.mesh?.add(object);
      });
    }
  }
}

export default Sprite;
