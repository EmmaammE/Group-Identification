const SET_ROUND = 'SET_ROUND';
const SET_PROPERTY = 'SET_PROPERTY';
const SET_NAME = 'SET_NAME';
const SET_UPDATE = 'SET_UPDATE';

export const setRoundAction = (index: number) => ({
  type: SET_ROUND,
  data: index
})

export const setPropertyAction = (index: number) => ({
  type: SET_PROPERTY,
  data: index
})

export const setNameAction = (name: string) => ({
  type: SET_NAME,
  data: name
})

export const setUpdateAction = () => ({
  type: SET_UPDATE,
})

export interface BasicData {
  round: number,
  propertyIndex: number,
  clientName: string,
  update: boolean
}

const initState: BasicData = {
  round: 0,
  propertyIndex: 0,
  clientName: '',
  update: false
}

const basicReducer = (state = initState, action: any ) => {
  switch(action.type) {
    case SET_ROUND:
      return {...state, ...{round: action.data}}
    case SET_PROPERTY :
      return {...state, ...{propertyIndex: action.data}}
    case SET_NAME:
      return {...state, ...{clientName: action.data}}
    case SET_UPDATE:
      return {...state, ...{update: !state.update}}
    default:
      return state;
  }
}

export default basicReducer;