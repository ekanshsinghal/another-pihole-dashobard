import { Button, Card, Input } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import apiClient from '../utils/axios';

export default function Login() {
	const [password, setPassword] = useState<string>('');
	const navigate = useNavigate();

	const handleLogin = async () => {
		try {
			const resp = await apiClient.post('auth', { password });
			if (resp.status === 200) {
				navigate('/');
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<div style={{ display: 'flex', width: '100vw', justifyContent: 'center', alignItems: 'center' }}>
			<Card title='Login' style={{ maxWidth: 400 }}>
				<Input.Password
					placeholder='Password'
					style={{ marginBottom: 16 }}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
				<Button type='primary' block onClick={handleLogin}>
					Login
				</Button>
			</Card>
		</div>
	);
}
