import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Program } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardCalendarProps {
  bookings: Booking[];
  programs: Program[];
  view: 'month' | 'week' | 'day';
  setView: React.Dispatch<React.SetStateAction<'month' | 'week' | 'day'>>;
}

type CalendarEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'booking' | 'program';
  originalData: Booking | Program;
};

const bookingCategoryMap: { [key in Booking['category']]: string } = { personal: '개인', club: '동아리', event: '행사', class: '수업' };
const programCategoryMap: { [key in Program['category']]: string } = { yoga: '요가', pilates: '필라테스', fitness: '피트니스', dance: '댄스', badminton: '배드민턴', pickleball: '피클볼' };

const bookingCategoryColors: { [key in Booking['category']]: { bg: string; text: string; border: string } } = {
    personal: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-l-4 border-blue-500' },
    club: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-4 border-yellow-500' },
    event: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-l-4 border-purple-500' },
    class: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-l-4 border-red-500' },
};
const programCategoryColors: { [key in Program['category']]: { bg: string; text: string; border: string } } = {
    yoga: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-l-4 border-emerald-500' },
    pilates: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-l-4 border-sky-500' },
    fitness: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-l-4 border-rose-500' },
    dance: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-l-4 border-fuchsia-500' },
    badminton: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-l-4 border-teal-500' },
    pickleball: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-l-4 border-indigo-500' },
};

