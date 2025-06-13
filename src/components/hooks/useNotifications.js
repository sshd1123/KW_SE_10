// hooks/useNotifications.js
import { useState, useEffect } from 'react';
import { getDashboardData } from '../../data/authUtils';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        generateNotifications();
    }, []);

    useEffect(() => {
        // 읽지 않은 알림 개수 계산
        const count = notifications.filter(n => !n.isRead).length;
        setUnreadCount(count);
    }, [notifications]);

    // 알림 데이터 생성 함수
    const generateNotifications = () => {
        const data = getDashboardData();
        if (!data) return;

        const notificationList = [];
        let id = 1;

        // 공지사항 알림
        if (data.announcements) {
            data.announcements.forEach(announcement => {
                if (announcement.isNew) {
                    notificationList.push({
                        id: id++,
                        type: 'announcement',
                        title: '새로운 공지사항',
                        message: `${announcement.course}: ${announcement.title}`,
                        time: announcement.date,
                        isRead: false,
                        isImportant: announcement.course === '학사공지',
                        relatedId: announcement.id,
                        icon: 'fas fa-bullhorn'
                    });
                }
            });
        }

        // 과제 마감일 알림
        if (data.assignments) {
            data.assignments.forEach(assignment => {
                const today = new Date();
                const deadline = new Date(assignment.deadline);
                const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

                if (daysRemaining <= 3 && daysRemaining >= 0 && assignment.status !== '완료') {
                    notificationList.push({
                        id: id++,
                        type: 'assignment',
                        title: daysRemaining === 0 ? '과제 마감일 당일' : `과제 마감 ${daysRemaining}일 전`,
                        message: `${assignment.course}: ${assignment.title}`,
                        time: new Date().toISOString().split('T')[0],
                        isRead: false,
                        isImportant: daysRemaining <= 1,
                        relatedId: assignment.id,
                        icon: 'fas fa-tasks'
                    });
                }
            });
        }

        // 성적 관련 알림
        notificationList.push({
            id: id++,
            type: 'grade',
            title: '중간고사 성적 공개',
            message: '자바프로그래밍 중간고사 성적이 공개되었습니다.',
            time: '2025-05-20',
            isRead: true,
            isImportant: false,
            relatedId: null,
            icon: 'fas fa-chart-line'
        });

        // 시간순 정렬 (최신순)
        notificationList.sort((a, b) => new Date(b.time) - new Date(a.time));
        setNotifications(notificationList);
    };

    // 알림 읽음 처리
    const markAsRead = (notificationId) => {
        setNotifications(prev => 
            prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, isRead: true }
                    : notification
            )
        );
    };

    // 모든 알림 읽음 처리
    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(notification => ({ ...notification, isRead: true }))
        );
    };

    // 알림 삭제
    const deleteNotification = (notificationId) => {
        setNotifications(prev => 
            prev.filter(notification => notification.id !== notificationId)
        );
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refreshNotifications: generateNotifications
    };
};

export default useNotifications;