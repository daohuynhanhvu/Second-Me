import { isPositionWalkable } from './collision.ts';
import { segmentWall, type Point } from './combatGeometry.ts';
import type { Rect } from './types.ts';

const STEP = 32, LEFT = 56, TOP = 56, COLS = 37, ROWS = 20;
const point = (id: number): Point => ({x: LEFT + (id % COLS) * STEP, y: TOP + Math.floor(id / COLS) * STEP});
const clear = (a: Point, b: Point, walls: Rect[]) => !walls.some(w => segmentWall(a, b, w, 15) !== null);

/** A small grid route around walls and doors; a closed gate remains impassable. */
export function enemyRoute(start: Point, goal: Point, walls: Rect[]): Point[] {
  const valid = new Int8Array(COLS * ROWS);
  const walkable = (id: number) => {
    if (!valid[id]) { const p = point(id); valid[id] = isPositionWalkable(p.x,p.y,30,30,walls) ? 1 : -1; }
    return valid[id] > 0;
  };
  const nearestVisible = (from: Point) => {
    let best = -1, distance = Infinity;
    for (let id = 0; id < valid.length; id++) {
      const p = point(id), d = Math.hypot(p.x-from.x,p.y-from.y);
      if (d < distance && d < STEP * 3 && walkable(id) && clear(from,p,walls)) { best=id; distance=d; }
    }
    return best;
  };
  const first = nearestVisible(start), last = nearestVisible(goal);
  if (first < 0 || last < 0) return [];
  const distances = new Float64Array(valid.length).fill(Infinity), parents = new Int32Array(valid.length).fill(-1);
  const closed = new Uint8Array(valid.length), open = [first]; distances[first] = 0;
  const heuristic = (id: number) => { const p=point(id), q=point(last); return Math.abs(p.x-q.x)+Math.abs(p.y-q.y); };
  while (open.length) {
    let best = 0;
    for (let i=1;i<open.length;i++) if (distances[open[i]]+heuristic(open[i]) < distances[open[best]]+heuristic(open[best])) best=i;
    const current = open.splice(best,1)[0];
    if (current === last) {
      const route: Point[] = [];
      for (let id=current;id!==-1;id=parents[id]) route.push(point(id));
      return route.reverse();
    }
    if (closed[current]) continue;
    closed[current] = 1;
    const col=current%COLS, row=Math.floor(current/COLS);
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const c=col+dx, r=row+dy;
      if(c<0||c>=COLS||r<0||r>=ROWS)continue;
      const next=r*COLS+c;
      if(closed[next]||!walkable(next)||!clear(point(current),point(next),walls))continue;
      const cost=distances[current]+STEP;
      if(cost<distances[next]){distances[next]=cost;parents[next]=current;open.push(next);}
    }
  }
  return [];
}

interface RouteCache { targetX: number; targetY: number; remaining: number; points: Point[]; found: boolean }
const routes = new WeakMap<object, RouteCache>();
/** Cache routes briefly so moving Echoes are followed without searching every frame. */
export function enemyWaypoint(enemy: Point, target: Point, walls: Rect[], dt: number): Point {
  return reachableWaypoint(enemy, target, walls, dt) ?? target;
}

/**
 * The next point on the way to `target`, or null when no route reaches it (a sealed room):
 * then the caller decides, instead of walking straight into the wall.
 */
export function reachableWaypoint(enemy: Point, target: Point, walls: Rect[], dt: number): Point | null {
  if (clear(enemy,target,walls)) { routes.delete(enemy); return target; }
  let route=routes.get(enemy);
  if(route)route.remaining-=dt;
  if(!route || route.remaining<=0 || Math.hypot(target.x-route.targetX,target.y-route.targetY)>STEP) {
    const points=enemyRoute(enemy,target,walls);
    route={targetX:target.x,targetY:target.y,remaining:.6,points,found:points.length>0};
    routes.set(enemy,route);
  }
  while(route.points.length && Math.hypot(route.points[0].x-enemy.x,route.points[0].y-enemy.y)<10)route.points.shift();
  if (route.points.length) return route.points[0];
  // A route walked to its end: the last stretch to the target. None found: no way through.
  return route.found ? target : null;
}
