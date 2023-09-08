import React from 'react';
import { Pagination } from '@themesberg/react-bootstrap';

const useGroupedPagination = (items, itemsPerPage, initialPage = 1) => {
  const [activeItem, setActiveItem] = React.useState(initialPage);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const onPrevItem = () => {
    const prevActiveItem = activeItem === 1 ? activeItem : activeItem - 1;
    setActiveItem(prevActiveItem);
  };

  const onNextItem = () => {
    const nextActiveItem = activeItem === totalPages ? activeItem : activeItem + 1;
    setActiveItem(nextActiveItem);
  };

  const groupedItems = React.useMemo(() => {
    const startIndex = (activeItem - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, activeItem, itemsPerPage]);

  const paginationItems = React.useMemo(() => {
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      const isItemActive = activeItem === number;

      const handlePaginationChange = () => {
        setActiveItem(number);
      };

      items.push(
        <Pagination.Item active={isItemActive} key={number} onClick={handlePaginationChange}>
          {number}
        </Pagination.Item>
      );
    }
    return items;
  }, [activeItem, totalPages]);

  return {
    activeItem,
    onPrevItem,
    onNextItem,
    groupedItems,
    paginationItems,
  };
};

export default useGroupedPagination;