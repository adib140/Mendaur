import React from "react";
import "./pagination.css";

const Pagination = ({ currentPage, totalPages, onPrev, onNext }) => {
  return (
    <div className="pagination">
      <button onClick={onPrev} disabled={currentPage === 1}>
        ←
      </button>
      <span>
        Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong>
      </span>
      <button onClick={onNext} disabled={currentPage === totalPages}>
        →
      </button>
    </div>
  );
};

export default Pagination;
