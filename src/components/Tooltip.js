import React, { useState } from 'react';
import styles from './Tooltip.module.css';

/**
 * Reusable tooltip component for displaying help information
 * 
 * @param {Object} props Component properties
 * @param {string} props.id Unique identifier for the tooltip
 * @param {React.ReactNode} props.content Content to display inside the tooltip
 * @param {boolean} props.wide Whether to use a wider tooltip style
 * @param {string} props.buttonText Text to show in tooltip button (default: '?')
 * @param {boolean} props.inline Whether tooltip should be displayed inline with text
 * @returns {JSX.Element} Tooltip component
 */
const Tooltip = ({ id, content, wide = false, buttonText = '?', inline = false }) => {
  const [isActive, setIsActive] = useState(false);

  const toggleTooltip = () => {
    setIsActive(!isActive);
  };

  return (
    <div 
      className={`${styles.tooltipContainer} ${isActive ? styles.active : ''} ${inline ? 'inline-flex items-center' : ''}`}
      onClick={toggleTooltip}
    >
      <span className={styles.tooltipButton}>{buttonText}</span>
      <div className={`${styles.tooltipContent} ${wide ? styles.wideTooltip : ''}`}>
        {content}
      </div>
    </div>
  );
};

/**
 * Simple inline info tooltip, typically used next to warning messages
 * 
 * @param {Object} props Component properties
 * @param {React.ReactNode} props.content Content to display inside the tooltip
 * @returns {JSX.Element} Info tooltip component
 */
export const InfoTooltip = ({ content }) => {
  return (
    <div className={styles.tooltipContainer}>
      <span className={styles.infoIcon}>ⓘ</span>
      <div className={styles.tooltipContent}>
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
