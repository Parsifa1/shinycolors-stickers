import { useEffect, useRef } from "react";
import type { CanvasProps } from "../types/index";

const Canvas = (props: CanvasProps) => {
  const { draw, spaceSize, ...rest } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    draw(context);
  }, [draw]);

  return <canvas ref={canvasRef} {...rest} />;
};

export default Canvas;
