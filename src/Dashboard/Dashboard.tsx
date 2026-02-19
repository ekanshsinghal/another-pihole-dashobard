import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, Row, Col, Spin, Typography } from 'antd';

import TopDomainsList from './TopDomainsList';
import TopClientsList from './TopClientsList';
import apiClient from '../utils/axios';
import type { Client, Domain, Stats } from './types';
import StatCard from '../common/StatCard';

const { Text } = Typography;

function DashboardPage() {
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState<Stats>();
	// const [blocking, setBlocking] = useState<Blocking>();
	// const [queries, setQueries] = useState([]);
	const [topDomains, setTopDomains] = useState<Domain[]>([]);
	const [topBlockedDomains, setTopBlockedDomains] = useState<Domain[]>([]);
	const [topClients, setTopClients] = useState<Client[]>([]);
	const [topBlockedClients, setTopBlockedClients] = useState<Client[]>([]);

	useEffect(() => {
		loadDashboardData();

		const interval = setInterval(() => {
			loadDashboardData();
		}, 10000);

		return () => clearInterval(interval);
	}, [navigate]);

	const loadDashboardData = async () => {
		try {
			const [summaryData, topDomainsData, topBlockedDomainsData, topClientResp, topBlockedClientResp] = await Promise.all([
				apiClient.get('stats/summary'),
				apiClient.get('stats/top_domains?limit=10').catch(() => ({ data: { domains: [] } })),
				apiClient.get('stats/top_domains?limit=10&blocked=true').catch(() => ({ data: { domains: [] } })),
				apiClient.get('stats/top_clients?limit=10').catch(() => ({ data: { clients: [] } })),
				apiClient.get('stats/top_clients?limit=10&blocked=true').catch(() => ({ data: { clients: [] } })),
			]);

			setStats(summaryData.data);
			// setBlocking(blockingData.data);
			// setQueries(queriesData.data.queries || []);
			setTopDomains(topDomainsData.data.domains || []);
			setTopBlockedDomains(topBlockedDomainsData.data.domains || []);
			setTopClients(topClientResp.data.clients || []);
			setTopBlockedClients(topBlockedClientResp.data.clients || []);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className='loading-spinner'>
				<Spin size='large' description='Loading dashboard data...' />
			</div>
		);
	}

	const blockPercentage = stats?.queries?.total ? (((stats.queries.blocked || 0) / stats.queries.total) * 100).toFixed(1) : '0';

	return (
		<div style={{ margin: 16 }}>
			<Row gutter={[16, 16]}>
				<Col xs={24} sm={12} lg={6}>
					<StatCard label='Total Queries' value={stats?.queries?.total || 0} color='rgb(0, 188, 216)' />
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<StatCard label='Queries Blocked' value={stats?.queries?.blocked || 0} color='rgb(186, 33, 33)' />
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<StatCard label='Percent Blocked' value={parseFloat(blockPercentage)} color='#f39c12' />
				</Col>
				<Col xs={24} sm={12} lg={6}>
					<StatCard label='Domains on Lists' value={stats?.gravity?.domains_being_blocked || 0} color='rgb(20, 203, 91)' />
				</Col>
			</Row>

			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} lg={12}>
					<Card title='Top Permitted Domains' size='small'>
						<TopDomainsList domains={topDomains} totalQueries={stats?.queries?.total} type='allowed' root={true} />
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title='Top Blocked Domains' size='small'>
						<TopDomainsList domains={topBlockedDomains} totalQueries={stats?.queries?.blocked} type='blocked' root={true} />
					</Card>
				</Col>
			</Row>

			<Row gutter={[16, 16]} style={{ marginTop: 16 }}>
				<Col xs={24} lg={12}>
					<Card title={`Top Clients (total)`} size='small'>
						{topClients.length > 0 ? (
							<TopClientsList clients={topClients} totalQueries={stats?.queries?.total} type='allowed' root={true} />
						) : (
							<Text type='secondary'>No data available</Text>
						)}
					</Card>
				</Col>
				<Col xs={24} lg={12}>
					<Card title={`Top Clients (blocked only)`} size='small'>
						{topClients.length > 0 ? (
							<TopClientsList clients={topBlockedClients} type='blocked' totalQueries={stats?.queries?.blocked} root={true} />
						) : (
							<Text type='secondary'>No data available</Text>
						)}
					</Card>
				</Col>
			</Row>
		</div>
	);
}

export default DashboardPage;
