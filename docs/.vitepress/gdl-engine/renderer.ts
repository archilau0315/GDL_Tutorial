/**
 * Three.js 渲染器：GDL 形状列表 → 3D 场景组。
 * 坐标映射：GDL(x, y, z↑) → three(x, z, -y)，保持右手系。
 * 视觉：数字蓝图风——哑光蓝材质 + 描边线框（CAD 感）。
 */
import * as THREE from 'three'
import type { Shape } from './types'

/** GDL→three 坐标变换矩阵（列主序） */
const COORD_C = new THREE.Matrix4().set(
  1, 0, 0, 0,
  0, 0, 1, 0,
  0, -1, 0, 0,
  0, 0, 0, 1
)

const gdlToThree = (m: number[]): THREE.Matrix4 =>
  new THREE.Matrix4().multiplyMatrices(COORD_C, new THREE.Matrix4().fromArray(m))

/** 材质调色板：MATERIAL 索引 → 蓝图系颜色（未设置用默认蓝） */
const PALETTE = [
  0x5b93cf, // 默认
  0xb0bec5, 0x78909c, 0x8d6e63, 0xa1887f,
  0x90a4ae, 0x64b5f6, 0x4db6ac, 0xffb74d,
  0x81c784, 0xf06292, 0x9575cd, 0x4d6faf
]
const matColor = (idx?: number): number =>
  idx === undefined || idx < 0 ? PALETTE[0] : PALETTE[idx % PALETTE.length]

/**
 * 几何体一律先按 **GDL 本地坐标**（x/y 水平、z 向上）构造，
 * 再统一乘以 COORD_C × M_gdl 映射到 three 视图坐标。
 */
function geometryFor(s: Shape): THREE.BufferGeometry {
  switch (s.type) {
    case 'block': {
      const g = new THREE.BoxGeometry(s.a, s.b, s.c)
      g.translate(s.a / 2, s.b / 2, s.c / 2)
      return g
    }
    case 'cylind': {
      const g = new THREE.CylinderGeometry(s.r, s.r, s.h, 32, 1, false)
      g.rotateX(Math.PI / 2)
      g.translate(0, 0, s.h / 2)
      return g
    }
    case 'sphere': {
      return new THREE.SphereGeometry(s.r, 32, 24)
    }
    case 'cone': {
      const g = new THREE.CylinderGeometry(s.r2, s.r1, s.h, 32, 1, false)
      g.rotateX(Math.PI / 2)
      g.translate(0, 0, s.h / 2)
      return g
    }
    case 'ellips': {
      // GDL ELLIPS h, r：z 向全高 h、水平半径 r，中心在原点
      const g = new THREE.SphereGeometry(1, 32, 24)
      g.scale(s.r, s.r, s.h / 2)
      return g
    }
    case 'prism': {
      // GDL PRISM：底面多边形沿 +z 挤出 h；shape 在 x/y 平面，挤出沿 +z
      const shape = new THREE.Shape()
      let first = true
      for (const p of s.pts) {
        if (first) { shape.moveTo(p.x, p.y); first = false }
        else shape.lineTo(p.x, p.y)
      }
      shape.closePath()
      return new THREE.ExtrudeGeometry(shape, { depth: s.h, bevelEnabled: false, curveSegments: 4 })
    }
  }
}

export interface BuildResult {
  group: THREE.Group
  /** 包围盒（three 世界坐标），供相机自动取景 */
  bbox: THREE.Box3
}

/** 形状列表 → 场景组（每形状一网格 + 边线） */
export function buildGroup(shapes: Shape[], isDark = false): BuildResult {
  const group = new THREE.Group()
  const bbox = new THREE.Box3()

  for (const s of shapes) {
    const geo = geometryFor(s)
    if (!geo) continue
    const mat = new THREE.MeshStandardMaterial({
      color: matColor((s as any).matIdx),
      roughness: 0.55,
      metalness: 0.1,
      transparent: true,
      opacity: 0.92
    })
    const edgeMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x9fd0f0 : 0x042c53
    })
    const mesh = new THREE.Mesh(geo, mat)
    const m = gdlToThree(s.matrix)
    mesh.applyMatrix4(m)

    // 边线（CAD 描边感）
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 25), edgeMat)
    edges.applyMatrix4(m)

    group.add(mesh, edges)
    geo.computeBoundingBox()
    if (geo.boundingBox) bbox.union(geo.boundingBox.clone().applyMatrix4(m))
  }
  return { group, bbox }
}

/** 自动取景：根据包围盒放置相机 */
export function frameCamera(camera: THREE.PerspectiveCamera, bbox: THREE.Box3): void {
  if (bbox.isEmpty()) {
    camera.position.set(3, 2.5, -3)
    camera.lookAt(0, 0, 0)
    return
  }
  const center = bbox.getCenter(new THREE.Vector3())
  const size = bbox.getSize(new THREE.Vector3())
  const radius = Math.max(size.x, size.y, size.z) * 0.5 || 1
  const dist = radius * 2.35
  camera.position.set(center.x + dist * 0.7, center.y + dist * 0.6, center.z - dist * 0.7)
  camera.near = Math.max(radius / 100, 0.01)
  camera.far = dist * 100
  camera.updateProjectionMatrix()
  camera.lookAt(center)
}
