import { Modal, Progress, Skeleton, Table } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';

import { type Client, type Domain } from './types';
import apiClient from '../utils/axios';
import { ALLOWED_STATUSES } from '../utils/consts';

function TopClientsList({
	clients,
	type,
	totalQueries,
	root,
}: {
	clients: Client[];
	type: 'allowed' | 'blocked';
	totalQueries: number | undefined;
	root: boolean;
}) {
	const [infoClient, setInfoClient] = useState<Client>();
	const [domainsPerClient, setDomainsPerClient] = useState<Domain[]>([]);
	const [loadingInfo, setLoadingInfo] = useState<boolean>(false);

	const columns: ColumnsType<Client> = useMemo(() => {
		return [
			{
				key: 'client',
				dataIndex: 'name',
				title: 'Client',
				render: (val: string, record: Client) => {
					const client = val && val != '' ? val : record.ip;
					return root ? <a onClick={() => setInfoClient(record)}>{client}</a> : <span>{client}</span>;
				},
			},
			{ title: 'Requests', dataIndex: 'count', key: 'count', align: 'right', render: (val: number) => val.toLocaleString() },
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

	const perClientColumns: ColumnsType<Domain> = useMemo(() => {
		return [
			{
				title: 'Domain',
				dataIndex: 'domain',
				key: 'domain',
				onCell: () => ({ style: { wordBreak: 'break-word' as const } }),
				render: (val: string) => <span style={{ wordBreak: 'break-word' }}>{val}</span>,
			},
			{ title: 'Hits', dataIndex: 'count', key: 'count', align: 'right', render: (val: number) => val.toLocaleString() },
			{
				title: 'Frequency',
				dataIndex: 'count',
				render: (val: number, record: Domain) =>
					infoClient && (
						<Progress
							percent={(val * 100) / infoClient.count}
							showInfo={false}
							status={record.type === 'blocked' ? 'exception' : 'normal'}
						/>
					),
			},
		];
	}, [infoClient]);

	useEffect(() => {
		const fetchClientData = async () => {
			setLoadingInfo(true);
			try {
				const resp = await apiClient.get('queries', { params: { client_ip: infoClient?.ip, length: -1 } });
				const allowed: { [key: string]: number } = {};
				const blocked: { [key: string]: number } = {};
				for (const i in resp.data.queries) {
					const query = resp.data.queries[i];
					if (ALLOWED_STATUSES.includes(query.status)) {
						if (!(query.domain in allowed)) {
							allowed[query.domain] = 1;
						} else {
							allowed[query.domain] += 1;
						}
					} else {
						if (!(query.domain in blocked)) {
							blocked[query.domain] = 1;
						} else {
							blocked[query.domain] += 1;
						}
					}
				}
				const allowedEntries: Domain[] = Object.entries(allowed).map(([domain, count]) => ({
					domain,
					type: 'allowed',
					count: Number(count),
				}));

				const blockedEntries: Domain[] = Object.entries(blocked).map(([domain, count]) => ({
					domain,
					type: 'blocked',
					count: Number(count),
				}));

				const allEntries: Domain[] = [...allowedEntries, ...blockedEntries];

				setDomainsPerClient(allEntries.sort((a, b) => b.count - a.count));
			} catch (error) {
				console.error(error);
			} finally {
				setLoadingInfo(false);
			}
		};
		if (!infoClient) return;
		fetchClientData();
	}, [infoClient]);

	const closeModal = () => {
		setInfoClient(undefined);
		setDomainsPerClient([]);
	};

	return (
		<div>
			<Table dataSource={clients} columns={columns} pagination={false} size='small' />
			<Modal title={infoClient?.name ?? infoClient?.ip} open={Boolean(infoClient)} onOk={closeModal} onCancel={closeModal}>
				<div style={{ maxHeight: 400, overflowY: 'auto' }}>
					{loadingInfo ? <Skeleton /> : <Table dataSource={domainsPerClient} columns={perClientColumns} pagination={false} size='small' />}
				</div>
			</Modal>
		</div>
	);
}

export default TopClientsList;
