import { ClockCircleOutlined } from '@ant-design/icons';
import { Button, Card, Dropdown, Space, type MenuProps } from 'antd';
import { format } from 'date-fns';
import { type Dispatch, type ReactNode, type SetStateAction } from 'react';

const options = [
	{ key: 'today', label: 'Today' },
	{ key: 'yesterday', label: 'Yesterday' },
	{ key: 'last7days', label: 'Last 7 Days' },
	{ key: 'last30days', label: 'Last 30 Days' },
	{ key: 'thisMonth', label: 'This Month' },
	{ key: 'lastMonth', label: 'Last Month' },
	{ key: 'thisYear', label: 'This Year' },
	{ key: 'allTime', label: 'All Time' },
	// { key: 'custom', label: 'Custom Range' },
];

interface TimeRangePickerProps {
	range: Date[];
	setRange: Dispatch<SetStateAction<Date[]>>;
	extra?: ReactNode;
	filters?: ReactNode;
}

export default function TimeRangePicker({ range, setRange, extra, filters }: TimeRangePickerProps) {
	const onMenuClick: MenuProps['onClick'] = (e) => {
		let start = new Date();
		let finish = new Date();
		switch (e.key) {
			case 'today':
				start.setHours(0, 0, 0);
				break;
			case 'yesterday':
				start.setDate(start.getDate() - 1);
				start.setHours(0, 0, 0);
				finish.setDate(finish.getDate() - 1);
				finish.setHours(23, 59, 59, 999);
				break;
			case 'last7days':
				start.setDate(start.getDate() - 7);
				break;
			case 'last30days':
				start.setDate(start.getDate() - 30);
				break;
			case 'thisMonth':
				start.setHours(0, 0, 0);
				start.setDate(1);
				break;
			case 'lastMonth':
				start.setHours(0, 0, 0);
				start.setDate(1);
				start.setMonth(start.getMonth() - 1);
				finish = new Date(start.getFullYear(), start.getMonth() + 1, 0);
				break;
			case 'thisYear':
				start.setHours(0, 0, 0);
				start.setDate(1);
				start.setMonth(0);
				break;
			case 'allTime':
				start = new Date(0);
				break;
		}
		setRange([start, finish]);
	};

	return (
		<Card title={filters ? 'Filters' : 'Select date and time range'} extra={extra}>
			<Space.Compact style={{ width: '100%', display: 'flex' }}>
				<Button disabled>
					<ClockCircleOutlined />
				</Button>
				<Dropdown menu={{ items: options, onClick: onMenuClick }} trigger={['click']}>
					<Button block>
						{range.length == 0
							? 'Click to select date and time range'
							: `${format(range[0], 'MMMM do yyyy, HH:mm')} to ${format(range[1], 'MMMM do yyyy, HH:mm')}`}
					</Button>
				</Dropdown>
			</Space.Compact>
			{filters}
		</Card>
	);
}
