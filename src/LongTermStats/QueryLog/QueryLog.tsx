import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Card, Col, Form, notification, Row, Select, Statistic, Table, Tooltip, type TableColumnsType } from 'antd';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AiFillDatabase } from 'react-icons/ai';
import { LuBan } from 'react-icons/lu';
import { MdCloudDownload } from 'react-icons/md';

import TimeRangePicker from '../../common/TimeRangePicker';
import './QueryLog.css';
import { IoMdRefresh } from 'react-icons/io';
import { FaHourglassHalf, FaInfinity } from 'react-icons/fa6';

interface DataType {
	timestamp: number;
	type: string;
	domain: string;
	client: string;
	status: string;
	reply_time: number;
	reply_type: string;
}

interface Pagination {
	hasNext: boolean;
	hasPrev: boolean;
	limit: number;
	page: number;
	total: number;
	totalPages: number;
	blocked: number;
}

interface Suggestion {
	clients: {
		ip: string;
		client_name: string;
	}[];
	domains: string[];
	queryTypes: string[];
	replyTypes: string[];
	statusTypes: string[];
}

const getIconByStatus = (status: string): ReactNode => {
	let title: string = `Blocked(${status})`;
	let icon: ReactNode = <LuBan color='rgb(255, 26, 26)' />;
	if (status === 'UNKNOWN') {
		icon = <ExclamationCircleFilled />;
	} else if (status === 'FORWARDED') {
		title = 'Forwarded';
		icon = <MdCloudDownload color='rgb(109, 255, 109)' />;
	} else if (status === 'RETRIED' || status === 'RETRIED_DNSSEC') {
		title = 'Retried';
		icon = <IoMdRefresh color='rgb(109, 255, 109)' />;
	} else if (status === 'CACHE') {
		title = 'Served from cache';
		icon = <AiFillDatabase color='rgb(109, 255, 109)' />;
	} else if (status === 'IN_PROGRESS') {
		title = 'Already forwarded, awaiting reply';
		icon = <FaHourglassHalf color='rgb(109, 255, 109)' />;
	} else if (status === 'CACHE_STALE') {
		title = 'Served by cache optimizer';
		icon = <FaInfinity color='rgb(109, 255, 109)' />;
	}
	return <Tooltip title={title}>{icon}</Tooltip>;
};

const getClassByStatus = (status: string): string => {
	return ['FORWARDED', 'CACHE', 'RETRIED', 'IN_PROGRESS', 'CACHE_STALE'].includes(status) ? 'allowed' : 'blocked';
};

const filterOption = (input: string, option: any) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

