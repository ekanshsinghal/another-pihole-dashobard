import { Card, Masonry, Table } from 'antd';
import axios from 'axios';
import { useEffect, useState } from 'react';

import TimeRangePicker from '../../common/TimeRangePicker';

interface DomainData {
	count: number;
	domain: string;
}
interface ClientData {
	count: number;
	ip: string;
	name: string;
}

const domainCols = [
	{
		key: 'domain',
		dataIndex: 'domain',
		title: 'Domain',
		onCell: () => ({
			style: { wordBreak: 'break-word' as const },
		}),
	},
	{ key: 'count', dataIndex: 'count', title: 'Hits' },
	{ key: 'frequency', dataIndex: 'frequency', title: 'Frequency' },
];

const clientCols = [
	{
		key: 'client',
		dataIndex: 'name',
		title: 'Client',
		render: (val: string, record: ClientData) => (val && val != '' ? val : record.ip),
	},
	{ key: 'count', dataIndex: 'count', title: 'Requests' },
	{ key: 'frequency', dataIndex: 'frequency', title: 'Frequency' },
];

export default function TopLists() {
	const [range, setRange] = useState<Date[]>([]);
	const [loading, setLoading] = useState(false);
	const [domains, setDomains] = useState<DomainData[]>([]);
	const [blocked, setBlocked] = useState<DomainData[]>([]);
	const [clients, setClients] = useState<ClientData[]>([]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const start = Math.floor(range[0].getTime() / 1000);
				const end = Math.floor(range[1].getTime() / 1000);
				const { data } = await axios.get('/api/longTermStats/topLists', { params: { start, end } });
				setDomains(data.topDomains);
				setBlocked(data.topBlocked);
				setClients(data.topClients);
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		if (range.length == 2) fetchData();
	}, [range]);

	return (
		<div style={{ paddingBottom: 16 }}>
			<div style={{ rowGap: 16, display: 'grid' }}>
				<TimeRangePicker range={range} setRange={setRange} />
				<Masonry
					columns={{ xs: 1, sm: 1, md: 1, lg: 2, xl: 3 }}
					gutter={16}
					items={[
						{
							key: 'domains',
							data: 'domains',
							children: (
								<Card title='Top Domains' size='small'>
									<Table loading={loading} dataSource={domains} columns={domainCols} rowKey={'domain'} size='small' pagination={false} />
								</Card>
							),
						},
						{
							key: 'blocked',
							data: 'blocked',
							children: (
								<Card title='Top Blocked Domains' size='small'>
									<Table loading={loading} dataSource={blocked} columns={domainCols} rowKey={'domain'} size='small' pagination={false} />
								</Card>
							),
						},
						{
							key: 'clients',
							data: 'clients',
							children: (
								<Card title='Top Clients' size='small'>
									<Table loading={loading} dataSource={clients} columns={clientCols} rowKey={'client'} size='small' pagination={false} />
								</Card>
							),
						},
					]}
				/>
			</div>
		</div>
	);
}
