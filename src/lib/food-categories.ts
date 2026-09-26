/**
 * KOVA food categories — shared between the backend (Open Food Facts tag
 * filters) and the FoodPicker UI.
 *
 * Each category maps to Open Food Facts tag filters (categories_tags /
 * labels_tags) plus optional seed queries that guarantee relevant generic
 * results even when the tag search returns few well-formed products. The
 * backend merges tag results and seed results, so no fake data is ever
 * shipped — everything comes from OFF/USDA at request time.
 */

export type FoodCategory = {
  key: string;
  label: string;
  emoji: string;
  /** Open Food Facts categories_tags prefixes, e.g. "en:chicken". */
  categories?: string[];
  /** Open Food Facts labels_tags, e.g. "en:organic". */
  labels?: string[];
  /** Optional generic-name seed queries for USDA/OFF fallback results. */
  seeds?: string[];
};

export const FOOD_CATEGORIES: readonly FoodCategory[] = [
  { key: "breakfast", label: "Breakfast", emoji: "🥞", categories: ["en:breakfasts", "en:breakfast cereals"], seeds: ["oatmeal", "cereal", "muesli", "granola"] },
  { key: "lunch", label: "Lunch", emoji: "🥪", categories: ["en:sandwiches", "en:salads"], seeds: ["sandwich", "wrap", "salad"] },
  { key: "dinner", label: "Dinner", emoji: "🍽️", categories: ["en:dishes", "en:meals"], seeds: ["stew", "curry", "stir fry"] },
  { key: "snacks", label: "Snacks", emoji: "🍫", categories: ["en:snacks", "en:salty-snacks", "en:sweet snacks"], seeds: ["protein bar", "nuts mix", "rice cakes"] },
  { key: "fruits", label: "Fruits", emoji: "🍎", categories: ["en:fruits"], seeds: ["banana", "apple", "orange", "blueberries"] },
  { key: "vegetables", label: "Vegetables", emoji: "🥦", categories: ["en:vegetables"], seeds: ["broccoli", "spinach", "tomato", "carrot"] },
  { key: "meat", label: "Meat", emoji: "🥩", categories: ["en:meats"], seeds: ["beef steak", "pork chop", "ground beef"] },
  { key: "chicken", label: "Chicken", emoji: "🍗", categories: ["en:chicken", "en:chickens", "en:poultry"], seeds: ["chicken breast", "chicken thigh"] },
  { key: "fish", label: "Fish", emoji: "🐟", categories: ["en:fish", "en:fishes"], seeds: ["salmon", "tuna", "cod"] },
  { key: "seafood", label: "Seafood", emoji: "🦐", categories: ["en:seafood", "en:crustaceans", "en:molluscs"], seeds: ["shrimp", "mussels", "squid"] },
  { key: "eggs", label: "Eggs", emoji: "🥚", categories: ["en:eggs"], seeds: ["eggs", "egg whites", "boiled eggs"] },
  { key: "dairy", label: "Dairy", emoji: "🥛", categories: ["en:dairies", "en:milk", "en:cheeses", "en:yogurts"], seeds: ["greek yogurt", "cottage cheese", "milk", "cheese"] },
  { key: "grains", label: "Grains", emoji: "🌾", categories: ["en:grains", "en:cereals and potatoes", "en:cereals"], seeds: ["quinoa", "bulgur", "barley", "couscous"] },
  { key: "rice", label: "Rice", emoji: "🍚", categories: ["en:rices", "en:rice"], seeds: ["white rice", "brown rice", "basmati rice"] },
  { key: "pasta", label: "Pasta", emoji: "🍝", categories: ["en:pastas"], seeds: ["spaghetti", "penne", "macaroni"] },
  { key: "bread", label: "Bread", emoji: "🍞", categories: ["en:breads"], seeds: ["whole wheat bread", "baguette", "rye bread"] },
  { key: "potatoes", label: "Potatoes", emoji: "🥔", categories: ["en:potatoes"], seeds: ["potatoes", "sweet potato", "mashed potatoes"] },
  { key: "oats", label: "Oats", emoji: "🥣", categories: ["en:oats", "en:flakes"], seeds: ["oatmeal", "rolled oats", "oat flakes"] },
  { key: "nuts", label: "Nuts", emoji: "🥜", categories: ["en:nuts"], seeds: ["almonds", "walnuts", "peanut butter"] },
  { key: "seeds", label: "Seeds", emoji: "🌻", categories: ["en:seeds"], seeds: ["chia seeds", "flax seeds", "pumpkin seeds"] },
  { key: "legumes", label: "Legumes", emoji: "🫘", categories: ["en:legumes"], seeds: ["lentils", "chickpeas", "black beans"] },
  { key: "sauces", label: "Sauces", emoji: "🥫", categories: ["en:sauces"], seeds: ["tomato sauce", "pesto", "mayonnaise"] },
  { key: "drinks", label: "Drinks", emoji: "🥤", categories: ["en:beverages"], seeds: ["orange juice", "protein shake", "cola"] },
  { key: "desserts", label: "Desserts", emoji: "🍰", categories: ["en:desserts", "en:frozen desserts"], seeds: ["ice cream", "chocolate", "cookies"] },
  { key: "fast-food", label: "Fast food", emoji: "🍔", categories: ["en:fast foods"], seeds: ["burger", "pizza", "fries", "chicken nuggets"] },
  { key: "belgian", label: "Belgian & European", emoji: "🇧🇪", categories: ["en:belgian", "en:waffles", "en:belgian chocolates"], seeds: ["waffles", "speculoos", "stroopwafel", "frites"] },
  { key: "international", label: "International", emoji: "🌍", seeds: ["sushi", "pad thai", "falafel", "hummus", "ramen", "tacos", "biryani"] },
  { key: "fitness", label: "Gym & fitness", emoji: "💪", categories: ["en:protein bars", "en:protein powders"], seeds: ["protein powder", "protein bar", "protein shake", "whey"] },
  { key: "dishes", label: "Complete dishes", emoji: "🍲", categories: ["en:dishes", "en:meals and courses"], seeds: ["chicken and rice", "spaghetti bolognese", "lasagna", "chili con carne", "stir fried noodles"] },
] as const;

export function findCategory(key: string | null): FoodCategory | null {
  if (!key) return null;
  return FOOD_CATEGORIES.find((category) => category.key === key) ?? null;
}
