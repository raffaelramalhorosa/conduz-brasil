import { useState, useCallback, useEffect } from "react";
import NavBar from "@/components/NavBar";
import FilterBar from "@/components/marketplace/FilterBar";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import InstructorCard from "@/components/marketplace/InstructorCard";
import InstructorCardSkeleton from "@/components/marketplace/InstructorCardSkeleton";
import MobileInstructorCard from "@/components/marketplace/MobileInstructorCard";
import MobileInstructorSkeleton from "@/components/marketplace/MobileInstructorSkeleton";
import { useInstructorSearch } from "@/hooks/useInstructorSearch";
import { PageTransition } from "@/components/PageTransition";
import { InstallBanner } from "@/components/install-prompt";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, AlertCircle, Users, RefreshCw, SlidersHorizontal, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 5;
const MOBILE_ITEMS_PER_PAGE = 10;

const Marketplace = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileDisplayCount, setMobileDisplayCount] = useState(MOBILE_ITEMS_PER_PAGE);

  const {
    instructors,
    isLoading,
    error,
    totalCount,
    filters,
    updateFilters,
    resetFilters,
    refetch,
  } = useInstructorSearch();

  // Sidebar filters state (synced with hook)
  const sidebarFilters = {
    providerTypes: filters.providerTypes,
    priceRange: filters.priceRange,
    minRating: filters.minRating,
    availability: filters.availability,
    vehicleTypes: filters.vehicleTypes,
    features: filters.features,
  };

  const setSidebarFilters = useCallback((newFilters: typeof sidebarFilters) => {
    setIsTransitioning(true);
    updateFilters(newFilters);
  }, [updateFilters]);

  useEffect(() => {
    if (!isLoading && isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isTransitioning]);

  // Desktop pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedInstructors = instructors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Mobile "load more"
  const mobileInstructors = instructors.slice(0, mobileDisplayCount);
  const hasMoreMobile = mobileDisplayCount < instructors.length;

  const handleLoadMore = () => {
    setMobileDisplayCount((prev) => prev + MOBILE_ITEMS_PER_PAGE);
  };

  // Count active filters for badge
  const activeFilterCount =
    (filters.category !== "all" ? 1 : 0) +
    filters.providerTypes.length +
    (filters.priceRange[0] !== 50 || filters.priceRange[1] !== 200 ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    filters.availability.length +
    filters.vehicleTypes.length +
    filters.features.length;

  // Active filter chips for mobile
  const activeFilterChips: { key: string; label: string }[] = [];
  if (filters.category !== "all") activeFilterChips.push({ key: "category", label: `Cat ${filters.category}` });
  if (filters.providerTypes.length > 0) {
    filters.providerTypes.forEach((pt) =>
      activeFilterChips.push({ key: `pt-${pt}`, label: pt === "autonomous" ? "Autônomo" : "Autoescola" })
    );
  }
  if (filters.priceRange[0] !== 50 || filters.priceRange[1] !== 200) {
    activeFilterChips.push({ key: "price", label: `R$${filters.priceRange[0]}-${filters.priceRange[1]}` });
  }
  if (filters.minRating > 0) activeFilterChips.push({ key: "rating", label: `${filters.minRating}+ ⭐` });

  const removeFilter = (key: string) => {
    if (key === "category") updateFilters({ category: "all" });
    if (key.startsWith("pt-")) {
      const val = key.replace("pt-", "");
      updateFilters({ providerTypes: filters.providerTypes.filter((p) => p !== val) });
    }
    if (key === "price") updateFilters({ priceRange: [50, 200] });
    if (key === "rating") updateFilters({ minRating: 0 });
    setCurrentPage(1);
    setMobileDisplayCount(MOBILE_ITEMS_PER_PAGE);
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
    setIsTransitioning(true);
    setMobileDisplayCount(MOBILE_ITEMS_PER_PAGE);
  };

  const handleClearFilters = () => {
    setIsTransitioning(true);
    resetFilters();
    setCurrentPage(1);
    setMobileDisplayCount(MOBILE_ITEMS_PER_PAGE);
  };

  const handlePageChange = (page: number) => {
    setIsTransitioning(true);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleCategoryChange = (category: string) => {
    setIsTransitioning(true);
    updateFilters({ category });
    setCurrentPage(1);
    setMobileDisplayCount(MOBILE_ITEMS_PER_PAGE);
  };

  const handleSortChange = (sortBy: string) => {
    setIsTransitioning(true);
    updateFilters({ sortBy });
  };

  const handleLocationChange = (location: string) => {
    updateFilters({ location });
    setCurrentPage(1);
    setMobileDisplayCount(MOBILE_ITEMS_PER_PAGE);
  };

  const showSkeletons = isLoading || isTransitioning;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <PageTransition>

      {/* MOBILE: Sticky header with filter button */}
      <div className="md:hidden sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold text-foreground">Instrutores</h1>
            <p className="text-xs text-muted-foreground">{totalCount} encontrados</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMobileFilters(true)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4 mr-1.5" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {activeFilterChips.map((f) => (
              <span
                key={f.key}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
              >
                {f.label}
                <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter(f.key)} />
              </span>
            ))}
            <button onClick={handleClearFilters} className="shrink-0 text-xs text-muted-foreground underline">
              Limpar
            </button>
          </div>
        )}
      </div>

      {/* MOBILE: Filter Sheet */}
      <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
        <SheetContent side="bottom" className="h-[70dvh] sm:h-[85dvh] rounded-t-2xl flex flex-col">
          <SheetHeader className="pb-4 border-b border-border/40">
            <SheetTitle>Filtrar instrutores</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 py-4">
            <FilterSidebar
              isOpen={true}
              onClose={() => setShowMobileFilters(false)}
              filters={sidebarFilters}
              setFilters={setSidebarFilters}
              onApply={() => {
                handleApplyFilters();
                setShowMobileFilters(false);
              }}
              onClear={handleClearFilters}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* DESKTOP: Filter Bar */}
      <div className="hidden md:block">
        <FilterBar
          location={filters.location}
          setLocation={handleLocationChange}
          category={filters.category}
          setCategory={handleCategoryChange}
          sortBy={filters.sortBy}
          setSortBy={handleSortChange}
          onToggleFilters={() => setIsFilterOpen(true)}
        />
      </div>

      {/* Main Content */}
      <div className="container-custom py-4 md:py-8 lg:py-10">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <FilterSidebar
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              filters={sidebarFilters}
              setFilters={setSidebarFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
            />
          </div>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="ghost" size="sm" onClick={refetch} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* DESKTOP: Results Counter */}
            <div className="hidden md:block mb-6">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  Encontre seu Instrutor
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full">
                  <Users className="w-4 h-4" />
                  <span className="font-semibold text-sm">{totalCount}</span>
                </div>
              </div>
              <p className="text-muted-foreground">
                {totalCount === 1 ? "instrutor encontrado" : "instrutores encontrados"}
                {filters.location && (
                  <>
                    {" "}em{" "}
                    <span className="font-medium text-foreground">{filters.location}</span>
                  </>
                )}
                {filters.category !== "all" && (
                  <>
                    {" "}• Categoria{" "}
                    <span className="font-medium text-primary">{filters.category}</span>
                  </>
                )}
              </p>
            </div>

            {/* DESKTOP: Instructor Cards */}
            <div className="hidden md:block">
              <div className="space-y-5">
                <AnimatePresence mode="wait">
                  {showSkeletons ? (
                    <motion.div
                      key="skeletons"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {Array.from({ length: 3 }).map((_, i) => (
                        <InstructorCardSkeleton key={i} />
                      ))}
                    </motion.div>
                  ) : paginatedInstructors.length > 0 ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      {paginatedInstructors.map((instructor, index) => (
                        <motion.div
                          key={instructor.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <InstructorCard
                            instructor={instructor}
                            showDistance={!!filters.location}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed border-border"
                    >
                      <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">
                        Nenhum instrutor encontrado
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto mb-6">
                        Tente ajustar seus filtros ou buscar em outra cidade
                      </p>
                      <Button variant="outline" onClick={handleClearFilters} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Limpar Filtros
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop Pagination */}
              {!showSkeletons && totalPages > 1 && (
                <div className="mt-10 pt-6 border-t border-border">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer hover:bg-muted"
                          }
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => handlePageChange(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            currentPage < totalPages && handlePageChange(currentPage + 1)
                          }
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer hover:bg-muted"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>

            {/* MOBILE: Instructor Cards */}
            <div className="md:hidden">
              {showSkeletons ? (
                <div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <MobileInstructorSkeleton key={i} />
                  ))}
                </div>
              ) : mobileInstructors.length > 0 ? (
                <>
                  <div>
                    {mobileInstructors.map((instructor) => (
                      <MobileInstructorCard key={instructor.id} instructor={instructor} />
                    ))}
                  </div>
                  {/* Load More */}
                  {hasMoreMobile && (
                    <div className="text-center py-6">
                      <Button variant="outline" onClick={handleLoadMore} className="w-full max-w-xs">
                        Carregar mais instrutores
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 px-6">
                  <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-base font-semibold text-foreground mb-2">Nenhum instrutor encontrado</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tente ajustar seus filtros ou buscar em outra cidade
                  </p>
                  <Button variant="outline" size="sm" onClick={handleClearFilters}>
                    Limpar filtros
                  </Button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      </PageTransition>
      <InstallBanner />
    </div>
  );
};

export default Marketplace;