export default function QueryLog() {
	const [range, setRange] = useState<Date[]>([]);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<DataType[]>([]);
	const [pagination, setPagination] = useState<Pagination>();
	const [suggestions, setSuggestions] = useState<Suggestion>({ clients: [], domains: [], queryTypes: [], replyTypes: [], statusTypes: [] });
	const [form] = Form.useForm();
	const [api, contextHolder] = notification.useNotification();
	const selectedIp = Form.useWatch('ip', form);
	const selectedClientName = Form.useWatch('clientName', form);

	const blockedPer = useMemo(() => {
		if (pagination && pagination.blocked !== 0) {
			return ((pagination.blocked * 100) / pagination.total).toFixed(1);
		}
		return '0';
	}, [pagination]);

	const [ipOptions, nameOptions, domainOptions, queryOptions, replyOptions, statusOptions] = useMemo(() => {
		return [
			suggestions.clients.map((i) => ({ value: i.ip, label: i.ip })),
			suggestions.clients.filter((i) => i.client_name !== '').map((i) => ({ value: i.ip, label: i.client_name })),
			suggestions.domains.map((i) => ({ value: i, label: i })),
			suggestions.queryTypes.map((i) => ({ value: i, label: i })),
			suggestions.replyTypes.map((i) => ({ value: i, label: i })),
			suggestions.statusTypes.map((i) => ({ value: i, label: i })),
		];
	}, [suggestions]);

	const columns: TableColumnsType<DataType> = useMemo(() => {
		return [
			{
				key: 'time',
				dataIndex: 'timestamp',
				title: 'Time',
				render: (val: number) => format(new Date(val * 1000), 'yyyy-MM-dd HH:mm:ss'),
			},
			{
				key: 'status',
				dataIndex: 'status',
				title: 'Status',
				render: (value: string) => getIconByStatus(value),
			},
			{ key: 'type', dataIndex: 'type', title: 'Type' },
			{ key: 'domain', dataIndex: 'domain', title: 'Domain' },
			{ key: 'client', dataIndex: 'client', title: 'Client' },
			{
				key: 'reply',
				dataIndex: 'reply_time',
				title: 'Reply',
				minWidth: 100,
				render: (val: number) => {
					const ms = val * 1000;
					const µs = val * 1_000_000;
					if (val > 1) return `${val.toFixed(1)} s`;
					if (ms > 1) return `${ms.toFixed(1)} ms`;
					if (µs > 1) return `${µs.toFixed(1)} µs`;
				},
			},
		];
	}, [suggestions]);

	useEffect(() => {
		fetchSuggestions();
	}, []);

	useEffect(() => {
		if (range.length == 2) fetchData(1, 10);
	}, [range]);

	const fetchSuggestions = async () => {
		try {
			const { data }: { data: Suggestion } = await axios.get('/api/longTermStats/suggestions');
			setSuggestions(data);
		} catch (error) {
			api.error({ title: 'Unable to fetch suggestions!', description: `${error}` });
		}
	};

	const fetchData = async (page = 1, limit = 10) => {
		setLoading(true);
		try {
			const start: number = Math.floor(range[0].getTime() / 1000);
			const end: number = Math.floor(range[1].getTime() / 1000);
			const { domain, reply, query, status } = form.getFieldsValue();
			const { data } = await axios.get('/api/longTermStats/queryLogs', {
				params: { start, end, page, limit, domain, client: selectedIp || selectedClientName, reply, query, status },
			});
			setData(data.data);
			setPagination(data.pagination);
		} catch (error) {
			api.error({ title: 'Unable to fetch records!', description: `${error}` });
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div>
			{contextHolder}
			<div style={{ gap: 16, display: 'grid' }}>
				<TimeRangePicker
					range={range}
					setRange={setRange}
					extra={
						<Button onClick={() => fetchData()} disabled={range.length !== 2}>
							Refresh
						</Button>
					}
					filters={
						<Form form={form} name='filters' layout='vertical' style={{ marginTop: 16 }}>
							<Row gutter={[16, 0]} wrap>
								<Col xl={8} lg={8} md={12} sm={24} xs={24}>
									<Form.Item name='ip' label='Client (By IP)'>
										<Select
											placeholder='Select Client IP'
											style={{ width: '100%' }}
											allowClear
											showSearch={{ filterOption: filterOption }}
											options={ipOptions}
											disabled={selectedClientName}
										/>
									</Form.Item>
								</Col>
								<Col xl={8} lg={8} md={12} sm={24} xs={24}>
									<Form.Item name='clientName' label='Client (By Name)'>
										<Select
											placeholder='Select Client Name'
											style={{ width: '100%' }}
											allowClear
											showSearch={{ filterOption: filterOption }}
											options={nameOptions}
											disabled={selectedIp}
										/>
									</Form.Item>
								</Col>
								<Col xl={8} lg={8} md={12} sm={24} xs={24}>
									<Form.Item name='domain' label='Domain'>
										<Select
											placeholder='Select Domain'
											style={{ width: '100%' }}
											allowClear
											showSearch={{ filterOption: filterOption }}
											options={domainOptions}
										/>
									</Form.Item>
								</Col>
								<Col xl={8} lg={8} md={12} sm={24} xs={24}>
									<Form.Item name='reply' label='Reply'>
										<Select
											placeholder='Select Reply'
											style={{ width: '100%' }}
											allowClear
											showSearch={{ filterOption: filterOption }}
											options={replyOptions}
										/>
									</Form.Item>
								</Col>
								<Col xl={8} lg={8} md={12} sm={24} xs={24}>
									<Form.Item name='query' label='Query'>
										<Select
											placeholder='Select Query'
											style={{ width: '100%' }}
											allowClear
											showSearch={{ filterOption: filterOption }}
											options={queryOptions}
										/>
									</Form.Item>
								</Col>
								<Col xl={8} lg={8} md={12} sm={24} xs={24}>
									<Form.Item name='status' label='Status'>
										<Select
											placeholder='Select Status'
											style={{ width: '100%' }}
											allowClear
											showSearch={{ filterOption: filterOption }}
											options={statusOptions}
										/>
									</Form.Item>
								</Col>
							</Row>
						</Form>
					}
				/>

				<Row gutter={[16, 16]} wrap>
					<Col xl={8} lg={8} md={12} sm={24} xs={24}>
						<Card variant='borderless'>
							<Statistic title='Total Queries' value={pagination?.total} />
						</Card>
					</Col>
					<Col xl={8} lg={8} md={12} sm={24} xs={24}>
						<Card variant='borderless'>
							<Statistic title='Queries Blocked' value={pagination?.blocked} />
						</Card>
					</Col>
					<Col xl={8} lg={8} md={12} sm={24} xs={24}>
						<Card variant='borderless'>
							<Statistic title='Percentage Blocked' value={blockedPer} precision={1} suffix='%' />
						</Card>
					</Col>
				</Row>
				<Card title='Recent Queries' style={{ marginBottom: 16 }} size='small'>
					<Table
						size='small'
						loading={loading}
						dataSource={data}
						columns={columns}
						rowKey={'timestamp'}
						rowClassName={(record: DataType) => getClassByStatus(record.status)}
						pagination={{
							pageSize: pagination?.limit,
							current: pagination?.page,
							total: pagination?.total,
							onChange: (page, pageSize) => fetchData(page, pageSize),
						}}
					/>
				</Card>
			</div>
		</div>
	);
}
