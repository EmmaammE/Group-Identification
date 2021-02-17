import { combineReducers } from 'redux';
import leftPanelReducer from './leftPanelReducer';

export default combineReducers({
  leftPanel: leftPanelReducer,
});
