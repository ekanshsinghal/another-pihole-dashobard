import { Modal, Progress, Skeleton, Table } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

import { type Client, type Domain } from './types';
import apiClient from '../utils/axios';
import TopClientsList from './TopClientsList';

function TopDomainsList({
	domains,
	type,
	totalQueries,
	root,
}: {
	domains: Domain[];
	type: 'allowed' | 'blocked';
	totalQueries: number | undefined;
	root: boolean;
}) {
	const [infoDomain, setInfoDomain] = useState<string>('');
	const [clients, setClients] = useState<Client[]>([]);
	const [domainQueries, setDomainQueries] = useState<number>(0);
	const [loadingInfo, setLoadingInfo] = useState<boolean>(false);

	useEffect(() => {
		const fetchDomainData = async () => {
			try {
				setLoadingInfo(true);
				const resp = await apiClient.get('queries', { params: { domain: infoDomain, length: -1 } });
				const clients: { [key: string]: Client } = {};
				for (const i in resp.data.queries) {
					const client: { ip: string; name: string } = resp.data.queries[i].client;
					if (!(client.ip in clients)) {
						clients[client.ip] = { count: 0, name: client.name, ip: client.ip };
					}
					clients[client.ip].count += 1;
				}
				setClients(Object.values(clients).sort((a, b) => b.count - a.count));
				setDomainQueries(resp.data.recordsFiltered);
			} catch (error) {
				console.error(error);
			} finally {
				setLoadingInfo(false);
			}
		};
		if (!infoDomain) return;
		fetchDomainData();
	}, [infoDomain]);

	const closeModal = () => {
		setInfoDomain('');
		setClients([]);
		setDomainQueries(0);
	};

	const columns: ColumnsType<Domain> = useMemo(() => {
		return [
			{
				title: 'Domain',
				dataIndex: 'domain',
				key: 'domain',
				onCell: () => ({ style: { wordBreak: 'break-word' as const } }),
				render: (val: string) =>
					root ? (
						<a onClick={() => setInfoDomain(val)} style={{ wordBreak: 'break-word' }}>
							{val}
						</a>
					) : (
						<span style={{ wordBreak: 'break-word' }}>{val}</span>
					),
			},
			{ title: 'Hits', dataIndex: 'count', key: 'count', align: 'right', render: (val: number) => val.toLocaleString() },
			{
				title: 'Frequency',
				dataIndex: 'count',
				render: (val: number) =>
					totalQueries && (
						<Progress percent={(val * 100) / totalQueries} showInfo={false} status={type === 'blocked' ? 'exception' : 'normal'} />
					),
			},
		];
	}, [totalQueries, type, root]);

	return (
		<div style={{ maxHeight: 400, overflowY: 'auto' }}>
			<Table dataSource={domains} columns={columns} pagination={false} size='small' />
			<Modal title={infoDomain} open={Boolean(infoDomain)} onOk={closeModal}>
				{loadingInfo ? <Skeleton /> : <TopClientsList clients={clients} totalQueries={domainQueries} type={type} root={false} />}
			</Modal>
		</div>
	);
}

export default TopDomainsList;
