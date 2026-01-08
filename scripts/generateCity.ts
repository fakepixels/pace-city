/**
 * City Generator Script - High Fidelity Greenwich Village
 * Generates a detailed, tree-lined city with dense buildings and aesthetic props
 */

enum TileType {
  Grass = "grass",
  Road = "road",
  Asphalt = "asphalt",
  Tile = "tile",
  Snow = "snow",
  Building = "building",
}

enum Direction {
  Up = "up",
  Down = "down",
  Left = "left",
  Right = "right",
}

interface GridCell {
  type: TileType;
  x: number;
  y: number;
  isOrigin?: boolean;
  originX?: number;
  originY?: number;
  buildingId?: string;
  buildingOrientation?: Direction;
  underlyingTileType?: TileType;
}

const GRID_WIDTH = 48;
const GRID_HEIGHT = 48;
const ROAD_SEGMENT_SIZE = 4;

// Create empty grid filled with grass
function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: GRID_HEIGHT }, (_, y) =>
    Array.from({ length: GRID_WIDTH }, (_, x) => ({
      type: TileType.Grass,
      x,
      y,
      isOrigin: true,
    }))
  );
}

// Road pattern for different segment types
function getRoadPattern(segmentType: string): TileType[][] {
  const G = TileType.Road; // Sidewalk/grass edge
  const A = TileType.Asphalt; // Driving lane

  const patterns: Record<string, TileType[][]> = {
    horizontal: [
      [G, G, G, G],
      [G, A, A, G],
      [G, A, A, G],
      [G, G, G, G],
    ],
    vertical: [
      [G, G, G, G],
      [G, A, A, G],
      [G, A, A, G],
      [G, G, G, G],
    ],
    intersection: [
      [G, A, A, G],
      [A, A, A, A],
      [A, A, A, A],
      [G, A, A, G],
    ],
  };

  return patterns[segmentType] || patterns.horizontal;
}

// Place a road segment at a specific position
function placeRoadSegment(
  grid: GridCell[][],
  segmentX: number,
  segmentY: number,
  pattern: TileType[][]
) {
  for (let dy = 0; dy < ROAD_SEGMENT_SIZE; dy++) {
    for (let dx = 0; dx < ROAD_SEGMENT_SIZE; dx++) {
      const px = segmentX + dx;
      const py = segmentY + dy;
      if (px >= 0 && px < GRID_WIDTH && py >= 0 && py < GRID_HEIGHT) {
        grid[py][px] = {
          type: pattern[dy][dx],
          x: px,
          y: py,
          isOrigin: true,
        };
      }
    }
  }
}

// Check if area is clear for building placement
function canPlaceBuilding(
  grid: GridCell[][],
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px >= GRID_WIDTH || py >= GRID_HEIGHT) return false;
      const cell = grid[py]?.[px];
      if (!cell || cell.type !== TileType.Grass) return false;
    }
  }
  return true;
}

// Place a building on the grid
function placeBuilding(
  grid: GridCell[][],
  x: number,
  y: number,
  width: number,
  height: number,
  buildingId: string,
  orientation: Direction = Direction.Down
) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < GRID_WIDTH && py < GRID_HEIGHT) {
        grid[py][px] = {
          type: TileType.Building,
          x: px,
          y: py,
          isOrigin: dx === 0 && dy === 0,
          originX: x,
          originY: y,
          buildingId,
          buildingOrientation: orientation,
        };
      }
    }
  }
}

// Place a prop/decoration (preserves underlying tile)
function placeProp(
  grid: GridCell[][],
  x: number,
  y: number,
  propId: string
) {
  if (x >= 0 && x < GRID_WIDTH && y >= 0 && y < GRID_HEIGHT) {
    const cell = grid[y][x];
    grid[y][x] = {
      ...cell,
      buildingId: propId,
      isOrigin: true,
      underlyingTileType: cell.type,
      buildingOrientation: Direction.Down,
    };
  }
}

