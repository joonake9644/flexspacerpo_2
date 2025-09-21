import React from 'react';
import { useWebPush } from '../hooks/use-web-push';
import { Bell, BellOff, Loader } from 'lucide-react';

export const PushNotificationButton: React.FC = () => {
  const { isSubscribed, subscribe, loading, error } = useWebPush();

  if (loading) {
    return (
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center" disabled>
        <Loader className="w-4 h-4 mr-2 animate-spin" />
        알림 상태 확인 중...
      </button>
    );
  }

  if (isSubscribed) {
    return (
      <button className="w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center" disabled>
        <BellOff className="w-4 h-4 mr-2" />
        알림이 활성화되었습니다
      </button>
    );
  }

  if (error) {
    return (
      <button className="w-full text-left px-4 py-2 text-sm text-red-700 flex items-center" disabled>
        <XCircle className="w-4 h-4 mr-2" />
        알림을 활성화할 수 없습니다
      </button>
    );
  }

  return (
    <button 
      onClick={subscribe}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
    >
      <Bell className="w-4 h-4 mr-2" />
      알림 활성화하기
    </button>
  );
};
