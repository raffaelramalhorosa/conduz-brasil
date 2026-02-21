import { useState } from "react";
import { Check, Package, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export type PackageType = 'single' | 'package_5' | 'package_10' | 'package_20';

export interface PackageOption {
  type: PackageType;
  label: string;
  lessons: number;
  price: number;
  pricePerLesson: number;
  discount?: number;
  popular?: boolean;
}

interface PackageSelectorProps {
  singlePrice: number;
  package5Price?: number | null;
  package10Price?: number | null;
  package20Price?: number | null;
  selectedPackage: PackageType;
  onSelect: (pkg: PackageType) => void;
}

export function PackageSelector({
  singlePrice,
  package5Price,
  package10Price,
  package20Price,
  selectedPackage,
  onSelect,
}: PackageSelectorProps) {
  // Calculate packages with discounts
  const packages: PackageOption[] = [
    {
      type: 'single',
      label: 'Aula Avulsa',
      lessons: 1,
      price: singlePrice,
      pricePerLesson: singlePrice,
    },
  ];

  if (package5Price && package5Price > 0) {
    const discount = Math.round((1 - package5Price / (singlePrice * 5)) * 100);
    packages.push({
      type: 'package_5',
      label: 'Pacote 5 Aulas',
      lessons: 5,
      price: package5Price,
      pricePerLesson: package5Price / 5,
      discount: discount > 0 ? discount : undefined,
    });
  }

  if (package10Price && package10Price > 0) {
    const discount = Math.round((1 - package10Price / (singlePrice * 10)) * 100);
    packages.push({
      type: 'package_10',
      label: 'Pacote 10 Aulas',
      lessons: 10,
      price: package10Price,
      pricePerLesson: package10Price / 10,
      discount: discount > 0 ? discount : undefined,
      popular: true,
    });
  }

  if (package20Price && package20Price > 0) {
    const discount = Math.round((1 - package20Price / (singlePrice * 20)) * 100);
    packages.push({
      type: 'package_20',
      label: 'Pacote 20 Aulas',
      lessons: 20,
      price: package20Price,
      pricePerLesson: package20Price / 20,
      discount: discount > 0 ? discount : undefined,
    });
  }

  return (
    <div className="space-y-3">
      {packages.map((pkg) => (
        <label
          key={pkg.type}
          className={cn(
            "relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200",
            "hover:border-primary/50 hover:shadow-md",
            selectedPackage === pkg.type
              ? "border-primary bg-primary/5 shadow-md"
              : "border-border"
          )}
        >
          <input
            type="radio"
            name="package"
            value={pkg.type}
            checked={selectedPackage === pkg.type}
            onChange={() => onSelect(pkg.type)}
            className="sr-only"
          />

          {/* Icon */}
          <div
            className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
              selectedPackage === pkg.type
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}
          >
            {pkg.lessons === 1 ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Package className="w-6 h-6" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-foreground">{pkg.label}</h4>
              {pkg.popular && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-xs">
                Mais popular
              </Badge>
            )}
            {pkg.discount && pkg.discount > 0 && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold text-white shadow-sm ${
                pkg.discount > 30 ? 'bg-red-500' : pkg.discount > 15 ? 'bg-orange-500' : 'bg-green-500'
              }`}>
                  -{pkg.discount}%
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {pkg.lessons === 1
                ? "Ideal para experimentar"
                : `Agende ${pkg.lessons} aulas de uma vez`}
            </p>
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-primary">
              R$ {pkg.price.toFixed(2).replace('.', ',')}
            </p>
            {pkg.lessons > 1 && (
              <p className="text-xs text-muted-foreground">
                R$ {pkg.pricePerLesson.toFixed(2).replace('.', ',')}/aula
              </p>
            )}
          </div>

          {/* Selected indicator */}
          {selectedPackage === pkg.type && (
            <div className="absolute top-2 right-2">
              <Check className="w-5 h-5 text-primary" />
            </div>
          )}
        </label>
      ))}
    </div>
  );
}

export function getPackageLessonsCount(pkg: PackageType): number {
  switch (pkg) {
    case 'single': return 1;
    case 'package_5': return 5;
    case 'package_10': return 10;
    case 'package_20': return 20;
    default: return 1;
  }
}
