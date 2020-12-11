/* eslint-disable no-unused-vars */
export interface IPoints {
  // 第几个数据源
  oIndex: number
  // 第几个点
  iIndex: Map<number, boolean>,
}

export interface PointsState {
  points: IPoints
}

export type PointAction = {
  type: string,
  points: PointsState
}

export type PointsDispatchType = (args: PointAction) => PointAction;