import React from 'react';
import { useNotification, Notification } from '../hooks/use-notification';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons: { [key in Notification['type']]: React.ReactNode } = {
  success: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  error: <XCircle className="w-6 h-6 text-red-500" />,
  warning: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
  info: <Info className="w-6 h-6 text-blue-500" />,
};

const NotificationItem: React.FC<{ notification: Notification; onRemove: (id: string) => void; }> = ({ notification, onRemove }) => {
  return (
    <div 
      className="bg-white rounded-xl shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden mb-4 animate-on-load"
      style={{ animationName: 'fadeInRight' }} // A simple fade-in from right
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {icons[notification.type]}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{notification.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button 
              onClick={() => onRemove(notification.id)} 
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div className="fixed inset-0 flex items-end justify-end px-4 py-6 pointer-events-none sm:p-6 z-50">
      <div className="w-full max-w-sm">
        {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} onRemove={removeNotification} />
        ))}
      </div>
    </div>
  );
};

// Add keyframes for animation to a global scope if not already present, e.g., in index.css
/*
@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
.animate-on-load {
  animation-name: fadeInRight;
  animation-duration: 0.5s;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}
*/
