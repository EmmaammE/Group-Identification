/* eslint-disable no-console */
import { batch } from "react-redux";
import http from "../../utils/http";
import HTTP_LEVEL from "../../utils/level";

// identify接口
const SET_DATA = 'SET_DATA';
const SET_LABELS = 'SET_LABELS';
const SET_HETELIST = 'SET_HETELIST';
const SET_PCA = 'SET_PCA';
const SET_SAMPLES = 'SET_SAMPLES';
const SET_LOADING = 'SET_LOADING';
const TOGGLE_LOADING = 'TOGGLE_LOADING';
const INIT_IDENTITY = 'INIT_IDENTITY';
const SET_LEVEL = 'SET_LEVEL';
const SET_CLUSTER_NUMBER = 'SET_CLUSTER_NUMBER';
const SET_LOCAL = 'SET_LOCAL';
const SET_CHOOSE_POINT = 'SET_CHOSE_POINT';

export const defaultCount = 8;
export const defaultAlpha = 10;
export const defaultAllAlpha = 10;
export interface IdentifyData {
  // 本地原始数据
  "localData": number[][],
  // 采样数据
  "samples":  number[][],
  // 真实标签
  "groundTruth": number[],
  // 模型输出标签
  "outputLabels": number[],
  // 异构标签（0：一致，1：不一致）
  // true: 一致
  "heteroLabels": [],
  "localOutputLabel": [],
  // 联邦模型是否正确（0：错误，1：正确）
  "fedResult": [],
  "heteroList": {
    clusterList: Array<{
      "heteroSize": number,// 不一致数据所占空间大小/最细粒度采样节点数
      "heteroIndex": number[], // 分块内不一致数据点的下标
      "heteroRate": number, // 不一致点在块中所占的比例
    }>,
    nrOfClusters: number|null
  },
  // 所有点的cpca
  "pca": {
    "cpc1": [],
    "cpc2": [],
    'alpha': number|null
  },
  // 分块的cpca
  "cpca": {
    "cpc1": [],
    "cpc2": [],
  },
  "loading": boolean,
  "level": number,
  "chosePoint": number,
}

const initState: any= {
  // 预先排序好
  heteroList: {
    clusterList: [],
    nrOfClusters: null
  },
  groundTruth: [],
  outputLabels: [],
  samples: [],
  localData: [],
  heteroLabels: [],
  localOutputLabel: [],
  pca: {
    "cpc1": [],
    "cpc2": [],
    'alpha': defaultAllAlpha
  },
  cpca: {
    "cpc1": [],
    "cpc2": [],
  },
  loading: false,
  level: 0,
  chosePoint: 0,
};
export interface IdentifyParam {
  "round": number, // 用户选择 communication round
  "client": string|number,
  "nrOfClusters": number, // 聚类数量（=block数量）
}

export const getSamplesAction = (type: string) => async (dispatch: any) => {
  try {
    const {data} = await http('/fl-hetero/sampling/', {
      samplingType: type,
    })
    
    if(type === 'local') {
      dispatch({
        type: SET_LOCAL,
        data,
      })
    } else {
      dispatch({
        type: SET_SAMPLES,
        data,
      })
    }
  } catch(err) {
    console.log(err);
  }
}

export const getCPCAResults = (alpha: number|null) => async (dispatch: any) => {
  try {
    const res = await http('/fl-hetero/cpca/all/', alpha ? { alpha, } : {})
    dispatch({
      type: SET_PCA,
      data: res
    })
  } catch(err) {
    console.log(err);
  }
} 

export const getLabelsAction = (round: number) => async (dispatch: any) => {
  // dispatch(loading);
  try {
    const res = await http('/fl-hetero/labels/', {
      "round": round-1,
    })
     dispatch({
      type: SET_LABELS,
      data: res
    })
  } catch(err) {
    console.log(err)
  }
  
}

