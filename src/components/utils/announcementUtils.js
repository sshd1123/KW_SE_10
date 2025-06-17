// utils/announcementUtils.js
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) {
      return '오늘';
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };
  
  export const getPriorityBadge = (priority) => {
    const badges = {
      urgent: { text: '긴급', className: 'urgent' },
      important: { text: '중요', className: 'important' },
      normal: { text: '일반', className: 'normal' }
    };
    return badges[priority] || badges.normal;
  };
  
  export const truncateContent = (content, maxLength = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };
  
  export const getAnnouncementStatus = (announcement) => {
    const now = new Date();
    const createdAt = new Date(announcement.createdAt);
    const daysDiff = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  
    if (daysDiff <= 1) return 'new';
    if (daysDiff <= 7) return 'recent';
    return 'old';
  };