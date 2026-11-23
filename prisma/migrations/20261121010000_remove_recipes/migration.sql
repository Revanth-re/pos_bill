-- Recipes / ingredients / stock-movement history are no longer used by Billo.
-- WARNING: this permanently deletes any recipes, ingredients and stock history saved earlier.
DROP TABLE IF EXISTS "recipe_ingredients";
DROP TABLE IF EXISTS "recipes";
DROP TABLE IF EXISTS "inventory_movements";
DROP TABLE IF EXISTS "ingredients";
DROP TYPE IF EXISTS "InventoryMovementType";
