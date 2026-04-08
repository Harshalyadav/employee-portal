import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns";
import type { RawMaterial, ConversionFactor } from "@/types/raw-material.type";
import type { RecipeIngredient, Nutrition } from "@/types/recipe.type";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatCurrency(amount: number, locale: string, currency: string) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function currencySymbol(currency?: string): string {
  if (!currency) return "";
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    });
    const parts = formatter.formatToParts(0);
    const symbolPart = parts.find((part) => part.type === "currency");
    return symbolPart?.value ? `${symbolPart.value}` : `${currency} `;
  } catch {
    return `${currency} `;
  }
}


/**
 * Formats a given date to dd-mm-yyyy format
 * @param date - The input date (Date object, string, or number)
 * @returns formatted date string (e.g. "12-11-2025")
 */
export function formatDate(date: Date | string | number): string {
  if (!date) return "";
  try {
    return format(new Date(date), "dd MMM, yyyy");
  } catch (error) {
    console.error("Invalid date provided to formatDate:", error);
    return "";
  }
}

export function formatDateTime(date: Date | string | number): string {
  if (!date) return "";
  try {
    return format(new Date(date), "dd MMM, yyyy HH:mm");
  } catch (error) {
    console.error("Invalid date provided to formatDateTime:", error);
    return "";
  }
}


export const isValidSrc = (src?: unknown): src is string => {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (!s) return false;
  // data URI for images
  if (/^data:image\/[a-zA-Z+.-]+;base64,/.test(s)) return true;
  // absolute or protocol-relative URLs (https:, http:, //)
  if (/^(https?:)?\/\//.test(s)) {
    try {
      new URL(s.startsWith("//") ? `https:${s}` : s);
      return true;
    } catch {
      return false;
    }
  }
  // root-relative or relative paths
  if (/^(\/|\.\/|\.\.\/)/.test(s)) return true;
  return false;
};


/**
 * Text formatting options
 */
export type TextFormatType =
  | "uppercase"
  | "lowercase"
  | "capitalize"
  | "capitalizeWords"
  | "camelCase"
  | "pascalCase"
  | "snakeCase"
  | "kebabCase"
  | "sentence"
  | "paragraph";

/**
 * Formats text according to the specified format type
 * @param text - The input text to format
 * @param format - The format type to apply
 * @returns formatted text string
 * 
 * @example
 * formatText("hello world", "uppercase") // "HELLO WORLD"
 * formatText("hello world", "camelCase") // "helloWorld"
 * formatText("hello world", "pascalCase") // "HelloWorld"
 * formatText("hello_world", "kebabCase") // "hello-world"
 */
export function formatText(text: string, format: TextFormatType): string {
  if (!text) return "";

  switch (format) {
    case "uppercase":
      return text.toUpperCase();

    case "lowercase":
      return text.toLowerCase();

    case "capitalize":
      // Capitalize only the first letter of the entire text
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    case "capitalizeWords":
      // Capitalize the first letter of each word
      return text
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    case "camelCase":
      // Convert to camelCase: "hello world" -> "helloWorld"
      return text
        .trim()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[A-Z]/, char => char.toLowerCase());

    case "pascalCase":
      // Convert to PascalCase: "hello world" -> "HelloWorld"
      return text
        .trim()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^[a-z]/, char => char.toUpperCase());

    case "snakeCase":
      // Convert to snake_case: "hello world" -> "hello_world"
      return text
        .trim()
        .replace(/([A-Z])/g, "_$1")
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toLowerCase();

    case "kebabCase":
      // Convert to kebab-case: "hello world" -> "hello-world"
      return text
        .trim()
        .replace(/([A-Z])/g, "-$1")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();

    case "sentence":
      // Format as a sentence: capitalize first letter, lowercase rest
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

    case "paragraph":
      // Format as paragraph: capitalize first letter of each sentence
      return text
        .split(/([.!?]+\s+)/)
        .map((segment, index) => {
          if (index % 2 === 0 && segment.trim()) {
            return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase();
          }
          return segment;
        })
        .join("");

    default:
      return text;
  }
}




export function generateFranchiseCode(
  number: number,
  prefix: string = "FR",
  padLength: number = 4
): string {
  const paddedNumber = number.toString().padStart(padLength, "0");
  return `${prefix}-${paddedNumber}`;
}

// ----------------------
// Nutrition Calculations
// ----------------------

