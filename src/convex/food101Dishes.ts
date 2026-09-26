/**
 * Food-101 dataset — the 101 dish categories (https://data.vision.ee.ethz.ch/collections/food-101/).
 *
 * Used by KOVA ONLY as a curated dish-name vocabulary: it powers the AI
 * scanner's suggestion chips and a one-time dish-word hint, improving
 * recognition of everyday meals. It is NEVER used as a nutrition database —
 * every nutrition value in the app comes from Open Food Facts or USDA
 * FoodData Central.
 */
export const FOOD101_DISHES: readonly string[] = [
  "apple pie", "baby back ribs", "baklava", "beef carpaccio", "beef tartare",
  "beet salad", "beignets", "bibimbap", "bread pudding", "breakfast burrito",
  "bruschetta", "caesar salad", "cannoli", "caprese salad", "carrot cake",
  "ceviche", "cheesecake", "cheese plate", "chicken curry", "chicken quesadilla",
  "chicken wings", "chocolate cake", "chocolate mousse", "churros", "clam chowder",
  "club sandwich", "crab cakes", "creme brulee", "croque madame", "cup cakes",
  "deviled eggs", "donuts", "dumplings", "edamame", "eggs benedict",
  "escargots", "falafel", "filet mignon", "fish and chips", "foie gras",
  "french fries", "french onion soup", "french toast", "fried calamari",
  "fried rice", "frozen yogurt", "garlic bread", "gnocchi", "greek salad",
  "grilled cheese sandwich", "grilled salmon", "guacamole", "gyoza", "hamburger",
  "hot and sour soup", "hot dog", "huevos rancheros", "hummus", "ice cream",
  "lasagna", "lobster bisque", "lobster roll sandwich", "macaroni and cheese",
  "macarons", "miso soup", "mussels", "nachos", "omelette", "onion rings",
  "oysters", "pad thai", "pancakes", "panna cotta", "peking duck",
  "pho", "pizza", "pork chop", "poutine", "prime rib",
  "pulled pork sandwich", "ramen", "ravioli", "red velvet cake", "risotto",
  "samosa", "sashimi", "scallops", "seaweed salad", "shrimp and grits",
  "spaghetti bolognese", "spaghetti carbonara", "spring rolls", "steak",
  "strawberry shortcake", "sushi", "tacos", "takoyaki", "tiramisu",
  "tuna tartare", "waffles", "xiao long bao",
] as const;
