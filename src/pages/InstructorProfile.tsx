import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AboutCard from "@/components/profile/AboutCard";
import VehiclesCard from "@/components/profile/VehiclesCard";
import ReviewsCard from "@/components/profile/ReviewsCard";
import LocationCard from "@/components/profile/LocationCard";
import BookingCard from "@/components/profile/BookingCard";
import InfoCard from "@/components/profile/InfoCard";
import { mockInstructorProfile } from "@/data/mockInstructorProfile";

const InstructorProfile = () => {
  // In a real app, you would fetch the instructor data based on the ID from the URL
  const profile = mockInstructorProfile;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Profile Header */}
      <ProfileHeader profile={profile} />

      {/* Main Content */}
      <div className="container-custom py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <AboutCard profile={profile} />
            <VehiclesCard profile={profile} />
            <ReviewsCard profile={profile} />
            <LocationCard profile={profile} />
          </div>

          {/* Right Column - Sticky */}
          <div className="space-y-6">
            <BookingCard profile={profile} />
            <InfoCard profile={profile} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InstructorProfile;
