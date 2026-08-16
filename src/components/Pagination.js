import React from 'react';

/**
 * Pagination component for navigating through large datasets
 * 
 * @param {Object} props Component properties
 * @param {number} props.currentPage Current active page
 * @param {number} props.totalPages Total number of pages
 * @param {Function} props.onPageChange Function to call when page changes
 * @returns {JSX.Element} Pagination component
 */
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Don't render if only one page
  if (totalPages <= 1) return null;
  
  // Calculate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include first page
      pages.push(1);
      
      // Calculate start and end of middle pages
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('...');
      }
      
      // Always include last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center mt-4 mb-2">
      <nav className="flex items-center">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded-l-md border ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          Previous
        </button>
        
        {/* Page numbers */}
        {getPageNumbers().map((page, index) => (
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="px-3 py-1 border-t border-b">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => page !== currentPage && onPageChange(page)}
              className={`px-3 py-1 border-t border-b ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              {page}
            </button>
          )
        ))}
        
        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded-r-md border ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-blue-600 hover:bg-blue-50'
          }`}
        >
          Next
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
