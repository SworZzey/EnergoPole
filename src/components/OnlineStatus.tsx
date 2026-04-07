import React, {useState, useEffect} from 'react';

const OnlineStatus: React.FC = () => {
    const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
        }
    }, [])

    return (
        <div style={{
            backgroundColor: isOnline ? '#16a34a' : '#dc2626',
            color: 'white',
            textAlign: 'center',
            padding: '4px',
            fontSize: '12px',
            transition: 'all 0.3s',
        }}>
            {isOnline ? '✅ Онлайн' : '🔴 Офлайн (синхронизация отключена)'}
        </div>
    );
};

export default OnlineStatus;