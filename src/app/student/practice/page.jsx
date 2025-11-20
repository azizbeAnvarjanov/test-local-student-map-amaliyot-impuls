"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getDistance } from "geolib";
import { createClient } from "@/lib/client";

// shadcn UI
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function PracticePage() {
  const supabase = createClient();

  const [sites, setSites] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);

  const student_id = "014e065e-6bce-4c80-944e-3a3367efa840";

  // GPS + bazalarni yuklash
  useEffect(() => {
    supabase
      .from("intern_sites")
      .select("*")
      .then((res) => setSites(res.data || []));

    navigator.geolocation.watchPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);

        if (selectedSite) {
          setDistance(
            getDistance(
              { latitude: loc.lat, longitude: loc.lng },
              { latitude: selectedSite.lat, longitude: selectedSite.lng }
            )
          );
        }
      },
      (err) => console.log("GPS ERROR:", err),
      { enableHighAccuracy: true }
    );
  }, [selectedSite]);

  // 🔄 Masofani qayta hisoblash
  const refreshDistance = () => {
    if (!userLocation || !selectedSite) return;

    const updated = getDistance(
      { latitude: userLocation.lat, longitude: userLocation.lng },
      { latitude: selectedSite.lat, longitude: selectedSite.lng }
    );

    setDistance(updated);
  };

  // Google Maps
  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${selectedSite.lat},${selectedSite.lng}`;
    window.location.href = url;
  };

  // Yandex Maps
  const openYandexMaps = () => {
    const mobileUrl = `yandexmaps://maps.yandex.ru/?rtext=${userLocation.lat},${userLocation.lng}~${selectedSite.lat},${selectedSite.lng}&rtt=auto`;
    const webUrl = `https://yandex.com/maps/?rtext=${userLocation.lat},${userLocation.lng}~${selectedSite.lat},${selectedSite.lng}&rtt=auto`;

    window.location.href = mobileUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 500);
  };

  // Yandex Navigator
  const openYandexNavigator = () => {
    const navUrl = `yandexnavi://build_route_on_map?lat_from=${userLocation.lat}&lon_from=${userLocation.lng}&lat_to=${selectedSite.lat}&lon_to=${selectedSite.lng}`;
    const fallback = `https://yandex.com/maps/?rtext=${userLocation.lat},${userLocation.lng}~${selectedSite.lat},${selectedSite.lng}&rtt=auto`;

    window.location.href = navUrl;
    setTimeout(() => {
      window.location.href = fallback;
    }, 500);
  };

  return (
    <div className="p-4 mb-10">
      <h1 className="text-xl font-semibold mb-3">
        Amaliyot – GPS bilan kirish/chiqish
      </h1>

      <MapView
        sites={sites}
        userLocation={userLocation}
        onSelectSite={(site) => {
          setSelectedSite(site);
          setOpenDialog(true);
        }}
      />

      {/* 🟦 SHADCN UI DIALOG */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedSite?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {/* MASOFA */}
            <div className="p-3 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-600">Masofa:</p>
              <p className="font-bold text-lg">
                {distance ? distance + " metr" : "Aniqlanmoqda..."}
              </p>

              <Button
                className="mt-2 w-full"
                variant="secondary"
                onClick={refreshDistance}
              >
                🔄 Yangilash (Refresh)
              </Button>
            </div>

            {/* ROUTE BUTTONS */}
            <Button className="w-full bg-blue-600" onClick={openGoogleMaps}>
              Google Maps orqali borish
            </Button>

            <Button className="w-full bg-yellow-500" onClick={openYandexMaps}>
              Yandex Maps orqali borish
            </Button>

            <Button
              className="w-full bg-green-600"
              onClick={openYandexNavigator}
            >
              Yandex Navigator orqali borish
            </Button>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => setOpenDialog(false)}
            >
              Bekor qilish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
