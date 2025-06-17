// utils/fileUtils.js
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType) => {
    const iconMap = {
        // 문서 파일
        'application/pdf': '📄',
        'application/msword': '📝',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
        'application/vnd.ms-excel': '📊',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
        'application/vnd.ms-powerpoint': '📽️',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',

        // 이미지 파일
        'image/jpeg': '🖼️',
        'image/jpg': '🖼️',
        'image/png': '🖼️',
        'image/gif': '🖼️',

        // 압축 파일
        'application/zip': '🗜️',
        'application/x-rar-compressed': '🗜️',
        'application/x-7z-compressed': '🗜️',

        // 텍스트 파일
        'text/plain': '📄',
        'text/csv': '📋',

        // 비디오 파일
        'video/mp4': '🎥',
        'video/avi': '🎥',
        'video/mov': '🎥'
    };

    return iconMap[fileType] || '📎';
};

export const isValidFileType = (file, allowedTypes = []) => {
    if (allowedTypes.length === 0) return true;
    return allowedTypes.includes(file.type) || allowedTypes.some(type =>
        file.name.toLowerCase().endsWith(type.replace('*', ''))
    );
};

export const getFileCategoryFromType = (fileType) => {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType.includes('pdf')) return 'document';
    if (fileType.includes('word') || fileType.includes('document')) return 'document';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'spreadsheet';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'presentation';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) return 'archive';
    return 'other';
};

export const validateFile = (file, maxSize = 50 * 1024 * 1024) => { // 기본 50MB
    const errors = [];

    if (file.size > maxSize) {
        errors.push(`파일 크기가 ${formatFileSize(maxSize)}를 초과합니다.`);
    }

    if (file.name.length > 100) {
        errors.push('파일명이 너무 깁니다. (최대 100자)');
    }

    return errors;
};