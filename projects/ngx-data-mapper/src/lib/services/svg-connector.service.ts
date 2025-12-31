import { Injectable } from '@angular/core';

export interface Point {
  x: number;
  y: number;
}

export interface ConnectionPath {
  id: string;
  mappingId: string;
  path: string;
  sourcePoints: Point[];
  targetPoint: Point;
  midPoint: Point;
  isSelected: boolean;
  hasTransformation: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SvgConnectorService {
  createBezierPath(start: Point, end: Point): string {
    const dx = end.x - start.x;
    const controlPointOffset = Math.min(Math.abs(dx) * 0.5, 150);

    const cp1x = start.x + controlPointOffset;
    const cp1y = start.y;
    const cp2x = end.x - controlPointOffset;
    const cp2y = end.y;

    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  }

  createMultiSourcePath(sources: Point[], target: Point): { paths: string[]; mergePoint: Point } {
    const mergeX = target.x - 80;
    const mergeY = target.y;
    const mergePoint = { x: mergeX, y: mergeY };

    const paths = sources.map((source) => {
      // Path from source to merge point
      const dx1 = mergeX - source.x;
      const cp1Offset = Math.min(Math.abs(dx1) * 0.4, 100);

      return `M ${source.x} ${source.y} C ${source.x + cp1Offset} ${source.y}, ${mergeX - cp1Offset} ${mergeY}, ${mergeX} ${mergeY}`;
    });

    // Add path from merge point to target
    const finalPath = `M ${mergeX} ${mergeY} L ${target.x} ${target.y}`;
    paths.push(finalPath);

    return { paths, mergePoint };
  }

  getMidPoint(start: Point, end: Point): Point {
    return {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    };
  }

  getMultiSourceMidPoint(sources: Point[], target: Point): Point {
    const mergeX = target.x - 80;
    return {
      x: mergeX,
      y: target.y,
    };
  }

  calculateConnectionPoint(
    rect: DOMRect,
    side: 'source' | 'target',
    containerRect: DOMRect
  ): Point {
    const relativeY = rect.top - containerRect.top + rect.height / 2;

    if (side === 'source') {
      return {
        x: rect.right - containerRect.left,
        y: relativeY,
      };
    } else {
      return {
        x: rect.left - containerRect.left,
        y: relativeY,
      };
    }
  }

  isPointNearPath(
    point: Point,
    pathStart: Point,
    pathEnd: Point,
    threshold: number = 10
  ): boolean {
    // Simplified hit detection using distance to line segment
    const A = point.x - pathStart.x;
    const B = point.y - pathStart.y;
    const C = pathEnd.x - pathStart.x;
    const D = pathEnd.y - pathStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx: number, yy: number;

    if (param < 0) {
      xx = pathStart.x;
      yy = pathStart.y;
    } else if (param > 1) {
      xx = pathEnd.x;
      yy = pathEnd.y;
    } else {
      xx = pathStart.x + param * C;
      yy = pathStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= threshold;
  }

  createDragPath(start: Point, end: Point): string {
    return this.createBezierPath(start, end);
  }
}
