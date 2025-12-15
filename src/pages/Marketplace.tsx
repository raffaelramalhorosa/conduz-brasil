import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import FilterBar from "@/components/marketplace/FilterBar";
import FilterSidebar from "@/components/marketplace/FilterSidebar";
import InstructorCard from "@/components/marketplace/InstructorCard";
import InstructorCardSkeleton from "@/components/marketplace/InstructorCardSkeleton";
import type { Instructor } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Search } from "lucide-react";

const ITEMS_PER_PAGE = 5;

const Marketplace = () => {
  const [location, setLocation] = useState("São Paulo, SP");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [filters, setFilters] = useState({
    providerTypes: [] as string[],
    priceRange: [50, 200] as [number, number],
    minRating: 0,
    availability: [] as string[],
    vehicleTypes: [] as string[],
    features: [] as string[],
  });

  // Fetch instructors from database
  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('instructor_profiles')
        .select(`
          id,
          user_id,
          bio,
          is_driving_school,
          average_rating,
          total_reviews,
          verification_status,
          city,
          neighborhood,
          latitude,
          longitude,
          profiles!inner (
            full_name,
            avatar_url
          ),
          vehicles (
            license_category
          ),
          pricing (
            single_class_price
          )
        `)
        .eq('is_active', true)
        .eq('verification_status', 'approved');

      if (error) throw error;

      if (data) {
        const mappedInstructors: Instructor[] = data.map((instructor: any) => {
          const categories = [...new Set(instructor.vehicles?.map((v: any) => v.license_category) || [])];
          const prices = instructor.pricing?.map((p: any) => p.single_class_price) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : 100;

          return {
            id: instructor.id,
            name: instructor.profiles?.full_name || 'Instrutor',
            photo: instructor.profiles?.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
            isVerified: instructor.verification_status === 'approved',
            type: instructor.is_driving_school ? 'school' as const : 'autonomous' as const,
            rating: instructor.average_rating || 0,
            totalReviews: instructor.total_reviews || 0,
            distance: 0, // Would need geolocation
            categories: categories as string[],
            description: instructor.bio || 'Instrutor profissional credenciado.',
            tags: [],
            pricePerLesson: minPrice,
            minPrice: minPrice,
          };
        });

        setInstructors(mappedInstructors);
      }
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort instructors
  const filteredInstructors = useMemo(() => {
    let result = [...instructors];

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
  }, [instructors, category, sortBy, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredInstructors.length / ITEMS_PER_PAGE);
  const paginatedInstructors = filteredInstructors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setIsFilterOpen(false);
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
            <div className="mb-4">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {filteredInstructors.length}
                </span>{" "}
                instrutores encontrados em{" "}
                <span className="font-medium text-foreground">{location}</span>
              </p>
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
