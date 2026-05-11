import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { apiClient } from "@/lib/api-client";
import { ProductCard } from "@/components/shared/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Loader2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

export default function Products() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState([0, 5000]);

  // Handle debounced search
  useState(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories()
  });
  
  const { data: rawProducts = [], isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, category],
    queryFn: () => apiClient.getProducts({
      search: debouncedSearch || undefined,
      category: category === 'all' ? undefined : category,
    }),
    retry: false,
  });

  const data = Array.isArray(rawProducts) ? rawProducts : [];

  const FilterSidebar = () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-serif font-semibold text-lg mb-4">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="radio" name="category" checked={category === "all"} onChange={() => setCategory("all")} className="accent-primary w-4 h-4" />
            <span className={category === "all" ? "text-primary font-medium" : "text-muted-foreground"}>All Products</span>
          </label>
          {categories?.map(c => (
            <label key={c.id} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name="category" checked={category === c.name} onChange={() => setCategory(c.name)} className="accent-primary w-4 h-4" />
              <span className={category === c.name ? "text-primary font-medium" : "text-muted-foreground"}>{c.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-serif font-semibold text-lg mb-4">Price Range</h3>
        <Slider 
          defaultValue={[0, 5000]} 
          max={5000} 
          step={100} 
          value={priceRange}
          onValueChange={setPriceRange}
          className="my-6"
        />
        <div className="flex items-center justify-between text-sm font-medium">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}+</span>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Page Header */}
      <div className="bg-muted/30 py-12 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-serif font-bold text-foreground">Our Collection</h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Discover our range of premium spices, authentic blends, and curated combo packs.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Desktop Sidebar Filter */}
          <aside className="hidden md:block w-64 shrink-0">
            <FilterSidebar />
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search spices..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card rounded-full"
                />
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="md:hidden flex-1 rounded-full">
                      <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle className="font-serif">Filters</SheetTitle>
                    </SheetHeader>
                    <div className="py-6">
                      <FilterSidebar />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="w-full sm:w-[180px] rounded-full bg-card">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest Arrivals</SelectItem>
                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border">
                <h3 className="text-xl font-serif font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search term.</p>
                <Button variant="outline" className="mt-6" onClick={() => {setSearch(""); setCategory("all"); setPriceRange([0,5000]);}}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.map((product: any) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
