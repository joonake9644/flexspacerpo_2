import React, { useState, useMemo } from 'react';
import { Booking } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingCalendarProps {
  bookings: Booking[];
}

interface ExpandedBooking extends Booking {
  date: string;
}

const categoryMap: { [key in Booking['category']]: string } = {
    personal: '개인',
    club: '동아리',
    event: '행사',
    class: '수업'
};

const categoryColors: { [key in Booking['category']]: { bg: string; text: string; border: string } } = {
    personal: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-l-4 border-blue-500' },
    club: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-4 border-yellow-500' },
    event: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-l-4 border-purple-500' },
    class: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-l-4 border-red-500' },
};

const koreanDayNames = ["일", "월", "화", "수", "목", "금", "토"];

const BookingCalendar: React.FC<BookingCalendarProps> = ({ bookings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  const approvedBookings = bookings.filter(b => b.status === 'approved');
  
  const expandedBookings = useMemo(() => {
    const expanded: ExpandedBooking[] = [];
    approvedBookings.forEach(booking => {
        const bookingStart = new Date(booking.startDate + 'T00:00:00');
        const bookingEnd = new Date(booking.endDate + 'T00:00:00');
        for (let d = new Date(bookingStart); d <= bookingEnd; d.setDate(d.getDate() + 1)) {
            const dayMatches = !booking.recurrenceRule || booking.recurrenceRule.days.length === 0 || booking.recurrenceRule.days.includes(d.getDay());
            if (dayMatches) {
                expanded.push({ ...booking, date: d.toISOString().split('T')[0] });
            }
        }
    });
    return expanded;
  }, [approvedBookings]);

  const changeDate = (amount: number) => {
    const newDate = new Date(currentDate);
    if (view === 'month') newDate.setMonth(newDate.getMonth() + amount);
    else if (view === 'week') newDate.setDate(newDate.getDate() + (amount * 7));
    else if (view === 'day') newDate.setDate(newDate.getDate() + amount);
    setCurrentDate(newDate);
  };
  
  const getWeekDays = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        return day;
    });
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = firstDayOfMonth.getDay();
    const calendarDaysData = [];

    for (let i = 0; i < startDayOfWeek; i++) calendarDaysData.push({ key: `pad-${i}`, isPadding: true });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const today = new Date();
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const bookingsForDay = expandedBookings.filter(b => b.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
      calendarDaysData.push({ key: `day-${day}`, isPadding: false, day, isToday, bookingsForDay });
    }

    return (
      <>
        <div className="grid grid-cols-7 text-center">{koreanDayNames.map(day => <div key={day} className="text-xs font-semibold text-gray-500 py-2.5">{day}</div>)}</div>
        <div className="grid grid-cols-7 border-t border-l border-gray-200" style={{ minHeight: '60vh' }}>
          {calendarDaysData.map(d => (
            d.isPadding ? <div key={d.key} className="border-r border-b border-gray-200"></div> :
            <div key={d.key} className={`border-r border-b border-gray-200 p-2 flex flex-col ${d.isToday ? 'bg-blue-50' : ''}`}>
              <span className={`text-sm font-medium text-right ${d.isToday ? 'text-blue-600' : 'text-gray-800'}`}>{d.day}</span>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {d.bookingsForDay.map(booking => {
                   const colors = categoryColors[booking.category] || categoryColors.personal;
                   return (
                    <div key={`${booking.id}-${booking.date}`} className={`${colors.bg} ${colors.text} ${colors.border} text-xs rounded p-1.5 cursor-pointer`} title={`[예약 상세]\n- 종류: ${categoryMap[booking.category]}${booking.organization ? `\n- 기관: ${booking.organization}`: ''}\n- 목적: ${booking.purpose}\n- 시간: ${booking.startTime} - ${booking.endTime}\n- 신청자: ${booking.userName}`}>
                      <p className="font-semibold truncate">{booking.purpose}</p>
                      <p className="truncate">{booking.startTime}-{booking.endTime}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderTimeGridView = (days: Date[]) => {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const today = new Date();

    return (
        <div className="flex border-t border-gray-200">
            <div className="w-16 border-r border-gray-200"> {/* Time column */}
                 <div className="h-12 border-b border-gray-200"></div>
                 {hours.map(hour => <div key={hour} className="h-12 border-b border-gray-200 text-center text-xs text-gray-500 pt-1">{hour}</div>)}
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)`}}>
                {days.map((day, index) => {
                    const isToday = day.toDateString() === today.toDateString();
                    const dateStr = day.toISOString().split('T')[0];
                    const bookingsForDay = expandedBookings.filter(b => b.date === dateStr);
                    return (
                        <div key={index} className={`relative ${index < days.length - 1 ? 'border-r' : ''} border-gray-200`}>
                            {hours.map(hour => <div key={hour} className="h-12 border-b border-gray-200"></div>)}
                            {bookingsForDay.map(booking => {
                                const start = booking.startTime.split(':').map(Number);
                                const end = booking.endTime.split(':').map(Number);
                                const top = (start[0] * 60 + start[1]) / 60 * 3; // 3rem per hour
                                const height = ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) / 60 * 3;
                                const colors = categoryColors[booking.category];
                                return (
                                    <div key={booking.id} style={{ top: `calc(3rem + ${top}rem)`, height: `${height}rem`}} className={`absolute left-1 right-1 ${colors.bg} ${colors.text} ${colors.border} p-2 rounded-lg text-xs overflow-hidden`} title={`[예약 상세]\n- 종류: ${categoryMap[booking.category]}\n- 목적: ${booking.purpose}\n- 시간: ${booking.startTime} - ${booking.endTime}\n- 신청자: ${booking.userName}`}>
                                        <p className="font-bold">{booking.purpose}</p>
                                        <p>{booking.startTime}-{booking.endTime}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    return (
        <>
            <div className="grid grid-cols-8 text-center">
                <div className="w-16 border-b border-gray-200"></div>
                {weekDays.map((day, index) => (
                    <div key={index} className="py-2 border-b border-gray-200">
                        <p className="text-xs text-gray-500">{koreanDayNames[day.getDay()]}</p>
                        <p className={`text-xl font-medium ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>{day.getDate()}</p>
                    </div>
                ))}
            </div>
            {renderTimeGridView(weekDays)}
        </>
    );
  };

  const renderDayView = () => {
    return (
        <>
            <div className="grid grid-cols-2 text-center">
                <div className="w-16 border-b border-gray-200"></div>
                <div className="py-2 border-b border-gray-200">
                    <p className="text-xs text-gray-500">{koreanDayNames[currentDate.getDay()]}</p>
                    <p className={`text-xl font-medium ${currentDate.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>{currentDate.getDate()}</p>
                </div>
            </div>
            {renderTimeGridView([currentDate])}
        </>
    );
  };

  const getHeaderText = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    if(view === 'month') return `${year}년 ${month + 1}월`;
    if(view === 'week') {
        const weekDays = getWeekDays(currentDate);
        return `${year}년 ${month + 1}월 ${weekDays[0].getDate()}일 - ${weekDays[6].getDate()}일`;
    }
    return `${year}년 ${month + 1}월 ${currentDate.getDate()}일`;
  }

  return (
    <div className="bg-white rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button onClick={() => changeDate(-1)} aria-label="이전" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="text-xl font-bold text-gray-900 w-64 text-center">{getHeaderText()}</h3>
            <button onClick={() => changeDate(1)} aria-label="다음" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
         <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setView('month')} className={`px-4 py-2 text-sm font-medium rounded-lg ${view === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>월</button>
            <button onClick={() => setView('week')} className={`px-4 py-2 text-sm font-medium rounded-lg ${view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>주</button>
            <button onClick={() => setView('day')} className={`px-4 py-2 text-sm font-medium rounded-lg ${view === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>일</button>
        </div>
      </div>
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
};

export default BookingCalendar;