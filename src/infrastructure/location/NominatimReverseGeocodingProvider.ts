import { GeoLocation } from "@/domain/family/types";
import { ILocationService } from "./ILocationService";

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  suburb?: string;
  county?: string;
  state?: string;
  country?: string;
  neighbourhood?: string;
  neighbourhood_name?: string;
  quarter?: string;
  city_district?: string;
};

type NominatimReverseResult = {
  address?: NominatimAddress;
  name?: string;
  display_name?: string;
};

export class NominatimReverseGeocodingProvider {
  constructor(private fetchFn: typeof fetch = fetch) {}

  async reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation> {
    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error("Invalid coordinates");
    }

    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "10");
    url.searchParams.set("lat", latitude.toString());
    url.searchParams.set("lon", longitude.toString());

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await this.fetchFn(url.toString(), {
        signal: controller.signal,
        headers: {
          "Accept-Language": "en",
          "User-Agent": "ClearSkiesAI/1.0 (location name lookup)",
        },
        cache: "force-cache",
      });

      if (!response.ok) throw new Error("Location name service is unavailable");

      const result = (await response.json()) as NominatimReverseResult;
      const address = result.address ?? {};
      const locality =
        address.neighbourhood ||
        address.neighbourhood_name ||
        address.quarter ||
        address.suburb ||
        address.city_district;
      const name =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.suburb ||
        address.county ||
        result.name ||
        locality;

      if (!name) throw new Error("A nearby city or locality name was not found");

      return {
        name,
        locality: locality && locality !== name ? locality : undefined,
        state: address.state,
        country: address.country || "Unknown region",
        latitude,
        longitude,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
