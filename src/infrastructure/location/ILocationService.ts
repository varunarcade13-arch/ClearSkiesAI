import { GeoLocation } from "@/domain/family/types";

export interface ILocationService {
  searchLocations(query: string): Promise<GeoLocation[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<GeoLocation>;
}
