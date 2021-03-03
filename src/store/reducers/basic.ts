const SET_ROUND = 'SET_ROUND';
const SET_PROPERTY = 'SET_PROPERTY';
const SET_NAME = 'SET_NAME';
const SET_UPDATE = 'SET_UPDATE';
const SET_POS = 'SET_POS';
const SET_SIZE = 'SET_SIZE';
const SET_LISTS = 'SET_LISTS';

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

export const setPosAction = (x: number, y: number) => ({
  type: SET_POS,
  x,
  y
})

export const setSizeAction = (size: number) => ({
  type: SET_SIZE,
  data: size
})

export const fetchLists = () => (dispatch: any) => {
  fetch('/fl-hetero/annotationList/')
    .then((res) => res.json())
    .then((res) => {
      // console.log(res);
      const { annotationList } = res;

     dispatch({
       type: SET_LISTS,
       data: annotationList
     })
    });
}
export interface BasicData {
  // 当前分析的round
  round: number,
  // 当前选择的属性
  propertyIndex: number,
  // 客户端名字
  clientName: string,
  // 选择属性的坐标，作为维度名
  pos: number[],
  // 选择的分块.cluster的size
  size: number,
  // 注释列表
  annoLists: any[]
}

const initState: BasicData = {
  round: 0,
  propertyIndex: 0,
  clientName: '',
  pos: [0,0],
  // 选中的cluster的size
  size: 0,
  annoLists: []
}

const basicReducer = (state = initState, action: any ) => {
  switch(action.type) {
    case SET_ROUND:
      return {...state, round: action.data}
    case SET_PROPERTY :
      return {...state, propertyIndex: action.data}
    case SET_NAME:
      return {...state, clientName: action.data}
    // case SET_UPDATE:
      // return {...state, update: !state.update}
    case SET_POS:
      return {...state, pos:[action.x, action.y]}
    case SET_SIZE:
      return {...state, size: action.data}
    case SET_LISTS:
      return {...state, annoLists: action.data}
    default:
      return state;
  }
}

export default basicReducer;