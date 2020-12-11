import {PointsState, PointAction} from '../types/point';

export const SET_POINTS = "SET_POINTS";

export function setPoints(points: PointsState) {
  const action: PointAction = {
    type: SET_POINTS,
    points,
  }

  return action;
}
