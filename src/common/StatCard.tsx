import { Card, Statistic } from 'antd';

export default function StatCard({ color, label, value }: { color: string; label: string; value: number }) {
	return (
		<Card size='small' styles={{ body: { backgroundColor: color } }}>
			<Statistic title={label} value={value} styles={{ content: { color: 'white' }, title: { color: 'white' } }} />
		</Card>
	);
}