// Place trees along a street
function plantStreetTrees(
  grid: GridCell[][],
  streetY: number,
  isHorizontal: boolean,
  side: "north" | "south" | "east" | "west"
) {
  const trees = ["tree-1", "tree-2", "tree-3", "tree-4"];

  if (isHorizontal) {
    // Horizontal street - trees on north or south side
    const offset = side === "north" ? 0 : 3;
    const treeY = streetY + offset;

    for (let x = 0; x < GRID_WIDTH; x += 2) {
      const cell = grid[treeY]?.[x];
      if (cell && cell.type === TileType.Road && !cell.buildingId) {
        const treeType = trees[Math.floor(Math.random() * trees.length)];
        placeProp(grid, x, treeY, treeType);
      }
    }
  } else {
    // Vertical street - trees on east or west side
    const offset = side === "west" ? 0 : 3;
    const treeX = streetY + offset;

    for (let y = 0; y < GRID_HEIGHT; y += 2) {
      const cell = grid[y]?.[treeX];
      if (cell && cell.type === TileType.Road && !cell.buildingId) {
        const treeType = trees[Math.floor(Math.random() * trees.length)];
        placeProp(grid, treeX, y, treeType);
      }
    }
  }
}

// Create a small park with trees, benches, and fountain
function createPark(grid: GridCell[][], x: number, y: number, w: number, h: number) {
  // Convert area to tiles (park ground)
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < GRID_WIDTH && py < GRID_HEIGHT && grid[py][px].type === TileType.Grass) {
        grid[py][px].type = TileType.Tile;
      }
    }
  }

  // Place fountain in center
  const centerX = x + Math.floor(w / 2) - 1;
  const centerY = y + Math.floor(h / 2) - 1;
  if (canPlaceBuilding(grid, centerX, centerY, 2, 2)) {
    placeBuilding(grid, centerX, centerY, 2, 2, "fountain", Direction.Down);
  }

  // Place benches around edges
  const benches = ["modern-bench", "victorian-bench"];
  const benchPositions = [
    { x: x + 1, y: y + 1 },
    { x: x + w - 2, y: y + 1 },
    { x: x + 1, y: y + h - 2 },
    { x: x + w - 2, y: y + h - 2 },
  ];

  for (const pos of benchPositions) {
    if (pos.x >= 0 && pos.x < GRID_WIDTH && pos.y >= 0 && pos.y < GRID_HEIGHT) {
      const benchType = benches[Math.floor(Math.random() * benches.length)];
      placeProp(grid, pos.x, pos.y, benchType);
    }
  }

  // Place trees scattered in park
  const trees = ["tree-1", "tree-2", "tree-3", "tree-4"];
  const treeCount = Math.floor((w * h) / 8);
  for (let i = 0; i < treeCount; i++) {
    const tx = x + 1 + Math.floor(Math.random() * (w - 2));
    const ty = y + 1 + Math.floor(Math.random() * (h - 2));
    const cell = grid[ty]?.[tx];
    if (cell && cell.type === TileType.Tile && !cell.buildingId) {
      const treeType = trees[Math.floor(Math.random() * trees.length)];
      placeProp(grid, tx, ty, treeType);
    }
  }
}

