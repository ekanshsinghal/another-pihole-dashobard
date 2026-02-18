import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';
import App from './App.tsx';

import Graphics from './LongTermData/Graphics/Graphics.tsx';
import QueryLog from './LongTermData/QueryLog/QueryLog.tsx';
import TopLists from './LongTermData/TopLists/TopLists.tsx';
import Settings from './Settings/Settings.tsx';
import Login from './Login/Login.tsx';
import DashboardPage from './Dashboard/Dashboard.tsx';
import './index.css';

const router = createBrowserRouter([
	{
		path: '/',
		Component: App,
		children: [
			{ path: 'dashboard', Component: DashboardPage },
			{ path: 'graphics', Component: Graphics },
			{ path: 'queryLog', Component: QueryLog },
			{ path: 'topLists', Component: TopLists },
			{ path: 'settings', Component: Settings },
		],
	},
	{
		path: '/login',
		Component: Login,
	},
]);

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
