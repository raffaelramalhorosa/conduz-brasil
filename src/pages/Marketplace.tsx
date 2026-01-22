import { useState, useCallback, useEffect } from "react";
import NavBar from "@/components/NavBar";
import FilterBar from "@/components/marketplace/FilterBar";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import InstructorCard from "@/components/marketplace/InstructorCard";
import InstructorCardSkeleton from "@/components/marketplace/InstructorCardSkeleton";
import { useInstructorSearch } from "@/hooks/useInstructorSearch";
import { PageTransition } from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, AlertCircle, Users, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 5;

const Marketplace = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Handle transition state after loading
  useEffect(() => {
    if (!isLoading && isTransitioning) {
      const timer = setTimeout(() => setIsTransitioning(false), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isTransitioning]);

  // Pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedInstructors = instructors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
    setIsTransitioning(true);
  };

  const handleClearFilters = () => {
    setIsTransitioning(true);
    resetFilters();
    setCurrentPage(1);
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
  };

  const handleSortChange = (sortBy: string) => {
    setIsTransitioning(true);
    updateFilters({ sortBy });
  };

  const handleLocationChange = (location: string) => {
    updateFilters({ location });
    setCurrentPage(1);
  };

  const showSkeletons = isLoading || isTransitioning;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <PageTransition>

      {/* Filter Bar */}
      <FilterBar
        location={filters.location}
        setLocation={handleLocationChange}
        category={filters.category}
        setCategory={handleCategoryChange}
        sortBy={filters.sortBy}
        setSortBy={handleSortChange}
        onToggleFilters={() => setIsFilterOpen(true)}
      />

      {/* Main Content */}
      <div className="container-custom py-8 lg:py-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={sidebarFilters}
            setFilters={setSidebarFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />

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

            {/* Results Counter */}
            <div className="mb-6">
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
                {totalCount === 1 ? 'instrutor encontrado' : 'instrutores encontrados'}
                {filters.location && (
                  <>
                    {" "}em{" "}
                    <span className="font-medium text-foreground">
                      {filters.location}
                    </span>
                  </>
                )}
                {filters.category !== 'all' && (
                  <>
                    {" "}• Categoria{" "}
                    <span className="font-medium text-primary">
                      {filters.category}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Instructor Cards with Animation */}
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
                      {(filters.priceRange[0] !== 50 || filters.priceRange[1] !== 200) 
                        ? "Nenhum instrutor com preço definido nesta faixa. Tente resetar o filtro para ver perfis 'A consultar'."
                        : "Ops! Não encontramos instrutores com esses filtros. Que tal tentar uma busca mais ampla?"}
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleClearFilters}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Limpar Filtros
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pagination */}
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
                          currentPage < totalPages &&
                          handlePageChange(currentPage + 1)
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
          </main>
        </div>
      </div>
      </PageTransition>
    </div>
  );
};

export default Marketplace;
