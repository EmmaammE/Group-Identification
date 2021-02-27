import { DataType } from "../store/leftpanelAction";
import { BasicData } from "../store/reducers/basic";
import { IdentifyData } from "../store/reducers/identify";

export interface Data {
  pos: number[],
  label: number
}

export interface DataItem {
  // 序号
  // id: number,
  // 数据分类
  label: number | boolean,
  [k: string]: any
}

export interface StateType {
  leftPanel: DataType,
  blockIndex: number,
  identify: IdentifyData,
  basic: BasicData
}