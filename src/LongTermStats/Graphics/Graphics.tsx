import { DotChartOutlined } from '@ant-design/icons';
import { Card, notification, Skeleton } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import './Graphics.css';
import TimeRangePicker from '../../common/TimeRangePicker';

interface QueryRecord {
	timestamp: number; // epoch ms
	allowed: number;
	blocked: number;
}

export default function Graphics() {
	const [range, setRange] = useState<Date[]>([]);
	const [data, setData] = useState<QueryRecord[]>([]);
	const [loading, setLoading] = useState<boolean>();
	const [api, contextHolder] = notification.useNotification();

	useEffect(() => {
		if (range.length == 2) fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [range]);

	const fetchData = async () => {
		try {
			setLoading(true);
			const start: number = Math.floor(range[0].getTime() / 1000);
			const end: number = Math.floor(range[1].getTime() / 1000);
			const resp = await axios.get('/api/longTermStats/graphics', { params: { start, end } });
			setData(resp.data);
		} catch (error) {
			api.error({ title: 'Unable to fetch records!', description: `${error}` });
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='Graphics'>
			{contextHolder}
			<TimeRangePicker range={range} setRange={setRange} />
			<Card title='Queries over the selected time period' style={{ marginTop: 16 }}>
				{loading && (
					<Skeleton.Node active={true} style={{ height: 400, width: '100%', display: 'flex' }}>
						<DotChartOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
					</Skeleton.Node>
				)}
				{!loading && data.length == 0 && (
					<div style={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>No Data</div>
				)}
				{!loading && data.length > 0 && (
					<ResponsiveContainer width='100%' height={400}>
						<BarChart data={data}>
							<CartesianGrid strokeDasharray='3 3' />
							<XAxis dataKey='timestamp' tickFormatter={(value) => new Date(value).toLocaleTimeString([], { hour: '2-digit' })} />
							<YAxis />
							<Tooltip
								formatter={(value, name) => [value, `${name} Queries`]}
								labelFormatter={(label) => new Date(label).toLocaleString()}
							/>
							<Bar dataKey='blocked' stackId='a' fill='#999999' name='Blocked' />
							<Bar dataKey='allowed' stackId='a' fill='#00a65a' name='Allowed' />
						</BarChart>
					</ResponsiveContainer>
				)}
			</Card>
		</div>
	);
}
