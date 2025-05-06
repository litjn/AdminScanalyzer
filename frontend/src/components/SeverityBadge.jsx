
import React from 'react';

const SeverityBadge = ({ type }) => {
  const classes = {
    normal: "bg-green-100 text-green-800 border border-green-200 px-2 py-0.5 rounded-full text-xs font-medium",
    suspicious: "bg-yellow-100 text-yellow-800 border border-yellow-200 px-2 py-0.5 rounded-full text-xs font-medium",
    anomaly: "bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full text-xs font-medium",
    critical: "bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full text-xs font-medium"
  };

  const labels = {
    normal: "Normal",
    suspicious: "Suspicious",
    anomaly: "Anomaly",
    critical: "Critical"
  };

  return (
    <span className={classes[type]}>
      {labels[type]}
    </span>
  );
};

export default SeverityBadge;
