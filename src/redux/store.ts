/** @format */

import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './reducers/authReducer';
import { sessionReducer } from './reducers/sessionReducer';

const store = configureStore({
	reducer: {
		authReducer,
		sessionReducer,
	},
});

export default store;