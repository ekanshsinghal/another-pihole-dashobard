import { ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Card, Col, Form, notification, Row, Select, Table, Tooltip, type TableColumnsType } from 'antd';
import { format } from 'date-fns';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AiFillDatabase } from 'react-icons/ai';
import { LuBan } from 'react-icons/lu';
import { MdCloudDownload } from 'react-icons/md';
import { IoMdRefresh } from 'react-icons/io';
import { FaHourglassHalf, FaInfinity } from 'react-icons/fa6';

import TimeRangePicker from '../../common/TimeRangePicker';
import apiClient from '../../utils/axios';
import './QueryLog.css';

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
}

interface Suggestion {
	client_ip: string[];
	client_name: string[];
	dnssec: string[];
	domain: string[];
	reply: string[];
	status: string[];
	type: string[];
	upstream: string[];
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

const filterOption = (input: string, option?: { value: string; label: string }): boolean => {
	if (!option) return false;
	const optionText = option.label || option.value || '';
	return optionText.toLowerCase().includes(input.toLowerCase());
};

export default function QueryLog() {
	const [range, setRange] = useState<Date[]>([]);
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState<DataType[]>([]);
	const [pagination, setPagination] = useState<Pagination>();
	const [suggestions, setSuggestions] = useState<Suggestion>({
		client_ip: [],
		client_name: [],
		dnssec: [],
		domain: [],
		type: [],
		reply: [],
		status: [],
		upstream: [],
	});
	const [form] = Form.useForm();
	const [api, contextHolder] = notification.useNotification();
	const selectedIp = Form.useWatch('ip', form);
	const selectedClientName = Form.useWatch('clientName', form);

	const [ipOptions, nameOptions, domainOptions, queryOptions, replyOptions, statusOptions] = useMemo(() => {
		return [
			suggestions.client_ip.map((i) => ({ value: i, label: i })),
			suggestions.client_name.map((i) => ({ value: i, label: i })),
			suggestions.domain.map((i) => ({ value: i, label: i })),
			suggestions.type.map((i) => ({ value: i, label: i })),
			suggestions.reply.map((i) => ({ value: i, label: i })),
			suggestions.status.map((i) => ({ value: i, label: i })),
		];
	}, [suggestions]);

	const columns: TableColumnsType<DataType> = useMemo(() => {
		return [
			{
				key: 'time',
				dataIndex: 'time',
				title: 'Time',
				width: 170,
				render: (val: number) => format(new Date(val * 1000), 'yyyy-MM-dd HH:mm:ss'),
			},
			{
				key: 'status',
				dataIndex: 'status',
				title: 'Status',
				width: 65,
				render: (value: string) => getIconByStatus(value),
			},
			{ key: 'type', dataIndex: 'type', title: 'Type', width: 75 },
			{ key: 'domain', dataIndex: 'domain', title: 'Domain' },
			{ key: 'client', dataIndex: 'client', title: 'Client', render: (val) => val.name ?? val.ip },
			{
				key: 'reply',
				dataIndex: 'reply',
				title: 'Reply',
				width: 100,
				render: (val) => {
					const ms = val.time * 1000;
					const µs = val.time * 1_000_000;
					if (val.time > 1) return `${val.time.toFixed(1)} s`;
					if (ms > 1) return `${ms.toFixed(1)} ms`;
					if (µs > 1) return `${µs.toFixed(1)} µs`;
				},
			},
		];
	}, []);

	const fetchSuggestions = async () => {
		try {
			const resp = await apiClient.get('queries/suggestions');
			setSuggestions(resp?.data?.suggestions);
		} catch (error) {
			api.error({ title: 'Unable to fetch suggestions!', description: `${error}` });
		}
	};

	useEffect(() => {
		fetchSuggestions();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const fetchData = async (page = 1, length = 10) => {
		setLoading(true);
		try {
			const from: number = Math.floor(range[0].getTime() / 1000);
			const until: number = Math.floor(range[1].getTime() / 1000);
			const { domain, reply, query, status } = form.getFieldsValue();
			const { data } = await apiClient.get('queries', {
				params: {
					from,
					until,
					start: (page - 1) * length,
					length,
					domain,
					client_ip: selectedIp,
					client_name: selectedClientName,
					reply,
					type: query,
					status,
					disk: true,
				},
			});
			setData(data.queries);
			setPagination({
				page,
				limit: length,
				total: data.recordsFiltered,
				totalPages: Math.ceil(data.recordsFiltered / length),
				hasPrev: page > 1,
				hasNext: page < Math.ceil(data.recordsFiltered / length),
			});
		} catch (error) {
			api.error({ title: 'Unable to fetch records!', description: `${error}` });
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (range.length == 2) fetchData(1, 10);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [range]);

	return (
		<div style={{ padding: 16 }}>
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
				<Card title='Recent Queries' style={{ marginBottom: 16 }} size='small'>
					<Table
						size='small'
						loading={loading}
						dataSource={data}
						columns={columns}
						rowKey='id'
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
