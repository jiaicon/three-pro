import Arround from './Core/Arround';
import BaseLayer from './Core/BaseLayer';
import CONST from './Core/const';
import Earth from './Core/EarthLayer';
import FlyLine from './Core/FlyLine';
import Heatmap from './Core/Heatmap';
import LayerType from './Core/LayerType';
import Scene from './Core/Scene';
import Sprite from './Core/Sprite';
import WavePoint from './Core/WavePoint';

export * from './Core/interface';
export * from './Core/utils';
export {
  BaseLayer,
  Earth,
  Scene,
  FlyLine,
  Sprite,
  WavePoint,
  Arround,
  Heatmap,
  CONST,
  LayerType,
};

// el: 地球
// earth.current = new Earth({
//   deploy: mapType,
//   rotate: false,
//   cloud: false,
//   arround: false,
//   load: true,
//   scene: scene.current,
// });
// scene.current?.add(earth.current);

// el: 飞线
// new FlyLineLayer({
//   feature: [],
//   isMove: true,
//   scene: this.scene,
// });

// el: 精灵图
// new SpriteLayer({
//   feature: [],
//   element: this.spriteEl,
//   scene: this.scene,
// });

// el: 水波纹
// new WavePointLayer({
//   feature: [],
//   color: '#EB6100',
// });
