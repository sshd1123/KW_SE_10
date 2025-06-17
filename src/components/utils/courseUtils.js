export const formatSchedule = (schedule) => {
    if (!schedule || !Array.isArray(schedule)) return '';

    return schedule.map(s =>
        `${s.day} ${s.startTime}-${s.endTime}`
    ).join(', ');
};

export const getCourseTypeLabel = (type) => {
    const typeLabels = {
        '전공필수': '전필',
        '전공선택': '전선',
        '교양필수': '교필',
        '교양선택': '교선'
    };
    return typeLabels[type] || type;
};

export const calculateRemainingCapacity = (enrolled, capacity) => {
    return Math.max(0, capacity - enrolled);
};

export const getCourseStatusColor = (enrolled, capacity) => {
    const ratio = enrolled / capacity;
    if (ratio >= 1) return 'full'; // 마감
    if (ratio >= 0.8) return 'almost-full'; // 거의 마감
    if (ratio >= 0.5) return 'half-full'; // 반 정도
    return 'available'; // 여유
};