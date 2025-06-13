import React from 'react';
import { Link } from 'react-router-dom';
import './AnnouncementItem.css';

const AnnouncementItem = ({ announcement, disableLink = false }) => {
  if (disableLink) {
    return (
      <div className="announcement-item">
        <div className="announcement-meta">
          <span className="announcement-course">{announcement.course}</span>
          <span className="announcement-date">{announcement.date}</span>
        </div>
        <h4 className="announcement-title">
          {announcement.isNew && <span className="new-badge">NEW</span>}
          {announcement.title}
        </h4>
      </div>
    );
  }

  return (
    <Link to={`/student/announcement/${announcement.id}`} className="announcement-item">
      <div className="announcement-meta">
        <span className="announcement-course">{announcement.course}</span>
        <span className="announcement-date">{announcement.date}</span>
      </div>
      <h4 className="announcement-title">
        {announcement.isNew && <span className="new-badge">NEW</span>}
        {announcement.title}
      </h4>
    </Link>
  );
};

export default AnnouncementItem;
