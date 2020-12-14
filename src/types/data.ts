export interface Data {
  pos: number[],
  label: number
}

export interface DataItem {
  // 序号
  id: number,
  // 数据分类
  label: number | string,
  [k: string]: any
}