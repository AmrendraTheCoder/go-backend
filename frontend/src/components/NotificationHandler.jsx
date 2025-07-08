import { useEffect } from 'react';
import { notification } from 'antd';
import { BellOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import socketService from '../services/socketService';
import { useAuthStore } from '../stores/authStore';

const NotificationHandler = () => {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (!isAuthenticated) return;

        // Subscribe to notification events
        const unsubscribeNotification = socketService.subscribe('notification', (data) => {
            const { type, title, message, duration = 4.5 } = data;

            let icon = <BellOutlined />;

            switch (type) {
                case 'success':
                    icon = <CheckCircleOutlined style={{ color: '#52c41a' }} />;
                    break;
                case 'warning':
                    icon = <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
                    break;
                case 'error':
                    icon = <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
                    break;
                default:
                    icon = <BellOutlined style={{ color: '#1890ff' }} />;
            }

            notification[type || 'info']({
                message: title || 'Notification',
                description: message,
                icon,
                duration,
                placement: 'topRight',
                style: {
                    width: 400,
                },
            });
        });

        // Subscribe to job-related notifications
        const unsubscribeJobApproved = socketService.subscribe('job:approved', (jobData) => {
            notification.success({
                message: 'Job Approved',
                description: `Job #${jobData.jobNumber || jobData.jobId} has been approved`,
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                duration: 4.5,
                placement: 'topRight',
            });
        });

        const unsubscribeJobRejected = socketService.subscribe('job:rejected', (jobData) => {
            notification.warning({
                message: 'Job Rejected',
                description: `Job #${jobData.jobNumber || jobData.jobId} has been rejected`,
                icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                duration: 4.5,
                placement: 'topRight',
            });
        });

        // Subscribe to inventory low stock alerts
        const unsubscribeLowStock = socketService.subscribe('inventory:low_stock', (alertData) => {
            notification.warning({
                message: 'Low Stock Alert',
                description: `${alertData.item.name} is running low (${alertData.item.quantity} remaining)`,
                icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
                duration: 6,
                placement: 'topRight',
            });
        });

        // Cleanup function
        return () => {
            unsubscribeNotification();
            unsubscribeJobApproved();
            unsubscribeJobRejected();
            unsubscribeLowStock();
        };
    }, [isAuthenticated]);

    return null; // This component doesn't render anything visible
};

export default NotificationHandler; 