// Generate a high-fidelity Greenwich Village city
function generateCity(): GridCell[][] {
  const grid = createEmptyGrid();

  // Create street grid
  const STREETS = {
    WEST_9TH_Y: 20,    // Main street
    NORTH_STREET_Y: 32, // 10th St
    SOUTH_STREET_Y: 8,  // 8th St
    FIFTH_AVE_X: 8,     // East avenue
    SIXTH_AVE_X: 36,    // West avenue
  };

  // Horizontal streets
  for (let x = 0; x < GRID_WIDTH; x += ROAD_SEGMENT_SIZE) {
    placeRoadSegment(grid, x, STREETS.SOUTH_STREET_Y, getRoadPattern("horizontal"));
    placeRoadSegment(grid, x, STREETS.WEST_9TH_Y, getRoadPattern("horizontal"));
    placeRoadSegment(grid, x, STREETS.NORTH_STREET_Y, getRoadPattern("horizontal"));
  }

  // Vertical avenues
  for (let y = 0; y < GRID_HEIGHT; y += ROAD_SEGMENT_SIZE) {
    placeRoadSegment(grid, STREETS.FIFTH_AVE_X, y, getRoadPattern("vertical"));
    placeRoadSegment(grid, STREETS.SIXTH_AVE_X, y, getRoadPattern("vertical"));
  }

  // Fix intersections
  const intersections = [
    { x: STREETS.FIFTH_AVE_X, y: STREETS.SOUTH_STREET_Y },
    { x: STREETS.FIFTH_AVE_X, y: STREETS.WEST_9TH_Y },
    { x: STREETS.FIFTH_AVE_X, y: STREETS.NORTH_STREET_Y },
    { x: STREETS.SIXTH_AVE_X, y: STREETS.SOUTH_STREET_Y },
    { x: STREETS.SIXTH_AVE_X, y: STREETS.WEST_9TH_Y },
    { x: STREETS.SIXTH_AVE_X, y: STREETS.NORTH_STREET_Y },
  ];

  for (const intersection of intersections) {
    placeRoadSegment(grid, intersection.x, intersection.y, getRoadPattern("intersection"));
  }

  // COMPREHENSIVE BUILDING PLACEMENT - Using only valid building IDs
  const buildingsToPlace = [
    // ========== WEST 9TH STREET SOUTH SIDE (where Pace Capital is) ==========
    { id: "english-townhouse", x: 12, y: 16, w: 2, h: 2 },
    { id: "alternate-brownstone", x: 14, y: 16, w: 2, h: 2 },
    { id: "pace-capital", x: 16, y: 16, w: 2, h: 2 }, // Featured building
    { id: "romanesque-duplex", x: 18, y: 16, w: 2, h: 2 },
    { id: "limestone-duplex", x: 20, y: 16, w: 2, h: 2 },
    { id: "sf-duplex", x: 22, y: 16, w: 2, h: 2 },
    { id: "sf-yellow-painted-lady", x: 24, y: 16, w: 2, h: 2 },
    { id: "sf-blue-duplex", x: 26, y: 16, w: 2, h: 2 },
    { id: "romanesque-townhouse", x: 28, y: 16, w: 2, h: 3 },
    { id: "romanesque-2", x: 30, y: 16, w: 2, h: 3 },
    { id: "blue-painted-lady", x: 32, y: 16, w: 2, h: 3 },
    { id: "full-house", x: 34, y: 16, w: 2, h: 2 },

    // ========== WEST 9TH STREET NORTH SIDE ==========
    { id: "gothic-apartments", x: 12, y: 25, w: 2, h: 2 },
    { id: "yellow-apartments", x: 14, y: 25, w: 2, h: 2 },
    { id: "leafy-apartments", x: 16, y: 25, w: 2, h: 2 },
    { id: "strange-townhouse", x: 18, y: 25, w: 2, h: 2 },
    { id: "sf-green-victorian-apartments", x: 20, y: 25, w: 2, h: 2 },
    { id: "sf-yellow-victorian-apartments", x: 22, y: 25, w: 2, h: 2 },
    { id: "romanesque-3", x: 24, y: 25, w: 2, h: 3 },
    { id: "sf-victorian", x: 26, y: 25, w: 2, h: 3 },
    { id: "sf-victorian-2", x: 28, y: 25, w: 2, h: 3 },
    { id: "sf-marina-house", x: 30, y: 25, w: 2, h: 2 },
    { id: "hp-house", x: 32, y: 25, w: 2, h: 2 },
    { id: "row-houses", x: 34, y: 25, w: 3, h: 3 },

    // ========== 8TH STREET SOUTH SIDE ==========
    { id: "english-townhouse", x: 12, y: 4, w: 2, h: 2 },
    { id: "alternate-brownstone", x: 14, y: 4, w: 2, h: 2 },
    { id: "romanesque-duplex", x: 16, y: 4, w: 2, h: 2 },
    { id: "limestone-duplex", x: 18, y: 4, w: 2, h: 2 },
    { id: "sf-duplex", x: 20, y: 4, w: 2, h: 2 },
    { id: "romanesque-townhouse", x: 22, y: 4, w: 2, h: 3 },
    { id: "sf-green-apartments", x: 25, y: 4, w: 2, h: 2 },
    { id: "carnegie-mansion", x: 28, y: 4, w: 4, h: 4 },
    { id: "sf-victorian", x: 33, y: 4, w: 2, h: 3 },

    // ========== 8TH STREET NORTH SIDE ==========
    { id: "sf-blue-duplex", x: 12, y: 13, w: 2, h: 2 },
    { id: "sf-yellow-painted-lady", x: 14, y: 13, w: 2, h: 2 },
    { id: "blue-painted-lady", x: 16, y: 13, w: 2, h: 3 },
    { id: "strange-townhouse", x: 18, y: 13, w: 2, h: 2 },
    { id: "gothic-apartments", x: 20, y: 13, w: 2, h: 2 },
    { id: "row-houses", x: 22, y: 13, w: 3, h: 3 },
    { id: "yellow-apartments", x: 25, y: 13, w: 2, h: 2 },
    { id: "sf-victorian-2", x: 27, y: 13, w: 2, h: 3 },
    { id: "leafy-apartments", x: 30, y: 13, w: 2, h: 2 },
    { id: "sf-marina-house", x: 32, y: 13, w: 2, h: 2 },
    { id: "full-house", x: 34, y: 13, w: 2, h: 2 },

    // ========== 10TH STREET SOUTH SIDE ==========
    { id: "schwab-mansion", x: 12, y: 28, w: 4, h: 4 },
    { id: "carnegie-mansion", x: 16, y: 28, w: 4, h: 4 },
    { id: "private-school", x: 20, y: 28, w: 4, h: 4 },
    { id: "romanesque-3", x: 24, y: 28, w: 2, h: 3 },
    { id: "romanesque-2", x: 26, y: 28, w: 2, h: 3 },
    { id: "ease-health", x: 28, y: 28, w: 3, h: 3 },
    { id: "modern-terra-condos", x: 31, y: 28, w: 3, h: 3 },

    // ========== 10TH STREET NORTH SIDE ==========
    { id: "magicpath-office", x: 12, y: 36, w: 6, h: 6 },
    { id: "promptlayer-office", x: 18, y: 36, w: 2, h: 3 },
    { id: "general-intelligence-office", x: 20, y: 36, w: 4, h: 3 },
    { id: "palo-alto-office-center", x: 24, y: 36, w: 6, h: 6 },
    { id: "palo-alto-wide-office", x: 30, y: 36, w: 6, h: 6 },

    // ========== 5TH AVENUE BUILDINGS (East side) ==========
    { id: "medium-apartments", x: 1, y: 1, w: 4, h: 4 },
    { id: "80s-apartment", x: 1, y: 13, w: 3, h: 3 },
    { id: "large-apartments-60s", x: 4, y: 13, w: 4, h: 4 },
    { id: "large-apartments-20s", x: 1, y: 24, w: 7, h: 7 },
    { id: "medium-apartments", x: 1, y: 33, w: 4, h: 4 },
    { id: "80s-apartment", x: 5, y: 33, w: 3, h: 3 },

    // ========== 6TH AVENUE BUILDINGS (West side) ==========
    { id: "bookstore", x: 40, y: 1, w: 4, h: 4 },
    { id: "large-apartments-60s", x: 40, y: 13, w: 8, h: 7 },
    { id: "the-dakota", x: 40, y: 24, w: 8, h: 8 },
    { id: "mushroom-kingdom-castle", x: 40, y: 33, w: 8, h: 8 },

    // ========== LANDMARKS & CIVIC BUILDINGS ==========
    { id: "church", x: 20, y: 1, w: 6, h: 6 },
    { id: "internet-archive", x: 30, y: 1, w: 6, h: 6 },

    // ========== COMMERCIAL/RESTAURANTS (Near 5th Ave) ==========
    { id: "checkers", x: 5, y: 4, w: 2, h: 2 },
    { id: "popeyes", x: 5, y: 16, w: 2, h: 2 },
    { id: "dunkin", x: 5, y: 19, w: 2, h: 2 },
    { id: "martini-bar", x: 5, y: 25, w: 2, h: 2 },
  ];

  // Place all buildings
  for (const building of buildingsToPlace) {
    if (canPlaceBuilding(grid, building.x, building.y, building.w, building.h)) {
      placeBuilding(
        grid,
        building.x,
        building.y,
        building.w,
        building.h,
        building.id,
        Direction.Down
      );
    }
  }

  // ========== PLANT STREET TREES ==========
  // Trees on West 9th Street
  plantStreetTrees(grid, STREETS.WEST_9TH_Y, true, "north");
  plantStreetTrees(grid, STREETS.WEST_9TH_Y, true, "south");

  // Trees on 8th Street
  plantStreetTrees(grid, STREETS.SOUTH_STREET_Y, true, "north");
  plantStreetTrees(grid, STREETS.SOUTH_STREET_Y, true, "south");

  // Trees on 10th Street
  plantStreetTrees(grid, STREETS.NORTH_STREET_Y, true, "north");
  plantStreetTrees(grid, STREETS.NORTH_STREET_Y, true, "south");

  // Trees on 5th Avenue
  plantStreetTrees(grid, STREETS.FIFTH_AVE_X, false, "east");
  plantStreetTrees(grid, STREETS.FIFTH_AVE_X, false, "west");

  // Trees on 6th Avenue
  plantStreetTrees(grid, STREETS.SIXTH_AVE_X, false, "east");
  plantStreetTrees(grid, STREETS.SIXTH_AVE_X, false, "west");

  // ========== ADD BENCHES ALONG STREETS ==========
  const benches = ["modern-bench", "victorian-bench"];
  const benchLocations = [
    { x: 10, y: 20 }, { x: 20, y: 20 }, { x: 30, y: 20 }, // West 9th
    { x: 10, y: 8 }, { x: 20, y: 8 }, { x: 30, y: 8 },   // 8th St
    { x: 10, y: 32 }, { x: 20, y: 32 }, { x: 30, y: 32 }, // 10th St
  ];

  for (const loc of benchLocations) {
    const cell = grid[loc.y]?.[loc.x];
    if (cell && cell.type === TileType.Road && !cell.buildingId) {
      const benchType = benches[Math.floor(Math.random() * benches.length)];
      placeProp(grid, loc.x, loc.y, benchType);
    }
  }

  // ========== CREATE A SMALL PARK ==========
  createPark(grid, 12, 9, 6, 6);

  // ========== ADD SCATTERED DECORATIVE PROPS ==========
  // Statues at key intersections
  const statueLocations = [
    { x: 11, y: 23 },
    { x: 35, y: 23 },
  ];

  for (const loc of statueLocations) {
    if (canPlaceBuilding(grid, loc.x, loc.y, 1, 2)) {
      placeBuilding(grid, loc.x, loc.y, 1, 2, "statue", Direction.Down);
    }
  }

  // Add flower bushes near building entrances
  const flowerLocations = [
    { x: 12, y: 15 }, { x: 14, y: 15 }, { x: 16, y: 15 },
    { x: 18, y: 24 }, { x: 20, y: 24 }, { x: 22, y: 24 },
  ];

  for (const loc of flowerLocations) {
    const cell = grid[loc.y]?.[loc.x];
    if (cell && cell.type === TileType.Grass && !cell.buildingId) {
      placeProp(grid, loc.x, loc.y, "flower-bush");
    }
  }

  return grid;
}

// Generate and save the city
const grid = generateCity();

const saveData = {
  grid,
  characterCount: 12, // More NPCs for a livelier city
  carCount: 8,        // More traffic
  zoom: 1,
  visualSettings: {
    blueness: 0,
    contrast: 1.0,
    saturation: 1.0,
    brightness: 1.0,
  },
  timestamp: Date.now(),
};

console.log(JSON.stringify(saveData));
