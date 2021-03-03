// identify接口
const SET_DATA = 'SET_DATA';
const SET_LABELS = 'SET_LABELS';
const SET_HETELIST = 'SET_HETELIST';
const SET_PCA = 'SET_PCA';
const SET_SAMPLES = 'SET_SAMPLES';
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
  "heteroList": Array<{
    // "cpca":{
    // "cpc1": [],
    // "cpc2": [],
    // }
    "heteroSize": number,// 不一致数据所占空间大小/最细粒度采样节点数
    "heteroIndex": [], // 分块内不一致数据点的下标
    "heteroRate": number, // 不一致点在块中所占的比例
  }>,
  "pca": {
    "pc1": [],
    "pc2": [],
  },
  "cpca": {
    "cpc1": [],
    "cpc2": [],
  }
}

const initState: any= {
  // 预先排序好
  heteroList: [],
  groundTruth: [],
  outputLabels: [],
  samples: [],
  heteroLabels: [],
  pca: {
    "pc1": [],
    "pc2": [],
  },
  cpca: {
    "cpc1": [],
    "cpc2": [],
  }
};
export interface IdentifyParam {
  "round": number, // 用户选择 communication round
  "client": string|number,
  "nrOfClusters": number, // 聚类数量（=block数量）
}

export const getSamplesAction = (type: string) => async (dispatch: any) => {
  fetch('/fl-hetero/sampling/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      samplingType: type
    }),
  })
    .then(res => res.json())
    .then(res => dispatch({
      type: SET_SAMPLES,
      data: res.data
    }))
  .catch(err => {
    console.log(err);
  })
}

export const getPCAResults = () => async (dispatch: any) => {
  fetch('/fl-hetero/pca/')
    .then(res => res.json())
    .then(res => dispatch({
      type: SET_PCA,
      data: res
    }))
}

export const getLabelsAction = (round: number) => async (dispatch: any) => {
  fetch('/fl-hetero/labels/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "round": round,
    }),
  })
    .then(res => res.json())
    .then(res => dispatch({
      type: SET_LABELS,
      data: res
    }))
  .catch(err => {
    console.log(err);
  })
}

export const getHeteList = (count: number) => (dispatch: any) => {
  fetch('/fl-hetero/cluster/', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      "nrOfClusters": count,
    }),
  })
    .then(res => res.json())
    .then(res => dispatch({
      type: SET_HETELIST,
      data: res.clusterList
    }))
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

// export const getDatum = (type: string, round: number) => (dispatch:any) => {
//   Promise.all([
//     dispatch(getSamplesAction(type),
//     dispatch(getSamplesAction(type),

//   ])
// }

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
        heteroLabels: consistencyLabel
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
    default:
      return state;
  }
}

export default identifyReducer;
