import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Facility } from '@/types';

interface BookingGridProps {
  facility: Facility;
  selectedDate: Date;
  onSelectTime: (startTime: string, endTime: string) => void;
  bookings: Booking[];
}

const TimeSlot: React.FC<{ time: string; status: 'available' | 'booked' | 'buffer' | 'selected'; onClick: () => void; }> = ({ time, status, onClick }) => {
  const baseClasses = "h-8 border-t border-r border-gray-200 flex items-center justify-center text-xs";
  const statusClasses = {
    available: "bg-white hover:bg-blue-100 cursor-pointer",
    booked: "bg-gray-400 text-white cursor-not-allowed",
    buffer: "bg-gray-200 cursor-not-allowed",
    selected: "bg-blue-500 text-white",
  };
  return <div className={`${baseClasses} ${statusClasses[status]}`} onClick={status === 'available' ? onClick : undefined}>{time}</div>;
};

const BookingGrid: React.FC<BookingGridProps> = ({ facility, selectedDate, onSelectTime, bookings }) => {
  

  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push(`${String(hour).padStart(2, '0')}:00`);
      slots.push(`${String(hour).padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const bookingsOnDate = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return bookings.filter(b => b.facilityId === facility.id && b.startDate === dateStr && (b.status === 'approved' || b.status === 'pending'));
  }, [bookings, facility.id, selectedDate]);

  const getSlotStatus = (slot: string): 'available' | 'booked' | 'buffer' => {
    const slotTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${slot}`).getTime();
    for (const booking of bookingsOnDate) {
      const start = new Date(`${booking.startDate}T${booking.startTime}`).getTime();
      const end = new Date(`${booking.endDate}T${booking.endTime}`).getTime();
      const bufferMillis = (facility.bufferMinutes || 0) * 60000;

      if (slotTime >= start && slotTime < end) return 'booked';
      if (slotTime >= (start - bufferMillis) && slotTime < (end + bufferMillis)) return 'buffer';
    }
    return 'available';
  };

  const handleSlotClick = (slot: string) => {
    const newSelection = [...selectedSlots, slot].sort();
    // 媛꾨떒???덉떆: ?쒖옉怨????щ’留??좏깮
    if (newSelection.length > 2) {
        setSelectedSlots([slot]);
    } else {
        setSelectedSlots(newSelection);
    }
  };

  useEffect(() => {
    if (selectedSlots.length === 2) {
      const endSlotTime = new Date(`1970-01-01T${selectedSlots[1]}`).getTime();
      const endTime = new Date(endSlotTime + 30 * 60000);
      const endTimeStr = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
      onSelectTime(selectedSlots[0], endTimeStr);
    }
  }, [selectedSlots, onSelectTime]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="font-bold text-lg mb-4">{selectedDate.toLocaleDateString('ko-KR')} - {facility.name}</h3>
        <div className="grid grid-cols-1" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {timeSlots.map(slot => {
                const status = getSlotStatus(slot);
                const isSelected = selectedSlots.includes(slot);
                return <TimeSlot key={slot} time={slot} status={isSelected ? 'selected' : status} onClick={() => handleSlotClick(slot)} />
            })}
        </div>
        {selectedSlots.length > 0 && <p className='text-center mt-2 text-sm font-semibold'>?좏깮???쒓컙: {selectedSlots.join(' - ')}</p>}
    </div>
  );
};

export default BookingGrid;

