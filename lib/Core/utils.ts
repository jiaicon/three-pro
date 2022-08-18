import * as d3 from 'd3';
import * as THREE from 'three';
import CONST from './const';

export function setDefaultValue(value: any, defaultValue: any): any {
  if ((value ?? '') === '') return defaultValue;
  return value;
}

const { EARTH_RADIUS, SHRINK_SCALE } = CONST;

// 大地坐标系转空间直角坐标系
export function cartographicToXYZ(lng: number, lat: number, alt: number = 0) {
  let lng_degree = THREE.MathUtils.degToRad(lat);
  let lat_degree = THREE.MathUtils.degToRad(lng);

  let distance = (EARTH_RADIUS + alt) * SHRINK_SCALE;
  let projectionDist = distance * Math.cos(lng_degree);

  let point = new THREE.Vector3();
  point.x = projectionDist * Math.sin(lat_degree);
  point.y = distance * Math.sin(lng_degree);
  point.z = projectionDist * Math.cos(lat_degree);

  return point;
}
const geoMercator = d3.geoMercator().center([0, 40]).translate([0, 0]);
export function projection(val: any, scale?: number) {
  return geoMercator.scale(scale || 6)(val);
}

export function random(min: number = 0, max: number = 0) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
