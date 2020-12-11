import {PointsState, PointAction} from '../types/point';
import {SET_POINTS} from './action'

const initialState = {
  points: {
    oIndex: 0,
    iIndex: new Map
  }
}

const reducer = (
  state: PointsState = initialState,
  action: PointAction
): PointsState => {
  switch (action.type) {
    case SET_POINTS: {
        return  {
          ...state,
          points: action.points as any
        }
      }
      
    default:
      return state
  }
}

export default reducer