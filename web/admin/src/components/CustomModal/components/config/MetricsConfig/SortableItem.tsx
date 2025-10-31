import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FC } from 'react';
import FaqItem, { FaqItemProps } from './Item';

type FaqSortableItemProps = FaqItemProps & {};

const FaqSortableItem: FC<FaqSortableItemProps> = ({ item, ...rest }) => {
  const {
    isDragging,
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
  };

  return (
    <FaqItem
      ref={setNodeRef}
      style={style}
      withOpacity={isDragging}
      dragHandleProps={{
        ...attributes,
        ...listeners,
      }}
      item={item}
      {...rest}
    />
  );
};

export default FaqSortableItem;
