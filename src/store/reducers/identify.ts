import groundTruth from '../../assets/data_2/groundTruth.json';
import heteroLabels from '../../assets/data_2/heteroLabels.json';
import heteroList from '../../assets/data_2/heteroList.json';
import outputLabels from '../../assets/data_2/outputLabels.json';
import samples from '../../assets/data_2/samples.json';
import pca from '../../assets/data_2/pca.json';

// identify接口
export const SET_DATA = 'SET_DATA';

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
  "heteroLabels": [],
  // 联邦模型是否正确（0：错误，1：正确）
  "fedResult": [],
  "heteroList": Array<{
    "cpca":{
    "cpc1": [],
    "cpc2": [],
    }
    "heteroSize": number,// 不一致数据所占空间大小/最细粒度采样节点数
    "heteroIndex": [], // 分块内不一致数据点的下标
    "heteroRate": [], // 不一致点在块中所占的比例
  }>,
  "pca": {
    "pc1": [],
    "pc2": [],
  }
}

export interface IdentifyParam {
  "round": number, // 用户选择 communication round
  "client": string|number,
  "nrOfClusters": number, // 聚类数量（=block数量）
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

const initState: any= {
  // 预先排序好
  heteroList: heteroList.slice(0,5),
  groundTruth,
  outputLabels,
  samples,
  heteroLabels,
  pca
};

const identifyReducer = (state = initState, action: any) => {
  switch(action.type) {
    default:
      return state;
  }
}

export default identifyReducer;