export const getHeteList = (count: number|null) => async (dispatch: any) => {
  try {
    const res = await http('/fl-hetero/cluster/'
      , count ? {
        "nrOfClusters": count,
      }: {})

    dispatch({
      type: SET_HETELIST,
      data: res
    })
  } catch(err) {
    console.log(err);
  }
}

export const getAllCPCA = (alpha: number|null) => async (dispatch: any) => {
  try {
    const res = await http('/fl-hetero/cpca/all/', {alpha});
    dispatch({
      type: SET_PCA,
      data: res
    })
    // TODO 是否要level变换
  } catch(err) {
    console.log(err);
  }
}

export const loading = (v: boolean) => ({
  type: SET_LOADING,
  data: v
})

export const toggleLoading = () => ({
  type: TOGGLE_LOADING
})

export const initIdentityAction = () => ({
  type: INIT_IDENTITY
})

export const setLevelAction = (level: number) => ({
  type: SET_LEVEL,
  data: level
})

export const setChosePointAction = (index: number) => ({
  type: SET_CHOOSE_POINT,
  data: index
})
// const initState: any= {
//   // 预先排序好
//   heteroList: heteroList.slice(0,20),
//   // heteroList,
//   groundTruth,
//   outputLabels,
//   // samples: [[]],
//   samples,
//   heteroLabels,
//   pca
// };

const identifyReducer = (state = initState, action: any) => {
  switch(action.type) {
    case SET_SAMPLES:
      // console.log(action.data);
      return {...state, samples: action.data}
    case SET_LOCAL:
      return {...state, localData: action.data}

    case SET_LABELS:
      // eslint-disable-next-line no-case-declarations
      const {consistencyLabel, groundTruthLabel, outputLabel, localOutputLabel} = action.data;
      return {...state, 
        groundTruth: groundTruthLabel,
        outputLabels: outputLabel,
        heteroLabels: consistencyLabel,
        localOutputLabel,
      }
    case SET_HETELIST:
      return {...state, 
        heteroList: action.data
      }
    case SET_PCA: 
      return {...state,
        pca: action.data
      }
    case SET_LOADING:
      return {...state, loading: action.data};
    case TOGGLE_LOADING:
      return {...state, loading: !state.loading};
    case INIT_IDENTITY:
      return {...initState, level: HTTP_LEVEL.client+1};
    case SET_LEVEL:
      return {...state, level: action.data};
    case SET_CHOOSE_POINT:
      return {...state, chosePoint: action.data}
    default:
      return state;
  }
}

export default identifyReducer;

export const onTypeUpdateOrInitAction = (type: string, round: number, alpha: number|null, count: number|null) => async (dispatch: any) => {
  await dispatch(loading(true));

  await dispatch(getSamplesAction(type));
  await dispatch(getLabelsAction(round));
  await dispatch(getAllCPCA(alpha || defaultAllAlpha));
  await dispatch(getHeteList(count || defaultCount));
  dispatch({
    type: SET_LEVEL,
    data: HTTP_LEVEL.cpca
  })
  dispatch(loading(false));

  // batch(() => {
  //   dispatch(getSamplesAction(type));
  //   dispatch(getLabelsAction(round));
  //   dispatch(getAllCPCA(alpha || defaultAllAlpha));
  //   dispatch(getHeteList(count || defaultCount));
  //   dispatch({
  //     type: SET_LEVEL,
  //     data: HTTP_LEVEL.cpca
  //   })
  // })
}

export const onRoundAction = (round: number, alpha: number|null, count: number|null) => async (dispatch: any) => {
  await dispatch(loading(true));

  await dispatch(getLabelsAction(round));
  await dispatch(getAllCPCA(alpha || defaultAllAlpha));
  await dispatch(getHeteList(count || defaultCount));
  dispatch({
    type: SET_LEVEL,
    data: HTTP_LEVEL.cpca
  })
  dispatch(loading(false));
}