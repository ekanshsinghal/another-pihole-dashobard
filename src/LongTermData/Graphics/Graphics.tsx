import { DotChartOutlined } from '@ant-design/icons';
import { Card, notification, Skeleton } from 'antd';
import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

import TimeRangePicker from '../../common/TimeRangePicker';
import apiClient from '../../utils/axios';
import './Graphics.css';

interface QueryRecord {
	timestamp: number; // epoch ms
	total: number;
	cached: number;
	blocked: number;
}

// seconds
const NICE_BUCKET_SIZES = [
	600, // 10 min
	1800, // 30 min
	3600, // 1 hour
	3 * 3600, // 3 hours
	6 * 3600, // 6 hours
	12 * 3600, // 12 hours
	24 * 3600, // 1 day
	7 * 24 * 3600, // 1 week
	30 * 24 * 3600, // ~1 month
];

function chooseBucketSize(data: QueryRecord[], maxBars = 144): number {
	if (data.length < maxBars) return NICE_BUCKET_SIZES[0];

	const span = data[data.length - 1].timestamp - data[0].timestamp;
	for (const size of NICE_BUCKET_SIZES) {
		if (span / size <= maxBars) return size;
	}

	return NICE_BUCKET_SIZES[NICE_BUCKET_SIZES.length - 1];
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
			const from: number = Math.floor(range[0].getTime() / 1000);
			const until: number = Math.floor(range[1].getTime() / 1000);
			const { data } = await apiClient.get('history/database', { params: { from, until } });
			setData(data.history);
			console.log(chooseBucketSize(data.history));
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
							<CartesianGrid />
							<XAxis
								dataKey='timestamp'
								tickFormatter={(value: number) => new Date(value * 1000).toLocaleTimeString([], { hour: '2-digit' })}
							/>
							<YAxis />
							<Tooltip
								formatter={(value, name) => [value, name]}
								labelFormatter={(label) => new Date(label * 1000).toLocaleString()}
								contentStyle={{ background: '#000', border: 'none', outline: 'none', color: '#fff' }}
								wrapperStyle={{ border: 'none', outline: 'none', borderRadius: '8px' }}
								position={{ y: 375 }}
								isAnimationActive={false}
							/>
							<Bar dataKey='blocked' stackId='a' fill='#999999' name='Blocked' />
							<Bar dataKey='cached' stackId='a' fill='#00a65a' name='Allowed' />
						</BarChart>
					</ResponsiveContainer>
				)}
			</Card>
		</div>
	);
}
