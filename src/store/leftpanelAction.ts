export const SET_LEFT_PANEL_DATA = 'SET_LEFT_PANEL_DATA';

export interface updatePCAParams {
  "decision": boolean,// 是否终止联邦
  "heteroDecision": boolean[],// 是否忽略
  "space": any,// 对不忽略的异构定义团体
}

export interface DataType {
  "time": number[][],
  "federated": {
    "loss": [], 
    "gradient": number[][],
    "weight": number[][],
  }, 
  "others": Array<{
    "clientName": string,
    "loss": number[], 
    "gradient": number[][],
    "weight": number[][],
  }>
}

// export const getData = () => async (dispatch: any, getState: any) => {
//   const state = getState();
//   try {
//     const res: any = await fetch('/fl-hetero/initialize/');
//       .then(resp => res.json())
//       .then(resp => {
//         dispatch({
//           type: SET_LEFT_PANEL_DATA,
//           data: resp
//         })
//       })
//   } catch(err) {
//     console.log(err);
//   }

// }

export const updateData = (args: updatePCAParams) => async (dispatch: any, getState: any) => {
  const state = getState();
  try {
    fetch('/fl-hetero/customize', {
      method: 'POST',
      body: JSON.stringify(args)
    }).then(res => res.json())
      .then(res => {
        dispatch({
          type: SET_LEFT_PANEL_DATA,
          data: res
        })
      })
  } catch(err) {
    console.log(err);
  }

}

// export const fetchData = args => async (dispatch, getState) => {
//   const state = getState();
//   const url = `https://jsonplaceholder.typicode.com/users/${  args}`;

//   try {
//     const response = await fetch(url)
//       .then(resp => resp)
//       .then(resp => resp.json());

//     dispatch({
//       type: REMOTE_DATA_RECEIVED,
//       data: response
//     });
//   } catch (error) {
//     console.log(error);
//   }
// };