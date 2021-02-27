const SET_ROUND = 'SET_ROUND';
const SET_A_ROUND = 'SET_A_ROUND';

export const setRoundAction = (index: number) => ({
  type: SET_ROUND,
  data: index
})

export const setAnalyzeRoundAction = (index: number) => ({
  type: SET_A_ROUND,
  data: index
})

export interface BasicData {
  round: number,
  analyzeRound: number
}

const initState: BasicData = {
  round: 0,
  analyzeRound: 0
}

const basicReducer = (state = initState, action: any ) => {
  switch(action.type) {
    case SET_ROUND:
      return {...state, ...{round: action.data}}
    case SET_A_ROUND:
      return {...state, ...{analyzeRound: action.data}}
    default:
      return state;
  }
}

export default basicReducer;