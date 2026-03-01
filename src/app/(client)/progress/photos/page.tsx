"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ArrowLeftRight,
  ZoomIn,
  Download,
  X,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface PhotoSet {
  id: string;
  week: number;
  date: string;
  photos: {
    front: string | null;
    side: string | null;
    back: string | null;
  };
}

type PhotoAngle = "front" | "side" | "back";

export default function ProgressPhotosPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [photoSets, setPhotoSets] = useState<PhotoSet[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>("front");
  const [leftWeekIndex, setLeftWeekIndex] = useState(0);
  const [rightWeekIndex, setRightWeekIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhotos() {
      const supabase = createClient();
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Get client info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: client } = await (supabase as any)
          .from("clients")
          .select("id, start_date")
          .eq("user_id", user.id)
          .single();

        if (!client) {
          setIsLoading(false);
          return;
        }

        // Get all progress photos grouped by weekly_checkin_id or date
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: photosData } = await (supabase as any)
          .from("progress_photos")
          .select("id, photo_date, photo_type, weekly_checkin_id")
          .eq("client_id", client.id)
          .order("photo_date", { ascending: true });

        if (!photosData || photosData.length === 0) {
          setIsLoading(false);
          return;
        }

        // Group photos by date
        const photosByDate = new Map<string, { front: string | null; side: string | null; back: string | null }>();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        photosData.forEach((photo: any) => {
          const dateKey = photo.photo_date;
          if (!photosByDate.has(dateKey)) {
            photosByDate.set(dateKey, { front: null, side: null, back: null });
          }
          const photos = photosByDate.get(dateKey)!;
          photos[photo.photo_type as PhotoAngle] = photo.id;
        });

        // Convert to array with week numbers
        const startDate = new Date(client.start_date || photosData[0].photo_date);
        const sets: PhotoSet[] = [];

        photosByDate.forEach((photos, date) => {
          const photoDate = new Date(date);
          const weeksSinceStart = Math.ceil((photoDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          sets.push({
            id: date,
            week: Math.max(1, weeksSinceStart),
            date,
            photos,
          });
        });

        setPhotoSets(sets);
        if (sets.length > 0) {
          setLeftWeekIndex(0);
          setRightWeekIndex(sets.length - 1);
        }
      } catch (error) {
        console.error("Error loading photos:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPhotos();
  }, []);

  const leftPhoto = photoSets[leftWeekIndex] || null;
  const rightPhoto = photoSets[rightWeekIndex] || null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const openLightbox = (imageUrl: string) => {
    setLightboxImage(imageUrl);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
      </div>
    );
  }

  if (photoSets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Progress
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Progress Photos
          </h1>
        </div>
        <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-12 text-center">
          <Camera className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 mb-2">
            No Progress Photos Yet
          </h2>
          <p className="text-stone-500 mb-6">
            Start your weekly check-ins to track your visual progress
          </p>
          <Link
            href="/check-in/weekly"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Add Your First Photos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-700 mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Progress
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">
            Progress Photos
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Compare your transformation over time
          </p>
        </div>
        <Link
          href="/check-in/weekly"
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
        >
          <Camera className="w-4 h-4" />
          Add New Photos
        </Link>
      </div>

      {/* Angle Selector */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-4">
        <div className="flex items-center justify-center gap-2">
          {(["front", "side", "back"] as PhotoAngle[]).map((angle) => (
            <button
              key={angle}
              onClick={() => setSelectedAngle(angle)}
              className={`px-6 py-2 rounded-lg font-medium capitalize transition-colors ${
                selectedAngle === angle
                  ? "bg-amber-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700"
              }`}
            >
              {angle} View
            </button>
          ))}
        </div>
      </div>

      {/* Comparison View */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          <ArrowLeftRight className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-stone-600 dark:text-stone-400">
            Side-by-Side Comparison
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Photo (Before) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  Week {leftPhoto.week}
                </p>
                <p className="text-xs text-stone-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(leftPhoto.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeftWeekIndex((prev) => Math.max(0, prev - 1))}
                  disabled={leftWeekIndex === 0}
                  className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setLeftWeekIndex((prev) =>
                      Math.min(photoSets.length - 1, prev + 1)
                    )
                  }
                  disabled={leftWeekIndex === photoSets.length - 1}
                  className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              className="aspect-[3/4] bg-stone-200 dark:bg-stone-700 rounded-xl overflow-hidden cursor-pointer relative group"
              onClick={() => leftPhoto.photos[selectedAngle] && openLightbox(leftPhoto.photos[selectedAngle]!)}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-stone-400" />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                Week {leftPhoto.week}
              </span>
            </div>
          </div>

          {/* Right Photo (After/Current) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  Week {rightPhoto.week}
                </p>
                <p className="text-xs text-stone-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(rightPhoto.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRightWeekIndex((prev) => Math.max(0, prev - 1))}
                  disabled={rightWeekIndex === 0}
                  className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() =>
                    setRightWeekIndex((prev) =>
                      Math.min(photoSets.length - 1, prev + 1)
                    )
                  }
                  disabled={rightWeekIndex === photoSets.length - 1}
                  className="p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-30"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div
              className="aspect-[3/4] bg-stone-200 dark:bg-stone-700 rounded-xl overflow-hidden cursor-pointer relative group"
              onClick={() => rightPhoto.photos[selectedAngle] && openLightbox(rightPhoto.photos[selectedAngle]!)}
            >
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-stone-400" />
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
                Week {rightPhoto.week}
              </span>
            </div>
          </div>
        </div>

        {/* Comparison Summary */}
        {leftPhoto && rightPhoto && (
          <div className="mt-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 text-center">
              <strong>{rightPhoto.week - leftPhoto.week} weeks</strong> of progress between these photos
            </p>
          </div>
        )}
      </div>

      {/* Timeline Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-6">
        <h2 className="font-semibold text-stone-800 dark:text-stone-100 mb-4">
          All Progress Photos
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {photoSets.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => {
                if (index < rightWeekIndex) {
                  setLeftWeekIndex(index);
                } else {
                  setRightWeekIndex(index);
                }
              }}
              className={`aspect-square rounded-lg overflow-hidden relative border-2 transition-colors ${
                index === leftWeekIndex || index === rightWeekIndex
                  ? "border-amber-500"
                  : "border-transparent hover:border-stone-300 dark:hover:border-stone-600"
              }`}
            >
              <div className="w-full h-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center">
                <Camera className="w-6 h-6 text-stone-400" />
              </div>
              <span className="absolute bottom-1 left-1 right-1 text-center text-xs bg-black/50 text-white rounded px-1">
                W{photo.week}
              </span>
              {(index === leftWeekIndex || index === rightWeekIndex) && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-amber-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500 text-center mt-4">
          Click on any photo to use it in the comparison view
        </p>
      </div>

      {/* Lightbox */}
      {lightboxOpen && lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <button className="absolute bottom-4 right-4 p-2 text-white hover:bg-white/20 rounded-lg flex items-center gap-2">
            <Download className="w-5 h-5" />
            Download
          </button>
          <div className="max-w-2xl max-h-[80vh] bg-stone-800 rounded-xl flex items-center justify-center p-8">
            <Camera className="w-24 h-24 text-stone-500" />
          </div>
        </div>
      )}
    </div>
  );
}
