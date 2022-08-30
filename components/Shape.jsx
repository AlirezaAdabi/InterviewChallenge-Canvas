import React, { useEffect, useRef, useState } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";

const Rectangle = ({ shapeProps, isSelected, onSelect, onChange }) => {
  const shapeRef = React.useRef();
  const trRef = React.useRef();

  React.useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <React.Fragment>
      <Rect
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable={isSelected}
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.attrs.scaleX;
          const scaleY = node.attrs.scaleY;
          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, Math.abs(node.width() * scaleX)),
            height: Math.abs(node.height() * scaleY),
          });
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const getId = (createId) => {
  createId.current = String(parseInt(createId.current) + 1);
  return String(createId.current);
};

const Shape = ({ color, setColor }) => {
  const [selectedId, selectShape] = useState(null);
  const [rects, setRects] = useState({});
  const [isMouseDown, setIsMouseDown] = useState(false);
  const createId = useRef("0");
  const selected = useRef(null);
  const duplicated = useRef(false);

  useEffect(() => {
    Object.entries(rects).map(([key, currentRect]) => {
      if (currentRect.stroke === color) {
        selectShape(currentRect.id);
        selected.current = currentRect.id;
      }
    });
  }, [color]);

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      selected.current = null;
      setColor(null);
    }
  };
  const onMouseDownHandler = (e) => {
    checkDeselect(e);

    if (selected.current) return;
    setIsMouseDown(true);
    let isDuplicate = Object.entries(rects).findIndex(([key, currentRect]) => {
      if (currentRect.stroke === color) {
        return true;
      }
    });

    if (isDuplicate !== -1) {
      return (duplicated.current = true);
    } else {
      duplicated.current = false;
    }

    const id = getId(createId);
    selectShape(id);
    selected.current = id;
    setRects((prev) => {
      return {
        ...prev,
        [id]: {
          x: e.evt.clientX,
          y: e.evt.clientY,
          width: 0,
          height: 0,
          stroke: color,
          id,
        },
      };
    });
  };
  const onMouseUpHandler = (e) => {
    setIsMouseDown(false);
    Object.entries(rects).map(([key, currentRect]) => {
      if (
        (currentRect.width < 5 && currentRect.height < 5) ||
        !currentRect.stroke
      ) {
        rects = { ...rects };
        delete rects[key];
        setRects(rects);

        if (!currentRect.stroke) alert("select a color");
      }
    });
  };
  const onMouseMoveHandler = (e) => {
    if (!isMouseDown || duplicated.current) return;

    setRects((prev) => {
      return {
        ...prev,
        [selected.current]: {
          ...prev[selected.current],
          width: e.evt.clientX - prev[selected.current].x,
          height: e.evt.clientY - prev[selected.current].y,
        },
      };
    });
  };
  return (
    <Stage
      width={1000}
      height={500}
      onMouseDown={onMouseDownHandler}
      onMouseUp={onMouseUpHandler}
      onMouseMove={onMouseMoveHandler}
      onTouchStart={checkDeselect}
    >
      <Layer>
        {Object.entries(rects).map(([key, currentRect]) => {
          return (
            <Rectangle
              key={key}
              shapeProps={currentRect}
              isSelected={currentRect.id === selectedId}
              onSelect={() => {
                selectShape(currentRect.id);
                selected.current = currentRect.id;
              }}
              onChange={(newAttrs) => {
                setRects((prev) => {
                  return {
                    ...prev,
                    [selectedId]: {
                      ...prev[selectedId],
                      x: newAttrs.x,
                      y: newAttrs.y,
                      width: newAttrs.width,
                      height: newAttrs.height,
                      stroke: newAttrs.stroke,
                      id: newAttrs.id,
                    },
                  };
                });
              }}
            />
          );
        })}
      </Layer>
    </Stage>
  );
};

export default Shape;
