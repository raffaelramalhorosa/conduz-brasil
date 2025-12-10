import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import Header from "@/components/Header";
import FilterBar from "@/components/marketplace/FilterBar";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import InstructorCard from "@/components/marketplace/InstructorCard";
import InstructorCardSkeleton from "@/components/marketplace/InstructorCardSkeleton";
import { mockInstructors } from "@/data/mockInstructors";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 5;

const Marketplace = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("São Paulo, SP");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [filters, setFilters] = useState({
    providerTypes: [] as string[],
    priceRange: [50, 200] as [number, number],
    minRating: 0,
    availability: [] as string[],
    vehicleTypes: [] as string[],
    features: [] as string[],
  });

  // Filter and sort instructors
  const filteredInstructors = useMemo(() => {
    let result = [...mockInstructors];

    // Filter by category
    if (category !== "all") {
      result = result.filter((inst) => inst.categories.includes(category));
    }

    // Filter by provider type
    if (filters.providerTypes.length > 0) {
      result = result.filter((inst) =>
        filters.providerTypes.includes(inst.type)
      );
    }

    // Filter by price range
    result = result.filter(
      (inst) =>
        inst.pricePerLesson >= filters.priceRange[0] &&
        inst.pricePerLesson <= filters.priceRange[1]
    );

    // Filter by minimum rating
    if (filters.minRating > 0) {
      result = result.filter((inst) => inst.rating >= filters.minRating);
    }

    // Sort
    switch (sortBy) {
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "price_low":
        result.sort((a, b) => a.pricePerLesson - b.pricePerLesson);
        break;
      case "price_high":
        result.sort((a, b) => b.pricePerLesson - a.pricePerLesson);
        break;
      case "distance":
        result.sort((a, b) => a.distance - b.distance);
        break;
    }

    return result;
  }, [category, sortBy, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE);
  const paginatedInstructors = filteredInstructors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilters = () => {
    setIsLoading(true);
    setCurrentPage(1);
    setIsFilterOpen(false);
    // Simulate loading
    setTimeout(() => setIsLoading(false), 500);
  };

  const handleClearFilters = () => {
    setFilters({
      providerTypes: [],
      priceRange: [50, 200],
      minRating: 0,
      availability: [],
      vehicleTypes: [],
      features: [],
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Filter Bar */}
      <FilterBar
        location={location}
        setLocation={setLocation}
        category={category}
        setCategory={setCategory}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onToggleFilters={() => setIsFilterOpen(true)}
      />

      {/* Main Content */}
      <div className="container-custom py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <FilterSidebar
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
          />

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            {/* Results Counter */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {filteredInstructors.length}
                </span>{" "}
                instrutores encontrados em{" "}
                <span className="font-medium text-foreground">{location}</span>
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/mapa-instrutores')}
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                Ver no Mapa
              </Button>
            </div>

            {/* Instructor Cards */}
            <div className="space-y-4">
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 3 }).map((_, i) => (
                  <InstructorCardSkeleton key={i} />
                ))
              ) : paginatedInstructors.length > 0 ? (
                paginatedInstructors.map((instructor) => (
                  <InstructorCard key={instructor.id} instructor={instructor} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Nenhum instrutor encontrado com os filtros selecionados.
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

                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i + 1}>
                        <PaginationLink
                          onClick={() => handlePageChange(i + 1)}
                          isActive={currentPage === i + 1}
                          className="cursor-pointer"
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

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
