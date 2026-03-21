import type { CompList, KAPLAYCtx } from 'kaplay';

export type TiledMap = TiledMapData | string;
export type AddTiledMap = (map: TiledMap, options: TiledMapOpt) => void;

export interface TiledMapOpt {
  layerNames?: string[];
  objects?: TiledObjectRule[];
  sprite: string;
  tiles?: TiledTileRule[];
}

export type TiledPropertyValue = boolean | number | string;

export interface TiledProperty {
  name: string;
  type?: string;
  value: TiledPropertyValue;
}

export interface TiledTileDefinition {
  id: number;
  properties?: TiledProperty[];
}

export interface TiledTileset {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin?: number;
  name: string;
  spacing?: number;
  tilecount: number;
  tileheight: number;
  tiles?: TiledTileDefinition[];
  tilewidth: number;
}

export interface TiledTileLayer {
  data: number[];
  height: number;
  name: string;
  opacity?: number;
  type: string;
  visible?: boolean;
  width: number;
  x?: number;
  y?: number;
}

export interface TiledObject {
  height: number;
  id: number;
  name: string;
  point?: boolean;
  properties?: TiledProperty[];
  rotation: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TiledObjectLayer {
  draworder?: string;
  id: number;
  name: string;
  objects: TiledObject[];
  opacity?: number;
  type: string;
  visible?: boolean;
  x?: number;
  y?: number;
}

export type TiledLayer = TiledObjectLayer | TiledTileLayer;

export interface TiledMapData {
  height: number;
  infinite: boolean;
  layers: TiledLayer[];
  orientation: string;
  renderorder?: string;
  tileheight: number;
  tilesets: TiledTileset[];
  tilewidth: number;
  width: number;
}

interface ParsedTiledTileset {
  columns: number;
  firstGid: number;
  image: string;
  imageHeight: number;
  imageWidth: number;
  lastGid: number;
  margin: number;
  name: string;
  spacing: number;
  tileCount: number;
  tileHeight: number;
  tiles: Record<number, ParsedTiledTile>;
  tileWidth: number;
}

export interface ParsedTiledTile {
  gid: number;
  properties: Record<string, TiledPropertyValue>;
  tileId: number;
}

export interface ParsedTiledTileLayer {
  data: number[];
  height: number;
  name: string;
  opacity: number;
  type: 'tilelayer';
  visible: boolean;
  width: number;
  x: number;
  y: number;
  zIndex: number;
}

export interface ParsedTiledObjectLayer {
  name: string;
  objects: TiledObject[];
  type: 'objectgroup';
  visible: boolean;
  zIndex: number;
}

export interface ParsedTiledMap {
  height: number;
  orientation: 'orthogonal';
  tileHeight: number;
  tileWidth: number;
  tileset: ParsedTiledTileset;
  width: number;
  layers: ParsedTiledLayer[];
}

export type ParsedTiledLayer = ParsedTiledObjectLayer | ParsedTiledTileLayer;

export interface TiledTileMatch {
  gid?: number;
  layer?: string;
  properties?: Record<string, TiledPropertyValue>;
  tileId?: number;
}

export interface TiledTileContext {
  flip: {
    diagonal: boolean;
    horizontal: boolean;
    vertical: boolean;
  };
  gid: number;
  layer: string;
  height: number;
  tileHeight: number;
  tileWidth: number;
  tileX: number;
  tileY: number;
  width: number;
  x: number;
  y: number;
  properties: Record<string, TiledPropertyValue>;
  tileId: number;
}

export interface TiledTileRule {
  comps: (tile: TiledTileContext) => CompList<unknown>;
  match: TiledTileMatch;
}

export interface TiledObjectMatch {
  layer?: string;
  name?: string;
  properties?: Record<string, TiledPropertyValue>;
  type?: string;
}

export interface TiledObjectContext {
  height: number;
  id: number;
  layer: string;
  name: string;
  width: number;
  x: number;
  y: number;
  point: boolean;
  properties: Record<string, TiledPropertyValue>;
  rotation: number;
  type: string;
}

export interface TiledObjectRule {
  comps: (object: TiledObjectContext) => CompList<unknown>;
  match: TiledObjectMatch;
}

export type TiledLayerComp =
  | ReturnType<KAPLAYCtx['pos']>
  | ReturnType<KAPLAYCtx['z']>
  | {
      draw: () => void;
      id: string;
    };
