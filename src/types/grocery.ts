export type { GroceryItem, NewGroceryItem } from "../lib/server/db/schema";

export type GroceryCategory =
  | "Produce"
  | "Dairy & Eggs"
  | "Meat & Seafood"
  | "Bakery"
  | "Pantry"
  | "Frozen"
  | "Beverages"
  | "Snacks"
  | "Household"
  | "Other";

export type GroceryPriority = "low" | "medium" | "high";