// Normalize units to a consistent set
export function normalizeUnit(u?: string | null): string {
  if (!u) return "";
  const unit = String(u).trim().toLowerCase();
  switch (unit) {
    case "grams":
    case "gram":
    case "g":
      return "g";
    case "kilogram":
    case "kilograms":
    case "kg":
      return "kg";
    case "milliliter":
    case "milliliters":
    case "ml":
      return "ml";
    case "liter":
    case "litre":
    case "liters":
    case "litres":
    case "l":
      return "l";
    case "piece":
    case "pieces":
    case "pc":
    case "pcs":
      return "piece";
    case "teaspoon":
    case "tsp":
      return "teaspoon";
    case "tablespoon":
    case "tbsp":
      return "tablespoon";
    default:
      return unit; // return as-is for any custom unit
  }
}

type Graph = Record<string, Array<{ to: string; factor: number }>>;

function addEdge(graph: Graph, from: string, to: string, factor: number) {
  if (!graph[from]) graph[from] = [];
  graph[from].push({ to, factor });
}

function buildDefaultUnitGraph(): Graph {
  const g: Graph = {};
  // Mass
  addEdge(g, "kg", "g", 1000);
  addEdge(g, "g", "kg", 1 / 1000);
  // Volume
  addEdge(g, "l", "ml", 1000);
  addEdge(g, "ml", "l", 1 / 1000);
  // Spoons (typical culinary measures)
  addEdge(g, "teaspoon", "ml", 5);
  addEdge(g, "ml", "teaspoon", 1 / 5);
  addEdge(g, "tablespoon", "ml", 15);
  addEdge(g, "ml", "tablespoon", 1 / 15);
  // Piece plural mapping is handled via normalizeUnit; keep identity
  addEdge(g, "piece", "piece", 1);
  // Identity edges for common units
  ["g", "kg", "ml", "l", "teaspoon", "tablespoon"].forEach((u) =>
    addEdge(g, u, u, 1)
  );
  return g;
}

function buildMaterialGraph(conversions?: ConversionFactor[] | any): Graph {
  const graph = buildDefaultUnitGraph();
  if (!Array.isArray(conversions) || conversions.length === 0) return graph;
  for (const cf of conversions as ConversionFactor[]) {
    const from = normalizeUnit(cf.fromUnit);
    const to = normalizeUnit(cf.toUnit);
    const factor = Number(cf.factor);
    if (!from || !to || !isFinite(factor) || factor <= 0) continue;
    addEdge(graph, from, to, factor);
    // also add reverse edge
    addEdge(graph, to, from, 1 / factor);
  }
  return graph;
}

function findConversionFactor(graph: Graph, fromUnit: string, toUnit: string): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);
  if (!from || !to) return null;
  if (from === to) return 1;
  const visited = new Set<string>();
  const queue: Array<{ unit: string; factor: number }> = [{ unit: from, factor: 1 }];

  while (queue.length) {
    const { unit, factor } = queue.shift()!;
    if (unit === to) return factor;
    if (visited.has(unit)) continue;
    visited.add(unit);
    const edges = graph[unit] || [];
    for (const e of edges) {
      if (!visited.has(e.to)) {
        queue.push({ unit: e.to, factor: factor * e.factor });
      }
    }
  }
  return null;
}

function safeNumber(n: unknown): number | null {
  const x = typeof n === "number" ? n : Number(n);
  return isFinite(x) ? x : null;
}

function round(n: number | null | undefined, digits = 2): number | undefined {
  if (n === null || n === undefined || !isFinite(n)) return undefined;
  const p = Math.pow(10, digits);
  return Math.round(n * p) / p;
}

export function convertAmount(
  material: Pick<RawMaterial, "conversionFactors">,
  amount: number,
  fromUnit: string,
  toUnit: string
): number | null {
  const graph = buildMaterialGraph(material.conversionFactors);
  const factor = findConversionFactor(graph, fromUnit, toUnit);
  if (factor === null) return null;
  return amount * factor;
}

