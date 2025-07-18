import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey:  import.meta.env.VITE_apiKey,
	authDomain:  import.meta.env.VITE_authDomain,
	projectId:  import.meta.env.VITE_projectId,
	storageBucket:  import.meta.env.VITE_storageBucket,
	messagingSenderId:  import.meta.env.VITE_messagingSenderId,
	appId:  import.meta.env.VITE_appId,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const storage = getStorage(app);

auth.languageCode = 'vi';