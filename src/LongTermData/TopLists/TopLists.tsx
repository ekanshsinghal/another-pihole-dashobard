import { Card, Masonry, Progress, Table } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

import TimeRangePicker from '../../common/TimeRangePicker';
import apiClient from '../../utils/axios';
import type { Client, Domain } from '../../Dashboard/types';

const domainCols = (totalQueries: number, type: 'success' | 'exception') => {
	return [
		{
			key: 'domain',
			dataIndex: 'domain',
			title: 'Domain',
			onCell: () => ({
				style: { wordBreak: 'break-word' as const },
			}),
		},
		{ key: 'count', dataIndex: 'count', title: 'Hits' },
		{
			key: 'frequency',
			dataIndex: 'count',
			title: 'Frequency',
			render: (value: number) => <Progress percent={(value * 100) / totalQueries} showInfo={false} status={type} />,
		},
	];
};

export default function TopLists() {
	const [range, setRange] = useState<Date[]>([]);
	const [loading, setLoading] = useState(false);
	const [domains, setDomains] = useState<Domain[]>([]);
	const [blocked, setBlocked] = useState<Domain[]>([]);
	const [clients, setClients] = useState<Client[]>([]);
	const [totalQueries, setTotalQueries] = useState(0);
	const [blockedQueries, setBlockedQueries] = useState(0);

	const clientCols: ColumnsType<Client> = useMemo(() => {
		return [
			{
				key: 'client',
				dataIndex: 'name',
				title: 'Client',
				render: (val: string, record: Client) => (val && val != '' ? val : record.ip),
			},
			{ key: 'count', dataIndex: 'count', title: 'Requests' },
			{
				key: 'frequency',
				dataIndex: 'count',
				title: 'Frequency',
				render: (value: number) => <Progress percent={(value * 100) / totalQueries} showInfo={false} />,
			},
		];
	}, [totalQueries]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const start = Math.floor(range[0].getTime() / 1000);
				const end = Math.floor(range[1].getTime() / 1000);
				const [topClientsResp, topDomainsResp, topBlockedDomainsResp] = await Promise.all([
					apiClient.get('stats/database/top_clients', { params: { from: start, until: end, count: 2147483647 } }),
					apiClient.get('stats/database/top_domains', { params: { from: start, until: end, count: 2147483647 } }),
					apiClient.get('stats/database/top_domains', { params: { from: start, until: end, count: 2147483647, blocked: true } }),
				]);
				let totalQueries: number = 0;
				let blockedQueries: number = 0;
				for (const i in topClientsResp.data.clients) {
					totalQueries += topClientsResp.data.clients[i].count;
				}
				for (const i in topBlockedDomainsResp.data.domains) {
					blockedQueries += topBlockedDomainsResp.data.domains[i].count;
				}
				setTotalQueries(totalQueries);
				setBlockedQueries(blockedQueries);
				setDomains(topDomainsResp.data.domains.sort((a: Domain, b: Domain) => b.count - a.count).slice(0, 10));
				setBlocked(topBlockedDomainsResp.data.domains.sort((a: Domain, b: Domain) => b.count - a.count).slice(0, 10));
				setClients(topClientsResp.data.clients.sort((a: Client, b: Client) => b.count - a.count).slice(0, 10));
			} catch (error) {
				console.error(error);
			} finally {
				setLoading(false);
			}
		};
		if (range.length == 2) fetchData();
	}, [range]);

	return (
		<div style={{ padding: 16 }}>
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
									<Table
										loading={loading}
										dataSource={domains}
										columns={domainCols(totalQueries, 'success')}
										rowKey='domain'
										size='small'
										pagination={false}
									/>
								</Card>
							),
						},
						{
							key: 'blocked',
							data: 'blocked',
							children: (
								<Card title='Top Blocked Domains' size='small'>
									<Table
										loading={loading}
										dataSource={blocked}
										columns={domainCols(blockedQueries, 'exception')}
										rowKey='domain'
										size='small'
										pagination={false}
									/>
								</Card>
							),
						},
						{
							key: 'clients',
							data: 'clients',
							children: (
								<Card title='Top Clients' size='small'>
									<Table loading={loading} dataSource={clients} columns={clientCols} rowKey='ip' size='small' pagination={false} />
								</Card>
							),
						},
					]}
				/>
			</div>
		</div>
	);
}