export function computeNutritionFromIngredients(
  ingredients: RecipeIngredient[] | undefined,
  materials: Array<RawMaterial>
): Nutrition {
  const totals: Nutrition = {
    calories: 0,
    protein: 0,
    carbohydrate: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    vitamins: {},
    minerals: {},
  };

  if (!ingredients || ingredients.length === 0 || !materials?.length) {
    return totals;
  }

  const byId = new Map<string, RawMaterial>();
  for (const m of materials) {
    const key = (m as any)._id || (m as any).id;
    if (key && !byId.has(key)) byId.set(String(key), m);
  }

  for (const ing of ingredients) {
    const mat = byId.get(ing.materialId);
    if (!mat) continue;
    // Determine reference portion for this raw material
    const portionSize = safeNumber(mat.portionSize) ?? 1;
    const portionUnit = normalizeUnit((mat as any).portionUnit || (mat as any).baseUnit || "");
    if (!portionUnit) continue;

    const qty = safeNumber(ing.quantity) ?? 0;
    const fromUnit = normalizeUnit(ing.unit);
    if (qty <= 0 || !fromUnit) continue;

    const converted = convertAmount(mat, qty, fromUnit, portionUnit);
    if (converted === null) continue;

    const scale = portionSize ? converted / portionSize : 0;
    const n = mat.nutrition || {};
    // primary macros
    totals.calories = (totals.calories || 0) + (safeNumber(n.calories) || 0) * scale;
    totals.protein = (totals.protein || 0) + (safeNumber(n.protein) || 0) * scale;
    totals.carbohydrate = (totals.carbohydrate || 0) + (safeNumber(n.carbohydrate) || 0) * scale;
    totals.fat = (totals.fat || 0) + (safeNumber(n.fat) || 0) * scale;
    totals.fiber = (totals.fiber || 0) + (safeNumber(n.fiber) || 0) * scale;
    totals.sugar = (totals.sugar || 0) + (safeNumber(n.sugar) || 0) * scale;
    totals.sodium = (totals.sodium || 0) + (safeNumber(n.sodium) || 0) * scale;

    // vitamins
    const v = n.vitamins || {};
    totals.vitamins = totals.vitamins || {};
    (totals.vitamins as any).vitaminA = ((totals.vitamins as any).vitaminA || 0) + (safeNumber((v as any).vitaminA) || 0) * scale;
    (totals.vitamins as any).vitaminB = ((totals.vitamins as any).vitaminB || 0) + (safeNumber((v as any).vitaminB) || 0) * scale;
    (totals.vitamins as any).vitaminC = ((totals.vitamins as any).vitaminC || 0) + (safeNumber((v as any).vitaminC) || 0) * scale;
    (totals.vitamins as any).vitaminD = ((totals.vitamins as any).vitaminD || 0) + (safeNumber((v as any).vitaminD) || 0) * scale;
    (totals.vitamins as any).vitaminE = ((totals.vitamins as any).vitaminE || 0) + (safeNumber((v as any).vitaminE) || 0) * scale;
    (totals.vitamins as any).vitaminK = ((totals.vitamins as any).vitaminK || 0) + (safeNumber((v as any).vitaminK) || 0) * scale;

    // minerals
    const mnr = n.minerals || {};
    totals.minerals = totals.minerals || {};
    (totals.minerals as any).calcium = ((totals.minerals as any).calcium || 0) + (safeNumber((mnr as any).calcium) || 0) * scale;
    (totals.minerals as any).iron = ((totals.minerals as any).iron || 0) + (safeNumber((mnr as any).iron) || 0) * scale;
    (totals.minerals as any).magnesium = ((totals.minerals as any).magnesium || 0) + (safeNumber((mnr as any).magnesium) || 0) * scale;
    (totals.minerals as any).potassium = ((totals.minerals as any).potassium || 0) + (safeNumber((mnr as any).potassium) || 0) * scale;
    (totals.minerals as any).zinc = ((totals.minerals as any).zinc || 0) + (safeNumber((mnr as any).zinc) || 0) * scale;
  }

  // Round to sensible precision
  const rounded: Nutrition = {
    calories: round(totals.calories),
    protein: round(totals.protein),
    carbohydrate: round(totals.carbohydrate),
    fat: round(totals.fat),
    fiber: round(totals.fiber),
    sugar: round(totals.sugar),
    sodium: round(totals.sodium),
    vitamins: {
      vitaminA: round((totals.vitamins as any)?.vitaminA),
      vitaminB: round((totals.vitamins as any)?.vitaminB),
      vitaminC: round((totals.vitamins as any)?.vitaminC),
      vitaminD: round((totals.vitamins as any)?.vitaminD),
      vitaminE: round((totals.vitamins as any)?.vitaminE),
      vitaminK: round((totals.vitamins as any)?.vitaminK),
    },
    minerals: {
      calcium: round((totals.minerals as any)?.calcium),
      iron: round((totals.minerals as any)?.iron),
      magnesium: round((totals.minerals as any)?.magnesium),
      potassium: round((totals.minerals as any)?.potassium),
      zinc: round((totals.minerals as any)?.zinc),
    },
  };
  return rounded;
}

