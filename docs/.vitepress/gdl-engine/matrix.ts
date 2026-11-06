/**
 * 4x4 变换矩阵运算（列主序，GDL 坐标系：X/Y 平面、Z 向上）。
 * GDL 语义：ADD/MUL/ROT 在当前坐标系基础上叠加；DEL n 回退 n 层。
 */
import type { Mat4 } from './types'

export function identity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

/** c = a * b（先施加 b，再施加 a） */
export function mul(a: Mat4, b: Mat4): Mat4 {
  const out = new Array(16).fill(0)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let s = 0
      for (let k = 0; k < 4; k++) s += a[k * 4 + row] * b[col * 4 + k]
      out[col * 4 + row] = s
    }
  }
  return out
}

export function translate(x: number, y: number, z: number): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]
}

export function scale(x: number, y: number, z: number): Mat4 {
  return [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1]
}

const D2R = Math.PI / 180

/** GDL ROT x,y,z：依次绕 X、Y、Z 轴旋转（角度制） */
export function rotate(xDeg: number, yDeg: number, zDeg: number): Mat4 {
  let m = identity()
  if (xDeg !== 0) m = mul(m, rotX(xDeg * D2R))
  if (yDeg !== 0) m = mul(m, rotY(yDeg * D2R))
  if (zDeg !== 0) m = mul(m, rotZ(zDeg * D2R))
  return m
}

function rotX(r: number): Mat4 {
  const c = Math.cos(r), s = Math.sin(r)
  return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]
}
function rotY(r: number): Mat4 {
  const c = Math.cos(r), s = Math.sin(r)
  return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]
}
function rotZ(r: number): Mat4 {
  const c = Math.cos(r), s = Math.sin(r)
  return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}
