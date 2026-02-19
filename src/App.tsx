import { HistoryOutlined, HomeFilled, MenuOutlined, SettingFilled } from '@ant-design/icons';
import { Button, ConfigProvider, Dropdown, Layout, Menu, notification, Segmented, Space, Spin, theme } from 'antd';
import { useEffect, useState } from 'react';
import { AiOutlineBarChart } from 'react-icons/ai';
import { FaListUl } from 'react-icons/fa6';
import { IoDocumentText } from 'react-icons/io5';
import { Link, Outlet, useNavigate } from 'react-router';
import apiClient from './utils/axios';

const { Sider, Header, Content } = Layout;
const { defaultAlgorithm, darkAlgorithm } = theme;

interface VersionInfo {
	local: {
		version: string;
		branch: string;
		hash: string;
	};
	remote: {
		version: string;
		hash: string;
	};
}

interface VersionResponse {
	core: VersionInfo;
	web: VersionInfo;
	ftl: VersionInfo;
	docker: { local: string; remote: string };
}

type ThemeMode = 'light' | 'dark' | 'system';

function App() {
	const [themeMode, setThemeMode] = useState<ThemeMode>((localStorage.getItem('themeMode') as ThemeMode) ?? 'system');
	const [loading, setLoading] = useState<boolean>(true);
	const [versionInfo, setVersionInfo] = useState<VersionResponse>();
	const navigate = useNavigate();
	const [api, contextHolder] = notification.useNotification();

	useEffect(() => {
		const getLoginStatus = async () => {
			try {
				setLoading(true);
				const resp = await apiClient.get('auth');
				if (resp.status === 401) {
					navigate('/login');
				} else {
					const resp = await apiClient.get('info/version');
					setVersionInfo(resp.data.version);
				}
			} catch (e) {
				navigate('/login');
				api.error({ title: 'Unable to fetch login status!', description: `${e}` });
				console.error(e);
			} finally {
				setLoading(false);
			}
		};
		getLoginStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const updateThemeMode = (mode: string) => {
		localStorage.setItem('themeMode', mode.toLocaleLowerCase());
		setThemeMode(mode.toLocaleLowerCase() as ThemeMode);
	};

	const getAlgorithm = () => {
		if (themeMode === 'system' && typeof window !== 'undefined') {
			return window.matchMedia('(prefers-color-scheme: dark)').matches ? darkAlgorithm : defaultAlgorithm;
		}
		return themeMode === 'dark' ? darkAlgorithm : defaultAlgorithm;
	};

	const handleMenuSelect = ({ key }: { key: string }) => {
		navigate(key);
	};

	const handleLogout = async () => {
		try {
			console.log('logging out');
			await apiClient.delete('auth');
			navigate('/login');
		} catch (error) {
			api.error({ title: 'Unable to logout', description: `${error}` });
			console.error(error);
		}
	};

	return (
		<ConfigProvider theme={{ algorithm: getAlgorithm() }}>
			{contextHolder}
			<Layout style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
				<Header
					style={{
						padding: '0 0 0 0',
						height: 50,
						backgroundColor: '#3c8dbc',
						alignItems: 'center',
						justifyContent: 'space-between',
						display: 'flex',
					}}
				>
					<Link
						to='/dashboard'
						style={{
							width: 256,
							justifyContent: 'center',
							alignItems: 'center',
							display: 'flex',
							textDecoration: 'none',
							color: 'white',
							fontSize: 20,
							fontWeight: 100,
						}}
					>
						Pi- <span style={{ fontWeight: 700 }}>hole</span>
					</Link>
					<Dropdown
						menu={{
							items: [
								{
									key: '1',
									label: (
										<Space>
											<span>Theme:</span>
											<Segmented options={['Light', 'Dark', 'System']} onChange={updateThemeMode} />
										</Space>
									),
								},
								{
									key: '2',
									label: (
										<Button type='primary' danger block onClick={handleLogout}>
											Logout
										</Button>
									),
								},
							],
						}}
					>
						<Button type='text' style={{ borderRadius: 0, height: 50, width: 64, color: 'white' }}>
							<MenuOutlined />
						</Button>
					</Dropdown>
				</Header>
				{loading && <Spin size='large' />}
				<Layout>
					<Sider width={256} collapsible>
						<Menu
							theme='dark'
							mode='inline'
							selectedKeys={[location.pathname.slice(1)]}
							onSelect={handleMenuSelect}
							defaultOpenKeys={['longTerm']}
							style={{ height: '100vh', overflow: 'auto' }}
							items={[
								{
									key: 'dashboard',
									label: 'Dashboard',
									icon: <HomeFilled />,
								},
								{
									key: 'longTerm',
									label: 'Long Term Stats',
									icon: <HistoryOutlined />,
									children: [
										{ key: 'graphics', label: 'Graphics', icon: <AiOutlineBarChart /> },
										{ key: 'queryLog', label: 'Query Logs', icon: <IoDocumentText /> },
										{ key: 'topLists', label: 'Top Lists', icon: <FaListUl /> },
									],
								},
								{
									key: 'settings',
									label: 'Settings',
									icon: <SettingFilled />,
								},
							]}
						/>
					</Sider>

					<Content style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 50px)' }}>
						<div style={{ minHeight: 'calc(100vh - 100px)' }}>
							<Outlet />
						</div>
						<Layout.Footer
							style={{
								display: 'flex',
								justifyContent: 'center',
								background: 'var(--ant-color-bg-container)',
								gap: 12,
								height: 50,
								padding: 0,
								alignItems: 'center',
							}}
						>
							{versionInfo?.docker?.local && (
								<span>
									<b>Docker: </b>
									{versionInfo?.docker?.local}
								</span>
							)}
							<span>
								<b>Core:</b>{' '}
								<a target='_blank' href={`https://github.com/pi-hole/FTL/releases/${versionInfo?.core.local.version}`}>
									{versionInfo?.core.local.version}
								</a>
							</span>
							<span>
								<b>FTL:</b>{' '}
								<a target='_blank' href={`https://github.com/pi-hole/FTL/releases/${versionInfo?.ftl.local.version}`}>
									{versionInfo?.ftl.local.version}
								</a>
							</span>
						</Layout.Footer>
					</Content>
				</Layout>
			</Layout>
		</ConfigProvider>
	);
}

export default App;
