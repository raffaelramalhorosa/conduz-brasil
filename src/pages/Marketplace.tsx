import { useState, useCallback } from "react";
import Header from "@/components/Header";
import FilterBar from "@/components/marketplace/FilterBar";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import InstructorCard from "@/components/marketplace/InstructorCard";
import InstructorCardSkeleton from "@/components/marketplace/InstructorCardSkeleton";
import { useInstructorSearch } from "@/hooks/useInstructorSearch";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ITEMS_PER_PAGE = 5;

const Marketplace = () => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    instructors,
    isLoading,
    error,
    totalCount,
    filters,
    updateFilters,
    resetFilters,
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
    updateFilters(newFilters);
  }, [updateFilters]);

  // Pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const paginatedInstructors = instructors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    resetFilters();
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCategoryChange = (category: string) => {
    updateFilters({ category });
    setCurrentPage(1);
  };

  const handleSortChange = (sortBy: string) => {
    updateFilters({ sortBy });
  };

  const handleLocationChange = (location: string) => {
    updateFilters({ location });
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
      <div className="container-custom py-6">
        <div className="flex gap-6">
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
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Results Counter */}
            <div className="mb-4">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {totalCount}
                </span>{" "}
                instrutores encontrados
                {filters.location && (
                  <>
                    {" "}em{" "}
                    <span className="font-medium text-foreground">
                      {filters.location}
                    </span>
                  </>
                )}
              </p>
            </div>

            {/* Instructor Cards */}
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <InstructorCardSkeleton key={i} />
                ))
              ) : paginatedInstructors.length > 0 ? (
                paginatedInstructors.map((instructor) => (
                  <InstructorCard 
                    key={instructor.id} 
                    instructor={instructor} 
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-muted/30 rounded-lg">
                  <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground">
                    Nenhum instrutor encontrado
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Tente ajustar os filtros ou buscar em outra região.
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
              <div className="mt-8">
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
                            : "cursor-pointer"
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
                            : "cursor-pointer"
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
    </div>
  );
};

export default Marketplace;
