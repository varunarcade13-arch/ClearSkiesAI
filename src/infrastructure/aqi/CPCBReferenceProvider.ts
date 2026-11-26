import { AirQualityData, AQIStandard, MonitoringStation } from "@/domain/aqi/types";
import { getAQICategory, getHealthAdvisory } from "@/domain/aqi/calculator";

export interface CityPreset {
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  stationName: string;
  typicalWinterAqi: number;
  typicalWinterPm25: number;
  typicalWinterPm10: number;
}

export const CPCB_PRESET_CITIES: CityPreset[] = [
  {
    name: "Delhi",
    state: "Delhi",
    country: "India",
    latitude: 28.6139,
    longitude: 77.209,
    stationName: "Mandir Marg, DPCC - Delhi",
    typicalWinterAqi: 368,
    typicalWinterPm25: 195.4,
    typicalWinterPm10: 312.0,
  },
  {
    name: "Mohali",
    state: "Punjab",
    country: "India",
    latitude: 30.6799,
    longitude: 76.7221,
    stationName: "Sector 53, PPCB - Mohali",
    typicalWinterAqi: 178,
    typicalWinterPm25: 82.0,
    typicalWinterPm10: 135.0,
  },
  {
    name: "Chandigarh",
    state: "Chandigarh",
    country: "India",
    latitude: 30.7363,
    longitude: 76.7884,
    stationName: "Sector 22, CPCC - Chandigarh",
    typicalWinterAqi: 185,
    typicalWinterPm25: 85.0,
    typicalWinterPm10: 140.0,
  },
  {
    name: "Noida",
    state: "Uttar Pradesh",
    country: "India",
    latitude: 28.5355,
    longitude: 77.391,
    stationName: "Sector 62, UPPCB - Noida",
    typicalWinterAqi: 382,
    typicalWinterPm25: 215.0,
    typicalWinterPm10: 340.5,
  },
  {
    name: "Gurgaon",
    state: "Haryana",
    country: "India",
    latitude: 28.4595,
    longitude: 77.0266,
    stationName: "Vikas Sadan, HSPCB - Gurgaon",
    typicalWinterAqi: 345,
    typicalWinterPm25: 180.2,
    typicalWinterPm10: 290.0,
  },
  {
    name: "Mumbai",
    state: "Maharashtra",
    country: "India",
    latitude: 19.076,
    longitude: 72.8777,
    stationName: "Bandra Kurla Complex, MPCB - Mumbai",
    typicalWinterAqi: 172,
    typicalWinterPm25: 68.5,
    typicalWinterPm10: 125.0,
  },
  {
    name: "Bengaluru",
    state: "Karnataka",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
    stationName: "Silk Board, KSPCB - Bengaluru",
    typicalWinterAqi: 88,
    typicalWinterPm25: 35.0,
    typicalWinterPm10: 72.0,
  },
  {
    name: "Kolkata",
    state: "West Bengal",
    country: "India",
    latitude: 22.5726,
    longitude: 88.3639,
    stationName: "Victoria Memorial, WBPCB - Kolkata",
    typicalWinterAqi: 240,
    typicalWinterPm25: 112.0,
    typicalWinterPm10: 195.0,
  },
];

export class CPCBReferenceProvider {
  static getPresetCities(): CityPreset[] {
    return CPCB_PRESET_CITIES;
  }

  static findPresetByCoords(lat: number, lng: number): CityPreset | undefined {
    return CPCB_PRESET_CITIES.find(
      (c) => Math.abs(c.latitude - lat) < 0.25 && Math.abs(c.longitude - lng) < 0.25
    );
  }

  static getSampleData(
    cityName: string = "Delhi",
    standard: AQIStandard = "INDIAN_NAQI"
  ): AirQualityData {
    const preset =
      CPCB_PRESET_CITIES.find(
        (c) => c.name.toLowerCase() === cityName.toLowerCase()
      ) || CPCB_PRESET_CITIES[0];

    const aqi = preset.typicalWinterAqi;
    const category = getAQICategory(aqi, standard);
    const advisory = getHealthAdvisory(category);

    const station: MonitoringStation = {
      id: `cpcb-preset-${preset.name.toLowerCase()}`,
      name: preset.stationName,
      city: preset.name,
      state: preset.state,
      country: preset.country,
      latitude: preset.latitude,
      longitude: preset.longitude,
    };

    return {
      aqi,
      category,
      standard,
      dominantPollutant: "PM2.5",
      pollutants: {
        pm25: {
          code: "pm25",
          name: "Fine Particulate Matter (PM2.5)",
          value: preset.typicalWinterPm25,
          unit: "µg/m³",
          subIndex: aqi,
          standardLimit: 60,
        },
        pm10: {
          code: "pm10",
          name: "Coarse Particulate Matter (PM10)",
          value: preset.typicalWinterPm10,
          unit: "µg/m³",
          subIndex: Math.round(aqi * 0.85),
          standardLimit: 100,
        },
        no2: {
          code: "no2",
          name: "Nitrogen Dioxide (NO2)",
          value: 46.2,
          unit: "µg/m³",
          subIndex: 58,
          standardLimit: 80,
        },
        so2: {
          code: "so2",
          name: "Sulphur Dioxide (SO2)",
          value: 14.5,
          unit: "µg/m³",
          subIndex: 18,
          standardLimit: 80,
        },
        co: {
          code: "co",
          name: "Carbon Monoxide (CO)",
          value: 1.85,
          unit: "mg/m³",
          subIndex: 92,
          standardLimit: 2.0,
        },
        o3: {
          code: "o3",
          name: "Ozone (O3)",
          value: 28.0,
          unit: "µg/m³",
          subIndex: 28,
          standardLimit: 100,
        },
      },
      station,
      source: `DEMO SAMPLE: ${preset.stationName} (Simulated Winter Baseline)`,
      sourceType: "DEMO_SAMPLE",
      attribution: "CPCB / State Pollution Control Board Reference Baseline (Simulated Demo)",
      timestamp: new Date().toISOString(),
      isStale: false,
      healthAdvisory: advisory,
    };
  }
}