const koreanDayNames = ["일", "월", "화", "수", "목", "금", "토"];

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ bookings, programs, view, setView }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [eventFilter, setEventFilter] = useState<'all' | 'booking' | 'program'>('all');

  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    const approvedBookings = bookings.filter(b => b.status === 'approved')

    console.log('📅 DashboardCalendar 업데이트:', {
      totalBookings: bookings.length,
      approvedBookings: approvedBookings.length,
      approvedList: approvedBookings.map(b => ({ id: b.id, purpose: b.purpose, userName: b.userName }))
    })

    approvedBookings.forEach(booking => {
        const bookingStart = new Date(booking.startDate + 'T00:00:00');
        const bookingEnd = new Date(booking.endDate + 'T00:00:00');
        for (let d = new Date(bookingStart); d <= bookingEnd; d.setDate(d.getDate() + 1)) {
            const dayMatches = !booking.recurrenceRule || booking.recurrenceRule.days.length === 0 || booking.recurrenceRule.days.includes(d.getDay());
            if (dayMatches) {
                const date = d.toISOString().split('T')[0];
                events.push({ id: `booking-${booking.id}-${date}`, title: booking.purpose, startTime: booking.startTime, endTime: booking.endTime, date, type: 'booking', originalData: booking });
            }
        }
    });

    programs.forEach(program => {
        const programStart = new Date(program.startDate + 'T00:00:00');
        const programEnd = new Date(program.endDate + 'T00:00:00');
        for (let d = new Date(programStart); d <= programEnd; d.setDate(d.getDate() + 1)) {
            if (program.scheduleDays.includes(d.getDay())) {
                 const date = d.toISOString().split('T')[0];
                events.push({ id: `program-${program.id}-${date}`, title: program.title, startTime: program.startTime, endTime: program.endTime, date, type: 'program', originalData: program });
            }
        }
    });

    return events.filter(event => {
        if (eventFilter === 'all') return true;
        return event.type === eventFilter;
    });
  }, [bookings, programs, eventFilter]);

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

  const generateTooltip = (event: CalendarEvent): string => {
    if (event.type === 'booking') {
        const b = event.originalData as Booking;
        return `[대관 상세]\n- 종류: ${bookingCategoryMap[b.category]}${b.organization ? `\n- 기관: ${b.organization}` : ''}\n- 목적: ${b.purpose}\n- 시간: ${b.startTime} - ${b.endTime}\n- 신청자: ${b.userName}`;
    } else {
        const p = event.originalData as Program;
        return `[프로그램 상세]\n- 종류: ${programCategoryMap[p.category]}\n- 프로그램명: ${p.title}\n- 강사: ${p.instructor}\n- 시간: ${p.startTime} - ${p.endTime}`;
    }
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
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const eventsForDay = calendarEvents.filter(e => e.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime));
      calendarDaysData.push({ key: `day-${day}`, isPadding: false, day, isToday: new Date(dateStr).toDateString() === new Date().toDateString(), eventsForDay });
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
                {d.eventsForDay.map(event => {
                   const colors = event.type === 'booking'
                     ? bookingCategoryColors[(event.originalData as Booking).category] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-l-4 border-gray-500' }
                     : programCategoryColors[(event.originalData as Program).category] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-l-4 border-gray-500' };
                   return (
                    <div key={event.id} className={`${colors.bg} ${colors.text} ${colors.border} text-xs rounded p-1.5 cursor-pointer`} title={generateTooltip(event)}>
                      <p className="font-semibold truncate">{event.title}</p>
                      <p className="truncate">{event.startTime}-{event.endTime}</p>
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
    return (
        <div className="flex border-t border-gray-200">
            <div className="w-16 border-r border-gray-200"><div className="h-12 border-b border-gray-200"></div>{hours.map(hour => <div key={hour} className="h-12 border-b border-gray-200 text-center text-xs text-gray-500 pt-1">{hour}</div>)}</div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)`}}>
                {days.map((day, index) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const eventsForDay = calendarEvents.filter(e => e.date === dateStr);
                    return (
                        <div key={index} className={`relative ${index < days.length - 1 ? 'border-r' : ''} border-gray-200`}>
                            {hours.map(hour => <div key={hour} className="h-12 border-b border-gray-200"></div>)}
                            {eventsForDay.map(event => {
                                const start = event.startTime.split(':').map(Number);
                                const end = event.endTime.split(':').map(Number);
                                const top = (start[0] * 60 + start[1]) / 60 * 3;
                                const height = ((end[0] * 60 + end[1]) - (start[0] * 60 + start[1])) / 60 * 3;
                                const colors = event.type === 'booking'
                                  ? bookingCategoryColors[(event.originalData as Booking).category] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-l-4 border-gray-500' }
                                  : programCategoryColors[(event.originalData as Program).category] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-l-4 border-gray-500' };
                                return (
                                    <div key={event.id} style={{ top: `calc(3rem + ${top}rem)`, height: `${height}rem`}} className={`absolute left-1 right-1 ${colors.bg} ${colors.text} ${colors.border} p-2 rounded-lg text-xs overflow-hidden`} title={generateTooltip(event)}>
                                        <p className="font-bold">{event.title}</p><p>{event.startTime}-{event.endTime}</p>
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
            <div className="grid" style={{ gridTemplateColumns: '4rem 1fr' }}><div className="w-16"></div><div className="grid grid-cols-7 text-center">{weekDays.map((day, index) => (<div key={index} className="py-2 border-b border-gray-200"><p className="text-xs text-gray-500">{koreanDayNames[day.getDay()]}</p><p className={`text-xl font-medium ${day.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>{day.getDate()}</p></div>))}</div></div>
            {renderTimeGridView(weekDays)}
        </>
    );
  };

  const renderDayView = () => {
    return (
        <>
            <div className="grid" style={{ gridTemplateColumns: '4rem 1fr' }}><div className="w-16"></div><div className="text-center"><div className="py-2 border-b border-gray-200"><p className="text-xs text-gray-500">{koreanDayNames[currentDate.getDay()]}</p><p className={`text-xl font-medium ${currentDate.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-800'}`}>{currentDate.getDate()}</p></div></div></div>
            {renderTimeGridView([currentDate])}
        </>
    );
  };
  
  const getHeaderText = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    if(view === 'month') return `${year}년 ${month + 1}월`;
    if(view === 'week') { const week = getWeekDays(currentDate); return `${year}년 ${month + 1}월 ${week[0].getDate()}일 - ${week[6].getDate()}일`; }
    return `${year}년 ${month + 1}월 ${currentDate.getDate()}일`;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
        <div className="flex items-center space-x-2">
            <button onClick={() => changeDate(-1)} aria-label="이전" className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
            <h3 className="text-lg font-bold text-gray-900 w-40 sm:w-52 text-center">{getHeaderText()}</h3>
            <button onClick={() => changeDate(1)} aria-label="다음" className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setEventFilter('all')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${eventFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-white/60'}`}>전체</button>
                <button onClick={() => setEventFilter('booking')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${eventFilter === 'booking' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-white/60'}`}>대관</button>
                <button onClick={() => setEventFilter('program')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${eventFilter === 'program' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-600 hover:bg-white/60'}`}>프로그램</button>
            </div>
             <div className="flex items-center bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setView('month')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>월</button>
                <button onClick={() => setView('week')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>주</button>
                <button onClick={() => setView('day')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'day' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'}`}>일</button>
            </div>
        </div>
      </div>
      
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
};

export default DashboardCalendar;