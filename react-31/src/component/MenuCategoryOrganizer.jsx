import React, { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { MdDragIndicator } from "react-icons/md";
import API_URL from "../utils/api";

const formatCategoryLabel = (raw) =>
  String(raw || "Uncategorized")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const CategoryDishCardContent = ({
  product,
  orderIndex,
  dragHandleProps,
  isDragging = false,
  isOverlay = false,
  isDragDisabled = false,
  isBusy = false,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  const isAvailable = product.isAvailable !== false;
  const imgSrc = product.images?.[0]
    ? `${API_URL}/${product.images[0]}`
    : "https://via.placeholder.com/150";

  return (
    <div
      className={[
        "organizer-dish-card",
        isDragging ? "is-dragging" : "",
        isOverlay ? "is-overlay" : "",
        !isAvailable ? "is-unavailable" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="organizer-dish-card__top">
        <button
          type="button"
          className={`dish-drag-handle ${isDragDisabled ? "is-disabled" : ""}`}
          title={isDragDisabled ? "Clear search filter to drag & reorder" : "Drag to reorder dish"}
          aria-label={`Drag to reorder ${product.title}`}
          disabled={isDragDisabled}
          {...(isDragDisabled ? {} : dragHandleProps)}
        >
          <MdDragIndicator />
        </button>

        <span className="dish-order-pill" title="Display position in category">
          #{orderIndex + 1}
        </span>

        <span className={`dish-status-badge ${isAvailable ? "available" : "unavailable"}`}>
          {isAvailable ? "Available" : "Unavailable"}
        </span>
      </div>

      <div className="organizer-dish-card__body">
        <div className="organizer-dish-card__thumb">
          <img src={imgSrc} alt={product.title} loading="lazy" decoding="async" />
        </div>

        <div className="organizer-dish-card__info">
          <h4 title={product.title}>{product.title}</h4>
          <span className="organizer-dish-card__price">{product.price} EGP</span>
          {product.stock !== undefined && (
            <small className="organizer-dish-card__stock">Stock: {product.stock}</small>
          )}
        </div>
      </div>

      <div className="organizer-dish-card__actions">
        <button
          type="button"
          className={`btn-dish-action toggle ${isAvailable ? "is-on" : "is-off"}`}
          onClick={() => onToggleAvailability(product)}
          disabled={isBusy}
          title={isAvailable ? "Mark as Unavailable" : "Mark as Available"}
          aria-label={isAvailable ? `Hide ${product.title}` : `Show ${product.title}`}
        >
          {isAvailable ? <FiEye /> : <FiEyeOff />}
          <span className="btn-dish-action-label">{isAvailable ? "Available" : "Hidden"}</span>
        </button>

        <div className="organizer-dish-card__crud">
          <button
            type="button"
            className="btn-dish-action edit"
            onClick={() => onEdit(product)}
            title="Edit dish"
            aria-label={`Edit ${product.title}`}
          >
            <FiEdit2 />
          </button>
          <button
            type="button"
            className="btn-dish-action delete"
            onClick={() => onDelete(product._id)}
            title="Delete dish"
            aria-label={`Delete ${product.title}`}
          >
            <FiTrash2 />
          </button>
        </div>
      </div>
    </div>
  );
};

const SortableDishCard = ({
  product,
  orderIndex,
  isDragDisabled,
  isBusy,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: product._id,
    disabled: isDragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-dish-slot">
      <CategoryDishCardContent
        product={product}
        orderIndex={orderIndex}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
        isDragDisabled={isDragDisabled}
        isBusy={isBusy}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleAvailability={onToggleAvailability}
      />
    </div>
  );
};

const CategorySection = ({
  categoryKey,
  items,
  isCollapsed,
  isSavingOrder,
  busyToggleId,
  onToggleCollapse,
  onReorderCategory,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  const [filterText, setFilterText] = useState("");
  const [activeDragId, setActiveDragId] = useState(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 140, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const normalizedFilter = filterText.trim().toLowerCase();
  const isFiltered = normalizedFilter.length > 0;

  const visibleItems = useMemo(() => {
    if (!isFiltered) return items;
    return items.filter(
      (item) =>
        String(item.title || "").toLowerCase().includes(normalizedFilter) ||
        String(item.description || "").toLowerCase().includes(normalizedFilter)
    );
  }, [items, isFiltered, normalizedFilter]);

  const activeProduct = useMemo(
    () => items.find((item) => item._id === activeDragId) || null,
    [items, activeDragId]
  );
  const activeIndex = useMemo(
    () => items.findIndex((item) => item._id === activeDragId),
    [items, activeDragId]
  );

  const handleDragStart = (event) => {
    setActiveDragId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over || active.id === over.id || isFiltered) return;

    const oldIndex = items.findIndex((item) => item._id === active.id);
    const newIndex = items.findIndex((item) => item._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    onReorderCategory(categoryKey, reorderedItems);
  };

  const sectionDomId = `admin-cat-${categoryKey.replace(/[^a-z0-9]+/gi, "-")}`;

  return (
    <section id={sectionDomId} className={`category-organizer-section ${isCollapsed ? "is-collapsed" : ""}`}>
      <header className="category-organizer-header">
        <div className="category-organizer-title-wrap">
          <button
            type="button"
            className="category-collapse-btn"
            onClick={() => onToggleCollapse(categoryKey)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? `Expand ${formatCategoryLabel(categoryKey)}` : `Collapse ${formatCategoryLabel(categoryKey)}`}
          >
            {isCollapsed ? <FiChevronDown /> : <FiChevronUp />}
          </button>
          <div>
            <div className="category-organizer-heading-row">
              <h3>{formatCategoryLabel(categoryKey)}</h3>
              <span className="category-count-pill">
                {items.length} {items.length === 1 ? "dish" : "dishes"}
              </span>
              {isSavingOrder && <span className="category-saving-pill">Saving order...</span>}
            </div>
            <p className="category-organizer-hint">
              {isFiltered
                ? "Clear search filter to drag and reorder dishes"
                : "Drag the grip handle to reorder dishes in this category"}
            </p>
          </div>
        </div>

        {!isCollapsed && items.length > 0 && (
          <div className="category-search-box">
            <FiSearch className="category-search-icon" aria-hidden="true" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={`Search in ${formatCategoryLabel(categoryKey)}...`}
              aria-label={`Search dishes in ${formatCategoryLabel(categoryKey)}`}
            />
            {filterText && (
              <button
                type="button"
                className="category-search-clear"
                onClick={() => setFilterText("")}
                aria-label="Clear category filter"
              >
                <FiX />
              </button>
            )}
          </div>
        )}
      </header>

      {!isCollapsed && (
        <div className="category-organizer-body">
          {visibleItems.length === 0 ? (
            <div className="category-empty-state">
              <p>
                {isFiltered
                  ? `No dishes matching "${filterText}" in ${formatCategoryLabel(categoryKey)}.`
                  : `No dishes in ${formatCategoryLabel(categoryKey)} yet.`}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveDragId(null)}
            >
              <SortableContext
                items={visibleItems.map((item) => item._id)}
                strategy={rectSortingStrategy}
              >
                <div className={`category-dishes-grid ${activeDragId ? "is-sorting" : ""}`}>
                  {visibleItems.map((product, index) => (
                    <SortableDishCard
                      key={product._id}
                      product={product}
                      orderIndex={index}
                      isDragDisabled={isFiltered || isSavingOrder}
                      isBusy={busyToggleId === product._id}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onToggleAvailability={onToggleAvailability}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay adjustScale={false}>
                {activeProduct ? (
                  <CategoryDishCardContent
                    product={activeProduct}
                    orderIndex={Math.max(0, activeIndex)}
                    isOverlay
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onToggleAvailability={() => {}}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      )}
    </section>
  );
};

export const MenuCategoryOrganizer = ({
  products,
  savingCategory,
  busyToggleId,
  onReorderCategory,
  onEdit,
  onDelete,
  onToggleAvailability,
}) => {
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const groupedCategories = useMemo(() => {
    const groups = new Map();

    products.forEach((product) => {
      const rawCategory = String(product.category || "Uncategorized").trim();
      const normalizedKey = rawCategory.toLowerCase();
      if (!groups.has(normalizedKey)) {
        groups.set(normalizedKey, { key: normalizedKey, rawName: rawCategory, items: [] });
      }
      groups.get(normalizedKey).items.push(product);
    });

    const PREFERRED_ORDER = ["breakfast", "lunch", "main course", "desserts", "drinks"];
    const entries = Array.from(groups.values());

    entries.sort((a, b) => {
      const idxA = PREFERRED_ORDER.indexOf(a.key);
      const idxB = PREFERRED_ORDER.indexOf(b.key);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.key.localeCompare(b.key);
    });

    entries.forEach((group) => {
      group.items.sort((a, b) => {
        const orderA = Number(a.displayOrder ?? a.order ?? 0);
        const orderB = Number(b.displayOrder ?? b.order ?? 0);
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    });

    return entries;
  }, [products]);

  const toggleCollapse = (categoryKey) => {
    const normalized = String(categoryKey || "").trim().toLowerCase();
    setCollapsedCategories((prev) => ({
      ...prev,
      [normalized]: !prev[normalized],
    }));
  };

  const allCollapsed =
    groupedCategories.length > 0 &&
    groupedCategories.every((group) => Boolean(collapsedCategories[group.key]));

  const toggleAllCategories = () => {
    const nextValue = !allCollapsed;
    const nextMap = {};
    groupedCategories.forEach((group) => {
      nextMap[group.key] = nextValue;
    });
    setCollapsedCategories(nextMap);
  };

  const scrollToCategory = (categoryKey) => {
    setCollapsedCategories((prev) => ({ ...prev, [categoryKey]: false }));
    const id = `admin-cat-${categoryKey.replace(/[^a-z0-9]+/gi, "-")}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="menu-organizer-wrapper">
      <div className="menu-organizer-toolbar">
        <div className="menu-organizer-quicknav" aria-label="Quick category navigation">
          {groupedCategories.map((group) => (
            <button
              key={group.key}
              type="button"
              className="quicknav-pill"
              onClick={() => scrollToCategory(group.key)}
            >
              <span>{formatCategoryLabel(group.rawName)}</span>
              <strong>{group.items.length}</strong>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="btn-collapse-all"
          onClick={toggleAllCategories}
        >
          {allCollapsed ? "Expand All" : "Collapse All"}
        </button>
      </div>

      <div className="menu-organizer-sections">
        {groupedCategories.map((group) => (
          <CategorySection
            key={group.key}
            categoryKey={group.rawName}
            items={group.items}
            isCollapsed={Boolean(collapsedCategories[group.key])}
            isSavingOrder={savingCategory === group.rawName}
            busyToggleId={busyToggleId}
            onToggleCollapse={(key) => toggleCollapse(key)}
            onReorderCategory={onReorderCategory}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleAvailability={onToggleAvailability}
          />
        ))}
      </div>
    </div>
  );
};
