import { combineReducers } from 'redux';
import blockIndexReducer from './blockIndex';
import identifyReducer from './identify';
import leftPanelReducer from './leftPanelReducer';

export default combineReducers({
  leftPanel: leftPanelReducer,
  blockIndex: blockIndexReducer,
  identify: identifyReducer,
});
