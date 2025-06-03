import React, { useEffect, useState } from 'react';

function SaudiTime() {
  const [saudiTime, setSaudiTime] = useState('');

  const getSaudiArabianTime = () => {
    const now = new Date();
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Riyadh'
    }).format(now);
  };

  useEffect(() => {
    setSaudiTime(getSaudiArabianTime());
    const interval = setInterval(() => {
      setSaudiTime(getSaudiArabianTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span style={{ color: 'orange', fontWeight: 600, marginRight: '12px' }}>
      {saudiTime}
    </span>
  );
}

export default SaudiTime;