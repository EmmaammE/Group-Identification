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
export interface IdentifyData {
  // 本地原始数据
  "localData": number[][],
  // 采样数据
  "samples": number[][],
  // 真实标签
  "groundTruth": number[],
  // 模型输出标签
  "outputLabels": number[],
  // 异构标签（0：一致，1：不一致）
  // true: 一致
  "heteroLabels": [],
  // 联邦模型是否正确（0：错误，1：正确）
  "fedResult": [],
  "heteroList": {
    clusterList: Array<{
      "heteroSize": number,// 不一致数据所占空间大小/最细粒度采样节点数
      "heteroIndex": [], // 分块内不一致数据点的下标
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
  // "loading": boolean,
  "level": number
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
  heteroLabels: [],
  pca: {
    "cpc1": [],
    "cpc2": [],
    'alpha': null
  },
  cpca: {
    "cpc1": [],
    "cpc2": [],
  },
  // loading: false,
  level: 0
};
export interface IdentifyParam {
  "round": number, // 用户选择 communication round
  "client": string|number,
  "nrOfClusters": number, // 聚类数量（=block数量）
}

export const getSamplesAction = (type: string) => async (dispatch: any) => {
  // dispatch(loading);
  try {
    const res = await fetch('/fl-hetero/sampling/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        samplingType: type
        // samplingType: 'samples'
      }),
    })
    const resp = await res.json();
    await dispatch({
      type: SET_SAMPLES,
      data: resp.data
    })
  
    await dispatch({
      type: SET_LEVEL,
      data: HTTP_LEVEL.sampling+1
    })
  } catch(err) {
    console.log(err);
  }
}

export const getPCAResults = (alpha: number|null) => async (dispatch: any) => {
  try {
    const res = await fetch('/fl-hetero/cpca/all/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: alpha ? JSON.stringify({
        alpha
      }): JSON.stringify({
      }),
    });
    const resp = await res.json();

    await dispatch({
      type: SET_PCA,
      data: resp
    })
  } catch(err) {
    console.log(err);
  }
} 

export const getLabelsAction = (round: number) => async (dispatch: any) => {
  // dispatch(loading);
  
  try {
    const res = await fetch('/fl-hetero/labels/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        "round": round,
      }),
    })
    const resp = await res.json();
     
    await dispatch({
      type: SET_LABELS,
      data: resp
    })
  
    await dispatch({
      type: SET_LEVEL,
      data: HTTP_LEVEL.labels + 1
    })
  }catch(err) {
    console.log(err)
  }
  
}

export const getHeteList = (count: number|null) => (dispatch: any) => {
  fetch('/fl-hetero/cluster/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: count ? JSON.stringify({
      "nrOfClusters": count,
    }): JSON.stringify({}),
  })
    .then(res => res.json())
    .then(res =>{
      dispatch({
        type: SET_HETELIST,
        data: res
      })

      dispatch({
        type: SET_LEVEL,
        data: HTTP_LEVEL.clusters + 1
      })
    })
  .catch(err => {
    console.log(err);
  })
}
// actions
export const getDataAction = (param: IdentifyParam) => async (dispatch: any) => {
  try {
    fetch('/fl-hetero/identify/', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(param),
    })
      .then(resp => resp.json())
      .then(res => dispatch({
          type: SET_DATA,
          data: res
        }))
  } catch(err) {
    console.log(err);
  }
}

export const loading = () => ({
  type: SET_LOADING
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
    case SET_LABELS:
      // eslint-disable-next-line no-case-declarations
      const {consistencyLabel, groundTruthLabel, outputLabel} = action.data;
      return {...state, 
        groundTruth: groundTruthLabel,
        outputLabels: outputLabel,
        heteroLabels: consistencyLabel,
        loading: true
      }
    case SET_HETELIST:
      // TODO cluster numbers
      return {...state, 
        heteroList: action.data
      }
    case SET_PCA: 
      return {...state,
        pca: action.data
      }
    case SET_LOADING:
      return {...state, loading: true};
    case TOGGLE_LOADING:
      return {...state, loading: !state.loading};
    case INIT_IDENTITY:
      return {...initState, level: HTTP_LEVEL.client+1};
    case SET_LEVEL:
      return {...state, level: action.data};
    default:
      return state;
  }
}

export default identifyReducer;
