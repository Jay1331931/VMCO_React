import * as React from 'react';
import PropTypes from 'prop-types';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function LinearProgressWithLabel(props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`${Math.round(props.value)}%`}
        </Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
};

export default function FileUploadProgress({
  progress = 0,
  isComplete = false,
  onComplete,
  onRowErrors,
  onOtherErrors,
  rowErrorsThreshold = 60,
  otherErrorsThreshold = 80
}) {
  const [hasShownRowErrors, setHasShownRowErrors] = React.useState(false);
  const [hasShownOtherErrors, setHasShownOtherErrors] = React.useState(false);
  const [hasShownComplete, setHasShownComplete] = React.useState(false);

  React.useEffect(() => {
    // Show row errors message at 60% (only once)
    if (progress >= rowErrorsThreshold && !hasShownRowErrors && onRowErrors) {
      setHasShownRowErrors(true);
      onRowErrors();
    }

    // Show other errors message at 80% (only once)
    if (progress >= otherErrorsThreshold && !hasShownOtherErrors && onOtherErrors) {
      setHasShownOtherErrors(true);
      onOtherErrors();
    }

    // Show success message only when both progress is 100% AND isComplete is true
    if (progress === 100 && isComplete && !hasShownComplete && onComplete) {
      setHasShownComplete(true);
      onComplete();
    }
  }, [progress, isComplete, hasShownRowErrors, hasShownOtherErrors, hasShownComplete, onRowErrors, onOtherErrors, onComplete, rowErrorsThreshold, otherErrorsThreshold]);

  return (
    <Box sx={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '600px',
      maxWidth: '90vw',
      zIndex: 9999
    }}>
      <LinearProgressWithLabel value={progress} />
    </Box>
  );
}

FileUploadProgress.propTypes = {
  progress: PropTypes.number,
  isComplete: PropTypes.bool,
  onComplete: PropTypes.func,
  onRowErrors: PropTypes.func,
  onOtherErrors: PropTypes.func,
  rowErrorsThreshold: PropTypes.number,
  otherErrorsThreshold: PropTypes.number,
};
